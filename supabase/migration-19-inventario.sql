-- ============================================================================
-- MIGRATION 19: Inventory & Materials Management
-- ============================================================================
-- Creates: cuadrillas, cuadrilla_miembros, materiales_catalogo,
--          stock_movimientos, materiales_requeridos
-- Alters:  reporte_materiales (add catalogo_id FK)
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- 1. CUADRILLAS — lightweight team entity for inventory assignment
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.cuadrillas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  lider_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cuadrillas ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_cuadrillas_all" ON public.cuadrillas
  FOR ALL USING (private.is_admin());

-- Techs: read active cuadrillas
CREATE POLICY "tech_cuadrillas_select" ON public.cuadrillas
  FOR SELECT USING (
    private.get_user_role() IN ('tecnico', 'ayudante')
    AND activa = true
  );


-- ════════════════════════════════════════════════════════════════════════════
-- 2. CUADRILLA_MIEMBROS — team membership
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.cuadrilla_miembros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuadrilla_id uuid NOT NULL REFERENCES public.cuadrillas(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cuadrilla_id, usuario_id)
);

ALTER TABLE public.cuadrilla_miembros ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_cuadrilla_miembros_all" ON public.cuadrilla_miembros
  FOR ALL USING (private.is_admin());

-- Techs: read own membership
CREATE POLICY "tech_cuadrilla_miembros_select" ON public.cuadrilla_miembros
  FOR SELECT USING (
    private.get_user_role() IN ('tecnico', 'ayudante')
    AND usuario_id = auth.uid()
  );


-- ════════════════════════════════════════════════════════════════════════════
-- 3. MATERIALES_CATALOGO — master material catalog
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.materiales_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('consumible', 'componente')),
  unidad_default text NOT NULL,
  stock_minimo numeric NOT NULL DEFAULT 0,
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.materiales_catalogo ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_materiales_catalogo_all" ON public.materiales_catalogo
  FOR ALL USING (private.is_admin());

-- Techs: read active catalog items
CREATE POLICY "tech_materiales_catalogo_select" ON public.materiales_catalogo
  FOR SELECT USING (
    private.get_user_role() IN ('tecnico', 'ayudante')
    AND activo = true
  );


-- ════════════════════════════════════════════════════════════════════════════
-- 4. STOCK_MOVIMIENTOS — single ledger for ALL stock movements
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.stock_movimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogo_id uuid NOT NULL REFERENCES public.materiales_catalogo(id) ON DELETE RESTRICT,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'asignacion', 'uso', 'devolucion', 'ajuste')),
  cantidad numeric NOT NULL,
  fuente text CHECK (fuente IS NULL OR fuente IN ('empresa', 'contratista')),
  contratista_nombre text,
  cuadrilla_id uuid REFERENCES public.cuadrillas(id) ON DELETE SET NULL,
  reporte_id uuid REFERENCES public.reportes(id) ON DELETE SET NULL,
  costo_unitario numeric,
  costo_total numeric,
  numero_factura text,
  notas text,
  registrado_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movimientos ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_stock_movimientos_all" ON public.stock_movimientos
  FOR ALL USING (private.is_admin());

-- Techs: can read their own movimientos
CREATE POLICY "tech_stock_movimientos_select" ON public.stock_movimientos
  FOR SELECT USING (
    private.get_user_role() IN ('tecnico', 'ayudante')
    AND registrado_por = auth.uid()
  );

-- Techs: can insert 'uso' type movimientos only
CREATE POLICY "tech_stock_movimientos_insert_uso" ON public.stock_movimientos
  FOR INSERT WITH CHECK (
    private.get_user_role() IN ('tecnico', 'ayudante')
    AND tipo = 'uso'
    AND registrado_por = auth.uid()
  );

-- Techs: can delete their own 'uso' type movimientos (for re-save pattern)
CREATE POLICY "tech_stock_movimientos_delete_uso" ON public.stock_movimientos
  FOR DELETE USING (
    private.get_user_role() IN ('tecnico', 'ayudante')
    AND tipo = 'uso'
    AND registrado_por = auth.uid()
  );


-- ════════════════════════════════════════════════════════════════════════════
-- 5. MATERIALES_REQUERIDOS — required materials for en_espera reports
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.materiales_requeridos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id uuid NOT NULL REFERENCES public.reportes(id) ON DELETE CASCADE,
  catalogo_id uuid REFERENCES public.materiales_catalogo(id) ON DELETE SET NULL,
  descripcion text NOT NULL,
  cantidad numeric NOT NULL,
  unidad text NOT NULL,
  prioridad text NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('urgente', 'normal')),
  estatus text NOT NULL DEFAULT 'pendiente' CHECK (estatus IN ('pendiente', 'en_camino', 'recibido')),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.materiales_requeridos ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_materiales_requeridos_all" ON public.materiales_requeridos
  FOR ALL USING (private.is_admin());

-- Techs: read materiales_requeridos for their reports
CREATE POLICY "tech_materiales_requeridos_select" ON public.materiales_requeridos
  FOR SELECT USING (
    private.get_user_role() IN ('tecnico', 'ayudante')
  );


-- ════════════════════════════════════════════════════════════════════════════
-- 6. ALTER reporte_materiales — add catalogo_id FK
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.reporte_materiales
  ADD COLUMN IF NOT EXISTS catalogo_id uuid REFERENCES public.materiales_catalogo(id) ON DELETE SET NULL;


-- ════════════════════════════════════════════════════════════════════════════
-- 7. INDEXES for performance
-- ════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_cuadrilla_miembros_usuario ON public.cuadrilla_miembros(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cuadrilla_miembros_cuadrilla ON public.cuadrilla_miembros(cuadrilla_id);
CREATE INDEX IF NOT EXISTS idx_stock_movimientos_catalogo ON public.stock_movimientos(catalogo_id);
CREATE INDEX IF NOT EXISTS idx_stock_movimientos_cuadrilla ON public.stock_movimientos(cuadrilla_id);
CREATE INDEX IF NOT EXISTS idx_stock_movimientos_tipo ON public.stock_movimientos(tipo);
CREATE INDEX IF NOT EXISTS idx_stock_movimientos_reporte ON public.stock_movimientos(reporte_id);
CREATE INDEX IF NOT EXISTS idx_materiales_requeridos_reporte ON public.materiales_requeridos(reporte_id);
CREATE INDEX IF NOT EXISTS idx_materiales_requeridos_estatus ON public.materiales_requeridos(estatus);
CREATE INDEX IF NOT EXISTS idx_reporte_materiales_catalogo ON public.reporte_materiales(catalogo_id);
