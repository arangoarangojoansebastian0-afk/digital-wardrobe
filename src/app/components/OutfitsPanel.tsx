"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClothingItem, Outfit, OutfitItemIds } from "@/types/clothing";

const OUTFIT_SLOTS = ["upper", "lower", "outer", "dress", "shoes", "accessory"] as const;

type OutfitSlot = (typeof OUTFIT_SLOTS)[number];

type OutfitsPanelProps = {
  clothes: ClothingItem[];
  outfits: Outfit[];
  selectedOutfit: Outfit | null;
  initialSelectedItems?: OutfitItemIds;
  selectedItems?: OutfitItemIds;
  onSaveOutfit: (payload: { title: string; description?: string; item_ids: OutfitItemIds }) => Promise<void>;
  onSelectItems?: (item_ids: OutfitItemIds) => void;
  onDeleteOutfit: (id: string | number) => Promise<void>;
  onPreviewOutfit: (outfit: Outfit) => void;
  onClearPreview: () => void;
};

function getItemsForSlot(clothes: ClothingItem[], slot: OutfitSlot) {
  const withSlot = clothes.filter((item) => item.outfit_slot === slot);
  return withSlot.length > 0 ? withSlot : clothes;
}

function formatSlotLabel(slot: OutfitSlot) {
  switch (slot) {
    case "upper": return "Parte superior";
    case "lower": return "Parte inferior";
    case "outer": return "Capa exterior";
    case "dress": return "Vestido";
    case "shoes": return "Calzado";
    case "accessory": return "Accesorio";
  }
}

