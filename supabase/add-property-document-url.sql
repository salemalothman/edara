-- Add document_url column to properties table for PDF document storage
ALTER TABLE properties ADD COLUMN IF NOT EXISTS document_url TEXT DEFAULT NULL;
