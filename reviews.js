/* RIVENZ product reviews: approved reviews list + write-a-review for customers with a delivered order */
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { app } from "./firebase-config.js";
import "./order-flow.js";

const pid = new URLSearchParams(location.search).get("product");
const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const STAR = '<svg viewBox="0 0 24 24"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
const stars = (n) => '<span class="rvw-st">' + [1, 2, 3, 4, 5].map((i) => '<i class="' + (n >= i - 0.25 ? "on" : n >= i - 0.75 ? "half" : "") + '">' + STAR + "</i>").join("") + "</span>";
const API = () => (window.graphicsPublicContent && window.graphicsPublicContent.API) || "";
const MSG = { NOT_DELIVERED: "You can review a product after your order is delivered.", NOT_IN_ORDER: "This product is not in your order.", ALREADY_REVIEWED: "You have already reviewed this product.", TEXT_TOO_SHORT: "Please write a few words about the product.", BAD_RATING: "Please choose a star rating." };

const css = document.createElement("style");
css.textContent = `.rvw{margin-top:54px;font-family:Inter,system-ui,sans-serif;color:#111316}.rvw h2{font-size:22px;margin:0 0 18px;letter-spacing:-.02em}.rvw-top{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-bottom:18px}.rvw-avg{font-size:44px;font-weight:800;letter-spacing:-.03em;line-height:1}.rvw-meta small{display:block;color:#7c8087;font-size:13px;margin-top:4px}.rvw-st{display:inline-flex;gap:2px;vertical-align:middle}.rvw-st i{width:18px;height:18px;display:block}.rvw-st svg{width:100%;height:100%;fill:#dfe1e6;stroke:none}.rvw-st i.on svg{fill:#f5b301}.rvw-st i.half svg{fill:#f5b301;opacity:.55}.rvw-list{display:grid;gap:12px}.rvw-card{background:#fff;border:1px solid #e9e9e4;border-radius:16px;padding:16px 18px}.rvw-card header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;flex-wrap:wrap}.rvw-card b{font-size:14px}.rvw-card time{font-size:12px;color:#8a8f97}.rvw-card p{margin:8px 0 0;font-size:14px;line-height:1.6;color:#3d424a;white-space:pre-line;word-break:break-word}.rvw-card .rvw-st i{width:15px;height:15px}.rvw-empty{color:#7c8087;font-size:14px;padding:6px 0}.rvw-form{margin-top:18px;background:#f6f6f3;border:1px solid #e9e9e4;border-radius:18px;padding:18px}.rvw-form h3{margin:0 0 10px;font-size:15px}.rvw-pick{display:flex;gap:4px;margin-bottom:12px}.rvw-pick button{border:0;background:none;padding:2px;width:34px;height:34px;cursor:pointer}.rvw-pick svg{width:100%;height:100%;fill:#d5d8de;transition:fill .12s}.rvw-pick button.on svg{fill:#f5b301}.rvw-form textarea{width:100%;min-height:92px;border:1.5px solid #dcdde5;border-radius:12px;padding:12px 14px;font:inherit;font-size:14px;resize:vertical;box-sizing:border-box;background:#fff;outline:0}.rvw-form textarea:focus{border-color:#111}.rvw-form .rvw-go{margin-top:10px;height:46px;padding:0 24px;border:0;border-radius:12px;background:#111;color:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer}.rvw-form .rvw-go:disabled{opacity:.6}.rvw-note{margin-top:10px;font-size:13px}.rvw-note.ok{color:#16794c;font-weight:600}.rvw-note.err{color:#c0392b}`;
document.head.appendChild(css);

let box = null, data = { avg: 0, count: 0, reviews: [] }, eligibleOrder = "", done = false;

