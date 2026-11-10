-- Add sender information columns
ALTER TABLE adexec.shipments ADD COLUMN IF NOT EXISTS sender_name TEXT NOT NULL DEFAULT '';
ALTER TABLE adexec.shipments ADD COLUMN IF NOT EXISTS sender_email TEXT NOT NULL DEFAULT '';
ALTER TABLE adexec.shipments ADD COLUMN IF NOT EXISTS sender_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE adexec.shipments ADD COLUMN IF NOT EXISTS sender_address TEXT NOT NULL DEFAULT '';

-- Add recipient address column
ALTER TABLE adexec.shipments ADD COLUMN IF NOT EXISTS recipient_address TEXT NOT NULL DEFAULT '';
