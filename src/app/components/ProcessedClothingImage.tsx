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
      className="
      relative
      w-full
      h-72
      flex
      items-center
      justify-center
      overflow-hidden
      rounded-2xl
      bg-zinc-900
      "
    >

      {/* CUADRICULA */}
     <div
  className="
  relative
  w-full
  h-72
  flex
  items-center
  justify-center
  overflow-hidden
  rounded-2xl
  bg-zinc-950
  "
></div>

      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        className="
        object-contain
        p-4
        hover:scale-105
        transition
        duration-300
        "
      />

    </div>
  );
}