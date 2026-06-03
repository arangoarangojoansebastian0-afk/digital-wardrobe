"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { BodyProfile, BodyShape } from "@/types/mannequin";
import type { ClothingItem, Outfit } from "@/types/clothing";

const DEFAULT_BODY_PROFILE: BodyProfile = {
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

const shapeLabelMap: Record<BodyShape, string> = {
  hourglass: "Reloj de arena",
  triangle: "Triángulo",
  inverted_triangle: "Triángulo invertido",
  rectangle: "Rectángulo",
  oval: "Ovalado",
  pear: "Pera",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function getScaled(value: number, base: number) {
  return clamp((value / base) * 100, 35, 70);
}

function buildSilhouettePath(profile: BodyProfile, width: number, height: number) {
  const shoulder = getScaled(profile.shoulder_width_cm, 38); // ancho de hombros
  const chest = getScaled(profile.chest_circumference_cm, 90);
  const waist = getScaled(profile.waist_circumference_cm, 70);
  const hip = getScaled(profile.hip_circumference_cm, 95);
  const upperLeg = clamp(profile.leg_length_cm / 1.8, 30, 42);
  const waistY = height * 0.38;
  const hipY = height * 0.55;
  const kneeY = height * 0.75;
  const footY = height * 0.97;

  const centerX = width / 2;
  const shoulderX = centerX - shoulder * 0.8;
  const chestX = centerX - chest * 0.5;
  const waistX = centerX - waist * 0.4;
  const hipX = centerX - hip * 0.45;

  const left = (x: number) => x;
  const right = (x: number) => width - x;

  const curve = (startX: number, endX: number, y: number) => `${startX},${y} C ${startX + 8},${y + 10} ${endX - 8},${y + 10} ${endX},${y}`;

  const shape = profile.body_shape;
  const waistOffset = shape === "hourglass" ? 10 : shape === "pear" ? -4 : shape === "inverted_triangle" ? 6 : shape === "triangle" ? 0 : 2;
  const hipOffset = shape === "pear" ? 12 : shape === "triangle" ? -8 : 0;
  const shoulderOffset = shape === "inverted_triangle" ? 12 : shape === "triangle" ? -6 : 0;

  const leftShoulder = shoulderX - shoulderOffset;
  const rightShoulder = width - leftShoulder;
  const leftChest = chestX - shoulderOffset * 0.4;
  const rightChest = width - leftChest;
  const leftWaist = waistX + waistOffset;
  const rightWaist = width - leftWaist;
  const leftHip = hipX - hipOffset;
  const rightHip = width - leftHip;

  return [`
    M ${centerX},0
    C ${centerX - 10},${height * 0.08} ${leftShoulder},${height * 0.13} ${leftShoulder},${height * 0.18}
    L ${leftChest},${waistY * 0.75}
    C ${leftChest - 10},${waistY * 0.95} ${leftWaist + 8},${waistY + 8} ${leftWaist},${waistY}
    L ${leftHip},${hipY}
    C ${leftHip - 8},${hipY + 10} ${leftHip + 10},${kneeY - 6} ${leftHip + 8},${kneeY}
    L ${leftHip + 8},${footY}
    L ${rightHip - 8},${footY}
    C ${rightHip - 8},${kneeY + 6} ${rightHip + 8},${kneeY + 6} ${rightHip},${kneeY}
    L ${rightHip},${hipY}
    C ${rightHip - 8},${hipY + 10} ${rightWaist - 8},${waistY + 8} ${rightWaist},${waistY}
    L ${rightChest},${waistY * 0.75}
    C ${rightChest + 10},${waistY * 0.95} ${rightShoulder - 8},${height * 0.13} ${rightShoulder},${height * 0.18}
    L ${rightShoulder},${height * 0.18}
    C ${rightShoulder},${height * 0.13} ${centerX + 10},${height * 0.08} ${centerX},0
  `].join(" ");
}

export default function MannequinViewer({
  clothes,
  selectedClothing,
  selectedOutfit,
}: {
  clothes: ClothingItem[];
  selectedClothing: ClothingItem | null;
  selectedOutfit?: Outfit | null;
}) {
  const [profile, setProfile] = useState<BodyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMessage, setUserMessage] = useState("Cargando datos del mannequin...");

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setUserMessage("Inicia sesión para ver tu mannequin.");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/body-profiles?user_id=${encodeURIComponent(user.id)}`);
      if (!response.ok) {
        setUserMessage("No se pudo cargar el perfil corporal.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setProfile(data || DEFAULT_BODY_PROFILE);
      setLoading(false);
    };

    void loadProfile();
  }, []);

  const displayProfile = profile ?? DEFAULT_BODY_PROFILE;

  const silhouettePath = useMemo(() => {
    return buildSilhouettePath(displayProfile, 220, 520);
  }, [displayProfile]);

  const outfitItems = useMemo(() => {
    if (!selectedOutfit?.item_ids) return [];

    const ids = Object.values(selectedOutfit.item_ids).filter(Boolean);
    return ids
      .map((id) => clothes.find((item) => String(item.id) === String(id)))
      .filter((item): item is ClothingItem => Boolean(item))
      .sort((a, b) => (a.outfit_layer ?? 0) - (b.outfit_layer ?? 0));
  }, [selectedOutfit, clothes]);

  const overlayClothes = outfitItems.length > 0 ? outfitItems : selectedClothing ? [selectedClothing] : [];

  const statusMessage = loading
    ? userMessage
    : overlayClothes.length > 0
      ? selectedOutfit
        ? "Vista previa del outfit seleccionado. Ajusta el perfil corporal en Ajustes > Cuerpo."
        : "Vista previa con la prenda seleccionada. Ajusta el perfil corporal en Ajustes > Cuerpo."
      : "Selecciona una prenda o outfit para verlo en el mannequin.";

  return (
    <div style={{ marginBottom: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "20px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.08)", background: "radial-gradient(circle at top, rgba(201,168,76,0.12), rgba(17,17,18,0.72))" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300, color: "var(--text-primary)" }}>Visor de mannequin 2D</div>
            <div style={{ marginTop: "4px", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Usa tu perfil corporal para generar proporciones más reales y previsualizar cómo encaja cada prenda.
            </div>
          </div>
          <div style={{ display: "grid", gap: "6px", textAlign: "right" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)" }}>Forma</div>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--gold)" }}>{shapeLabelMap[displayProfile.body_shape]}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
          {[
            { label: "Altura", value: `${displayProfile.height_cm} cm` },
            { label: "Cintura", value: `${displayProfile.waist_circumference_cm} cm` },
            { label: "Cadera", value: `${displayProfile.hip_circumference_cm} cm` },
            { label: "Hombros", value: `${displayProfile.shoulder_width_cm} cm` },
          ].map((item) => (
            <div key={item.label} style={{ padding: "12px 14px", borderRadius: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>{item.label}</div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", width: "260px", minHeight: "560px", background: "rgba(255,255,255,0.04)", borderRadius: "28px", border: "1px solid rgba(255,255,255,0.08)", padding: "18px", overflow: "hidden" }}>
            <svg viewBox="0 0 220 520" width="100%" height="100%" style={{ display: "block" }}>
              <defs>
                <linearGradient id="bodyGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
                </linearGradient>
              </defs>
              <path d={silhouettePath} fill="url(#bodyGradient)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" />
            </svg>

            {overlayClothes.map((item) => {
              if (!item.image) return null;
              const x = clamp(item.outfit_anchor_x ?? 50, 0, 100);
              const y = clamp(item.outfit_anchor_y ?? 50, 0, 100);
              const width = clamp(item.outfit_width ?? 30, 16, 70);
              const zIndex = item.outfit_layer ?? 5;

              return (
                <img
                  key={String(item.id)}
                  src={item.image}
                  alt={item.title ?? "Prenda seleccionada"}
                  style={{
                    position: "absolute",
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${width}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex,
                    borderRadius: "18px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
                  }}
                />
              );
            })}

            <div style={{ position: "absolute", bottom: "16px", left: "16px", right: "16px", borderRadius: "18px", padding: "14px", background: "rgba(0,0,0,0.22)", color: "var(--surface)", fontSize: "12px", lineHeight: 1.5, backdropFilter: "blur(12px)" }}>
              {loading ? userMessage : statusMessage}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
