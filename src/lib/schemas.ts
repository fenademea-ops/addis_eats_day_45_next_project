import { z } from "zod";

export const orderInputSchema = z.object({
  items: z
    .array(
      z.object({
        dishId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1)
    .max(30),
});

export type OrderInput = z.infer<typeof orderInputSchema>;
