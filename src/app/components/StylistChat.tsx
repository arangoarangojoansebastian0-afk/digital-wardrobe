"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type OutfitItemIds = {
  upper?: string;
  lower?: string;
  outer?: string;
  dress?: string;
  shoes?: string;
  accessory?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  detectedIds?: OutfitItemIds | null;
};

type ClothingItem = {
  id: string | number; // Forzado a requerido para mapear IDs visuales
  title?: string | null;
  category?: string | null;
  type?: string | null;
  color?: string | null;
  style?: string | null;
  season?: string | null;
  tags?: string[] | null;
  image?: string | null; // NUEVO: Añadido para poder renderizar las fotos en el chat
  is_available?: boolean; // NUEVO: Control de ropa limpia/sucia
};

type StylistChatProps = {
  clothes: ClothingItem[];
  onApplySuggestedOutfit?: (itemIds: OutfitItemIds) => void;
  onSaveSuggestedOutfit?: (payload: { title: string; description?: string; item_ids: OutfitItemIds }) => Promise<unknown>;
};

const WELCOME_MESSAGE =
  "Hola. Soy tu stylist personal. Dime la ocasion, el clima o una prenda que quieras usar y armo propuestas con tu armario real.";

const EMPTY_WARDROBE_MESSAGE =
  "Todavia no veo prendas en tu armario. Puedes preguntarme que piezas base comprar primero, o agrega ropa y te propongo outfits con lo que tengas.";

const SUGGESTIONS = [
  "Que outfit me recomiendas para hoy?",
  "Necesito algo elegante para una cena",
  "Outfit casual para el fin de semana",
  "Que combina con mis jeans?",
  "Algo para clima frio",
];

