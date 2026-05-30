"use client";

import type { ChangeEvent } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onUrl: () => void;
};

type UploadOption = {
  icon: string;
  label: string;
  sub: string;
  type: "file" | "camera";
  capture?: "environment" | "user";
};

const options: UploadOption[] = [
  {
    icon: "↑",
    label: "Subir archivo",
    sub: "Desde tu dispositivo",
    type: "file",
    capture: undefined,
  },
  {
    icon: "◎",
    label: "Cámara",
    sub: "Tomar una foto",
    type: "camera",
    capture: "environment",
  },
];

export default function UploadMenu({
  open,
  onClose,
  onFileSelect,
  onUrl,
}: Props) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "var(--surface-2)",
          borderTop: "1px solid var(--border)",
          borderLeft: "1px solid var(--border-subtle)",
          borderRight: "1px solid var(--border-subtle)",
          borderRadius: "20px 20px 0 0",
          padding: "32px 28px 40px",
          animation: "slideUp 0.3s ease",
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "24px",
                fontWeight: 300,
                fontStyle: "italic",
                color: "var(--text-primary)",
              }}
            >
              Agregar prenda
            </div>
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              Elige cómo subir
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "var(--surface-4)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* OPCIONES */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {options.map((opt) => (
            <label
              key={opt.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                background: "var(--surface-3)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "12px",
                padding: "18px 20px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLLabelElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLLabelElement).style.background = "var(--surface-4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLLabelElement).style.borderColor = "var(--border-subtle)";
                (e.currentTarget as HTMLLabelElement).style.background = "var(--surface-3)";
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  color: "var(--gold)",
                  flexShrink: 0,
                }}
              >
                {opt.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "var(--text-primary)",
                  }}
                >
                  {opt.label}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {opt.sub}
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                capture={opt.capture}
                onChange={onFileSelect}
                style={{ display: "none" }}
              />
            </label>
          ))}

          {/* URL */}
          <button
            onClick={onUrl}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              background: "var(--surface-3)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              padding: "18px 20px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s ease",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-3)";
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                color: "var(--gold)",
                flexShrink: 0,
              }}
            >
              ⌁
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)" }}>
                URL de imagen
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Desde internet
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
