// RIVENZ — unified menu bar for every customer page (desktop bar + mobile dropdown, icons, login-aware).
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { doc, onSnapshot, collection, query, where } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { app, db } from "./firebase-config.js";
import "./cart-store.js";

const P = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  shop: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  collection: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
  offers: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><path d="M7.5 7.5h.01"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/><path d="M8 10h8M8 14h5"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L21 8H6"/>',
  event: '<path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7"/><path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  order: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  menu: '<path d="M4 9h16M4 15h16"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>'
};
const I = (k, c = "") => `<svg class="rvz-i ${c}" viewBox="0 0 24 24" aria-hidden="true">${P[k]}</svg>`;
const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
const ACTIVE = { "index.html": "home", "": "home", "services.html": "collection", "product-details.html": "collection", "collection.html": "collection", "collection-mens.html": "collection", "collection-women.html": "collection", "collection-shoes.html": "collection", "collection-accessories.html": "collection", "portfolio.html": "collection", "weddings.html": "offers", "chat.html": "chat", "cart.html": "cart", "order.html": "cart", "order-confirmation.html": "cart", "special-event.html": "event", "profile.html": "profile", "dashboard.html": "order", "order-details.html": "order" }[file] || "";
const MAIN = [["home", "Home", "index.html"], ["collection", "Collection", "collection.html"], ["offers", "Offers", "weddings.html"], ["event", "Special event", "special-event.html"]];

const h = document.createElement("header");
h.className = "rvz-h";
document.body.prepend(h);
let user = null, unread = 0, cartN = 0, notifs = [], nUnread = 0;

