"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  cancelOrderForUser,
  createOrder,
  OrderInputError,
  updateOrderStatus,
} from "@/lib/orders";
import { getSession } from "@/lib/session";

export type CheckoutState = {
  error?: string;
  fieldErrors?: string[];
  orderId?: string;
};

export async function createOrderAction(
  _previousState: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const session = await getSession();
  if (!session) {
    redirect("/signin?next=%2Fcheckout");
  }

  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? ""));
  } catch {
    return { error: "Your cart could not be read. Please try again." };
  }

  try {
    const order = await createOrder(session.userId, { items });
    revalidatePath("/orders");
    revalidatePath("/kitchen");
    return { orderId: order.id };
  } catch (error) {
    if (error instanceof OrderInputError) {
      return {
        error: error.message,
        fieldErrors: Object.values(error.fieldErrors).flatMap(
          (messages) => messages ?? []
        ),
      };
    }
    throw error;
  }
}

export async function cancelOrder(orderId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Authentication required." };
  }

  const success = cancelOrderForUser(session.userId, orderId);
  if (!success) {
    return {
      success: false,
      error: "Order not found or it can no longer be cancelled.",
    };
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/kitchen");
  return { success: true };
}

export type CancelOrderState = {
  error?: string;
  success?: boolean;
};

export async function cancelOrderAction(
  _previousState: CancelOrderState,
  formData: FormData
): Promise<CancelOrderState> {
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) {
    return { error: "Order ID is required." };
  }

  return cancelOrder(orderId);
}

export type KitchenActionState = {
  error?: string;
  success?: boolean;
};

export async function updateKitchenOrderAction(
  _previousState: KitchenActionState,
  formData: FormData
): Promise<KitchenActionState> {
  const session = await getSession();
  if (!session || session.role !== "staff") {
    return { error: "Staff access is required." };
  }

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (
    !orderId ||
    (status !== "preparing" && status !== "ready")
  ) {
    return { error: "Choose a valid order status." };
  }

  if (!updateOrderStatus(orderId, status)) {
    return { error: "Order not found or status cannot be changed." };
  }

  revalidatePath("/kitchen");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}