async function load() {
  try { const r = await fetch(API() + "/reviews/list?product=" + encodeURIComponent(pid)); const j = await r.json(); if (j && j.ok) data = j; } catch (e) {}
  render();
}
function render() {
  if (!box) return;
  const list = data.reviews || [];
  if (!list.length && !eligibleOrder) { box.hidden = true; return; }
  box.hidden = false;
  const top = list.length ? '<div class="rvw-top"><div class="rvw-avg">' + data.avg.toFixed(1) + '</div><div class="rvw-meta">' + stars(data.avg) + "<small>" + data.count + " review" + (data.count === 1 ? "" : "s") + "</small></div></div>" : "";
  const cards = list.length ? '<div class="rvw-list">' + list.map((r) => '<article class="rvw-card"><header><div><b>' + esc(r.name || "Customer") + "</b> " + stars(r.rating) + "</div><time>" + esc(String(r.createdAt || "").slice(0, 10)) + "</time></header><p>" + esc(r.text) + "</p></article>").join("") + "</div>" : '<div class="rvw-empty">No reviews yet.</div>';
  const form = eligibleOrder && !done ? '<div class="rvw-form"><h3>Write a review</h3><div class="rvw-pick" id="rvwPick">' + [1, 2, 3, 4, 5].map((i) => '<button type="button" data-v="' + i + '" aria-label="' + i + ' star">' + STAR + "</button>").join("") + '</div><textarea id="rvwText" maxlength="600" placeholder="Share your experience with this product"></textarea><button type="button" class="rvw-go" id="rvwGo">Submit review</button><div class="rvw-note" id="rvwNote"></div></div>' : done ? '<div class="rvw-form"><div class="rvw-note ok">Thank you! Your review will appear after RIVENZ approves it.</div></div>' : "";
  box.innerHTML = "<h2>Customer reviews</h2>" + top + cards + form;
  if (form && !done) wire();
}
function wire() {
  let rating = 0;
  const pick = box.querySelector("#rvwPick"), note = box.querySelector("#rvwNote"), go = box.querySelector("#rvwGo"), txt = box.querySelector("#rvwText");
  pick.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; rating = Number(b.dataset.v); pick.querySelectorAll("button").forEach((x) => x.classList.toggle("on", Number(x.dataset.v) <= rating)); });
  go.onclick = async () => {
    note.className = "rvw-note"; note.textContent = "";
    if (!rating) { note.className = "rvw-note err"; note.textContent = MSG.BAD_RATING; return; }
    if (txt.value.trim().length < 3) { note.className = "rvw-note err"; note.textContent = MSG.TEXT_TOO_SHORT; return; }
    go.disabled = true;
    try {
      const r = await window.graphicsPublicContent.api("/reviews/submit", { method: "POST", body: JSON.stringify({ orderId: eligibleOrder, productId: pid, rating, text: txt.value }) });
      if (r && r.ok === false) throw new Error(r.error || "FAILED");
      done = true; render();
    } catch (e) {
      const code = String(e && e.message || "");
      note.className = "rvw-note err"; note.textContent = MSG[code] || "Could not submit your review. Please try again."; go.disabled = false;
      if (code === "ALREADY_REVIEWED") { eligibleOrder = ""; setTimeout(render, 1600); }
    }
  };
}
async function findOrder(user) {
  if (!user || !window.graphicsOrderFlow) return;
  try {
    await window.graphicsOrderFlow.ready;
    const all = await window.graphicsOrderFlow.orders();
    const hit = (all || []).find((o) => /deliver|complete/i.test(String(o.status || "")) && (o.items || o.products || []).some((x) => String(x.productId || x.id || "") === pid));
    if (hit) { eligibleOrder = hit.id; render(); }
  } catch (e) {}
}
function mount() {
  const anchor = document.querySelector(".rv2-about");
  if (!anchor || document.getElementById("rvw")) return !!anchor;
  box = document.createElement("section"); box.className = "rvw"; box.id = "rvw"; box.hidden = true;
  anchor.insertAdjacentElement("afterend", box);
  load();
  onAuthStateChanged(getAuth(app), (u) => findOrder(u));
  return true;
}
if (pid) {
  if (!mount()) { const mo = new MutationObserver(() => { if (mount()) mo.disconnect(); }); mo.observe(document.body, { childList: true, subtree: true }); }
}
