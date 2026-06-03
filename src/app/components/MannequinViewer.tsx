"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { BodyProfile, BodyShape } from "@/types/mannequin";
import type { ClothingItem, Outfit, ClothingSlot } from "@/types/clothing";

const SLOT_DEFAULT_POSITIONS: Record<ClothingSlot, { x: number; y: number; width: number; height: number; rotate: number; clipPath: string; borderRadius: string }> = {
  upper: { x: 50, y: 24, width: 42, height: 42, rotate: -2, clipPath: "ellipse(52% 58% at 50% 42%)", borderRadius: "32px" },
  lower: { x: 50, y: 56, width: 46, height: 48, rotate: 0, clipPath: "ellipse(48% 68% at 50% 24%)", borderRadius: "38px" },
  outer: { x: 50, y: 22, width: 46, height: 46, rotate: -1, clipPath: "ellipse(54% 62% at 50% 40%)", borderRadius: "34px" },
  dress: { x: 50, y: 44, width: 48, height: 80, rotate: 0, clipPath: "ellipse(48% 80% at 50% 28%)", borderRadius: "42px" },
  shoes: { x: 50, y: 90, width: 34, height: 22, rotate: 0, clipPath: "ellipse(52% 32% at 50% 48%)", borderRadius: "28px" },
  accessory: { x: 65, y: 18, width: 18, height: 20, rotate: 10, clipPath: "ellipse(50% 50% at 50% 50%)", borderRadius: "999px" },
};

function normalizeSlot(value: unknown): ClothingSlot {
  const slot = typeof value === "string" ? value.toLowerCase() : "";
  const allowed: ClothingSlot[] = ["upper", "lower", "outer", "dress", "shoes", "accessory"];
  return allowed.includes(slot as ClothingSlot) ? (slot as ClothingSlot) : "accessory";
}

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
  return clamp((value / base) * 100, 30, 65);
}

function buildSilhouettePath(profile: BodyProfile, width: number, height: number) {
  const headHeight = height * 0.12;
  const shoulder = clamp(getScaled(profile.shoulder_width_cm, 38), 34, 58);
  const chest = clamp(getScaled(profile.chest_circumference_cm, 90), 40, 60);
  const waist = clamp(getScaled(profile.waist_circumference_cm, 70), 32, 48);
  const hip = clamp(getScaled(profile.hip_circumference_cm, 95), 44, 64);
  const waistY = height * 0.32;
  const hipY = height * 0.52;
  const kneeY = height * 0.75;
  const footY = height * 0.98;

  const centerX = width / 2;
  const leftShoulder = centerX - shoulder * 0.6;
  const rightShoulder = centerX + shoulder * 0.6;
  const leftChest = centerX - chest * 0.45;
  const rightChest = centerX + chest * 0.45;
  const leftWaist = centerX - waist * 0.35;
  const rightWaist = centerX + waist * 0.35;
  const leftHip = centerX - hip * 0.45;
  const rightHip = centerX + hip * 0.45;

  return [`
    M ${centerX},0
    C ${centerX - 16},${headHeight * 0.6} ${leftShoulder - 10},${headHeight * 0.9} ${leftShoulder},${headHeight}
    L ${leftShoulder},${headHeight + 18}
    C ${leftShoulder},${headHeight + 26} ${leftChest - 8},${headHeight + 42} ${leftChest},${headHeight + 50}
    C ${leftChest - 10},${waistY - 10} ${leftWaist + 8},${waistY + 12} ${leftWaist},${waistY}
    C ${leftWaist - 6},${hipY - 6} ${leftHip + 6},${hipY + 14} ${leftHip},${hipY}
    L ${leftHip + 8},${kneeY}
    C ${leftHip + 10},${kneeY + 18} ${leftHip + 18},${footY - 6} ${leftHip + 18},${footY}
    L ${rightHip - 18},${footY}
    C ${rightHip - 18},${footY - 6} ${rightHip - 10},${kneeY + 18} ${rightHip - 8},${kneeY}
    L ${rightHip},${hipY}
    C ${rightHip - 6},${hipY + 14} ${rightWaist + 6},${waistY - 6} ${rightWaist},${waistY}
    C ${rightWaist + 8},${waistY + 12} ${rightChest + 10},${headHeight + 48} ${rightChest},${headHeight + 50}
    C ${rightShoulder},${headHeight + 44} ${rightShoulder},${headHeight + 28} ${rightShoulder},${headHeight + 18}
    C ${rightShoulder + 10},${headHeight * 0.9} ${centerX + 16},${headHeight * 0.6} ${centerX},0
    Z
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
              const slot = normalizeSlot(item.outfit_slot);
              const placement = SLOT_DEFAULT_POSITIONS[slot];
              const x = clamp(item.outfit_anchor_x ?? placement.x, 0, 100);
              const y = clamp(item.outfit_anchor_y ?? placement.y, 0, 100);
              const width = clamp(item.outfit_width ?? placement.width, 16, 70);
              const height = placement.height;
              const zIndex = item.outfit_layer ?? 5;

              return (
                <div
                  key={String(item.id)}
                  style={{
                    position: "absolute",
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                    transform: `translate(-50%, -50%) rotate(${placement.rotate}deg)`,
                    zIndex,
                    overflow: "hidden",
                    borderRadius: placement.borderRadius,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.24)",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    clipPath: placement.clipPath,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.title ?? "Prenda seleccionada"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
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
