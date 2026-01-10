package com.vcm.crm.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

import com.vcm.crm.util.ActiveZeroOneConverter;

@Entity
@Table(name = "client_service")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceCatalog service;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "price")
    private BigDecimal price;

    @Convert(converter = ActiveZeroOneConverter.class)
    @Column(name = "active")
    private Boolean active = Boolean.TRUE; 

    @Column(name = "notes")
    private String notes;
}
