"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
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
}

export interface PdfReportData {
  folio: { numero_folio: string; descripcion_problema: string };
  sucursal: { nombre: string; numero: string; direccion: string };
  cliente: { nombre: string; logoBase64: string | null };
  companyLogoBase64: string | null;
  fecha: string;
  estatus: string;
  teamMembers: { nombre: string; rol: string }[];
  equipmentEntries: Array<{
    equipo: {
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
}

// ---------- Styles ----------

const BLUE = "#2563eb";
const GRAY_100 = "#f3f4f6";
const GRAY_300 = "#d1d5db";
const GRAY_500 = "#6b7280";
const GRAY_700 = "#374151";
const GRAY_900 = "#111827";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    padding: 40,
    color: GRAY_900,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: BLUE,
  },
  headerLogoContainer: {
    width: 70,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  headerLogo: {
    maxWidth: 70,
    maxHeight: 50,
    objectFit: "contain" as const,
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: GRAY_900,
  },
  headerFolio: {
    fontSize: 11,
    fontWeight: 500,
    color: BLUE,
    marginTop: 2,
  },
  // Info grid
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    border: `1px solid ${GRAY_300}`,
    borderRadius: 4,
  },
  infoCell: {
    width: "50%",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_300,
  },
  infoCellFull: {
    width: "100%",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_300,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    color: GRAY_500,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    color: GRAY_900,
  },
  // Section titles
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: GRAY_900,
    marginBottom: 8,
    marginTop: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BLUE,
  },
  // Equipment card
  equipmentCard: {
    border: `1px solid ${GRAY_300}`,
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  equipmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  equipmentName: {
    fontSize: 11,
    fontWeight: 700,
    color: GRAY_900,
    flex: 1,
  },
  badge: {
    fontSize: 8,
    fontWeight: 700,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  badgePreventivo: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  },
  badgeCorrectivo: {
    backgroundColor: "#ffedd5",
    color: "#c2410c",
  },
  badgeEstatus: {
    fontSize: 9,
    fontWeight: 500,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeEnProgreso: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  },
  badgeEnEspera: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  badgeCompletado: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  // Text blocks
  fieldLabel: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    color: GRAY_500,
    marginBottom: 2,
    marginTop: 6,
  },
  fieldValue: {
    fontSize: 10,
    color: GRAY_700,
    lineHeight: 1.4,
  },
  // Steps
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 3,
    paddingLeft: 4,
  },
  stepCheck: {
    fontSize: 10,
    width: 14,
    marginRight: 4,
    marginTop: 1,
  },
  stepName: {
    fontSize: 9,
    fontWeight: 500,
    color: GRAY_900,
    flex: 1,
  },
  stepDetail: {
    fontSize: 8,
    color: GRAY_500,
    marginLeft: 18,
    marginBottom: 2,
  },
  // Photo grid
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  photoContainer: {
    width: "48%",
    marginBottom: 6,
  },
  photoImage: {
    height: 150,
    objectFit: "cover" as const,
    borderRadius: 3,
    border: `1px solid ${GRAY_300}`,
  },
  photoLabel: {
    fontSize: 7,
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
    color: GRAY_500,
    marginTop: 2,
  },
  // Materials table
  materialsTable: {
    marginTop: 4,
  },
  materialsHeaderRow: {
    flexDirection: "row",
    backgroundColor: GRAY_100,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_300,
  },
  materialsDataRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: GRAY_100,
  },
  materialsCellCant: {
    width: "15%",
    padding: 6,
  },
  materialsCellUnit: {
    width: "20%",
    padding: 6,
  },
  materialsCellDesc: {
    width: "65%",
    padding: 6,
  },
  materialsHeaderText: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
    color: GRAY_500,
  },
  materialsCellText: {
    fontSize: 9,
    color: GRAY_700,
  },
  // Signature
  signatureSection: {
    alignItems: "center",
    marginTop: 20,
    paddingTop: 12,
  },
  signatureImage: {
    width: 200,
    height: 80,
    objectFit: "contain" as const,
    marginBottom: 4,
  },
  signatureLine: {
    width: 200,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_900,
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 500,
    color: GRAY_900,
  },
  signatureLabel: {
    fontSize: 8,
    color: GRAY_500,
    marginTop: 1,
  },
  // Footer
  footer: {
    position: "absolute" as const,
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: GRAY_300,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: GRAY_500,
  },
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
      return styles.badgeCompletado;
    case "en_espera":
      return styles.badgeEnEspera;
    default:
      return styles.badgeEnProgreso;
  }
}

