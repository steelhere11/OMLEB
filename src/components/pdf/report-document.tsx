"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Svg,
  Path,
} from "@react-pdf/renderer";
import "./pdf-fonts"; // Side-effect: registers Inter font family
import type { PhotoBase64 } from "./pdf-utils";

// ---------- Data types ----------

export interface PdfStepData {
  id: string;
  nombre: string;
  completado: boolean;
  notas: string | null;
  lecturas: Record<string, number | string> | null;
  lecturas_meta: Array<{
    nombre: string;
    unidad: string;
    rango_min: number | null;
    rango_max: number | null;
  }> | null;
  photosBase64: PhotoBase64[];
  isCustom?: boolean;
  orden?: number;
}

export interface PdfRegistrationEntry {
  equipoTag: string;
  tipoEquipo: string | null;
  ubicacion: string | null;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  capacidad: string | null;
  refrigerante: string | null;
  voltaje: string | null;
  fase: string | null;
  photoGeneral: string | null; // base64 data URL
  photoPlaca: string | null; // base64 data URL
}

export interface PdfReportData {
  orden: { numero_orden: string; descripcion_problema: string };
  sucursal: { nombre: string; numero: string; direccion: string };
  cliente: { nombre: string; logoBase64: string | null };
  companyLogoBase64: string | null;
  fecha: string;
  estatus: string;
  teamMembers: { nombre: string; rol: string }[];
  arrivalPhoto: { data: string; gps: string | null; fecha: string | null } | null;
  sitePhoto: { data: string; gps: string | null; fecha: string | null } | null;
  registrationEntries: PdfRegistrationEntry[];
  comments: Array<{
    contenido: string;
    autorNombre: string;
    equipo_id: string | null;
    created_at: string;
  }>;
  equipmentEntries: Array<{
    equipo: {
      id: string;
      numero_etiqueta: string;
      marca: string | null;
      modelo: string | null;
    };
    tipo_trabajo: string;
    diagnostico: string | null;
    trabajo_realizado: string | null;
    observaciones: string | null;
    steps: PdfStepData[];
    orphanPhotosBase64: PhotoBase64[];
    /** @deprecated kept for backward compat — use step photos + orphan */
    photosBase64: PhotoBase64[];
  }>;
  materials: Array<{ cantidad: number; unidad: string; descripcion: string }>;
  firmaBase64: string | null;
  nombreEncargado: string | null;
  numeroRevision: number;
  revisionActual: number;
  lastRevision: { fecha: string; autor: string } | null;
}

// ---------- Colors ----------

const BLUE = "#2563eb";
const GREEN = "#059669";
const RED = "#dc2626";
const BRAND_NAVY = "#1e3a6e";
const AMBER_DARK = "#92400e";
const AMBER_LIGHT = "#fef3c7";
const AMBER_BG = "#fffbeb";
const CHECK_BLUE = "#5a7394";

const GRAY_50 = "#f9fafb";
const GRAY_100 = "#f3f4f6";
const GRAY_200 = "#e5e7eb";
const GRAY_300 = "#d1d5db";
const GRAY_500 = "#6b7280";
const GRAY_700 = "#374151";
const GRAY_900 = "#111827";

// ---------- Styles ----------

