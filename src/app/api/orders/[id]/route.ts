import { NextRequest, NextResponse } from "next/server";
import {
  cancelOrderForUser,
  getOrderForUser,
} from "@/lib/orders";
import { getSession } from "@/lib/session";

type OrderRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: OrderRouteContext
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const order = await getOrderForUser(session.userId, id);
  if (!order) {
    return NextResponse.json(
      { error: "Order not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(order);
}

export async function PATCH(
  _request: NextRequest,
  { params }: OrderRouteContext
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!(await cancelOrderForUser(session.userId, id))) {
    return NextResponse.json(
      { error: "Order not found or it can no longer be cancelled." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
