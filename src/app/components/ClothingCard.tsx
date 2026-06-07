"use client";

import ProcessedClothingImage from "./ProcessedClothingImage";

type ClothingCardProps = {
  title?: string | null;
  category?: string | null;
  image?: string | null;
  color?: string | null;
  style?: string | null;
  onClick: () => void;
};

export default function ClothingCard({
  title,
  category,
  image,
  color,
  style,
  onClick,
}: ClothingCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012)), var(--surface-3)",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid var(--border-glass)",
        cursor: "pointer",
        transition: "transform 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease",
        position: "relative",
        boxShadow: "0 16px 44px rgba(0,0,0,0.22)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.border = "1px solid var(--border)";
        el.style.transform = "translateY(-4px)";
        el.style.boxShadow = "0 24px 70px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.08)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.border = "1px solid var(--border-subtle)";
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "0 16px 44px rgba(0,0,0,0.22)";
      }}
    >
      {/* IMAGEN */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "292px",
          background: "linear-gradient(145deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012)), var(--surface-4)",
          overflow: "hidden",
        }}
      >
        <ProcessedClothingImage src={image ?? ""} alt={title ?? ""} />

        {/* OVERLAY HOVER */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(10,10,11,0.82) 0%, rgba(10,10,11,0.12) 54%, transparent 100%)",
            opacity: 0.65,
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
            minHeight: "44px",
          }}
        >
          {title}
        </div>
        {(color || style) && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
            {color && (
              <span style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "999px", color: "var(--accent-teal)", border: "1px solid rgba(103,214,196,0.22)", background: "rgba(103,214,196,0.08)" }}>
                {color}
              </span>
            )}
            {style && (
              <span style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "999px", color: "var(--accent-rose)", border: "1px solid rgba(229,140,159,0.22)", background: "rgba(229,140,159,0.08)" }}>
                {style}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
