"use client";

import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useState } from "react";

export default function ClothingViewerModal({
  open,
  clothing,
  onClose,
  onDelete,
}: any) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setZoom(1);
  }, [open, clothing?.id]);

  if (!open || !clothing) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(16px)",
        zIndex: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "900px",
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 60px 160px rgba(0,0,0,0.9)",
          maxHeight: "90vh",
        }}
      >
        {/* IMAGEN */}
        <div
          style={{
            position: "relative",
            background: "var(--surface-4)",
            minHeight: "500px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "auto",
          }}
        >
          <img
            src={clothing.image}
            alt={clothing.title}
            style={{
              maxHeight: zoom === 1 ? "80vh" : "none",
              maxWidth: zoom === 1 ? "100%" : "none",
              width: zoom === 1 ? "auto" : `${Math.round(70 * zoom)}%`,
              objectFit: "contain",
              padding: "24px",
              transformOrigin: "center",
              transition: "width 0.18s ease, max-width 0.18s ease, max-height 0.18s ease",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "24px",
              bottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "12px",
              background: "rgba(14,14,15,0.78)",
              border: "1px solid var(--border-subtle)",
              backdropFilter: "blur(10px)",
            }}
          >
            <button
              onClick={() => setZoom((value) => Math.max(1, Number((value - 0.25).toFixed(2))))}
              aria-label="Alejar imagen"
              style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "var(--surface-3)", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <ZoomOut size={16} />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              aria-label="Zoom de imagen"
              style={{ width: "120px", accentColor: "var(--gold)" }}
            />
            <button
              onClick={() => setZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))))}
              aria-label="Acercar imagen"
              style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "var(--surface-3)", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => setZoom(1)}
              aria-label="Restablecer zoom"
              style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "var(--surface-3)", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* INFO PANEL */}
        <div
          style={{
            padding: "36px 28px",
            borderLeft: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "0",
            minHeight: 0,
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "var(--gold-dim) transparent",
          }}
        >
          {/* CERRAR */}
          <button
            onClick={onClose}
            style={{
              alignSelf: "flex-end",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "var(--surface-4)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "32px",
            }}
          >
            ×
          </button>

          {/* CATEGORIA */}
          <div
            style={{
              fontSize: "9px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--gold-dim)",
              marginBottom: "10px",
              fontFamily: "var(--font-body)",
            }}
          >
            {clothing.category}
          </div>

          {/* TITULO */}
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "32px",
              fontWeight: 300,
              lineHeight: 1.15,
              color: "var(--text-primary)",
              marginBottom: "24px",
            }}
          >
            {clothing.title}
          </h2>

          {/* DIVISOR */}
          <div style={{ width: "32px", height: "1px", background: "var(--gold)", marginBottom: "24px" }} />

          {/* META */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
            {[
              { label: "Categoría",  value: clothing.category        },
              { label: "Tipo",       value: clothing.type    || "—"  },
              { label: "Color",      value: clothing.color   || "—"  },
              { label: "Estilo",     value: clothing.style   || "—"  },
              { label: "Temporada",  value: clothing.season  || "—"  },
            ].map((item) => (
              <div key={item.label}>
                <div
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "3px",
                  }}
                >
                  {item.label}
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 300 }}>
                  {item.value}
                </div>
              </div>
            ))}

            {[
              { label: "Tela", value: clothing.fabric },
              { label: "Silueta", value: clothing.fit },
              { label: "Ocasion", value: clothing.occasion },
              { label: "Formalidad", value: clothing.formality },
            ].filter((item) => item.value).map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "3px" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 300 }}>
                  {item.value}
                </div>
              </div>
            ))}

            {(clothing.description || clothing.details) && (
              <div>
                <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
                  Descripcion
                </div>
                {clothing.description && (
                  <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 300, lineHeight: 1.5, marginBottom: "8px" }}>
                    {clothing.description}
                  </div>
                )}
                {clothing.details && (
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 300, lineHeight: 1.5 }}>
                    {clothing.details}
                  </div>
                )}
              </div>
            )}

            {/* TAGS */}
            {clothing.tags && clothing.tags.length > 0 && (
              <div>
                <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Tags
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {clothing.tags.map((tag: string) => (
                    <span key={tag} style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", color: "var(--gold-dim)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* BOTONES */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>

            {/* CREAR OUTFIT */}
            <button
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid var(--gold-dim)",
                borderRadius: "8px",
                padding: "14px",
                color: "var(--gold)",
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                fontWeight: 400,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = "rgba(201,168,76,0.1)";
                el.style.borderColor = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = "transparent";
                el.style.borderColor = "var(--gold-dim)";
              }}
            >
              Crear Outfit
            </button>

            {/* ELIMINAR */}
            <button
              onClick={() => {
                if (confirm(`¿Eliminar "${clothing.title}"?`)) {
                  onDelete(clothing);
                }
              }}
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "8px",
                padding: "14px",
                color: "#FCA5A5",
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                fontWeight: 400,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              Eliminar prenda
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
