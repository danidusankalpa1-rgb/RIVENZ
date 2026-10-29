/* RIVENZ size guide drawer: opens from the right (full screen on phones). Images are set in Admin (showcase catalog, key "size-guide"). */
(function () {
  var DEF = {
    clothing: { cols: ["Size", "Chest (cm)", "Waist (cm)", "Length (cm)"], rows: [["S", "92", "78", "68"], ["M", "98", "84", "70"], ["L", "104", "90", "72"], ["XL", "110", "96", "74"], ["XXL", "116", "102", "76"]] },
    shoe: { cols: ["EU", "UK", "US", "Foot length (cm)"], rows: [["40", "6", "7", "25.0"], ["41", "7", "8", "25.7"], ["42", "8", "9", "26.5"], ["43", "9", "10", "27.3"], ["44", "10", "11", "28.0"], ["45", "11", "12", "28.7"]] }
  };
  var esc = function (v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); };
  var cache;
  function load() {
    if (cache) return cache;
    cache = Promise.resolve().then(function () { return window.graphicsPublicContent && window.graphicsPublicContent.catalog("showcase"); }).then(function (r) {
      var it = (Array.isArray(r) ? r : []).find(function (x) { return x && x._key === "size-guide"; });
      return (it && it.images) || {};
    }).catch(function () { return {}; });
    return cache;
  }
  function css() {
    if (document.getElementById("rvzSgCss")) return;
    var st = document.createElement("style"); st.id = "rvzSgCss";
    st.textContent = "#rvzSgM{position:fixed;inset:0;z-index:100003;visibility:hidden;transition:visibility 0s linear .35s;font-family:Inter,system-ui,sans-serif;color:#111316}#rvzSgM.open{visibility:visible;transition:visibility 0s}#rvzSgM .bd{position:absolute;inset:0;background:rgba(0,0,0,.5);opacity:0;transition:opacity .3s}#rvzSgM.open .bd{opacity:1}#rvzSgM .pn{position:absolute;top:0;right:0;bottom:0;width:min(460px,100vw);background:#fff;display:flex;flex-direction:column;transform:translateX(102%);transition:transform .32s cubic-bezier(.22,1,.36,1)}#rvzSgM.open .pn{transform:none}#rvzSgM .hd{display:flex;align-items:center;justify-content:space-between;padding:20px 22px;border-bottom:1px solid #e6e6e2}#rvzSgM h2{margin:0;font-size:19px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}#rvzSgM .x{width:38px;height:38px;border:0;background:none;cursor:pointer;display:grid;place-items:center;color:#111316;padding:0}#rvzSgM .x svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round}#rvzSgM .bdy{flex:1;overflow:auto;padding:18px 22px 30px}#rvzSgM .bdy img{width:100%;height:auto;display:block}#rvzSgM table{width:100%;border-collapse:collapse;font-size:14px}#rvzSgM th{text-align:left;font-size:12px;letter-spacing:.08em;text-transform:uppercase;padding:10px 6px;border-bottom:2px solid #111316}#rvzSgM td{padding:12px 6px;border-bottom:1px solid #e6e6e2}#rvzSgM .nt{margin:16px 0 0;font-size:12.5px;color:#8a8d93;line-height:1.6}@media(prefers-reduced-motion:reduce){#rvzSgM *{transition:none!important}}";
    document.head.appendChild(st);
  }
  var m, op = false;
  function close() { if (!m) return; op = false; m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); document.documentElement.style.overflow = ""; }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && op) close(); });
  window.rvzSizeGuide = function (sizeType) {
    css();
    if (!m) {
      m = document.createElement("div"); m.id = "rvzSgM"; m.setAttribute("aria-hidden", "true");
      m.innerHTML = '<div class="bd" data-x></div><aside class="pn" role="dialog" aria-modal="true" aria-label="Size guide"><div class="hd"><h2>Size guide</h2><button type="button" class="x" data-x aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div class="bdy" id="rvzSgB"></div></aside>';
      document.body.appendChild(m);
      m.addEventListener("click", function (e) { if (e.target.closest("[data-x]")) close(); });
    }
    var body = m.querySelector("#rvzSgB"); body.innerHTML = "";
    op = true; m.setAttribute("aria-hidden", "false"); void m.offsetWidth; m.classList.add("open"); document.documentElement.style.overflow = "hidden";
    var k = /shoe/.test(String(sizeType || "")) ? "shoe" : "clothing";
    load().then(function (imgs) {
      var im = imgs[k];
      if (im && im.url) { body.innerHTML = '<img src="' + esc(im.url) + '" alt="Size chart">'; return; }
      var c = DEF[k];
      body.innerHTML = "<table><thead><tr>" + c.cols.map(function (x) { return "<th>" + esc(x) + "</th>"; }).join("") + "</tr></thead><tbody>" + c.rows.map(function (r) { return "<tr>" + r.map(function (v) { return "<td>" + esc(v) + "</td>"; }).join("") + "</tr>"; }).join("") + '</tbody></table><p class="nt">Measurements are in centimetres and may vary slightly. If you are between two sizes, we suggest choosing the larger one.</p>';
    });
  };
})();
