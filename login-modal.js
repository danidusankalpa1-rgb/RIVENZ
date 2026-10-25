// RIVENZ — glass login popup (replaces the old login page). Opens on the current page.
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { app, db } from "./firebase-config.js";

const auth = getAuth(app);
const qs = new URLSearchParams(location.search);
let nextUrl = qs.get("next") || "";
const IC = (p) => `<svg class="lm-i" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const EYE = '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>';

const css = document.createElement("style");
css.textContent = `.lm-bd,.lm-bd *,.lm-bd *:before,.lm-bd *:after{box-sizing:border-box}
.lm-in{animation:lmIn .34s cubic-bezier(.22,1,.36,1) both}@keyframes lmIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}.lm{overflow:hidden auto}.lm-or{display:flex;align-items:center;gap:12px;margin:16px 0 12px;color:rgba(255,255,255,.55);font-size:12px}.lm-or:before,.lm-or:after{content:"";flex:1;height:1px;background:rgba(255,255,255,.18)}.lm-gb{width:100%;height:50px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.1);color:#fff;font:700 14px Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer}.lm-gb:disabled{opacity:.6}

.lm-bd{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.72);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s;font-family:Inter,system-ui,sans-serif}
.lm-bd.open{opacity:1;visibility:visible}
.lm{position:relative;width:min(410px,100%);max-height:calc(100dvh - 36px);overflow:auto;padding:30px 26px 26px;border-radius:30px;color:#fff;background:#0c0d10;border:1px solid #23262c;box-shadow:0 20px 50px -20px rgba(0,0,0,.7);transform:translateY(24px) scale(.97);transition:transform .35s cubic-bezier(.22,1,.36,1)}
.lm-bd.open .lm{transform:none}
.lm-x{position:absolute;right:14px;top:14px;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;display:grid;place-items:center;cursor:pointer;padding:0}
.lm-i{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex:none}
.lm-logo{display:block;height:22px;margin:0 0 20px;filter:brightness(0) invert(1)}
.lm h2{margin:0;font-size:26px;letter-spacing:-.02em}.lm p.sub{margin:8px 0 20px;color:rgba(255,255,255,.7);font-size:14px;line-height:1.55}
.lm-tabs{display:flex;gap:4px;padding:4px;margin:0 0 20px;border-radius:999px;background:#16181d}
.lm-tabs button{flex:1;height:38px;border:0;border-radius:999px;background:transparent;color:rgba(255,255,255,.7);font:700 13px inherit;font-family:inherit;cursor:pointer;transition:.2s}
.lm-tabs button.on{background:#fff;color:#111316}
.lm form{display:grid;gap:12px}.lm form[hidden]{display:none}
.lm-f{position:relative}.lm-f input{width:100%;height:52px;padding:0 16px;border-radius:16px;border:1px solid #2a2d34;background:#16181d;color:#fff;font:500 15px Inter,system-ui,sans-serif;outline:0;transition:border-color .2s,background .2s}
.lm-f input::placeholder{color:rgba(255,255,255,.5)}.lm-f input:focus{border-color:#fff;background:#1b1e24}
.lm-f .eye{position:absolute;right:8px;top:8px;width:36px;height:36px;border:0;background:none;color:rgba(255,255,255,.75);cursor:pointer;display:grid;place-items:center;padding:0}
.lm-go{height:52px;border:0;border-radius:999px;background:#fff;color:#111316;font:800 14px Inter,system-ui,sans-serif;cursor:pointer;margin-top:4px;transition:transform .2s}.lm-go:hover{transform:translateY(-1px)}.lm-go:disabled{opacity:.6;cursor:default}
.lm-link{border:0;background:none;color:rgba(255,255,255,.8);font:600 13px Inter,system-ui,sans-serif;cursor:pointer;padding:6px 0;text-decoration:underline;text-underline-offset:3px;justify-self:center}
.lm-msg{min-height:0;font-size:13px;line-height:1.5;border-radius:14px;padding:0}.lm-msg.err,.lm-msg.ok{padding:10px 14px}
.lm-msg.err{background:rgba(255,90,90,.18);color:#ffc9c9;border:1px solid rgba(255,120,120,.35)}.lm-msg.ok{background:rgba(70,220,150,.16);color:#bff5dc;border:1px solid rgba(90,230,170,.35)}
.lm-row{display:flex;justify-content:flex-end;margin-top:-4px}
@media(max-width:600px){.lm-bd{align-items:flex-end;padding:0}.lm{width:100%;border-radius:30px 30px 0 0;padding-bottom:30px;transform:translateY(100%)}}
@media(prefers-reduced-motion:reduce){.lm,.lm-bd{transition:none}}`;
document.head.appendChild(css);

const root = document.createElement("div");
root.className = "lm-bd"; root.id = "lmBd";
root.innerHTML = `<section class="lm" role="dialog" aria-modal="true" aria-label="Sign in">
<button type="button" class="lm-x" id="lmX" aria-label="Close">${IC('<path d="M6 6l12 12M18 6 6 18"/>')}</button>
<img class="lm-logo" src="logo.png" alt="RIVENZ">
<div id="lmHead"><h2 id="lmT">Welcome back</h2><p class="sub" id="lmS">Sign in to track orders, chat with us and check out faster.</p></div>
<div class="lm-tabs" id="lmTabs"><button type="button" data-m="login" class="on">Sign in</button><button type="button" data-m="register">Create account</button></div>
<div class="lm-msg" id="lmMsg" role="alert"></div>
<form id="lmLogin" novalidate>
  <div class="lm-f"><input id="lmLE" type="email" placeholder="Email address" autocomplete="email" inputmode="email"></div>
  <div class="lm-f"><input id="lmLP" type="password" placeholder="Password" autocomplete="current-password"><button type="button" class="eye" data-eye="lmLP" aria-label="Show password">${IC(EYE)}</button></div>
  <div class="lm-row"><button type="button" class="lm-link" data-m="forgot">Forgot password?</button></div>
  <button class="lm-go" type="submit">Sign in</button>
</form>
<form id="lmReg" novalidate hidden>
  <div class="lm-f"><input id="lmRN" type="text" placeholder="Full name" autocomplete="name"></div>
  <div class="lm-f"><input id="lmRPh" type="tel" placeholder="Phone number" autocomplete="tel" inputmode="tel"></div>
  <div class="lm-f"><input id="lmRE" type="email" placeholder="Email address" autocomplete="email" inputmode="email"></div>
  <div class="lm-f"><input id="lmRP" type="password" placeholder="Password (min 6 characters)" autocomplete="new-password"><button type="button" class="eye" data-eye="lmRP" aria-label="Show password">${IC(EYE)}</button></div>
  <button class="lm-go" type="submit">Create account</button>
</form>
<div id="lmGoogle"><div class="lm-or"><span>or</span></div><button type="button" class="lm-gb" id="lmGBtn"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 0 1 0-12.4c1.97 0 3.3.84 4.05 1.56l2.76-2.66A9.9 9.9 0 0 0 12 2a10 10 0 1 0 0 20c5.77 0 9.6-4.05 9.6-9.76 0-.65-.07-1.15-.16-1.64z"/></svg>Continue with Google</button></div>
<form id="lmForgot" novalidate hidden>
  <div class="lm-f"><input id="lmFE" type="email" placeholder="Your account email" autocomplete="email" inputmode="email"></div>
  <button class="lm-go" type="submit">Send reset link</button>
  <button type="button" class="lm-link" data-m="login">Back to sign in</button>
</form>
</section>`;
document.documentElement.appendChild(root);
const $ = (id) => document.getElementById(id);
const COPY = { login: ["Welcome back", "Sign in to track orders, chat with us and check out faster."], register: ["Join RIVENZ", "Create your account in a minute."], forgot: ["Reset your password", "Enter your email and we will send you a link to choose a new password."] };

function msg(type, text) { const m = $("lmMsg"); m.className = "lm-msg" + (text ? " " + type : ""); m.textContent = text || ""; }
let curMode = "";
function mode(m) {
  const lm = root.querySelector(".lm"), animate = root.classList.contains("open") && curMode && curMode !== m;
  const h0 = animate ? lm.offsetHeight : 0;
  msg("", "");
  $("lmLogin").hidden = m !== "login"; $("lmReg").hidden = m !== "register"; $("lmForgot").hidden = m !== "forgot"; $("lmGoogle").hidden = m === "forgot";
  $("lmTabs").style.display = m === "forgot" ? "none" : "";
  $("lmTabs").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.m === m));
  $("lmT").textContent = COPY[m][0]; $("lmS").textContent = COPY[m][1];
  if (animate) {
    const f = $(m === "login" ? "lmLogin" : m === "register" ? "lmReg" : "lmForgot");
    [f, $("lmHead")].forEach((el) => { el.classList.remove("lm-in"); void el.offsetWidth; el.classList.add("lm-in"); });
    lm.style.height = "auto"; const h1 = lm.offsetHeight;
    if (h0 && h1 !== h0) {
      lm.style.height = h0 + "px"; void lm.offsetHeight;
      lm.style.transition = "height .32s cubic-bezier(.22,1,.36,1), transform .35s cubic-bezier(.22,1,.36,1)"; lm.style.height = h1 + "px";
      clearTimeout(lm._t); lm._t = setTimeout(() => { lm.style.height = ""; lm.style.transition = ""; }, 360);
    } else lm.style.height = "";
  }
  curMode = m;
}
function open(opts = {}) {
  if (auth.currentUser) return;
  if (opts.next !== undefined) nextUrl = opts.next || "";
  mode(opts.mode || "login");
  root.classList.add("open"); document.documentElement.style.overflow = "hidden";
}
function close() { root.classList.remove("open"); document.documentElement.style.overflow = ""; }
function done() {
  close();
  if (nextUrl) { const u = nextUrl; nextUrl = ""; location.href = u; return; }
  const u = new URL(location.href); if (u.searchParams.has("login")) { u.searchParams.delete("login"); u.searchParams.delete("next"); history.replaceState({}, "", u); }
}
const errText = (e) => ({
  "auth/invalid-credential": "Incorrect email or password.", "auth/wrong-password": "Incorrect email or password.", "auth/user-not-found": "No account found with this email.",
  "auth/invalid-email": "Please enter a valid email address.", "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/email-already-in-use": "An account already exists with this email. Please sign in.", "auth/weak-password": "Password is too weak. Use at least 6 characters.",
  "auth/network-request-failed": "No internet connection. Please try again.", "auth/operation-not-allowed": "Email sign-in is not enabled. Please contact RIVENZ.", "auth/quota-exceeded": "Too many emails sent today. Please try again later.", "auth/user-disabled": "This account has been disabled. Please contact RIVENZ."
}[e?.code] || "Something went wrong. Please try again.");
async function busy(btn, label, fn) { const t = btn.textContent; btn.disabled = true; btn.textContent = label; try { await fn(); } finally { btn.disabled = false; btn.textContent = t; } }

$("lmX").onclick = close;
root.addEventListener("click", (e) => { if (e.target === root) close(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("open")) close(); });
root.addEventListener("click", (e) => {
  const m = e.target.closest("[data-m]"); if (m) { mode(m.dataset.m); return; }
  const eye = e.target.closest("[data-eye]"); if (eye) { const i = $(eye.dataset.eye); i.type = i.type === "password" ? "text" : "password"; }
});

$("lmLogin").addEventListener("submit", async (e) => {
  e.preventDefault(); const email = $("lmLE").value.trim().toLowerCase(), pw = $("lmLP").value;
  if (!email || !pw) return msg("err", "Enter your email and password.");
  await busy(e.submitter || e.target.querySelector(".lm-go"), "Signing in...", async () => {
    try {
      const cr = await signInWithEmailAndPassword(auth, email, pw), u = cr.user;
      try { const ref = doc(db, "clients", u.uid); const s = await getDoc(ref); if (!s.exists()) await setDoc(ref, { uid: u.uid, name: u.displayName || "", phone: "", email: u.email || email, createdAt: serverTimestamp(), accountStatus: "active" }, { merge: true }); } catch (_) {}
      try { localStorage.setItem("graphicsClientEmail", email); if (u.displayName) localStorage.setItem("graphicsClientName", u.displayName); } catch (_) {}
      done();
    } catch (er) { console.warn(er); msg("err", errText(er)); }
  });
});
const RV={name(v){v=String(v||'').trim().replace(/\s+/g,' ');if(v.length<2||v.length>60||!/^[\p{L}\p{M}][\p{L}\p{M}\s.'\-]*$/u.test(v)||(v.match(/\p{L}/gu)||[]).length<2||/(.)\1{3,}/u.test(v))return'Please enter your real name (letters only).';return''},
phone(v,opt){v=String(v||'').trim();if(!v)return opt?'':'Please enter your phone number.';var d=v.replace(/[\s\-()]/g,'');if(!/^(\+94|0094|94|0)?\d{9}$/.test(d)||/[^\d+]/.test(d))return'Enter a valid Sri Lankan number, e.g. 0771234567.';var n=d.replace(/^(\+94|0094|94|0)/,'');if(!/^[1-9]\d{8}$/.test(n)||/^(\d)\1{7,}$/.test(n.slice(1))||/^(01234567|12345678|23456789|87654321|98765432)$/.test(n.slice(1)))return'Enter a valid Sri Lankan number, e.g. 0771234567.';return''},
email(v){v=String(v||'').trim().toLowerCase();if(!/^[a-z0-9._%+\-]{2,64}@[a-z0-9\-]+(\.[a-z0-9\-]+)*\.[a-z]{2,}$/.test(v)||/\.\./.test(v)||/^(test|asd|abc|xxx|qwe|fake|aaa+)\d*@/.test(v)||/@(example|test|mailinator|yopmail|tempmail|temp-mail|guerrillamail|10minutemail|trashmail|sharklasers|fake|asd|xyz123)\./.test(v))return'Please enter a real email address.';return''},
postal(v){v=String(v||'').trim();return !v||/^\d{5}$/.test(v)?'':'Postal code must be 5 digits.'},
text(v,label,min){v=String(v||'').trim();return v.length<(min||3)||!/\p{L}/u.test(v)||/(.)\1{4,}/u.test(v)?'Please enter a valid '+label+'.':''}};

$("lmReg").addEventListener("submit", async (e) => {
  e.preventDefault(); const name = $("lmRN").value.trim(), phone = $("lmRPh").value.trim(), email = $("lmRE").value.trim().toLowerCase(), pw = $("lmRP").value;
  if (!name || !phone || !email || !pw) return msg("err", "Please complete all fields.");
  { const er = RV.name(name) || RV.phone(phone) || RV.email(email); if (er) return msg("err", er); }
  if (pw.length < 6) return msg("err", "Password must contain at least 6 characters.");
  await busy(e.target.querySelector(".lm-go"), "Creating account...", async () => {
    try {
      const cr = await createUserWithEmailAndPassword(auth, email, pw), u = cr.user;
      await updateProfile(u, { displayName: name });
      try { await setDoc(doc(db, "clients", u.uid), { uid: u.uid, name, phone, email, createdAt: serverTimestamp(), accountStatus: "active" }, { merge: true }); } catch (pe) { console.warn("profile save failed", pe); }
      try { localStorage.setItem("graphicsClientName", name); localStorage.setItem("graphicsClientEmail", email); localStorage.setItem("graphicsClientPhone", phone); localStorage.setItem("graphicsClientRegistered", "1"); } catch (_) {}
      done();
    } catch (er) { console.warn(er); msg("err", errText(er)); }
  });
});
$("lmGBtn").addEventListener("click", async (e) => {
  const b = e.currentTarget; b.disabled = true;
  try {
    const u = (await signInWithPopup(auth, new GoogleAuthProvider())).user;
    try { const ref = doc(db, "clients", u.uid); const s = await getDoc(ref); if (!s.exists()) await setDoc(ref, { uid: u.uid, name: u.displayName || "", phone: "", email: u.email || "", createdAt: serverTimestamp(), accountStatus: "active" }, { merge: true }); } catch (_) {}
    try { localStorage.setItem("graphicsClientEmail", u.email || ""); if (u.displayName) localStorage.setItem("graphicsClientName", u.displayName); } catch (_) {}
    done();
  } catch (er) {
    console.warn(er);
    if (["auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(er?.code)) { /* closed */ }
    else msg("err", er?.code === "auth/unauthorized-domain" ? "This website is not authorized for Google sign-in yet." : er?.code === "auth/operation-not-allowed" ? "Google sign-in is not enabled yet." : er?.code === "auth/popup-blocked" ? "Please allow pop-ups and try again." : errText(er));
  }
  b.disabled = false;
});
$("lmForgot").addEventListener("submit", async (e) => {
  e.preventDefault(); const email = $("lmFE").value.trim().toLowerCase() || $("lmLE").value.trim().toLowerCase();
  if (!email) return msg("err", "Enter the email address of your account.");
  await busy(e.target.querySelector(".lm-go"), "Sending...", async () => {
    try { try { await sendPasswordResetEmail(auth, email, { url: location.origin + "/index.html?login=1" }); } catch (e1) { if (/continue-uri/.test(e1?.code || "")) await sendPasswordResetEmail(auth, email); else throw e1; } msg("ok", "Reset link sent. Please check your email inbox (and spam folder)."); }
    catch (er) { console.warn(er); msg("err", er?.code === "auth/user-not-found" ? "No account found with this email." : errText(er)); }
  });
});

// every old "login page" link opens the popup instead
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="auth.html"]'); if (!a) return;
  e.preventDefault(); document.getElementById("rvzMob")?.classList.remove("open"); document.getElementById("rvzBd")?.classList.remove("open");
  open({ next: "" });
}, true);
window.rvzLogin = { open, close };
window.dispatchEvent(new Event("rvz-login-ready"));
onAuthStateChanged(auth, (u) => { if (u) { close(); if (qs.get("login") && nextUrl) { const n = nextUrl; nextUrl = ""; location.replace(n); } else if (qs.get("login")) { const u2 = new URL(location.href); u2.searchParams.delete("login"); u2.searchParams.delete("next"); history.replaceState({}, "", u2); } } else if (qs.get("login") === "1") open({ mode: qs.get("mode") || "login" }); });
