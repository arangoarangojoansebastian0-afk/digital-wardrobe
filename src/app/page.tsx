"use client";

import { useState, type ChangeEvent } from "react";

import Sidebar from "./components/Sidebar";
import UploadMenu from "./components/UploadMenu";
import AddClothingButton from "./components/AddClothingButton";
import ClothingSlider from "./components/ClothingSlider";
import ClothingEditorModal from "./components/ClothingEditorModal";
import ClothingViewerModal from "./components/ClothingViewerModal";

import { clothes as initialClothes } from "./data/clothes";

export default function Home() {

  // =========================
  // STATES
  // =========================

  const [clothes, setClothes] =
    useState(initialClothes);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [showEditor, setShowEditor] =
    useState(false);

  const [pendingImage, setPendingImage] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [newCategory, setNewCategory] =
    useState("");
  const [viewerOpen, setViewerOpen] =
    useState(false);

  const [selectedClothing, setSelectedClothing] =
    useState<any>(null);

  // =========================
  // CATEGORIAS
  // =========================

  const categories = [
    ...new Set(
      clothes.map(
        (item: any) =>
          item.category
      )
    ),
  ];

  // =========================
  // SUBIR ARCHIVO
  // =========================

  const handleImage = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      e.target.files?.[0];

    if (!file) return;

    try {

      const formData =
        new FormData();

      formData.append(
        "image",
        file
      );

      const response =
        await fetch(
          "/api/remove-background",
          {
            method: "POST",
            body: formData,
          }
        );

      // SI FALLA
      if (!response.ok) {

        const localImage =
          URL.createObjectURL(file);

        setPendingImage(
          localImage
        );

        setMenuOpen(false);

        setShowEditor(true);

        return;
      }

      // IMAGEN SIN FONDO
      const blob =
        await response.blob();

      const image =
        URL.createObjectURL(blob);

      setPendingImage(image);

      setMenuOpen(false);

      setShowEditor(true);

    } catch (err) {

      console.log(err);

      // FALLBACK
      const localImage =
        URL.createObjectURL(file);

      setPendingImage(
        localImage
      );

      setMenuOpen(false);

      setShowEditor(true);
    }
  };

  // =========================
  // URL
  // =========================

  const handleUrl = async () => {

    const url =
      prompt(
        "Pega la URL de la imagen"
      );

    if (!url) return;

    try {

      const formData =
        new FormData();

      formData.append(
        "imageUrl",
        url
      );

      const response =
        await fetch(
          "/api/remove-background",
          {
            method: "POST",
            body: formData,
          }
        );

      // FALLBACK
      if (!response.ok) {

        setPendingImage(url);

        setMenuOpen(false);

        setShowEditor(true);

        return;
      }

      // SIN FONDO
      const blob =
        await response.blob();

      const image =
        URL.createObjectURL(blob);

      setPendingImage(image);

      setMenuOpen(false);

      setShowEditor(true);

    } catch (err) {

      console.log(err);

      // FALLBACK
      setPendingImage(url);

      setMenuOpen(false);

      setShowEditor(true);
    }
  };

  // =========================
  // GUARDAR PRENDA
  // =========================

  const saveClothing = () => {

    const finalCategory =
      newCategory || category;

    if (
      !title ||
      !finalCategory ||
      !pendingImage
    ) {
      return;
    }

    const newItem = {
      id: Date.now(),
      title,
      category: finalCategory,
      image: pendingImage,
    };

    setClothes((prev: any) => [
      newItem,
      ...prev,
    ]);

    // RESET
    setPendingImage("");

    setTitle("");

    setCategory("");

    setNewCategory("");

    setShowEditor(false);
  };

  // =========================
  // UI
  // =========================

  return (

    <main
      className="
      flex min-h-screen
      bg-zinc-950 text-white
      "
    >

      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTENIDO */}
      <section
        className="
        flex-1
        p-10
        overflow-hidden
        "
      >

        {/* HEADER */}
        <div className="mb-12">

          <h1
            className="
            text-5xl
            font-bold
            "
          >
            Mi Armario
          </h1>

          <p
            className="
            text-zinc-400
            mt-3
            "
          >
            Organiza y crea outfits con IA
          </p>

        </div>

        {/* SLIDERS */}
        <div
          className="
          flex flex-col
          gap-14
          "
        >

          {categories.map((cat) => (

           <ClothingSlider
  key={cat}
  title={cat}
  items={
    clothes.filter(
      (item: any) =>
        item.category === cat
    )
  }
  onItemClick={(item: any) => {

    setSelectedClothing(item);

    setViewerOpen(true);

  }}
/>
          ))}

        </div>

      </section>

      {/* BOTON + */}
      <AddClothingButton
        onClick={() =>
          setMenuOpen(true)
        }
      />

      {/* MENU */}
      <UploadMenu
        open={menuOpen}
        onClose={() =>
          setMenuOpen(false)
        }
        onFileSelect={handleImage}
        onUrl={handleUrl}
      />

      {/* MODAL */}
      <ClothingEditorModal
        open={showEditor}
        image={pendingImage}
        title={title}
        setTitle={setTitle}
        category={category}
        setCategory={setCategory}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        categories={categories}
        onSave={saveClothing}
        onClose={() =>
          setShowEditor(false)
        }
      />
      {/* VISOR */}
<ClothingViewerModal
  open={viewerOpen}
  clothing={selectedClothing}
  onClose={() =>
    setViewerOpen(false)
  }
/>

    </main>
  );
}