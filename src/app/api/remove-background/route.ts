import { NextResponse } from "next/server";

const REMOVE_BG_URL = "https://api.remove.bg/v1.0/removebg";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function dataUrlToBase64(value: string) {
  const match = value.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  return match?.[1] || "";
}

function resolveUrl(sourceUrl: string, candidateUrl: string) {
  try {
    return new URL(candidateUrl, sourceUrl).toString();
  } catch {
    return "";
  }
}

function extractImageUrlFromHtml(html: string, sourceUrl: string) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i,
    /<img[^>]+src=["']([^"']+)["'][^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const candidate = match?.[1];
    if (candidate) {
      const resolved = resolveUrl(sourceUrl, candidate.replace(/&amp;/g, "&"));
      if (resolved && isHttpUrl(resolved)) return resolved;
    }
  }

  return "";
}

async function appendRemoteImage(removeBgForm: FormData, imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl, {
    headers: {
      Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8,text/html;q=0.7,*/*;q=0.5",
    },
  });

  if (!response.ok) {
    throw new Error("No se pudo descargar la imagen de la URL.");
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.toLowerCase().includes("text/html")) {
    const html = await response.text();
    const extractedImageUrl = extractImageUrlFromHtml(html, imageUrl);
    if (!extractedImageUrl || extractedImageUrl === imageUrl) {
      throw new Error("La pagina no contiene una imagen detectable.");
    }

    return appendRemoteImage(removeBgForm, extractedImageUrl);
  }

  if (!contentType.toLowerCase().startsWith("image/")) {
    throw new Error("La URL no devuelve una imagen valida.");
  }

  const blob = await response.blob();
  const mimeType = contentType.split(";")[0] || "image/png";
  const extension = mimeType.split("/")[1] || "png";
  const file = new File([blob], `remote-image.${extension}`, { type: mimeType });

  removeBgForm.append("image_file", file);
  return imageUrl;
}

async function callRemoveBg(removeBgForm: FormData) {
  removeBgForm.append("size", "auto");
  removeBgForm.append("format", "png");

  return fetch(REMOVE_BG_URL, {
    method: "POST",
    headers: {
      "X-Api-Key": process.env.REMOVE_BG_API_KEY || "",
    },
    body: removeBgForm,
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.REMOVE_BG_API_KEY) {
      return jsonError("Falta configurar REMOVE_BG_API_KEY.", 500);
    }

    const formData = await req.formData();
    const image = formData.get("image");
    const imageUrl = getString(formData, "imageUrl");
    const imageBase64 = getString(formData, "imageBase64");
    const imageDataUrl = getString(formData, "imageDataUrl");
    const removeBgForm = new FormData();
    let resolvedRemoteImageUrl = "";

    if (image instanceof File && image.size > 0) {
      removeBgForm.append("image_file", image);
    } else if (imageDataUrl) {
      const base64 = dataUrlToBase64(imageDataUrl);
      if (!base64) return jsonError("Data URL de imagen invalida.", 400);
      removeBgForm.append("image_file_b64", base64);
    } else if (imageBase64) {
      removeBgForm.append("image_file_b64", imageBase64);
    } else if (imageUrl) {
      if (!isHttpUrl(imageUrl)) {
        return jsonError("La URL debe empezar por http:// o https://.", 400);
      }

      try {
        resolvedRemoteImageUrl = await appendRemoteImage(removeBgForm, imageUrl);
      } catch (error) {
        console.warn("Falling back to remove.bg image_url:", error);
        removeBgForm.append("image_url", imageUrl);
        resolvedRemoteImageUrl = imageUrl;
      }
    } else {
      return jsonError("No se recibio ninguna imagen.", 400);
    }

    let response = await callRemoveBg(removeBgForm);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Remove.bg failed:", errorText);

      if (resolvedRemoteImageUrl) {
        const retryForm = new FormData();
        retryForm.append("image_url", resolvedRemoteImageUrl);
        response = await callRemoveBg(retryForm);

        if (response.ok) {
          const retryBlob = await response.blob();
          return new Response(retryBlob, {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "no-store",
            },
          });
        }

        console.error("Remove.bg retry failed:", await response.text());
      }

      return jsonError("No se pudo eliminar el fondo de la imagen.", response.status);
    }

    const blob = await response.blob();

    return new Response(blob, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Remove background error:", error);
    return jsonError("Error del servidor al eliminar el fondo.", 500);
  }
}
