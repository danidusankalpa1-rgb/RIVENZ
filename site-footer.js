/* RIVENZ shared black footer (replaces the old per-page footers) */
(function () {
  var file = (location.pathname.split("/").pop() || "index.html");
  if (/^(chat|order|order-confirmation)\.html$/.test(file)) return;
  document.querySelectorAll("footer").forEach(function (f) { f.remove(); });
  var S = function (p) { return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>"; };
  var rows = [
    ["Facebook", "@Rivenz", "https://www.facebook.com/Rivenz", S('<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>')],
    ["Instagram", "@rivenz.clothing", "https://www.instagram.com/rivenz.clothing", S('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>')],
    ["TikTok", "@rivenz.clothing", "https://www.tiktok.com/@rivenz.clothing", S('<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.3 2.4 1.9 4 4.5 4.2"/>')],
    ["Email", "rivenz.clothing@gmail.com", "mailto:rivenz.clothing@gmail.com", S('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>')],
    ["WhatsApp", "0753443030", "https://wa.me/94753443030", S('<path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8L4 20z"/><path d="M9 9.5c.5 2.5 2.5 4.5 5 5l1.3-1.3-2-1-1 .8c-.9-.4-1.6-1.1-2-2l.8-1-1-2L9 9.5z"/>')]
  ];
  var css = document.createElement("style");
  css.textContent = ".rvz-ft{background:#000;color:#fff;margin-top:60px;padding:56px 24px 28px;font-family:Inter,system-ui,sans-serif;box-sizing:border-box;text-align:left}.rvz-ft *{box-sizing:border-box}.rvz-ft-in{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:36px}.rvz-ft img{height:30px;width:auto;filter:brightness(0) invert(1);display:block}.rvz-ft p{margin:16px 0 0;font-size:13px;line-height:1.7;color:#9a9da3;max-width:300px}.rvz-ft h4{margin:0 0 16px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#fff;font-weight:800}.rvz-ft a,.rvz-ft .rvz-ft-r{display:flex;align-items:center;gap:12px;color:#c9ccd1;font-size:13px;text-decoration:none;padding:7px 0}.rvz-ft a:hover{color:#fff}.rvz-ft svg{flex:none;color:#fff}.rvz-ft-l a{display:block}.rvz-ft-b{max-width:1180px;margin:40px auto 0;padding-top:20px;border-top:1px solid #23262b;font-size:12px;color:#7c7f86}@media(max-width:760px){.rvz-ft{padding:44px 20px 24px}.rvz-ft-in{grid-template-columns:1fr;gap:30px}}";
  document.head.appendChild(css);
  var f = document.createElement("footer");
  f.className = "rvz-ft"; if (!document.getElementById("contact")) f.id = "contact";
  f.innerHTML = '<div class="rvz-ft-in"><div><img src="logo.png" alt="RIVENZ"><p>Clean, modern clothing made for everyday life.</p></div>' +
    '<div class="rvz-ft-l"><h4>Explore</h4><a href="index.html">Home</a><a href="collection.html">Collection</a><a href="weddings.html">Offers</a><a href="special-event.html">Special event</a><a href="dashboard.html">My orders</a></div>' +
    "<div><h4>Contact</h4>" + rows.map(function (r) { var inner = r[3] + "<span>" + r[0] + " &middot; " + r[1] + "</span>"; return r[2] ? '<a href="' + r[2] + '" target="_blank" rel="noopener">' + inner + "</a>" : '<div class="rvz-ft-r">' + inner + "</div>"; }).join("") + "</div></div>" +
    '<div class="rvz-ft-b">&copy; 2026 RIVENZ. All rights reserved.</div>';
  document.body.appendChild(f);
})();
