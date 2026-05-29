import { NextResponse } from "next/server";

export async function POST(
  req: Request
) {

  try {

    const formData =
      await req.formData();

    const image =
      formData.get("image");

    const imageUrl =
      formData.get("imageUrl");

    // FORM REMOVE.BG
    const removeBgForm =
      new FormData();

    // ARCHIVO
    if (image instanceof File) {

      removeBgForm.append(
        "image_file",
        image
      );

    }

    // URL
    else if (
      typeof imageUrl === "string"
    ) {

      removeBgForm.append(
        "image_url",
        imageUrl
      );

    }

    // NADA
    else {

      return NextResponse.json(
        {
          error: "No image"
        },
        {
          status: 400
        }
      );

    }

    // SIZE
    removeBgForm.append(
      "size",
      "auto"
    );

    // REQUEST API
    const response =
      await fetch(
        "https://api.remove.bg/v1.0/removebg",
        {
          method: "POST",

          headers: {
            "X-Api-Key":
              process.env
                .REMOVE_BG_API_KEY!,
          },

          body: removeBgForm,
        }
      );

    // ERROR
    if (!response.ok) {

      const errorText =
        await response.text();

      console.log(errorText);

      return NextResponse.json(
        {
          error:
            "Remove.bg failed"
        },
        {
          status: 500
        }
      );

    }

    // IMAGEN PNG
    const blob =
      await response.blob();

    return new Response(blob, {

      headers: {
        "Content-Type":
          "image/png",
      },

    });

  } catch (err) {

    console.log(err);

    return NextResponse.json(
      {
        error:
          "Server error"
      },
      {
        status: 500
      }
    );

  }

}