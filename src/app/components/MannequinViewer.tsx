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


export default function MannequinViewer({
  clothes,
  selectedClothing,
  selectedOutfit,
  referencePhotoUrl,
}: {
  clothes: ClothingItem[];
  selectedClothing: ClothingItem | null;
  selectedOutfit?: Outfit | null;
  referencePhotoUrl?: string;
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

  const previewItems = useMemo(() => {
    if (selectedOutfit?.item_ids) {
      const ids = Object.values(selectedOutfit.item_ids).filter(Boolean);
      return ids
        .map((id) => clothes.find((item) => String(item.id) === String(id)))
        .filter((item): item is ClothingItem => Boolean(item))
        .sort((a, b) => (a.outfit_layer ?? 0) - (b.outfit_layer ?? 0));
    }
    return selectedClothing ? [selectedClothing] : [];
  }, [selectedOutfit, selectedClothing, clothes]);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function generatePreviewImage() {
      if (previewItems.length === 0 || !displayProfile) {
        setGeneratedImage(null);
        setGenerationError("");
        setIsGenerating(false);
        return;
      }

      setIsGenerating(true);
      setGenerationError("");

      try {
        const response = await fetch("/api/nano-banana", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profile: displayProfile,
            items: previewItems,            reference_image_url: referencePhotoUrl,            extra_prompt: "Genera un maniquí frontal neutro con el cuerpo fijo. No modifiques la silueta del cuerpo al posicionar la ropa. Coloca cada prenda en su lugar natural sin deformar el cuerpo.",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || "No se pudo generar la imagen de Nano Banana.");
        }

        const data = await response.json();
        if (cancelled) return;

        if (!data?.generated_image) {
          throw new Error(data?.message || "La API no devolvió imagen generada.");
        }

        setGeneratedImage(data.generated_image);
      } catch (error) {
        if (cancelled) return;
        setGeneratedImage(null);
        setGenerationError(error instanceof Error ? error.message : "Error al generar la imagen.");
      } finally {
        if (!cancelled) {
          setIsGenerating(false);
        }
      }
    }

    void generatePreviewImage();

    return () => {
      cancelled = true;
    };
  }, [displayProfile, previewItems]);

  const statusMessage = isGenerating
    ? "Generando vista con Nano Banana..."
    : generationError
      ? generationError
      : previewItems.length > 0
        ? "Vista previa del outfit generada por Nano Banana."
        : "Selecciona una prenda o outfit en Outfits para generar la vista.";

  return (
    <div style={{ marginBottom: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "20px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.08)", background: "radial-gradient(circle at top, rgba(201,168,76,0.12), rgba(17,17,18,0.72))" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300, color: "var(--text-primary)" }}>Visor Nano Banana</div>
            <div style={{ marginTop: "4px", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
              El cuerpo se genera como base fija. La ropa se posiciona encima sin cambiar la silueta del maniquí.
              {referencePhotoUrl ? " También usa tu foto de referencia para que el rostro se parezca más a ti." : ""}
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
          <div style={{ position: "relative", width: "100%", maxWidth: "520px", minHeight: "560px", background: "rgba(255,255,255,0.04)", borderRadius: "28px", border: "1px solid rgba(255,255,255,0.08)", padding: "18px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {generatedImage ? (
              <img
                src={generatedImage}
                alt="Vista previa Nano Banana"
                style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "24px" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", textAlign: "center", padding: "24px" }}>
                <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "12px" }}>{isGenerating ? "Generando imagen..." : "Sin vista generada"}</div>
                <div style={{ fontSize: "12px", lineHeight: 1.7 }}>
                  {statusMessage}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ position: "relative", borderRadius: "18px", padding: "14px", background: "rgba(0,0,0,0.22)", color: "var(--surface)", fontSize: "12px", lineHeight: 1.5, backdropFilter: "blur(12px)" }}>
          {statusMessage}
        </div>
      </div>
    </div>
  );
}
