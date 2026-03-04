-- Migration 14: Add orden column to reporte_pasos for admin reordering
-- Run this on Supabase SQL editor after all previous migrations

ALTER TABLE public.reporte_pasos ADD COLUMN orden integer;

COMMENT ON COLUMN public.reporte_pasos.orden IS 'Admin-assigned display order. NULL = fallback to template order.';
