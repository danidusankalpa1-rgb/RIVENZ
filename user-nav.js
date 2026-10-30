// RIVENZ — unified menu bar for every customer page (desktop bar + mobile dropdown, icons, login-aware).
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { doc, onSnapshot, collection, query, where } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { app, db } from "./firebase-config.js";
import "./cart-store.js";
import "./cart-drawer.js?v=2";

const P = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  shop: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  collection: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
  offers: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><path d="M7.5 7.5h.01"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/><path d="M8 10h8M8 14h5"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L21 8H6"/>',
  event: '<path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7"/><path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  refund: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M14.5 9.5c-.4-.6-1.2-1-2.3-1-1.3 0-2.2.6-2.2 1.6 0 2.2 4.6 1 4.6 3.2 0 1-1 1.7-2.4 1.7-1.2 0-2.1-.5-2.5-1.2M12 7v1.5M12 15v1.5"/>',
  order: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  menu: '<path d="M4 9h16M4 15h16"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>'
};
const I = (k, c = "") => `<svg class="rvz-i ${c}" viewBox="0 0 24 24" aria-hidden="true">${P[k]}</svg>`;
const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
const ACTIVE = { "index.html": "home", "": "home", "collection-mens.html": "mens", "collection-women.html": "women", "collection-shoes.html": "shoes", "collection-accessories.html": "acc", "weddings.html": "offers", "special-event.html": "event", "profile.html": "profile", "dashboard.html": "order", "order-details.html": "order", "refund.html": "refund", "chat.html": "chat" }[file] || "";
const MAIN = [["home", "Home", "index.html"], ["mens", "Mens", "collection-mens.html"], ["women", "Women", "collection-women.html"], ["shoes", "Shoes", "collection-shoes.html"], ["acc", "Accessories", "collection-accessories.html"], ["offers", "Last chance", "weddings.html"], ["event", "Special Event", "special-event.html"]];

