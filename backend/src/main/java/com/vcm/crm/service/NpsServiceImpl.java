package com.vcm.crm.service;

import com.vcm.crm.dto.NpsDtos;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;

/**
 * Implementación básica de NpsService.
 *
 * Por ahora devuelve datos vacíos (0 y listas vacías) para que el
 * backend compile y el front pueda consumir sin romperse.
 */
@Service
public class NpsServiceImpl implements NpsService {

  @Override
  public NpsDtos.NpsSummaryDto getSummary(NpsDtos.NpsRequest request) {
    LocalDate from = request.getFrom();
    LocalDate to = request.getTo();

    // Si no vienen fechas, usamos últimos 30 días como default
    if (from == null || to == null) {
      LocalDate today = LocalDate.now();
      if (to == null) {
        to = today;
      }
      if (from == null) {
        from = to.minusDays(29);
      }
    }

    return NpsDtos.NpsSummaryDto.builder()
        .nps(0.0)
        .promoters(0L)
        .passives(0L)
        .detractors(0L)
        .total(0L)
        .periodStart(from)
        .periodEnd(to)
        .responseRate(0.0)
        .responses(0L)
        .sent(0L)
        .csatAvg(0.0)
        .build();
  }

  @Override
  public Page<NpsDtos.NpsResponseDto> getResponses(
      NpsDtos.NpsRequest request,
      int page,
      int size
  ) {
    // Devolvemos una página vacía por ahora
    return new PageImpl<>(
        Collections.emptyList(),
        PageRequest.of(page, size),
        0
    );
  }
}