function paint() {
  const li = !!user, on = (k) => (ACTIVE === k ? " on" : "");
  const initial = String(user?.displayName || user?.email || "U").trim().slice(0, 1).toUpperCase();
  const cartB = `<em class="rvz-b" data-cart${cartN ? "" : " hidden"}>${cartN}</em>`, chatB = `<em class="rvz-b" data-unread${unread ? "" : " hidden"}>${unread}</em>`;
  const full = [...MAIN.slice(0, 3).map(([k, l, u]) => [k, l, u]), ["chat", "Chat", "chat.html", chatB], ["cart", "Cart", "cart.html", cartB], MAIN[3], ...(li ? [["profile", "My profile", "profile.html"], ["order", "My order", "dashboard.html"]] : [])];
  const dl = ([k, l, u, bd = ""]) => `<a class="rvz-dr${on(k)}" href="${u}"><span>${l}</span>${bd}</a>`;
  const row = ([k, l, u, b = ""]) => `<a class="rvz-row${on(k)}" href="${u}">${I(k === "profile" ? "user" : k)}<span>${l}</span>${b}</a>`;
  const isShop = false, curCat = new URLSearchParams(location.search).get("category")||"all";
  const CATS = [["Men's", "mens"], ["Ladies", "ladies"], ["Unisex", "unisex"], ["Kids", "kids"], ["Accessories", "accessories"]];
  h.innerHTML = `<div class="rvz-w">
    <span class="rvz-tag">#RIVENZFASHION</span>
    <a class="rvz-logo" href="index.html" aria-label="RIVENZ home"><img src="logo.png" alt="RIVENZ"></a>
    <div class="rvz-r">
      ${li ? `<button type="button" class="rvz-c rvz-bell" id="rvzBell" aria-label="Notifications" aria-expanded="false">${I("bell")}<em class="rvz-b" data-nb${nUnread ? "" : " hidden"}>${nUnread}</em></button>` : ""}
      <a class="rvz-c rvz-chat${on("chat")}" href="chat.html" aria-label="Chat">${I("chat")}${chatB}</a>
      <a class="rvz-c${on("cart")}" href="cart.html" aria-label="Cart">${I("cart")}${cartB}</a>
      ${li ? `<button type="button" class="rvz-c rvz-acc" id="rvzAcc" aria-label="Account" aria-expanded="false"><span class="rvz-av">${initial}</span></button>` : `<a class="rvz-login" href="auth.html?next=${encodeURIComponent(file)}">${I("user")}<span>Login</span></a>`}
    </div>
    <button type="button" class="rvz-c rvz-menu" id="rvzMenu" aria-label="Open menu" aria-expanded="false"><span class="rvz-m">${I("menu")}</span><span class="rvz-x">${I("x")}</span></button>
  </div>
  <div class="rvz-navrow"><nav class="rvz-nav" aria-label="Main">${MAIN.map(([k, l, u]) => `<a class="rvz-a${on(k)}" href="${u}"><span>${l}</span></a>`).join("")}</nav></div>
  ${isShop ? `<div class="rvz-sub"><nav aria-label="Categories">${[["All", "all"], ...CATS.map(([l, c]) => [l, c])].map(([l, c]) => `<a class="${curCat === c ? "on" : ""}" href="services.html${c === "all" ? "" : "?category=" + c}">${l}</a>`).join("")}</nav></div>` : ""}
  <div class="rvz-w2">
    <div class="rvz-card rvz-acc-card" id="rvzAccCard"><a class="rvz-row${on("profile")}" href="profile.html">${I("user")}<span>My profile</span></a><a class="rvz-row${on("order")}" href="dashboard.html">${I("order")}<span>My order</span></a><div class="rvz-sep"></div><button type="button" class="rvz-row" data-out>${I("out")}<span>Log out</span></button></div>
    <div class="rvz-card rvz-mob" id="rvzMob"><div class="rvz-dh"><img src="logo.png" alt="RIVENZ"><button type="button" class="rvz-dx" data-close aria-label="Close menu">${I("x")}</button></div><nav class="rvz-dn">${full.map((r) => dl(r)).join("")}${li ? `<button type="button" class="rvz-dr" data-out><span>Log out</span></button>` : `<a class="rvz-dr" href="auth.html?next=${encodeURIComponent(file)}"><span>Login</span></a>`}</nav></div>
    <div class="rvz-card rvz-notif" id="rvzNotif"><div class="rvz-nh">Notifications</div><div class="rvz-nl" id="rvzNL"></div></div>
    <div class="rvz-bd" id="rvzBd"></div>
  </div>`;
}
function lock() { setTimeout(() => window.dispatchEvent(new Event("scroll")), 0); const o = !!h.querySelector("#rvzMob.open"); h.querySelector("#rvzBd")?.classList.toggle("open", o); document.documentElement.style.overflow = o ? "hidden" : ""; }
function closeAll() {
  h.querySelectorAll(".rvz-card,.rvz-search").forEach((c) => c.classList.remove("open"));
  h.querySelectorAll("#rvzMenu,#rvzAcc,#rvzBell").forEach((b) => { b.classList.remove("open"); b.setAttribute("aria-expanded", "false"); });
  lock();
}
function toggle(btn, card) {
  const open = !card.classList.contains("open"); closeAll();
  if (open) { card.classList.add("open"); btn.classList.add("open"); btn.setAttribute("aria-expanded", "true"); }
  lock();
}
h.addEventListener("click", async (e) => {
  const m = e.target.closest("#rvzMenu"), a = e.target.closest("#rvzAcc");
  const sb = e.target.closest("#rvzSBtn");
  if (sb) { e.stopPropagation(); const f = h.querySelector("#rvzSearch"), op = !f.classList.contains("open"); closeAll(); f.classList.toggle("open", op); sb.setAttribute("aria-expanded", String(op)); if (op) f.querySelector("input")?.focus(); return; }
  const bl = e.target.closest("#rvzBell");
  if (bl) { e.stopPropagation(); const card = h.querySelector("#rvzNotif"), wasOpen = card.classList.contains("open"); toggle(bl, card); if (!wasOpen) markSeen(); return; }
  if (m) { e.stopPropagation(); return toggle(m, h.querySelector("#rvzMob")); }
  if (a) { e.stopPropagation(); return toggle(a, h.querySelector("#rvzAccCard")); }
  if (e.target.closest("[data-close]") || e.target.closest("#rvzBd")) { closeAll(); return; }
  if (e.target.closest("[data-out]")) { try { await signOut(getAuth(app)); } catch (_) {} location.href = "index.html"; }
});
document.addEventListener("click", (e) => { if (!h.contains(e.target)) closeAll(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
let lastW = innerWidth; window.addEventListener("resize", () => { if (innerWidth !== lastW) { lastW = innerWidth; closeAll(); } });
const OVER = file === "index.html" || file === "collection.html" || file === ""; if (OVER) h.classList.add("rvz-fix");
const onScroll = () => { h.classList.toggle("rvz-sm", window.scrollY > 70); h.classList.toggle("rvz-over", OVER && window.scrollY < 24 && !h.querySelector(".rvz-card.open")); };
window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

const setBadge = (sel, n) => h.querySelectorAll(sel).forEach((b) => { b.textContent = n > 99 ? "99+" : n; b.hidden = !n; });
const readCart = () => { try { cartN = window.rivenzCartStore?.count?.() || 0; } catch (_) { cartN = 0; } setBadge("[data-cart]", cartN); };
window.addEventListener("rivenz-cart-updated", readCart);
window.addEventListener("rivenz-cart-session-changed", () => setTimeout(readCart, 0));
window.addEventListener("storage", readCart);
window.addEventListener("rivenz-cart-store-ready", () => window.rivenzCartStore?.ready?.then(readCart));


/* ---------- Order notifications (bell) ---------- */
const sKey = () => "rvzNotifSeen_" + (user?.uid || "");
const readSeen = () => { try { return JSON.parse(localStorage.getItem(sKey()) || "null"); } catch (_) { return null; } };
const esc2 = (v) => String(v ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
function ago(ms) { if (!ms) return ""; const d = Math.max(0, Date.now() - ms), m = Math.floor(d / 60000); if (m < 1) return "Just now"; if (m < 60) return m + " min ago"; const hh = Math.floor(m / 60); if (hh < 24) return hh + " hr ago"; const dd = Math.floor(hh / 24); return dd < 7 ? dd + " day" + (dd > 1 ? "s" : "") + " ago" : new Date(ms).toLocaleDateString("en-LK", { day: "numeric", month: "short" }); }
function drawNotif() {
  const seen = readSeen() || {};
  nUnread = notifs.filter((n) => seen[n.orderId] !== n.key).length;
  setBadge("[data-nb]", nUnread);
  const box = h.querySelector("#rvzNL"); if (!box) return;
  box.innerHTML = notifs.length ? notifs.map((n) => `<a class="rvz-ni${seen[n.orderId] !== n.key ? " new" : ""}" href="order-details.html?id=${encodeURIComponent(n.orderId)}"><i></i><span><b>${esc2(n.message)}</b><small>${esc2(ago(n.ms))}</small></span></a>`).join("") : '<div class="rvz-ne">No notifications yet. Updates about your orders will appear here.</div>';
}
function markSeen() { if (!user) return; const seen = {}; notifs.forEach((n) => { seen[n.orderId] = n.key; }); try { localStorage.setItem(sKey(), JSON.stringify(seen)); } catch (_) {} setTimeout(() => { setBadge("[data-nb]", 0); nUnread = 0; }, 400); }
function ts(v) { return v?.toMillis ? v.toMillis() : v instanceof Date ? v.getTime() : Number.isFinite(Date.parse(v)) ? Date.parse(v) : 0; }
let stopOrd = null;
function watchOrders(u) {
  try {
    stopOrd = onSnapshot(query(collection(db, "orders"), where("uid", "==", u.uid)), (snap) => {
      notifs = snap.docs.map((d) => { const o = d.data(), n = o.lastNotification; if (!n || !n.message || o.customerHidden) return null; return { orderId: d.id, message: n.message, key: String(n.time || "") + "|" + String(n.message), ms: ts(n.createdAt) || ts(n.time) || ts(o.updatedAt) }; }).filter(Boolean).sort((a, b) => b.ms - a.ms).slice(0, 20);
      if (readSeen() === null) { const seen = {}; notifs.forEach((n) => { if (n.ms < Date.now() - 86400000) seen[n.orderId] = n.key; }); try { localStorage.setItem(sKey(), JSON.stringify(seen)); } catch (_) {} }
      drawNotif();
    }, () => {});
  } catch (_) {}
}

paint(); readCart();
let stopChat = null;
onAuthStateChanged(getAuth(app), (u) => {
  user = u || null; unread = 0; notifs = []; nUnread = 0; if (stopChat) { stopChat(); stopChat = null; } if (stopOrd) { stopOrd(); stopOrd = null; }
  paint(); readCart(); drawNotif(); if (u) watchOrders(u);
  if (u) stopChat = onSnapshot(doc(db, "chats", u.uid), (s) => { unread = Number(s.data()?.unreadUser) > 0 ? Number(s.data().unreadUser) : 0; setBadge("[data-unread]", unread); }, () => {});
});
import("./live-chat.js?v=27").catch((e) => console.warn("live chat", e));
import("./login-modal.js?v=29").catch((e) => console.warn("login popup", e));

if (!window.__rvzLd) { const sc = document.createElement("script"); sc.src = "public-content.js?v=26"; document.head.appendChild(sc); }

import("./site-footer.js?v=26").catch(() => {});
