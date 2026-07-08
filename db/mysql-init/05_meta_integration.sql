-- Meta (Facebook/Instagram) Lead Ads integration config
CREATE TABLE IF NOT EXISTS meta_integrations (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    org_id       INT NOT NULL DEFAULT 1,
    page_id      VARCHAR(100),
    page_name    VARCHAR(255),
    page_access_token TEXT,
    verify_token VARCHAR(255),
    status       ENUM('CONNECTED','DISCONNECTED') NOT NULL DEFAULT 'DISCONNECTED',
    last_sync_at DATETIME,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default row for org 1
INSERT IGNORE INTO meta_integrations (id, org_id, status) VALUES (1, 1, 'DISCONNECTED');
