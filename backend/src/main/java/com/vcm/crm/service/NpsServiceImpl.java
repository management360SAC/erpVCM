package com.vcm.crm.service;

import com.vcm.crm.dto.NpsDtos;
import com.vcm.crm.entity.ClientService;
import com.vcm.crm.entity.NpsResponse;
import com.vcm.crm.repository.NpsInviteRepository;
import com.vcm.crm.repository.NpsResponseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NpsServiceImpl implements NpsService {

    private final NpsResponseRepository responseRepository;
    private final NpsInviteRepository inviteRepository;

    @Override
    public NpsDtos.NpsSummaryDto getSummary(NpsDtos.NpsRequest request) {
        LocalDate from = request.getFrom();
        LocalDate to = request.getTo();

        if (from == null || to == null) {
            LocalDate today = LocalDate.now();
            if (to == null) to = today;
            if (from == null) from = to.minusDays(29);
        }

        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.atTime(LocalTime.MAX);
        Integer serviceId = request.getServiceId();

        List<NpsResponse> responses = responseRepository.findAllByPeriod(fromDt, toDt, serviceId);
        long sent = inviteRepository.countSentBetween(fromDt, toDt);

        long promoters = responses.stream().filter(r -> r.getScore() >= 9).count();
        long detractors = responses.stream().filter(r -> r.getScore() <= 6).count();
        long passives = responses.size() - promoters - detractors;

        double nps = responses.isEmpty() ? 0.0
                : Math.round(((double)(promoters - detractors) / responses.size()) * 100.0 * 10.0) / 10.0;

        double responseRate = sent == 0 ? 0.0
                : Math.round(((double) responses.size() / sent) * 100.0 * 10.0) / 10.0;

        double csatAvg = responses.stream()
                .mapToInt(NpsResponse::getScore).average().orElse(0.0);

        double avgQ1 = responses.stream().filter(r -> r.getQ1() != null)
                .mapToInt(NpsResponse::getQ1).average().orElse(0.0);
        double avgQ2 = responses.stream().filter(r -> r.getQ2() != null)
                .mapToInt(NpsResponse::getQ2).average().orElse(0.0);
        double avgQ3 = responses.stream().filter(r -> r.getQ3() != null)
                .mapToInt(NpsResponse::getQ3).average().orElse(0.0);
        double avgQ4 = responses.stream().filter(r -> r.getQ4() != null)
                .mapToInt(NpsResponse::getQ4).average().orElse(0.0);

        return NpsDtos.NpsSummaryDto.builder()
                .nps(nps)
                .promoters(promoters)
                .passives(passives)
                .detractors(detractors)
                .total((long) responses.size())
                .periodStart(from)
                .periodEnd(to)
                .responseRate(responseRate)
                .responses((long) responses.size())
                .sent(sent)
                .csatAvg(Math.round(csatAvg * 10.0) / 10.0)
                .avgQ1(Math.round(avgQ1 * 10.0) / 10.0)
                .avgQ2(Math.round(avgQ2 * 10.0) / 10.0)
                .avgQ3(Math.round(avgQ3 * 10.0) / 10.0)
                .avgQ4(Math.round(avgQ4 * 10.0) / 10.0)
                .build();
    }

    @Override
    public Page<NpsDtos.NpsResponseDto> getResponses(NpsDtos.NpsRequest request, int page, int size) {
        LocalDate from = request.getFrom();
        LocalDate to = request.getTo();

        if (from == null || to == null) {
            LocalDate today = LocalDate.now();
            if (to == null) to = today;
            if (from == null) from = to.minusDays(29);
        }

        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.atTime(LocalTime.MAX);
        Integer serviceId = request.getServiceId();

        Page<NpsResponse> pageResult = responseRepository.findByPeriod(
                fromDt, toDt, serviceId, PageRequest.of(page, size)
        );

        List<NpsDtos.NpsResponseDto> dtos = pageResult.getContent().stream()
                .map(r -> {
                    ClientService cs = r.getClientService();
                    String clientName = (cs != null && cs.getClient() != null)
                            ? cs.getClient().getLegalName() : "-";
                    String serviceName = (cs != null && cs.getService() != null)
                            ? cs.getService().getName() : "-";

                    String label;
                    if (r.getScore() >= 9) label = "Promoter";
                    else if (r.getScore() >= 7) label = "Passive";
                    else label = "Detractor";

                    return NpsDtos.NpsResponseDto.builder()
                            .id(r.getId())
                            .clientName(clientName)
                            .serviceName(serviceName)
                            .q1(r.getQ1())
                            .q2(r.getQ2())
                            .q3(r.getQ3())
                            .q4(r.getQ4())
                            .score(r.getScore())
                            .comment(r.getComment())
                            .createdAt(r.getCreatedAt())
                            .label(label)
                            .build();
                })
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, PageRequest.of(page, size), pageResult.getTotalElements());
    }
}
