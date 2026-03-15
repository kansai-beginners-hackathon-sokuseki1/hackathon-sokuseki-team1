const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value) {
  if (value.length % 2 !== 0) {
    throw new Error("Invalid hex string.");
  }
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

export function createId(prefix) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

export async function hashPassword(password, salt = toHex(crypto.getRandomValues(new Uint8Array(16)))) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100_000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  return {
    salt,
    hash: toHex(new Uint8Array(bits))
  };
}

export async function verifyPassword(password, expectedHash, salt) {
  const { hash } = await hashPassword(password, salt);
  const left = fromHex(hash);
  const right = fromHex(expectedHash);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index++) {
    diff |= left[index] ^ right[index];
  }
  return diff === 0;
}

export function createToken() {
  return toHex(crypto.getRandomValues(new Uint8Array(24)));
}

async function deriveEncryptionKey(secret) {
  if (!secret) {
    throw new Error("APP_SECRET is required for encryption.");
  }

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("mock-ai-settings"),
      iterations: 100_000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptSecret(value, secret) {
  if (!value) return null;

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveEncryptionKey(secret);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(value)
  );

  return `${toHex(iv)}:${toHex(new Uint8Array(encrypted))}`;
}

export async function decryptSecret(value, secret) {
  if (!value) return "";

  const [ivHex, payloadHex] = String(value).split(":");
  if (!ivHex || !payloadHex) {
    throw new Error("Encrypted secret is malformed.");
  }

  const key = await deriveEncryptionKey(secret);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromHex(ivHex) },
    key,
    fromHex(payloadHex)
  );

  return decoder.decode(decrypted);
}
