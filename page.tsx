"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  X,
  ChevronRight,
  Clock,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
// ---------------------------------------------------------------------------
// mock data — reflects RF-002 columns, RF-003 SLA logic, RF-004 detail fields
// ---------------------------------------------------------------------------

const PRIORITY_META = {
  P1: {
    label: "P1",
    color: "var(--p1)",
    rgb: "226,72,61",
    bg: "rgba(226,72,61,0.12)",
    slaMin: 60,
  },
  P2: {
    label: "P2",
    color: "var(--p2)",
    rgb: "226,138,61",
    bg: "rgba(226,138,61,0.12)",
    slaMin: 120,
  },
  P3: {
    label: "P3",
    color: "var(--p3)",
    rgb: "226,201,61",
    bg: "rgba(226,201,61,0.12)",
    slaMin: 180,
  },
  P4: {
    label: "P4",
    color: "var(--p4)",
    rgb: "107,135,163",
    bg: "rgba(107,135,163,0.12)",
    slaMin: null,
  },
  P5: {
    label: "P5",
    color: "var(--p5)",
    rgb: "91,102,114",
    bg: "rgba(91,102,114,0.12)",
    slaMin: null,
  },
};

function computeIncident(inc: any) {
  const meta = PRIORITY_META[inc.prioridad as keyof typeof PRIORITY_META];
  const now = new Date();
  const inicio = new Date(inc.fechaCreacion);
  const ultimoAvance = new Date(inc.ultimoAvance);

  const tiempoAbierto = Math.floor((now.getTime() - inicio.getTime()) / 60000);

  let proximoAvanceEn = null;
  if (meta?.slaMin) {
    const tiempoDesdeUltimoAvance = Math.floor(
      (now.getTime() - ultimoAvance.getTime()) / 60000,
    );
    proximoAvanceEn = meta.slaMin - tiempoDesdeUltimoAvance;
  }
  return {
    ...inc,
    tiempoAbierto,
    proximoAvanceEn,
    semaforo: inc.semaforo,
  };
}

const SEMAFORO_META = {
  verde: { color: "var(--success)", rgb: "76,159,112", label: "Al día" },
  amarillo: {
    color: "var(--warning)",
    rgb: "217,164,65",
    label: "Próximo a vencer",
  },
  rojo: { color: "var(--danger)", rgb: "217,83,79", label: "Vencido" },
  "sin-avance": {
    color: "var(--text-quaternary)",
    rgb: "91,102,114",
    label: "Sin avance periódico",
  },
};

function fmtMin(mins) {
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.abs(mins) % 60;
  return `${h}h ${m}m`;
}

const SEARCH_FIELDS = ["ci", "hostname", "nodo", "sitio", "olt", "router"];

// ---------------------------------------------------------------------------
// small pieces
// ---------------------------------------------------------------------------
function KpiSegment({ label, value, accent, bordered }: any) {
  return (
    <div
      style={{
        minWidth: 96,
        paddingRight: bordered ? 24 : 0,
        marginRight: bordered ? 24 : 0,
        borderRight: bordered ? "1px solid var(--border-subtle)" : "none",
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 24,
          fontWeight: 700,
          color: accent || "var(--text-primary)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent }) {
  return (
    <div
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "14px 16px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 10.5,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 24,
          fontWeight: 500,
          color: accent || "var(--text-primary)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PriorityBadge({ prio }: any) {
  const m = PRIORITY_META[prio];
  const critica = prio === "P1" || prio === "P2" || prio === "P3";
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11.5,
        fontWeight: 600,
        color: m.color,
        background: m.bg,
        padding: "2px 8px",
        borderRadius: 4,
        border: `1px solid rgba(${m.rgb}, 0.25)`,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {critica && <AlertTriangle size={11} />}
      {m.label}
    </span>
  );
}
function SemaforoDot({ estado, proximoAvanceEn }) {
  const m = SEMAFORO_META[estado];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: m.color,
          flexShrink: 0,
          boxShadow:
            estado === "rojo" ? `0 0 0 3px rgba(${m.rgb}, 0.19)` : "none",
        }}
      />
      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
        {proximoAvanceEn === null
          ? m.label
          : proximoAvanceEn >= 0
            ? `vence en ${fmtMin(proximoAvanceEn)}`
            : `vencido hace ${fmtMin(proximoAvanceEn)}`}
      </span>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 10.5,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--text-tertiary)",
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: "#DCE1E6" }}>{value}</div>
    </div>
  );
}

