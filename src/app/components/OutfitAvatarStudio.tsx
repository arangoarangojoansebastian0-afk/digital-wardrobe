"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { RefreshCcw, RotateCcw, Save, Shirt, SlidersHorizontal, Trash2, Upload, Wand2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ClothingItem } from "@/types/clothing";

type BodyParams = {
  height_cm: number;
  shoulder_cm: number;
  chest_cm: number;
  waist_cm: number;
  hips_cm: number;
  inseam_cm: number;
  body_shape: string;
};

type AvatarProfile = {
  id?: string;
  avatar_image: string;
  reference_photo?: string;
  body_params: BodyParams;
};

type OutfitLayer = {
  id: string;
  clothing: ClothingItem;
  x: number;
  y: number;
  width: number;
  rotation: number;
  z: number;
};

const defaultBodyParams: BodyParams = {
  height_cm: 170,
  shoulder_cm: 42,
  chest_cm: 92,
  waist_cm: 76,
  hips_cm: 96,
  inseam_cm: 78,
  body_shape: "natural",
};

const BODY_STORAGE_KEY = "avatar-profile";
const OUTFIT_STORAGE_KEY = "current-outfit-layers";

const fallbackAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='720' viewBox='0 0 360 720'%3E%3Crect width='360' height='720' fill='%2318181A'/%3E%3Cg fill='%232C2C2F' stroke='%23C9A84C' stroke-opacity='.28' stroke-width='2'%3E%3Cellipse cx='180' cy='72' rx='42' ry='48'/%3E%3Cpath d='M128 132 C150 116 210 116 232 132 L254 346 C260 404 236 456 224 520 L206 690 L174 690 L166 522 L154 690 L122 690 L136 520 C124 458 100 404 106 346 Z'/%3E%3Cpath d='M126 150 C78 210 70 300 84 392' fill='none'/%3E%3Cpath d='M234 150 C282 210 290 300 276 392' fill='none'/%3E%3C/g%3E%3C/svg%3E";

function getPlacement(item: ClothingItem) {
  const category = `${item.category || ""} ${item.outfit_slot || ""}`.toLowerCase();
  const slot = item.outfit_slot || (
    category.includes("zapato") ? "shoes" :
    category.includes("pantal") || category.includes("falda") ? "lower" :
    category.includes("vestido") ? "dress" :
    category.includes("chaqueta") || category.includes("abrigo") ? "outer" :
    category.includes("acces") ? "accessory" :
    "upper"
  );

  const defaults: Record<string, { x: number; y: number; width: number; z: number }> = {
    upper: { x: 50, y: 35, width: 38, z: 8 },
    lower: { x: 50, y: 60, width: 36, z: 6 },
    dress: { x: 50, y: 49, width: 44, z: 9 },
    outer: { x: 50, y: 37, width: 46, z: 12 },
    shoes: { x: 50, y: 86, width: 34, z: 10 },
    accessory: { x: 50, y: 27, width: 24, z: 14 },
  };

  const base = defaults[slot] || defaults.upper;
  return {
    x: item.outfit_anchor_x ?? base.x,
    y: item.outfit_anchor_y ?? base.y,
    width: item.outfit_width ?? base.width,
    z: item.outfit_layer ?? base.z,
  };
}

