"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import BodyProfileEditor from "./BodyProfileEditor";

const ACCENT_COLORS = [
  { name: "Dorado",  color: "#C9A84C", dim: "#8A6F32" },
  { name: "Plata",   color: "#A0A0A0", dim: "#6A6A6A" },
  { name: "Rosa",    color: "#D4857A", dim: "#9A5A52" },
  { name: "Verde",   color: "#7AAD8A", dim: "#4A7A5A" },
  { name: "Azul",    color: "#7A9AAD", dim: "#4A6A7A" },
];

export default function SettingsPanel({ referencePhotoUrl, onReferencePhotoChange }: { referencePhotoUrl: string; onReferencePhotoChange: (url: string) => void; }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [initial, setInitial] = useState("?");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [section, setSection] = useState("perfil");
  const [selectedColor, setSelectedColor] = useState(() => {
    if (typeof window === "undefined") return "#C9A84C";
    return localStorage.getItem("accent-color") || "#C9A84C";
  });
  const [referencePhoto, setReferencePhoto] = useState(referencePhotoUrl);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  function applyColorStyle(color: string) {
    const found = ACCENT_COLORS.find((c) => c.color === color);
    if (!found) return;
    document.documentElement.style.setProperty("--gold", found.color);
    document.documentElement.style.setProperty("--gold-dim", found.dim);
    document.documentElement.style.setProperty("--gold-light", found.color + "CC");
  }

  function applyColor(color: string, save = true) {
    setSelectedColor(color);
    applyColorStyle(color);
    if (save) localStorage.setItem("accent-color", color);
  }

  // Estado para adaptar la vista a celulares
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const n = user.user_metadata?.full_name || "";
        setName(n);
        setEmail(user.email || "");
        setInitial((n || user.email || "?")[0].toUpperCase());
        const savedPhoto = user.user_metadata?.mannequin_photo_url || localStorage.getItem("mannequin-reference-photo") || "";
        if (savedPhoto) {
          setReferencePhoto(savedPhoto);
          onReferencePhotoChange(savedPhoto);
        }
      }
    });

    applyColorStyle(selectedColor);

    return () => window.removeEventListener("resize", handleResize);
  }, [selectedColor, onReferencePhotoChange]);

  const saveName = async () => {
    setSaving(true);
    await supabase.auth.updateUser({ data: { full_name: name } });
    setInitial(name[0]?.toUpperCase() || "?");
    setSuccess("Guardado correctamente");
    setTimeout(() => setSuccess(""), 3000);
    setSaving(false);
  };

  const handleReferencePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    setPhotoError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const removeBgResponse = await fetch("/api/remove-background", {
        method: "POST",
        body: formData,
      });

      if (!removeBgResponse.ok) {
        const data = await removeBgResponse.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || "No se pudo procesar la foto de referencia.");
      }

      const blob = await removeBgResponse.blob();
      const processedFile = new File([blob], `mannequin-ref-${Date.now()}.png`, { type: "image/png" });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("No hay sesión activa.");

      const path = `${user.id}/mannequin-reference.png`;
      const { error: uploadError } = await supabase.storage.from("clothes").upload(path, processedFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("clothes").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      if (!publicUrl) throw new Error("No se pudo obtener la URL de la foto de referencia.");

      await supabase.auth.updateUser({ data: { mannequin_photo_url: publicUrl } });
      localStorage.setItem("mannequin-reference-photo", publicUrl);
      onReferencePhotoChange(publicUrl);
      setReferencePhoto(publicUrl);
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Error cargando foto de referencia.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleClearReferencePhoto = async () => {
    try {
      await supabase.auth.updateUser({ data: { mannequin_photo_url: "" } });
    } catch (error) {
      console.warn("No se pudo limpiar la foto de referencia", error);
    }
    localStorage.removeItem("mannequin-reference-photo");
    onReferencePhotoChange("");
    setReferencePhoto("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const sections = [
    { id: "perfil",     label: "Perfil",     icon: "◎" },
    { id: "cuerpo",     label: "Cuerpo",     icon: "👤" },
    { id: "apariencia", label: "Apariencia",  icon: "◈" },
    { id: "cuenta",     label: "Cuenta",      icon: "✦" },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--surface-3)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "10px",
    padding: "13px 16px",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    fontWeight: 300,
    outline: "none",
    marginBottom: "12px",
    boxSizing: "border-box",
  };

  return (
    <div 
      style={{ 
        display: "flex", 
        flexDirection: isMobile ? "column" : "row", // Cambia a columna en móviles
        gap: isMobile ? "16px" : "28px", 
        width: "100%",
        maxWidth: "860px",
        padding: isMobile ? "16px" : "0px",
        boxSizing: "border-box"
      }}
    >

      {/* MENÚ LATERAL / BARRA SUPERIOR EN MÓVIL */}
      <div 
        style={{ 
          width: isMobile ? "100%" : "180px", 
          display: isMobile ? "flex" : "block", // Distribución horizontal en móvil
          gap: isMobile ? "8px" : "0px",
          flexShrink: 0, 
          background: "var(--surface-2)", 
          borderRadius: "12px", 
          border: "1px solid var(--border-subtle)", 
          padding: "8px", 
          height: "fit-content",
          boxSizing: "border-box",
          overflowX: isMobile ? "auto" : "visible" // Por si añades más pestañas en el futuro
        }}
      >
        {sections.map((s) => (
          <button 
            key={s.id} 
            onClick={() => setSection(s.id)}
            style={{ 
              width: isMobile ? "100%" : "100%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: isMobile ? "center" : "flex-start",
              gap: "10px", 
              padding: "11px 14px", 
              borderRadius: "8px", 
              border: "none", 
              borderLeft: isMobile ? "none" : (section === s.id ? "2px solid var(--gold)" : "2px solid transparent"), 
              borderBottom: isMobile ? (section === s.id ? "2px solid var(--gold)" : "2px solid transparent") : "none",
              background: section === s.id ? "rgba(201,168,76,0.08)" : "transparent", 
              color: section === s.id ? "var(--gold)" : "var(--text-secondary)", 
              cursor: "pointer", 
              fontFamily: "var(--font-body)", 
              fontSize: "13px", 
              fontWeight: section === s.id ? 400 : 300, 
              textAlign: "left", 
              transition: "all 0.2s",
              whiteSpace: "nowrap"
            }}
          >
            <span style={{ fontSize: "10px" }}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      <div 
        style={{ 
          flex: 1, 
          width: "100%",
          background: "var(--surface-2)", 
          border: "1px solid var(--border-subtle)", 
          borderRadius: "12px", 
          padding: isMobile ? "20px" : "28px",
          boxSizing: "border-box"
        }}
      >

        {/* ===== PERFIL ===== */}
        {section === "perfil" && (
          <>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 300, fontStyle: "italic", marginBottom: "24px", color: "var(--text-primary)" }}>Perfil</div>

            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px", paddingBottom: "24px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 500, color: "var(--surface)", fontFamily: "var(--font-display)", flexShrink: 0 }}>
                {initial}
              </div>
              <div style={{ minWidth: 0, overflow: "hidden" }}>
                <div style={{ fontSize: "16px", color: "var(--text-primary)", fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name || "Sin nombre"}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
              </div>
            </div>

            <label style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" style={inputStyle}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = "var(--gold-dim)"}
              onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = "var(--border-subtle)"}
            />

            <label style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>Correo</label>
            <input type="email" value={email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} />

            <div style={{ marginTop: "20px", marginBottom: "12px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>Foto de referencia</div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ width: "96px", height: "96px", borderRadius: "18px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {referencePhoto ? (
                  <Image src={referencePhoto} alt="Foto de referencia" width={96} height={96} style={{ objectFit: "cover", borderRadius: "18px" }} />
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", padding: "12px" }}>Sin foto</div>
                )}
              </div>
              <div style={{ flex: "1 1 220px", minWidth: "220px" }}>
                <div style={{ marginBottom: "10px", fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5 }}>
                  Sube una foto tuya sin fondo. La IA usará esta referencia para que el maniquí tenga una cara y rasgos similares a los tuyos.
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "12px 16px", borderRadius: "10px", background: "var(--gold)", color: "var(--surface)", fontSize: "12px", cursor: uploadingPhoto ? "not-allowed" : "pointer" }}>
                    {uploadingPhoto ? "Subiendo..." : "Subir foto"}
                    <input type="file" accept="image/*" disabled={uploadingPhoto} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      handleReferencePhotoUpload(file);
                      e.target.value = "";
                    }} style={{ display: "none" }} />
                  </label>
                  {referencePhoto && (
                    <button type="button" onClick={handleClearReferencePhoto} style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-primary)", fontSize: "12px", cursor: "pointer" }}>
                      Eliminar foto
                    </button>
                  )}
                </div>
                {photoError && (
                  <div style={{ marginTop: "10px", color: "#FCA5A5", fontSize: "12px" }}>{photoError}</div>
                )}
              </div>
            </div>

            {success && (
              <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "8px", padding: "10px 14px", color: "#86EFAC", fontSize: "13px", marginBottom: "12px" }}>
                {success}
              </div>
            )}

            <button onClick={saveName} disabled={saving}
              style={{ width: isMobile ? "100%" : "auto", background: saving ? "var(--gold-dim)" : "var(--gold)", border: "none", borderRadius: "10px", padding: "13px 24px", color: "var(--surface)", fontSize: "12px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s" }}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </>
        )}

        {/* ===== APARIENCIA ===== */}
        {section === "apariencia" && (
          <>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 300, fontStyle: "italic", marginBottom: "24px", color: "var(--text-primary)" }}>Apariencia</div>

            {/* COLORES */}
            <label style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "16px" }}>Color de acento</label>
            <div style={{ display: "flex", gap: "14px", marginBottom: "32px", flexWrap: "wrap" }}>
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.name}
                  title={c.name}
                  onClick={() => applyColor(c.color)}
                  style={{
                    width: "40px", height: "40px", borderRadius: "50%",
                    background: c.color,
                    border: selectedColor === c.color ? "3px solid white" : "3px solid transparent",
                    cursor: "pointer",
                    transition: "transform 0.2s, border 0.2s",
                    boxShadow: selectedColor === c.color ? `0 0 12px ${c.color}88` : "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.15)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"}
                />
              ))}
            </div>

            {/* PREVIEW */}
            <div style={{ padding: "16px 20px", background: "var(--surface-3)", border: "1px solid var(--border-subtle)", borderRadius: "10px", marginBottom: "32px" }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>Vista previa</div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--surface)", fontWeight: 600, fontSize: "14px" }}>A</div>
                <div>
                  <div style={{ fontSize: "14px", color: "var(--gold)", fontFamily: "var(--font-display)", fontWeight: 400 }}>Armario Digital</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Color activo</div>
                </div>
                <div style={{ marginLeft: isMobile ? "0px" : "auto", padding: "6px 14px", background: "var(--gold)", borderRadius: "20px", fontSize: "11px", color: "var(--surface)", fontWeight: 500 }}>Activo</div>
              </div>
            </div>

            {/* MODO */}
            <label style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "14px" }}>Modo</label>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px" }}>
              {[
                { id: "oscuro", label: "Oscuro", bg: "#0E0E0F" },
                { id: "claro",  label: "Claro",  bg: "#F5F5F0" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    if (m.id === "oscuro") {
                      document.documentElement.style.setProperty("--surface",   "#0E0E0F");
                      document.documentElement.style.setProperty("--surface-2", "#141415");
                      document.documentElement.style.setProperty("--surface-3", "#1C1C1E");
                      document.documentElement.style.setProperty("--surface-4", "#242426");
                      document.documentElement.style.setProperty("--text-primary",   "#F0EDE6");
                      document.documentElement.style.setProperty("--text-secondary",  "#8A8780");
                      document.documentElement.style.setProperty("--text-muted",      "#4A4845");
                      document.documentElement.style.setProperty("--border-subtle", "rgba(255,255,255,0.06)");
                    } else {
                      document.documentElement.style.setProperty("--surface",   "#F5F5F0");
                      document.documentElement.style.setProperty("--surface-2", "#EDECEA");
                      document.documentElement.style.setProperty("--surface-3", "#E2E0DC");
                      document.documentElement.style.setProperty("--surface-4", "#D5D3CE");
                      document.documentElement.style.setProperty("--text-primary",   "#1A1A18");
                      document.documentElement.style.setProperty("--text-secondary",  "#5A5855");
                      document.documentElement.style.setProperty("--text-muted",      "#9A9895");
                      document.documentElement.style.setProperty("--border-subtle", "rgba(0,0,0,0.08)");
                    }
                    localStorage.setItem("theme-mode", m.id);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "12px 20px", borderRadius: "10px",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--surface-3)",
                    color: "var(--text-primary)",
                    cursor: "pointer", fontSize: "13px",
                    fontFamily: "var(--font-body)", transition: "all 0.2s",
                    justifyContent: isMobile ? "center" : "flex-start"
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-dim)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)"}
                >
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: m.bg, border: "1px solid rgba(128,128,128,0.3)" }} />
                  {m.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ===== CUERPO ===== */}
        {section === "cuerpo" && (
          <>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 300, fontStyle: "italic", marginBottom: "24px", color: "var(--text-primary)" }}>Cuerpo</div>
            <div style={{ marginBottom: "24px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Ajusta tu perfil corporal para personalizar la experiencia del mannequin y mejorar futuras recomendaciones de prendas.
            </div>
            <BodyProfileEditor />
          </>
        )}

        {/* ===== CUENTA ===== */}
        {section === "cuenta" && (
          <>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 300, fontStyle: "italic", marginBottom: "24px", color: "var(--text-primary)" }}>Cuenta</div>

            <div style={{ padding: "16px 20px", background: "var(--surface-3)", border: "1px solid var(--border-subtle)", borderRadius: "10px", marginBottom: "28px" }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Correo</div>
              <div style={{ fontSize: "14px", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
            </div>

            <div style={{ paddingTop: "24px", borderTop: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>Sesión activa</div>
              <button
                onClick={handleLogout}
                style={{ width: isMobile ? "100%" : "auto", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "13px 24px", color: "#FCA5A5", fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s", display: "block", textAlign: "center" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
              >
                Cerrar sesión
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}