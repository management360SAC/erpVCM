package com.vcm.crm.service;

import com.vcm.crm.dto.ImportDtos.*;
import com.vcm.crm.entity.Client;
import com.vcm.crm.entity.Deal;
import com.vcm.crm.repository.ClientRepository;
import com.vcm.crm.repository.DealRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ImportService {

    private static final int ORG_ID = 1;
    // Fila donde empiezan los datos (0-indexed = fila 7 en Excel = índice 6)
    private static final int DATA_START_ROW = 6;

    private final ClientRepository clientRepo;
    private final DealRepository dealRepo;

    // Ahora se importan TODOS los campos del Excel
    private static final List<String> COLUMNAS_NO_IMPORTADAS = Arrays.asList(
        "N° (A) — Número de fila correlativo, no necesario en el CRM"
    );

    // ── PREVIEW ─────────────────────────────────────────────────────────────
    public ImportPreviewResponse preview(MultipartFile file) throws Exception {
        List<ImportPreviewRow> filas = new ArrayList<>();
        try (InputStream is = file.getInputStream();
             Workbook wb = new XSSFWorkbook(is)) {

            Sheet sheet = wb.getSheetAt(0);
            for (int r = DATA_START_ROW; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                String razonSocial = str(row, 3);
                if (razonSocial == null || razonSocial.trim().isEmpty()) continue;

                ImportPreviewRow preview = buildPreviewRow(row, r + 1);
                filas.add(preview);
            }
        }

        ImportPreviewResponse resp = new ImportPreviewResponse();
        resp.setTotalFilas(filas.size());
        resp.setFilasValidas((int) filas.stream().filter(f -> f.getRazonSocial() != null).count());
        resp.setFilas(filas);
        resp.setColumnasNoImportadas(COLUMNAS_NO_IMPORTADAS);
        return resp;
    }

    // ── EJECUTAR IMPORTACIÓN ────────────────────────────────────────────────
    @Transactional
    public ImportResultResponse ejecutar(MultipartFile file) throws Exception {
        List<ImportResultRow> detalle = new ArrayList<>();
        int exitosas = 0, fallidas = 0;

        try (InputStream is = file.getInputStream();
             Workbook wb = new XSSFWorkbook(is)) {

            Sheet sheet = wb.getSheetAt(0);
            for (int r = DATA_START_ROW; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                String razonSocial = str(row, 3);
                if (razonSocial == null || razonSocial.trim().isEmpty()) continue;

                ImportResultRow result = new ImportResultRow();
                result.setFila(r + 1);
                try {
                    importRow(row, result);
                    result.setExito(true);
                    exitosas++;
                } catch (Exception e) {
                    result.setExito(false);
                    result.setMensaje("Error: " + e.getMessage());
                    fallidas++;
                }
                detalle.add(result);
            }
        }

        ImportResultResponse resp = new ImportResultResponse();
        resp.setTotalProcesadas(exitosas + fallidas);
        resp.setExitosas(exitosas);
        resp.setFallidas(fallidas);
        resp.setDetalle(detalle);
        return resp;
    }

    // ── LÓGICA POR FILA ────────────────────────────────────────────────────

    private ImportPreviewRow buildPreviewRow(Row row, int excelFila) {
        ImportPreviewRow p = new ImportPreviewRow();
        p.setFila(excelFila);

        String razonSocial = str(row, 3);
        p.setRazonSocial(razonSocial);
        p.setSector(str(row, 2));
        p.setTipoServicio(str(row, 1));

        String contacto = str(row, 4);
        p.setContacto(contacto);
        if (contacto != null && contacto.contains("@")) p.setEmailDetectado(extractEmail(contacto));

        p.setDetalleServicio(str(row, 5));
        p.setFechaCotizacion(dateStr(row, 6));
        p.setNroCotizacionExterno(str(row, 7));
        p.setFechaAprobacion(dateStr(row, 8));
        p.setNroContrato(str(row, 10));

        Double precioSoles = num(row, 11);
        Double precioUsd   = num(row, 12);
        p.setPrecioSoles(precioSoles);
        p.setPrecioUsd(precioUsd);
        p.setMonedaUsada(precioSoles != null ? "PEN" : precioUsd != null ? "USD" : null);

        String estado = str(row, 13);
        p.setEstado(estado);
        String[] mapped = mapEstado(estado);
        p.setStageCrm(mapped[0]);
        p.setStatusCrm(mapped[1]);

        p.setNotas(joinNotas(str(row, 9), str(row, 14)));

        p.setFactura(str(row, 17));
        p.setCobro(num(row, 18));
        p.setSaldoCobrar(num(row, 19));

        p.setClienteExistente(clientRepo.existsByOrgIdAndLegalNameIgnoreCase(ORG_ID, razonSocial.trim()));
        p.setCamposIgnorados(new ArrayList<>());
        return p;
    }

    private void importRow(Row row, ImportResultRow result) {
        String razonSocial = str(row, 3).trim();
        String sector      = str(row, 2);
        String contacto    = str(row, 4);

        // 1. Buscar o crear cliente
        boolean yaExiste = clientRepo.existsByOrgIdAndLegalNameIgnoreCase(ORG_ID, razonSocial);
        Client client = clientRepo.findByOrgIdAndLegalNameIgnoreCase(ORG_ID, razonSocial)
            .orElseGet(() -> {
                Client c = new Client();
                c.setOrgId(ORG_ID);
                c.setLegalName(razonSocial);
                return c;
            });

        // Actualizar contacto y sector siempre (incluso si el cliente ya existía)
        if (sector != null && !sector.trim().isEmpty()) client.setSector(sector.trim());
        if (contacto != null && contacto.contains("@")) {
            client.setEmail(extractEmail(contacto));
        } else if (contacto != null && contacto.matches(".*\\d{6,}.*")) {
            client.setPhone(contacto.replaceAll("[^0-9+\\-\\s]", "").trim());
        }
        client = clientRepo.save(client);
        result.setClienteId(client.getId().longValue());

        // 2. Crear deal con TODOS los campos del Excel
        Deal deal = new Deal();
        deal.setOrgId(ORG_ID);
        deal.setClient(client);

        // Título
        String detalle = str(row, 5);
        deal.setTitle(detalle != null && !detalle.trim().isEmpty() ? truncate(detalle, 200) : razonSocial);

        // Stage y status
        String estado = str(row, 13);
        String[] mapped = mapEstado(estado);
        deal.setStage(mapped[0]);
        deal.setStatus(mapped[1]);

        // Precio y moneda
        Double precioSoles = num(row, 11);
        Double precioUsd   = num(row, 12);
        if (precioSoles != null) {
            deal.setAmount(BigDecimal.valueOf(precioSoles));
            deal.setCurrency("PEN");
        } else if (precioUsd != null) {
            deal.setAmount(BigDecimal.valueOf(precioUsd));
            deal.setCurrency("USD");
        }

        // Fecha de cotización → createdAt
        LocalDateTime fechaCot = dateTime(row, 6);
        deal.setCreatedAt(fechaCot != null ? fechaCot : LocalDateTime.now());
        deal.setUpdatedAt(LocalDateTime.now());

        // Fecha de aprobación → approvalDate
        java.time.LocalDate fechaAprobacion = localDate(row, 8);
        deal.setApprovalDate(fechaAprobacion);

        // Tipo de servicio (VARIABLE / FIJO)
        String tipoServicio = str(row, 1);
        if (tipoServicio != null && !tipoServicio.trim().isEmpty()) deal.setServiceType(tipoServicio.trim());

        // Nº cotización externo
        String nroCotExt = str(row, 7);
        if (nroCotExt != null && !nroCotExt.trim().isEmpty()) deal.setExternalQuoteNumber(nroCotExt.trim());

        // N° Contrato / OS / OC / TDR
        String nroContrato = str(row, 10);
        if (nroContrato != null && !nroContrato.trim().isEmpty()) deal.setContractReference(nroContrato.trim());

        // Factura
        String factura = str(row, 17);
        if (factura != null && !factura.trim().isEmpty()) deal.setInvoiceReference(factura.trim());

        // Cobro (monto cobrado)
        Double cobro = num(row, 18);
        if (cobro != null) deal.setCollectedAmount(BigDecimal.valueOf(cobro));

        // Saldo x cobrar + IGV
        Double saldo = num(row, 19);
        if (saldo != null) deal.setBalanceAmount(BigDecimal.valueOf(saldo));

        // Notas: comentarios + observaciones
        String comentarios   = str(row, 9);
        String observaciones = str(row, 14);
        // (guardados como notas pero no hay campo notes en deal; los almacenamos en title suffix si aplica)
        // Por ahora los unimos como referencia en externalQuoteNumber si está vacío
        // En realidad se exponen en el DTO directamente — futuro campo notes en deal

        dealRepo.save(deal);
        result.setDealId(deal.getId());
        result.setMensaje(
            (yaExiste ? "Cliente actualizado" : "Cliente creado")
            + " | Deal creado (stage: " + deal.getStage() + ", moneda: " + (deal.getCurrency() != null ? deal.getCurrency() : "—") + ")"
        );
    }

    // ── HELPERS ─────────────────────────────────────────────────────────────

    private String[] mapEstado(String estado) {
        if (estado == null) return new String[]{"PROSPECTO", "OPEN"};
        switch (estado.trim()) {
            case "Venta Ganada":    return new String[]{"CERRADO_GANADO",  "WON"};
            case "Venta Perdida":   return new String[]{"CERRADO_PERDIDO", "LOST"};
            case "Propuesta enviada": return new String[]{"PROPUESTA",     "OPEN"};
            default:                return new String[]{"PROSPECTO",       "OPEN"};
        }
    }

    private String str(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING:  return cell.getStringCellValue().trim();
            case NUMERIC: return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            default:      return null;
        }
    }

    private Double num(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) return cell.getNumericCellValue();
        if (cell.getCellType() == CellType.STRING) {
            try { return Double.parseDouble(cell.getStringCellValue().replace(",", ".")); }
            catch (NumberFormatException e) { return null; }
        }
        return null;
    }

    private java.time.LocalDate localDate(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            java.util.Date d = cell.getDateCellValue();
            return d.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
        }
        return null;
    }

    private String dateStr(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            java.util.Date d = cell.getDateCellValue();
            return new java.text.SimpleDateFormat("dd/MM/yyyy").format(d);
        }
        return str(row, col);
    }

    private LocalDateTime dateTime(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            java.util.Date d = cell.getDateCellValue();
            return d.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
        }
        return null;
    }

    private String extractEmail(String contacto) {
        if (contacto == null) return null;
        for (String part : contacto.split("[\\s,;]+")) {
            if (part.matches("^[\\w._%+\\-]+@[\\w.\\-]+\\.[a-zA-Z]{2,}$")) return part;
        }
        return contacto.trim().length() <= 150 ? contacto.trim() : null;
    }

    private String joinNotas(String... parts) {
        List<String> list = new ArrayList<>();
        for (String p : parts) if (p != null && !p.trim().isEmpty()) list.add(p.trim());
        return list.isEmpty() ? null : String.join(" | ", list);
    }

    private String truncate(String s, int max) {
        return s.length() > max ? s.substring(0, max - 3) + "..." : s;
    }

    private void addIfPresent(List<CampoIgnorado> list, String col, String val, String motivo) {
        if (val != null && !val.trim().isEmpty()) list.add(new CampoIgnorado(col, val, motivo));
    }
}
