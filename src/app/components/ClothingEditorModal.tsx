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
  type,
  setType,
  color,
  setColor,
  style,
  setStyle,
  season,
  setSeason,
  tags,
  setTags,
  description,
  setDescription,
  details,
  setDetails,
  fabric,
  setFabric,
  fit,
  setFit,
  occasion,
  setOccasion,
  formality,
  setFormality,
  analyzing,
  analysisError,
  onSave,
  onClose,
}: any) {
  if (!open) return null;

  const categoryOptions = category && !categories.includes(category)
    ? [category, ...categories]
    : categories;

  const inputStyle = {
    width: "100%",
    background: "var(--surface-3)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "10px",
    padding: "14px 16px",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    fontWeight: 300,
    outline: "none",
    transition: "border-color 0.2s",
    marginBottom: "12px",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          maxHeight: "92vh",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 40px 120px rgba(0,0,0,0.8)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 28px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "24px",
                fontWeight: 300,
                fontStyle: "italic",
                color: "var(--text-primary)",
              }}
            >
              Nueva Prenda
            </div>
            <div
              style={{
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--gold-dim)",
                marginTop: "3px",
              }}
            >
              Añadir al armario
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "var(--surface-4)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* CONTENIDO */}
        <div style={{ padding: "24px 28px 28px", overflowY: "auto" }}>
          {/* PREVIEW */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "260px",
              borderRadius: "10px",
              overflow: "hidden",
              background: "var(--surface-4)",
              marginBottom: "20px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Image
              src={image}
              alt="preview"
              fill
              unoptimized
              style={{ objectFit: "contain", padding: "16px" }}
            />
          </div>

          {analyzing && (
            <div style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(201,168,76,0.25)", background: "rgba(201,168,76,0.08)", color: "var(--gold)", fontSize: "12px", marginBottom: "14px", lineHeight: 1.5 }}>
              Analizando la prenda con IA...
            </div>
          )}

          {analysisError && !analyzing && (
            <div style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "#FCA5A5", fontSize: "12px", marginBottom: "14px", lineHeight: 1.5 }}>
              {analysisError}
            </div>
          )}

          {/* NOMBRE */}
          <input
            type="text"
            placeholder="Nombre de la prenda"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "var(--gold-dim)";
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "var(--border-subtle)";
            }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <input
              type="text"
              placeholder="Tipo"
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <input
              type="text"
              placeholder="Estilo"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Temporada"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              style={inputStyle}
            />
          </div>

          <textarea
            placeholder="Descripcion"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...inputStyle, minHeight: "74px", resize: "vertical" }}
          />

          <textarea
            placeholder="Detalles visibles"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            style={{ ...inputStyle, minHeight: "74px", resize: "vertical" }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <input
              type="text"
              placeholder="Tela o material"
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Silueta / fit"
              value={fit}
              onChange={(e) => setFit(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <input
              type="text"
              placeholder="Ocasiones"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Formalidad"
              value={formality}
              onChange={(e) => setFormality(e.target.value)}
              style={inputStyle}
            />
          </div>

          <input
            type="text"
            placeholder="Tags separados por coma"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            style={inputStyle}
          />

          {/* CATEGORIA */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="">Selecciona categoría</option>
            {categoryOptions.map((cat: string) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* NUEVA CATEGORIA */}
          <input
            type="text"
            placeholder="O crear nueva categoría..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            style={{ ...inputStyle, marginBottom: "20px" }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "var(--gold-dim)";
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "var(--border-subtle)";
            }}
          />

          {/* BOTON GUARDAR */}
          <button
            onClick={onSave}
            style={{
              width: "100%",
              background: "var(--gold)",
              border: "none",
              borderRadius: "10px",
              padding: "16px",
              color: "var(--surface)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--gold-light)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--gold)";
            }}
          >
            Guardar Prenda
          </button>
        </div>
      </div>
    </div>
  );
}
