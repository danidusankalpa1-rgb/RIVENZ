/* RIVENZ cart isolation: each signed-in Firebase user gets a separate cart. */
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { app } from "./firebase-config.js";

const LEGACY_KEY = "rivenzCartV1";
const GUEST_KEY = "rivenzCartV1:guest";
const USER_KEY_PREFIX = "rivenzCartV1:user:";
const auth = getAuth(app);
let currentUser = null;
let resolveReady;
const ready = new Promise(resolve => { resolveReady = resolve; });

function safeRead(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (_) { return []; }
}
function activeKey() {
  return currentUser?.uid ? USER_KEY_PREFIX + currentUser.uid : GUEST_KEY;
}
function emitUpdate() {
  window.dispatchEvent(new CustomEvent("rivenz-cart-updated"));
}
function getCart() {
  return currentUser?.uid ? safeRead(activeKey()) : [];
}
function requireLogin() {
  if (currentUser?.uid) return true;
  try { window.rvzLogin?.open({ next: location.pathname.split("/").pop() + location.search }); } catch (_) {}
  return false;
}
function saveCart(items) {
  if (!currentUser?.uid) return;
  const safeItems = Array.isArray(items) ? items : [];
  localStorage.setItem(activeKey(), JSON.stringify(safeItems));
  emitUpdate();
}
function count() {
  return getCart().reduce((sum, item) => sum + Math.max(0, Number(item?.quantity) || 0), 0);
}

try { localStorage.removeItem(LEGACY_KEY); localStorage.removeItem(GUEST_KEY); } catch (_) {}

onAuthStateChanged(auth, user => {
  currentUser = user || null;
  resolveReady();
  window.dispatchEvent(new CustomEvent("rivenz-cart-session-changed", { detail: { uid: currentUser?.uid || null } }));
  emitUpdate();
});

window.rivenzCartStore = { ready, getCart, saveCart, count, requireLogin, get uid() { return currentUser?.uid || null; } };
window.dispatchEvent(new Event("rivenz-cart-store-ready"));