function summarizeWardrobe(clothes: ClothingItem[]) {
  // NUEVO FILTRO: Solo resumir en la barra superior las prendas disponibles (limpias)
  const availableClothes = clothes.filter(item => item.is_available !== false);
  
  if (availableClothes.length === 0) return "Sin prendas limpias disponibles";

  const categories = availableClothes.reduce<Record<string, number>>((acc, item) => {
    const category = item.category?.trim() || "Sin categoria";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(categories)
    .map(([category, count]) => `${category}: ${count}`)
    .join(" | ");
}

export default function StylistChat({ clothes, onApplySuggestedOutfit, onSaveSuggestedOutfit }: StylistChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: WELCOME_MESSAGE,
      detectedIds: null
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveDraft, setSaveDraft] = useState<{
    item_ids: OutfitItemIds;
    title: string;
    description: string;
  } | null>(null);
  const [savingSuggested, setSavingSuggested] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // NUEVOS ESTADOS: Controlan la metadata de la app (puedes cambiarlos con botones en tu UI)
  const [city] = useState("Medellín");
  const [temperature] = useState("24°C");
  const [mood, setMood] = useState("Streetwear urbano"); // Selector de vibra/ánimo
  const [dislikedColors] = useState(["amarillo"]); // Colores prohibidos integrados

  const bottomRef = useRef<HTMLDivElement>(null);

  // Memorizar el resumen usando el filtro de disponibilidad global
  const wardrobeSummary = useMemo(() => summarizeWardrobe(clothes), [clothes]);
  const cleanClothesCount = useMemo(() => clothes.filter(i => i.is_available !== false).length, [clothes]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMessage: Message = { role: "user", content };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Limpiamos los mensajes anteriores para no mandarle JSON_IDS viejos a la IA
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })), 
          clothes, // Pasamos el array completo de ropa (el backend filtrará las is_available: false)
          context: {
            city,
            temperature,
            mood,
            disliked_colors: dislikedColors
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No pude responder, intenta de nuevo.");
      }

      const rawMessage = data.message || "";
      
      // TRUCO MAESTRO: Separar el texto limpio del bloque JSON_IDS oculto
      let cleanText = rawMessage;
      let detectedIds = null;

      if (rawMessage.includes("JSON_IDS:")) {
        const parts = rawMessage.split("JSON_IDS:");
        cleanText = parts[0].trim();
        try {
          detectedIds = JSON.parse(parts[1].trim());
        } catch (e) {
          console.warn("No se pudo parsear el JSON_IDS de la IA:", e);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: cleanText || "No pude generar una respuesta clara. Dame un poco mas de contexto.",
          detectedIds: detectedIds
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Hubo un error al hablar con Stylist. Intenta de nuevo.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: message,
          detectedIds: null
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Función interna para buscar una prenda por ID y pintar su miniatura
  const renderItemThumbnail = (id: string | number | undefined) => {
    if (!id) return null;
    const item = clothes.find(c => String(c.id) === String(id));
    if (!item || !item.image) return null;

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "var(--surface-4)", padding: "8px", borderRadius: "8px", border: "1px solid var(--border-subtle)", width: "70px" }}>
        <div style={{ position: "relative", width: "54px", height: "54px", borderRadius: "4px", overflow: "hidden" }}>
          <Image
            src={item.image || ""}
            alt={item.title || "Ropa"}
            fill
            sizes="54px"
            style={{ objectFit: "cover" }}
          />
        </div>
        <span style={{ fontSize: "9px", color: "var(--text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%", textAlign: "center" }}>
          {item.title}
        </span>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)", maxWidth: "800px" }}>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "var(--surface)" }}>
            S
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 300, fontStyle: "italic", color: "var(--gold)" }}>
                IA Stylist
              </div>
              {/* Selector visual rápido del Mood / Enfoque de estilo */}
              <select 
                value={mood} 
                onChange={(e) => setMood(e.target.value)}
                style={{ background: "var(--surface-3)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", borderRadius: "6px", fontSize: "11px", padding: "4px 8px", cursor: "pointer", outline: "none" }}
              >
                <option value="Streetwear urbano">Streetwear</option>
                <option value="Elegante y formal">Formal</option>
                <option value="Casual relajado">Casual</option>
                <option value="Deportivo funcional">Deportivo</option>
              </select>
            </div>
            <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: "2px" }}>
              {cleanClothesCount} limpias | {city} ({temperature})
            </div>
          </div>
        </div>
        <div style={{ marginTop: "14px", padding: "12px 14px", border: "1px solid var(--border-subtle)", borderRadius: "10px", background: "var(--surface-3)", color: "var(--text-secondary)", fontSize: "12px", lineHeight: 1.5 }}>
          {clothes.length > 0 ? wardrobeSummary : EMPTY_WARDROBE_MESSAGE}
        </div>
      </div>

      <div
        style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", paddingRight: "8px", marginBottom: "16px" }}
        className="scrollbar-hide"
      >
        {messages.map((msg, index) => (
          <div key={`${msg.role}-${index}`} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div
              style={{
                maxWidth: "80%",
                padding: "14px 18px",
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user" ? "var(--gold)" : "var(--surface-3)",
                border: msg.role === "user" ? "none" : "1px solid var(--border-subtle)",
                color: msg.role === "user" ? "var(--surface)" : "var(--text-primary)",
                fontSize: "14px",
                fontWeight: 300,
                lineHeight: 1.6,
                fontFamily: "var(--font-body)",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content}
              
              {/* NUEVO: Si la IA devolvió IDs válidos, pintamos las fotos de las prendas usadas justo debajo del texto */}
              {msg.role === "assistant" && msg.detectedIds && (
                <>
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
                    {renderItemThumbnail(msg.detectedIds.upper)}
                    {renderItemThumbnail(msg.detectedIds.lower)}
                    {renderItemThumbnail(msg.detectedIds.outer)}
                    {renderItemThumbnail(msg.detectedIds.dress)}
                    {renderItemThumbnail(msg.detectedIds.shoes)}
                    {renderItemThumbnail(msg.detectedIds.accessory)}
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>
                    {onApplySuggestedOutfit && (
                      <button
                        onClick={() => onApplySuggestedOutfit(msg.detectedIds as OutfitItemIds)}
                        style={{ background: "var(--gold)", border: "none", borderRadius: "14px", padding: "10px 14px", color: "var(--surface)", cursor: "pointer", fontSize: "12px", textTransform: "uppercase" }}
                      >
                        Aplicar outfit sugerido
                      </button>
                    )}
                    {onSaveSuggestedOutfit && (
                      <button
                        onClick={() => {
                          setSaveStatus("");
                          setSaveDraft({
                            item_ids: msg.detectedIds as OutfitItemIds,
                            title: "Outfit sugerido",
                            description: "",
                          });
                        }}
                        style={{ background: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "14px", padding: "10px 14px", color: "var(--text-primary)", cursor: "pointer", fontSize: "12px", textTransform: "uppercase" }}
                      >
                        Guardar outfit sugerido
                      </button>
                    )}
                  </div>

                  {saveDraft && JSON.stringify(saveDraft.item_ids) === JSON.stringify(msg.detectedIds) && (
                    <div style={{ marginTop: "14px", padding: "14px", borderRadius: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ display: "grid", gap: "10px" }}>
                        <input
                          value={saveDraft.title}
                          onChange={(e) => setSaveDraft((prev) => prev ? { ...prev, title: e.target.value } : prev)}
                          placeholder="Nombre del outfit"
                          style={{ width: "100%", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "12px", background: "var(--surface-3)", color: "var(--text-primary)", fontSize: "14px" }}
                        />
                        <textarea
                          value={saveDraft.description}
                          onChange={(e) => setSaveDraft((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                          rows={3}
                          placeholder="Descripción opcional"
                          style={{ width: "100%", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "12px", background: "var(--surface-3)", color: "var(--text-primary)", fontSize: "14px", resize: "vertical" }}
                        />
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                          <button
                            onClick={async () => {
                              if (!saveDraft) return;
                              setSavingSuggested(true);
                              try {
                                await onSaveSuggestedOutfit?.({
                                  title: saveDraft.title.trim() || "Outfit sugerido",
                                  description: saveDraft.description.trim() || undefined,
                                  item_ids: saveDraft.item_ids,
                                });
                                setSaveStatus("Outfit guardado correctamente.");
                                if (onApplySuggestedOutfit) {
                                  onApplySuggestedOutfit(saveDraft.item_ids);
                                }
                                setSaveDraft(null);
                              } catch (err) {
                                console.error(err);
                                setSaveStatus("No se pudo guardar el outfit. Intenta otra vez.");
                              } finally {
                                setSavingSuggested(false);
                              }
                            }}
                            disabled={savingSuggested}
                            style={{ background: "var(--gold)", border: "none", borderRadius: "14px", padding: "10px 14px", color: "var(--surface)", cursor: savingSuggested ? "not-allowed" : "pointer", fontSize: "12px", textTransform: "uppercase" }}
                          >
                            {savingSuggested ? "Guardando..." : "Guardar outfit"}
                          </button>
                          <button
                            onClick={() => setSaveDraft(null)}
                            disabled={savingSuggested}
                            style={{ background: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "14px", padding: "10px 14px", color: "var(--text-primary)", cursor: savingSuggested ? "not-allowed" : "pointer", fontSize: "12px", textTransform: "uppercase" }}
                          >
                            Cancelar
                          </button>
                        </div>
                        {saveStatus && <div style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{saveStatus}</div>}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "14px 18px", borderRadius: "16px 16px 16px 4px", background: "var(--surface-3)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {[0, 1, 2].map((index) => (
                  <div key={index} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--gold)", opacity: 0.6, animation: `pulse 1.2s ease-in-out ${index * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => sendMessage(suggestion)}
              style={{ padding: "8px 14px", borderRadius: "20px", border: "1px solid var(--border-subtle)", background: "var(--surface-3)", color: "var(--text-secondary)", fontSize: "12px", cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s", whiteSpace: "nowrap" }}
              onMouseEnter={(event) => {
                const button = event.currentTarget as HTMLButtonElement;
                button.style.borderColor = "var(--gold-dim)";
                button.style.color = "var(--gold)";
              }}
              onMouseLeave={(event) => {
                const button = event.currentTarget as HTMLButtonElement;
                button.style.borderColor = "var(--border-subtle)";
                button.style.color = "var(--text-secondary)";
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
        <div style={{ flex: 1, background: "var(--surface-3)", border: "1px solid var(--border-subtle)", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center" }}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Describe que necesitas..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 300 }}
          />
        </div>
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          aria-label="Enviar mensaje"
          style={{ width: "48px", height: "48px", borderRadius: "12px", background: loading || !input.trim() ? "var(--surface-4)" : "var(--gold)", border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", fontSize: "18px", color: loading || !input.trim() ? "var(--text-muted)" : "var(--surface)", flexShrink: 0 }}
        >
          ^
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}