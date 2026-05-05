package com.vcm.crm.service;

import com.vcm.crm.domain.quote.Quote;
import com.vcm.crm.domain.quote.QuoteItem;
import com.vcm.crm.service.QuoteNumberService;
import com.vcm.crm.domain.quote.QuoteStatus;
import com.vcm.crm.dto.ContractedServiceItemDTO;
import com.vcm.crm.dto.CreateContractedServiceRequest;
import com.vcm.crm.dto.CreateQuoteRequest;
import com.vcm.crm.dto.QuoteResponse;
import com.vcm.crm.dto.SendQuoteRequest;
import com.vcm.crm.dto.UpdateQuoteStatusRequest;
import com.vcm.crm.entity.Client;
import com.vcm.crm.entity.ClientService;
import com.vcm.crm.entity.ServiceCatalog;
import com.vcm.crm.entity.ContractedService.ServiceStatus;
import com.vcm.crm.entity.CrmNotification;
import com.vcm.crm.entity.Deal;
import com.vcm.crm.entity.quote.QuoteStatusLog;
import com.vcm.crm.repository.ClientRepository;
import com.vcm.crm.repository.ClientServiceRepository;
import com.vcm.crm.service.ContractedServiceService;
import com.vcm.crm.repository.CrmNotificationRepository;
import com.vcm.crm.repository.DealRepository;
import com.vcm.crm.repository.QuoteItemRepository;
import com.vcm.crm.repository.QuoteRepository;
import com.vcm.crm.repository.QuoteStatusLogRepository;
import com.vcm.crm.repository.ServiceCatalogRepository;
import com.vcm.crm.dto.ContractedServiceDTO;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.nio.file.Files;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class QuoteService {

  private final QuoteRepository quoteRepo;
  private final QuoteItemRepository itemRepo;
  private final QuoteStatusLogRepository statusLogRepo;
  private final QuoteNumberService numberService;
  private final MailService mailService;
  private final ContractedServiceService contractedServiceService;

  private final ClientServiceRepository clientServiceRepo;
  private final ClientRepository clientRepo;
  private final ServiceCatalogRepository serviceCatalogRepo;

  // 👉 nuevos repositorios para embudo / notificaciones
  private final DealRepository dealRepository;
  private final CrmNotificationRepository notifRepository;
  private final InvoiceService invoiceService;

  @Value("${app.quotes.storage:/data/quotes}")
  private String storageRoot;

  public QuoteService(
      QuoteRepository quoteRepo,
      QuoteItemRepository itemRepo,
      QuoteStatusLogRepository statusLogRepo,
      QuoteNumberService numberService,
      MailService mailService,
      ContractedServiceService contractedServiceService,
      ClientServiceRepository clientServiceRepo,
      ClientRepository clientRepo,
      ServiceCatalogRepository serviceCatalogRepo,
      DealRepository dealRepository,
      CrmNotificationRepository notifRepository,
      InvoiceService invoiceService) {

    this.quoteRepo = quoteRepo;
    this.itemRepo = itemRepo;
    this.statusLogRepo = statusLogRepo;
    this.numberService = numberService;
    this.mailService = mailService;
    this.contractedServiceService = contractedServiceService;
    this.clientServiceRepo = clientServiceRepo;
    this.clientRepo = clientRepo;
    this.serviceCatalogRepo = serviceCatalogRepo;
    this.dealRepository = dealRepository;
    this.notifRepository = notifRepository;
    this.invoiceService = invoiceService;
  }

  /* =================== CREAR BORRADOR =================== */
  @Transactional
  public QuoteResponse createDraft(CreateQuoteRequest req) {
    String number = numberService.nextNumber();
    Integer orgId = req.orgId != null ? req.orgId : (req.meta != null ? req.meta.orgId : 1);
    String sector = req.sector != null ? req.sector : "PRIVADO";
    String emailTo = (req.emailTo != null && !req.emailTo.trim().isEmpty()) ? req.emailTo : req.sendTo;

    Quote q = new Quote();
    q.setOrgId(orgId);
    q.setNumber(number);
    q.setClientId(req.clientId);
    q.setSector(sector);
    q.setSubTotal(n(req.totals != null ? req.totals.subTotal : null));
    q.setIgv(n(req.totals != null ? req.totals.igv : null));
    q.setTotal(n(req.totals != null ? req.totals.total : null));
    q.setStatus(QuoteStatus.BORRADOR);
    q.setEmailTo(emailTo);

    if (req.validUntil != null && !req.validUntil.trim().isEmpty()) {
      q.setValidUntil(LocalDate.parse(req.validUntil));
    }
    q.setNotes(req.notes);

    q = quoteRepo.save(q);

    if (req.items != null) {
      for (CreateQuoteRequest.Item it : req.items) {
        QuoteItem qi = new QuoteItem();
        qi.setQuote(q);
        qi.setServiceId(it.serviceId != null ? it.serviceId.longValue() : null);
        qi.setName(it.name);
        qi.setCost(n(it.cost));
        itemRepo.save(qi);
      }
    }
    return toDto(q);
  }

  /* =================== CREAR Y ENVIAR =================== */
  @Transactional
  public QuoteResponse createAndSend(CreateQuoteRequest req, byte[] pdfBytes, String originalFilename) throws Exception {
    QuoteResponse draft = createDraft(req);
    Quote q = quoteRepo.findById(draft.id).orElseThrow(NoSuchElementException::new);

    String year = draft.number.substring(4, 8);
    File folder = new File(storageRoot, year);
    folder.mkdirs();
    String fname = draft.number + ".pdf";
    File out = new File(folder, fname);
    Files.write(out.toPath(), pdfBytes);

    String subj = "Cotización " + draft.number + " - VCM Group";
    String body = ""
        + "<p>Estimado cliente,</p>"
        + "<p>Adjuntamos la cotización <b>" + draft.number + "</b> con el detalle de los servicios solicitados.</p>"
        + "<p>Si tiene alguna consulta o desea proceder con la aprobación, puede responder a este correo.</p>"
        + "<p>Gracias por confiar en <b>VCM Group</b>.<br/>Atentamente,<br/>Equipo Comercial</p>";

    mailService.sendQuote(
        q.getEmailTo(),
        subj,
        body,
        pdfBytes,
        (originalFilename != null && !originalFilename.isEmpty()) ? originalFilename : fname
    );

    QuoteStatus oldStatus = q.getStatus();
    q.setStatus(QuoteStatus.ENVIADA);
    q.setFileUrl(out.getAbsolutePath());
    q.setFileSize((long) pdfBytes.length);
    quoteRepo.save(q);

    logStatusChange(q.getId(), oldStatus, QuoteStatus.ENVIADA, null, "Cotización enviada por correo");

    // Crear o actualizar Deal en el embudo de ventas → etapa PROPUESTA
    if (q.getClientId() != null) {
      Integer orgId = q.getOrgId();
      Integer clientIdInt = q.getClientId().intValue();
      java.util.Optional<Deal> existingDeal =
          dealRepository.findFirstByOrgIdAndClient_IdAndStatus(orgId, clientIdInt, "OPEN");

      if (existingDeal.isPresent()) {
        Deal deal = existingDeal.get();
        deal.setStage("PROPUESTA");
        if (q.getTotal() != null) deal.setAmount(q.getTotal());
        dealRepository.save(deal);
      } else {
        Client client = clientRepo.findById(clientIdInt).orElse(null);
        String clientName = client != null ? client.getLegalName() : "Cliente";
        Deal deal = new Deal();
        deal.setOrgId(orgId);
        deal.setClient(client);
        deal.setTitle("Cotización " + q.getNumber() + " - " + clientName);
        deal.setAmount(q.getTotal());
        deal.setStage("PROPUESTA");
        deal.setStatus("OPEN");
        dealRepository.save(deal);
      }
    }

    return toDto(q);
  }

  /* ========== NUEVO: ENVIAR COTIZACIÓN + ACTUALIZAR DEAL DEL EMBUDO ========== */
  @Transactional
  public QuoteResponse sendQuoteAndUpdateDeal(SendQuoteRequest dto, byte[] pdfBytes, String originalFilename) throws Exception {
    // 1) Mapear SendQuoteRequest -> CreateQuoteRequest para reutilizar createAndSend
    CreateQuoteRequest req = new CreateQuoteRequest();
    req.clientId = dto.getClientId();
    req.orgId = dto.getMeta() != null ? dto.getMeta().getOrgId() : null;
    req.sector = dto.getMeta() != null ? dto.getMeta().getSector() : null;
    req.sendTo = dto.getSendTo();
    req.emailTo = dto.getSendTo(); // por si usas emailTo en el front
    req.validUntil = dto.getValidUntil();

    if (dto.getTotals() != null) {
      CreateQuoteRequest.Totals t = new CreateQuoteRequest.Totals();
      t.subTotal = dto.getTotals().getSubTotal();
      t.igv = dto.getTotals().getIgv();
      t.total = dto.getTotals().getTotal();
      req.totals = t;
    }

    if (dto.getItems() != null) {
      req.items = dto.getItems().stream().map(it -> {
        CreateQuoteRequest.Item ci = new CreateQuoteRequest.Item();
        ci.serviceId = it.getServiceId() != null ? it.getServiceId().intValue() : null;
        ci.name = it.getName();
        ci.cost = it.getCost();
        return ci;
      }).collect(Collectors.toList());
    }

    // 2) Crear y enviar la cotización normal
    QuoteResponse resp = createAndSend(req, pdfBytes, originalFilename);

    // 3) Si viene relatedDealId -> mover etapa y cerrar notificación
    Long relatedDealId = (dto.getMeta() != null ? dto.getMeta().getRelatedDealId() : null);

    if (relatedDealId != null) {
      dealRepository.findById(relatedDealId).ifPresent(deal -> {
        // Pasar a etapa "PROPUESTA"
        deal.setStage("PROPUESTA");
        dealRepository.save(deal);

        // Marcar notificaciones de "QUOTE_REQUEST" como completadas
        List<CrmNotification> pending =
            notifRepository.findByDealIdAndTypeAndStatus(relatedDealId, "QUOTE_REQUEST", "PENDING");
        for (CrmNotification n : pending) {
          n.markDone();
          notifRepository.save(n);
        }
      });
    }

    return resp;
  }

  /* ========== APROBAR Y CREAR CONTRATO + client_service INACTIVOS ========== */
  @Transactional
  public QuoteResponse approveAndContract(Long quoteId, Long orgId, Long userId, String reason) {
    Quote q = quoteRepo.findById(quoteId)
        .orElseThrow(() -> new NoSuchElementException("Cotización no encontrada"));

    if (q.getStatus() != QuoteStatus.ENVIADA)
      throw new IllegalStateException("Solo se pueden aprobar cotizaciones en estado ENVIADA.");

    QuoteStatus oldStatus = q.getStatus();
    q.setStatus(QuoteStatus.APROBADA);
    quoteRepo.save(q);
    logStatusChange(quoteId, oldStatus, QuoteStatus.APROBADA, userId, reason);

    // 1) Crear servicio contratado
    List<QuoteItem> qItems = itemRepo.findByQuoteId(q.getId());
    CreateContractedServiceRequest req = new CreateContractedServiceRequest();
    req.setQuoteId(q.getId());
    req.setClientId(q.getClientId());
    req.setStatus(ServiceStatus.PENDIENTE);
    req.setSubTotal(q.getSubTotal());
    req.setIgv(q.getIgv());
    req.setTotal(q.getTotal());
    req.setContractDate(LocalDate.now());
    req.setNotes(reason != null ? reason : "Aprobada desde el sistema");

    List<ContractedServiceItemDTO> items = qItems.stream().map(it -> {
      ContractedServiceItemDTO d = new ContractedServiceItemDTO();
      d.setServiceId(it.getServiceId());
      d.setName(it.getName());
      d.setCost(it.getCost());
      d.setQuantity(1);
      d.setLineTotal(it.getCost());
      return d;
    }).collect(Collectors.toList());
    req.setItems(items);

    ContractedServiceDTO csDto = contractedServiceService.createContractedService(req, orgId, userId);

    // Auto-generar factura al aprobar cotización
    try {
      invoiceService.ensureOpenInvoiceForService(csDto.getId());
    } catch (Exception ex) {
      System.err.println("[QuoteService] Advertencia: no se pudo crear factura automática para CS " + csDto.getId() + ": " + ex.getMessage());
    }

    // 2) Crear registros client_service como INACTIVOS
    if (q.getClientId() != null) {
      Integer clientIdInt = q.getClientId().intValue();
      Client client = clientRepo.findById(clientIdInt)
          .orElseThrow(() -> new IllegalStateException("Cliente no encontrado para clientId=" + clientIdInt));

      LocalDate startDate = LocalDate.now();

      for (QuoteItem it : qItems) {
        if (it.getServiceId() == null) continue;

        Integer svcIdInt = it.getServiceId().intValue();
        ServiceCatalog svc = serviceCatalogRepo.findById(svcIdInt)
            .orElseThrow(() -> new IllegalStateException("Servicio no encontrado para serviceId=" + svcIdInt));

        if (!clientServiceRepo.existsByClient_IdAndService_Id(clientIdInt, svcIdInt)) {
          ClientService cs = new ClientService();
          cs.setClient(client);
          cs.setService(svc);
          cs.setStartDate(startDate);
          cs.setEndDate(null);
          cs.setPrice(it.getCost());
          cs.setActive(Boolean.FALSE); // INACTIVO
          cs.setNotes("Creado desde cotización " + q.getNumber());
          clientServiceRepo.save(cs);
        }
      }
    }

    // Mover Deal a CERRADO_GANADO
    if (q.getClientId() != null) {
      dealRepository.findFirstByOrgIdAndClient_IdAndStatus(q.getOrgId(), q.getClientId().intValue(), "OPEN")
          .ifPresent(deal -> {
            deal.setStage("CERRADO_GANADO");
            deal.setStatus("WON");
            dealRepository.save(deal);
          });
    }

    return toDto(q);
  }

  /* =================== RECHAZAR =================== */
  @Transactional
  public QuoteResponse rejectQuote(Long quoteId, String reason, Long userId) {
    Quote q = quoteRepo.findById(quoteId)
        .orElseThrow(() -> new NoSuchElementException("Cotización no encontrada"));
    if (q.getStatus() != QuoteStatus.ENVIADA)
      throw new IllegalStateException("Solo se pueden rechazar cotizaciones en estado ENVIADA.");
    QuoteStatus oldStatus = q.getStatus();
    q.setStatus(QuoteStatus.RECHAZADA);
    quoteRepo.save(q);
    logStatusChange(quoteId, oldStatus, QuoteStatus.RECHAZADA, userId, reason);

    // Mover Deal a CERRADO_PERDIDO
    if (q.getClientId() != null) {
      dealRepository.findFirstByOrgIdAndClient_IdAndStatus(q.getOrgId(), q.getClientId().intValue(), "OPEN")
          .ifPresent(deal -> {
            deal.setStage("CERRADO_PERDIDO");
            deal.setStatus("LOST");
            dealRepository.save(deal);
          });
    }

    return toDto(q);
  }

  /* =================== ACTUALIZAR ESTADO MANUAL =================== */
  @Transactional
  public QuoteResponse updateStatus(Long id, UpdateQuoteStatusRequest req, Long userId) {
    Quote q = quoteRepo.findById(id).orElseThrow(NoSuchElementException::new);
    QuoteStatus old = q.getStatus();
    QuoteStatus next = QuoteStatus.valueOf(req.status);
    q.setStatus(next);
    quoteRepo.save(q);
    logStatusChange(id, old, next, userId, req.reason);
    return toDto(q);
  }

  /* =================== UTILIDADES =================== */
  private void logStatusChange(Long quoteId, QuoteStatus oldStatus, QuoteStatus newStatus, Long userId, String comments) {
    QuoteStatusLog log = new QuoteStatusLog();
    log.setQuoteId(quoteId);
    log.setOldStatus(oldStatus != null ? oldStatus.name() : null);
    log.setNewStatus(newStatus.name());
    log.setChangedBy(userId);
    log.setChangedAt(LocalDateTime.now());
    log.setReason(comments);
    statusLogRepo.save(log);
  }

  private QuoteResponse toDto(Quote q) {
    QuoteResponse r = new QuoteResponse();
    r.id = q.getId();
    r.number = q.getNumber();
    r.clientId = q.getClientId();
    r.sector = q.getSector();
    r.subTotal = q.getSubTotal();
    r.igv = q.getIgv();
    r.total = q.getTotal();
    r.status = q.getStatus();
    r.emailTo = q.getEmailTo();
    r.fileUrl = q.getFileUrl();
    r.fileSize = q.getFileSize();
    r.validUntil = q.getValidUntil();
    r.createdAt = q.getCreatedAt();
    return r;
  }

  private java.math.BigDecimal n(java.math.BigDecimal v) {
    return v == null ? java.math.BigDecimal.ZERO : v;
  }
}