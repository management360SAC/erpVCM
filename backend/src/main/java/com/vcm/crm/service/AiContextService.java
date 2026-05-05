package com.vcm.crm.service;

import com.vcm.crm.entity.Client;
import com.vcm.crm.entity.ContractedService;
import com.vcm.crm.entity.Deal;
import com.vcm.crm.entity.EmailCampaign;
import com.vcm.crm.entity.Invoice;
import com.vcm.crm.entity.Lead;
import com.vcm.crm.entity.MarketingLead;
import com.vcm.crm.entity.Payment;
import com.vcm.crm.domain.quote.Quote;
import com.vcm.crm.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Construye el bloque de contexto CRM que se inyecta en el prompt de Gemini.
 */
@Service
public class AiContextService {

    private final ClientRepository clientRepo;
    private final QuoteRepository quoteRepo;
    private final ContractedServiceRepository csRepo;
    private final InvoiceRepository invoiceRepo;
    private final PaymentRepository paymentRepo;
    private final DealRepository dealRepo;
    private final MarketingLeadRepository marketingLeadRepo;
    private final LeadRepository leadRepo;
    private final EmailCampaignRepository campaignRepo;

    private static final Long ORG_ID = 1L;

    public AiContextService(
            ClientRepository clientRepo,
            QuoteRepository quoteRepo,
            ContractedServiceRepository csRepo,
            InvoiceRepository invoiceRepo,
            PaymentRepository paymentRepo,
            DealRepository dealRepo,
            MarketingLeadRepository marketingLeadRepo,
            LeadRepository leadRepo,
            EmailCampaignRepository campaignRepo) {
        this.clientRepo = clientRepo;
        this.quoteRepo = quoteRepo;
        this.csRepo = csRepo;
        this.invoiceRepo = invoiceRepo;
        this.paymentRepo = paymentRepo;
        this.dealRepo = dealRepo;
        this.marketingLeadRepo = marketingLeadRepo;
        this.leadRepo = leadRepo;
        this.campaignRepo = campaignRepo;
    }

    public String buildContext(String contextType) {
        try {
            switch (contextType) {
                case "clientes":     return buildClientesContext();
                case "leads":        return buildLeadsContext();
                case "cotizaciones": return buildCotizacionesContext();
                case "pagos":        return buildPagosContext();
                case "servicios":    return buildServiciosContext();
                case "campanas":     return buildCampanasContext();
                case "reportes":     return buildReportesContext();
                default:             return buildGeneralContext();
            }
        } catch (Exception e) {
            return "No se pudieron cargar datos del CRM: " + e.getMessage();
        }
    }

    // ─── GENERAL ─────────────────────────────────────────────────────────────

