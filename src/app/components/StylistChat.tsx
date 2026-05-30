"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ClothingItem = {
  id?: string | number;
  title?: string | null;
  category?: string | null;
  type?: string | null;
  color?: string | null;
  style?: string | null;
  season?: string | null;
  tags?: string[] | null;
};

type StylistChatProps = {
  clothes: ClothingItem[];
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
  if (clothes.length === 0) return "Sin prendas cargadas";

  const categories = clothes.reduce<Record<string, number>>((acc, item) => {
    const category = item.category?.trim() || "Sin categoria";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(categories)
    .map(([category, count]) => `${category}: ${count}`)
    .join(" | ");
}

export default function StylistChat({ clothes }: StylistChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: WELCOME_MESSAGE,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const wardrobeSummary = useMemo(() => summarizeWardrobe(clothes), [clothes]);

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
          messages: nextMessages,
          clothes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No pude responder, intenta de nuevo.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message || "No pude generar una respuesta clara. Dame un poco mas de contexto.",
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
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)", maxWidth: "800px" }}>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "var(--surface)" }}>
            S
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 300, fontStyle: "italic", color: "var(--gold)" }}>
              IA Stylist
            </div>
            <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: "2px" }}>
              {clothes.length} prendas en tu armario
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
          <div key={`${msg.role}-${index}`} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
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
