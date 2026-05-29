"use client";

import { Plus } from "lucide-react";

export default function AddClothingButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="
        fixed
        bottom-6
        right-6
        w-16
        h-16
        rounded-full
        bg-white
        text-black
        flex
        items-center
        justify-center
        shadow-2xl
        hover:scale-110
        transition
      "
    >
      <Plus size={30} />
    </button>
  );
}