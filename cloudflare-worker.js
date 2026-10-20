const PROJECT_ID = "graphics-4c4f2";
const ALLOWED_METHODS = "GET, POST, DELETE, OPTIONS";
const ALLOWED_HEADERS = [
  "Authorization",
  "Content-Type",
  "X-Order-Id",
  "X-Folder",
  "X-File-Name",
  "X-File-Type",
  "X-File-Size",
  "X-Public-Type"
];

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const requestedHeaders = request.headers.get("Access-Control-Request-Headers");
  const headers = new Headers({
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": requestedHeaders || ALLOWED_HEADERS.join(", "),
    "Access-Control-Allow-Private-Network": "true",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin, Access-Control-Request-Headers, Access-Control-Request-Method"
  });
  return headers;
}

function addCors(headers, request) {
  const result = new Headers(headers);
  const origin = request.headers.get("Origin");
  result.set("Access-Control-Allow-Origin", origin || "*");
  result.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
  result.set("Access-Control-Allow-Headers", ALLOWED_HEADERS.join(", "));
  result.set("Access-Control-Allow-Private-Network", "true");
  result.set("Vary", "Origin, Access-Control-Request-Headers, Access-Control-Request-Method");
  return result;
}

let jwkCache = new Map();
let jwkCacheUntil = 0;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": ALLOWED_METHODS,
      "Access-Control-Allow-Headers": ALLOWED_HEADERS.join(", "),
      "Access-Control-Allow-Private-Network": "true",
      "Vary": "Origin, Access-Control-Request-Headers, Access-Control-Request-Method"
    }
  });
}

function base64UrlToBytes(input) {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  const value = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJsonPart(part) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(part)));
}

async function getGoogleKeys() {
  if (Date.now() < jwkCacheUntil && jwkCache.size) return jwkCache;

  const response = await fetch(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
    { cf: { cacheTtl: 3600, cacheEverything: true } }
  );

  if (!response.ok) throw new Error("Could not load Firebase public keys.");

  const data = await response.json();
  const next = new Map();
  for (const jwk of data.keys || []) {
    if (jwk.kid) {
      const key = await crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"]
      );
      next.set(jwk.kid, key);
    }
  }

  const cacheControl = response.headers.get("cache-control") || "";
  const match = cacheControl.match(/max-age=(\d+)/i);
  const maxAge = Math.max(300, Math.min(Number(match?.[1] || 3600), 86400));

  jwkCache = next;
  jwkCacheUntil = Date.now() + maxAge * 1000;
  return jwkCache;
}

async function verifyFirebaseToken(request) {
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Bearer ")) throw new Error("AUTH_REQUIRED");

  const token = header.slice(7).trim();
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("INVALID_TOKEN");

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  let headerData, payload;
  try {
    headerData = decodeJsonPart(encodedHeader);
    payload = decodeJsonPart(encodedPayload);
  } catch {
    throw new Error("INVALID_TOKEN");
  }

  if (headerData.alg !== "RS256" || !headerData.kid) throw new Error("INVALID_TOKEN");

  const now = Math.floor(Date.now() / 1000);
  if (!payload.sub || typeof payload.sub !== "string") throw new Error("INVALID_TOKEN");
  if (payload.aud !== PROJECT_ID) throw new Error("INVALID_TOKEN");
  if (payload.iss !== `https://securetoken.google.com/${PROJECT_ID}`) throw new Error("INVALID_TOKEN");
  if (typeof payload.exp !== "number" || payload.exp <= now) throw new Error("TOKEN_EXPIRED");
  if (typeof payload.iat !== "number" || payload.iat > now + 60) throw new Error("INVALID_TOKEN");
  if (typeof payload.auth_time !== "number" || payload.auth_time > now + 60) throw new Error("INVALID_TOKEN");

  const keys = await getGoogleKeys();
  let key = keys.get(headerData.kid);
  if (!key) {
    jwkCacheUntil = 0;
    key = (await getGoogleKeys()).get(headerData.kid);
  }
  if (!key) throw new Error("INVALID_TOKEN");

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64UrlToBytes(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );

  if (!valid) throw new Error("INVALID_TOKEN");
  return payload;
}

