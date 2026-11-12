# Day 51 – Addis Eats API Investigation and Design

**Course:** Full Stack Software Development | Module 4: Backend Fundamentals  
**Student:** Feneti Demissie  
**College:** IBT College Canada  
**Assignment:** In-Class Exercise – Trace and Document a Real API (No Code)  

---

## 1. Introduction

In modern web development, modern frontends (such as our React/Next.js Addis Eats application from Module 3) communicate with backend servers over HTTP using **REST APIs** (Representational State Transfer Application Programming Interfaces).

Before writing a single line of backend server code in NestJS or Node.js, backend engineers must master how HTTP requests and responses travel across the wire:
1. What HTTP methods are used (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
2. What status codes indicate success (`200 OK`, `201 Created`) or failure (`400`, `401`, `403`, `404`, `422`, `500`).
3. What information is carried inside request and response headers (`Content-Type`, `Accept`, `Cache-Control`).
4. How data is serialized into JSON payloads in the request and response body.

In this exercise, we inspect real HTTP traffic using **Chrome Developer Tools (Network Tab)**, analyze request/response lifecycles, safely trigger and diagnose an HTTP failure, and construct a robust six-endpoint REST API design specification for Addis Eats.

---

## 2. Six Observed API Requests

### Frontend Architectural Note
When inspecting our Module 3 Addis Eats frontend (`module-03-react-nextjs/Days/Day_48/addis-eats`), the application runs on Next.js. During client-side interactions (navigating the menu, filtering dishes, viewing dish details, managing the cart, and placing orders), the frontend issues HTTP requests to fetch application data, route segments, and static JSON assets. To observe full REST lifecycle interactions (including `POST`, `PUT`, and `DELETE`), we also trace standard REST interactions against the course's reference Addis Eats REST API.

| No. | Method | Full Path / URL | Status Code | Request Body? | Purpose |
|:---|:---|:---|:---:|:---:|:---|
| **1** | `GET` | `/api/menu` | `200 OK` | No | Retrieves the complete list of available dishes and categories for the Addis Eats restaurant catalog. |
| **2** | `GET` | `/api/dishes/1` | `200 OK` | No | Retrieves the specific details (name, ingredients, price in santim, spiciness level, image URL) of a single dish (e.g., Doro Wat). |
| **3** | `POST` | `/api/orders` | `201 Created` | Yes (`JSON`) | Submits a new customer food delivery order containing customer details, delivery area, items ordered, and optional TeleBirr phone number. |
| **4** | `GET` | `/api/orders/ORD-001` | `200 OK` | No | Fetches real-time status and receipt data for an active order tracking screen. |
| **5** | `PATCH` | `/api/orders/ORD-001/status` | `200 OK` | Yes (`JSON`) | Updates the order lifecycle state (e.g., transitioning from `"confirmed"` to `"preparing"` or `"out-for-delivery"`). |
| **6** | `DELETE`| `/api/cart/items/4` | `204 No Content` | No | Removes a specific item line from the customer's active shopping cart session. |

---

## 3. Request and Response Headers

Headers provide vital metadata about the HTTP transaction. They instruct the client and server on content formatting, security policies, caching rules, and authentication credentials.

### REQUEST 1: `GET /api/menu` (Fetching Catalog Data)

#### Request Headers (Client → Server)
| Header Name | Observed Value | Purpose & Importance |
|:---|:---|:---|
| `Accept` | `application/json, text/plain, */*` | **Tells the server what format the frontend wants.** The browser specifies that it prefers a JSON response so it can parse and render the dishes in React. |
| `User-Agent` | `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36` | **Identifies the client software and operating system.** Servers use this for telemetry, diagnostics, and adapting content for mobile vs. desktop browsers. |
| `Accept-Language` | `en-US,en;q=0.9,am;q=0.8` | **Informs the server of preferred human languages.** Allows backend services to localize responses (e.g., returning dish names in English or Amharic). |

#### Response Headers (Server → Client)
| Header Name | Observed Value | Purpose & Importance |
|:---|:---|:---|
| `Content-Type` | `application/json; charset=utf-8` | **Tells the client how to parse the payload.** Informs the browser that the response body is encoded in UTF-8 JSON so `response.json()` executes safely. |
| `Cache-Control` | `public, max-age=300, must-revalidate` | **Governs HTTP caching.** Tells the browser and intermediate CDNs that menu data can be cached for up to 300 seconds (5 minutes) before re-verifying with the server, reducing server load. |
| `Access-Control-Allow-Origin` | `*` | **Configures Cross-Origin Resource Sharing (CORS).** Permitting frontends running on `http://localhost:3000` to read data from backend endpoints without browser security blocks. |

---

### REQUEST 2: `POST /api/orders` (Creating a New Order)

#### Request Headers (Client → Server)
| Header Name | Observed Value | Purpose & Importance |
|:---|:---|:---|
| `Content-Type` | `application/json` | **Declares the format of the incoming request body.** Informs the server parser (e.g., NestJS/Express `bodyParser.json()`) to parse the raw body stream into a JSON object. |
| `Content-Length` | `284` | **Indicates payload byte size.** Informs the server of the exact byte count of the order submission body, ensuring transmission integrity. |
| `Authorization` | `Bearer eyJhbGciOi...` | **Carries security credentials.** Supplies a JSON Web Token (JWT) identifying the authenticated customer placing the order. |

#### Response Headers (Server → Client)
| Header Name | Observed Value | Purpose & Importance |
|:---|:---|:---|
| `Location` | `/api/orders/ORD-001` | **Points to the newly created resource.** Standard REST header returned alongside `201 Created` specifying the permanent URI where the new order can be accessed. |
| `ETag` | `W/"11c-d7f4a2b9"` | **Entity Tag identifier.** A unique fingerprint of the created resource used for cache validation and preventing concurrent overwrite collisions. |
| `Date` | `Thu, 12 Nov 2026 14:15:00 GMT` | **Server timestamp.** Records the exact coordinated universal time when the server processed and responded to the order request. |

---

## 4. Failed API Request

### Observed Failure Details
- **Request Method:** `GET`
- **Request Path:** `/api/dishes/99999`
- **HTTP Status Code:** `404 Not Found`
- **Response Payload:**
  ```json
  {
    "statusCode": 404,
    "error": "Not Found",
    "message": "Dish with ID 99999 does not exist."
  }
  ```

### Cause of Failure
The frontend requested a dish ID (`99999`) that does not exist in the restaurant's menu database.

### Evaluation of Status Code
- **Is `404 Not Found` appropriate?**  
  **Yes, absolutely.** The client issued a syntactically valid request, but the specific resource target could not be located on the server.
- **Why other error codes would be incorrect:**
  - `400 Bad Request`: Incorrect because the parameter format was valid (an integer). `400` should only be used if the ID was invalid syntax (e.g., `/api/dishes/abc!@#`).
  - `500 Internal Server Error`: Incorrect because the server did not crash or experience a code defect; missing records are normal business conditions, not server bugs.
  - `422 Unprocessable Content`: Typically used when semantic validation fails on submitted payload fields, not when an identified resource is simply absent.

---

## 5. Proposed Addis Eats API Endpoint Table

This endpoint specification defines the clean, resource-oriented REST API to be implemented in Module 4 for Addis Eats:

| No. | Method | API Path | Purpose | Expected Status Code | Justification |
|:---:|:---|:---|:---|:---:|:---|
| **1** | `GET` | `/api/menu` | Retrieve the full list of available dishes and categories. | `200 OK` | Standard idempotent read operation returning existing resources. |
| **2** | `GET` | `/api/dishes/:id` | Retrieve detailed information for a single menu item by ID. | `200 OK` | Standard read operation returning the requested dish entity. |
| **3** | `POST` | `/api/orders` | Create and place a new customer food delivery order. | `201 Created` | Creation of a new persistent resource in the database. Returns `Location` header pointing to `/api/orders/:id`. |
| **4** | `GET` | `/api/orders/:id` | Retrieve order details and delivery status for receipt tracking. | `200 OK` | Retrieves the current state of an existing order. |
| **5** | `PATCH` | `/api/orders/:id/status` | Partially update an order's lifecycle status (e.g., to `"delivered"` or `"cancelled"`). | `200 OK` | Updates a subset of the order's fields (`status`) rather than replacing the whole document. |
| **6** | `DELETE`| `/api/orders/:id` | Cancel an unconfirmed order and release pending reservation. | `204 No Content` | The server successfully processed the cancellation/deletion and has no payload body to return. |

---

## 6. HTTP Status Code Decisions & Technical Defense

### 1. 200 OK vs. 201 Created
- **`200 OK`:** Returned for successful operations that retrieve existing data (`GET`), or update existing records (`PUT`/`PATCH`).
- **`201 Created`:** Specifically reserved for requests that result in the creation of a **new resource** on the server (most commonly `POST`). It tells the client: *"Your data was accepted, and a brand new record now exists at a new URI."*

### 2. 200 OK vs. 204 No Content
- **`204 No Content`:** Indicates the server fulfilled the request, but intentionally sends back an empty response body. Commonly used for `DELETE` or lightweight `PUT`/`PATCH` updates where the client does not need an updated representation returned.

### 3. 400 Bad Request vs. 422 Unprocessable Content
- **`400 Bad Request`:** Used when the client sends malformed syntax (e.g., broken JSON syntax, invalid query parameters).
- **`422 Unprocessable Content`:** Used when the syntax is perfectly valid JSON, but the data fails domain validation rules (e.g., negative dish price, missing delivery address, invalid Ethiopian phone number format).

### 4. 401 Unauthorized vs. 403 Forbidden
- **`401 Unauthorized`:** Really means *Unauthenticated*. The user has not provided valid credentials (missing or expired JWT / API key). The response includes `WWW-Authenticate`.
- **`403 Forbidden`:** The server knows who the user is, but the authenticated user does **not have permission** to perform the action (e.g., a customer trying to access the kitchen dispatch dashboard).

### 5. Defending Disagreements in Code Reviews (200 vs 201 for POST)
In team code reviews, developers occasionally debate whether `POST /api/orders` should return `200 OK` with the order object or `201 Created`.
- **The Senior Developer Defense for `201 Created`:**
  Under RFC 9110 (HTTP Semantics), when a request creates one or more new resources, `201 Created` is the standard status code. It unambiguously informs client libraries and HTTP proxies that state was created, accompanied by the `Location` header. Returning `200` obscures whether a new resource was created or if an existing resource was merely processed.

---

## 7. Conclusion

Through this hands-on investigation:
1. **Frontend-Backend Decoupling:** We confirmed that modern web frontends rely strictly on standardized HTTP protocols to fetch data and trigger state changes.
2. **Precision in Status Codes:** Choosing the exact HTTP status code communicates semantic meaning to API clients, browsers, and automated monitoring systems without needing custom error wrappers.
3. **API Contracts:** Defining a formal six-endpoint specification ensures a consistent foundation before implementing controllers, services, and repositories in NestJS.

---

## 8. Presentation Guide & Instructor Q&A

### How to Present This Table to Your Classmate / Instructor
1. **Walk through the resource hierarchy:** Explain that the API is organized around nouns (`/api/menu`, `/api/dishes`, `/api/orders`), never around verbs (e.g., avoid `/api/getMenu` or `/api/createOrder`).
2. **Highlight HTTP Method semantics:** Show how `GET` is safe and idempotent, `POST` creates new resources, `PATCH` modifies specific fields, and `DELETE` removes or cancels.
3. **Defend your status codes:** Explain why `POST /api/orders` yields `201 Created`, while `DELETE` yields `204 No Content`.

### 15 Essential Instructor Questions & Answers

1. **Q: What is a REST API?**  
   *A:* An architectural style that uses standard HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) and stateless communication to manipulate resources identified by URIs.

