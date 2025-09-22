/* =======================================================================
   MySQL 8 - Esquema CRM completo
   - Engine InnoDB
   - UTF8MB4
   ======================================================================= */

-- 0) Configuración recomendada
SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET sql_safe_updates = 0;

-- 1) Base de datos
CREATE DATABASE IF NOT EXISTS vcm_crm
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE vcm_crm;

-- 2) Tablas
-- 2.1) Organización
CREATE TABLE IF NOT EXISTS org (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  tax_id      VARCHAR(50),
  email       VARCHAR(255),
  phone       VARCHAR(50),
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2.2) Usuarios (con direccion y celular)
CREATE TABLE IF NOT EXISTS usuarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  org_id      INT NOT NULL,
  username    VARCHAR(50)  NOT NULL,
  password    VARCHAR(255) NOT NULL,          -- hash bcrypt
  nombre      VARCHAR(100) NOT NULL,
  rol         VARCHAR(50)  NOT NULL DEFAULT 'USER',
  email       VARCHAR(255),
  direccion   VARCHAR(255),
  celular     VARCHAR(30),
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY UQ_usuarios_username (username),
  UNIQUE KEY UQ_usuarios_email (email),
  KEY IX_usuarios_org (org_id),
  KEY IX_usuarios_activo (is_active),
  KEY IX_usuarios_nombre (nombre),
  CONSTRAINT FK_usuarios_org
    FOREIGN KEY (org_id) REFERENCES org(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2.3) Roles
CREATE TABLE IF NOT EXISTS role (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  org_id  INT NOT NULL,
  name    VARCHAR(100) NOT NULL,
  UNIQUE KEY UQ_role_org_name (org_id, name),
  CONSTRAINT FK_role_org
    FOREIGN KEY (org_id) REFERENCES org(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2.4) Relación usuarios-roles (N:M)
CREATE TABLE IF NOT EXISTS user_role (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT FK_user_role_user
    FOREIGN KEY (user_id) REFERENCES usuarios(id)
    ON DELETE CASCADE,
  CONSTRAINT FK_user_role_role
    FOREIGN KEY (role_id) REFERENCES role(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2.5) Catálogo de proveedores de conexión
CREATE TABLE IF NOT EXISTS connection_provider (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  code  VARCHAR(100) NOT NULL,
  name  VARCHAR(200) NOT NULL,
  UNIQUE KEY UQ_connection_provider_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2.6) Conexiones por organización
CREATE TABLE IF NOT EXISTS connection (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  org_id        INT NOT NULL,
  provider_id   INT NOT NULL,
  access_token  TEXT,
  refresh_token TEXT,
  expires_at    DATETIME,
  metadata      JSON NULL,
  created_by    INT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY UQ_connection_org_provider (org_id, provider_id),
  KEY IX_connection_org (org_id),
  CONSTRAINT FK_connection_org
    FOREIGN KEY (org_id) REFERENCES org(id)
    ON DELETE CASCADE,
  CONSTRAINT FK_connection_provider
    FOREIGN KEY (provider_id) REFERENCES connection_provider(id)
    ON DELETE RESTRICT,
  CONSTRAINT FK_connection_user
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2.7) Configuración (clave-valor por sección)
CREATE TABLE IF NOT EXISTS app_config (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  org_id    INT NOT NULL,
  section   VARCHAR(100) NOT NULL,
  cfg_key   VARCHAR(100) NOT NULL,
  cfg_value JSON NULL,
  UNIQUE KEY UQ_app_config (org_id, section, cfg_key),
  CONSTRAINT FK_app_config_org
    FOREIGN KEY (org_id) REFERENCES org(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2.8) Auditoría
CREATE TABLE IF NOT EXISTS audit_log (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  org_id     INT NOT NULL,
  user_id    INT NULL,
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(100) NULL,
  entity_id  INT NULL,
  payload    JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY IX_audit_org (org_id),
  CONSTRAINT FK_audit_org
    FOREIGN KEY (org_id) REFERENCES org(id)
    ON DELETE CASCADE,
  CONSTRAINT FK_audit_user
    FOREIGN KEY (user_id) REFERENCES usuarios(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) Seeds iniciales
-- 3.1) Organización base
INSERT INTO org (name, tax_id, email, phone)
SELECT * FROM (SELECT 'GRUPO VCM', '20123456789', 'admin@vcm.com', '+51 999 999 999') AS s
WHERE NOT EXISTS (SELECT 1 FROM org WHERE name = 'GRUPO VCM');

SET @ORG_ID := (SELECT id FROM org WHERE name = 'GRUPO VCM' LIMIT 1);

-- 3.2) Usuarios con ON DUPLICATE
INSERT INTO usuarios (org_id, username, password, nombre, rol, email, direccion, celular, is_active)
VALUES
  (@ORG_ID, 'admin',
   '$2a$10$RMPaUApvZP3VzKw1q5MfFeJ.j9a3xYMiH6pQ3n4be6Dc7YmIu8hUu',
   'Administrador', 'ADMIN', 'admin@vcm.com', 'Av. Principal 123', '999999999', 1)
ON DUPLICATE KEY UPDATE username = VALUES(username);

INSERT INTO usuarios (org_id, username, password, nombre, rol, email, direccion, celular, is_active)
VALUES
  (@ORG_ID, 'daniel',
   '$2a$10$RMPaUApvZP3VzKw1q5MfFeJ.j9a3xYMiH6pQ3n4be6Dc7YmIu8hUu',
   'Daniel Toledo', 'ADMIN', 'daniel@vcm.com', 'Av. San Martín 123, Arequipa', '987654321', 1)
ON DUPLICATE KEY UPDATE username = VALUES(username);

-- 3.3) Roles
INSERT INTO role (org_id, name)
SELECT @ORG_ID, 'ADMIN' WHERE NOT EXISTS (SELECT 1 FROM role WHERE org_id = @ORG_ID AND name = 'ADMIN');
INSERT INTO role (org_id, name)
SELECT @ORG_ID, 'MANAGER' WHERE NOT EXISTS (SELECT 1 FROM role WHERE org_id = @ORG_ID AND name = 'MANAGER');
INSERT INTO role (org_id, name)
SELECT @ORG_ID, 'OPERADOR' WHERE NOT EXISTS (SELECT 1 FROM role WHERE org_id = @ORG_ID AND name = 'OPERADOR');

-- 3.4) Asignar rol ADMIN a Daniel
SET @USER_DANIEL := (SELECT id FROM usuarios WHERE username = 'daniel' LIMIT 1);
SET @ROLE_ADMIN  := (SELECT id FROM role WHERE org_id = @ORG_ID AND name = 'ADMIN' LIMIT 1);
INSERT INTO user_role (user_id, role_id)
SELECT @USER_DANIEL, @ROLE_ADMIN
WHERE @USER_DANIEL IS NOT NULL AND @ROLE_ADMIN IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM user_role WHERE user_id = @USER_DANIEL AND role_id = @ROLE_ADMIN);

