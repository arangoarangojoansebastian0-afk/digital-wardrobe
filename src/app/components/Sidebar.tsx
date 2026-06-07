"use client";

import { useEffect, useState } from "react";
import { Grid3X3, Heart, LogOut, Menu, Settings, Shirt, Sparkles, Wand2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Tab = "armario" | "outfits" | "stylist" | "favoritos" | "ajustes";

const navItems: { id: Tab; label: string; icon: typeof Shirt; badge?: string }[] = [
  { id: "armario", label: "Armario", icon: Shirt },
  { id: "outfits", label: "Outfits", icon: Grid3X3 },
  { id: "stylist", label: "IA Stylist", icon: Wand2, badge: "IA" },
  { id: "favoritos", label: "Favoritos", icon: Heart },
  { id: "ajustes", label: "Ajustes", icon: Settings },
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
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setIsCollapsed(mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
        width: isMobile ? (isCollapsed ? "74px" : "252px") : "252px",
        minHeight: "100vh",
        background: "linear-gradient(180deg, rgba(17,17,18,0.92) 0%, rgba(10,10,11,0.98) 100%)",
        borderRight: "1px solid var(--border-glass)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        flexShrink: 0,
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        boxShadow: "12px 0 42px rgba(0,0,0,0.28)",
        backdropFilter: "blur(18px)",
      }}
    >
      {isMobile && (
        <div style={{ display: "flex", justifyContent: isCollapsed ? "center" : "flex-end", padding: "12px 16px 0" }}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Abrir menu" : "Cerrar menu"}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "var(--surface-3)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isCollapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>
      )}

      <div
        style={{
          padding: isCollapsed ? "18px 0 22px" : "38px 28px 34px",
          borderBottom: "1px solid var(--border-subtle)",
          textAlign: isCollapsed ? "center" : "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: "10px",
            fontFamily: "var(--font-display)",
            fontSize: isCollapsed ? "18px" : "24px",
            fontWeight: 400,
            letterSpacing: "0.1em",
            color: "var(--gold)",
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          <Sparkles size={isCollapsed ? 18 : 17} />
          {!isCollapsed && "Armario"}
        </div>
        {!isCollapsed && (
          <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", letterSpacing: "0.3em", color: "var(--text-muted)", textTransform: "uppercase", marginTop: "5px" }}>
            Digital
          </div>
        )}
      </div>

      <nav style={{ flex: 1, padding: "22px 0" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              style={{
                width: "100%",
                minHeight: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "flex-start",
                gap: isCollapsed ? 0 : "14px",
                padding: isCollapsed ? "0" : "0 28px",
                background: isActive
                  ? "linear-gradient(90deg, rgba(201,168,76,0.15) 0%, rgba(103,214,196,0.05) 58%, transparent 100%)"
                  : "transparent",
                border: "none",
                borderLeft: isActive ? "3px solid var(--gold)" : "3px solid transparent",
                cursor: "pointer",
                color: isActive ? "var(--gold-light)" : "var(--text-secondary)",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: isActive ? 500 : 300,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textAlign: "left",
                textShadow: isActive ? "0 0 12px rgba(201,168,76,0.25)" : "none",
              }}
            >
              <span style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={17} strokeWidth={1.8} />
              </span>
              {!isCollapsed && (
                <>
                  <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ marginLeft: "auto", fontSize: "9px", letterSpacing: "0.08em", background: "rgba(103,214,196,0.12)", color: "var(--accent-teal)", padding: "3px 8px", borderRadius: "20px", border: "1px solid rgba(103,214,196,0.22)" }}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: isCollapsed ? "20px 0" : "24px 28px", borderTop: "1px solid var(--border-glass)", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", width: "100%", justifyContent: isCollapsed ? "center" : "flex-start" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--gold-gradient)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 600, color: "var(--surface)", flexShrink: 0, boxShadow: "var(--shadow-glow)" }}>
            {initial}
          </div>
          {!isCollapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</div>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          aria-label="Cerrar sesion"
          style={{
            width: isCollapsed ? "40px" : "100%",
            minHeight: "38px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "10px",
            color: "var(--text-muted)",
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            whiteSpace: "nowrap",
          }}
        >
          {isCollapsed ? <LogOut size={15} /> : "Cerrar sesion"}
        </button>
      </div>
    </aside>
  );
}
