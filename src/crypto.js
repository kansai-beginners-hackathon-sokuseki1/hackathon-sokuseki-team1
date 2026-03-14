const encoder = new TextEncoder();

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
      iterations: 120_000,
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

  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }
  return diff === 0;
}

export function createToken() {
  return toHex(crypto.getRandomValues(new Uint8Array(24)));
}
