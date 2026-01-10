// src/main/java/com/vcm/crm/controller/QuoteController.java
package com.vcm.crm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vcm.crm.domain.quote.Quote;
import com.vcm.crm.domain.quote.QuoteItem;
import com.vcm.crm.domain.quote.QuoteStatus;
import com.vcm.crm.dto.CreateQuoteRequest;
import com.vcm.crm.dto.QuoteItemResponse;
import com.vcm.crm.dto.QuoteResponse;
import com.vcm.crm.repository.QuoteRepository;
import com.vcm.crm.service.QuoteService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/quotes")
public class QuoteController {

  private final QuoteRepository repo;
  private final QuoteService quoteService;
  private final ObjectMapper objectMapper;

  public QuoteController(QuoteRepository repo, QuoteService quoteService, ObjectMapper objectMapper) {
    this.repo = repo;
    this.quoteService = quoteService;
    this.objectMapper = objectMapper;
    System.out.println("✅ QuoteController inicializado");
  }

  // ====== CREAR Y ENVIAR (multipart) ======
  @PostMapping(value = "/email", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<?> createAndSendQuote(
      @RequestPart("data") String dataJson,
      @RequestPart("file") MultipartFile pdfFile) {

    try {
      CreateQuoteRequest req = objectMapper.readValue(dataJson, CreateQuoteRequest.class);
      byte[] pdfBytes = pdfFile.getBytes();
      String originalFilename = pdfFile.getOriginalFilename();

      QuoteResponse response = quoteService.createAndSend(req, pdfBytes, originalFilename);
      return ResponseEntity.ok(response);

    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(new ErrorResponse("Error al crear/enviar la cotización: " + e.getMessage()));
    }
  }

  // ====== APROBAR (crea Servicio Contratado) ======
  static class StatusReason { public String reason; }

  @PatchMapping("/{id}/approve")
  public ResponseEntity<?> approveQuote(
      @PathVariable Long id,
      @RequestBody(required = false) StatusReason body,
      @AuthenticationPrincipal UserDetails user) {

    try {
      Long userId = getUserIdFromUserDetails(user);
      Long orgId = 1L; // ajusta si tu token lleva orgId
      String reason = (body != null ? body.reason : "Aprobada desde el sistema");

      // Este método debe: validar ENVIADA -> cambiar a APROBADA -> crear ContractedService (+items) -> log
      QuoteResponse r = quoteService.approveAndContract(id, orgId, userId, reason);
      return ResponseEntity.ok(r);

    } catch (IllegalStateException ex) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(ex.getMessage()));
    } catch (NoSuchElementException ex) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Cotización no encontrada"));
    } catch (Exception ex) {
      ex.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(new ErrorResponse("Error al aprobar la cotización: " + ex.getMessage()));
    }
  }

  // ====== RECHAZAR ======
  @PatchMapping("/{id}/reject")
  public ResponseEntity<?> rejectQuote(
      @PathVariable Long id,
      @RequestBody StatusReason body,
      @AuthenticationPrincipal UserDetails user) {

    try {
      Long userId = getUserIdFromUserDetails(user);
      String reason = (body != null && body.reason != null && !body.reason.trim().isEmpty())
          ? body.reason : "Rechazada desde el sistema";

      QuoteResponse r = quoteService.rejectQuote(id, reason, userId);
      return ResponseEntity.ok(r);

    } catch (IllegalStateException ex) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(ex.getMessage()));
    } catch (NoSuchElementException ex) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Cotización no encontrada"));
    } catch (Exception ex) {
      ex.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(new ErrorResponse("Error al rechazar la cotización: " + ex.getMessage()));
    }
  }

  // ====== ITEMS DE COTIZACIÓN ======
  @GetMapping("/{quoteId}/items")
  public List<QuoteItemResponse> getQuoteItems(@PathVariable Long quoteId) {
    Quote quote = repo.findById(quoteId)
        .orElseThrow(() -> new NoSuchElementException("Cotización no encontrada"));
    return quote.getItems().stream().map(this::toItemDto).collect(Collectors.toList());
  }

  // ====== LISTADO/PAGINADO ======
  @GetMapping
  public Page<QuoteResponse> list(
      @RequestParam(value = "q", required = false) String q,
      @RequestParam(value = "status", required = false) String status,
      @RequestParam(value = "sector", required = false) String sector,
      @RequestParam(value = "clientId", required = false) String clientIdStr,
      @RequestParam(value = "page", defaultValue = "0") int page,
      @RequestParam(value = "size", defaultValue = "10") int size) {

    QuoteStatus st = null;
    if (status != null && !status.trim().isEmpty() && !"Todos".equalsIgnoreCase(status)) {
      st = QuoteStatus.valueOf(status);
    }
    Long clientId = safeToLong(clientIdStr);

    Page<Quote> rows = repo.search(
        q != null ? q.trim() : null,
        st,
        (sector != null && !"Todos".equalsIgnoreCase(sector)) ? sector : null,
        clientId,
        PageRequest.of(page, size)
    );

    List<QuoteResponse> content = rows.getContent().stream()
        .filter(Objects::nonNull)
        .map(this::toDto)
        .collect(Collectors.toList());

    return new PageImpl<>(content, rows.getPageable(), rows.getTotalElements());
  }

  // ====== ACTUALIZAR VIGENCIA ======
  @PatchMapping("/{quoteId}/valid-until")
  public ResponseEntity<?> updateValidUntil(
      @PathVariable Long quoteId,
      @RequestBody Map<String, String> body) {

    try {
      String validUntilStr = body.get("validUntil");
      LocalDate validUntil = null;
      if (validUntilStr != null && !validUntilStr.trim().isEmpty()) {
        validUntil = LocalDate.parse(validUntilStr);
      }

      Quote q = repo.findById(quoteId)
          .orElseThrow(() -> new NoSuchElementException("Cotización no encontrada"));

      q.setValidUntil(validUntil);
      repo.save(q);
      return ResponseEntity.ok().build();

    } catch (Exception e) {
      Map<String, Object> err = new HashMap<String, Object>();
      err.put("error", "No se pudo actualizar la fecha de vigencia");
      err.put("details", e.getMessage());
      return ResponseEntity.status(500).body(err);
    }
  }

  // ====== Helpers ======

  private Long safeToLong(String s) {
    if (s == null) return null;
    s = s.trim();
    if (s.isEmpty() || "null".equalsIgnoreCase(s) || "undefined".equalsIgnoreCase(s)) return null;
    try { return Long.valueOf(s); } catch (Exception e) { return null; }
  }

  private Long getUserIdFromUserDetails(UserDetails userDetails) {
    if (userDetails == null) return 1L;
    try { return Long.parseLong(userDetails.getUsername()); }
    catch (NumberFormatException e) { return 1L; }
  }

  private QuoteItemResponse toItemDto(QuoteItem item) {
    QuoteItemResponse r = new QuoteItemResponse();
    r.id = item.getId();
    r.serviceId = item.getServiceId();
    r.name = item.getName();
    r.cost = item.getCost();
    return r;
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

  private static class ErrorResponse {
    public String message;
    public ErrorResponse(String message) { this.message = message; }
  }
}
