package com.vcm.crm.entity;
import lombok.*;
import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "nps_invites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NpsInvite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Relación con ClientService
    @ManyToOne(optional = false)
    @JoinColumn(name = "client_service_id")
    private ClientService clientService;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 64, unique = true)
    private String token;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    // ✅ CAMPO AGREGADO
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(nullable = false, columnDefinition = "ENUM('PENDING','SENT','RESPONDED','EXPIRED')")
    @Enumerated(EnumType.STRING)
    private Status status;

    public enum Status {
        PENDING, SENT, RESPONDED, EXPIRED
    }

    // ==========================================
    // 🚀 GETTERS EXTRAS SEGUROS PARA EL CONTROLLER
    // ==========================================
    @Transient
    public String getClientName() {
        if (clientService == null) return null;
        Client client = clientService.getClient();
        if (client == null) return null;
        return client.getLegalName();
    }

    @Transient
    public String getServiceName() {
        if (clientService == null) return null;
        if (clientService.getService() == null) return null;
        return clientService.getService().getName();
    }
}