// RF-004: vista detallada -----------------------------------------------------

function DetailPanel({ incident, onClose, onFindRelated }: any) {
  if (!incident) return null;

  const fmtFecha = (f: string | null) =>
    f ? new Date(f).toLocaleString("es-ES") : "No registrado";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 460,
        background: "var(--surface-1)",
        borderLeft: "1px solid var(--border)",
        padding: "22px 24px",
        overflowY: "auto",
        zIndex: 20,
        boxShadow: "-12px 0 32px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 18,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--accent)",
            }}
          >
            {incident.ticketNumber}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 16,
              fontWeight: 600,
              marginTop: 4,
              maxWidth: 360,
            }}
          >
            {incident.descripcion}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-tertiary)",
            cursor: "pointer",
            padding: 4,
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div
        style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}
      >
        {incident.prioridad && <PriorityBadge prio={incident.prioridad} />}
        <span
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            padding: "2px 8px",
            borderRadius: 4,
            border: "1px solid var(--border)",
          }}
        >
          {incident.estado}
        </span>
        <span
          style={{
            fontSize: 12,
            padding: "2px 8px",
            borderRadius: 4,
            color: incident.resuelto ? "var(--success)" : "var(--warning)",
            border: `1px solid ${incident.resuelto ? "var(--success)" : "var(--warning)"}40`,
          }}
        >
          {incident.resuelto ? "Resuelto" : "En curso"}
        </span>
      </div>

      {/* próximo avance - destacado */}
      <div
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 20,
          fontSize: 12.5,
        }}
      >
        {incident.proximoAvanceMinutos === null ||
        incident.proximoAvanceMinutos === undefined ? (
          <span style={{ color: "var(--text-tertiary)" }}>
            Esta prioridad no requiere avances periódicos.
          </span>
        ) : incident.proximoAvanceMinutos >= 0 ? (
          <span style={{ color: "var(--success)" }}>
            Próximo avance en {fmtMin(incident.proximoAvanceMinutos)}
          </span>
        ) : (
          <span style={{ color: "var(--danger)" }}>
            Avance vencido hace {fmtMin(incident.proximoAvanceMinutos)}
          </span>
        )}
      </div>

      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 12,
        }}
      >
        Información general
      </div>
      <DetailRow
        label="Fecha de inicio del incidente"
        value={
          incident.fechaInicioIncidente
            ? (() => {
                const texto = new Date(
                  incident.fechaInicioIncidente,
                ).toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
                const capitalizado =
                  texto.charAt(0).toUpperCase() + texto.slice(1);
                const hora = new Date(
                  incident.fechaInicioIncidente,
                ).toLocaleTimeString("es-ES");
                return `${capitalizado} a las ${hora}`;
              })()
            : "No registrado"
        }
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0 16px",
        }}
      >
        <DetailRow
          label="Grupo asignado"
          value={incident.grupoAsignacion || "—"}
        />
        <DetailRow
          label="Responsable"
          value={incident.asignadoA || "Sin asignar"}
        />
        <DetailRow label="Zona" value={incident.zona || "—"} />
        <DetailRow
          label="Distribución interna"
          value={incident.distribucionInterna || "—"}
        />
        <DetailRow
          label="Servicios afectados"
          value={
            incident.serviciosAfectados?.length
              ? incident.serviciosAfectados.join(", ")
              : "Ninguno"
          }
        />
        <DetailRow
          label="CI afectados"
          value={
            incident.ciAfectados?.length
              ? incident.ciAfectados.join(", ")
              : "Ninguno"
          }
        />
        <DetailRow
          label="Clientes residenciales afectados"
          value={incident.afectacionResidencial ?? 0}
        />
        <DetailRow
          label="Empresas afectadas"
          value={incident.afectacionEmpresa ?? 0}
        />
      </div>

      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 12,
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        Línea de tiempo
      </div>
      <DetailRow
        label="Ticket creado"
        value={fmtFecha(incident.fechaCreacionTicket)}
      />
      <DetailRow
        label="Aviso Inicio Express enviado"
        value={
          incident.fechaInicioExpress
            ? `Sí — ${fmtFecha(incident.fechaInicioExpress)}`
            : "No registrado"
        }
      />
      <DetailRow
        label="Aviso de Inicio (confirma falla)"
        value={
          incident.fechaInicioFalla
            ? `Sí — ${fmtFecha(incident.fechaInicioFalla)}`
            : "No registrado"
        }
      />
      <DetailRow
        label="ETA (fecha estimada solución)"
        value={fmtFecha(incident.fechaEstimadaSolucion)}
      />
      <DetailRow
        label="Fecha de cierre"
        value={
          incident.resuelto ? fmtFecha(incident.fechaCierre) : "Aún no resuelto"
        }
      />

      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 12,
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        Diagnóstico
      </div>
      <DetailRow
        label="Diagnóstico / observación NOC"
        value={incident.diagnostico || "Sin información"}
      />

      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 12,
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        Historial ({incident.historial?.length || 0})
      </div>
      <div style={{ position: "relative", paddingLeft: 16 }}>
        {(!incident.historial || incident.historial.length === 0) && (
          <div style={{ fontSize: 12.5, color: "var(--text-quaternary)" }}>
            Sin avances registrados todavía.
          </div>
        )}
        {incident.historial?.length > 0 && (
          <div
            style={{
              position: "absolute",
              left: 3,
              top: 4,
              bottom: 4,
              width: 1,
              background: "var(--border)",
            }}
          />
        )}
        {incident.historial?.map((h: any, idx: number) => (
          <div key={idx} style={{ position: "relative", marginBottom: 14 }}>
            <span
              style={{
                position: "absolute",
                left: -16,
                top: 3,
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--accent)",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span
                style={{ fontSize: 12.5, color: "#DCE1E6", fontWeight: 500 }}
              >
                {h.tipo}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-quaternary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {new Date(h.fecha).toLocaleString("es-ES")}
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-tertiary)",
                marginTop: 2,
              }}
            >
              {h.comentario}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onFindRelated(incident)}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(47,191,159,0.22)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(47,191,159,0.14)")
        }
        style={{
          marginTop: 20,
          width: "100%",
          background: "rgba(47,191,159,0.14)",
          border: "1px solid var(--accent)",
          color: "var(--accent)",
          borderRadius: 8,
          padding: "10px 0",
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          transition: "background 0.15s ease",
        }}
      >
        <Search size={13} /> Buscar incidentes relacionados
      </button>
    </div>
  );
}

