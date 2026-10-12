import { ImageResponse } from "next/og";
import dishes from "../../../../public/menu-data.json";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";

type ImageProps = {
  params: Promise<{ id: string }>;
};

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function DishOpenGraphImage({
  params,
}: ImageProps) {
  const { id } = await params;
  const dish = dishes.find((item) => item.id === id);
  if (!dish) {
    notFound();
  }

  let imageBase64 = "";
  try {
    const relPath = dish.image.startsWith("/") ? dish.image.slice(1) : dish.image;
    const imagePath = path.join(process.cwd(), "public", relPath);
    const buffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;

    // Satori / ImageResponse only decodes PNG or standard JPEG
    if (buffer && buffer.length >= 4) {
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
      const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
      if (isPng) {
        imageBase64 = `data:image/png;base64,${buffer.toString("base64")}`;
      } else if (isJpeg) {
        imageBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      }
    }
  } catch (error) {
    console.error("Failed to load dish OG image:", error);
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          backgroundColor: "#f8f4ec",
        }}
      >
        {imageBase64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageBase64}
            alt={dish.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#7a263a",
              color: "#ffffff",
              fontSize: 64,
              fontWeight: 800,
            }}
          >
            {dish.name}
          </div>
        )}
      </div>
    ),
    size
  );
}

