"use client";

import ProcessedClothingImage from "./ProcessedClothingImage";

export default function ClothingCard({
  title,
  category,
  image,
  onClick,
}: any) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface-3)",
        borderRadius: "4px",
        overflow: "hidden",
        border: "1px solid var(--border-subtle)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.border = "1px solid var(--border)";
        el.style.transform = "translateY(-4px)";
        el.style.boxShadow = "0 20px 60px rgba(0,0,0,0.5)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.border = "1px solid var(--border-subtle)";
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
      }}
    >
      {/* IMAGEN */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "280px",
          background: "var(--surface-4)",
          overflow: "hidden",
        }}
      >
        <ProcessedClothingImage src={image} alt={title} />

        {/* OVERLAY HOVER */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(14,14,15,0.8) 0%, transparent 50%)",
            opacity: 0,
            transition: "opacity 0.3s ease",
          }}
          className="card-overlay"
        />
      </div>

      {/* INFO */}
      <div
        style={{
          padding: "16px 18px 18px",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            fontSize: "9px",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "var(--gold-dim)",
            marginBottom: "5px",
            fontFamily: "var(--font-body)",
            fontWeight: 400,
          }}
        >
          {category}
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "18px",
            fontWeight: 400,
            color: "var(--text-primary)",
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}