// RF-005: búsqueda de incidentes relacionados --------------------------------

function RelatedSearchPanel({ open, onClose, incidents, seedIncident }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (seedIncident) setQuery(seedIncident.ci);
  }, [seedIncident]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return incidents.filter(
      (i) =>
        SEARCH_FIELDS.some((f) => (i[f] || "").toLowerCase().includes(q)) ||
        i.descripcion.toLowerCase().includes(q),
    );
  }, [query, incidents]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,8,11,0.6)",
        zIndex: 30,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 90,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
          maxHeight: "70vh",
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <Search size={16} color="var(--text-tertiary)" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por CI, hostname, nodo, sitio, OLT, router o palabra clave..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: 13.5,
              fontFamily: "var(--font-body)",
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-quaternary)",
            marginBottom: 10,
          }}
        >
          Objetivo: evitar la creación de incidentes duplicados sobre el mismo
          elemento de red.
        </div>
        <div
          style={{
            overflowY: "auto",
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: 8,
          }}
        >
          {query.trim() && results.length === 0 && (
            <div
              style={{
                color: "var(--text-quaternary)",
                fontSize: 13,
                padding: "16px 4px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertCircle size={14} /> Sin coincidencias — no hay incidentes
              relacionados registrados.
            </div>
          )}
          {results.map((i) => (
            <div
              key={i.ticketNumber}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 4px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--accent)",
                    }}
                  >
                    {i.ticketNumber}
                  </span>
                  <PriorityBadge prio={i.prioridad} />
                </div>
                <div style={{ fontSize: 12.5, color: "#C9D0D8", marginTop: 3 }}>
                  {i.descripcion}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-quaternary)",
                    marginTop: 2,
                  }}
                >
                  {i.ci} · {i.sitio}
                </div>
              </div>
              <ChevronRight size={15} color="var(--text-quaternary)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function CORDashboard() {
  const [nowMin, setNowMin] = useState(0);
  const [clock, setClock] = useState<Date | null>(null);
  const [selected, setSelected] = useState(null);
  const [filtroPrioridad, setFiltroPrioridad] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchSeed, setSearchSeed] = useState(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailIncident, setDetailIncident] = useState<any>(null);

  const incidentsConCalculo = useMemo(
    () => incidents.map((i) => computeIncident(i)),
    [incidents],
  );
  const incidentesOrdenados = useMemo(() => {
    const rankPrioridad = (p: string) =>
      parseInt((p || "P9").replace("P", ""), 10);

    return [...incidentsConCalculo].sort((a, b) => {
      const diffPrioridad =
        rankPrioridad(a.prioridad) - rankPrioridad(b.prioridad);
      if (diffPrioridad !== 0) return diffPrioridad;

      const aTienePlazo =
        a.proximoAvanceEn !== null && a.proximoAvanceEn !== undefined;
      const bTienePlazo =
        b.proximoAvanceEn !== null && b.proximoAvanceEn !== undefined;

      // ambos sin plazo (P4/P5): más nuevo primero
      if (!aTienePlazo && !bTienePlazo) {
        return (
          new Date(b.fechaCreacion).getTime() -
          new Date(a.fechaCreacion).getTime()
        );
      }

      // uno tiene plazo y el otro no: el que tiene plazo (P1-P3) va primero
      if (aTienePlazo && !bTienePlazo) return -1;
      if (!aTienePlazo && bTienePlazo) return 1;
      console.log(
        "ejemplo P4:",
        incidentsConCalculo.find((i) => i.prioridad === "P4"),
      );
      // ambos con plazo: más próximo a vencer primero
      return a.proximoAvanceEn - b.proximoAvanceEn;
    });
  }, [incidentsConCalculo]);

  useEffect(() => {
    fetch("http://localhost:8080/api/incidentes")
      .then((res) => res.json())
      .then((data) => {
        setIncidents(data);
        setLoading(false);
      })
      .catch((error) => console.error("Error fetching incidents:", error));
  }, []);

  useEffect(() => {
    setClock(new Date());
    const iv = setInterval(() => {
      setNowMin((m) => m + 1);
    }, 3000);
    return () => clearInterval(iv);
  }, []);
  const filasVisibles = filtroPrioridad
    ? incidentesOrdenados.filter((i) => i.prioridad === filtroPrioridad)
    : incidentesOrdenados;

  const abiertos = incidents.length;
  const porPrioridad = ["P1", "P2", "P3", "P4"].map(
    (p) => incidents.filter((i) => i.prioridad === p).length,
  );
  const avancesVencidos = incidents.filter((i) => i.semaforo === "rojo").length;
  const avancesPendientes = incidents.filter(
    (i) => i.semaforo === "amarillo",
  ).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--surface-0)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
        padding: "26px 30px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500;600&display=swap');
        table { border-collapse: collapse; width: 100%; }
        th, td { text-align: left; }
        tbody tr:hover { background: var(--surface-2); cursor: pointer; }
      `}</style>

      {/* header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 22,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 18,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              COR
            </span>
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
              Centro de Operaciones · Capa de seguimiento sobre ServiceNow
            </span>
            <nav style={{ display: "flex", gap: 16 }}>
              <Link
                href="/"
                style={{
                  color: "var(--text-primary)",
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                Dashboard
              </Link>
              <Link
                href="/nodos"
                style={{
                  color: "var(--text-tertiary)",
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                Nodos
              </Link>
            </nav>
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-quaternary)",
              marginTop: 4,
              fontFamily: "var(--font-mono)",
            }}
          >
            {clock
              ? clock.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : ""}{" "}
            · {clock ? clock.toLocaleTimeString("es-ES") : ""}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => {
              setSearchSeed(null);
              setSearchOpen(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "7px 12px",
              color: "var(--text-secondary)",
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            <Search size={13} /> Buscar relacionados
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--accent)",
                boxShadow: "0 0 0 4px rgba(47,191,159,0.18)",
              }}
            />
            <span
              style={{
                fontSize: 11.5,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
              }}
            >
              Monitoreo en vivo · Operador Nivel 2
            </span>
          </div>
        </div>
      </div>

      <div
        className={
          "w-full flex flex-col lg:flex-row gap-6 mt-6 transition-all duration-300 " +
          (selected ? "w-full lg:w-2/3" : "w-full")
        }
      >
        <div className="w-full flex-row lg:w-2/3">
          {/* FILA 1: * Tarjetas KPI Incidentes*/}

          <div className="w-full flex flex-col lg:flex-row gap-6 mt-6">
            {/* Tarjeta Volumen */}
            <div
              style={{
                justifySelf: "end",
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                  marginBottom: 14,
                }}
              >
                Volumen
              </div>
              <div style={{ display: "flex" }}>
                <KpiSegment
                  label="Incidentes abiertos"
                  value={abiertos}
                  bordered
                />
                <KpiSegment
                  label="Cerrados hoy"
                  value="14"
                  accent="var(--success)"
                />
              </div>
            </div>
            {/* Tarjeta x Prioridad */}
            <div
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                  marginBottom: 14,
                }}
              >
                Por prioridad
              </div>
              <div style={{ display: "flex" }}>
                <KpiSegment
                  label="P1"
                  value={porPrioridad[0]}
                  accent="var(--p1)"
                  bordered
                />
                <KpiSegment
                  label="P2"
                  value={porPrioridad[1]}
                  accent="var(--p2)"
                  bordered
                />
                <KpiSegment
                  label="P3"
                  value={porPrioridad[2]}
                  accent="var(--p3)"
                  bordered
                />
                <KpiSegment
                  label="P4"
                  value={porPrioridad[3]}
                  accent="var(--p4)"
                />
              </div>
            </div>
            {/* Tarjeta SLA de avances */}
            <div
              style={{
                justifySelf: "start",
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                  marginBottom: 14,
                }}
              >
                SLA de avances
              </div>
              <div style={{ display: "flex" }}>
                <KpiSegment
                  label="Avances pendientes"
                  value={avancesPendientes}
                  accent="var(--warning)"
                  bordered
                />
                <KpiSegment
                  label="Avances vencidos"
                  value={avancesVencidos}
                  accent="var(--danger)"
                />
              </div>
            </div>
          </div>
          {/* FILA 2: TABLA INCIDENTES*/}
          <div className="w-full flex flex-col lg:flex-row gap-6 mt-6">
            <div
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "18px 20px",
              }}
            >
              {/*  ENCABEZADO TABLA */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  Registro de Fallas
                </span>
                <span
                  style={{ fontSize: 11.5, color: "var(--text-quaternary)" }}
                >
                  {incidents.length} incidentes activos · clic en una fila para
                  ver detalle
                </span>
              </div>
              {/*  FILTROS TABLA */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {["P1", "P2", "P3", "P4", "P5"].map((p) => (
                  <button
                    key={p}
                    onClick={() =>
                      setFiltroPrioridad(filtroPrioridad === p ? null : p)
                    }
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: 20,
                      cursor: "pointer",
                      color:
                        filtroPrioridad === p
                          ? "var(--surface-0)"
                          : PRIORITY_META[p].color,
                      background:
                        filtroPrioridad === p
                          ? PRIORITY_META[p].color
                          : PRIORITY_META[p].bg,
                      border: `1px solid rgba(${PRIORITY_META[p].rgb}, 0.4)`,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {p}
                  </button>
                ))}
                {filtroPrioridad && (
                  <button
                    onClick={() => setFiltroPrioridad(null)}
                    style={{
                      fontSize: 11.5,
                      padding: "4px 10px",
                      borderRadius: 20,
                      cursor: "pointer",
                      color: "var(--text-tertiary)",
                      background: "transparent",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Limpiar
                  </button>
                )}
              </div>
              {/*  TABLA INCIDENTES */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ fontSize: 12.5 }}>
                  <thead>
                    <tr
                      style={{
                        color: "var(--text-tertiary)",
                        fontSize: 10.5,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      <th style={{ padding: "0 14px 10px 0" }}>Ticket</th>
                      <th style={{ padding: "0 14px 10px 0" }}>Descripción</th>
                      <th style={{ padding: "0 14px 10px 0" }}>Prioridad</th>
                      <th style={{ padding: "0 14px 10px 0" }}>Zona</th>
                      <th style={{ padding: "0 14px 10px 0" }}>Grupo</th>
                      <th style={{ padding: "0 14px 10px 0" }}>Asignado a</th>
                      <th style={{ padding: "0 14px 10px 0" }}>
                        Tiempo abierto
                      </th>
                      <th style={{ padding: "0 14px 10px 0" }}>
                        Próximo avance
                      </th>
                      <th style={{ padding: "0 0 10px 0" }}>CI afectado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasVisibles.map((i) => (
                      <tr
                        key={i.ticketNumber}
                        style={{ borderTop: "1px solid var(--border-subtle)" }}
                        onClick={() => {
                          setSelected(i);
                          fetch(`http://localhost:8080/api/incidentes/${i.id}`)
                            .then((res) => res.json())
                            .then((data) => setDetailIncident(data))
                            .catch((err) =>
                              console.error("Error cargando detalle:", err),
                            );
                        }}
                      >
                        <td
                          style={{
                            padding: "10px 14px 10px 0",
                            fontFamily: "var(--font-mono)",
                            color: "var(--accent)",
                          }}
                        >
                          {i.ticketNumber}
                        </td>
                        <td
                          style={{
                            padding: "10px 14px 10px 0",
                            color: "#C9D0D8",
                            maxWidth: 240,
                          }}
                        >
                          {i.descripcion}
                        </td>
                        <td style={{ padding: "10px 14px 10px 0" }}>
                          <PriorityBadge prio={i.prioridad} />
                        </td>
                        <td
                          style={{
                            padding: "10px 14px 10px 0",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {i.zona}
                        </td>
                        <td
                          style={{
                            padding: "10px 14px 10px 0",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {i.grupoAsignacion}
                        </td>
                        <td style={{ padding: "10px 14px 10px 0" }}>
                          {i.asignadoUsuario ? (
                            <span style={{ color: "var(--text-secondary)" }}>
                              {i.asignadoUsuario}
                            </span>
                          ) : i.prioridad === "P1" ||
                            i.prioridad === "P2" ||
                            i.prioridad === "P3" ? (
                            <span
                              style={{
                                color: "var(--warning)",
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              Sin asignar
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-quaternary)" }}>
                              Sin asignar
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "10px 14px 10px 0",
                            fontFamily: "var(--font-mono)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {fmtMin(i.tiempoAbierto)}
                        </td>
                        <td style={{ padding: "10px 14px 10px 0" }}>
                          <SemaforoDot
                            estado={i.semaforo}
                            proximoAvanceEn={i.proximoAvanceEn}
                          />
                        </td>
                        <td
                          style={{
                            padding: "10px 0",
                            fontFamily: "var(--font-mono)",
                            color: "var(--text-quaternary)",
                          }}
                        >
                          {i.ci}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <div className="w-full lg:w-1/3 transition-all duration-300">
          <DetailPanel
            incident={detailIncident}
            onClose={() => {
              setSelected(null);
              setDetailIncident(null);
            }}
            onFindRelated={(inc) => {
              setSearchSeed(inc);
              setSearchOpen(true);
            }}
          />
        </div>
      )}

      <RelatedSearchPanel
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        incidents={incidents}
        seedIncident={searchSeed}
      />
      {/* FOOTER */}
      <div
        style={{
          marginTop: 14,
          fontSize: 11.5,
          color: "var(--text-quaternary)",
        }}
      >
        Cubre RF-001, RF-002, RF-003, RF-004 y RF-005 del MVP. Login
        (autenticación local) y KPIs operacionales (RF-006) quedan como
        siguiente paso.
      </div>
    </div>
  );
}