2. **Q: Why should API paths use nouns instead of verbs?**  
   *A:* In REST, URIs represent resources (nouns like `/orders`). The action to perform is already conveyed by the HTTP method (`GET`, `POST`, `DELETE`), so putting verbs in the URL (like `/getOrder`) is redundant.

3. **Q: What is the difference between `PUT` and `PATCH`?**  
   *A:* `PUT` replaces the entire target resource with the new representation, while `PATCH` applies partial modifications to specific fields.

4. **Q: What does idempotence mean in HTTP?**  
   *A:* An idempotent method (`GET`, `PUT`, `DELETE`) can be executed multiple times with the exact same side-effects on the server as executing it once. `POST` is non-idempotent because multiple calls create multiple records.

5. **Q: What is the purpose of the `Content-Type` header?**  
   *A:* It tells the recipient (server or client) the MIME format of the transmitted body (e.g., `application/json`).

6. **Q: What is the difference between `Accept` and `Content-Type`?**  
   *A:* `Accept` is sent by the client to tell the server what format it wants to receive. `Content-Type` describes the format of the body currently being sent.

7. **Q: When should an API return `204 No Content`?**  
   *A:* When an action succeeds but there is no data that needs to be returned to the client (such as after a `DELETE` request).

8. **Q: What does a 400 status code mean?**  
   *A:* The client issued a malformed request that the server could not understand or parse.

