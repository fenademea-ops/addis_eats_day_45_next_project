import { NextRequest, NextResponse } from "next/server";
import {
  createOrder,
  getOrdersForUser,
  OrderInputError,
} from "@/lib/orders";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    items: await getOrdersForUser(session.userId),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }
    return NextResponse.json(
      { fieldErrors: { body: ["Request body must be valid JSON."] } },
      { status: 422 }
    );
  }

  try {
    const order = await createOrder(session.userId, payload);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof OrderInputError) {
      return NextResponse.json(
        { fieldErrors: error.fieldErrors },
        { status: 422 }
      );
    }
    throw error;
  }
}