export default function OutfitAvatarStudio({ clothes }: { clothes: ClothingItem[] }) {
  const [avatar, setAvatar] = useState<AvatarProfile | null>(null);
  const [bodyParams, setBodyParams] = useState(defaultBodyParams);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [layers, setLayers] = useState<OutfitLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [isCompact, setIsCompact] = useState(false);
  const dragState = useRef<{ id: string; startX: number; startY: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const handleResize = () => setIsCompact(window.innerWidth < 1180);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(BODY_STORAGE_KEY);
    if (stored) {
      try {
        const profile = JSON.parse(stored) as AvatarProfile;
        setAvatar(profile);
        setBodyParams(profile.body_params || defaultBodyParams);
      } catch {
        localStorage.removeItem(BODY_STORAGE_KEY);
      }
    }

    const storedLayers = localStorage.getItem(OUTFIT_STORAGE_KEY);
    if (storedLayers) {
      try {
        const parsed = JSON.parse(storedLayers) as OutfitLayer[];
        if (Array.isArray(parsed)) setLayers(parsed);
      } catch {
        localStorage.removeItem(OUTFIT_STORAGE_KEY);
      }
    }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("avatar_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) return;

      if (data?.avatar_image && data?.body_params) {
        const profile = {
          id: data.id,
          avatar_image: data.avatar_image,
          reference_photo: data.reference_photo,
          body_params: data.body_params,
        } as AvatarProfile;
        setAvatar(profile);
        setBodyParams(profile.body_params);
        localStorage.setItem(BODY_STORAGE_KEY, JSON.stringify(profile));
      }
    });
  }, []);

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selectedLayerId) || null,
    [layers, selectedLayerId]
  );

  const updateBodyParam = (key: keyof BodyParams, value: string) => {
    setBodyParams((prev) => ({
      ...prev,
      [key]: key === "body_shape" ? value : Number(value),
    }));
  };

  const isBodyReady = useMemo(() => (
    bodyParams.height_cm >= 120 &&
    bodyParams.shoulder_cm >= 25 &&
    bodyParams.chest_cm >= 55 &&
    bodyParams.waist_cm >= 45 &&
    bodyParams.hips_cm >= 55 &&
    bodyParams.inseam_cm >= 45 &&
    Boolean(bodyParams.body_shape)
  ), [bodyParams]);

  const addLayer = (item: ClothingItem) => {
    const placement = getPlacement(item);
    const id = `${item.id}-${Date.now()}`;
    setLayers((prev) => [
      ...prev,
      {
        id,
        clothing: item,
        x: placement.x,
        y: placement.y,
        width: placement.width,
        rotation: 0,
        z: placement.z,
      },
    ]);
    setSelectedLayerId(id);
  };

  const updateLayer = (id: string, patch: Partial<OutfitLayer>) => {
    setLayers((prev) => prev.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)));
  };

  const removeLayer = () => {
    if (!selectedLayerId) return;
    setLayers((prev) => prev.filter((layer) => layer.id !== selectedLayerId));
    setSelectedLayerId("");
  };

  const handlePointerDown = (event: PointerEvent<HTMLImageElement>, layer: OutfitLayer) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      id: layer.id,
      startX: event.clientX,
      startY: event.clientY,
      x: layer.x,
      y: layer.y,
    };
    setSelectedLayerId(layer.id);
  };

  const handlePointerMove = (event: PointerEvent<HTMLImageElement>) => {
    const current = dragState.current;
    if (!current) return;

    const canvas = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!canvas) return;

    const nextX = current.x + ((event.clientX - current.startX) / canvas.width) * 100;
    const nextY = current.y + ((event.clientY - current.startY) / canvas.height) * 100;

    updateLayer(current.id, {
      x: Math.min(100, Math.max(0, nextX)),
      y: Math.min(100, Math.max(0, nextY)),
    });
  };

  const handlePointerUp = () => {
    dragState.current = null;
  };

  const dataUrlToBlob = async (dataUrl: string) => {
    const response = await fetch(dataUrl);
    return response.blob();
  };

  const uploadAvatarImage = async (userId: string, dataUrl: string) => {
    if (!dataUrl.startsWith("data:image/")) return dataUrl;

    const blob = await dataUrlToBlob(dataUrl);
    const path = `${userId}/avatar-${Date.now()}.png`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { contentType: blob.type || "image/png", upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl || dataUrl;
  };

  const saveBodyProfile = async (userId: string) => {
    await fetch("/api/body-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        height_cm: bodyParams.height_cm,
        weight_kg: 68,
        shoulder_width_cm: bodyParams.shoulder_cm,
        chest_circumference_cm: bodyParams.chest_cm,
        waist_circumference_cm: bodyParams.waist_cm,
        hip_circumference_cm: bodyParams.hips_cm,
        arm_length_cm: 60,
        leg_length_cm: bodyParams.inseam_cm,
        body_shape: bodyParams.body_shape === "inverted-triangle" ? "inverted_triangle" : bodyParams.body_shape,
        body_type: "mesomorph",
      }),
    }).catch(() => undefined);
  };

  const saveProfile = async (profile: AvatarProfile) => {
    const { data: { user } } = await supabase.auth.getUser();
    let profileToSave = profile;

    if (user) {
      await saveBodyProfile(user.id);

      try {
        const avatarUrl = await uploadAvatarImage(user.id, profile.avatar_image);
        profileToSave = { ...profile, avatar_image: avatarUrl };
      } catch {
        profileToSave = profile;
      }

      await supabase.from("avatar_profiles").upsert({
        user_id: user.id,
        avatar_image: profileToSave.avatar_image,
        reference_photo: profileToSave.reference_photo || null,
        body_params: profileToSave.body_params,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }

    localStorage.setItem(BODY_STORAGE_KEY, JSON.stringify(profileToSave));
    setAvatar(profileToSave);
  };

  const generateAvatar = async () => {
    setError("");

    if (!photoFile) {
      setError("La foto de cuerpo es obligatoria para mantener siempre el mismo avatar.");
      return;
    }

    if (!isBodyReady) {
      setError("Completa todas las medidas corporales antes de generar el avatar.");
      return;
    }

    setGenerating(true);

    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      Object.entries(bodyParams).forEach(([key, value]) => formData.append(key, String(value)));

      const response = await fetch("/api/avatar/generate", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo generar el avatar.");
      }

      await saveProfile({
        avatar_image: data.image,
        reference_photo: photoPreview,
        body_params: bodyParams,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el avatar.");
    } finally {
      setGenerating(false);
    }
  };

  const bodyScale = {
    shoulder: Math.min(1.22, Math.max(0.82, bodyParams.shoulder_cm / 42)),
    chest: Math.min(1.2, Math.max(0.82, bodyParams.chest_cm / 92)),
    waist: Math.min(1.18, Math.max(0.76, bodyParams.waist_cm / 76)),
    hips: Math.min(1.22, Math.max(0.82, bodyParams.hips_cm / 96)),
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "280px minmax(360px, 1fr) 286px", gap: "18px", minHeight: "calc(100vh - 110px)" }}>
      <aside className="premium-card" style={{ borderRadius: "8px", padding: "18px", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <Shirt size={18} color="var(--gold)" />
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--text-primary)" }}>Prendas</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Arrastra o toca para vestir</div>
          </div>
        </div>
        <div className="scrollbar-hide" style={{ display: "grid", gridTemplateColumns: isCompact ? "repeat(auto-fit, minmax(210px, 1fr))" : "1fr", gap: "10px", maxHeight: isCompact ? "360px" : "calc(100vh - 190px)", overflowY: "auto" }}>
          {clothes.map((item) => (
            <button
              key={item.id}
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/plain", String(item.id))}
              onClick={() => addLayer(item)}
              style={{ display: "grid", gridTemplateColumns: "54px 1fr", gap: "10px", alignItems: "center", textAlign: "left", padding: "9px", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.025)", color: "var(--text-primary)", cursor: "grab" }}
            >
              {item.image ? (
                <img src={item.image} alt={item.title || ""} style={{ width: "54px", height: "64px", objectFit: "contain", background: "var(--surface-4)", borderRadius: "6px" }} />
              ) : (
                <span style={{ width: "54px", height: "64px", borderRadius: "6px", background: "var(--surface-4)", display: "grid", placeItems: "center", color: "var(--text-muted)", fontSize: "10px" }}>Sin foto</span>
              )}
              <span>
                <span style={{ display: "block", fontSize: "12px", lineHeight: 1.25 }}>{item.title}</span>
                <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>{item.category}</span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section
        className="premium-card"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const id = event.dataTransfer.getData("text/plain");
          const item = clothes.find((piece) => String(piece.id) === id);
          if (item) addLayer(item);
        }}
        style={{ borderRadius: "8px", position: "relative", minHeight: isCompact ? "620px" : "680px", overflow: "hidden", background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01)), #101012" }}
      >
        <div style={{ position: "absolute", top: "18px", left: "20px", zIndex: 30 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--text-primary)" }}>Visualizador 2D</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Cuerpo fijo + prendas ajustables</div>
        </div>

        <div style={{ position: "absolute", inset: "74px 34px 28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", width: "min(58vh, 430px)", height: "100%", minHeight: "560px", maxHeight: "760px" }}>
            <div style={{ position: "absolute", left: "50%", top: "2%", transform: "translateX(-50%)", width: "32%", height: "9%", borderRadius: "50%", background: "rgba(255,255,255,0.045)", border: "1px solid var(--border-subtle)" }} />
            <div style={{ position: "absolute", left: "50%", top: "12%", transform: "translateX(-50%)", width: `${42 * bodyScale.shoulder}%`, height: "10%", borderRadius: "48% 48% 24% 24%", background: "rgba(103,214,196,0.08)", border: "1px solid rgba(103,214,196,0.18)" }} />
            <div style={{ position: "absolute", left: "50%", top: "20%", transform: "translateX(-50%)", width: `${34 * bodyScale.chest}%`, height: "24%", borderRadius: "38% 38% 24% 24%", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)" }} />
            <div style={{ position: "absolute", left: "50%", top: "39%", transform: "translateX(-50%)", width: `${25 * bodyScale.waist}%`, height: "13%", borderRadius: "22%", background: "rgba(255,255,255,0.035)", border: "1px solid var(--border-subtle)" }} />
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translateX(-50%)", width: `${34 * bodyScale.hips}%`, height: "13%", borderRadius: "34%", background: "rgba(229,140,159,0.07)", border: "1px solid rgba(229,140,159,0.16)" }} />
            <img src={avatar?.avatar_image || fallbackAvatar} alt="Avatar" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: avatar ? 0.82 : 0.58, pointerEvents: "none", mixBlendMode: "screen" }} />

            {layers.map((layer) => (
              layer.clothing.image ? (
                <img
                  key={layer.id}
                  src={layer.clothing.image}
                  alt={layer.clothing.title || ""}
                  onPointerDown={(event) => handlePointerDown(event, layer)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  style={{ position: "absolute", left: `${layer.x}%`, top: `${layer.y}%`, width: `${layer.width}%`, transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`, zIndex: layer.z, cursor: "grab", touchAction: "none", filter: selectedLayerId === layer.id ? "drop-shadow(0 0 18px rgba(201,168,76,0.45))" : "drop-shadow(0 14px 22px rgba(0,0,0,0.34))" }}
                />
              ) : null
            ))}
          </div>
        </div>
      </section>

      <aside className="premium-card" style={{ borderRadius: "8px", padding: "18px", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <SlidersHorizontal size={18} color="var(--gold)" />
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--text-primary)" }}>Avatar</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Foto y cuerpo obligatorios</div>
          </div>
        </div>

        {!avatar && (
          <div style={{ padding: "12px", borderRadius: "8px", border: "1px solid rgba(229,140,159,0.24)", background: "rgba(229,140,159,0.08)", color: "var(--accent-rose)", fontSize: "12px", lineHeight: 1.5, marginBottom: "14px" }}>
            Para usar outfits 2D necesitas una foto de cuerpo y medidas. Asi el avatar siempre conserva el mismo cuerpo.
          </div>
        )}

        <label style={{ display: "grid", placeItems: "center", minHeight: "126px", borderRadius: "8px", border: "1px dashed var(--border)", background: "rgba(255,255,255,0.025)", cursor: "pointer", marginBottom: "14px", color: "var(--text-secondary)", textAlign: "center", padding: "16px" }}>
          <Upload size={22} color="var(--gold)" />
          <span style={{ fontSize: "12px", marginTop: "8px" }}>{photoPreview ? "Cambiar foto de cuerpo" : "Subir foto de cuerpo"}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setPhotoFile(file);
              setPhotoPreview(URL.createObjectURL(file));
            }}
            style={{ display: "none" }}
          />
        </label>

        {photoPreview && <img src={photoPreview} alt="Foto de referencia" style={{ width: "100%", maxHeight: "180px", objectFit: "contain", borderRadius: "8px", background: "var(--surface-4)", marginBottom: "14px" }} />}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {[
            ["height_cm", "Altura"],
            ["shoulder_cm", "Hombros"],
            ["chest_cm", "Pecho"],
            ["waist_cm", "Cintura"],
            ["hips_cm", "Cadera"],
            ["inseam_cm", "Entrepierna"],
          ].map(([key, label]) => (
            <label key={key} style={{ display: "grid", gap: "6px", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              {label}
              <input required value={bodyParams[key as keyof BodyParams]} onChange={(event) => updateBodyParam(key as keyof BodyParams, event.target.value)} type="number" style={{ background: "var(--surface-3)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "8px", padding: "10px", width: "100%" }} />
            </label>
          ))}
        </div>

        <label style={{ display: "grid", gap: "6px", marginTop: "10px", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Tipo de cuerpo
          <select value={bodyParams.body_shape} onChange={(event) => updateBodyParam("body_shape", event.target.value)} style={{ background: "var(--surface-3)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "8px", padding: "10px", width: "100%" }}>
            <option value="natural">Natural</option>
            <option value="rectangular">Rectangular</option>
            <option value="triangular">Triangular</option>
            <option value="inverted-triangle">Triangulo invertido</option>
            <option value="hourglass">Reloj de arena</option>
            <option value="oval">Ovalado</option>
          </select>
        </label>

        {error && <div style={{ marginTop: "12px", color: "#FCA5A5", fontSize: "12px", lineHeight: 1.45 }}>{error}</div>}

        <button onClick={generateAvatar} disabled={generating || !photoFile || !isBodyReady} style={{ width: "100%", marginTop: "14px", border: "none", borderRadius: "10px", padding: "13px", background: generating || !photoFile || !isBodyReady ? "var(--surface-4)" : "var(--gold-gradient)", color: generating || !photoFile || !isBodyReady ? "var(--text-muted)" : "var(--surface)", cursor: generating ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: 600 }}>
          {generating ? <RefreshCcw size={16} /> : <Wand2 size={16} />}
          {generating ? "Generando avatar..." : "Generar avatar"}
        </button>

        {selectedLayer && (
          <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "20px", marginBottom: "10px" }}>{selectedLayer.clothing.title}</div>
            <label style={{ fontSize: "10px", color: "var(--text-muted)" }}>Escala</label>
            <input type="range" min="10" max="90" value={selectedLayer.width} onChange={(event) => updateLayer(selectedLayer.id, { width: Number(event.target.value) })} style={{ width: "100%", accentColor: "var(--gold)" }} />
            <label style={{ fontSize: "10px", color: "var(--text-muted)" }}>Rotacion</label>
            <input type="range" min="-35" max="35" value={selectedLayer.rotation} onChange={(event) => updateLayer(selectedLayer.id, { rotation: Number(event.target.value) })} style={{ width: "100%", accentColor: "var(--gold)" }} />
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button onClick={() => updateLayer(selectedLayer.id, { rotation: 0 })} style={{ flex: 1, borderRadius: "8px", padding: "10px", border: "1px solid var(--border-subtle)", background: "var(--surface-3)", color: "var(--text-primary)", cursor: "pointer" }}><RotateCcw size={15} /></button>
              <button onClick={removeLayer} style={{ flex: 1, borderRadius: "8px", padding: "10px", border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "#FCA5A5", cursor: "pointer" }}><Trash2 size={15} /></button>
            </div>
          </div>
        )}

        <button onClick={() => localStorage.setItem(OUTFIT_STORAGE_KEY, JSON.stringify(layers))} style={{ width: "100%", marginTop: "14px", border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "12px", background: "rgba(255,255,255,0.025)", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <Save size={15} />
          Guardar composicion
        </button>
      </aside>
    </div>
  );
}
