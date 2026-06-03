import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { BodyProfile } from "@/types/mannequin";

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

function parseNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeBodyProfile(value: any): BodyProfile {
  return {
    id: typeof value?.id === "string" ? value.id : undefined,
    user_id: typeof value?.user_id === "string" ? value.user_id : undefined,
    height_cm: parseNumber(value?.height_cm, DEFAULT_BODY_PROFILE.height_cm),
    weight_kg: parseNumber(value?.weight_kg, DEFAULT_BODY_PROFILE.weight_kg),
    shoulder_width_cm: parseNumber(value?.shoulder_width_cm, DEFAULT_BODY_PROFILE.shoulder_width_cm),
    chest_circumference_cm: parseNumber(value?.chest_circumference_cm, DEFAULT_BODY_PROFILE.chest_circumference_cm),
    waist_circumference_cm: parseNumber(value?.waist_circumference_cm, DEFAULT_BODY_PROFILE.waist_circumference_cm),
    hip_circumference_cm: parseNumber(value?.hip_circumference_cm, DEFAULT_BODY_PROFILE.hip_circumference_cm),
    arm_length_cm: parseNumber(value?.arm_length_cm, DEFAULT_BODY_PROFILE.arm_length_cm),
    leg_length_cm: parseNumber(value?.leg_length_cm, DEFAULT_BODY_PROFILE.leg_length_cm),
    body_shape: typeof value?.body_shape === "string" ? value.body_shape : DEFAULT_BODY_PROFILE.body_shape,
    body_type: typeof value?.body_type === "string" ? value.body_type : DEFAULT_BODY_PROFILE.body_type,
    posture: typeof value?.posture === "string" ? value.posture : undefined,
    created_at: typeof value?.created_at === "string" ? value.created_at : undefined,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "Se requiere user_id." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("body_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error cargando body profile:", error);
    return NextResponse.json({ error: "No se pudo cargar el perfil corporal." }, { status: 500 });
  }

  return NextResponse.json(data ? normalizeBodyProfile(data) : DEFAULT_BODY_PROFILE);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = typeof body?.user_id === "string" ? body.user_id : "";

    if (!userId) {
      return NextResponse.json({ error: "Se requiere user_id." }, { status: 400 });
    }

    const profile = normalizeBodyProfile(body);
    const profileData = {
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      shoulder_width_cm: profile.shoulder_width_cm,
      chest_circumference_cm: profile.chest_circumference_cm,
      waist_circumference_cm: profile.waist_circumference_cm,
      hip_circumference_cm: profile.hip_circumference_cm,
      arm_length_cm: profile.arm_length_cm,
      leg_length_cm: profile.leg_length_cm,
      body_shape: profile.body_shape,
      body_type: profile.body_type,
      posture: profile.posture,
    };

    const { data: existing, error: readError } = await supabase
      .from("body_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (readError) {
      console.error("Error consultando body profile existente:", readError);
      return NextResponse.json({ error: "No se pudo consultar el perfil corporal." }, { status: 500 });
    }

    let result;
    if (existing?.id) {
      const { data, error } = await supabase
        .from("body_profiles")
        .update(profileData)
        .eq("user_id", userId)
        .select()
        .maybeSingle();
      result = { data, error };
    } else {
      const { data, error } = await supabase
        .from("body_profiles")
        .insert({ ...profileData, user_id: userId })
        .select()
        .maybeSingle();
      result = { data, error };
    }

    if (result.error) {
      console.error("Error guardando body profile:", result.error);
      return NextResponse.json({ error: "No se pudo guardar el perfil corporal." }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error en body profile POST:", error);
    return NextResponse.json({ error: "Error procesando la solicitud." }, { status: 500 });
  }
}
