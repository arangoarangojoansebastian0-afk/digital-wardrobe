"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { BodyProfile, BodyShape, BodyType } from "@/types/mannequin";

const SHAPES: { value: BodyShape; label: string }[] = [
  { value: "hourglass", label: "Figura reloj de arena" },
  { value: "triangle", label: "Triángulo" },
  { value: "inverted_triangle", label: "Triángulo invertido" },
  { value: "rectangle", label: "Rectángulo" },
  { value: "oval", label: "Ovalado" },
  { value: "pear", label: "Pera" },
];

const TYPES: { value: BodyType; label: string }[] = [
  { value: "ectomorph", label: "Ectomorfo" },
  { value: "mesomorph", label: "Mesomorfo" },
  { value: "endomorph", label: "Endomorfo" },
  { value: "athletic", label: "Atlético" },
];

const DEFAULT_PROFILE: BodyProfile = {
  height_cm: 170,
  weight_kg: 68,
  shoulder_width_cm: 42,
  chest_circumference_cm: 92,
  waist_circumference_cm: 76,
  hip_circumference_cm: 98,
  arm_length_cm: 60,
  leg_length_cm: 80,
  body_shape: "rectangle",
  body_type: "mesomorph",
};

function getInputStyle() {
  return {
    width: "100%",
    background: "var(--surface-3)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    fontWeight: 300,
    outline: "none",
    boxSizing: "border-box" as const,
  };
}

export default function BodyProfileEditor() {
  const [profile, setProfile] = useState<BodyProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/body-profiles?user_id=${encodeURIComponent(user.id)}`);
      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = await response.json();
      setProfile((prev) => ({ ...prev, ...data }));
      setLoading(false);
    };

    void loadProfile();
  }, []);

  const handleChange = (key: keyof BodyProfile, value: string | number) => {
    setProfile((prev) => ({
      ...prev,
      [key]: typeof value === "string" ? Number(value) || 0 : value,
    }));
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      setMessage("No se pudo determinar el usuario.");
      setSaving(false);
      return;
    }

    const response = await fetch("/api/body-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, ...profile }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setMessage(body?.error || "No se pudo guardar el perfil.");
      setSaving(false);
      return;
    }

    setMessage("Perfil corporal guardado correctamente.");
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "10px",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    marginBottom: "8px",
    display: "block",
  };

  if (loading) {
    return <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Cargando perfil corporal...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
        {[
          { label: "Altura (cm)", key: "height_cm", value: profile.height_cm },
          { label: "Peso (kg)", key: "weight_kg", value: profile.weight_kg },
          { label: "Hombros (cm)", key: "shoulder_width_cm", value: profile.shoulder_width_cm },
          { label: "Pecho (cm)", key: "chest_circumference_cm", value: profile.chest_circumference_cm },
          { label: "Cintura (cm)", key: "waist_circumference_cm", value: profile.waist_circumference_cm },
          { label: "Cadera (cm)", key: "hip_circumference_cm", value: profile.hip_circumference_cm },
          { label: "Brazo (cm)", key: "arm_length_cm", value: profile.arm_length_cm },
          { label: "Pierna (cm)", key: "leg_length_cm", value: profile.leg_length_cm },
        ].map((item) => (
          <div key={item.key}>
            <label style={labelStyle}>{item.label}</label>
            <input
              type="number"
              min={0}
              value={item.value}
              onChange={(event) => handleChange(item.key as keyof BodyProfile, event.target.value)}
              style={getInputStyle()}
            />
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div>
          <label style={labelStyle}>Forma corporal</label>
          <select
            value={profile.body_shape}
            onChange={(event) => setProfile((prev) => ({ ...prev, body_shape: event.target.value as BodyShape }))}
            style={getInputStyle()}
          >
            {SHAPES.map((shape) => (
              <option key={shape.value} value={shape.value}>{shape.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Tipo de cuerpo</label>
          <select
            value={profile.body_type}
            onChange={(event) => setProfile((prev) => ({ ...prev, body_type: event.target.value as BodyType }))}
            style={getInputStyle()}
          >
            {TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button
          onClick={saveProfile}
          disabled={saving}
          style={{
            width: "fit-content",
            background: saving ? "var(--gold-dim)" : "var(--gold)",
            border: "none",
            borderRadius: "10px",
            padding: "14px 24px",
            color: "var(--surface)",
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: saving ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            fontFamily: "var(--font-body)",
          }}
        >
          {saving ? "Guardando..." : "Guardar perfil corporal"}
        </button>

        {message && (
          <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{message}</div>
        )}
      </div>
    </div>
  );
}
