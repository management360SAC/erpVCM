package com.vcm.crm.entity;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Entity
@Table(name = "clients")
@Getter
@Setter
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "org_id", nullable = false)
    private Integer orgId;

    @Column(name = "legal_name", nullable = false, length = 150)
    private String legalName;

    @Column(name = "tax_id", length = 30)
    private String taxId;

    @Column(name = "sector_id")
    private Integer sectorId;

    @Column(name = "size_id")
    private Integer sizeId;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @PrePersist
    void ensureDefaults() {
        if (orgId == null) {
            orgId = 1;
        }
    }
}
