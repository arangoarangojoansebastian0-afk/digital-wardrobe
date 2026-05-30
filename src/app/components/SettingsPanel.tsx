"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const ACCENT_COLORS = [
  { name: "Dorado",  color: "#C9A84C", dim: "#8A6F32" },
  { name: "Plata",   color: "#A0A0A0", dim: "#6A6A6A" },
  { name: "Rosa",    color: "#D4857A", dim: "#9A5A52" },
  { name: "Verde",   color: "#7AAD8A", dim: "#4A7A5A" },
  { name: "Azul",    color: "#7A9AAD", dim: "#4A6A7A" },
];

export default function SettingsPanel() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [initial, setInitial] = useState("?");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [section, setSection] = useState("perfil");
  const [selectedColor, setSelectedColor] = useState("#C9A84C");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const n = user.user_metadata?.full_name || "";
        setName(n);
        setEmail(user.email || "");
        setInitial((n || user.email || "?")[0].toUpperCase());
      }
    });

    // Cargar color guardado
    const saved = localStorage.getItem("accent-color");
    if (saved) applyColor(saved, false);
  }, []);

  const applyColor = (color: string, save = true) => {
    setSelectedColor(color);
    const found = ACCENT_COLORS.find((c) => c.color === color);
    if (!found) return;
    document.documentElement.style.setProperty("--gold", found.color);
    document.documentElement.style.setProperty("--gold-dim", found.dim);
    document.documentElement.style.setProperty("--gold-light", found.color + "CC");
    if (save) localStorage.setItem("accent-color", color);
  };

  const saveName = async () => {
    setSaving(true);
    await supabase.auth.updateUser({ data: { full_name: name } });
    setInitial(name[0]?.toUpperCase() || "?");
    setSuccess("Guardado correctamente");
    setTimeout(() => setSuccess(""), 3000);
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const sections = [
    { id: "perfil",     label: "Perfil",     icon: "◎" },
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
  };

  return (
    <div style={{ display: "flex", gap: "28px", maxWidth: "860px" }}>

      {/* MENÚ LATERAL */}
      <div style={{ width: "180px", flexShrink: 0, background: "var(--surface-2)", borderRadius: "12px", border: "1px solid var(--border-subtle)", padding: "8px", height: "fit-content" }}>
        {sections.map((s) => (
          <button key={s.id} onClick={() => setSection(s.id)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "8px", border: "none", borderLeft: section === s.id ? "2px solid var(--gold)" : "2px solid transparent", background: section === s.id ? "rgba(201,168,76,0.08)" : "transparent", color: section === s.id ? "var(--gold)" : "var(--text-secondary)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: section === s.id ? 400 : 300, textAlign: "left", transition: "all 0.2s" }}
          >
            <span style={{ fontSize: "10px" }}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      <div style={{ flex: 1, background: "var(--surface-2)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "28px" }}>

        {/* ===== PERFIL ===== */}
        {section === "perfil" && (
          <>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 300, fontStyle: "italic", marginBottom: "24px", color: "var(--text-primary)" }}>Perfil</div>

            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px", paddingBottom: "24px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 500, color: "var(--surface)", fontFamily: "var(--font-display)", flexShrink: 0 }}>
                {initial}
              </div>
              <div>
                <div style={{ fontSize: "16px", color: "var(--text-primary)", fontWeight: 400 }}>{name || "Sin nombre"}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>{email}</div>
              </div>
            </div>

            <label style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" style={inputStyle}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = "var(--gold-dim)"}
              onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = "var(--border-subtle)"}
            />

            <label style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>Correo</label>
            <input type="email" value={email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} />

            {success && (
              <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "8px", padding: "10px 14px", color: "#86EFAC", fontSize: "13px", marginBottom: "12px" }}>
                {success}
              </div>
            )}

            <button onClick={saveName} disabled={saving}
              style={{ background: saving ? "var(--gold-dim)" : "var(--gold)", border: "none", borderRadius: "10px", padding: "13px 24px", color: "var(--surface)", fontSize: "12px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s" }}
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
            <div style={{ display: "flex", gap: "14px", marginBottom: "32px" }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--surface)", fontWeight: 600, fontSize: "14px" }}>A</div>
                <div>
                  <div style={{ fontSize: "14px", color: "var(--gold)", fontFamily: "var(--font-display)", fontWeight: 400 }}>Armario Digital</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Color activo</div>
                </div>
                <div style={{ marginLeft: "auto", padding: "6px 14px", background: "var(--gold)", borderRadius: "20px", fontSize: "11px", color: "var(--surface)", fontWeight: 500 }}>Activo</div>
              </div>
            </div>

            {/* MODO */}
            <label style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "14px" }}>Modo</label>
            <div style={{ display: "flex", gap: "10px" }}>
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

        {/* ===== CUENTA ===== */}
        {section === "cuenta" && (
          <>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 300, fontStyle: "italic", marginBottom: "24px", color: "var(--text-primary)" }}>Cuenta</div>

            <div style={{ padding: "16px 20px", background: "var(--surface-3)", border: "1px solid var(--border-subtle)", borderRadius: "10px", marginBottom: "28px" }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Correo</div>
              <div style={{ fontSize: "14px", color: "var(--text-primary)" }}>{email}</div>
            </div>

            <div style={{ paddingTop: "24px", borderTop: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>Sesión activa</div>
              <button
                onClick={handleLogout}
                style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "13px 24px", color: "#FCA5A5", fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s" }}
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