import "server-only";
import { randomUUID } from "node:crypto";
import { getDishes } from "@/lib/data";
import { DELIVERY_FEE } from "@/lib/pricing";
import {
  orderInputSchema,
  type OrderInput,
} from "@/lib/schemas";
import { executeTransaction, query } from "@/lib/db";

export type OrderItem = {
  dishId: string;
  dishName: string;
  unitPrice: number;
  quantity: number;
};

export type Order = {
  id: string;
  userId: string;
  status: "received" | "preparing" | "ready" | "cancelled";
  subtotal: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

export type StaffOrder = Order & {
  customerName: string;
};

async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const result = await query<OrderItem>(
    `SELECT dish_id AS "dishId", dish_name AS "dishName",
            unit_price AS "unitPrice", quantity
     FROM order_items WHERE order_id = ? ORDER BY id`,
    [orderId]
  );
  return result.rows;
}

export async function createOrder(
  userId: string,
  input: unknown
): Promise<Order> {
  const parsed = orderInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new OrderInputError(parsed.error.flatten().fieldErrors);
  }

  const dishes = await getDishes();
  const dishById = new Map(dishes.map((dish) => [dish.id, dish]));
  const orderLines = parsed.data.items.map((item) => {
    const dish = dishById.get(item.dishId);
    if (!dish) {
      throw new OrderInputError({
        items: [`Dish "${item.dishId}" is not available.`],
      });
    }

    return {
      dishId: dish.id,
      dishName: dish.name,
      unitPrice: dish.price,
      quantity: item.quantity,
    };
  });
  const subtotal = orderLines.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const total = subtotal + DELIVERY_FEE;
  const orderId = `ord_${randomUUID()}`;
  const createdAt = new Date().toISOString();

  await executeTransaction([
    {
      sql: `INSERT INTO orders
              (id, user_id, status, subtotal, total, created_at)
            VALUES (?, ?, 'received', ?, ?, ?)`,
      params: [orderId, userId, subtotal, total, createdAt],
    },
    ...orderLines.map((item) => ({
      sql: `INSERT INTO order_items
              (order_id, dish_id, dish_name, unit_price, quantity)
            VALUES (?, ?, ?, ?, ?)`,
      params: [
        orderId,
        item.dishId,
        item.dishName,
        item.unitPrice,
        item.quantity,
      ],
    })),
  ]);

  return {
    id: orderId,
    userId,
    status: "received",
    subtotal,
    total,
    createdAt,
    items: orderLines,
  };
}

export async function getOrderForUser(
  userId: string,
  orderId: string
): Promise<Order | undefined> {
  const result = await query<Omit<Order, "items">>(
    `SELECT id, user_id AS "userId", status, subtotal, total,
            created_at AS "createdAt"
     FROM orders WHERE id = ? AND user_id = ?`,
    [orderId, userId]
  );
  const order = result.rows[0];
  return order
    ? { ...order, items: await getOrderItems(order.id) }
    : undefined;
}

export async function getOrdersForUser(userId: string): Promise<Order[]> {
  const result = await query<Omit<Order, "items">>(
    `SELECT id, user_id AS "userId", status, subtotal, total,
            created_at AS "createdAt"
     FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  return Promise.all(
    result.rows.map(async (order) => ({
      ...order,
      items: await getOrderItems(order.id),
    }))
  );
}

export async function getOrderForStaff(
  orderId: string
): Promise<StaffOrder | undefined> {
  const result = await query<Omit<StaffOrder, "items">>(
    `SELECT orders.id, orders.user_id AS "userId", orders.status,
            orders.subtotal, orders.total,
            orders.created_at AS "createdAt",
            users.name AS "customerName"
     FROM orders
     JOIN users ON users.id = orders.user_id
     WHERE orders.id = ?`,
    [orderId]
  );
  const order = result.rows[0];
  return order
    ? { ...order, items: await getOrderItems(order.id) }
    : undefined;
}

export async function getAllOrdersForStaff(): Promise<StaffOrder[]> {
  const result = await query<Omit<StaffOrder, "items">>(
    `SELECT orders.id, orders.user_id AS "userId", orders.status,
            orders.subtotal, orders.total,
            orders.created_at AS "createdAt",
            users.name AS "customerName"
     FROM orders
     JOIN users ON users.id = orders.user_id
     ORDER BY orders.created_at DESC`
  );

  return Promise.all(
    result.rows.map(async (order) => ({
      ...order,
      items: await getOrderItems(order.id),
    }))
  );
}

export async function cancelOrderForUser(
  userId: string,
  orderId: string
): Promise<boolean> {
  const result = await query(
    `UPDATE orders SET status = 'cancelled'
     WHERE id = ? AND user_id = ? AND status = 'received'
     RETURNING id`,
    [orderId, userId]
  );
  return result.rowCount === 1;
}

export async function updateOrderStatus(
  orderId: string,
  status: "preparing" | "ready"
): Promise<boolean> {
  const result = await query(
    `UPDATE orders SET status = ?
     WHERE id = ? AND status IN ('received', 'preparing')
     RETURNING id`,
    [status, orderId]
  );
  return result.rowCount === 1;
}

export class OrderInputError extends Error {
  constructor(
    public readonly fieldErrors: Record<string, string[] | undefined>
  ) {
    super("The order details are invalid.");
    this.name = "OrderInputError";
  }
}

export function parseOrderInput(value: unknown): OrderInput {
  return orderInputSchema.parse(value);
}
