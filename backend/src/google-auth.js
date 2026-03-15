const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

let cachedJwks = {
  expiresAt: 0,
  keys: []
};

function decodeBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function parseJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid Google credential format.");
  }

  const decoder = new TextDecoder();
  const header = JSON.parse(decoder.decode(decodeBase64Url(parts[0])));
  const payload = JSON.parse(decoder.decode(decodeBase64Url(parts[1])));

  return {
    header,
    payload,
    signingInput: `${parts[0]}.${parts[1]}`,
    signature: decodeBase64Url(parts[2])
  };
}

function parseMaxAge(cacheControl) {
  const match = /max-age=(\d+)/i.exec(cacheControl || "");
  return match ? Number(match[1]) : 300;
}

async function loadGoogleJwks() {
  if (cachedJwks.expiresAt > Date.now() && cachedJwks.keys.length > 0) {
    return cachedJwks.keys;
  }

  const response = await fetch(GOOGLE_JWKS_URL);
  if (!response.ok) {
    throw new Error("Failed to load Google signing keys.");
  }

  const data = await response.json();
  const ttlSeconds = parseMaxAge(response.headers.get("cache-control"));
  cachedJwks = {
    expiresAt: Date.now() + ttlSeconds * 1000,
    keys: Array.isArray(data.keys) ? data.keys : []
  };
  return cachedJwks.keys;
}

async function importGoogleKey(jwk) {
  return crypto.subtle.importKey(
    "jwk",
    {
      kty: jwk.kty,
      n: jwk.n,
      e: jwk.e,
      alg: jwk.alg || "RS256",
      ext: true
    },
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["verify"]
  );
}

function normalizeAllowedAudiences(clientIdConfig) {
  return String(clientIdConfig || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function pickDisplayName(payload) {
  const rawName = typeof payload.name === "string" ? payload.name.trim() : "";
  if (rawName.length >= 2) return rawName;

  const email = typeof payload.email === "string" ? payload.email : "";
  const localPart = email.split("@")[0]?.replace(/[^\p{L}\p{N}_-]/gu, "") || "";
  return localPart.length >= 2 ? localPart : "google-user";
}

export async function verifyGoogleIdToken(idToken, googleClientId) {
  const allowedAudiences = normalizeAllowedAudiences(googleClientId);
  if (allowedAudiences.length === 0) {
    throw new Error("GOOGLE_CLIENT_ID is not configured.");
  }

  const parsed = parseJwt(idToken);
  if (parsed.header.alg !== "RS256" || typeof parsed.header.kid !== "string") {
    throw new Error("Unsupported Google signing algorithm.");
  }

  const keys = await loadGoogleJwks();
  const jwk = keys.find((candidate) => candidate.kid === parsed.header.kid);
  if (!jwk) {
    cachedJwks.expiresAt = 0;
    throw new Error("Unable to find a matching Google signing key.");
  }

  const cryptoKey = await importGoogleKey(jwk);
  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    parsed.signature,
    new TextEncoder().encode(parsed.signingInput)
  );

  if (!verified) {
    throw new Error("Google credential signature verification failed.");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!GOOGLE_ISSUERS.has(parsed.payload.iss)) {
    throw new Error("Invalid Google token issuer.");
  }
  if (!allowedAudiences.includes(parsed.payload.aud)) {
    throw new Error("Google token audience mismatch.");
  }
  if (typeof parsed.payload.exp !== "number" || parsed.payload.exp <= nowSeconds) {
    throw new Error("Google token has expired.");
  }
  if (parsed.payload.nbf && Number(parsed.payload.nbf) > nowSeconds) {
    throw new Error("Google token is not active yet.");
  }
  if (!parsed.payload.sub || typeof parsed.payload.sub !== "string") {
    throw new Error("Google token subject is missing.");
  }
  if (!parsed.payload.email || typeof parsed.payload.email !== "string") {
    throw new Error("Google token email is missing.");
  }
  if (parsed.payload.email_verified !== true) {
    throw new Error("Google account email is not verified.");
  }

  return {
    subject: parsed.payload.sub,
    email: parsed.payload.email,
    emailVerified: true,
    name: pickDisplayName(parsed.payload),
    picture: typeof parsed.payload.picture === "string" ? parsed.payload.picture : null
  };
}
