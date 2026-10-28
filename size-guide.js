/* RIVENZ size guide pop-up. Charts come from the showcase catalog ({_key:"size-guide", charts:[...]}) or the defaults below. */
(function () {
  var DEF = [
    { title: "Clothing", kind: "clothing", cols: ["Size", "Chest (cm)", "Waist (cm)", "Length (cm)"], rows: [["S", "92", "78", "68"], ["M", "98", "84", "70"], ["L", "104", "90", "72"], ["XL", "110", "96", "74"], ["XXL", "116", "102", "76"]] },
    { title: "Shoes", kind: "shoe", cols: ["EU", "UK", "US", "Foot length (cm)"], rows: [["40", "6", "7", "25.0"], ["41", "7", "8", "25.7"], ["42", "8", "9", "26.5"], ["43", "9", "10", "27.3"], ["44", "10", "11", "28.0"], ["45", "11", "12", "28.7"]] }
  ];
  var esc = function (v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); };
  var cache;
  function load() {
    if (cache) return cache;
    cache = Promise.resolve().then(function () { return window.graphicsPublicContent && window.graphicsPublicContent.catalog("showcase"); }).then(function (r) {
      var it = (Array.isArray(r) ? r : []).find(function (x) { return x && x._key === "size-guide"; });
      return it && Array.isArray(it.charts) && it.charts.length ? it.charts : DEF;
    }).catch(function () { return DEF; });
    return cache;
  }
  window.rvzSizeGuide = function (sizeType) {
    var old = document.getElementById("rvzSgM"); if (old) old.remove();
    if (!document.getElementById("rvzSgCss")) { var st = document.createElement("style"); st.id = "rvzSgCss"; st.textContent = "@keyframes sgIn{from{opacity:0}to{opacity:1}}@keyframes sgUp{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}#rvzSgM{position:fixed;inset:0;z-index:100003;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;animation:sgIn .2s ease both;font-family:Inter,system-ui,sans-serif}#rvzSgM .sg{width:min(520px,100%);max-height:90vh;overflow:auto;background:#0b0b0c;color:#fff;border:1px solid #26262a;border-radius:22px;padding:22px;animation:sgUp .3s cubic-bezier(.2,.8,.2,1) both}#rvzSgM h3{margin:0 0 14px;font-size:17px;letter-spacing:.04em}#rvzSgM .tb{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}#rvzSgM .tb button{height:34px;padding:0 14px;border-radius:999px;border:1px solid #34343a;background:transparent;color:#b9bbc2;font:600 12.5px Inter,system-ui,sans-serif;cursor:pointer}#rvzSgM .tb button.on{background:#fff;color:#000;border-color:#fff}#rvzSgM .tw{overflow:auto;border:1px solid #1f1f23;border-radius:14px}#rvzSgM table{width:100%;border-collapse:collapse;font-size:13.5px}#rvzSgM th,#rvzSgM td{padding:11px 12px;text-align:center;border-bottom:1px solid #1f1f23;white-space:nowrap}#rvzSgM th{color:#8d8f96;font-weight:600;font-size:12px}#rvzSgM td:first-child{font-weight:800}#rvzSgM tr:last-child td{border-bottom:0}#rvzSgM .nt{color:#8d8f96;font-size:12px;margin:12px 0 0;line-height:1.5}#rvzSgM .cl{width:100%;height:44px;margin-top:14px;border-radius:12px;border:1px solid #34343a;background:transparent;color:#d6d8dd;font:600 13.5px Inter,system-ui,sans-serif;cursor:pointer}"; document.head.appendChild(st); }
    var m = document.createElement("div"); m.id = "rvzSgM"; m.innerHTML = '<div class="sg" role="dialog" aria-modal="true"><h3>Size guide</h3><div class="tb"></div><div class="tw"></div><p class="nt">Measurements are in centimetres and may vary slightly. If you are between two sizes, we suggest choosing the larger one.</p><button type="button" class="cl">Close</button></div>';
    document.body.appendChild(m);
    m.addEventListener("click", function (e) { if (e.target === m || e.target.closest(".cl")) m.remove(); });
    load().then(function (charts) {
      var want = /shoe/.test(String(sizeType || "")) ? "shoe" : "clothing", cur = Math.max(0, charts.findIndex(function (c) { return c.kind === want; }));
      var tb = m.querySelector(".tb"), tw = m.querySelector(".tw");
      function draw() {
        tb.innerHTML = charts.length > 1 ? charts.map(function (c, i) { return '<button type="button" data-i="' + i + '" class="' + (i === cur ? "on" : "") + '">' + esc(c.title) + "</button>"; }).join("") : "";
        var c = charts[cur] || charts[0];
        tw.innerHTML = "<table><thead><tr>" + (c.cols || []).map(function (x) { return "<th>" + esc(x) + "</th>"; }).join("") + "</tr></thead><tbody>" + (c.rows || []).map(function (r) { return "<tr>" + (c.cols || []).map(function (_, i) { return "<td>" + esc(r[i]) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
      }
      tb.addEventListener("click", function (e) { var b = e.target.closest("[data-i]"); if (b) { cur = +b.dataset.i; draw(); } });
      draw();
    });
  };
})();