-- 3.5) Proveedores
INSERT INTO connection_provider (code, name)
SELECT 'gmail', 'Gmail' WHERE NOT EXISTS (SELECT 1 FROM connection_provider WHERE code = 'gmail');
INSERT INTO connection_provider (code, name)
SELECT 'google_ads', 'Google Ads' WHERE NOT EXISTS (SELECT 1 FROM connection_provider WHERE code = 'google_ads');
INSERT INTO connection_provider (code, name)
SELECT 'whatsapp_business', 'WhatsApp Business' WHERE NOT EXISTS (SELECT 1 FROM connection_provider WHERE code = 'whatsapp_business');
INSERT INTO connection_provider (code, name)
SELECT 'facebook_ads', 'Meta Ads' WHERE NOT EXISTS (SELECT 1 FROM connection_provider WHERE code = 'facebook_ads');

-- 3.6) Configuración general
INSERT INTO app_config (org_id, section, cfg_key, cfg_value)
SELECT @ORG_ID, 'general', 'org_name', JSON_QUOTE('GRUPO VCM')
WHERE NOT EXISTS (SELECT 1 FROM app_config WHERE org_id = @ORG_ID AND section = 'general' AND cfg_key = 'org_name');

INSERT INTO app_config (org_id, section, cfg_key, cfg_value)
SELECT @ORG_ID, 'general', 'email', JSON_QUOTE('admin@vcm.com')
WHERE NOT EXISTS (SELECT 1 FROM app_config WHERE org_id = @ORG_ID AND section = 'general' AND cfg_key = 'email');

INSERT INTO app_config (org_id, section, cfg_key, cfg_value)
SELECT @ORG_ID, 'general', 'tax_id', JSON_QUOTE('20123456789')
WHERE NOT EXISTS (SELECT 1 FROM app_config WHERE org_id = @ORG_ID AND section = 'general' AND cfg_key = 'tax_id');

-- 4) Vista: usuarios con roles
DROP VIEW IF EXISTS vw_usuarios_roles;
CREATE VIEW vw_usuarios_roles AS
SELECT
  u.org_id,
  u.id,
  u.nombre       AS full_name,
  u.email,
  u.username,
  u.direccion,
  u.celular,
  u.is_active,
  COALESCE((
    SELECT GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ')
    FROM user_role ur2
    JOIN role r ON r.id = ur2.role_id
    WHERE ur2.user_id = u.id
  ), '') AS roles
FROM usuarios u;
