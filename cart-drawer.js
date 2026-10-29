/* RIVENZ cart drawer: slides in from the right on every page (replaces the old Cart page). */
const money = (n) => "Rs. " + Number(n || 0).toLocaleString("en-LK", { maximumFractionDigits: 0 });
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let products = [], loaded = false, root = null, isOpen = false;
const store = () => window.rivenzCartStore;
const read = () => { try { return store()?.getCart() || []; } catch (_) { return []; } };
const productFor = (it) => products.find((x) => x && String(x.id) === String(it.productId)) || null;
const imageFor = (it) => it.image || (productFor(it)?.images || [])[0]?.url || "";
function stockOf(it) {
  const p = productFor(it); if (!p) return Infinity;
  const m = p.stockByColorSize || p.variantStock || {};
  if (it.color && m[it.color] && typeof m[it.color] === "object" && Object.prototype.hasOwnProperty.call(m[it.color], it.size)) return Math.max(0, Number(m[it.color][it.size]) || 0);
  const st = p.stock || {};
  if (it.color && st[it.size] && typeof st[it.size] === "object") return Math.max(0, Number(st[it.size][it.color]) || 0);
  if (typeof st[it.size] === "number") return Math.max(0, Number(st[it.size]) || 0);
  return Infinity;
}
const deliveryOf = (it) => { const p = productFor(it); return p ? (p.deliveryType === "free" ? 0 : Math.max(0, Number(p.deliveryFee) || 0)) : Math.max(0, Number(it.deliveryFee) || 0); };
function deliveryTotal(items) { const seen = new Set(); return items.reduce((s, it) => { const id = String(it.productId || it.id || it.name || ""); if (seen.has(id)) return s; seen.add(id); return s + deliveryOf(it); }, 0); }

