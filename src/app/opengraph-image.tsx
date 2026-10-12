import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const alt = "Addis Eats - Authentic Ethiopian Food Delivery";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  let imageBase64 = "";
  try {
    // Use the iconic Ethiopian national dish: Doro Wat
    const imagePath = path.join(process.cwd(), "public", "images", "doro_wat.jpg");
    if (fs.existsSync(imagePath)) {
      const buffer = fs.readFileSync(imagePath);
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
      const mime = isPng ? "image/png" : "image/jpeg";
      imageBase64 = `data:${mime};base64,${buffer.toString("base64")}`;
    }
  } catch (error) {
    console.error("Failed to load OG preview image:", error);
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
        {/* Left Column: Branding & Copy */}
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
              gap: "10px",
              padding: "8px 18px",
              background: "rgba(234, 88, 12, 0.25)",
              border: "1px solid rgba(234, 88, 12, 0.5)",
              borderRadius: "9999px",
              color: "#fb923c",
              fontSize: 22,
              fontWeight: 600,
              alignSelf: "flex-start",
              marginBottom: "24px",
            }}
          >
            <span>Addis Eats</span>
            <span style={{ color: "#fdba74" }}>• Authentic Ethiopian Cuisine</span>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.1,
              marginBottom: "20px",
            }}
          >
            Addis Eats
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#fed7aa",
              lineHeight: 1.4,
              marginBottom: "32px",
            }}
          >
            Order Doro Wot, Tibs, Kitfo and Shiro delivered fresh across Addis Ababa.
          </div>

          <div
            style={{
              display: "flex",
              gap: "24px",
              fontSize: 20,
              color: "#fdba74",
              fontWeight: 500,
            }}
          >
            <span>• Traditional Recipes</span>
            <span>• Fast Delivery</span>
            <span>• Fresh Injera</span>
          </div>
        </div>

        {/* Right Column: Hero Dish Photo Card */}
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
              alt="Addis Eats Food"
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

