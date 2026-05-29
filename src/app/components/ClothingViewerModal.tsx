"use client";

export default function ClothingViewerModal({
  open,
  clothing,
  onClose,
}: any) {

  if (!open || !clothing) return null;

  return (

    <div
      className="
      fixed inset-0
      bg-black/80
      z-50
      flex
      items-center
      justify-center
      "
    >

      <div
        className="
        bg-zinc-900
        rounded-3xl
        p-6
        w-[90%]
        max-w-4xl
        relative
        "
      >

        {/* BOTON CERRAR */}
        <button
          onClick={onClose}
          className="
          absolute
          top-4
          right-4
          text-zinc-400
          hover:text-white
          text-2xl
          "
        >
          ×
        </button>

        {/* IMAGEN */}
        <div
          className="
          w-full
          h-[70vh]
          flex
          items-center
          justify-center
          bg-zinc-800
          rounded-2xl
          overflow-hidden
          "
        >

          <img
            src={clothing.image}
            alt={clothing.title}
            className="
            max-h-full
            object-contain
            "
          />

        </div>

        {/* INFO */}
        <div className="mt-5">

          <h2
            className="
            text-3xl
            font-bold
            "
          >
            {clothing.title}
          </h2>

          <p
            className="
            text-zinc-400
            mt-2
            "
          >
            {clothing.category}
          </p>

        </div>

      </div>

    </div>

  );
}