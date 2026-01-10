package com.vcm.crm.controller;

import com.vcm.crm.entity.ContractedService;
import com.vcm.crm.repository.ContractedServiceRepository;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationsController {

    private final ContractedServiceRepository csRepo;

    public NotificationsController(ContractedServiceRepository csRepo) {
        this.csRepo = csRepo;
    }

    @GetMapping("/pending-collection")
    public Map<String, Object> pendingCollection(@RequestParam(name = "orgId", required = false) Long orgId) {
        Long oid = (orgId != null ? orgId : 1L);

        List<ContractedService> list = csRepo.findPendingCollection(oid);
        List<Map<String, Object>> items = list.stream().map(cs -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", cs.getId());
            m.put("number", cs.getNumber());
            m.put("clientId", cs.getClientId());
            m.put("total", cs.getTotal() != null ? cs.getTotal() : BigDecimal.ZERO);
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> out = new HashMap<>();
        out.put("count", items.size());
        out.put("items", items);
        return out;
    }
}