const rolLabels: Record<string, string> = {
  admin: "Admin",
  tecnico: "Tecnico",
  ayudante: "Ayudante",
};

// ---------- Component ----------

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
      title={`Reporte ${data.folio.numero_folio} - ${data.fecha}`}
      author="OMLEB"
    >
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {data.companyLogoBase64 ? (
            <View style={styles.headerLogoContainer}>
              <Image src={data.companyLogoBase64} style={styles.headerLogo} />
            </View>
          ) : (
            <View style={styles.headerLogoContainer}>
              <Text style={{ fontSize: 14, fontWeight: 700, color: BLUE }}>
                OMLEB
              </Text>
            </View>
          )}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Reporte de Mantenimiento</Text>
            <Text style={styles.headerFolio}>
              Folio: {data.folio.numero_folio}
            </Text>
          </View>
          {data.cliente.logoBase64 && (
            <View style={styles.headerLogoContainer}>
              <Image
                src={data.cliente.logoBase64}
                style={styles.headerLogo}
              />
            </View>
          )}
        </View>

        {/* Info grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Fecha</Text>
            <Text style={styles.infoValue}>{fechaFormatted}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Estatus</Text>
            <Text
              style={[
                styles.badgeEstatus,
                getStatusBadgeStyle(data.estatus),
              ]}
            >
              {statusLabels[data.estatus] ?? data.estatus}
            </Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Sucursal</Text>
            <Text style={styles.infoValue}>
              {data.sucursal.nombre} ({data.sucursal.numero})
            </Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={styles.infoValue}>{data.cliente.nombre}</Text>
          </View>
          <View style={styles.infoCellFull}>
            <Text style={styles.infoLabel}>Direccion</Text>
            <Text style={styles.infoValue}>{data.sucursal.direccion}</Text>
          </View>
          <View style={styles.infoCellFull}>
            <Text style={styles.infoLabel}>Problema Reportado</Text>
            <Text style={styles.infoValue}>
              {data.folio.descripcion_problema}
            </Text>
          </View>
          <View style={styles.infoCellFull}>
            <Text style={styles.infoLabel}>Equipo de Trabajo</Text>
            <Text style={styles.infoValue}>{teamStr}</Text>
          </View>
        </View>

        {/* Equipment section */}
        {data.equipmentEntries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Equipos Atendidos ({data.equipmentEntries.length})
            </Text>
            {data.equipmentEntries.map((entry, idx) => (
              <View key={idx} style={styles.equipmentCard} wrap={true}>
                {/* Equipment header */}
                <View style={styles.equipmentHeader}>
                  <Text style={styles.equipmentName}>
                    {entry.equipo.numero_etiqueta}
                    {entry.equipo.marca || entry.equipo.modelo
                      ? ` - ${[entry.equipo.marca, entry.equipo.modelo]
                          .filter(Boolean)
                          .join(" ")}`
                      : ""}
                  </Text>
                  <Text
                    style={[
                      styles.badge,
                      entry.tipo_trabajo === "correctivo"
                        ? styles.badgeCorrectivo
                        : styles.badgePreventivo,
                    ]}
                  >
                    {entry.tipo_trabajo === "correctivo"
                      ? "CORRECTIVO"
                      : "PREVENTIVO"}
                  </Text>
                </View>

                {/* Free-text fields */}
                {entry.diagnostico && (
                  <>
                    <Text style={styles.fieldLabel}>Diagnostico</Text>
                    <Text style={styles.fieldValue}>{entry.diagnostico}</Text>
                  </>
                )}
                {entry.trabajo_realizado && (
                  <>
                    <Text style={styles.fieldLabel}>Trabajo Realizado</Text>
                    <Text style={styles.fieldValue}>
                      {entry.trabajo_realizado}
                    </Text>
                  </>
                )}
                {entry.observaciones && (
                  <>
                    <Text style={styles.fieldLabel}>Observaciones</Text>
                    <Text style={styles.fieldValue}>
                      {entry.observaciones}
                    </Text>
                  </>
                )}

                {/* Workflow steps */}
                {entry.steps.length > 0 && (
                  <>
                    <Text style={styles.fieldLabel}>
                      Pasos del Flujo de Trabajo
                    </Text>
                    {entry.steps.map((step, sIdx) => (
                      <View key={sIdx}>
                        <View style={styles.stepRow}>
                          <Text style={styles.stepCheck}>
                            {step.completado ? "\u2713" : "\u2717"}
                          </Text>
                          <Text style={styles.stepName}>{step.nombre}</Text>
                        </View>
                        {/* Readings summary */}
                        {step.lecturas &&
                          Object.keys(step.lecturas).length > 0 && (
                            <Text style={styles.stepDetail}>
                              {Object.entries(step.lecturas)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" | ")}
                            </Text>
                          )}
                        {/* Notes */}
                        {step.notas && (
                          <Text style={styles.stepDetail}>
                            Nota: {step.notas}
                          </Text>
                        )}
                      </View>
                    ))}
                  </>
                )}

                {/* Photos */}
                {entry.photosBase64.length > 0 && (
                  <>
                    <Text style={styles.fieldLabel}>
                      Fotos ({entry.photosBase64.length})
                    </Text>
                    <View style={styles.photoGrid}>
                      {entry.photosBase64.map((photo, pIdx) => (
                        <View key={pIdx} style={styles.photoContainer}>
                          <Image
                            src={photo.data}
                            style={styles.photoImage}
                          />
                          <Text style={styles.photoLabel}>
                            {photo.etiqueta || "Foto"}
                            {photo.fecha
                              ? ` - ${new Date(photo.fecha).toLocaleString(
                                  "es-MX",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}`
                              : ""}
                          </Text>
                          {photo.gps && (
                            <Text style={styles.photoLabel}>
                              GPS: {photo.gps}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            ))}
          </>
        )}

        {/* Materials table */}
        {data.materials.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Material Empleado ({data.materials.length})
            </Text>
            <View style={styles.materialsTable}>
              {/* Header row */}
              <View style={styles.materialsHeaderRow}>
                <View style={styles.materialsCellCant}>
                  <Text style={styles.materialsHeaderText}>Cant.</Text>
                </View>
                <View style={styles.materialsCellUnit}>
                  <Text style={styles.materialsHeaderText}>Unidad</Text>
                </View>
                <View style={styles.materialsCellDesc}>
                  <Text style={styles.materialsHeaderText}>Descripcion</Text>
                </View>
              </View>
              {/* Data rows */}
              {data.materials.map((mat, mIdx) => (
                <View key={mIdx} style={styles.materialsDataRow}>
                  <View style={styles.materialsCellCant}>
                    <Text style={styles.materialsCellText}>
                      {mat.cantidad}
                    </Text>
                  </View>
                  <View style={styles.materialsCellUnit}>
                    <Text style={styles.materialsCellText}>{mat.unidad}</Text>
                  </View>
                  <View style={styles.materialsCellDesc}>
                    <Text style={styles.materialsCellText}>
                      {mat.descripcion}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Signature section */}
        {data.firmaBase64 && (
          <>
            <Text style={styles.sectionTitle}>Firma del Encargado</Text>
            <View style={styles.signatureSection}>
              <Image src={data.firmaBase64} style={styles.signatureImage} />
              <View style={styles.signatureLine} />
              {data.nombreEncargado && (
                <Text style={styles.signatureName}>
                  {data.nombreEncargado}
                </Text>
              )}
              <Text style={styles.signatureLabel}>
                Encargado de Sucursal
              </Text>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generado el {generatedDate}
          </Text>
          <Text style={styles.footerText}>OMLEB - Servicios HVAC</Text>
        </View>
      </Page>
    </Document>
  );
}
