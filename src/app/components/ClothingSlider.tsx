"use client";

import ClothingCard from "./ClothingCard";

type ClothingItemSummary = {
  id: string | number;
  title?: string | null;
  category?: string | null;
  image?: string | null;
  color?: string | null;
  style?: string | null;
  outfitLabels?: string[];
};

type ClothingSliderProps = {
  title: string;
  items: ClothingItemSummary[];
  selectedIds?: Set<string | number>;
  onItemClick: (item: ClothingItemSummary) => void;
};

export default function ClothingSlider({
  title,
  items,
  selectedIds,
  onItemClick,
}: ClothingSliderProps) {
  return (
    <section style={{ marginBottom: "62px" }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "22px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "30px",
              fontWeight: 300,
              color: "var(--text-primary)",
              letterSpacing: "0",
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
            background: "rgba(255,255,255,0.025)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "999px",
            padding: "8px 12px",
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
          gap: "18px",
          overflowX: "auto",
          paddingBottom: "12px",
          scrollSnapType: "x mandatory",
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{ minWidth: "214px", maxWidth: "214px", scrollSnapAlign: "start" }}
          >
            <ClothingCard
              title={item.title}
              category={item.category}
              image={item.image}
              color={item.color}
              style={item.style}
              selected={selectedIds?.has(item.id)}
              outfitLabels={item.outfitLabels}
              onClick={() => onItemClick(item)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
