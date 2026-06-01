"use client";

import { useState, useEffect, type ChangeEvent } from "react";

import Sidebar from "./components/Sidebar";
import UploadMenu from "./components/UploadMenu";
import AddClothingButton from "./components/AddClothingButton";
import ClothingSlider from "./components/ClothingSlider";
import ClothingEditorModal from "./components/ClothingEditorModal";
import ClothingViewerModal from "./components/ClothingViewerModal";
import SettingsPanel from "./components/SettingsPanel";
import StylistChat from "./components/StylistChat";

import { supabase } from "@/lib/supabase";

type Tab = "armario" | "outfits" | "stylist" | "favoritos" | "ajustes";

type ClothingAnalysis = {
  title: string;
  category: string;
  type: string;
  color: string;
  style: string;
  season: string;
  tags: string[];
  description: string;
  details: string;
  fabric: string;
  fit: string;
  occasion: string;
  formality: string;
};

type ClothingItem = {
  id: string | number;
  title?: string | null;
  category?: string | null;
  image?: string | null;
  type?: string | null;
  color?: string | null;
  style?: string | null;
  season?: string | null;
  tags?: string[] | null;
  description?: string | null;
  details?: string | null;
  fabric?: string | null;
  fit?: string | null;
  occasion?: string | null;
  formality?: string | null;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("armario");
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [pendingImage, setPendingImage] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [type, setType] = useState("");
  const [color, setColor] = useState("");
  const [style, setStyle] = useState("");
  const [season, setSeason] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [fabric, setFabric] = useState("");
  const [fit, setFit] = useState("");
  const [occasion, setOccasion] = useState("");
  const [formality, setFormality] = useState("");
  const [analyzingClothing, setAnalyzingClothing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedClothing, setSelectedClothing] = useState<ClothingItem | null>(null);

  // Estado auxiliar para detectar si es pantalla móvil en el frontend
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize(); // Evaluar al montar
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const categories = [...new Set(clothes.map((item) => item.category || "Sin categoría"))];

  async function loadClothes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("clothes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setClothes(data as ClothingItem[]);
    setLoading(false);
  }

  // ── CARGAR PRENDAS AL INICIAR ──
  // eslint-disable-next-line
  useEffect(() => {
    loadClothes();
  }, []);

  // ── SUBIR IMAGEN A STORAGE ──
  const uploadImage = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No user");

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("clothes")
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage
      .from("clothes")
      .getPublicUrl(path);

    return data.publicUrl;
  };

  const removeBackground = async (formData: FormData, fallbackMessage: string) => {
    const response = await fetch("/api/remove-background", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(data?.error || fallbackMessage);
    }

    return response.blob();
  };

  const applyAnalysis = (analysis: Partial<ClothingAnalysis>) => {
    setTitle(analysis.title || "");
    setCategory(analysis.category || "");
    setNewCategory("");
    setType(analysis.type || "");
    setColor(analysis.color || "");
    setStyle(analysis.style || "");
    setSeason(analysis.season || "");
    setTags((analysis.tags || []).join(", "));
    setDescription(analysis.description || "");
    setDetails(analysis.details || "");
    setFabric(analysis.fabric || "");
    setFit(analysis.fit || "");
    setOccasion(analysis.occasion || "");
    setFormality(analysis.formality || "");
  };

  const resetClothingForm = () => {
    setPendingImage("");
    setPendingFile(null);
    setTitle("");
    setCategory("");
    setNewCategory("");
    setType("");
    setColor("");
    setStyle("");
    setSeason("");
    setTags("");
    setDescription("");
    setDetails("");
    setFabric("");
    setFit("");
    setOccasion("");
    setFormality("");
    setAnalyzingClothing(false);
    setAnalysisError("");
  };

  const analyzeClothing = async (input: { file?: File; imageUrl?: string }) => {
    setAnalyzingClothing(true);
    setAnalysisError("");

    try {
      const formData = new FormData();
      if (input.file) formData.append("image", input.file);
      if (input.imageUrl) formData.append("imageUrl", input.imageUrl);

      const response = await fetch("/api/analyze-clothing", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo analizar la prenda.");
      }

      applyAnalysis(data.analysis || {});
    } catch (err) {
      console.error(err);
      setAnalysisError(err instanceof Error ? err.message : "No se pudo analizar la prenda.");
    } finally {
      setAnalyzingClothing(false);
    }
  };

  // ── MANEJAR IMAGEN DESDE ARCHIVO ──
  const handleImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPendingFile(file);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const blob = await removeBackground(formData, "No se pudo eliminar el fondo de esta imagen.");
      const baseName = file.name.replace(/\.[^.]+$/, "") || "prenda";
      const processedFile = new File([blob], `${baseName}.png`, { type: "image/png" });
      setPendingFile(processedFile);
      setPendingImage(URL.createObjectURL(blob));
      setMenuOpen(false);
      setShowEditor(true);
      analyzeClothing({ file: processedFile });
    } catch {
      setPendingImage(URL.createObjectURL(file));
      setMenuOpen(false);
      setShowEditor(true);
      analyzeClothing({ file });
    }
  };

  // ── MANEJAR URL ──
  const handleUrl = async () => {
    const url = prompt("Pega la URL de la imagen")?.trim();
    if (!url) return;

    try {
      const formData = new FormData();
      formData.append("imageUrl", url);
      const blob = await removeBackground(formData, "No se pudo eliminar el fondo desde esa URL.");
      const processedFile = new File([blob], `prenda-${Date.now()}.png`, { type: "image/png" });

      setPendingFile(processedFile);
      setPendingImage(URL.createObjectURL(blob));
      setMenuOpen(false);
      setShowEditor(true);
      analyzeClothing({ file: processedFile });
    } catch (err) {
      console.error(err);
      setPendingFile(null);
      setPendingImage(url);
      setMenuOpen(false);
      setShowEditor(true);
      analyzeClothing({ imageUrl: url });
    }
  };

  // ── GUARDAR PRENDA EN SUPABASE ──
  const saveClothing = async () => {
    const finalCategory = newCategory || category;
    if (!title || !finalCategory || !pendingImage) return;

    try {
      let imageUrl = pendingImage;

      if (pendingFile) {
        imageUrl = await uploadImage(pendingFile);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.from("clothes").insert({
        user_id: user.id,
        title,
        category: finalCategory,
        image: imageUrl,
        type: type || null,
        color: color || null,
        style: style || null,
        season: season || null,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        description: description || null,
        details: details || null,
        fabric: fabric || null,
        fit: fit || null,
        occasion: occasion || null,
        formality: formality || null,
      }).select().single();

      let savedData = data;
      let savedError = error;

      if (savedError) {
        const retry = await supabase.from("clothes").insert({
          user_id: user.id,
          title,
          category: finalCategory,
          image: imageUrl,
          type: type || null,
          color: color || null,
          style: style || null,
          season: season || null,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }).select().single();

        savedData = retry.data;
        savedError = retry.error;
      }

      if (!savedError && savedData) {
        setClothes((prev) => [savedData, ...prev]);
      }

      resetClothingForm();
      setShowEditor(false);

    } catch (err) {
      console.error(err);
    }
  };

// ── ELIMINAR PRENDA ──
  // Usamos 'any' en el parámetro para evitar conflictos con el tipo ClothingItem estricto
  async function deleteClothing(item: any) {
    if (!item?.id) return; 

    const { error } = await supabase
      .from("clothes")
      .delete()
      .eq("id", item.id);

    if (!error) {
      setClothes((prev) => prev.filter((c) => c.id !== item.id));
      setViewerOpen(false);
      setSelectedClothing(null);
    } else {
      console.error("Error al eliminar:", error);
    }
  }

  return (
    <main 
      style={{ 
        display: "flex", 
        // Cambia la orientación a columna en móviles si quieres mandar la barra arriba, 
        // o mantenlo en fila (row) ya que al estar colapsada ocupa poquísimo espacio.
        flexDirection: "row", 
        minHeight: "100vh", 
        background: "var(--surface)", 
        color: "var(--text-primary)",
        maxWidth: "100vw",
        overflowX: "hidden"
      }}
    >

      <Sidebar active={activeTab} onChange={setActiveTab} />

      {/* SECCIÓN PRINCIPAL ADAPTABLE */}
      <section 
        style={{ 
          flex: 1, 
          // Reducimos radicalmente el padding excesivo cuando se visualiza en celular (20px en móvil vs 48px/52px en PC)
          padding: isMobile ? "24px 16px" : "48px 52px", 
          overflowX: "hidden",
          minWidth: 0 // Evita que elementos internos sincrónicos empujen el layout hacia la derecha
        }}
      >

        {/* ===== ARMARIO ===== */}
        {activeTab === "armario" && (
          <>
            <div style={{ marginBottom: isMobile ? "32px" : "52px" }}>
              <div 
                style={{ 
                  display: "flex", 
                  // En celular los contadores de estadísticas pasan abajo del título para que quepa todo de frente
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "flex-start" : "flex-end", 
                  justifyContent: "space-between", 
                  gap: isMobile ? "20px" : "0px",
                  marginBottom: "6px" 
                }}
              >
                <div>
                  <div style={{ fontSize: "10px", letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--gold-dim)", marginBottom: "8px", fontFamily: "var(--font-body)" }}>
                    Colección Personal
                  </div>
                  {/* El título principal se reduce de tamaño en celulares para que no se corte */}
                  <h1 style={{ fontFamily: "var(--font-display)", fontSize: isMobile ? "36px" : "52px", fontWeight: 300, lineHeight: 1, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                    Mi Armario
                  </h1>
                </div>
                
                {/* Panel de estadísticas autoajustable */}
                <div style={{ display: "flex", gap: isMobile ? "20px" : "32px", paddingBottom: "4px", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "space-between" : "flex-end" }}>
                  {[
                    { num: clothes.length, label: "Prendas" },
                    { num: categories.length, label: "Categorías" },
                    { num: 0, label: "Outfits" },
                  ].map((stat) => (
                    <div key={stat.label} style={{ textAlign: isMobile ? "left" : "right" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: isMobile ? "24px" : "32px", fontWeight: 300, color: "var(--gold)", lineHeight: 1 }}>{stat.num}</div>
                      <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: "4px" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: "24px", height: "1px", background: "linear-gradient(90deg, var(--gold) 0%, rgba(201,168,76,0.1) 40%, transparent 100%)" }} />
            </div>

            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 300, color: "var(--text-muted)", fontStyle: "italic" }}>
                  Cargando armario...
                </div>
              </div>
            ) : clothes.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh", textAlign: "center", padding: "0 20px" }}>
                <div style={{ fontSize: "36px", marginBottom: "16px", opacity: 0.3 }}>✦</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 300, fontStyle: "italic", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  Tu armario está vacío
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Agrega tu primera prenda con el botón +
                </div>
              </div>
            ) : (
              <div style={{ width: "100%" }}>
                {categories.map((cat) => (
                  <ClothingSlider
                    key={cat}
                    title={cat}
                    items={clothes.filter((item) => item.category === cat)}
                    onItemClick={(item) => {
                      setSelectedClothing(item);
                      setViewerOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== OUTFITS ===== */}
        {activeTab === "outfits" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "0 20px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: isMobile ? "32px" : "48px", fontWeight: 300, fontStyle: "italic", color: "var(--text-primary)", marginBottom: "12px" }}>Outfits</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Próximamente — Crea combinaciones con tu ropa</div>
          </div>
        )}

        {/* ===== IA STYLIST ===== */}
        {activeTab === "stylist" && (
          <StylistChat clothes={clothes} />
        )}

        {/* ===== FAVORITOS ===== */}
        {activeTab === "favoritos" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "0 20px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: isMobile ? "32px" : "48px", fontWeight: 300, fontStyle: "italic", color: "var(--text-primary)", marginBottom: "12px" }}>Favoritos</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Aquí aparecerán tus prendas favoritas</div>
          </div>
        )}

        {/* ===== AJUSTES ===== */}
        {activeTab === "ajustes" && (
          <>
            <div style={{ marginBottom: "40px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--gold-dim)", marginBottom: "8px" }}>Configuración</div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: isMobile ? "32px" : "48px", fontWeight: 300, color: "var(--text-primary)" }}>Ajustes</h1>
              <div style={{ marginTop: "20px", height: "1px", background: "linear-gradient(90deg, var(--gold) 0%, rgba(201,168,76,0.1) 40%, transparent 100%)" }} />
            </div>
            <SettingsPanel />
          </>
        )}

      </section>

      {activeTab === "armario" && (
        <AddClothingButton onClick={() => setMenuOpen(true)} />
      )}

      <UploadMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onFileSelect={handleImage}
        onUrl={handleUrl}
      />

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
        type={type}
        setType={setType}
        color={color}
        setColor={setColor}
        style={style}
        setStyle={setStyle}
        season={season}
        setSeason={setSeason}
        tags={tags}
        setTags={setTags}
        description={description}
        setDescription={setDescription}
        details={details}
        setDetails={setDetails}
        fabric={fabric}
        setFabric={setFabric}
        fit={fit}
        setFit={setFit}
        occasion={occasion}
        setOccasion={setOccasion}
        formality={formality}
        setFormality={setFormality}
        analyzing={analyzingClothing}
        analysisError={analysisError}
        onSave={saveClothing}
        onClose={() => {
          resetClothingForm();
          setShowEditor(false);
        }}
      />

      <ClothingViewerModal
        open={viewerOpen}
        clothing={selectedClothing}
        onClose={() => setViewerOpen(false)}
        onDelete={deleteClothing}
      />
    </main>
  );
}