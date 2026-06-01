"use client";

import ClothingCard from "./ClothingCard";

type ClothingItemSummary = {
  id: string | number;
  title?: string | null;
  category?: string | null;
  image?: string | null;
};

type ClothingSliderProps = {
  title: string;
  items: ClothingItemSummary[];
  onItemClick: (item: ClothingItemSummary) => void;
};

export default function ClothingSlider({
  title,
  items,
  onItemClick,
}: ClothingSliderProps) {
  return (
    <section style={{ marginBottom: "56px" }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "28px",
              fontWeight: 300,
              color: "var(--text-primary)",
              letterSpacing: "0.02em",
              fontStyle: "italic",
            }}
          >
            {title}
          </h2>
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              fontFamily: "var(--font-body)",
            }}
          >
            {items.length} {items.length === 1 ? "prenda" : "prendas"}
          </span>
        </div>

        <button
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--gold-dim)",
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--gold)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--gold-dim)";
          }}
        >
          Ver todo →
        </button>
      </div>

      {/* SLIDER */}
      <div
        className="scrollbar-hide"
        style={{
          display: "flex",
          gap: "16px",
          overflowX: "auto",
          paddingBottom: "8px",
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{ minWidth: "200px", maxWidth: "200px" }}
          >
            <ClothingCard
              title={item.title}
              category={item.category}
              image={item.image}
              onClick={() => onItemClick(item)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
