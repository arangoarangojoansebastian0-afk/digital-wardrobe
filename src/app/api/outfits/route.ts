import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Outfit } from "@/types/clothing";

type OutfitPayload = {
  id?: string;
  user_id?: string;
  title?: string;
  description?: string;
  item_ids?: Partial<Outfit["item_ids"]>;
};

function normalizeItemIds(value: unknown): Outfit["item_ids"] {
  if (!value || typeof value !== "object") {
    return {};
  }

  return {
    upper: typeof (value as any).upper === "string" ? (value as any).upper : undefined,
    lower: typeof (value as any).lower === "string" ? (value as any).lower : undefined,
    outer: typeof (value as any).outer === "string" ? (value as any).outer : undefined,
    dress: typeof (value as any).dress === "string" ? (value as any).dress : undefined,
    shoes: typeof (value as any).shoes === "string" ? (value as any).shoes : undefined,
    accessory: typeof (value as any).accessory === "string" ? (value as any).accessory : undefined,
  };
}

function normalizeOutfit(value: any): Partial<Outfit> {
  return {
    id: typeof value?.id === "string" ? value.id : undefined,
    user_id: typeof value?.user_id === "string" ? value.user_id : undefined,
    title: typeof value?.title === "string" ? value.title : "Outfit guardado",
    description: typeof value?.description === "string" ? value.description : undefined,
    item_ids: normalizeItemIds(value?.item_ids),
    created_at: typeof value?.created_at === "string" ? value.created_at : undefined,
    updated_at: typeof value?.updated_at === "string" ? value.updated_at : undefined,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "Se requiere user_id." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("outfits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando outfits:", error);
    return NextResponse.json({ error: "No se pudo cargar los outfits." }, { status: 500 });
  }

  return NextResponse.json((data || []).map(normalizeOutfit));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as OutfitPayload;
    const userId = typeof body?.user_id === "string" ? body.user_id : "";
    const itemIds = normalizeItemIds(body.item_ids);

    if (!userId) {
      return NextResponse.json({ error: "Se requiere user_id." }, { status: 400 });
    }

    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json({ error: "El outfit debe tener un título." }, { status: 400 });
    }

    const validItems = Object.values(itemIds).filter(Boolean);
    if (validItems.length === 0) {
      return NextResponse.json({ error: "Selecciona al menos una prenda para guardar el outfit." }, { status: 400 });
    }

    const payload = {
      user_id: userId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      item_ids: itemIds,
    };

    const insertPayload = body.id
      ? { ...payload, id: body.id }
      : payload;

    const { data, error } = await supabase
      .from("outfits")
      .upsert(insertPayload, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error("Error guardando outfit:", error);
      return NextResponse.json({ error: "No se pudo guardar el outfit." }, { status: 500 });
    }

    return NextResponse.json(normalizeOutfit(data));
  } catch (error) {
    console.error("Error en outfit POST:", error);
    return NextResponse.json({ error: "Error procesando la solicitud." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { user_id?: string; id?: string };
    const userId = typeof body?.user_id === "string" ? body.user_id : "";
    const outfitId = typeof body?.id === "string" ? body.id : "";

    if (!userId || !outfitId) {
      return NextResponse.json({ error: "Se requiere user_id e id del outfit." }, { status: 400 });
    }

    const { error } = await supabase
      .from("outfits")
      .delete()
      .eq("user_id", userId)
      .eq("id", outfitId);

    if (error) {
      console.error("Error eliminando outfit:", error);
      return NextResponse.json({ error: "No se pudo eliminar el outfit." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en outfit DELETE:", error);
    return NextResponse.json({ error: "Error procesando la solicitud." }, { status: 500 });
  }
}
