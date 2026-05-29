"use client";

import Image from "next/image";

export default function ClothingEditorModal({
  open,
  image,
  title,
  setTitle,
  category,
  setCategory,
  newCategory,
  setNewCategory,
  categories,
  onSave,
  onClose,
}: any) {

  if (!open) return null;

  return (

    <div
      className="
      fixed inset-0
      z-[300]
      bg-black/70
      backdrop-blur-md
      flex items-center
      justify-center
      p-5
      "
    >

      <div
        className="
        w-full
        max-w-2xl
        bg-zinc-900
        border border-zinc-800
        rounded-3xl
        overflow-hidden
        shadow-2xl
        "
      >

        {/* HEADER */}
        <div
          className="
          flex items-center
          justify-between
          p-5
          border-b
          border-zinc-800
          "
        >

          <h2
            className="
            text-2xl
            font-bold
            "
          >
            Nueva Prenda
          </h2>

          <button
            onClick={onClose}
            className="
            w-10 h-10
            rounded-full
            bg-zinc-800
            hover:bg-zinc-700
            transition
            "
          >
            ✕
          </button>

        </div>

        {/* CONTENIDO */}
        <div className="p-6">

          {/* PREVIEW */}
          <div
            className="
            relative
            w-full
            h-80
            rounded-2xl
            overflow-hidden
            bg-zinc-800
            mb-6
            "
          >

            <Image
              src={image}
              alt="preview"
              fill
              unoptimized
              className="
              object-contain
              "
            />

          </div>

          {/* NOMBRE */}
          <input
            type="text"
            placeholder="Nombre de la prenda"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            className="
            w-full
            bg-zinc-800
            p-4
            rounded-xl
            mb-4
            outline-none
            "
          />

          {/* CATEGORIA */}
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            className="
            w-full
            bg-zinc-800
            p-4
            rounded-xl
            mb-4
            outline-none
            "
          >

            <option value="">
              Selecciona categoría
            </option>

            {categories.map((cat: string) => (

              <option
                key={cat}
                value={cat}
              >
                {cat}
              </option>

            ))}

          </select>

          {/* NUEVA CATEGORIA */}
          <input
            type="text"
            placeholder="
            O crear nueva categoría
            "
            value={newCategory}
            onChange={(e) =>
              setNewCategory(
                e.target.value
              )
            }
            className="
            w-full
            bg-zinc-800
            p-4
            rounded-xl
            mb-6
            outline-none
            "
          />

          {/* BOTON */}
          <button
            onClick={onSave}
            className="
            w-full
            bg-white
            text-black
            py-4
            rounded-xl
            font-bold
            hover:opacity-80
            transition
            "
          >
            Guardar Prenda
          </button>

        </div>

      </div>

    </div>
  );
}