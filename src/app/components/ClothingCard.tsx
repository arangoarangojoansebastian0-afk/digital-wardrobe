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
      className="
      bg-zinc-900
      rounded-2xl
      overflow-hidden
      border border-zinc-800
      cursor-pointer
      hover:border-zinc-600
      hover:scale-[1.02]
      transition
      "
    >

      {/* IMAGEN */}
      <div
        className="
        relative
        w-full
        h-72
        bg-zinc-800
        "
      >

        <ProcessedClothingImage
          src={image}
          alt={title}
        />

      </div>

      {/* INFO */}
      <div className="p-5">

        <h2
          className="
          text-xl
          font-semibold
          "
        >
          {title}
        </h2>

        <p
          className="
          text-zinc-400
          mt-1
          "
        >
          {category}
        </p>

      </div>

    </div>

  );
}