const s = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9,
    padding: 40,
    paddingBottom: 50,
    color: GRAY_900,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: BLUE,
  },
  headerLogoBox: {
    width: 65,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  headerLogo: {
    maxWidth: 65,
    maxHeight: 45,
    objectFit: "contain" as const,
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: GRAY_900,
  },
  headerOrden: {
    fontSize: 10,
    fontWeight: 500,
    color: BLUE,
    marginTop: 2,
  },
  // Info grid
  infoGrid: {
    marginBottom: 12,
    border: `1px solid ${GRAY_300}`,
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: GRAY_200,
  },
  infoCell: {
    width: "50%",
    padding: 7,
  },
  infoCellFull: {
    width: "100%",
    padding: 7,
  },
  infoCellProblem: {
    width: "100%",
    padding: 7,
    backgroundColor: AMBER_BG,
  },
  infoLabel: {
    fontSize: 7,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    color: GRAY_500,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 9,
    color: GRAY_900,
  },
  // Status badges
  badgeEstatus: {
    fontSize: 9,
    fontWeight: 700,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start" as const,
  },
  badgeEnProgreso: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  badgeEnEspera: { backgroundColor: GRAY_100, color: GRAY_700 },
  badgeCompletado: { backgroundColor: "#d1fae5", color: "#065f46" },
  // Summary bar
  summaryBar: {
    flexDirection: "row",
    backgroundColor: GRAY_50,
    border: `1px solid ${GRAY_200}`,
    borderRadius: 4,
    marginBottom: 16,
    padding: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center" as const,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 700,
    color: GRAY_900,
  },
  summaryLabel: {
    fontSize: 7,
    color: GRAY_500,
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: GRAY_200,
    marginHorizontal: 4,
  },
  // Section title
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: GRAY_900,
    marginBottom: 8,
    marginTop: 14,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: BLUE,
  },
  // Equipment header card
  equipCard: {
    border: `1px solid ${GRAY_300}`,
    borderRadius: 4,
    marginBottom: 20,
    overflow: "hidden" as const,
  },
  equipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: GRAY_50,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_200,
  },
  equipName: {
    fontSize: 10,
    fontWeight: 700,
    color: GRAY_900,
    flex: 1,
  },
  badge: {
    fontSize: 7,
    fontWeight: 700,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  badgePreventivo: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  badgeCorrectivo: { backgroundColor: AMBER_LIGHT, color: AMBER_DARK },
  equipProgress: {
    fontSize: 8,
    color: GRAY_500,
    padding: 6,
    paddingTop: 4,
  },
  // Free-text fields
  fieldLabel: {
    fontSize: 7,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    color: GRAY_500,
    marginBottom: 2,
    marginTop: 4,
    paddingHorizontal: 8,
  },
  fieldValue: {
    fontSize: 9,
    color: GRAY_700,
    lineHeight: 1.4,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  // Step block
  stepBlock: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_100,
  },
  stepHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepCheckIcon: {
    width: 14,
    marginRight: 3,
    marginTop: 1,
  },
  stepNameText: {
    fontSize: 9.5,
    fontWeight: 600,
    color: GRAY_900,
    flex: 1,
  },
  stepIncompleteName: {
    fontSize: 9,
    fontWeight: 400,
    color: GRAY_500,
    flex: 1,
  },
  stepNote: {
    fontSize: 8,
    color: GRAY_700,
    marginLeft: 16,
    marginTop: 2,
  },
  stepNoteCallout: {
    fontSize: 8,
    color: GRAY_700,
    marginLeft: 16,
    marginTop: 4,
    marginBottom: 4,
    paddingLeft: 8,
    paddingVertical: 4,
    borderLeftWidth: 3,
    borderLeftColor: BLUE,
    backgroundColor: "#e0eaff",
  },
  // Readings table
  readingsTable: {
    marginLeft: 16,
    marginTop: 4,
    marginBottom: 2,
    border: `1px solid ${GRAY_200}`,
    borderRadius: 2,
  },
  readingsHeaderRow: {
    flexDirection: "row",
    backgroundColor: GRAY_100,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_200,
  },
  readingsDataRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: GRAY_50,
  },
  readingsDataRowOdd: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: GRAY_50,
    backgroundColor: GRAY_50,
  },
  rCellParam: { width: "35%", padding: 3 },
  rCellValue: { width: "25%", padding: 3 },
  rCellRange: { width: "25%", padding: 3 },
  rCellStatus: { width: "15%", padding: 3, alignItems: "center" as const },
  rHeaderText: {
    fontSize: 7,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
    color: GRAY_500,
  },
  rCellText: { fontSize: 8, color: GRAY_700 },
  rCellValueText: { fontSize: 8, fontWeight: 500, color: GRAY_900 },
  statusOk: { fontSize: 8, color: GREEN },
  statusWarn: { fontSize: 8, color: RED, fontWeight: 700 },
  statusNa: { fontSize: 8, color: GRAY_300 },
  // Step photo grid
  stageLabel: {
    fontSize: 7,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginLeft: 16,
    marginTop: 4,
    marginBottom: 2,
    alignSelf: "flex-start" as const,
  },
  stageLabelAntes: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  stageLabelDurante: { backgroundColor: AMBER_LIGHT, color: AMBER_DARK },
  stageLabelDespues: { backgroundColor: "#d1fae5", color: "#065f46" },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginLeft: 16,
    marginBottom: 4,
  },
  photoBox: {
    width: "48%",
    marginBottom: 4,
  },
  photoImg: {
    height: 130,
    objectFit: "cover" as const,
    borderRadius: 3,
    border: `1px solid ${GRAY_200}`,
  },
  photoCaption: {
    fontSize: 6,
    color: GRAY_500,
    marginTop: 1,
  },
  // Orphan photos
  orphanSection: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  orphanTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: GRAY_500,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  // Empty equipment
  emptyText: {
    fontSize: 8,
    color: GRAY_500,
    padding: 8,
  },
  // Materials table
  matTable: { marginTop: 4 },
  matHeaderRow: {
    flexDirection: "row",
    backgroundColor: GRAY_100,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_300,
  },
  matDataRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: GRAY_100,
  },
  matDataRowOdd: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: GRAY_100,
    backgroundColor: GRAY_50,
  },
  matCellCant: { width: "15%", padding: 5 },
  matCellUnit: { width: "20%", padding: 5 },
  matCellDesc: { width: "65%", padding: 5 },
  matHeaderText: {
    fontSize: 7,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
    color: GRAY_500,
  },
  matCellText: { fontSize: 8, color: GRAY_700 },
  // Signature
  sigSection: {
    alignItems: "center" as const,
    marginTop: 16,
    paddingTop: 10,
  },
  sigImage: {
    width: 180,
    height: 70,
    objectFit: "contain" as const,
    marginBottom: 4,
  },
  sigLine: {
    width: 180,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_900,
    marginBottom: 3,
  },
  sigName: { fontSize: 9, fontWeight: 500, color: GRAY_900 },
  sigLabel: { fontSize: 7, color: GRAY_500, marginTop: 1 },
  // Registration section
  regPhotoRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  regPhotoHalf: {
    width: "48%",
  },
  regPhotoFull: {
    width: "60%",
    marginBottom: 8,
  },
  regImg: {
    height: 130,
    objectFit: "contain" as const,
    borderRadius: 3,
    border: `1px solid ${GRAY_200}`,
    backgroundColor: GRAY_50,
  },
  regImgSmall: {
    height: 100,
    objectFit: "contain" as const,
    borderRadius: 3,
    border: `1px solid ${GRAY_200}`,
    backgroundColor: GRAY_50,
  },
  regCaption: {
    fontSize: 7,
    color: GRAY_500,
    marginTop: 2,
  },
  regCard: {
    border: `1px solid ${GRAY_300}`,
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden" as const,
  },
  regCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: GRAY_50,
    padding: 7,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_200,
  },
  regCardBody: {
    padding: 8,
  },
  regFieldRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  regFieldLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: GRAY_500,
    width: 80,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  regFieldValue: {
    fontSize: 8,
    color: GRAY_700,
    flex: 1,
  },
  // Comments
  commentsSection: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  commentsTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: GRAY_500,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  commentBlock: {
    marginBottom: 4,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: BLUE,
  },
  commentText: {
    fontSize: 8,
    color: GRAY_700,
    lineHeight: 1.4,
  },
  commentMeta: {
    fontSize: 6,
    color: GRAY_500,
    marginTop: 1,
  },
  // Footer
  footer: {
    position: "absolute" as const,
    bottom: 18,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: GRAY_200,
    paddingTop: 5,
  },
  footerText: { fontSize: 6, color: GRAY_500 },
  footerPage: { fontSize: 6, color: GRAY_500 },
});

