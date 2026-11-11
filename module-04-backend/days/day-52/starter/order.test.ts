// =============================================================================
// Day 52 – Addis Eats Order Test File
// =============================================================================
// This file tests all the functions in order.ts using the sample order data.
// Run with:  npx ts-node order.test.ts
// =============================================================================

import sampleOrders from "./sample-orders.json";
import { Order, OrderStatus, deliveryFee, statusMessage, receipt } from "./order";

// ---------------------------------------------------------------------------
// Helper: simple test runner
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function expect(description: string, actual: unknown, expected: unknown): void {
  const ok =
    typeof expected === "number"
      ? actual === expected
      : JSON.stringify(actual) === JSON.stringify(expected);

  if (ok) {
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`         Expected: ${JSON.stringify(expected)}`);
    console.error(`         Received: ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Cast the JSON data to the Order type (TypeScript needs this hint)
// ---------------------------------------------------------------------------
const orders = sampleOrders as Order[];

// Get individual orders by ID for clarity
const ord001 = orders.find((o) => o.id === "ORD-001")!; // Bole, delivered, 550 ETB subtotal
const ord002 = orders.find((o) => o.id === "ORD-002")!; // Kazanchis, preparing, 430 ETB
const ord003 = orders.find((o) => o.id === "ORD-003")!; // Piassa, out-for-delivery, 330 ETB
const ord004 = orders.find((o) => o.id === "ORD-004")!; // Merkato, pending, 1070 ETB
const ord005 = orders.find((o) => o.id === "ORD-005")!; // Bole, confirmed, 220 ETB

// ---------------------------------------------------------------------------
// TEST SUITE 1 – deliveryFee()
// ---------------------------------------------------------------------------
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("TEST SUITE 1 – deliveryFee()");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// ORD-001: Bole, subtotal = 280+150+120 = 550 ETB → FREE (> 500 ETB)
expect(
  "ORD-001 (Bole, 550 ETB subtotal) → free delivery",
  deliveryFee(ord001),
  0
);

// ORD-005: Bole, subtotal = 220 ETB → 40 ETB (Bole rate, under 500 ETB)
expect(
  "ORD-005 (Bole, 220 ETB subtotal) → 40 ETB Bole rate",
  deliveryFee(ord005),
  40
);

// ORD-002: Kazanchis, subtotal = 350+80 = 430 ETB → 60 ETB (other area)
expect(
  "ORD-002 (Kazanchis, 430 ETB subtotal) → 60 ETB other area",
  deliveryFee(ord002),
  60
);

// ORD-003: Piassa, subtotal = 180+90+60 = 330 ETB → 60 ETB (other area)
expect(
  "ORD-003 (Piassa, 330 ETB subtotal) → 60 ETB other area",
  deliveryFee(ord003),
  60
);

// ORD-004: Merkato, subtotal = 420+380+120+150 = 1070 ETB → FREE (> 500 ETB)
expect(
  "ORD-004 (Merkato, 1070 ETB subtotal) → free delivery",
  deliveryFee(ord004),
  0
);

// ---------------------------------------------------------------------------
// TEST SUITE 2 – statusMessage()
// ---------------------------------------------------------------------------
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("TEST SUITE 2 – statusMessage()");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

const allStatuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out-for-delivery",
  "delivered",
  "cancelled",
];

for (const status of allStatuses) {
  const message = statusMessage(status);
  expect(
    `statusMessage("${status}") returns a non-empty string`,
    message.length > 0,
    true
  );
  console.log(`    → "${status}": ${message}`);
}

// ---------------------------------------------------------------------------
// TEST SUITE 3 – santim → ETB conversion
// ---------------------------------------------------------------------------
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("TEST SUITE 3 – Santim → ETB conversion");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// ORD-001 dishes: 28000 + 15000 + 12000 = 55000 santim = 550 ETB
const ord001Subtotal = ord001.dishes.reduce((s, d) => s + d.price, 0);
expect("ORD-001 subtotal in santim = 55000", ord001Subtotal, 55000);
expect("ORD-001 subtotal in ETB = 550", ord001Subtotal / 100, 550);

// ORD-005 dishes: 22000 santim = 220 ETB
const ord005Subtotal = ord005.dishes.reduce((s, d) => s + d.price, 0);
expect("ORD-005 subtotal in santim = 22000", ord005Subtotal, 22000);
expect("ORD-005 subtotal in ETB = 220", ord005Subtotal / 100, 220);

// ---------------------------------------------------------------------------
// TEST SUITE 4 – receipt()
// ---------------------------------------------------------------------------
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("TEST SUITE 4 – receipt() output");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

const receipt001 = receipt(ord001);
expect("ORD-001 receipt contains order ID", receipt001.includes("ORD-001"), true);
expect("ORD-001 receipt contains customer name", receipt001.includes("Abebe Girma"), true);
expect("ORD-001 receipt contains area", receipt001.includes("Bole"), true);
expect("ORD-001 receipt contains TeleBirr number", receipt001.includes("+251911234567"), true);
expect("ORD-001 receipt shows FREE delivery", receipt001.includes("FREE"), true);

const receipt002 = receipt(ord002);
expect("ORD-002 receipt does NOT contain TeleBirr", !receipt002.includes("TeleBirr"), true);

// ---------------------------------------------------------------------------
// TEST SUITE 5 – Full receipts printed
// ---------------------------------------------------------------------------
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("TEST SUITE 5 – Full sample receipts");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

for (const order of orders) {
  console.log("\n" + receipt(order) + "\n");
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

if (failed > 0) {
  process.exit(1);
}
