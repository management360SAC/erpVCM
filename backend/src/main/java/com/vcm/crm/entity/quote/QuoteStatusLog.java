package com.vcm.crm.entity.quote;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quote_status_log")
public class QuoteStatusLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "quote_id", nullable = false)
    private Long quoteId;
    
    @Column(name = "old_status")
    private String oldStatus;
    
    @Column(name = "new_status", nullable = false)
    private String newStatus;
    
    @Column(name = "changed_by", nullable = false)
    private Long changedBy;
    
    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;
    
    @Column(name = "reason")
    private String reason;

    // Constructores
    public QuoteStatusLog() {}

    public QuoteStatusLog(Long quoteId, String oldStatus, String newStatus, 
                         Long changedBy, String comments) {
        this.quoteId = quoteId;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy;
        this.changedAt = LocalDateTime.now();
        this.reason = comments;
    }

    // Getters y Setters
    public Long getId() { 
        return id; 
    }
    
    public void setId(Long id) { 
        this.id = id; 
    }
    
    public Long getQuoteId() { 
        return quoteId; 
    }
    
    public void setQuoteId(Long quoteId) { 
        this.quoteId = quoteId; 
    }
    
    public String getOldStatus() { 
        return oldStatus; 
    }
    
    public void setOldStatus(String oldStatus) { 
        this.oldStatus = oldStatus; 
    }
    
    public String getNewStatus() { 
        return newStatus; 
    }
    
    public void setNewStatus(String newStatus) { 
        this.newStatus = newStatus; 
    }
    
    public Long getChangedBy() { 
        return changedBy; 
    }
    
    public void setChangedBy(Long changedBy) { 
        this.changedBy = changedBy; 
    }
    
    public LocalDateTime getChangedAt() { 
        return changedAt; 
    }
    
    public void setChangedAt(LocalDateTime changedAt) { 
        this.changedAt = changedAt; 
    }
    
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}