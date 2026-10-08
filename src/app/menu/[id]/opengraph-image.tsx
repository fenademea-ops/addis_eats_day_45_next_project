import { ImageResponse } from "next/og";
import dishes from "../../../../public/menu-data.json";
import { notFound } from "next/navigation";

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

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          background: "#fff7ed",
          color: "#431407",
        }}
      >
        <div
          style={{ display: "flex", fontSize: 28, color: "#c2410c" }}
        >
          ADDIS EATS · {dish.category}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 76,
            fontWeight: 700,
          }}
        >
          {dish.name}
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 32 }}>
          {dish.description}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 30,
            fontWeight: 600,
          }}
        >
          {dish.price} ETB
        </div>
      </div>
    ),
    size
  );
}
