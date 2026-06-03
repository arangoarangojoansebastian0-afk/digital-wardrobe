"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { BodyProfile, BodyShape } from "@/types/mannequin";
import type { ClothingItem, Outfit, ClothingSlot } from "@/types/clothing";

const SLOT_DEFAULT_POSITIONS: Record<ClothingSlot, { x: number; y: number; width: number; height: number; rotate: number; clipPath: string; borderRadius: string }> = {
  upper: { x: 50, y: 30, width: 48, height: 40, rotate: -1, clipPath: "ellipse(54% 50% at 50% 42%)", borderRadius: "30px" },
  lower: { x: 50, y: 60, width: 42, height: 44, rotate: 0, clipPath: "ellipse(46% 62% at 50% 18%)", borderRadius: "36px" },
  outer: { x: 50, y: 28, width: 58, height: 50, rotate: 0, clipPath: "ellipse(56% 58% at 50% 38%)", borderRadius: "36px" },
  dress: { x: 50, y: 42, width: 50, height: 88, rotate: 0, clipPath: "ellipse(50% 78% at 50% 28%)", borderRadius: "42px" },
  shoes: { x: 50, y: 92, width: 24, height: 18, rotate: 0, clipPath: "ellipse(46% 48% at 50% 48%)", borderRadius: "30px" },
  accessory: { x: 62, y: 20, width: 16, height: 16, rotate: 6, clipPath: "circle(44% at 50% 50%)", borderRadius: "999px" },
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

function buildSilhouetteShape(profile: BodyProfile, width: number, height: number) {
  const headRadius = width * 0.095;
  const headCenterY = headRadius + 4;
  const shoulder = clamp(getScaled(profile.shoulder_width_cm, 38), 34, 56);
  const chest = clamp(getScaled(profile.chest_circumference_cm, 90), 42, 60);
  const waist = clamp(getScaled(profile.waist_circumference_cm, 70), 30, 46);
  const hip = clamp(getScaled(profile.hip_circumference_cm, 95), 46, 64);
  const waistY = height * 0.32;
  const hipY = height * 0.50;
  const kneeY = height * 0.72;
  const footY = height * 0.98;

  const centerX = width / 2;
  const leftShoulder = centerX - shoulder * 0.5;
  const rightShoulder = centerX + shoulder * 0.5;
  const leftChest = centerX - chest * 0.45;
  const rightChest = centerX + chest * 0.45;
  const leftWaist = centerX - waist * 0.36;
  const rightWaist = centerX + waist * 0.36;
  const leftHip = centerX - hip * 0.5;
  const rightHip = centerX + hip * 0.5;

  const path = [`
    M ${leftShoulder},${headCenterY + headRadius * 0.6}
    C ${leftShoulder - 10},${headCenterY + headRadius * 0.2} ${leftChest - 8},${headCenterY + headRadius * 2} ${leftChest},${headCenterY + headRadius * 2.2}
    C ${leftChest - 10},${waistY - 10} ${leftWaist + 8},${waistY + 6} ${leftWaist},${waistY}
    C ${leftWaist - 4},${hipY - 6} ${leftHip + 8},${hipY + 10} ${leftHip},${hipY}
    L ${leftHip + 8},${kneeY}
    C ${leftHip + 10},${kneeY + 16} ${leftHip + 18},${footY - 8} ${leftHip + 18},${footY}
    L ${rightHip - 18},${footY}
    C ${rightHip - 18},${footY - 8} ${rightHip - 10},${kneeY + 16} ${rightHip - 8},${kneeY}
    L ${rightHip},${hipY}
    C ${rightHip - 8},${hipY + 10} ${rightWaist - 4},${waistY - 4} ${rightWaist},${waistY}
    C ${rightWaist + 8},${waistY + 6} ${rightChest + 10},${headCenterY + headRadius * 2.2} ${rightChest},${headCenterY + headRadius * 2.2}
    C ${rightShoulder + 10},${headCenterY + headRadius * 0.2} ${rightShoulder + 2},${headCenterY + headRadius * 0.8} ${rightShoulder},${headCenterY + headRadius * 0.8}
    Z
  `].join(" ");

  return { path, headRadius, headCenterY };
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

  const silhouette = useMemo(() => buildSilhouetteShape(displayProfile, 220, 520), [displayProfile]);
  const silhouettePath = silhouette.path;

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
                  <stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
                </linearGradient>
                <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle cx="110" cy={silhouette.headCenterY} r={silhouette.headRadius} fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
              <path d={silhouettePath} fill="url(#bodyGradient)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" strokeLinejoin="round" filter="url(#softGlow)" />
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
