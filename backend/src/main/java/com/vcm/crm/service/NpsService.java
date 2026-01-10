package com.vcm.crm.service;

import com.vcm.crm.dto.NpsDtos;
import org.springframework.data.domain.Page;

/**
 * Servicio para operaciones NPS (resumen + listado de respuestas).
 */
public interface NpsService {

  /**
   * Devuelve el resumen NPS para el rango y filtros recibidos.
   */
  NpsDtos.NpsSummaryDto getSummary(NpsDtos.NpsRequest request);

  /**
   * Devuelve las respuestas NPS paginadas.
   */
  Page<NpsDtos.NpsResponseDto> getResponses(NpsDtos.NpsRequest request, int page, int size);
}
