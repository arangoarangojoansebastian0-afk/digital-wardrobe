"use client";

export default function ProcessedClothingImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            padding: "16px",
            transition: "transform 0.4s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLImageElement).style.transform = "scale(1)";
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            fontSize: "12px",
            padding: "16px",
            textAlign: "center",
          }}
        >
          Sin imagen disponible
        </div>
      )}
    </div>
  );
}