const esc3 = (v) => String(v ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const h = document.createElement("header");
h.className = "rvz-h";
document.body.prepend(h);
let user = null, unread = 0, cartN = 0, notifs = [], nUnread = 0;

let authReady = false;
const cachedU = () => { try { return JSON.parse(localStorage.getItem("rvzNavUser") || "null"); } catch (_) { return null; } };
const subHtml = (u, list, imgs, key) => `<a href="${u}">Shop all</a>` + (list || []).map((n) => { const im = imgs && imgs[key + "|" + n]; return `<a class="${im ? "has-im" : ""}" href="${u}?sub=${encodeURIComponent(n)}">${im ? `<img src="${esc3(im)}" alt="" loading="lazy">` : ""}<span>${esc3(n)}</span></a>`; }).join("");
function fillSubs(map) { h.querySelectorAll(".rvz-dg").forEach((g) => { const ds = g.querySelector(".rvz-ds"); if (ds) ds.innerHTML = subHtml(g.dataset.u, map[g.dataset.sk], map.images, g.dataset.sk); }); }
function paint() {
  const cu = !authReady ? cachedU() : null;
  const li = !!user || !!cu, on = (k) => (ACTIVE === k ? " on" : "");
  const initial = user ? String(user.displayName || user.email || "U").trim().slice(0, 1).toUpperCase() : String(cu?.i || "U").slice(0, 1).toUpperCase();
  const sigNow = [li, initial, user?.email || cu?.e || ""].join("|");
  if (h.dataset.sig === sigNow && h.firstChild) return;
  h.dataset.sig = sigNow;
  const cartB = `<em class="rvz-b" data-cart${cartN ? "" : " hidden"}>${cartN}</em>`, chatB = `<em class="rvz-b" data-unread${unread ? "" : " hidden"}>${unread}</em>`;
  const full = MAIN;
  const SUBK = { mens: "mens", women: "women", shoes: "shoes", acc: "accessories" };
  const subCache = window.rvzSub ? window.rvzSub.cached() : {};
  const dl = ([k, l, u, bd = ""]) => SUBK[k] ? `<div class="rvz-dg${on(k) ? " open" : ""}" data-sk="${SUBK[k]}" data-u="${u}"><button type="button" class="rvz-dr rvz-dt${on(k)}" data-dt aria-expanded="${on(k) ? "true" : "false"}"><span>${l}</span><svg class="rvz-dc" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="rvz-ds">${subHtml(u, subCache[SUBK[k]], subCache.images, SUBK[k])}</div></div>` : `<a class="rvz-dr${on(k)}" href="${u}"><span>${l}</span>${bd}</a>`;
  const row = ([k, l, u, b = ""]) => `<a class="rvz-row${on(k)}" href="${u}">${I(k === "profile" ? "user" : k)}<span>${l}</span>${b}</a>`;
  const isShop = false, curCat = new URLSearchParams(location.search).get("category")||"all";
  const CATS = [["Men's", "mens"], ["Ladies", "ladies"], ["Unisex", "unisex"], ["Kids", "kids"], ["Accessories", "accessories"]];
  h.innerHTML = `<div class="rvz-w">
    <div class="rvz-l"><button type="button" class="rvz-c rvz-menu" id="rvzMenu" aria-label="Open menu" aria-expanded="false"><span class="rvz-m">${I("menu")}</span><span class="rvz-x">${I("x")}</span></button>
    <button type="button" class="rvz-c rvz-bell rvz-sbtn" id="rvzSBtn" aria-label="Search" aria-expanded="false">${I("search")}</button></div>
    <a class="rvz-logo" href="index.html" aria-label="RIVENZ home"><img src="logo.png" alt="RIVENZ"></a>
    <div class="rvz-r">
      <a class="rvz-c${on("cart")}" href="index.html?cart=1" aria-label="Cart" data-cartbtn>${I("cart")}${cartB}</a>
      ${li ? `<button type="button" class="rvz-c rvz-acc" id="rvzAcc" aria-label="Account" aria-expanded="false"><span class="rvz-av">${initial}</span></button>` : `<a class="rvz-login" href="auth.html?next=${encodeURIComponent(file)}">${I("user")}<span>Login</span></a>`}
    </div>
  </div>
  <div class="rvz-search rvz-blk" id="rvzSearch"><form class="rvz-sw" id="rvzSF" role="search"><input type="search" name="q" placeholder="Search products" autocomplete="off" maxlength="60" aria-label="Search products"></form><div class="rvz-sr" id="rvzSR" hidden></div></div>
  <div class="rvz-w2">
    <div class="rvz-card rvz-acc-card" id="rvzAccCard"><a class="rvz-row${on("profile")}" href="profile.html">${I("user")}<span>My profile</span></a><a class="rvz-row${on("order")}" href="dashboard.html">${I("order")}<span>My order</span></a><a class="rvz-row${on("refund")}" href="refund.html">${I("refund")}<span>My refund</span></a><div class="rvz-sep"></div><button type="button" class="rvz-row" data-out>${I("out")}<span>Log out</span></button></div>
    <div class="rvz-card rvz-mob" id="rvzMob"><div class="rvz-dh"><img src="logo.png" alt="RIVENZ"><button type="button" class="rvz-dx" data-close aria-label="Close menu">${I("x")}</button></div><nav class="rvz-dn">${full.map((r) => dl(r)).join("")}</nav><div class="rvz-df">${li ? `<span>Signed in as</span><b data-who>${esc3(user?.email || cachedU()?.e || "")}</b>` : `<a href="auth.html?next=${encodeURIComponent(file)}">Login / Sign up</a>`}</div></div>
    <div class="rvz-bd" id="rvzBd"></div>
  </div>`;
}
function lock() { setTimeout(() => window.dispatchEvent(new Event("scroll")), 0); const o = !!h.querySelector("#rvzMob.open"); h.querySelector("#rvzBd")?.classList.toggle("open", o); document.documentElement.style.overflow = o ? "hidden" : ""; }
function closeAll() {
  h.querySelectorAll(".rvz-card,.rvz-search").forEach((c) => c.classList.remove("open"));
  h.querySelectorAll("#rvzMenu,#rvzAcc,#rvzSBtn").forEach((b) => { b.classList.remove("open"); b.setAttribute("aria-expanded", "false"); });
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
  if (sb) { e.stopPropagation(); const f = h.querySelector("#rvzSearch"), op = !f.classList.contains("open"); closeAll(); f.classList.toggle("open", op); sb.setAttribute("aria-expanded", String(op)); if (op) { f.querySelector("input")?.focus(); loadSearchProducts(); } return; }
  if (m) { e.stopPropagation(); return toggle(m, h.querySelector("#rvzMob")); }
  if (a) { e.stopPropagation(); return toggle(a, h.querySelector("#rvzAccCard")); }
  const dt = e.target.closest("[data-dt]"); if (dt) { e.stopPropagation(); const g = dt.closest(".rvz-dg"), op = !g.classList.contains("open"); g.classList.toggle("open", op); dt.setAttribute("aria-expanded", String(op)); return; }
  if (e.target.closest("[data-close]") || e.target.closest("#rvzBd")) { closeAll(); return; }
  if (e.target.closest("[data-out]")) { try { await signOut(getAuth(app)); } catch (_) {} location.href = "index.html"; }
});
let sProducts = null, sLoading = null;
async function loadSearchProducts() {
  if (sProducts) return sProducts;
  if (!sLoading) sLoading = (async () => { for (let i = 0; i < 25 && !window.graphicsPublicContent?.catalog; i++) await new Promise((r) => setTimeout(r, 200)); try { const r = await window.graphicsPublicContent.catalog("products"); sProducts = (Array.isArray(r) ? r : []).filter((p) => p && p.active !== false && !p.special); } catch (_) { sProducts = []; } return sProducts; })();
  return sLoading;
}
let sTimer = 0;
async function runSearch(q) {
  const box = h.querySelector("#rvzSR"); if (!box) return;
  q = q.trim().toLowerCase();
  if (!q) { box.hidden = true; box.innerHTML = ""; return; }
  const list = (await loadSearchProducts()).filter((p) => (String(p.name || "") + " " + String(p.category || "") + " " + String(p.description || "")).toLowerCase().includes(q)).slice(0, 7);
  if (h.querySelector("#rvzSF input").value.trim().toLowerCase() !== q) return;
  const money = (v) => "Rs. " + Number(v || 0).toLocaleString("en-LK");
  box.innerHTML = list.length ? list.map((p) => { const im = (Array.isArray(p.images) && p.images.find((x) => x && x.url)) || p.image || {}; const pr = Number(p.offer) > 0 && Number(p.offer) < Number(p.price) ? p.offer : p.price; return `<a href="services.html?product=${encodeURIComponent(p.id)}">${im.url ? `<img src="${esc2(im.url)}" alt="">` : '<img alt="">'}<span class="si"><b>${esc2(p.name || "Product")}</b><small>${money(pr)}</small></span></a>`; }).join("") : '<div class="none">No products found.</div>';
  box.hidden = false;
}
h.addEventListener("input", (e) => { if (e.target.closest("#rvzSF")) { clearTimeout(sTimer); const v = e.target.value; sTimer = setTimeout(() => runSearch(v), 180); } });
h.addEventListener("submit", (e) => { const f = e.target.closest("#rvzSF"); if (!f) return; e.preventDefault(); const q = f.q.value.trim(); if (q) location.href = "services.html?q=" + encodeURIComponent(q); });
document.addEventListener("click", (e) => { if (!h.contains(e.target)) closeAll(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
let lastW = innerWidth; window.addEventListener("resize", () => { if (innerWidth !== lastW) { lastW = innerWidth; closeAll(); } });
const OVER = file === "index.html" || file === ""; if (OVER) h.classList.add("rvz-fix");
const onScroll = () => { h.classList.toggle("rvz-sm", window.scrollY > 70); h.classList.toggle("rvz-over", OVER && window.scrollY < 24 && !h.querySelector(".rvz-card.open,.rvz-search.open")); };
window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

const setBadge = (sel, n) => h.querySelectorAll(sel).forEach((b) => { b.textContent = n > 99 ? "99+" : n; b.hidden = !n; });
const readCart = () => { try { cartN = window.rivenzCartStore?.count?.() || 0; } catch (_) { cartN = 0; } setBadge("[data-cart]", cartN); };
window.addEventListener("rivenz-cart-updated", readCart);
window.addEventListener("rivenz-cart-session-changed", () => setTimeout(readCart, 0));
window.addEventListener("storage", readCart);
window.addEventListener("rivenz-cart-store-ready", () => window.rivenzCartStore?.ready?.then(readCart));


/* ---------- Order notifications: black pop-up (only the new one; no list) ---------- */
const sKey = () => "rvzNotifSeen_" + (user?.uid || "");
const readSeen = () => { try { return JSON.parse(localStorage.getItem(sKey()) || "null"); } catch (_) { return null; } };
const esc2 = (v) => String(v ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
function ts(v) { return v?.toMillis ? v.toMillis() : v instanceof Date ? v.getTime() : Number.isFinite(Date.parse(v)) ? Date.parse(v) : 0; }
const popQ = []; let popEl = null, popTimer = 0;
function popCss() {
  if (document.getElementById("rvzPopCss")) return;
  const c = document.createElement("style"); c.id = "rvzPopCss";
  c.textContent = `.rvz-blk{background:#0b0b0c!important;border-top:1px solid #222!important;box-shadow:0 24px 40px -24px rgba(0,0,0,.6)!important}.rvz-blk .rvz-sw{background:#000;border:1px solid #2a2a2e;padding:4px 18px}.rvz-blk .rvz-sw input{color:#fff;padding:12px 0}.rvz-blk .rvz-sw input::placeholder{color:#7d7f87}.rvz-blk .rvz-sw input::-webkit-search-cancel-button{-webkit-appearance:none}
.rvz-sr{max-width:680px;margin:8px auto 0;background:#000;border:1px solid #2a2a2e;border-radius:18px;overflow:hidden;max-height:min(60vh,420px);overflow-y:auto}.rvz-sr[hidden]{display:none}.rvz-sr a{display:flex;align-items:center;gap:12px;padding:10px 14px;color:#fff;text-decoration:none;border-bottom:1px solid #1a1a1d}.rvz-sr a:last-child{border-bottom:0}.rvz-sr a:hover,.rvz-sr a:focus{background:#151517;outline:0}.rvz-sr img{width:40px;height:48px;object-fit:cover;border-radius:8px;background:#1c1c1f;flex:none}.rvz-sr .si{min-width:0;flex:1}.rvz-sr b{display:block;font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rvz-sr small{display:block;font-size:12px;color:#9a9ca4;margin-top:2px}.rvz-sr .none{padding:16px;color:#8d8f96;font-size:13px}
.rvz-pp{position:fixed;right:20px;bottom:20px;z-index:100000;width:min(360px,calc(100vw - 24px));background:#0b0b0c;color:#fff;border:1px solid #26262a;border-radius:18px;padding:16px 16px 14px;box-shadow:0 26px 60px -18px rgba(0,0,0,.65);font-family:Inter,system-ui,sans-serif;transform:translateY(18px);opacity:0;transition:transform .28s ease,opacity .28s ease}.rvz-pp.in{transform:none;opacity:1}
.rvz-pp .rvz-px{position:absolute;top:8px;right:8px;width:30px;height:30px;border:0;border-radius:50%;background:transparent;color:#9a9ca4;font-size:20px;line-height:1;cursor:pointer}.rvz-pp .rvz-px:hover{background:#1c1c1f;color:#fff}
.rvz-pk{font-size:10px;font-weight:800;letter-spacing:.16em;color:#8d8f96;margin-bottom:6px}.rvz-pm{font-size:14px;font-weight:600;line-height:1.5;padding-right:22px;word-break:break-word}.rvz-pl{display:inline-block;margin-top:10px;font-size:12.5px;font-weight:700;color:#fff;text-decoration:underline;text-underline-offset:3px}
.rvz-rt{margin-top:12px;padding-top:12px;border-top:1px solid #1f1f23}.rvz-rn{display:flex;align-items:center;gap:9px;font-size:12.5px;font-weight:600;margin-bottom:6px;color:#e8e8ea}.rvz-rn img{width:30px;height:36px;object-fit:cover;border-radius:6px;background:#1c1c1f;flex:none}.rvz-rn span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rvz-rs{display:flex;gap:2px}.rvz-rs button{border:0;background:none;padding:2px;width:30px;height:30px;cursor:pointer}.rvz-rs svg{width:100%;height:100%;fill:#3a3a40;transition:fill .12s}.rvz-rs button.on svg{fill:#f5b301}
.rvz-rf{margin-top:8px}.rvz-rf textarea{width:100%;box-sizing:border-box;min-height:62px;border:1px solid #2c2c30;background:#151517;color:#fff;border-radius:10px;padding:9px 11px;font:inherit;font-size:13px;resize:vertical;outline:0}.rvz-rf textarea:focus{border-color:#fff}.rvz-rg{margin-top:8px;border:0;background:#fff;color:#0b0b0c;border-radius:999px;padding:9px 18px;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}.rvz-rg:disabled{opacity:.6}.rvz-rm{margin-top:6px;font-size:12px;color:#8d8f96}.rvz-rm.ok{color:#4ade80}.rvz-rm.err{color:#f87171}
@media(max-width:600px){.rvz-pp{right:12px;left:12px;bottom:12px;width:auto}}`;
  document.head.appendChild(c);
}
popCss();
const STAR = '<svg viewBox="0 0 24 24"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
function closePop() { clearTimeout(popTimer); if (!popEl) return; const el = popEl; popEl = null; try { el.__mark && el.__mark(); } catch (_) {} el.classList.remove("in"); setTimeout(() => { el.remove(); nextPop(); }, 280); }
function nextPop() { if (popEl || !popQ.length) return; showPop(popQ.shift()); }
function showPop(n) {
  popCss();
  const el = document.createElement("div"); el.className = "rvz-pp"; el.dataset.oid = n.orderId; el.dataset.key = n.key || n.orderId + "|" + n.message; el.setAttribute("role", "status");
  const items = []; const seenP = new Set();
  (n.items || []).forEach((it) => { const id = String(it.productId || ""); if (id && !seenP.has(id) && items.length < 3) { seenP.add(id); items.push({ id, name: it.productName || it.name || "Product", img: String(it.image || it.img || (it.images && it.images[0] && it.images[0].url) || "") }); } });
  const delivered = n.delivered && items.length;
  el.innerHTML = `<button type="button" class="rvz-px" aria-label="Close">&times;</button><div class="rvz-pk">${n.custom ? "MESSAGE FROM RIVENZ" : "ORDER UPDATE"}</div><div class="rvz-pm">${delivered ? "Your order " + esc2(n.orderId) + " has been delivered. How was it?" : esc2(n.message)}</div>` +
    (delivered ? items.map((it) => `<div class="rvz-rt" data-pid="${esc2(it.id)}"><div class="rvz-rn">${(it.img && !/^\s*(javascript|vbscript):/i.test(it.img)) ? `<img src="${esc2(it.img)}" alt="">` : ""}<span>${esc2(it.name)}</span></div><div class="rvz-rs">${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-v="${i}" aria-label="${i} star">${STAR}</button>`).join("")}</div><div class="rvz-rf" hidden><textarea maxlength="600" placeholder="Write a few words (optional)"></textarea><button type="button" class="rvz-rg">Submit review</button></div><div class="rvz-rm"></div></div>`).join("") : "") +
    (n.custom ? "" : `<a class="rvz-pl" href="order-details.html?id=${encodeURIComponent(n.orderId)}">View order</a>`);
  el.__mark = n.mark || null; document.body.appendChild(el); popEl = el; requestAnimationFrame(() => el.classList.add("in"));
  el.addEventListener("click", async (e) => {
    if (e.target.closest(".rvz-px")) return closePop();
    const row = e.target.closest(".rvz-rt"); if (!row) return;
    clearTimeout(popTimer);
    const sb = e.target.closest(".rvz-rs button");
    if (sb) { const v = Number(sb.dataset.v); row.dataset.r = v; row.querySelectorAll(".rvz-rs button").forEach((b) => b.classList.toggle("on", Number(b.dataset.v) <= v)); row.querySelector(".rvz-rf").hidden = false; return; }
    const go = e.target.closest(".rvz-rg"); if (!go) return;
    const msg = row.querySelector(".rvz-rm"); go.disabled = true; msg.className = "rvz-rm"; msg.textContent = "";
    try {
      for (let i = 0; i < 20 && !window.graphicsPublicContent?.api; i++) await new Promise((r) => setTimeout(r, 200));
      const r = await window.graphicsPublicContent.api("/reviews/submit", { method: "POST", body: JSON.stringify({ orderId: n.orderId, productId: row.dataset.pid, rating: Number(row.dataset.r), text: row.querySelector("textarea").value }) });
      if (r && r.ok === false) throw new Error(r.error || "FAILED");
      row.innerHTML = '<div class="rvz-rn">' + esc2(row.querySelector(".rvz-rn span").textContent) + '</div><div class="rvz-rm ok">Thank you for your feedback!</div>';
    } catch (er) { msg.className = "rvz-rm err"; msg.textContent = String(er?.message) === "ALREADY_REVIEWED" ? "You have already reviewed this product." : "Could not send your review. Please try again."; go.disabled = false; }
  });
  if (!delivered) { let left = 8000, t0 = Date.now(); const live = () => popEl === el; const arm = () => { clearTimeout(popTimer); if (!live() || document.hidden) return; t0 = Date.now(); popTimer = setTimeout(closePop, left); }; arm(); el.addEventListener("mouseenter", () => { clearTimeout(popTimer); left -= Date.now() - t0; }); el.addEventListener("mouseleave", arm); document.addEventListener("visibilitychange", () => { if (!live()) return; if (document.hidden) { clearTimeout(popTimer); left -= Date.now() - t0; if (left < 4000) left = 4000; } else arm(); }); }
}
function queuePop(n) { const k = n.key || n.orderId + "|" + n.message; if (popQ.some((x) => (x.key || x.orderId + "|" + x.message) === k) || (popEl && popEl.dataset.key === k)) return; popQ.push(n); nextPop(); }
let stopOrd = null, stopNote = null;
function watchNotice(u) {
  try {
    stopNote = onSnapshot(doc(db, "clients", u.uid), (d) => {
      if (d.metadata && d.metadata.hasPendingWrites) return;
      const n = d.exists() && d.data().adminNotice; if (!n || !n.message) return;
      const id = String(n.id || n.time || ""), k = "rvzNoticeSeen_" + u.uid; let seen = null;
      try { seen = localStorage.getItem(k); } catch (_) {}
      if (seen === id) return;
      if (seen === null && ts(n.time) < Date.now() - 3 * 86400000) { try { localStorage.setItem(k, id); } catch (_) {} return; }
      queuePop({ orderId: "msg-" + id, message: String(n.message), custom: true, mark: () => { try { localStorage.setItem(k, id); } catch (_) {} } });
    }, () => {});
  } catch (_) {}
}
function watchOrders(u) {
  try {
    stopOrd = onSnapshot(query(collection(db, "orders"), where("uid", "==", u.uid)), (snap) => {
      const list = snap.docs.map((d) => { if (d.metadata && d.metadata.hasPendingWrites) return null; const o = d.data(), n = o.lastNotification; if (!n || !n.message || o.customerHidden) return null; return { orderId: d.id, message: n.message, key: String(n.time || "") + "|" + String(n.message), ms: ts(n.createdAt) || ts(n.time) || ts(o.updatedAt), delivered: /^deliver/i.test(String(o.status || "")), items: o.items || o.products || [] }; }).filter(Boolean).sort((a, b) => a.ms - b.ms);
      if (readSeen() === null) { const seen = {}; list.forEach((n) => { if (n.ms < Date.now() - 86400000) seen[n.orderId] = n.key; }); try { localStorage.setItem(sKey(), JSON.stringify(seen)); } catch (_) {} }
      const seen = readSeen() || {}; let changed = false;
      list.forEach((n) => { if (seen[n.orderId] !== n.key) { n.mark = () => { const sn = readSeen() || {}; sn[n.orderId] = n.key; try { localStorage.setItem(sKey(), JSON.stringify(sn)); } catch (_) {} }; queuePop(n); } });
    }, () => {});
  } catch (_) {}
}

paint(); readCart();
let stopChat = null;
onAuthStateChanged(getAuth(app), (u) => {
  user = u || null; authReady = true; unread = 0; if (stopChat) { stopChat(); stopChat = null; } if (stopOrd) { stopOrd(); stopOrd = null; } if (stopNote) { stopNote(); stopNote = null; }
  try { if (u) localStorage.setItem("rvzNavUser", JSON.stringify({ i: String(u.displayName || u.email || "U").trim().slice(0, 1).toUpperCase(), e: u.email || "" })); else localStorage.removeItem("rvzNavUser"); } catch (_) {}
  paint(); readCart(); if (u) { watchOrders(u); watchNotice(u); }
  if (u) stopChat = onSnapshot(doc(db, "chats", u.uid), (s) => { unread = Number(s.data()?.unreadUser) > 0 ? Number(s.data().unreadUser) : 0; setBadge("[data-unread]", unread); }, () => {});
});
import("./live-chat.js?v=27").catch((e) => console.warn("live chat", e));
import("./login-modal.js?v=29").catch((e) => console.warn("login popup", e));

if (!window.__rvzLd) { const sc = document.createElement("script"); sc.src = "public-content.js?v=27"; document.head.appendChild(sc); }

if (!/^(contact|profile)\.html$/.test(file)) import("./site-footer.js?v=31").catch(() => {});
(function () { const go = () => { fillSubs(window.rvzSub.cached()); window.rvzSub.get().then(fillSubs); }; if (window.rvzSub) go(); else { const sc = document.createElement("script"); sc.src = "site-subcats.js?v=2"; sc.onload = go; document.head.appendChild(sc); } })();
