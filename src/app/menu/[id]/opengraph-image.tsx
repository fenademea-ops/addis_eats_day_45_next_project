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
    let imagePath = path.join(process.cwd(), "public", relPath);
    let buffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;

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

    // Fallback to doro_wat.jpg if dish image is WebP or missing
    if (!imageBase64) {
      const fallbackPath = path.join(process.cwd(), "public", "images", "doro_wat.jpg");
      if (fs.existsSync(fallbackPath)) {
        const fallbackBuffer = fs.readFileSync(fallbackPath);
        imageBase64 = `data:image/jpeg;base64,${fallbackBuffer.toString("base64")}`;
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
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "60px 70px",
          background: "linear-gradient(135deg, #431407 0%, #1c1917 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: "600px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              background: "rgba(234, 88, 12, 0.2)",
              border: "1px solid rgba(234, 88, 12, 0.5)",
              borderRadius: "9999px",
              color: "#fb923c",
              fontSize: 20,
              fontWeight: 600,
              alignSelf: "flex-start",
              marginBottom: "20px",
            }}
          >
            ADDIS EATS · {dish.category.toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.1,
              marginBottom: "18px",
            }}
          >
            {dish.name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#fed7aa",
              lineHeight: 1.4,
              marginBottom: "28px",
            }}
          >
            {dish.description}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 38,
              fontWeight: 700,
              color: "#f97316",
            }}
          >
            {dish.price} ETB
          </div>
        </div>

        {imageBase64 && (
          <div
            style={{
              display: "flex",
              width: "420px",
              height: "420px",
              borderRadius: "32px",
              overflow: "hidden",
              border: "4px solid rgba(251, 146, 60, 0.4)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageBase64}
              alt={dish.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}
      </div>
    ),
    size
  );
}

