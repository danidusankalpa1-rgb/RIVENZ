// RIVENZ — shows admin chat messages inside the dashboard Notifications list (max 10) and pops a notice on a new one.
import { collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const stamp = (n) => (n?.createdAt?.toMillis ? n.createdAt.toMillis() : Date.parse(String(n?.time || n?.createdAt || "")) || 0);
export const mergeNotes = () => [...(window.__orderNotes || []), ...(window.__chatNotes || [])].sort((a, b) => stamp(b) - stamp(a)).slice(0, 10);

function toast(text) {
  const t = document.createElement("div");
  t.textContent = text;
  t.style.cssText = "position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#111316;color:#fff;padding:12px 18px;border-radius:16px;font:600 13px Inter,sans-serif;z-index:9999;box-shadow:0 14px 40px rgba(0,0,0,.25)";
  document.body.appendChild(t); setTimeout(() => t.remove(), 4500);
}
let watching = null, first = true;
export function watchChat(user) {
  if (watching === user.uid) return;
  watching = user.uid; first = true;
  onSnapshot(query(collection(db, "chats", user.uid, "messages"), orderBy("createdAt", "desc"), limit(30)), (snap) => {
    window.__chatNotes = snap.docs.map((d) => d.data()).filter((m) => m.sender === "admin")
      .map((m) => ({ message: "RIVENZ admin: " + (String(m.text || "").slice(0, 140) || "Sent you an item"), createdAt: m.createdAt, chat: true }));
    window.__paintNotes?.();
    if (!first && snap.docChanges().some((c) => c.type === "added" && c.doc.data().sender === "admin" && !c.doc.metadata.hasPendingWrites)) toast("New message from RIVENZ admin");
    first = false;
  }, () => {});
}