export default function OutfitsPanel({ clothes, outfits, selectedOutfit, initialSelectedItems, selectedItems: selectedItemsProp, onSaveOutfit, onSelectItems, onDeleteOutfit, onPreviewOutfit, onClearPreview }: OutfitsPanelProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedItems, setSelectedItems] = useState<OutfitItemIds>(selectedItemsProp || initialSelectedItems || {});

  useEffect(() => {
    if (selectedItemsProp && Object.keys(selectedItemsProp).length > 0) {
      setSelectedItems(selectedItemsProp);
      return;
    }

    if (initialSelectedItems && Object.keys(initialSelectedItems).length > 0) {
      setSelectedItems((prev) => ({ ...prev, ...initialSelectedItems }));
    }
  }, [initialSelectedItems, selectedItemsProp]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const availableClothes = useMemo(
    () => clothes.filter((item) => item.is_available !== false),
    [clothes]
  );

  const canSave = Boolean(title.trim()) && Object.values(selectedItems).filter(Boolean).length >= 1;

  const handleSelect = (slot: OutfitSlot, value: string) => {
    const nextItems = { ...selectedItems, [slot]: value || undefined };
    setSelectedItems(nextItems);
    onSelectItems?.(nextItems);
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setMessage("");

    try {
      await onSaveOutfit({ title: title.trim(), description: description.trim() || undefined, item_ids: selectedItems });
      setTitle("");
      setDescription("");
      setSelectedItems({});
      setMessage("Outfit guardado correctamente.");
    } catch (error) {
      setMessage("No se pudo guardar el outfit. Intenta de nuevo.");
      console.error(error);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div style={{ display: "grid", gap: "26px" }}>
      <div style={{ display: "grid", gap: "18px", padding: "24px", borderRadius: "24px", border: "1px solid var(--border-subtle)", background: "var(--surface-2)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 300, color: "var(--text-primary)" }}>Crea un outfit</div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>Selecciona las piezas del armario que quieras combinar y guarda tu look para revisarlo después.</div>
        </div>

        <div style={{ display: "grid", gap: "14px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Título del outfit</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Look del viernes" 
            style={{ width: "100%", border: "1px solid var(--border-subtle)", borderRadius: "14px", padding: "14px", background: "var(--surface-3)", color: "var(--text-primary)", fontSize: "14px" }}
          />
        </div>

        <div style={{ display: "grid", gap: "14px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Descripción opcional</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Un outfit cómodo para salir con amigos"
            style={{ width: "100%", border: "1px solid var(--border-subtle)", borderRadius: "14px", padding: "14px", background: "var(--surface-3)", color: "var(--text-primary)", fontSize: "14px", resize: "vertical" }}
          />
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          {OUTFIT_SLOTS.map((slot) => {
            const slotItems = getItemsForSlot(availableClothes, slot);
            return (
              <div key={slot} style={{ display: "grid", gap: "8px" }}>
                <label style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{formatSlotLabel(slot)}</label>
                <select
                  value={selectedItems[slot] ?? ""}
                  onChange={(e) => handleSelect(slot, e.target.value)}
                  style={{ width: "100%", border: "1px solid var(--border-subtle)", borderRadius: "14px", padding: "12px 14px", background: "var(--surface-3)", color: "var(--text-primary)", fontSize: "14px", cursor: "pointer" }}
                >
                  <option value="">No seleccionar</option>
                  {slotItems.map((item) => (
                    <option key={String(item.id)} value={String(item.id)}>
                      {item.title || item.category || "Prenda"}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-start" }}>
          <button
            onClick={save}
            disabled={!canSave || saving}
            style={{ background: canSave && !saving ? "var(--gold)" : "var(--surface-4)", border: "none", borderRadius: "14px", color: canSave && !saving ? "var(--surface)" : "var(--text-muted)", padding: "14px 18px", fontSize: "12px", textTransform: "uppercase", cursor: canSave && !saving ? "pointer" : "not-allowed" }}
          >
            {saving ? "Guardando..." : "Guardar outfit"}
          </button>
          {message && <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{message}</div>}
        </div>
      </div>

      <div style={{ display: "grid", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 300, color: "var(--text-primary)" }}>Tus outfits</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{outfits.length} guardar{outfits.length === 1 ? "do" : "dos"}</div>
          </div>
        </div>

        {outfits.length === 0 ? (
          <div style={{ padding: "22px", borderRadius: "20px", border: "1px dashed var(--border-subtle)", color: "var(--text-muted)", background: "rgba(255,255,255,0.02)" }}>
            No tienes outfits guardados todavía. Crea uno usando el formulario de arriba.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "18px" }}>
            {outfits.map((outfit) => {
              const isActive = selectedOutfit?.id === outfit.id;
              return (
                <div key={String(outfit.id)} style={{ padding: "18px", borderRadius: "20px", border: `1px solid ${isActive ? "var(--gold)" : "var(--border-subtle)"}`, background: isActive ? "rgba(255,215,145,0.08)" : "var(--surface-3)", boxShadow: isActive ? "0 20px 60px rgba(255,200,85,0.12)" : undefined }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "220px" }}>
                      <div style={{ fontSize: "16px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "6px" }}>{outfit.title}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>{outfit.description ?? "Sin descripción"}</div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => onPreviewOutfit(outfit)}
                        style={{ background: "var(--gold)", border: "none", borderRadius: "12px", color: "var(--surface)", padding: "10px 14px", cursor: "pointer", fontSize: "11px", textTransform: "uppercase" }}
                      >
                        {selectedOutfit?.id === outfit.id ? "Outfit aplicado" : "Aplicar outfit"}
                      </button>
                      <button
                        onClick={() => onDeleteOutfit(outfit.id)}
                        style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.24)", borderRadius: "12px", color: "#FCA5A5", padding: "10px 14px", cursor: "pointer", fontSize: "11px", textTransform: "uppercase" }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "12px" }}>
                    {Object.entries(outfit.item_ids).map(([slot, id]) => {
                      if (!id) return null;
                      const item = clothes.find((entry) => String(entry.id) === String(id));
                      if (!item) return null;
                      return (
                        <div key={slot} style={{ width: "108px", display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ width: "108px", height: "108px", borderRadius: "16px", overflow: "hidden", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            {item.image ? (
                              <img src={item.image} alt={item.title ?? "Prenda"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "11px", textAlign: "center", padding: "8px" }}>Sin imagen</div>
                            )}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{formatSlotLabel(slot as OutfitSlot)}</div>
                          <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.3 }}>{item.title ?? item.category ?? "Prenda"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
