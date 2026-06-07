"use client";

import { Plus } from "lucide-react";

export default function AddClothingButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: "32px",
        right: "32px",
        width: "62px",
        height: "62px",
        borderRadius: "18px",
        background: "var(--gold-gradient)",
        border: "1px solid rgba(255,255,255,0.18)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 14px 42px rgba(201,168,76,0.34), 0 0 0 8px rgba(201,168,76,0.06)",
        transition: "all 0.25s ease",
        zIndex: 100,
        color: "var(--surface)",
        fontSize: "24px",
        fontWeight: 300,
        lineHeight: 1,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = "translateY(-3px) scale(1.04)";
        el.style.boxShadow = "0 18px 56px rgba(201,168,76,0.52), 0 0 0 10px rgba(201,168,76,0.08)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = "translateY(0) scale(1)";
        el.style.boxShadow = "0 14px 42px rgba(201,168,76,0.34), 0 0 0 8px rgba(201,168,76,0.06)";
      }}
      aria-label="Agregar prenda"
    >
      <Plus size={28} strokeWidth={1.8} />
    </button>
  );
}
