import fs from "fs/promises";
import path from "path";

export type Dish = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
};

export async function getDishes(): Promise<Dish[]> {
  const filePath = path.join(
    process.cwd(),
    "public",
    "menu-data.json"
  );

  const file = await fs.readFile(filePath, "utf-8");

  return JSON.parse(file) as Dish[];
}

export async function getDishById(
  id: string
): Promise<Dish | undefined> {
  const dishes = await getDishes();

  return dishes.find((dish) => dish.id === id);
}