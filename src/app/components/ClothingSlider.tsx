"use client";

import ClothingCard from "./ClothingCard";

export default function ClothingSlider({
  title,
  items,
  onItemClick,
}: any) {

  return (

    <section className="mb-12">

      {/* TITULO */}
      <div
        className="
        flex items-center
        justify-between
        mb-5
        "
      >

        <h2
          className="
          text-2xl font-bold
          "
        >
          {title}
        </h2>

        <button
          className="
          text-zinc-400
          hover:text-white
          transition
          text-sm
          "
        >
          Ver todo
        </button>

      </div>

      {/* SLIDER */}
      <div
        className="
        flex
        gap-5
        overflow-x-auto
        pb-2
        scrollbar-hide
        "
      >

        {items.map((item: any) => (

          <div
            key={item.id}
            className="
            min-w-[220px]
            "
          >

            <ClothingCard
              title={item.title}
              category={item.category}
              image={item.image}
              onClick={() =>
                onItemClick(item)
              }
            />

          </div>

        ))}

      </div>

    </section>

  );
}