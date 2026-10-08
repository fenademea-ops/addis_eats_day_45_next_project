import "server-only";
import { randomUUID } from "node:crypto";
import { getDishes } from "@/lib/data";
import { DELIVERY_FEE } from "@/lib/pricing";
import {
  orderInputSchema,
  type OrderInput,
} from "@/lib/schemas";
import { getDatabase } from "@/lib/db";

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

function getOrderItems(orderId: string): OrderItem[] {
  return getDatabase()
    .prepare(
      `SELECT dish_id AS dishId, dish_name AS dishName,
              unit_price AS unitPrice, quantity
       FROM order_items WHERE order_id = ? ORDER BY id`
    )
    .all(orderId) as OrderItem[];
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
  const database = getDatabase();
  const insertOrder = database.prepare(
    `INSERT INTO orders (id, user_id, status, subtotal, total, created_at)
     VALUES (?, ?, 'received', ?, ?, ?)`
  );
  const insertItem = database.prepare(
    `INSERT INTO order_items
       (order_id, dish_id, dish_name, unit_price, quantity)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertTransaction = database.transaction(() => {
    insertOrder.run(orderId, userId, subtotal, total, createdAt);
    for (const item of orderLines) {
      insertItem.run(
        orderId,
        item.dishId,
        item.dishName,
        item.unitPrice,
        item.quantity
      );
    }
  });
  insertTransaction();

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

export function getOrderForUser(
  userId: string,
  orderId: string
): Order | undefined {
  const order = getDatabase()
    .prepare(
      `SELECT id, user_id AS userId, status, subtotal, total,
              created_at AS createdAt
       FROM orders WHERE id = ? AND user_id = ?`
    )
    .get(orderId, userId) as Omit<Order, "items"> | undefined;

  return order ? { ...order, items: getOrderItems(order.id) } : undefined;
}

export function getOrdersForUser(userId: string): Order[] {
  const orders = getDatabase()
    .prepare(
      `SELECT id, user_id AS userId, status, subtotal, total,
              created_at AS createdAt
       FROM orders WHERE user_id = ? ORDER BY created_at DESC`
    )
    .all(userId) as Omit<Order, "items">[];

  return orders.map((order) => ({
    ...order,
    items: getOrderItems(order.id),
  }));
}

export function getOrderForStaff(orderId: string): StaffOrder | undefined {
  const order = getDatabase()
    .prepare(
      `SELECT orders.id, orders.user_id AS userId, orders.status,
              orders.subtotal, orders.total,
              orders.created_at AS createdAt, users.name AS customerName
       FROM orders
       JOIN users ON users.id = orders.user_id
       WHERE orders.id = ?`
    )
    .get(orderId) as Omit<StaffOrder, "items"> | undefined;

  return order ? { ...order, items: getOrderItems(order.id) } : undefined;
}

export function getAllOrdersForStaff(): StaffOrder[] {
  const orders = getDatabase()
    .prepare(
      `SELECT orders.id, orders.user_id AS userId, orders.status,
              orders.subtotal, orders.total,
              orders.created_at AS createdAt, users.name AS customerName
       FROM orders
       JOIN users ON users.id = orders.user_id
       ORDER BY orders.created_at DESC`
    )
    .all() as Omit<StaffOrder, "items">[];

  return orders.map((order) => ({
    ...order,
    items: getOrderItems(order.id),
  }));
}

export function cancelOrderForUser(
  userId: string,
  orderId: string
): boolean {
  const result = getDatabase()
    .prepare(
      `UPDATE orders SET status = 'cancelled'
       WHERE id = ? AND user_id = ? AND status = 'received'`
    )
    .run(orderId, userId);

  return result.changes === 1;
}

export function updateOrderStatus(
  orderId: string,
  status: "preparing" | "ready"
): boolean {
  const result = getDatabase()
    .prepare(
      `UPDATE orders SET status = ?
       WHERE id = ? AND status IN ('received', 'preparing')`
    )
    .run(status, orderId);

  return result.changes === 1;
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
