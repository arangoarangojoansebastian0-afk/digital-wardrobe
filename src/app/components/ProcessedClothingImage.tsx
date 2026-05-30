"use client";

import Image from "next/image";

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
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        style={{
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
    </div>
  );
}
