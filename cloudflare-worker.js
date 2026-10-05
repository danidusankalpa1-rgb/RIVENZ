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

    if (request.method === "POST" && url.pathname === "/public/upload") {
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
      const body = await request.json().catch(()=>null);
      const type = publicType(body?.type);
      if (!type) return json({ ok: false, error: "Invalid public catalog type" }, 400);
      const items = Array.isArray(body?.items) ? body.items : [];
      if (JSON.stringify(items).length > 900000) return json({ ok: false, error: "CATALOG_TOO_LARGE" }, 413);
      await env.FILES.put(publicCatalogKey(type), JSON.stringify(items), { httpMetadata: { contentType: "application/json; charset=utf-8" }, customMetadata: { updatedBy: user.sub, publicType: type } });
      return json({ ok: true, items });
    }

    if (request.method === "DELETE" && url.pathname === "/public/file") {
      const key = url.searchParams.get("key") || "";
      if (!key || key.includes("..") || !key.startsWith("public/")) return json({ ok: false, error: "Invalid public key" }, 400);
      await env.FILES.delete(key);
      return json({ ok: true });
    }

    if (request.method === "POST" && url.pathname === "/upload") {
      const orderId = safePart(request.headers.get("X-Order-Id"), "order");
      const folder = String(request.headers.get("X-Folder") || "client");
      if (!allowedFolder(folder)) return json({ ok: false, error: "Invalid folder" }, 400);

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
