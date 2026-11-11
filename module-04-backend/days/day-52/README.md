# Day 52 – Typing the Addis Eats Order

## Module 4: Node.js + NestJS | In-Class Exercise

---

## Learning Objectives

By the end of this exercise you will understand:

- **Union types** — restricting a variable to a fixed set of string values
- **Type aliases** — giving a custom name to a type
- **`readonly` properties** — values that cannot be changed after creation
- **Optional properties** — fields that may or may not be present
- **The `never` type** — a value that can never exist (used for exhaustive checks)
- **Exhaustive type checking** — letting TypeScript catch missing cases at compile time
- **`Intl.NumberFormat`** — formatting currency in a locale-aware way
- **Template literals** — multi-line strings with embedded expressions

---

## Assignment Overview

You will type the **Addis Eats** food-delivery order system using TypeScript.

Addis Eats is a fictional food-delivery platform serving Addis Ababa, Ethiopia.
Customers order dishes, pay in Ethiopian Birr (ETB), and receive deliveries to
different areas of the city.

---

## Starter Files

| File | Purpose |
|------|---------|
| `starter/order.ts` | Main TypeScript file — complete all TODOs here |
| `starter/tsconfig.json` | TypeScript compiler configuration |
| `starter/sample-orders.json` | Sample order data for testing |
| `starter/package.json` | Node.js project configuration |

---

## Tasks

### Task 1 – `Area` union type
Declare a union type called `Area` with exactly four delivery areas:
`"Bole"`, `"Kazanchis"`, `"Piassa"`, `"Merkato"`

### Task 2 – `OrderStatus` union type
Declare a union type called `OrderStatus` with five statuses:
`"pending"`, `"confirmed"`, `"preparing"`, `"out-for-delivery"`, `"delivered"`

### Task 3 – `Dish` type
Declare a `Dish` type with:
- `name: string`
- `price: number` *(stored in **santim**, the Ethiopian cent — 100 santim = 1 ETB)*

### Task 4 – `Order` type
Declare an `Order` type with:
- `readonly id: string` — cannot be changed after creation
- `customerName: string`
- `area: Area`
- `status: OrderStatus`
- `dishes: Dish[]`
- `telebirrPhone?: string` — optional TeleBirr mobile-money number

### Task 5 – `deliveryFee(order: Order): number`
Return the delivery fee in **ETB**:
- Orders with subtotal **> 500 ETB** → **free (0 ETB)**
- Area `"Bole"` → **40 ETB**
- All other areas → **60 ETB**

> ⚠️ Dish prices are stored in santim. Divide by 100 to convert to ETB.

### Task 6 – `statusMessage(status: OrderStatus): string`
Use a **switch statement** to return a human-readable message for each status.
Add a `never` check in the `default` branch for exhaustive checking.

### Task 7 – `receipt(order: Order): string`
Build a formatted receipt using a **template literal** and `Intl.NumberFormat`.
Display: ID, customer name, area, status, all dishes, subtotal, delivery fee, total.
Show the TeleBirr number only if it was provided.

---

## The Sixth-Status Challenge

After completing Tasks 1–7:

1. Add `"cancelled"` to the `OrderStatus` union.
2. Run `npx tsc --noEmit` — observe the **compiler error** in `statusMessage`.
3. TypeScript catches the missing case because of the `never` check!
4. Add the `"cancelled"` case to the switch statement.
5. Run the compiler again — **zero errors**.

---

## Running the Project

```powershell
# Install dependencies
npm install

# Check for TypeScript errors (no output = success)
npx tsc --noEmit

# Run the test file
npx ts-node starter/order.test.ts

# Or compile and run
npx tsc
node starter/order.js
```

---

## Submission

```powershell
git add .
git commit -m "feat: complete Day 52 Addis Eats TypeScript exercise"
git push
```