// ---------- Status helpers ----------

const statusLabels: Record<string, string> = {
  en_progreso: "En Progreso",
  completado: "Completado",
  en_espera: "En Espera",
};

function getStatusBadgeStyle(estatus: string) {
  switch (estatus) {
    case "completado":
      return s.badgeCompletado;
    case "en_espera":
      return s.badgeEnEspera;
    default:
      return s.badgeEnProgreso;
  }
}

const rolLabels: Record<string, string> = {
  admin: "Admin",
  tecnico: "Tecnico",
  ayudante: "Ayudante",
};

const stageLabelStyles = {
  antes: s.stageLabelAntes,
  durante: s.stageLabelDurante,
  despues: s.stageLabelDespues,
} as Record<string, typeof s.stageLabelAntes>;

const stageLabels: Record<string, string> = {
  antes: "ANTES",
  durante: "DURANTE",
  despues: "DESPUES",
};

// ---------- Helper: Readings Table ----------

function ReadingsTable({
  lecturas,
  meta,
}: {
  lecturas: Record<string, number | string>;
  meta: Array<{
    nombre: string;
    unidad: string;
    rango_min: number | null;
    rango_max: number | null;
  }> | null;
}) {
  const entries = Object.entries(lecturas);
  if (entries.length === 0) return null;

  // Build meta lookup
  const metaMap = new Map<string, (typeof meta extends Array<infer T> | null ? T : never)>();
  if (meta) {
    for (const m of meta) {
      metaMap.set(m.nombre, m);
    }
  }

  // Check if ANY reading in this step has range data
  const anyHasRange = entries.some(([key]) => {
    const m = metaMap.get(key);
    return m && m.rango_min != null && m.rango_max != null;
  });

  return (
    <View style={s.readingsTable}>
      <View style={s.readingsHeaderRow}>
        <View style={anyHasRange ? s.rCellParam : { width: "45%", padding: 3 }}>
          <Text style={s.rHeaderText}>Parametro</Text>
        </View>
        <View style={anyHasRange ? s.rCellValue : { width: "55%", padding: 3 }}>
          <Text style={s.rHeaderText}>Valor</Text>
        </View>
        {anyHasRange && (
          <View style={s.rCellRange}>
            <Text style={s.rHeaderText}>Rango</Text>
          </View>
        )}
        {anyHasRange && (
          <View style={s.rCellStatus}>
            <Text style={s.rHeaderText}>Estado</Text>
          </View>
        )}
      </View>
      {entries.map(([key, value], i) => {
        const m = metaMap.get(key);
        const hasRange = m && m.rango_min != null && m.rango_max != null;
        const numVal = typeof value === "number" ? value : parseFloat(String(value));
        const isOutOfRange =
          hasRange && !isNaN(numVal)
            ? numVal < m.rango_min! || numVal > m.rango_max!
            : false;
        const rangeStr = hasRange
          ? `${m.rango_min}–${m.rango_max} ${m.unidad}`
          : "";

        return (
          <View
            key={key}
            style={i % 2 === 1 ? s.readingsDataRowOdd : s.readingsDataRow}
          >
            <View style={anyHasRange ? s.rCellParam : { width: "45%", padding: 3 }}>
              <Text style={s.rCellText}>{key}</Text>
            </View>
            <View style={anyHasRange ? s.rCellValue : { width: "55%", padding: 3 }}>
              <Text style={s.rCellValueText}>{String(value)}</Text>
            </View>
            {anyHasRange && (
              <View style={s.rCellRange}>
                <Text style={s.rCellText}>{rangeStr || "\u2014"}</Text>
              </View>
            )}
            {anyHasRange && (
              <View style={s.rCellStatus}>
                {hasRange ? (
                  isOutOfRange ? (
                    <WarnIcon color={RED} size={9} />
                  ) : (
                    <CheckIcon color={GREEN} size={9} />
                  )
                ) : (
                  <Text style={s.statusNa}>--</Text>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ---------- Helper: Step Photo Grid ----------

function StepPhotoGrid({ photos }: { photos: PhotoBase64[] }) {
  if (photos.length === 0) return null;

  // Group by stage
  const stageOrder = ["antes", "durante", "despues"];
  const grouped: Record<string, PhotoBase64[]> = {};
  for (const p of photos) {
    const stage = p.etiqueta?.toLowerCase() ?? "otros";
    if (!grouped[stage]) grouped[stage] = [];
    grouped[stage].push(p);
  }

  const stages = stageOrder.filter((st) => grouped[st]?.length);
  // Also include any non-standard stages
  for (const st of Object.keys(grouped)) {
    if (!stages.includes(st)) stages.push(st);
  }

  return (
    <>
      {stages.map((stage) => (
        <View key={stage} wrap={false}>
          <Text
            style={[
              s.stageLabel,
              stageLabelStyles[stage] ?? s.stageLabelAntes,
            ]}
          >
            {stageLabels[stage] ?? stage.toUpperCase()}
          </Text>
          <View style={s.photoGrid}>
            {grouped[stage].map((photo, pIdx) => (
              <View key={pIdx} style={s.photoBox}>
                <Image src={photo.data} style={s.photoImg} />
                <Text style={s.photoCaption}>
                  {photo.etiqueta || "Foto"}
                  {photo.fecha
                    ? ` - ${new Date(photo.fecha).toLocaleString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : ""}
                </Text>
                {photo.gps && (
                  <Text style={s.photoCaption}>GPS: {photo.gps}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  );
}

// ---------- Helper: Step Block ----------

/** SVG checkmark — renders reliably in react-pdf (Inter lacks Unicode glyphs) */
function CheckIcon({ color = CHECK_BLUE, size = 10 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** SVG warning triangle */
function WarnIcon({ color = RED, size = 10 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Renders a completed step with SVG checkmark, plus any content inline */
function StepBlock({ step }: { step: PdfStepData }) {
  return (
    <View style={s.stepBlock} wrap={true}>
      <View style={s.stepHeaderRow}>
        <View style={s.stepCheckIcon}>
          <CheckIcon />
        </View>
        <Text style={s.stepNameText}>{step.nombre}</Text>
      </View>

      {/* Readings table */}
      {step.lecturas && Object.keys(step.lecturas).length > 0 && (
        <ReadingsTable lecturas={step.lecturas} meta={step.lecturas_meta} />
      )}

      {/* Photos grouped by stage */}
      {step.photosBase64.length > 0 && (
        <StepPhotoGrid photos={step.photosBase64} />
      )}

      {/* Notes (below photos, callout style) */}
      {step.notas && (
        <View style={s.stepNoteCallout}>
          <Text style={{ fontSize: 8, color: GRAY_700 }}>{step.notas}</Text>
        </View>
      )}
    </View>
  );
}

// ---------- Summary Bar ----------

function SummaryBar({ data }: { data: PdfReportData }) {
  const totalEquipos = data.equipmentEntries.length;
  let prevCount = 0;
  let corrCount = 0;
  let totalSteps = 0;
  let completedSteps = 0;
  let totalPhotos = 0;

  for (const entry of data.equipmentEntries) {
    if (entry.tipo_trabajo === "correctivo") corrCount++;
    else prevCount++;

    for (const step of entry.steps) {
      totalSteps++;
      if (step.completado) completedSteps++;
      totalPhotos += step.photosBase64.length;
    }
    totalPhotos += entry.orphanPhotosBase64.length;
  }

  return (
    <View style={s.summaryBar}>
      <View style={s.summaryItem}>
        <Text style={s.summaryValue}>{totalEquipos}</Text>
        <Text style={s.summaryLabel}>equipos</Text>
      </View>
      <View style={s.summaryDivider} />
      <View style={s.summaryItem}>
        <Text style={s.summaryValue}>{prevCount}</Text>
        <Text style={s.summaryLabel}>preventivo</Text>
      </View>
      <View style={s.summaryDivider} />
      <View style={s.summaryItem}>
        <Text style={s.summaryValue}>{corrCount}</Text>
        <Text style={s.summaryLabel}>correctivo</Text>
      </View>
      <View style={s.summaryDivider} />
      <View style={s.summaryItem}>
        <Text style={s.summaryValue}>
          {completedSteps}/{totalSteps}
        </Text>
        <Text style={s.summaryLabel}>pasos</Text>
      </View>
      <View style={s.summaryDivider} />
      <View style={s.summaryItem}>
        <Text style={s.summaryValue}>{totalPhotos}</Text>
        <Text style={s.summaryLabel}>fotos</Text>
      </View>
    </View>
  );
}

// ---------- Main Component ----------

export function ReportDocument({ data }: { data: PdfReportData }) {
  const generatedDate = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const fechaFormatted = new Date(data.fecha + "T12:00:00").toLocaleDateString(
    "es-MX",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

  const teamStr =
    data.teamMembers.length > 0
      ? data.teamMembers
          .map((m) => `${m.nombre} (${rolLabels[m.rol] ?? m.rol})`)
          .join(", ")
      : "Sin asignar";

  return (
    <Document
      title={`Reporte ${data.orden.numero_orden} - ${data.fecha}`}
      author="OMLEB"
    >
      <Page
        size="LETTER"
        style={s.page}
        wrap={true}
      >
        {/* Header */}
        <View style={s.header} fixed>
          {data.companyLogoBase64 ? (
            <View style={s.headerLogoBox}>
              <Image src={data.companyLogoBase64} style={s.headerLogo} />
            </View>
          ) : (
            <View style={s.headerLogoBox}>
              <Text style={{ fontSize: 13, fontWeight: 700, color: BLUE }}>
                OMLEB
              </Text>
            </View>
          )}
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Reporte de Mantenimiento</Text>
            <Text style={s.headerOrden}>
              ODS: {data.orden.numero_orden}  |  Rev {data.numeroRevision}
              {data.revisionActual > 0 ? `  |  Edicion ${data.revisionActual}` : ""}
            </Text>
          </View>
          {data.cliente.logoBase64 && (
            <View style={s.headerLogoBox}>
              <Image src={data.cliente.logoBase64} style={s.headerLogo} />
            </View>
          )}
        </View>

        {/* Info Grid */}
        <View style={s.infoGrid}>
          <View style={s.infoRow}>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Fecha</Text>
              <Text style={s.infoValue}>{fechaFormatted}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Estatus</Text>
              <Text
                style={[s.badgeEstatus, getStatusBadgeStyle(data.estatus)]}
              >
                {statusLabels[data.estatus] ?? data.estatus}
              </Text>
            </View>
          </View>
          <View style={s.infoRow}>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Sucursal</Text>
              <Text style={s.infoValue}>
                {data.sucursal.nombre} ({data.sucursal.numero})
              </Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Cliente</Text>
              <Text style={s.infoValue}>{data.cliente.nombre}</Text>
            </View>
          </View>
          <View style={s.infoRow}>
            <View style={s.infoCellFull}>
              <Text style={s.infoLabel}>Direccion</Text>
              <Text style={s.infoValue}>{data.sucursal.direccion}</Text>
            </View>
          </View>
          <View style={s.infoRow}>
            <View style={s.infoCellProblem}>
              <Text style={[s.infoLabel, { color: AMBER_DARK }]}>Problema Reportado</Text>
              <Text style={[s.infoValue, { fontSize: 10 }]}>
                {data.orden.descripcion_problema}
              </Text>
            </View>
          </View>
          <View style={{ ...s.infoRow, borderBottomWidth: 0 }}>
            <View style={s.infoCellFull}>
              <Text style={s.infoLabel}>Equipo de Trabajo</Text>
              <Text style={s.infoValue}>{teamStr}</Text>
            </View>
          </View>
        </View>

        {/* Summary Bar */}
        <SummaryBar data={data} />

        {/* Evidencia de Llegada */}
        {data.arrivalPhoto && (
          <>
            <Text style={s.sectionTitle}>Evidencia de Llegada</Text>
            <View style={s.regPhotoFull}>
              <Image src={data.arrivalPhoto.data} style={s.regImg} />
              <Text style={s.regCaption}>
                Foto de llegada
                {data.arrivalPhoto.fecha
                  ? ` - ${new Date(data.arrivalPhoto.fecha).toLocaleString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : ""}
              </Text>
              {data.arrivalPhoto.gps && (
                <Text style={s.regCaption}>GPS: {data.arrivalPhoto.gps}</Text>
              )}
            </View>
          </>
        )}

        {/* Panoramica del Sitio */}
        {data.sitePhoto && (
          <>
            <Text style={s.sectionTitle}>Panoramica del Sitio</Text>
            <View style={s.regPhotoFull}>
              <Image src={data.sitePhoto.data} style={s.regImg} />
              <Text style={s.regCaption}>
                Foto panoramica del sitio
                {data.sitePhoto.fecha
                  ? ` - ${new Date(data.sitePhoto.fecha).toLocaleString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : ""}
              </Text>
              {data.sitePhoto.gps && (
                <Text style={s.regCaption}>GPS: {data.sitePhoto.gps}</Text>
              )}
            </View>
          </>
        )}

        {/* Registro de Equipos */}
        {data.registrationEntries.length > 0 && (
          <>
            <Text style={s.sectionTitle}>
              Registro de Equipos ({data.registrationEntries.length})
            </Text>
            {data.registrationEntries.map((reg, rIdx) => {
              const nameplateFields = [
                { label: "Marca", value: reg.marca },
                { label: "Modelo", value: reg.modelo },
                { label: "No. Serie", value: reg.numero_serie },
                { label: "Capacidad", value: reg.capacidad },
                { label: "Refrigerante", value: reg.refrigerante },
                { label: "Voltaje", value: reg.voltaje },
                { label: "Fase", value: reg.fase },
                { label: "Ubicacion", value: reg.ubicacion },
              ].filter((f) => f.value);

              return (
                <View key={rIdx} style={s.regCard} wrap={true}>
                  <View style={s.regCardHeader}>
                    <Text style={s.equipName}>{reg.equipoTag}</Text>
                    {reg.tipoEquipo && (
                      <Text style={[s.badge, s.badgePreventivo]}>
                        {reg.tipoEquipo}
                      </Text>
                    )}
                  </View>
                  <View style={s.regCardBody}>
                    {/* Photos side by side */}
                    {(reg.photoGeneral || reg.photoPlaca) && (
                      <View style={s.regPhotoRow}>
                        {reg.photoGeneral && (
                          <View style={s.regPhotoHalf}>
                            <Image src={reg.photoGeneral} style={s.regImgSmall} />
                            <Text style={s.regCaption}>Vista general</Text>
                          </View>
                        )}
                        {reg.photoPlaca && (
                          <View style={s.regPhotoHalf}>
                            <Image src={reg.photoPlaca} style={s.regImgSmall} />
                            <Text style={s.regCaption}>Placa de datos</Text>
                          </View>
                        )}
                      </View>
                    )}
                    {/* Nameplate fields */}
                    {nameplateFields.length > 0 &&
                      nameplateFields.map((field, fIdx) => (
                        <View key={fIdx} style={s.regFieldRow}>
                          <Text style={s.regFieldLabel}>{field.label}</Text>
                          <Text style={s.regFieldValue}>{field.value}</Text>
                        </View>
                      ))}
                    {nameplateFields.length === 0 &&
                      !reg.photoGeneral &&
                      !reg.photoPlaca && (
                        <Text style={s.emptyText}>Sin datos de registro</Text>
                      )}
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Equipment Sections */}
        {data.equipmentEntries.length > 0 && (
          <>
            <Text style={s.sectionTitle}>
              Equipos Atendidos ({data.equipmentEntries.length})
            </Text>
            {data.equipmentEntries.map((entry, idx) => {
              const completedCount = entry.steps.filter(
                (st) => st.completado
              ).length;
              const totalCount = entry.steps.length;
              const hasSteps = totalCount > 0;
              const equipComments = (data.comments ?? []).filter(
                (c) => c.equipo_id === entry.equipo.id
              );
              const hasAnyContent =
                hasSteps ||
                entry.diagnostico ||
                entry.trabajo_realizado ||
                entry.observaciones ||
                entry.orphanPhotosBase64.length > 0 ||
                equipComments.length > 0;

              return (
                <View key={idx} style={s.equipCard} wrap={true}>
                  {/* Equipment header */}
                  <View style={s.equipHeader}>
                    <Text style={s.equipName}>
                      {entry.equipo.numero_etiqueta}
                      {entry.equipo.marca || entry.equipo.modelo
                        ? ` \u2014 ${[entry.equipo.marca, entry.equipo.modelo]
                            .filter(Boolean)
                            .join(" ")}`
                        : ""}
                    </Text>
                    <Text
                      style={[
                        s.badge,
                        entry.tipo_trabajo === "correctivo"
                          ? s.badgeCorrectivo
                          : s.badgePreventivo,
                      ]}
                    >
                      {entry.tipo_trabajo === "correctivo"
                        ? "CORRECTIVO"
                        : "PREVENTIVO"}
                    </Text>
                  </View>

                  {/* No content */}
                  {!hasAnyContent && (
                    <Text style={s.emptyText}>
                      Sin actividad registrada
                    </Text>
                  )}

                  {/* Free-text fields */}
                  {entry.diagnostico && (
                    <>
                      <Text style={s.fieldLabel}>Diagnostico</Text>
                      <Text style={s.fieldValue}>{entry.diagnostico}</Text>
                    </>
                  )}
                  {entry.trabajo_realizado && (
                    <>
                      <Text style={s.fieldLabel}>Trabajo Realizado</Text>
                      <Text style={s.fieldValue}>
                        {entry.trabajo_realizado}
                      </Text>
                    </>
                  )}
                  {entry.observaciones && (
                    <>
                      <Text style={s.fieldLabel}>Observaciones</Text>
                      <Text style={s.fieldValue}>{entry.observaciones}</Text>
                    </>
                  )}

                  {/* Steps — all completed under unified section */}
                  {(() => {
                    const completed = entry.steps.filter((st) => st.completado).sort((a, b) => (a.orden ?? 9999) - (b.orden ?? 9999));
                    const templateSteps = completed.filter((st) => !st.isCustom);
                    const customSteps = completed.filter((st) => st.isCustom);

                    return (
                      <>
                        {/* Section header for template steps */}
                        {templateSteps.length > 0 && (
                          <View
                            style={{
                              marginTop: 6,
                              marginHorizontal: 8,
                              marginBottom: 4,
                              backgroundColor: "#eef2f7",
                              borderLeft: `3pt solid ${BRAND_NAVY}`,
                              borderRadius: 4,
                              paddingVertical: 6,
                              paddingHorizontal: 10,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: BRAND_NAVY,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              Verificaciones completadas
                            </Text>
                          </View>
                        )}

                        {/* All template steps rendered uniformly */}
                        {templateSteps.map((step) => (
                          <StepBlock key={step.id} step={step} />
                        ))}

                        {/* Custom steps with blue ADICIONAL badge */}
                        {customSteps.length > 0 && (
                          <View style={{ marginTop: 8 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, paddingHorizontal: 8 }}>
                              <View
                                style={{
                                  backgroundColor: GRAY_200,
                                  paddingHorizontal: 5,
                                  paddingVertical: 2,
                                  borderRadius: 3,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 7,
                                    fontWeight: 700,
                                    color: GRAY_700,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  ADICIONAL
                                </Text>
                              </View>
                              <Text
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color: GRAY_700,
                                }}
                              >
                                Pasos adicionales
                              </Text>
                            </View>
                            {customSteps.map((step) => (
                              <StepBlock key={step.id} step={step} />
                            ))}
                          </View>
                        )}
                      </>
                    );
                  })()}

                  {/* Orphan photos */}
                  {entry.orphanPhotosBase64.length > 0 && (
                    <View style={s.orphanSection}>
                      <Text style={s.orphanTitle}>
                        Fotos adicionales ({entry.orphanPhotosBase64.length})
                      </Text>
                      <View style={s.photoGrid}>
                        {entry.orphanPhotosBase64.map((photo, pIdx) => (
                          <View key={pIdx} style={s.photoBox}>
                            <Image src={photo.data} style={s.photoImg} />
                            <Text style={s.photoCaption}>
                              {photo.etiqueta || "Foto"}
                              {photo.fecha
                                ? ` - ${new Date(
                                    photo.fecha
                                  ).toLocaleString("es-MX", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}`
                                : ""}
                            </Text>
                            {photo.gps && (
                              <Text style={s.photoCaption}>
                                GPS: {photo.gps}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Admin comments for this equipment */}
                  {equipComments.length > 0 && (
                    <View style={s.commentsSection}>
                      <Text style={s.commentsTitle}>Comentarios del Administrador</Text>
                      {equipComments.map((c, cIdx) => (
                        <View key={cIdx} style={s.commentBlock}>
                          <Text style={s.commentText}>{c.contenido}</Text>
                          <Text style={s.commentMeta}>
                            — {c.autorNombre},{" "}
                            {new Date(c.created_at).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Materials table */}
        {data.materials.length > 0 && (
          <>
            <Text style={s.sectionTitle}>
              Material Empleado ({data.materials.length})
            </Text>
            <View style={s.matTable}>
              <View style={s.matHeaderRow}>
                <View style={s.matCellCant}>
                  <Text style={s.matHeaderText}>Cant.</Text>
                </View>
                <View style={s.matCellUnit}>
                  <Text style={s.matHeaderText}>Unidad</Text>
                </View>
                <View style={s.matCellDesc}>
                  <Text style={s.matHeaderText}>Descripcion</Text>
                </View>
              </View>
              {data.materials.map((mat, mIdx) => (
                <View
                  key={mIdx}
                  style={mIdx % 2 === 1 ? s.matDataRowOdd : s.matDataRow}
                >
                  <View style={s.matCellCant}>
                    <Text style={s.matCellText}>{mat.cantidad}</Text>
                  </View>
                  <View style={s.matCellUnit}>
                    <Text style={s.matCellText}>{mat.unidad}</Text>
                  </View>
                  <View style={s.matCellDesc}>
                    <Text style={s.matCellText}>{mat.descripcion}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* General Admin Comments */}
        {(data.comments ?? []).filter((c) => !c.equipo_id).length > 0 && (
          <>
            <Text style={s.sectionTitle}>Comentarios del Administrador</Text>
            {(data.comments ?? [])
              .filter((c) => !c.equipo_id)
              .map((c, cIdx) => (
                <View key={cIdx} style={s.commentBlock}>
                  <Text style={s.commentText}>{c.contenido}</Text>
                  <Text style={s.commentMeta}>
                    — {c.autorNombre},{" "}
                    {new Date(c.created_at).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              ))}
          </>
        )}

        {/* Signature */}
        {data.firmaBase64 && (
          <>
            <Text style={s.sectionTitle}>Firma del Encargado</Text>
            <View style={s.sigSection}>
              <Image src={data.firmaBase64} style={s.sigImage} />
              <View style={s.sigLine} />
              {data.nombreEncargado && (
                <Text style={s.sigName}>{data.nombreEncargado}</Text>
              )}
              <Text style={s.sigLabel}>Encargado de Sucursal</Text>
            </View>
          </>
        )}

        {/* Footer — fixed on all pages with page numbers */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {data.lastRevision
              ? `Ultima revision: ${new Date(data.lastRevision.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })} por ${data.lastRevision.autor}`
              : `Generado el ${generatedDate}`}
          </Text>
          <Text
            style={s.footerPage}
            render={({ pageNumber, totalPages }) =>
              `Pagina ${pageNumber} de ${totalPages}`
            }
          />
          <Text style={s.footerText}>OMLEB - Servicios HVAC</Text>
        </View>
      </Page>
    </Document>
  );
}