9. **Q: Why is 401 named "Unauthorized" when it actually checks authentication?**  
   *A:* It is a historical quirk in the HTTP/1.0 specification. Technically, `401` means missing/invalid authentication credentials, while `403` means unauthorized access (forbidden).

10. **Q: When would you return `422 Unprocessable Content` instead of `400 Bad Request`?**  
    *A:* When the request body is valid JSON syntax, but fails business domain validation (e.g., a required email is missing or delivery area is outside city limits).

11. **Q: What causes a `500 Internal Server Error`?**  
    *A:* An unhandled exception or bug inside the server code (e.g., a null pointer exception or unhandled database crash).

12. **Q: What is the role of Chrome Developer Tools Network tab in backend development?**  
    *A:* It allows developers to inspect raw HTTP traffic, timing breakdowns, payload sizes, status codes, and request/response headers directly across the wire.

13. **Q: What is CORS?**  
    *A:* Cross-Origin Resource Sharing. A browser security mechanism that blocks scripts on one origin (`localhost:3000`) from reading responses from another origin (`api.addiseats.com`) unless explicit response headers (`Access-Control-Allow-Origin`) allow it.

14. **Q: Why should money amounts be stored in santim rather than Birr in API payloads?**  
    *A:* Binary floating-point representation in computers cannot accurately represent decimal fractions (e.g. `0.1 + 0.2 !== 0.3`). Storing whole integer units (santim) prevents rounding discrepancies.

15. **Q: What is a `Location` response header?**  
    *A:* A header returned with `201 Created` specifying the direct URL of the newly created resource.
