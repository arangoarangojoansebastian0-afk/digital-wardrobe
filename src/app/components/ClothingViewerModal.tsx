"use client";

import Image from "next/image";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useState } from "react";

type ClothingViewerModalClothing = {
  id: string | number;
  title?: string | null;
  category?: string | null;
  image?: string | null;
  type?: string | null;
  color?: string | null;
  style?: string | null;
  season?: string | null;
  fabric?: string | null;
  fit?: string | null;
  occasion?: string | null;
  formality?: string | null;
  description?: string | null;
  details?: string | null;
  tags?: string[] | null;
};

type ClothingViewerModalProps = {
  open: boolean;
  clothing: ClothingViewerModalClothing | null;
  onClose: () => void;
  onDelete: (item: ClothingViewerModalClothing) => void;
  onCreateOutfit?: (item: ClothingViewerModalClothing) => void;
};

export default function ClothingViewerModal(props: ClothingViewerModalProps) {
  if (!props.open || !props.clothing) return null;

  return (
    <ClothingViewerModalContent
      key={`${props.open ? "open" : "closed"}-${String(props.clothing.id ?? "unknown")}`}
      {...props}
    />
  );
}

function ClothingViewerModalContent({
  clothing,
  onClose,
  onDelete,
  onCreateOutfit,
}: ClothingViewerModalProps) {

  const [zoom, setZoom] = useState(1);

  const [position, setPosition] = useState({ x: 0, y: 0 });

  const [dragging, setDragging] = useState(false);

  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

  const [isMobile, setIsMobile] = useState(false);


  useEffect(() => {

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };

  }, []);


  useEffect(() => {

    const stopDragging = () => {
      setDragging(false);
    };

    window.addEventListener(
      "mouseup",
      stopDragging
    );

    // También detenemos el arrastre si levantan el dedo fuera de la pantalla
    window.addEventListener(
      "touchend",
      stopDragging
    );

    return () => {

      window.removeEventListener(
        "mouseup",
        stopDragging
      );

      window.removeEventListener(
        "touchend",
        stopDragging
      );

    };

  }, []);


  const handleWheel = (
    e: React.WheelEvent
  ) => {

    e.preventDefault();

    setZoom((current) => {

      const next =
        e.deltaY < 0
          ? current + 0.15
          : current - 0.15;

      return Math.min(
        3,
        Math.max(1, next)
      );
    });
  };


  const handleMouseDown = (
    e: React.MouseEvent
  ) => {

    if (zoom <= 1) return;

    if (e.button !== 0) return;

    setDragging(true);

    setStartDrag({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });

  };


  const handleMouseMove = (
    e: React.MouseEvent
  ) => {

    if (!dragging) return;

    setPosition({
      x: e.clientX - startDrag.x,
      y: e.clientY - startDrag.y,
    });
  };


  const handleMouseUp = () => {

    setDragging(false);
  };


  // --- NUEVAS FUNCIONES PARA EL CELL ---

  const handleTouchStart = (
    e: React.TouchEvent
  ) => {

    if (zoom <= 1) return;

    setDragging(true);

    // En móviles se lee el primer punto de contacto táctil [0]
    const touch = e.touches[0];

    setStartDrag({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };


  const handleTouchMove = (
    e: React.TouchEvent
  ) => {

    if (!dragging) return;

    const touch = e.touches[0];

    setPosition({
      x: touch.clientX - startDrag.x,
      y: touch.clientY - startDrag.y,
    });
  };


  const handleTouchEnd = () => {

    setDragging(false);
  };


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
        padding: isMobile ? "0px" : "24px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "900px",
          display: isMobile ? "flex" : "grid",
          flexDirection: isMobile ? "column" : undefined,
          gridTemplateColumns: isMobile ? undefined : "1fr 280px",
          background: "var(--surface-2)",
          border: isMobile ? "none" : "1px solid var(--border)",
          borderRadius: isMobile ? "0px" : "16px",
          overflow: "hidden",
          boxShadow: "0 60px 160px rgba(0,0,0,0.9)",
          height: isMobile ? "100vh" : "auto",
          maxHeight: isMobile ? "100vh" : "90vh",
        }}
      >
        {/* IMAGEN CON LOS EVENTOS DE CELULAR AÑADIDOS */}
        <div
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position: "relative",
            background: "var(--surface-4)",
            height: isMobile ? "42vh" : "80vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
            cursor:
              zoom > 1
                ? dragging
                  ? "grabbing"
                  : "grab"
                : "default",
            touchAction: zoom > 1 ? "none" : "auto", // IMPORTANTE: Evita que el navegador del cel recargue o haga scroll nativo al arrastrar la prenda
          }}
        >
          <Image
            src={clothing.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='54' height='54'%3E%3Crect width='54' height='54' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%23666'%3Eimagen%3C/text%3E%3C/svg%3E"}
            alt={clothing.title || "Prenda"}
            fill
            draggable={false}
            sizes="(max-width: 768px) 100vw, 70vw"
            style={{
              objectFit: "contain",
              padding: isMobile ? "16px" : "24px",
              pointerEvents: "none",
              userSelect: "none",
              transformOrigin: "center",
              transform: `
                translate(
                  ${position.x}px,
                  ${position.y}px
                )
                scale(${zoom})
              `,
              transition:
                dragging
                  ? "none"
                  : "transform 0.18s ease",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: isMobile ? "16px" : "24px",
              bottom: isMobile ? "16px" : "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "12px",
              background: "rgba(14,14,15,0.78)",
              border: "1px solid var(--border-subtle)",
              backdropFilter: "blur(10px)",
              transform: isMobile ? "scale(0.9)" : "scale(1)",
              transformOrigin: "left bottom",
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
              style={{ width: isMobile ? "90px" : "120px", accentColor: "var(--gold)" }}
            />
            <button
              onClick={() => setZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))))}
              aria-label="Acercar imagen"
              style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "var(--surface-3)", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPosition({
                  x: 0,
                  y: 0,
                });
              }}
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
            padding: isMobile ? "24px 20px" : "36px 28px",
            borderLeft: isMobile ? "none" : "1px solid var(--border-subtle)",
            borderTop: isMobile ? "1px solid var(--border-subtle)" : "none",
            display: "flex",
            flexDirection: "column",
            gap: "0",
            minHeight: 0,
            maxHeight: isMobile ? "58vh" : "80vh",
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
              marginBottom: isMobile ? "16px" : "32px",
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
              fontSize: isMobile ? "26px" : "32px",
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
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, marginBottom: "30px" }}>
            
            <div>
              <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "3px" }}>
                Categoría
              </div>
              <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 300 }}>
                {clothing.category}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "3px" }}>
                Tipo
              </div>
              <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 300 }}>
                {clothing.type || "—"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "3px" }}>
                Color
              </div>
              <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 300 }}>
                {clothing.color || "—"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "3px" }}>
                Estilo
              </div>
              <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 300 }}>
                {clothing.style || "—"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "3px" }}>
                Temporada
              </div>
              <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 300 }}>
                {clothing.season || "—"}
              </div>
            </div>

            {clothing.fabric && (
              <div>
                <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "3px" }}>
                  Tela
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 300 }}>
                  {clothing.fabric}
                </div>
              </div>
            )}

            {clothing.fit && (
              <div>
                <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "3px" }}>
                  Silueta
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 300 }}>
                  {clothing.fit}
                </div>
              </div>
            )}

            {clothing.occasion && (
              <div>
                <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "3px" }}>
                  Ocasion
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 300 }}>
                  {clothing.occasion}
                </div>
              </div>
            )}

            {clothing.formality && (
              <div>
                <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "3px" }}>
                  Formalidad
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 300 }}>
                  {clothing.formality}
                </div>
              </div>
            )}

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
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto", paddingBottom: isMobile ? "12px" : "0px" }}>

            <button
              type="button"
              onClick={() => {
                if (typeof onCreateOutfit === "function") {
                  onCreateOutfit(clothing);
                }
                onClose();
              }}
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