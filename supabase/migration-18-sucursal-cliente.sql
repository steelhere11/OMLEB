-- Migration 18: Add cliente_id to sucursales
-- Links branches directly to clients for the hierarchy: Cliente → Sucursal → Equipos → ODS → Reportes

ALTER TABLE public.sucursales
ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sucursales_cliente_id ON public.sucursales(cliente_id);

-- Backfill from most-used client per branch's ODS history
UPDATE public.sucursales s
SET cliente_id = sub.cliente_id
FROM (
  SELECT DISTINCT ON (sucursal_id) sucursal_id, cliente_id, COUNT(*) as cnt
  FROM public.ordenes_servicio
  GROUP BY sucursal_id, cliente_id
  ORDER BY sucursal_id, cnt DESC
) sub
WHERE s.id = sub.sucursal_id AND s.cliente_id IS NULL;
