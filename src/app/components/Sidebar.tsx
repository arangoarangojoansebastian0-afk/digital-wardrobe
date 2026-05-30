"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Tab = "armario" | "outfits" | "stylist" | "favoritos" | "ajustes";

const navItems: { id: Tab; label: string; icon: string; badge?: string }[] = [
  { id: "armario",   label: "Armario",    icon: "✦" },
  { id: "outfits",   label: "Outfits",    icon: "◈" },
  { id: "stylist",   label: "IA Stylist", icon: "◎", badge: "Próximo" },
  { id: "favoritos", label: "Favoritos",  icon: "◇" },
  { id: "ajustes",   label: "Ajustes",    icon: "⚙" },
];

export default function Sidebar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  const [userName, setUserName] = useState("Joan");
  const [userEmail, setUserEmail] = useState("Mi perfil");
  const [initial, setInitial] = useState("J");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.full_name || user.email || "Usuario";
        setUserName(name.split(" ")[0]);
        setUserEmail(user.email || "Mi perfil");
        setInitial(name[0].toUpperCase());
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        background: "var(--surface-2)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        padding: "0",
        position: "sticky",
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* LOGO */}
      <div style={{ padding: "36px 28px 32px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 300, letterSpacing: "0.12em", color: "var(--gold)", textTransform: "uppercase", lineHeight: 1 }}>
          Armario
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", letterSpacing: "0.3em", color: "var(--text-muted)", textTransform: "uppercase", marginTop: "4px" }}>
          Digital
        </div>
      </div>

      {/* NAV */}
      <nav style={{ flex: 1, padding: "20px 0" }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "13px 28px",
              background: active === item.id
                ? "linear-gradient(90deg, rgba(201,168,76,0.1) 0%, transparent 100%)"
                : "transparent",
              border: "none",
              borderLeft: active === item.id ? "2px solid var(--gold)" : "2px solid transparent",
              cursor: "pointer",
              color: active === item.id ? "var(--gold-light)" : "var(--text-secondary)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: active === item.id ? 400 : 300,
              letterSpacing: "0.05em",
              textAlign: "left",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (active !== item.id)
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              if (active !== item.id)
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
            }}
          >
            <span style={{ fontSize: "10px", opacity: 0.8 }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && (
              <span style={{ marginLeft: "auto", fontSize: "9px", letterSpacing: "0.08em", background: "rgba(201,168,76,0.12)", color: "var(--gold-dim)", padding: "2px 7px", borderRadius: "20px", border: "1px solid rgba(201,168,76,0.2)" }}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* FOOTER */}
      <div style={{ padding: "20px 28px", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 500, color: "var(--surface)", flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "9px", color: "var(--text-muted)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s ease" }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.color = "#FCA5A5"; el.style.borderColor = "rgba(239,68,68,0.2)"; }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.color = "var(--text-muted)"; el.style.borderColor = "rgba(255,255,255,0.06)"; }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}