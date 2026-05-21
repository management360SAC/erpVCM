-- =====================================================================
-- Migration 04: campos para importación masiva de interesados
-- Seguro re-ejecutar (ALTER COLUMN es idempotente en MySQL con IF NOT EXISTS workaround)
-- =====================================================================
USE vcm_crm;

-- ── clients: sector público/privado ────────────────────────────────
ALTER TABLE clients
  ADD COLUMN sector VARCHAR(20) NULL COMMENT 'PUBLICO o PRIVADO';

-- ── deal: campos extra del Excel ───────────────────────────────────
ALTER TABLE deal
  ADD COLUMN currency              VARCHAR(3)    NULL DEFAULT 'PEN'   COMMENT 'PEN o USD',
  ADD COLUMN service_type          VARCHAR(20)   NULL                 COMMENT 'FIJO o VARIABLE',
  ADD COLUMN approval_date         DATE          NULL                 COMMENT 'Fecha de aprobación del deal',
  ADD COLUMN contract_reference    VARCHAR(150)  NULL                 COMMENT 'N° Contrato / OS / OC / TDR',
  ADD COLUMN external_quote_number VARCHAR(100)  NULL                 COMMENT 'Nº cotización del sistema externo',
  ADD COLUMN invoice_reference     VARCHAR(150)  NULL                 COMMENT 'Número de factura asociada',
  ADD COLUMN collected_amount      DECIMAL(12,2) NULL                 COMMENT 'Monto cobrado registrado',
  ADD COLUMN balance_amount        DECIMAL(12,2) NULL                 COMMENT 'Saldo por cobrar + IGV';
