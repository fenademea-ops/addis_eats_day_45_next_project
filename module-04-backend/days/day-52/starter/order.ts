// =============================================================================
// Day 52 – Typing the Addis Eats Order
// Module 4: Node.js + NestJS | IBT College Canada
// =============================================================================
//
// Addis Eats is a food-delivery platform for Addis Ababa, Ethiopia.
// In this file we model orders using TypeScript's type system.
//
// CURRENCY NOTE:
//   All dish prices are stored in SANTIM (Ethiopian cents).
//   100 santim = 1 ETB (Ethiopian Birr).
//   We always divide by 100 when displaying or comparing to ETB amounts.
//   This avoids floating-point rounding errors (e.g., 0.1 + 0.2 ≠ 0.3).
// =============================================================================

// ---------------------------------------------------------------------------
// TASK 1 – Area union type
// ---------------------------------------------------------------------------
// A "union type" lists every legal value separated by |
// TypeScript will reject any string that is NOT one of these four values.

export type Area = "Bole" | "Kazanchis" | "Piassa" | "Merkato";

// ---------------------------------------------------------------------------
// TASK 2 – OrderStatus union type
// ---------------------------------------------------------------------------
// These are the five lifecycle stages an Addis Eats order can be in.
// (We will add a sixth later for the "Sixth-Status Challenge".)

export type OrderStatus =
  | "pending"           // Order placed, waiting for restaurant to confirm
  | "confirmed"         // Restaurant has accepted the order
  | "preparing"         // Kitchen is cooking the food
  | "out-for-delivery"  // Rider is on the way
  | "delivered"         // Order has arrived at the customer's door
  | "cancelled";        // Order was cancelled (sixth-status – added for challenge)

// ---------------------------------------------------------------------------
// TASK 3 – Dish type
// ---------------------------------------------------------------------------
// A single item on the menu. Price is in SANTIM (not ETB).

export type Dish = {
  name: string;
  price: number; // in santim (100 santim = 1 ETB)
};

// ---------------------------------------------------------------------------
// TASK 4 – Order type
// ---------------------------------------------------------------------------
// A complete customer order.
//
// Key details:
//   - `readonly id`      → cannot be reassigned after the object is created
//   - `telebirrPhone?`   → the ? means this property is optional (may be undefined)

export type Order = {
  readonly id: string;        // Unique order identifier – immutable
  customerName: string;       // Full name of the customer
  area: Area;                 // Delivery destination (must be one of the four areas)
  status: OrderStatus;        // Current lifecycle stage of the order
  dishes: Dish[];             // Array of dishes in the order
  telebirrPhone?: string;     // Optional TeleBirr mobile-money phone number
};

// ---------------------------------------------------------------------------
// TASK 5 – deliveryFee()
// ---------------------------------------------------------------------------
// Returns the delivery fee in ETB.
//
// Rules:
//   • Subtotal > 500 ETB  →  free delivery (0)
//   • Area "Bole"         →  40 ETB
//   • All other areas     →  60 ETB
//
// IMPORTANT: dish prices are in santim → divide by 100 to get ETB.

export function deliveryFee(order: Order): number {
  // Step 1: Sum up all dish prices (still in santim)
  const subtotalSantim: number = order.dishes.reduce(
    (total, dish) => total + dish.price,
    0
  );

  // Step 2: Convert santim → ETB
  const subtotalETB: number = subtotalSantim / 100;

  // Step 3: Free delivery for orders over 500 ETB
  if (subtotalETB > 500) {
    return 0;
  }

  // Step 4: Bole is cheaper to deliver to (closer to restaurant hub)
  if (order.area === "Bole") {
    return 40;
  }

  // Step 5: All other areas cost 60 ETB
  return 60;
}

// ---------------------------------------------------------------------------
// TASK 6 – statusMessage()
// ---------------------------------------------------------------------------
// Returns a friendly human-readable message for each order status.
//
// The `never` check in the default branch is the key to EXHAUSTIVE CHECKING:
//   - If we ever add a new status to the OrderStatus union but forget to
//     add a case here, TypeScript will give a compile-time error.
//   - This catches bugs BEFORE the code even runs.

export function statusMessage(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "⏳ Your order has been placed and is waiting for confirmation.";
    case "confirmed":
      return "✅ Great news! The restaurant has confirmed your order.";
    case "preparing":
      return "👨‍🍳 The kitchen is preparing your delicious food!";
    case "out-for-delivery":
      return "🛵 Your order is on its way! The rider is heading to you.";
    case "delivered":
      return "🎉 Your order has been delivered. Enjoy your meal!";
    case "cancelled":
      return "❌ Sorry, your order has been cancelled.";
    default:
      // This line can NEVER be reached if all cases are handled.
      // If a new status is added to the union but not handled above,
      // TypeScript will show an error here because `status` would have
      // an unknown type that cannot be assigned to `never`.
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck; // This satisfies the return type requirement
  }
}

// ---------------------------------------------------------------------------
// TASK 7 – receipt()
// ---------------------------------------------------------------------------
// Builds a formatted receipt string using a template literal.
// All santim amounts are converted to ETB before display.
// Uses Intl.NumberFormat for proper Ethiopian Birr formatting.

export function receipt(order: Order): string {
  // Create a formatter for Ethiopian Birr (ETB)
  // Intl.NumberFormat is a built-in JavaScript API for locale-aware number formatting.
  const etbFormatter = new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Helper: convert santim to ETB and format as currency string
  const formatETB = (santim: number): string =>
    etbFormatter.format(santim / 100);

  // Calculate subtotal in santim
  const subtotalSantim: number = order.dishes.reduce(
    (total, dish) => total + dish.price,
    0
  );

  // Calculate delivery fee in ETB
  const fee: number = deliveryFee(order);

  // Calculate total (subtotal in ETB + fee)
  const totalETB: number = subtotalSantim / 100 + fee;

  // Build the dish list lines
  const dishLines: string = order.dishes
    .map((dish) => `  • ${dish.name.padEnd(28)} ${formatETB(dish.price)}`)
    .join("\n");

  // TeleBirr line — only shown if the phone number was provided
  const telebirrLine: string = order.telebirrPhone
    ? `  TeleBirr Phone:  ${order.telebirrPhone}`
    : "";

  // Build the full receipt using a template literal (backtick string)
  return `
╔══════════════════════════════════════════╗
║          🍽  ADDIS EATS RECEIPT  🍽       ║
╚══════════════════════════════════════════╝

  Order ID:        ${order.id}
  Customer:        ${order.customerName}
  Delivery Area:   ${order.area}
  Status:          ${statusMessage(order.status)}
${telebirrLine ? `${telebirrLine}\n` : ""}
──────────────────────────────────────────
  ITEMS ORDERED
──────────────────────────────────────────
${dishLines}
──────────────────────────────────────────
  Subtotal:                     ${formatETB(subtotalSantim)}
  Delivery Fee:                 ${fee === 0 ? "FREE 🎁" : etbFormatter.format(fee)}
  ──────────────────────────────────────
  TOTAL:                        ${etbFormatter.format(totalETB)}
══════════════════════════════════════════
  Thank you for ordering with Addis Eats!
  አስደናቂ ምሳ / ድራሽ ይሁንልዎ! 🇪🇹
══════════════════════════════════════════
`.trim();
}
