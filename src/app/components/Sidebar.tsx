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
  
  // Estado para detectar si la pantalla actual es la de un celular
  const [isMobile, setIsMobile] = useState(false);

  // El menú empieza abierto (false). En el useEffect se evalúa si es móvil para contraerlo.
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Si está en PC, se obliga a mantenerse extendida (false). 
      // Si está en móvil, se contrae por defecto (true) para optimizar el espacio.
      if (!mobile) {
        setIsCollapsed(false);
      } else {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
        width: isMobile ? (isCollapsed ? "72px" : "240px") : "240px",
        minHeight: "100vh",
        background: "linear-gradient(180deg, var(--surface-2) 0%, rgba(10, 10, 11, 0.95) 100%)",
        borderRight: "1px solid var(--border-glass)",
        display: "flex",
        flexDirection: "column",
        padding: "0",
        position: "sticky",
        top: 0,
        flexShrink: 0,
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        boxShadow: "10px 0 30px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* BOTÓN DISPARADOR (HAMBURGUESA) - SOLO VISIBLE EN CELULARES */}
      {isMobile && (
        <div style={{ display: "flex", justifyContent: isCollapsed ? "center" : "flex-end", padding: "12px 16px 0" }}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "20px",
              cursor: "pointer",
              padding: "8px",
              lineHeight: 1,
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--gold)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
          >
            {isCollapsed ? "☰" : "✕"}
          </button>
        </div>
      )}

      {/* LOGO */}
      <div style={{ 
        padding: isCollapsed ? "16px 0 20px" : "36px 28px 32px",
        borderBottom: "1px solid var(--border-subtle)",
        textAlign: isCollapsed ? "center" : "left",
        transition: "padding 0.3s"
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: isCollapsed ? "16px" : "22px", fontWeight: 300, letterSpacing: "0.12em", color: "var(--gold)", textTransform: "uppercase", lineHeight: 1 }}>
          {isCollapsed ? "A" : "Armario"}
        </div>
        {!isCollapsed && (
          <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", letterSpacing: "0.3em", color: "var(--text-muted)", textTransform: "uppercase", marginTop: "4px" }}>
            Digital
          </div>
        )}
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
              justifyContent: isCollapsed ? "center" : "flex-start",
              gap: isCollapsed ? "0px" : "14px",
              padding: isCollapsed ? "14px 0" : "13px 28px",
              background: active === item.id
                ? "linear-gradient(90deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.02) 80%, transparent 100%)"
                : "transparent",
              border: "none",
              borderLeft: active === item.id ? "3px solid var(--gold)" : "3px solid transparent",
              cursor: "pointer",
              color: active === item.id ? "var(--gold-light)" : "var(--text-secondary)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: active === item.id ? 400 : 300,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textAlign: "left",
              textShadow: active === item.id ? "0 0 10px rgba(201,168,76,0.25)" : "none",
              transition: "var(--transition-smooth)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              if (active !== item.id) {
                el.style.color = "var(--text-primary)";
                el.style.background = "rgba(255, 255, 255, 0.02)";
              } else {
                el.style.textShadow = "0 0 15px rgba(201,168,76,0.4)";
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              if (active !== item.id) {
                el.style.color = "var(--text-secondary)";
                el.style.background = "transparent";
              } else {
                el.style.textShadow = "0 0 10px rgba(201,168,76,0.25)";
              }
            }}
          >
            {/* El Signo/Icono siempre se ve */}
            <span style={{ fontSize: "12px", opacity: 0.8, minWidth: "16px", textAlign: "center" }}>{item.icon}</span>
            
            {/* El texto y el badge desaparecen limpiamente si está colapsado */}
            {!isCollapsed && (
              <>
                <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
                {item.badge && (
                  <span style={{ marginLeft: "auto", fontSize: "9px", letterSpacing: "0.08em", background: "rgba(201,168,76,0.12)", color: "var(--gold-dim)", padding: "2px 7px", borderRadius: "20px", border: "1px solid rgba(201,168,76,0.2)" }}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* FOOTER */}
      <div style={{ padding: isCollapsed ? "20px 0" : "24px 28px", borderTop: "1px solid var(--border-glass)", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", width: "100%", justifyContent: isCollapsed ? "center" : "flex-start" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--gold-gradient)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 500, color: "var(--surface)", flexShrink: 0, boxShadow: "var(--shadow-glow)" }}>
            {initial}
          </div>
          {!isCollapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</div>
            </div>
          )}
        </div>
        
        {/* Botón de cerrar sesión adaptado */}
        <button
          onClick={handleLogout}
          style={{ 
            width: isCollapsed ? "40px" : "100%", 
            background: "transparent", 
            border: "1px solid rgba(255,255,255,0.06)", 
            borderRadius: "8px", 
            padding: "9px", 
            color: "var(--text-muted)", 
            fontSize: "11px", 
            letterSpacing: "0.1em", 
            textTransform: "uppercase", 
            cursor: "pointer", 
            fontFamily: "var(--font-body)", 
            transition: "all 0.2s ease",
            whiteSpace: "nowrap"
          }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.color = "#FCA5A5"; el.style.borderColor = "rgba(239,68,68,0.2)"; }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.color = "var(--text-muted)"; el.style.borderColor = "rgba(255,255,255,0.06)"; }}
        >
          {isCollapsed ? "✕" : "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}