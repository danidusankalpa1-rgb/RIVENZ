// RIVENZ — signs a customer out when the store removes their account or forces a log out (set from Admin > Customers).
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { app, db } from "./firebase-config.js";

const auth = getAuth(app);
let stop = null;

onAuthStateChanged(auth, (user) => {
  if (stop) { stop(); stop = null; }
  if (!user) return;
  const signedInAt = Date.parse(user.metadata?.lastSignInTime || "") || 0;
  stop = onSnapshot(doc(db, "clients", user.uid), async (snap) => {
    if (!snap.exists()) return;
    const d = snap.data() || {};
    const removed = String(d.accountStatus || "").toLowerCase() === "removed";
    const forcedAt = d.forceLogoutAt?.toMillis ? d.forceLogoutAt.toMillis() : 0;
    if (!removed && !(forcedAt && forcedAt > signedInAt)) return;
    if (stop) { stop(); stop = null; }
    try { await signOut(auth); } catch (_) {}
    if (removed) { try { alert("Your account has been removed by the store. Please contact RIVENZ support."); } catch (_) {} }
    if (!/auth\.html$/.test(location.pathname)) location.replace("auth.html");
  }, () => {});
});
