-- Migration: Add 'investment' to properties type CHECK constraint
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_type_check CHECK (type IN ('residential', 'commercial', 'mixed', 'investment'));
