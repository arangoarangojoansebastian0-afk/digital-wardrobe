"use client";

import {
  Camera,
  Link,
  Upload,
  X,
} from "lucide-react";

type Props = {
  open: boolean;

  onClose: () => void;

  onFileSelect: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;

  onUrl: () => void;
};

export default function UploadMenu({
  open,
  onClose,
  onFileSelect,
  onUrl,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">

      {/* PANEL */}
      <div
        className="
          w-full
          max-w-md
          bg-zinc-900
          border
          border-zinc-800
          rounded-t-3xl
          p-6
          animate-in
          slide-in-from-bottom
        "
      >

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">

          <h2 className="text-xl font-bold text-white">
            Agregar prenda
          </h2>

          <button
            onClick={onClose}
            className="
              w-10
              h-10
              rounded-full
              bg-zinc-800
              hover:bg-zinc-700
              transition
              flex
              items-center
              justify-center
            "
          >
            <X size={20} />
          </button>

        </div>

        {/* OPCIONES */}
        <div className="flex flex-col gap-3">

          {/* ARCHIVOS */}
          <label
            className="
              flex
              items-center
              gap-4
              bg-zinc-800
              hover:bg-zinc-700
              transition
              p-5
              rounded-2xl
              cursor-pointer
            "
          >

            <div className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center">
              <Upload size={22} />
            </div>

            <div>
              <p className="font-semibold text-white">
                Archivos
              </p>

              <p className="text-sm text-zinc-400">
                Subir desde el dispositivo
              </p>
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={onFileSelect}
              className="hidden"
            />

          </label>

          {/* CAMARA */}
          <label
            className="
              flex
              items-center
              gap-4
              bg-zinc-800
              hover:bg-zinc-700
              transition
              p-5
              rounded-2xl
              cursor-pointer
            "
          >

            <div className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center">
              <Camera size={22} />
            </div>

            <div>
              <p className="font-semibold text-white">
                Cámara
              </p>

              <p className="text-sm text-zinc-400">
                Tomar una foto
              </p>
            </div>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onFileSelect}
              className="hidden"
            />

          </label>

          {/* URL */}
          <button
            onClick={onUrl}
            className="
              flex
              items-center
              gap-4
              bg-zinc-800
              hover:bg-zinc-700
              transition
              p-5
              rounded-2xl
              text-left
            "
          >

            <div className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center">
              <Link size={22} />
            </div>

            <div>
              <p className="font-semibold text-white">
                URL
              </p>

              <p className="text-sm text-zinc-400">
                Usar imagen desde internet
              </p>
            </div>

          </button>

        </div>

      </div>

    </div>
  );
}