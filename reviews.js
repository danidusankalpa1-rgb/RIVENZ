/* RIVENZ product reviews: glass section, loading state, "Add review" pop-up for customers with a delivered order */
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { app } from "./firebase-config.js";
import "./order-flow.js";

const getPid = () => new URLSearchParams(location.search).get("product");
let pid = getPid();
const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const STAR = '<svg viewBox="0 0 24 24"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
const stars = (n) => '<span class="rvw-st">' + [1, 2, 3, 4, 5].map((i) => '<i class="' + (n >= i - 0.25 ? "on" : n >= i - 0.75 ? "half" : "") + '">' + STAR + "</i>").join("") + "</span>";
const API = () => (window.graphicsPublicContent && window.graphicsPublicContent.API) || "https://graphics-file-api.danidusankalpa56.workers.dev";
const MSG = { NOT_DELIVERED: "You can review a product after your order is delivered.", NOT_IN_ORDER: "This product is not in your order.", ALREADY_REVIEWED: "You have already reviewed this product.", BAD_RATING: "Please choose a star rating." };

const cache = {};
function fetchReviews(p) { if (!cache[p]) cache[p] = fetch(API() + "/reviews/list?product=" + encodeURIComponent(p)).then((r) => r.json()).then((j) => (j && j.ok ? j : { avg: 0, count: 0, reviews: [] })).catch(() => ({ avg: 0, count: 0, reviews: [] })); return cache[p]; }
if (pid) fetchReviews(pid);

const css = document.createElement("style");
css.textContent = `.rvw{position:relative;margin-top:54px;padding:22px;border-radius:26px;font-family:Inter,system-ui,sans-serif;color:#fff;background:radial-gradient(520px 300px at 10% 0%,rgba(255,255,255,.07),transparent 70%),#0d0e10;border:1px solid #1f2125;overflow:hidden}
.rvw-hd{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}.rvw-hd h2{font-size:20px;margin:0;letter-spacing:-.02em;color:#fff}.rvw-add{border:0;background:#fff;color:#0b0b0c;border-radius:999px;padding:8px 16px;font:700 12px Inter,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:6px}.rvw-add:hover{background:#d9dbe0}
.rvw-sum{display:grid;grid-template-columns:auto 1fr;gap:22px;align-items:center;margin-bottom:14px;padding:18px 20px;border-radius:20px;background:#15161a;border:1px solid #24262c}.rvw-sc{text-align:center;min-width:92px}.rvw-avg{font-size:46px;font-weight:800;letter-spacing:-.04em;line-height:1}.rvw-sc .rvw-st{margin-top:8px}.rvw-sc small{display:block;color:#8d9099;font-size:12px;margin-top:6px}
.rvw-bars{display:grid;gap:6px}.rvw-bar{display:grid;grid-template-columns:12px 1fr 24px;gap:8px;align-items:center;font-size:11.5px;color:#9a9da6}.rvw-bar i{display:block;height:6px;border-radius:99px;background:#272a31;overflow:hidden}.rvw-bar i b{display:block;height:100%;background:#f5b301;border-radius:99px}
.rvw-glass{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.rvw-st{display:inline-flex;gap:2px;vertical-align:middle}.rvw-st i{width:17px;height:17px;display:block}.rvw-st svg{width:100%;height:100%;fill:#3a3d45;stroke:none}.rvw-st i.on svg{fill:#f5b301}.rvw-st i.half svg{fill:#f5b301;opacity:.55}
.rvw-list{display:grid;gap:10px}.rvw-card{border-radius:16px;padding:14px 16px}.rvw-card header{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.rvw-card b{font-size:13.5px;margin-right:6px;color:#fff}.rvw-card time{font-size:11.5px;color:#7d8089}.rvw-card p{margin:8px 0 0;font-size:13.5px;line-height:1.6;color:#c4c6cc;white-space:pre-line;word-break:break-word}.rvw-card .rvw-st i{width:14px;height:14px}
.rvw-empty{color:#8d9099;font-size:14px;padding:6px 2px}
.rvw-sk{display:grid;gap:10px}.rvw-sk div{height:62px;border-radius:16px;background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.04) 75%);background-size:200% 100%;animation:rvwsh 1.2s linear infinite}.rvw-ld{font-size:12.5px;color:#8d9099;margin:-6px 0 12px}@keyframes rvwsh{to{background-position:-200% 0}}
@keyframes rvwIn{from{opacity:0}to{opacity:1}}@keyframes rvwUp{from{opacity:0;transform:translateY(18px) scale(.96)}to{opacity:1;transform:none}}.rvw-m{animation:rvwIn .2s ease both}.rvw-mc{animation:rvwUp .28s cubic-bezier(.2,.8,.2,1) both}.rvw-m{position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px}.rvw-mc{position:relative;width:min(400px,100%);background:#0b0b0c;color:#fff;border:1px solid #26262a;border-radius:20px;padding:22px 20px 18px;box-shadow:0 30px 70px -20px rgba(0,0,0,.7);font-family:Inter,system-ui,sans-serif}.rvw-mc h3{margin:0 0 4px;font-size:17px}.rvw-mc p{margin:0 0 14px;font-size:13px;color:#9a9ca4;line-height:1.5}.rvw-x{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;border-radius:50%;background:transparent;color:#9a9ca4;font-size:22px;cursor:pointer}.rvw-x:hover{background:#1c1c1f;color:#fff}
.rvw-pick{display:flex;gap:4px;margin-bottom:12px}.rvw-pick button{border:0;background:none;padding:2px;width:38px;height:38px;cursor:pointer}.rvw-pick svg{width:100%;height:100%;fill:#3a3a40;transition:fill .12s}.rvw-pick button.on svg{fill:#f5b301}
.rvw-mc textarea{width:100%;box-sizing:border-box;min-height:96px;border:1px solid #2c2c30;background:#151517;color:#fff;border-radius:12px;padding:12px 14px;font:inherit;font-size:14px;resize:vertical;outline:0}.rvw-mc textarea:focus{border-color:#fff}.rvw-go{margin-top:12px;width:100%;height:46px;border:0;border-radius:999px;background:#fff;color:#0b0b0c;font:800 13px Inter,system-ui,sans-serif;cursor:pointer}.rvw-go:disabled{opacity:.6}.rvw-note{margin-top:10px;font-size:13px;color:#9a9ca4}.rvw-note.ok{color:#4ade80;font-weight:600}.rvw-note.err{color:#f87171}.rvw-lg{display:inline-block;margin-top:6px;color:#fff;font-weight:700;font-size:13px;text-decoration:underline}
@media(max-width:600px){.rvw{padding:16px;border-radius:22px;margin-top:38px}.rvw-sum{gap:14px;padding:14px}.rvw-avg{font-size:38px}}`;
document.head.appendChild(css);

