"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email || !password) {
      setError("Completa todos los campos");
      setLoading(false);
      return;
    }

    try {
      if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) setError(error.message);
      else setSuccess("Revisa tu correo para confirmar tu cuenta");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError("Correo o contraseña incorrectos");
    }

    } catch (err) {
      console.error("Supabase auth network error:", err);
      setError("No se pudo conectar con Supabase. Revisa el URL del proyecto, la clave publica y tu conexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "14px 16px",
    color: "#F0EDE6",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "14px",
    fontWeight: 300,
    outline: "none",
    marginBottom: "12px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0E0E0F",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      {/* FONDO DECORATIVO */}
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          position: "relative",
        }}
      >
        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: "32px",
              fontWeight: 300,
              color: "#C9A84C",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Armario
          </div>
          <div
            style={{
              fontSize: "10px",
              letterSpacing: "0.4em",
              color: "#4A4845",
              textTransform: "uppercase",
              marginTop: "4px",
            }}
          >
            Digital
          </div>
        </div>

        {/* CARD */}
        <div
          style={{
            background: "#141415",
            border: "1px solid rgba(201,168,76,0.15)",
            borderRadius: "16px",
            padding: "36px 32px",
          }}
        >
          {/* TABS */}
          <div
            style={{
              display: "flex",
              marginBottom: "28px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "8px",
              padding: "3px",
            }}
          >
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: mode === m ? "#C9A84C" : "transparent",
                  color: mode === m ? "#0E0E0F" : "#8A8780",
                  fontSize: "13px",
                  fontWeight: mode === m ? 500 : 300,
                  letterSpacing: "0.05em",
                  transition: "all 0.2s ease",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {m === "login" ? "Iniciar sesión" : "Registrarse"}
              </button>
            ))}
          </div>

          {/* NOMBRE (solo registro) */}
          {mode === "register" && (
            <input
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          )}

          {/* EMAIL */}
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          {/* PASSWORD */}
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={{ ...inputStyle, marginBottom: "20px" }}
          />

          {/* ERROR / SUCCESS */}
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#FCA5A5",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#86EFAC",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              {success}
            </div>
          )}

          {/* BOTÓN PRINCIPAL */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#8A6F32" : "#C9A84C",
              border: "none",
              borderRadius: "10px",
              padding: "15px",
              color: "#0E0E0F",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              fontFamily: "DM Sans, sans-serif",
              marginBottom: "12px",
            }}
          >
            {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>

          {/* DIVISOR */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "16px 0",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
            <span style={{ fontSize: "11px", color: "#4A4845", letterSpacing: "0.1em" }}>O</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* GOOGLE */}
          <button
            onClick={handleGoogle}
            style={{
              width: "100%",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              padding: "14px",
              color: "#F0EDE6",
              fontSize: "13px",
              fontWeight: 300,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "all 0.2s ease",
              fontFamily: "DM Sans, sans-serif",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,76,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  );
}