function safePart(value, fallback = "file") {
  const cleaned = String(value || "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 180);
  return cleaned || fallback;
}

function allowedFolder(folder) {
  return new Set(["client", "preview", "final", "balance", "refund", "payment"]).has(folder);
}

function publicType(type) {
  return new Set(["portfolio", "invitation", "invitation-v2", "showcase", "services", "products"]).has(type) ? type : "";
}

function publicCatalogKey(type) {
  return `public/catalog/${type}.json`;
}

function publicFileKey(type, name) {
  return `public/${type}/${crypto.randomUUID()}_${safePart(name, "file")}`;
}

const ADMIN_UIDS = new Set([
  "ZtK5IGFUs5euV4xIMrHQMgLa7gS2",
  "c9LzUbKr16Zp0H6nu282z2DR7CG2"
]);
function isAdminUser(user) { return !!user && ADMIN_UIDS.has(String(user.sub || "")); }



// Secure R Points writes use a Firebase service account stored as Cloudflare secrets.
// Required Worker secrets: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.
let serviceTokenCache = { token: "", expiresAt: 0 };
function bytesToBase64Url(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function textToBase64Url(text) {
  return bytesToBase64Url(new TextEncoder().encode(text));
}
async function getServiceAccessToken(env) {
  if (serviceTokenCache.token && Date.now() < serviceTokenCache.expiresAt - 60000) return serviceTokenCache.token;
  const email = String(env.FIREBASE_CLIENT_EMAIL || "").trim();
  const privateKeyPem = String(env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n").trim();
  if (!email || !privateKeyPem) throw new Error("WALLET_BACKEND_NOT_CONFIGURED");
  const pem = privateKeyPem.replace(/-----BEGIN PRIVATE KEY-----/g, "").replace(/-----END PRIVATE KEY-----/g, "").replace(/\s/g, "");
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const header = textToBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = textToBase64Url(JSON.stringify({
    iss: email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  }));
  const unsigned = header + "." + claim;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const assertion = unsigned + "." + bytesToBase64Url(new Uint8Array(signature));
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error("GOOGLE_SERVICE_TOKEN_FAILED");
  serviceTokenCache = { token: data.access_token, expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000 };
  return serviceTokenCache.token;
}
function firestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === "string") return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  if (typeof value === "object") {
    const fields = {};
    for (const [key, child] of Object.entries(value)) fields[key] = firestoreValue(child);
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}
function fromFirestoreValue(value) {
  if (!value || typeof value !== "object") return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ("mapValue" in value) return fromFirestoreFields(value.mapValue.fields || {});
  return null;
}
function fromFirestoreFields(fields) {
  const result = {};
  for (const [key, value] of Object.entries(fields || {})) result[key] = fromFirestoreValue(value);
  return result;
}
function firestoreFields(object) {
  const result = {};
  for (const [key, value] of Object.entries(object)) result[key] = firestoreValue(value);
  return result;
}
async function firestoreRequest(env, path, options = {}) {
  const token = await getServiceAccessToken(env);
  const endpoint = path.startsWith(":")
    ? "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID + "/databases/(default)/documents" + path
    : "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID + "/databases/(default)/documents/" + path;
  const response = await fetch(endpoint, {
    ...options,
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("FIRESTORE_API_ERROR");
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
}
async function confirmReceiptAndAwardPoints(request, env, user) {
  if (request.method !== "POST") return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "INVALID_JSON" }, 400); }
  const orderId = String(body?.orderId || "").trim();
  if (!orderId || orderId.length > 180 || orderId.includes("/")) return json({ ok: false, error: "INVALID_ORDER_ID" }, 400);
  try {
    const orderPath = "orders/" + encodeURIComponent(orderId);
    const orderDoc = await firestoreRequest(env, orderPath);
    const order = fromFirestoreFields(orderDoc.fields || {});
    if (String(order.uid || "") !== String(user.sub || "")) return json({ ok: false, error: "ORDER_NOT_OWNED" }, 403);
    if (order.rewardPointsApplied === true) {
      return json({ ok: true, alreadyProcessed: true, pointsAwarded: Number(order.rewardPointsAwarded || 0), status: order.status || "Completed" });
    }
    if (!/deliver/i.test(String(order.status || ""))) {
      return json({ ok: false, error: "ORDER_NOT_DELIVERED", message: "You can confirm receipt only after the order is marked Delivered." }, 409);
    }
    if (String(order.orderType || "") !== "clothing-cart" || !Array.isArray(order.items)) {
      return json({ ok: false, error: "NOT_REWARD_ELIGIBLE", message: "R Points are only available for clothing product orders." }, 400);
    }

    // Rewards are read from the trusted R2 product catalog, not from client-editable order fields.
    const catalogObject = await env.FILES.get(publicCatalogKey("products"));
    if (!catalogObject) return json({ ok: false, error: "PRODUCT_CATALOG_UNAVAILABLE" }, 503);
    let catalog;
    try { catalog = JSON.parse(await catalogObject.text()); } catch { catalog = []; }
    if (!Array.isArray(catalog)) catalog = [];
    let points = 0;
    for (const item of order.items) {
      const productId = String(item?.productId || "");
      if (!productId) continue;
      const product = catalog.find(p => p && String(p.id || p.sku || "") === productId && p.active !== false);
      if (!product) continue;
      const perUnit = Math.max(0, Math.floor(Number(product.rPoints ?? product.pointsReward ?? 0) || 0));
      const quantity = Math.max(0, Math.min(1000, Math.floor(Number(item.quantity || item.qty || 1) || 1)));
      points += perUnit * quantity;
      if (points > 1000000) return json({ ok: false, error: "REWARD_LIMIT_EXCEEDED" }, 400);
    }

    const clientPath = "clients/" + encodeURIComponent(String(user.sub));
    const clientDoc = await firestoreRequest(env, clientPath);
    const client = fromFirestoreFields(clientDoc.fields || {});
    const oldBalance = Math.max(0, Math.floor(Number(client.rPointsBalance || 0) || 0));
    const newBalance = oldBalance + points;
    const now = new Date().toISOString();
    const orderFields = {
      status: "Completed",
      customerReceived: true,
      customerReceivedAt: now,
      completedAt: now,
      updatedAt: now,
      rewardPointsApplied: true,
      rewardPointsAwarded: points,
      rewardPointsAwardedAt: now
    };
    const encodedOrderFields = firestoreFields(orderFields);
    for (const field of ["customerReceivedAt", "completedAt", "updatedAt", "rewardPointsAwardedAt"]) {
      encodedOrderFields[field] = { timestampValue: now };
    }
    const writes = [
      {
        update: { name: orderDoc.name, fields: encodedOrderFields },
        updateMask: { fieldPaths: Object.keys(orderFields) },
        currentDocument: { updateTime: orderDoc.updateTime }
      },
      {
        update: { name: clientDoc.name, fields: firestoreFields({ rPointsBalance: newBalance }) },
        updateMask: { fieldPaths: ["rPointsBalance"] },
        currentDocument: { updateTime: clientDoc.updateTime }
      }
    ];
    if (points > 0) {
      const ledgerName = "projects/" + PROJECT_ID + "/databases/(default)/documents/clients/" + String(user.sub) + "/rPointsHistory/" + encodeURIComponent(orderId);
      const ledgerFields = firestoreFields({ type: "earned", points, orderId, description: "Clothing order completed" });
      ledgerFields.createdAt = { timestampValue: now };
      writes.push({
        update: { name: ledgerName, fields: ledgerFields },
        currentDocument: { exists: false }
      });
    }
    await firestoreRequest(env, ":commit", { method: "POST", body: JSON.stringify({ writes }) });
    return json({ ok: true, alreadyProcessed: false, pointsAwarded: points, balance: newBalance, status: "Completed" });
  } catch (error) {
    if (error?.message === "WALLET_BACKEND_NOT_CONFIGURED") return json({ ok: false, error: "WALLET_BACKEND_NOT_CONFIGURED", message: "R Points backend needs Firebase service-account secrets in Cloudflare." }, 503);
    if (error?.status === 404) return json({ ok: false, error: "ORDER_OR_CLIENT_NOT_FOUND" }, 404);
    if (error?.status === 400 || error?.status === 409) return json({ ok: false, error: "RETRY_CONFIRMATION", message: "The order changed while processing. Please try again." }, 409);
    console.error("R Points award failed:", error?.message || error, error?.details || "");
    return json({ ok: false, error: "R_POINTS_BACKEND_ERROR", message: "Could not complete this order right now. Please try again later." }, 500);
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response("Graphics File API is running", {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
          "Access-Control-Allow-Methods": ALLOWED_METHODS,
          "Access-Control-Allow-Headers": ALLOWED_HEADERS.join(", "),
          "Access-Control-Allow-Private-Network": "true",
          "Vary": "Origin, Access-Control-Request-Headers, Access-Control-Request-Method"
        }
      });
    }

    // Public portfolio / invitation files and catalogs are intentionally readable
    // without login. Only authenticated users may upload, edit or delete them.
    if (request.method === "GET" && url.pathname === "/public/catalog") {
      const type = publicType(url.searchParams.get("type"));
      if (!type) return json({ ok: false, error: "Invalid public catalog type" }, 400);
      const object = await env.FILES.get(publicCatalogKey(type));
      if (!object) return json({ ok: true, items: [] });
      const text = await object.text();
      let items = [];
      try { const parsed = JSON.parse(text); items = Array.isArray(parsed) ? parsed : []; } catch(e) {}
      return json({ ok: true, items });
    }

    if (request.method === "GET" && url.pathname === "/public/file") {
      const key = url.searchParams.get("key") || "";
      if (!key || key.includes("..") || !key.startsWith("public/")) return json({ ok: false, error: "Invalid public key" }, 400);
      const object = await env.FILES.get(key);
      if (!object) return json({ ok: false, error: "FILE_NOT_FOUND" }, 404);
      const headers = addCors(new Headers(), request);
      object.writeHttpMetadata(headers);
      headers.set("Cache-Control", "public, max-age=300");
      headers.set("ETag", object.httpEtag);
      return new Response(object.body, { status: 200, headers });
    }

    let user;
    try {
      user = await verifyFirebaseToken(request);
    } catch (error) {
      const message = error?.message === "TOKEN_EXPIRED" ? "Token expired" : "Unauthorized";
      return json({ ok: false, error: message }, 401);
    }

    if (request.method === "POST" && url.pathname === "/rewards/confirm-received") {
      return confirmReceiptAndAwardPoints(request, env, user);
    }

    if (request.method === "POST" && url.pathname === "/public/upload") {
      if (!isAdminUser(user)) return json({ ok: false, error: "FORBIDDEN" }, 403);
      const type = publicType(request.headers.get("X-Public-Type"));
      if (!type) return json({ ok: false, error: "Invalid public type" }, 400);
      const size = Number(request.headers.get("X-File-Size") || request.headers.get("Content-Length") || 0);
      if (size > 25 * 1024 * 1024) return json({ ok: false, error: "FILE_TOO_LARGE" }, 413);
      if (!request.body) return json({ ok: false, error: "FILE_REQUIRED" }, 400);
      const originalName = request.headers.get("X-File-Name") || "file";
      const key = publicFileKey(type, originalName);
      const contentType = request.headers.get("X-File-Type") || request.headers.get("Content-Type") || "application/octet-stream";
      await env.FILES.put(key, request.body, {
        httpMetadata: { contentType },
        customMetadata: { uid: user.sub, publicType: type, originalName: String(originalName).slice(0, 200) }
      });
      return json({ ok: true, key, url: `${url.origin}/public/file?key=${encodeURIComponent(key)}`, name: originalName, type: contentType, size: size || 0, storage: "r2" });
    }

    if (request.method === "POST" && url.pathname === "/public/catalog") {
      if (!isAdminUser(user)) return json({ ok: false, error: "FORBIDDEN" }, 403);
      const body = await request.json().catch(()=>null);
      const type = publicType(body?.type);
      if (!type) return json({ ok: false, error: "Invalid public catalog type" }, 400);
      const items = Array.isArray(body?.items) ? body.items : [];
      if (JSON.stringify(items).length > 900000) return json({ ok: false, error: "CATALOG_TOO_LARGE" }, 413);
      await env.FILES.put(publicCatalogKey(type), JSON.stringify(items), { httpMetadata: { contentType: "application/json; charset=utf-8" }, customMetadata: { updatedBy: user.sub, publicType: type } });
      return json({ ok: true, items });
    }

    if (request.method === "DELETE" && url.pathname === "/public/file") {
      if (!isAdminUser(user)) return json({ ok: false, error: "FORBIDDEN" }, 403);
      const key = url.searchParams.get("key") || "";
      if (!key || key.includes("..") || !key.startsWith("public/")) return json({ ok: false, error: "Invalid public key" }, 400);
      await env.FILES.delete(key);
      return json({ ok: true });
    }

    if (request.method === "POST" && url.pathname === "/upload") {
      const orderId = safePart(request.headers.get("X-Order-Id"), "order");
      const folder = String(request.headers.get("X-Folder") || "client");
      if (!allowedFolder(folder)) return json({ ok: false, error: "Invalid folder" }, 400);
      if (!isAdminUser(user) && !new Set(["client", "payment", "balance"]).has(folder)) {
        return json({ ok: false, error: "FORBIDDEN" }, 403);
      }

      const size = Number(request.headers.get("X-File-Size") || request.headers.get("Content-Length") || 0);
      if (size > 50 * 1024 * 1024) return json({ ok: false, error: "FILE_TOO_LARGE" }, 413);
      if (!request.body) return json({ ok: false, error: "FILE_REQUIRED" }, 400);

      const originalName = request.headers.get("X-File-Name") || "file";
      const name = safePart(originalName, "file");
      const id = crypto.randomUUID();
      const key = `users/${safePart(user.sub)}/orders/${orderId}/${folder}/${id}_${name}`;
      const contentType = request.headers.get("X-File-Type") || request.headers.get("Content-Type") || "application/octet-stream";

      await env.FILES.put(key, request.body, {
        httpMetadata: { contentType },
        customMetadata: {
          uid: user.sub,
          orderId,
          folder,
          originalName: String(originalName).slice(0, 200)
        }
      });

      const fileUrl = `${url.origin}/file?key=${encodeURIComponent(key)}`;
      return json({ ok: true, path: key, key, name: originalName, type: contentType, size: size || 0, url: fileUrl, storage: "r2" });
    }

    if (request.method === "GET" && url.pathname === "/file") {
      const key = url.searchParams.get("key") || "";
      if (!key || key.includes("..") || !key.startsWith("users/")) return json({ ok: false, error: "Invalid key" }, 400);
      const ownerUid = key.split("/")[1] || "";
      if (!isAdminUser(user) && ownerUid !== String(user.sub || "")) return json({ ok: false, error: "FORBIDDEN" }, 403);

      const object = await env.FILES.get(key);
      if (!object) return json({ ok: false, error: "FILE_NOT_FOUND" }, 404);

      // The exact object key is stored in the Firestore order document.
      // Firestore rules control who can read that order; R2 stays private and
      // the Worker still requires a valid Firebase ID token for every read.
      const headers = addCors(new Headers(), request);
      object.writeHttpMetadata(headers);
      headers.set("ETag", object.httpEtag);
      headers.set("Cache-Control", "private, max-age=300");
      return new Response(object.body, { status: 200, headers });
    }

    return json({ ok: false, error: "Not Found" }, 404);
  }
};
