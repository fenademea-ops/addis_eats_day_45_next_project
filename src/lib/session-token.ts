export const SESSION_COOKIE_NAME = "addis_eats_session";

export type Session = {
  userId: string;
  email: string;
  name: string;
  role: "customer" | "staff";
  expiresAt: number;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must contain at least 32 characters."
    );
  }

  return secret;
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function decodeBase64Url(
  value: string
): Uint8Array<ArrayBuffer> {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function getSigningKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(
  session: Session
): Promise<string> {
  const payload = encodeBase64Url(
    new TextEncoder().encode(JSON.stringify(session))
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getSigningKey(),
    new TextEncoder().encode(payload)
  );

  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string | undefined
): Promise<Session | null> {
  if (!token) {
    return null;
  }

  const [payload, providedSignature, extraPart] = token.split(".");
  if (!payload || !providedSignature || extraPart) {
    return null;
  }

  try {
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      await getSigningKey(),
      decodeBase64Url(providedSignature),
      new TextEncoder().encode(payload)
    );

    if (!validSignature) {
      return null;
    }

    const session = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(payload))
    ) as Partial<Session>;

    if (
      typeof session.userId !== "string" ||
      typeof session.email !== "string" ||
      typeof session.name !== "string" ||
      (session.role !== "customer" && session.role !== "staff") ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      expiresAt: session.expiresAt,
    };
  } catch {
    return null;
  }
}
