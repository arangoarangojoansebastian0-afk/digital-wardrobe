"use client";

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
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        background: "var(--gold)",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 32px rgba(201,168,76,0.35)",
        transition: "all 0.25s ease",
        zIndex: 100,
        color: "var(--surface)",
        fontSize: "24px",
        fontWeight: 300,
        lineHeight: 1,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = "scale(1.1)";
        el.style.boxShadow = "0 12px 48px rgba(201,168,76,0.5)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = "scale(1)";
        el.style.boxShadow = "0 8px 32px rgba(201,168,76,0.35)";
      }}
      aria-label="Agregar prenda"
    >
      +
    </button>
  );
}