    private String buildGeneralContext() {
        StringBuilder sb = new StringBuilder();
        sb.append("RESUMEN GENERAL DEL CRM:\n");

        long totalClientes = clientRepo.count();
        sb.append("- Total clientes registrados: ").append(totalClientes).append("\n");

        List<ContractedService> allCs = csRepo.findByOrgId(ORG_ID, PageRequest.of(0, 1000)).getContent();
        long csActivos   = allCs.stream().filter(cs -> ContractedService.ServiceStatus.EN_EJECUCION.equals(cs.getStatus())).count();
        long csPendiente = allCs.stream().filter(cs -> ContractedService.ServiceStatus.PENDIENTE.equals(cs.getStatus())).count();
        sb.append("- Servicios en ejecución: ").append(csActivos).append("\n");
        sb.append("- Servicios pendientes de inicio: ").append(csPendiente).append("\n");

        long dealsAbiertos = dealRepo.findAll().stream().filter(d -> "OPEN".equals(d.getStatus())).count();
        sb.append("- Deals abiertos en pipeline: ").append(dealsAbiertos).append("\n");

        BigDecimal pendienteCobro = invoiceRepo.findAll().stream()
                .filter(i -> "EMITIDA".equals(i.getStatus()) || "PAGADA_PARCIAL".equals(i.getStatus()))
                .map(Invoice::getTotal).filter(t -> t != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        sb.append("- Total pendiente de cobro: S/ ").append(pendienteCobro).append("\n");

        return sb.toString();
    }

    // ─── CLIENTES ────────────────────────────────────────────────────────────

    private String buildClientesContext() {
        StringBuilder sb = new StringBuilder();
        List<Client> clientes = clientRepo.findAll();
        sb.append("DATOS DE CLIENTES:\nTotal: ").append(clientes.size()).append("\n\n");

        List<ContractedService> allCs = csRepo.findByOrgId(ORG_ID, PageRequest.of(0, 1000)).getContent();

        clientes.stream().limit(20).forEach(c -> {
            sb.append("• ").append(c.getLegalName());
            if (c.getTaxId() != null) sb.append(" (RUC: ").append(c.getTaxId()).append(")");
            if (c.getEmail() != null) sb.append(" | email: ").append(c.getEmail());
            long activos = allCs.stream()
                    .filter(cs -> c.getId() != null
                            && cs.getClientId() != null
                            && c.getId().longValue() == cs.getClientId()
                            && ContractedService.ServiceStatus.EN_EJECUCION.equals(cs.getStatus()))
                    .count();
            sb.append(" | servicios activos: ").append(activos).append("\n");
        });

        if (clientes.size() > 20) sb.append("... y ").append(clientes.size() - 20).append(" más.\n");
        return sb.toString();
    }

    // ─── LEADS ───────────────────────────────────────────────────────────────

    private String buildLeadsContext() {
        StringBuilder sb = new StringBuilder();

        List<MarketingLead> mLeads = marketingLeadRepo.findAll();
        sb.append("MARKETING LEADS (total ").append(mLeads.size()).append("):\n");
        mLeads.stream().limit(15).forEach(l ->
            sb.append("• ").append(str(l.getName()))
                    .append(" | empresa: ").append(str(l.getCompanyName()))
                    .append(" | canal: ").append(str(l.getSourceChannel()))
                    .append(" | email: ").append(str(l.getEmail())).append("\n")
        );

        List<Lead> leads = leadRepo.findAll();
        sb.append("\nLEADS DEL PIPELINE (total ").append(leads.size()).append("):\n");
        leads.stream().limit(10).forEach(l ->
            sb.append("• lead #").append(l.getId())
                    .append(" | estado: ").append(str(l.getStatus()))
                    .append(" | prioridad: ").append(str(l.getPriority()))
                    .append(" | responsable: ").append(str(l.getOwnerName())).append("\n")
        );

        List<Deal> deals = dealRepo.findAll();
        long abiertos = deals.stream().filter(d -> "OPEN".equals(d.getStatus())).count();
        long ganados  = deals.stream().filter(d -> "WON".equals(d.getStatus())).count();
        long perdidos = deals.stream().filter(d -> "LOST".equals(d.getStatus())).count();
        sb.append("\nPIPELINE: ").append(abiertos).append(" abiertos | ")
                .append(ganados).append(" ganados | ").append(perdidos).append(" perdidos\n");

        return sb.toString();
    }

    // ─── COTIZACIONES ────────────────────────────────────────────────────────

    private String buildCotizacionesContext() {
        StringBuilder sb = new StringBuilder();
        List<Quote> quotes = quoteRepo.search(null, null, null, null, PageRequest.of(0, 20)).getContent();
        long total = quoteRepo.count();
        sb.append("COTIZACIONES (total ").append(total).append(", mostrando últimas 20):\n\n");

        quotes.forEach(q ->
            sb.append("• ").append(q.getNumber())
                    .append(" | estado: ").append(q.getStatus())
                    .append(" | total: S/ ").append(q.getTotal())
                    .append(" | email: ").append(str(q.getEmailTo()))
                    .append(q.getValidUntil() != null ? " | vigencia: " + q.getValidUntil() : "")
                    .append("\n")
        );

        long enviadas   = quotes.stream().filter(q -> "ENVIADA".equals(q.getStatus().name())).count();
        long aprobadas  = quotes.stream().filter(q -> "APROBADA".equals(q.getStatus().name())).count();
        long rechazadas = quotes.stream().filter(q -> "RECHAZADA".equals(q.getStatus().name())).count();
        sb.append("\nRESUMEN muestra: ").append(enviadas).append(" enviadas | ")
                .append(aprobadas).append(" aprobadas | ").append(rechazadas).append(" rechazadas\n");

        return sb.toString();
    }

    // ─── PAGOS ───────────────────────────────────────────────────────────────

    private String buildPagosContext() {
        StringBuilder sb = new StringBuilder();

        List<Invoice> pendientes = invoiceRepo.findAll().stream()
                .filter(i -> "EMITIDA".equals(i.getStatus()) || "PAGADA_PARCIAL".equals(i.getStatus()))
                .limit(15)
                .collect(Collectors.toList());

        sb.append("FACTURAS PENDIENTES (").append(pendientes.size()).append("):\n");
        pendientes.forEach(inv -> {
            BigDecimal pagado = paymentRepo.sumValidByInvoiceId(inv.getId());
            if (pagado == null) pagado = BigDecimal.ZERO;
            BigDecimal saldo = inv.getTotal() != null ? inv.getTotal().subtract(pagado) : BigDecimal.ZERO;
            sb.append("• ").append(inv.getNumber())
                    .append(" | total: S/ ").append(inv.getTotal())
                    .append(" | saldo: S/ ").append(saldo)
                    .append(" | estado: ").append(inv.getStatus()).append("\n");
        });

        BigDecimal totalPendiente = pendientes.stream().map(i -> {
            BigDecimal p = paymentRepo.sumValidByInvoiceId(i.getId());
            if (p == null) p = BigDecimal.ZERO;
            return i.getTotal() != null ? i.getTotal().subtract(p) : BigDecimal.ZERO;
        }).reduce(BigDecimal.ZERO, BigDecimal::add);
        sb.append("TOTAL PENDIENTE: S/ ").append(totalPendiente).append("\n\n");

        LocalDateTime inicioMes = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        List<Payment> pagosEsteMes = paymentRepo.findAll().stream()
                .filter(p -> "VALIDO".equals(p.getStatus()) && p.getPaidAt() != null && p.getPaidAt().isAfter(inicioMes))
                .collect(Collectors.toList());
        BigDecimal cobradoMes = pagosEsteMes.stream()
                .map(Payment::getAmount).filter(a -> a != null).reduce(BigDecimal.ZERO, BigDecimal::add);
        sb.append("COBRADO ESTE MES: S/ ").append(cobradoMes)
                .append(" (").append(pagosEsteMes.size()).append(" pagos)\n\n");

        sb.append("ÚLTIMOS PAGOS:\n");
        paymentRepo.findAll().stream()
                .filter(p -> "VALIDO".equals(p.getStatus()))
                .sorted((a, b) -> {
                    if (b.getPaidAt() == null) return -1;
                    if (a.getPaidAt() == null) return 1;
                    return b.getPaidAt().compareTo(a.getPaidAt());
                })
                .limit(8)
                .forEach(p -> sb.append("• ").append(p.getNumber())
                        .append(" | S/ ").append(p.getAmount())
                        .append(" | ").append(str(p.getMethod()))
                        .append(" | ").append(p.getPaidAt() != null ? p.getPaidAt().toLocalDate() : "-")
                        .append("\n"));

        return sb.toString();
    }

    // ─── SERVICIOS CONTRATADOS ───────────────────────────────────────────────

    private String buildServiciosContext() {
        StringBuilder sb = new StringBuilder();
        List<ContractedService> servicios = csRepo.findByOrgId(ORG_ID, PageRequest.of(0, 30)).getContent();
        sb.append("SERVICIOS CONTRATADOS (").append(csRepo.count()).append(" total):\n\n");

        servicios.forEach(cs ->
            sb.append("• ").append(cs.getNumber())
                    .append(" | ").append(cs.getStatus())
                    .append(" | facturación: ").append(cs.getBillingStatus())
                    .append(" | cobro: ").append(cs.getCollectionStatus())
                    .append(" | total: S/ ").append(cs.getTotal())
                    .append(cs.getStartDate() != null ? " | inicio: " + cs.getStartDate() : "")
                    .append(cs.getEndDate()   != null ? " | fin: "   + cs.getEndDate()   : "")
                    .append("\n")
        );

        long enEjecucion = servicios.stream().filter(cs -> ContractedService.ServiceStatus.EN_EJECUCION.equals(cs.getStatus())).count();
        long pendiente   = servicios.stream().filter(cs -> ContractedService.ServiceStatus.PENDIENTE.equals(cs.getStatus())).count();
        long completado  = servicios.stream().filter(cs -> ContractedService.ServiceStatus.COMPLETADO.equals(cs.getStatus())).count();
        sb.append("\nRESUMEN: ").append(enEjecucion).append(" en ejecución | ")
                .append(pendiente).append(" pendientes | ").append(completado).append(" completados\n");

        return sb.toString();
    }

    // ─── CAMPAÑAS ────────────────────────────────────────────────────────────

    private String buildCampanasContext() {
        StringBuilder sb = new StringBuilder();
        List<EmailCampaign> campanas = campaignRepo.findByOrgIdOrderByCreatedAtDesc(1);
        sb.append("CAMPAÑAS DE EMAIL (").append(campanas.size()).append(" total):\n\n");

        campanas.stream().limit(15).forEach(c ->
            sb.append("• ").append(c.getName())
                    .append(" | asunto: ").append(str(c.getSubject()))
                    .append(" | estado: ").append(c.getStatus())
                    .append(" | destinatarios: ").append(c.getTotalRecipients())
                    .append(c.getSentAt() != null ? " | enviada: " + c.getSentAt().toLocalDate() : "")
                    .append("\n")
        );

        long enviadas   = campanas.stream().filter(c -> "SENT".equals(c.getStatus().name())).count();
        long borradores = campanas.stream().filter(c -> "DRAFT".equals(c.getStatus().name())).count();
        sb.append("\nRESUMEN: ").append(enviadas).append(" enviadas | ").append(borradores).append(" borradores\n");

        return sb.toString();
    }

    // ─── REPORTES ────────────────────────────────────────────────────────────

    private String buildReportesContext() {
        StringBuilder sb = new StringBuilder();
        int year  = LocalDate.now().getYear();
        int month = LocalDate.now().getMonthValue();
        sb.append("KPIs ").append(year).append("-").append(String.format("%02d", month)).append(":\n\n");

        sb.append("- Clientes totales: ").append(clientRepo.count()).append("\n");

        List<ContractedService> allCs = csRepo.findByOrgId(ORG_ID, PageRequest.of(0, 1000)).getContent();
        long csActivos = allCs.stream().filter(cs -> ContractedService.ServiceStatus.EN_EJECUCION.equals(cs.getStatus())).count();
        sb.append("- Servicios en ejecución: ").append(csActivos).append("\n");

        LocalDateTime inicioMes = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        BigDecimal mrrReal = paymentRepo.findAll().stream()
                .filter(p -> "VALIDO".equals(p.getStatus()) && p.getPaidAt() != null && p.getPaidAt().isAfter(inicioMes))
                .map(Payment::getAmount).filter(a -> a != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        sb.append("- MRR cobrado este mes: S/ ").append(mrrReal).append("\n");

        BigDecimal pendienteCobro = invoiceRepo.findAll().stream()
                .filter(i -> "EMITIDA".equals(i.getStatus()) || "PAGADA_PARCIAL".equals(i.getStatus()))
                .map(Invoice::getTotal).filter(t -> t != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        sb.append("- Pendiente de cobro: S/ ").append(pendienteCobro).append("\n");

        List<Deal> deals = dealRepo.findAll();
        BigDecimal pipelineValue = deals.stream()
                .filter(d -> "OPEN".equals(d.getStatus()))
                .map(Deal::getAmount).filter(a -> a != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        sb.append("- Valor pipeline abierto: S/ ").append(pipelineValue).append("\n");

        long ganados  = deals.stream().filter(d -> "WON".equals(d.getStatus())).count();
        long perdidos = deals.stream().filter(d -> "LOST".equals(d.getStatus())).count();
        long cerrados = ganados + perdidos;
        double tasa   = cerrados > 0 ? (ganados * 100.0 / cerrados) : 0;
        sb.append(String.format("- Tasa de cierre: %.1f%% (%d/%d)\n", tasa, ganados, cerrados));

        long leadsNuevos = marketingLeadRepo.findAll().stream()
                .filter(l -> l.getCreatedAt() != null && l.getCreatedAt().isAfter(inicioMes)).count();
        sb.append("- Leads nuevos este mes: ").append(leadsNuevos).append("\n");

        return sb.toString();
    }

    private String str(Object o) {
        return o != null ? o.toString() : "-";
    }
}