function css() {
  if (document.getElementById("rvzCdCss")) return;
  const s = document.createElement("style"); s.id = "rvzCdCss";
  s.textContent = `#rvzCd{position:fixed;inset:0;z-index:100001;visibility:hidden;transition:visibility 0s linear .35s;font-family:Inter,system-ui,sans-serif;color:#111316}#rvzCd.open{visibility:visible;transition:visibility 0s}
#rvzCd .bd{position:absolute;inset:0;background:rgba(0,0,0,.5);opacity:0;transition:opacity .3s}#rvzCd.open .bd{opacity:1}
#rvzCd .pn{position:absolute;top:0;right:0;bottom:0;width:min(440px,100vw);background:#fff;display:flex;flex-direction:column;transform:translateX(102%);transition:transform .32s cubic-bezier(.22,1,.36,1)}#rvzCd.open .pn{transform:none}
#rvzCd .hd{display:flex;align-items:center;justify-content:space-between;padding:22px 22px 18px;border-bottom:1px solid #e6e6e2}#rvzCd .hd h2{margin:0;font-size:22px;font-weight:800;letter-spacing:.02em;text-transform:uppercase}
#rvzCd .x{width:38px;height:38px;border:0;background:none;display:grid;place-items:center;cursor:pointer;color:#111316;padding:0}#rvzCd .x svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round}
#rvzCd .ls{flex:1;overflow-y:auto;padding:6px 22px}
#rvzCd .it{display:grid;grid-template-columns:78px 1fr auto;gap:14px;padding:18px 0;border-bottom:1px solid #ececE8}#rvzCd .im{width:78px;height:96px;background:#f2f2ef;overflow:hidden}#rvzCd .im img{width:100%;height:100%;object-fit:cover;display:block}
#rvzCd .nm{font-size:14.5px;font-weight:700;line-height:1.35;margin-bottom:3px}#rvzCd .mt{font-size:12.5px;color:#8a8d93}#rvzCd .pr{font-size:14px;font-weight:800;margin-top:10px}
#rvzCd .rt{display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between}#rvzCd .rm{border:0;background:none;color:#9a9ca4;cursor:pointer;padding:2px;display:grid}#rvzCd .rm:hover{color:#e5484d}#rvzCd .rm svg{width:19px;height:19px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
#rvzCd .q{display:flex;align-items:center;border:1px solid #dcdcd8}#rvzCd .q button{width:34px;height:34px;border:0;background:none;font-size:17px;cursor:pointer;color:#111316}#rvzCd .q span{min-width:26px;text-align:center;font-size:13.5px;font-weight:700}
#rvzCd .em{padding:70px 10px;text-align:center;color:#8a8d93;font-size:14px}#rvzCd .em b{display:block;color:#111316;font-size:17px;margin-bottom:6px}
#rvzCd .ft{padding:16px 22px 22px;border-top:1px solid #e6e6e2}#rvzCd .rw{display:flex;justify-content:space-between;font-size:13.5px;color:#6d7077;margin-bottom:6px}#rvzCd .rw.t{font-size:18px;font-weight:800;color:#111316;margin:8px 0 14px}
#rvzCd .co{display:flex;align-items:center;justify-content:center;height:52px;background:#000;color:#fff;font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;text-decoration:none}#rvzCd .co.off{opacity:.4;pointer-events:none}
@media(prefers-reduced-motion:reduce){#rvzCd *{transition:none!important}}`;
  document.head.appendChild(s);
}
function build() {
  if (root) return; css();
  root = document.createElement("div"); root.id = "rvzCd"; root.setAttribute("aria-hidden", "true");
  root.innerHTML = '<div class="bd" data-x></div><aside class="pn" role="dialog" aria-modal="true" aria-label="Cart"><div class="hd"><h2>Cart</h2><button type="button" class="x" data-x aria-label="Close cart"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div class="ls" id="rvzCdL"></div><div class="ft" id="rvzCdF"></div></aside>';
  document.body.appendChild(root);
  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-x]")) return close();
    const b = e.target.closest("[data-a]"); if (!b) return;
    const i = Number(b.closest(".it").dataset.i), a = b.dataset.a, c = read(); if (!c[i]) return;
    if (a === "rm") c.splice(i, 1);
    else if (a === "mi") c[i].quantity = Math.max(1, Number(c[i].quantity || 1) - 1);
    else { const st = stockOf(c[i]), max = Number.isFinite(st) ? st : 9999; if (Number(c[i].quantity || 1) >= max) return; c[i].quantity = Number(c[i].quantity || 1) + 1; }
    store().saveCart(c);
  });
}
function render() {
  if (!root) return;
  const items = read(), L = root.querySelector("#rvzCdL"), F = root.querySelector("#rvzCdF");
  const sub = items.reduce((s, x) => s + Number(x.price || 0) * Math.max(0, Number(x.quantity) || 0), 0), del = deliveryTotal(items);
  if (!items.length) { L.innerHTML = '<div class="em"><b>Your cart is empty</b>Add a piece and it will appear here.</div>'; F.innerHTML = ""; return; }
  L.innerHTML = items.map((it, i) => { const q = Math.max(1, Number(it.quantity) || 1), im = imageFor(it); return `<div class="it" data-i="${i}"><div class="im">${im ? `<img src="${esc(im)}" alt="">` : ""}</div><div><div class="nm">${esc(it.name || "RIVENZ Product")}</div><div class="mt">${[it.color, it.size].filter(Boolean).map(esc).join(" / ")}</div><div class="pr">${money(Number(it.price || 0) * q)}</div></div><div class="rt"><button type="button" class="rm" data-a="rm" aria-label="Remove"><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button><div class="q"><button type="button" data-a="mi" aria-label="Decrease">&minus;</button><span>${q}</span><button type="button" data-a="pl" aria-label="Increase">+</button></div></div></div>`; }).join("");
  F.innerHTML = `<div class="rw"><span>Subtotal</span><span>${money(sub)}</span></div><div class="rw"><span>Delivery</span><span>${del ? money(del) : "FREE"}</span></div><div class="rw t"><span>Total</span><span>${money(sub + del)}</span></div><a class="co" href="order.html">Checkout</a>`;
}
async function loadProducts() {
  if (loaded) return; loaded = true;
  for (let i = 0; i < 25 && !window.graphicsPublicContent?.catalog; i++) await new Promise((r) => setTimeout(r, 200));
  try { const r = await window.graphicsPublicContent.catalog("products"); if (Array.isArray(r)) products = r; } catch (_) {}
  render();
}
export async function open() {
  for (let i = 0; i < 25 && !store(); i++) await new Promise((r) => setTimeout(r, 120));
  try { await store()?.ready; } catch (_) {}
  if (!store()?.requireLogin()) return;
  build(); render(); loadProducts();
  isOpen = true; root.setAttribute("aria-hidden", "false");
  void root.offsetWidth; root.classList.add("open"); document.documentElement.style.overflow = "hidden";
}
export function close() { if (!root) return; isOpen = false; root.classList.remove("open"); root.setAttribute("aria-hidden", "true"); document.documentElement.style.overflow = ""; }
window.rvzCartDrawer = { open, close };
window.addEventListener("rivenz-cart-updated", render);
window.addEventListener("rivenz-cart-session-changed", () => { if (isOpen && !store()?.uid) close(); render(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) close(); });
document.addEventListener("click", (e) => { const b = e.target.closest("[data-cartbtn]"); if (!b) return; e.preventDefault(); open(); });
try { const u = new URL(location.href); if (u.searchParams.get("cart")) { u.searchParams.delete("cart"); history.replaceState(null, "", u.pathname + u.search + u.hash); open(); } } catch (_) {}
