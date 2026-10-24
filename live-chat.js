// RIVENZ — floating Live chat (opens on the current page). Loaded by user-nav.js on every page.
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { collection, doc, getDoc, onSnapshot, query, orderBy, addDoc, setDoc, deleteDoc, writeBatch, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { app, db } from "./firebase-config.js";

const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
if (file === "chat.html" || file === "auth.html") { /* full chat page / login: no floating chat */ } else init();

function init() {
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "Rs. " + Number(n || 0).toLocaleString("en-LK");
  const ms = (v) => (v?.toMillis ? v.toMillis() : typeof v === "number" ? v : 0);
  const when = (t) => (t ? new Date(t).toLocaleString("en-LK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
  const IC = (p, c = "") => `<svg class="lc-i ${c}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const CHAT = '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>', BAGP = '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>';
  const TRASH = '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>';

  const css = document.createElement("style");
  css.textContent = `[class*="lc-"],[class*="lc-"] *,[class*="lc-"] *:before,[class*="lc-"] *:after{box-sizing:border-box}

.lc-fab{position:fixed;right:18px;bottom:18px;z-index:1200;display:inline-flex;align-items:center;gap:10px;height:52px;padding:0 22px;border:0;border-radius:999px;background:rgba(24,26,30,.5);-webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6);border:1px solid rgba(255,255,255,.3);color:#fff;font:600 15px Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 14px 34px -10px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.3);transition:transform .3s cubic-bezier(.22,1,.36,1),opacity .25s}.lc-fab.away{transform:translateY(90px);opacity:0;pointer-events:none}
.lc-fab:hover{transform:translateY(-2px)}.lc-fab.hide{opacity:0;pointer-events:none;transform:scale(.9)}
.lc-i{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex:none}
.lc-badge{position:absolute;top:-4px;right:-2px;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#e5322d;color:#fff;font-size:11px;font-weight:800;display:grid;place-items:center}
.lc-badge[hidden]{display:none}
.lc-bd{position:fixed;inset:0;z-index:1290;background:rgba(0,0,0,.35);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;visibility:hidden;transition:.25s}
.lc-p{position:fixed;z-index:1300;right:18px;bottom:18px;width:390px;height:min(640px,calc(100dvh - 36px));display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(255,255,255,.84),rgba(244,244,242,.76));-webkit-backdrop-filter:blur(44px) saturate(1.8);backdrop-filter:blur(44px) saturate(1.8);border:1px solid rgba(255,255,255,.65);border-radius:30px;box-shadow:0 40px 90px -20px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.8);font-family:Inter,system-ui,sans-serif;color:#111316;opacity:0;visibility:hidden;transform:translateY(24px) scale(.97);transform-origin:bottom right;transition:opacity .25s,transform .35s cubic-bezier(.22,1,.36,1),visibility .25s;overflow:hidden}
.lc-p.open{opacity:1;visibility:visible;transform:none}
.lc-h{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:18px 18px 8px}
.lc-chip{display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 20px;border-radius:999px;background:#2a2c30;color:#fff;font-weight:700;font-size:14px;text-decoration:none;border:0;cursor:default}
a.lc-chip{cursor:pointer}
.lc-x{width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.8);background:rgba(255,255,255,.6);display:grid;place-items:center;cursor:pointer;color:#111316;padding:0}
.lc-m{flex:1;overflow-y:auto;padding:6px 20px 8px;display:flex;flex-direction:column;gap:10px;min-height:0}
.lc-hello{margin:auto 0;padding:18px 4px 10px}
.lc-hello h3{margin:0 0 10px;font-size:26px;color:#8e9095;font-weight:700}.lc-hello p{margin:0;font-size:15px;line-height:1.55;font-weight:500}
.lc-b{max-width:84%;display:flex;flex-direction:column;gap:3px}.lc-b.user{align-self:flex-end;align-items:flex-end}.lc-b.admin{align-self:flex-start}
.lc-bub{padding:11px 15px;border-radius:20px;font-size:14px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
.lc-b.user .lc-bub{background:#111316;color:#fff;border-bottom-right-radius:6px}.lc-b.admin .lc-bub{background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.8);border-bottom-left-radius:6px}
.lc-b small{font-size:10.5px;color:#9a9da1;display:flex;align-items:center;gap:6px}
.lc-del{border:0;background:none;color:#9a9da1;cursor:pointer;padding:0;display:grid}.lc-del .lc-i{width:13px;height:13px}
.lc-ref{display:flex;align-items:center;gap:10px;padding:8px;margin:-4px -6px 8px;border-radius:14px;background:rgba(127,127,127,.14);color:inherit;text-decoration:none;font-size:12px}
.lc-ri{width:38px;height:38px;border-radius:10px;background:#ececE8;display:grid;place-items:center;overflow:hidden;flex:none;color:#555}.lc-ri img{width:100%;height:100%;object-fit:cover}
.lc-ref b{display:block;font-size:12.5px}
.lc-foot{padding:6px 18px 0;font-size:11px;color:#9a9da1;line-height:1.5;text-align:left}
.lc-qs{display:flex;gap:8px;overflow-x:auto;padding:10px 18px 4px;scrollbar-width:none}.lc-qs::-webkit-scrollbar{display:none}
.lc-q{flex:none;border:1px solid rgba(255,255,255,.8);background:rgba(255,255,255,.6);border-radius:999px;padding:10px 16px;font:600 13.5px inherit;cursor:pointer;color:#111316;font-family:inherit}
.lc-pick{padding:6px 18px 0}.lc-pick[hidden]{display:none}
.lc-pc{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e9e9e4;border-radius:16px;padding:8px 10px;font-size:12px}.lc-pc b{display:block;font-size:12.5px}.lc-pc>div{flex:1;min-width:0}
.lc-pc button{border:0;background:#f3f3f0;border-radius:50%;width:26px;height:26px;display:grid;place-items:center;cursor:pointer;padding:0}.lc-pc button .lc-i{width:13px;height:13px}
.lc-in{display:flex;align-items:flex-end;gap:8px;margin:10px 14px 14px;padding:6px;border:1px solid rgba(255,255,255,.8);border-radius:28px;background:rgba(255,255,255,.62);box-shadow:0 6px 20px -10px rgba(0,0,0,.25)}
.lc-in textarea{flex:1;border:0;outline:0;resize:none;font:500 15px Inter,system-ui,sans-serif;padding:11px 6px 11px 12px;max-height:110px;background:transparent;min-width:0}
.lc-round{width:42px;height:42px;border-radius:50%;border:0;background:#f1f1ee;display:grid;place-items:center;cursor:pointer;flex:none;color:#111316;padding:0}
.lc-round.go{background:#111316;color:#fff}.lc-round:disabled{opacity:.5}
.lc-login{margin:auto 0;text-align:center;padding:20px}.lc-login h3{margin:0 0 8px;font-size:24px}.lc-login p{margin:0 0 18px;color:#7c8087;font-size:14px;line-height:1.6}
.lc-login a{display:inline-flex;height:48px;align-items:center;padding:0 28px;border-radius:999px;background:#111316;color:#fff;font-weight:700;text-decoration:none;font-size:14px}
.lc-sh{position:absolute;inset:0;background:rgba(0,0,0,.35);display:none;align-items:flex-end;z-index:5}.lc-sh.open{display:flex}
.lc-sc{width:100%;max-height:78%;background:#fff;border-radius:26px 26px 0 0;padding:16px;display:flex;flex-direction:column;gap:10px}
.lc-tabs{display:flex;gap:6px}.lc-tab{flex:1;border:1px solid #e3e3df;background:#fff;border-radius:999px;height:38px;font:700 13px Inter,sans-serif;cursor:pointer}.lc-tab.on{background:#111316;color:#fff;border-color:#111316}
.lc-sc input{border:1px solid #e3e3df;border-radius:14px;padding:11px 14px;font:inherit;font-size:14px;outline:0}
.lc-list{overflow-y:auto;display:flex;flex-direction:column;gap:6px}
.lc-it{display:flex;align-items:center;gap:10px;border:1px solid #eee;background:#fff;border-radius:14px;padding:8px;text-align:left;cursor:pointer;font:inherit;font-size:12px;color:#7c8087}.lc-it b{display:block;color:#111316;font-size:13px}
.lc-empty{text-align:center;color:#8e9095;font-size:13.5px;padding:22px 10px}
@media(max-width:600px){
  .lc-p{right:0;left:0;bottom:0;width:100%;height:84dvh;border-radius:30px 30px 0 0;transform:translateY(100%)}
  .lc-p.open{transform:none}.lc-bd.open{opacity:1;visibility:visible}
  .lc-fab{right:14px;bottom:calc(14px + env(safe-area-inset-bottom));height:52px;width:52px;padding:0;justify-content:center}.lc-fab span:not(.lc-badge){display:none}
}
@media(min-width:601px){.lc-bd{display:none}}
@media(prefers-reduced-motion:reduce){.lc-p,.lc-fab{transition:none}}`;
  document.head.appendChild(css);

  const root = document.createElement("div");
  root.innerHTML = `<button type="button" class="lc-fab" id="lcFab" aria-label="Open live chat">${IC(CHAT)}<span>Live chat</span><em class="lc-badge" id="lcBadge" hidden>0</em></button>
<div class="lc-bd" id="lcBd"></div>
<section class="lc-p" id="lcP" role="dialog" aria-label="Live chat" aria-hidden="true">
  <div class="lc-h"><span id="lcWho" class="lc-chip">Live chat</span><button type="button" class="lc-x" id="lcX" aria-label="Minimize chat">${IC('<path d="M6 12h12"/>')}</button></div>
  <div class="lc-m" id="lcM"></div>
  <div class="lc-foot" id="lcFoot">Chat with RIVENZ about products, sizes, delivery or your orders.</div>
  <div class="lc-qs" id="lcQs"><button type="button" class="lc-q" data-q="Track my order">Track my order</button><button type="button" class="lc-q" data-q="I have a question about a product">Ask about a product</button><button type="button" class="lc-q" data-q="Delivery information">Delivery help</button></div>
  <div class="lc-pick" id="lcPick" hidden></div>
  <div class="lc-in" id="lcIn"><button type="button" class="lc-round" id="lcPlus" aria-label="Attach product or order">${IC('<path d="M12 5v14M5 12h14"/>')}</button><textarea id="lcT" rows="1" placeholder="Ask anything..." aria-label="Message"></textarea><button type="button" class="lc-round go" id="lcSend" aria-label="Send">${IC('<path d="M12 19V5M6 11l6-6 6 6"/>')}</button></div>
  <div class="lc-sh" id="lcSh"><div class="lc-sc"><div class="lc-tabs"><button type="button" class="lc-tab on" data-t="product">Products</button><button type="button" class="lc-tab" data-t="order">My orders</button><button type="button" class="lc-x" id="lcShX" style="width:38px;height:38px" aria-label="Close">${IC('<path d="M6 6l12 12M18 6 6 18"/>')}</button></div><input id="lcSQ" placeholder="Search"><div class="lc-list" id="lcL"></div></div></div>
</section>`;
  document.documentElement.appendChild(root);
  const $ = (i) => document.getElementById(i);
  let user = null, profile = {}, msgs = [], picked = null, tab = "product", products = null, orders = null, isOpen = false, unsub = null;

  const refHtml = (r) => {
    if (!r) return "";
    const img = r.image ? `<img src="${esc(r.image)}" alt="">` : IC(BAGP);
    if (r.type === "order") return `<a class="lc-ref" href="order-details.html?id=${encodeURIComponent(r.id)}"><span class="lc-ri">${IC(BAGP)}</span><span><b>Order ${esc(r.id)}</b>${esc(r.status || "")}${r.total ? " · " + money(r.total) : ""}</span></a>`;
    return `<span class="lc-ref"><span class="lc-ri">${img}</span><span><b>${esc(r.name || "Product")}</b>${r.price ? money(r.price) : ""}</span></span>`;
  };
  function paint() {
    const m = $("lcM");
    const login = !user;
    $("lcIn").style.display = $("lcQs").style.display = login ? "none" : "";
    $("lcWho").textContent = user ? (profile.name || user.displayName || "Live chat") : "Live chat";
    if (login) { m.innerHTML = `<div class="lc-login"><h3>Hi there!</h3><p>Please sign in to chat with RIVENZ about products, sizes and your orders.</p><a href="auth.html?next=${encodeURIComponent(file)}">Sign in</a></div>`; return; }
    m.innerHTML = msgs.length ? msgs.map((x) => { const mine = x.sender === "user", can = mine && x.seenByAdmin !== true;
      return `<div class="lc-b ${mine ? "user" : "admin"}"><div class="lc-bub">${refHtml(x.ref)}${esc(x.text || "")}</div><small>${esc(when(ms(x.createdAt)))}${mine && x.seenByAdmin ? " · Seen" : ""}${can ? `<button type="button" class="lc-del" data-del="${esc(x.id)}" aria-label="Delete message">${IC(TRASH)}</button>` : ""}</small></div>`; }).join("")
      : `<div class="lc-hello"><h3>Hi there!</h3><p>You can ask questions about shopping, sizing, delivery, or your order status.</p></div>`;
    m.scrollTop = m.scrollHeight;
  }
  function paintPick() {
    const p = $("lcPick"); p.hidden = !picked; if (!picked) return;
    const img = picked.image ? `<img src="${esc(picked.image)}" alt="">` : IC(BAGP);
    p.innerHTML = `<div class="lc-pc"><span class="lc-ri">${img}</span><div><b>${picked.type === "order" ? "Order " + esc(picked.id) : esc(picked.name)}</b>${picked.type === "order" ? esc(picked.status || "") : picked.price ? money(picked.price) : ""}</div><button type="button" id="lcPX" aria-label="Remove">${IC('<path d="M6 6l12 12M18 6 6 18"/>')}</button></div>`;
  }
  function badge(n) { const b = $("lcBadge"); b.textContent = n > 99 ? "99+" : n; b.hidden = !n; }
  function open() {
    isOpen = true; $("lcP").classList.add("open"); $("lcP").setAttribute("aria-hidden", "false"); $("lcBd").classList.add("open"); $("lcFab").classList.add("hide");
    if (window.innerWidth <= 600) document.documentElement.style.overflow = "hidden";
    badge(0); paint(); markSeen();
  }
  function close() { isOpen = false; $("lcP").classList.remove("open"); $("lcP").setAttribute("aria-hidden", "true"); $("lcBd").classList.remove("open"); $("lcFab").classList.remove("hide"); document.documentElement.style.overflow = ""; }
  let unseenDocs = [];
  function markSeen() {
    if (!user || !unseenDocs.length) return;
    const b = writeBatch(db); unseenDocs.forEach((d) => b.update(d.ref, { seenByUser: true })); b.commit().catch(() => {});
    setDoc(doc(db, "chats", user.uid), { unreadUser: 0 }, { merge: true }).catch(() => {}); unseenDocs = [];
  }
  async function send() {
    const t = $("lcT"), text = t.value.trim();
    if ((!text && !picked) || !user) return;
    $("lcSend").disabled = true;
    const ref = picked; t.value = ""; picked = null; paintPick(); t.style.height = "auto";
    try {
      const data = { sender: "user", text, createdAt: serverTimestamp(), seenByAdmin: false, seenByUser: true };
      if (ref) data.ref = ref;
      await addDoc(collection(db, "chats", user.uid, "messages"), data);
      await setDoc(doc(db, "chats", user.uid), { uid: user.uid, name: profile.name || user.displayName || "", email: profile.email || user.email || "", lastMessage: text || (ref?.type === "order" ? "Order " + ref.id : ref?.name || "Shared an item"), lastAt: serverTimestamp(), lastSender: "user", unreadAdmin: increment(1) }, { merge: true });
    } catch (e) { console.error(e); t.value = text; picked = ref; paintPick(); alert("Could not send your message. Please try again."); }
    $("lcSend").disabled = false;
  }
  const pimg = (p) => p.images?.[0]?.url || p.image?.url || (typeof p.image === "string" ? p.image : "");
  async function loadSheet() {
    const list = $("lcL"), q = $("lcSQ").value.trim().toLowerCase(); list.innerHTML = '<div class="lc-empty">Loading…</div>';
    try {
      if (tab === "product") {
        if (!products) products = await window.graphicsPublicContent.catalog("products");
        const rows = products.filter((p) => p.active !== false && (!q || String(p.name || "").toLowerCase().includes(q)));
        list.innerHTML = rows.length ? rows.map((p, i) => `<button type="button" class="lc-it" data-p="${i}"><span class="lc-ri">${pimg(p) ? `<img src="${esc(pimg(p))}" alt="">` : IC(BAGP)}</span><span><b>${esc(p.name)}</b>${money(p.offer || p.price)}</span></button>`).join("") : '<div class="lc-empty">No products found.</div>';
        list.querySelectorAll("[data-p]").forEach((b) => b.onclick = () => { const p = rows[b.dataset.p]; picked = { type: "product", id: String(p.id), name: p.name, price: p.offer || p.price || 0, image: pimg(p) }; $("lcSh").classList.remove("open"); paintPick(); });
      } else {
        if (!orders) { const f = window.graphicsOrderFlow; if (!f) { await import("./order-flow.js"); } await window.graphicsOrderFlow.ready; orders = await window.graphicsOrderFlow.orders(); }
        const rows = orders.filter((o) => !q || String(o.id).toLowerCase().includes(q));
        list.innerHTML = rows.length ? rows.map((o, i) => `<button type="button" class="lc-it" data-o="${i}"><span class="lc-ri">${IC(BAGP)}</span><span><b>${esc(o.id)}</b>${esc(o.status || "")} · ${money(o.total)}</span></button>`).join("") : '<div class="lc-empty">You have no orders yet.</div>';
        list.querySelectorAll("[data-o]").forEach((b) => b.onclick = () => { const o = rows[b.dataset.o]; picked = { type: "order", id: o.id, status: o.status || "", total: Number(o.total || 0) }; $("lcSh").classList.remove("open"); paintPick(); });
      }
    } catch (e) { console.warn(e); list.innerHTML = '<div class="lc-empty">Could not load the list.</div>'; }
  }

  let lastY = scrollY;
  addEventListener("scroll", () => { const y = scrollY; $("lcFab").classList.toggle("away", y > lastY + 6 && y > 120 && !isOpen); if (y < lastY - 6 || y < 120) $("lcFab").classList.remove("away"); lastY = y; }, { passive: true });
  $("lcFab").onclick = open; $("lcX").onclick = close; $("lcBd").onclick = close;
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) close(); });
  // every "Chat" link in the site opens the live chat instead of a new page
  document.addEventListener("click", (e) => { const a = e.target.closest('a[href="chat.html"]'); if (!a) return; e.preventDefault(); document.getElementById("rvzMob")?.classList.remove("open"); document.getElementById("rvzBd")?.classList.remove("open"); document.documentElement.style.overflow = ""; open(); }, true);
  $("lcSend").onclick = send;
  $("lcT").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });
  $("lcT").addEventListener("input", (e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(110, e.target.scrollHeight) + "px"; });
  $("lcQs").onclick = (e) => { const b = e.target.closest("[data-q]"); if (b) { $("lcT").value = b.dataset.q; } };
  $("lcPlus").onclick = () => { $("lcSh").classList.add("open"); $("lcSQ").value = ""; loadSheet(); };
  $("lcShX").onclick = () => $("lcSh").classList.remove("open");
  $("lcSQ").oninput = loadSheet;
  $("lcSh").querySelectorAll(".lc-tab").forEach((b) => b.onclick = () => { tab = b.dataset.t; $("lcSh").querySelectorAll(".lc-tab").forEach((x) => x.classList.toggle("on", x === b)); loadSheet(); });
  $("lcPick").onclick = (e) => { if (e.target.closest("#lcPX")) { picked = null; paintPick(); } };
  $("lcM").onclick = async (e) => { const d = e.target.closest("[data-del]"); if (!d || !confirm("Delete this message?")) return; try { await deleteDoc(doc(db, "chats", user.uid, "messages", d.dataset.del)); } catch (err) { alert("This message was already seen, so it can no longer be deleted."); } };

  paint();
  onAuthStateChanged(getAuth(app), async (u) => {
    if (unsub) { unsub(); unsub = null; } user = u || null; msgs = []; profile = {}; badge(0);
    if (!u) { paint(); return; }
    try { const s = await getDoc(doc(db, "clients", u.uid)); profile = s.exists() ? s.data() : {}; } catch (_) {}
    unsub = onSnapshot(query(collection(db, "chats", u.uid, "messages"), orderBy("createdAt")), (snap) => {
      msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      unseenDocs = snap.docs.filter((d) => d.data().sender === "admin" && d.data().seenByUser !== true && !d.metadata.hasPendingWrites);
      paint();
      if (isOpen) markSeen(); else badge(unseenDocs.length);
    }, () => { $("lcM").innerHTML = '<div class="lc-empty">Chat is temporarily unavailable.</div>'; });
  });
}