let box = null, data = null, eligibleOrder = "", done = false, signedIn = false, authResolve, authP = new Promise((r) => { authResolve = r; });

function render() {
  if (!box) return;
  const hd = '<div class="rvw-hd"><h2>Customer reviews</h2>' + (eligibleOrder && !done ? '<button type="button" class="rvw-add" id="rvwAdd">+ Add review</button>' : "") + "</div>";
  if (!data) { box.innerHTML = hd + '<div class="rvw-ld">Loading reviews...</div><div class="rvw-sk"><div></div><div></div></div>'; wire(); return; }
  const list = data.reviews || [];
  const dist = [5, 4, 3, 2, 1].map((n) => list.filter((r) => Math.round(Number(r.rating)) === n).length);
  const sum = list.length ? '<div class="rvw-sum"><div class="rvw-sc"><div class="rvw-avg">' + Number(data.avg || 0).toFixed(1) + "</div>" + stars(data.avg || 0) + "<small>" + data.count + " review" + (data.count === 1 ? "" : "s") + '</small></div><div class="rvw-bars">' + dist.map((c, i) => '<div class="rvw-bar"><span>' + (5 - i) + "</span><i><b style=\"width:" + Math.round(c / list.length * 100) + '%"></b></i><span>' + c + "</span></div>").join("") + "</div></div>" : "";
  const cards = list.length ? '<div class="rvw-list">' + list.map((r) => '<article class="rvw-card rvw-glass"><header><div><b>' + esc(r.name || "Customer") + "</b>" + stars(r.rating) + "</div><time>" + esc(String(r.createdAt || "").slice(0, 10)) + "</time></header>" + (r.text ? "<p>" + esc(r.text) + "</p>" : "") + "</article>").join("") + "</div>" : '<div class="rvw-empty">No reviews yet. Be the first to share your experience.</div>';
  box.innerHTML = hd + sum + cards;
  wire();
}
function wire() { const b = box && box.querySelector("#rvwAdd"); if (b) b.onclick = openModal; }

