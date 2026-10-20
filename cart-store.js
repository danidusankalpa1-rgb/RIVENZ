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
  return safeRead(activeKey());
}
function saveCart(items) {
  const safeItems = Array.isArray(items) ? items : [];
  localStorage.setItem(activeKey(), JSON.stringify(safeItems));
  emitUpdate();
}
function count() {
  return getCart().reduce((sum, item) => sum + Math.max(0, Number(item?.quantity) || 0), 0);
}

// Keep legacy shared-cart data available as a guest cart instead of assigning it
// to an arbitrary account (which could expose one customer's cart to another).
try {
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy !== null) {
    if (localStorage.getItem(GUEST_KEY) === null) localStorage.setItem(GUEST_KEY, legacy);
    localStorage.removeItem(LEGACY_KEY);
  }
} catch (_) {}

onAuthStateChanged(auth, user => {
  currentUser = user || null;
  resolveReady();
  window.dispatchEvent(new CustomEvent("rivenz-cart-session-changed", { detail: { uid: currentUser?.uid || null } }));
  emitUpdate();
});

window.rivenzCartStore = { ready, getCart, saveCart, count, get uid() { return currentUser?.uid || null; } };
window.dispatchEvent(new Event("rivenz-cart-store-ready"));
