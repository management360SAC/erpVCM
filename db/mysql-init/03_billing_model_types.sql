-- =====================================================================
-- Migration 03: amplía el ENUM billing_model con FIJO y VARIABLE
-- Seguro re-ejecutar: MODIFY COLUMN es idempotente en MySQL
-- =====================================================================
USE vcm_crm;

ALTER TABLE service_catalog
  MODIFY COLUMN billing_model
    ENUM('MENSUAL','FIJO','VARIABLE') NOT NULL DEFAULT 'FIJO';