function closeModal() { const m = document.getElementById("rvwM"); if (m) m.remove(); }
async function openModal() {
  closeModal();
  const m = document.createElement("div"); m.className = "rvw-m"; m.id = "rvwM";
  m.innerHTML = '<div class="rvw-mc"><button type="button" class="rvw-x" aria-label="Close">&times;</button><div id="rvwBody"><p>Please wait...</p></div></div>';
  document.body.appendChild(m);
  m.addEventListener("click", (e) => { if (e.target === m || e.target.closest(".rvw-x")) closeModal(); });
  const body = m.querySelector("#rvwBody");
  await Promise.race([authP, new Promise((r) => setTimeout(r, 6000))]);
  if (!signedIn) { body.innerHTML = '<h3>Add a review</h3><p>Please log in to add a review.</p><a class="rvw-lg" href="auth.html?next=' + encodeURIComponent(location.pathname.split("/").pop() + location.search) + '">Log in</a>'; return; }
  if (done) { body.innerHTML = '<h3>Thank you!</h3><p>Your review will appear after RIVENZ approves it.</p>'; return; }
  if (!eligibleOrder) { body.innerHTML = "<h3>Add a review</h3><p>You can review a product after your order containing it has been delivered.</p>"; return; }
  body.innerHTML = '<h3>Write a review</h3><p>How was this product?</p><div class="rvw-pick" id="rvwPick">' + [1, 2, 3, 4, 5].map((i) => '<button type="button" data-v="' + i + '" aria-label="' + i + ' star">' + STAR + "</button>").join("") + '</div><textarea id="rvwText" maxlength="600" placeholder="Share your experience (optional)"></textarea><button type="button" class="rvw-go" id="rvwGo">Submit review</button><div class="rvw-note" id="rvwNote"></div>';
  let rating = 0;
  const pick = body.querySelector("#rvwPick"), note = body.querySelector("#rvwNote"), go = body.querySelector("#rvwGo");
  pick.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; rating = Number(b.dataset.v); pick.querySelectorAll("button").forEach((x) => x.classList.toggle("on", Number(x.dataset.v) <= rating)); });
  go.onclick = async () => {
    note.className = "rvw-note"; note.textContent = "";
    if (!rating) { note.className = "rvw-note err"; note.textContent = MSG.BAD_RATING; return; }
    go.disabled = true;
    try {
      const r = await window.graphicsPublicContent.api("/reviews/submit", { method: "POST", body: JSON.stringify({ orderId: eligibleOrder, productId: pid, rating, text: body.querySelector("#rvwText").value }) });
      if (r && r.ok === false) throw new Error(r.error || "FAILED");
      done = true; body.innerHTML = '<h3>Thank you!</h3><p>Your review will appear after RIVENZ approves it.</p>';
    } catch (e) {
      const code = String(e && e.message || "");
      note.className = "rvw-note err"; note.textContent = MSG[code] || "Could not submit your review. Please try again."; go.disabled = false;
    }
  };
}
let curUser = null, ordersList = null, loadedPid = "";
function refreshEligible() {
  const hit = (ordersList || []).find((o) => /deliver|complete/i.test(String(o.status || "")) && (o.items || o.products || []).some((x) => String(x.productId || x.id || "") === pid));
  eligibleOrder = hit ? hit.id : "";
}
async function findOrder(user) {
  signedIn = !!user; curUser = user; ordersList = null;
  try {
    if (user && window.graphicsOrderFlow) { await window.graphicsOrderFlow.ready; ordersList = (await window.graphicsOrderFlow.orders()) || []; }
  } catch (e) {}
  refreshEligible(); authResolve(); render();
}
function sync() {
  const p = getPid();
  if (!p) { const old = document.getElementById("rvw"); if (old) old.remove(); box = null; loadedPid = ""; return; }
  if (p !== loadedPid) {
    loadedPid = pid = p; data = null; done = false; refreshEligible();
    fetchReviews(p).then((j) => { if (pid === p) { data = j; render(); } });
  }
  const anchor = document.querySelector(".rv2-about");
  if (!anchor) return;
  let el = document.getElementById("rvw");
  if (!el || el.previousElementSibling !== anchor) {
    if (el) el.remove();
    el = document.createElement("section"); el.className = "rvw"; el.id = "rvw";
    anchor.insertAdjacentElement("afterend", el);
    box = el;
    if (cache[p] && !data) cache[p].then((j) => { if (pid === p && !data) { data = j; render(); } });
    render();
  } else if (box !== el) { box = el; render(); }
}
let raf = 0;
const queue = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; sync(); }); };
new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
["popstate", "pageshow", "hashchange"].forEach((e) => window.addEventListener(e, queue));
document.addEventListener("visibilitychange", queue);
onAuthStateChanged(getAuth(app), (u) => findOrder(u));
sync();
