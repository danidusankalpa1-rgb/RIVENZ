/* RIVENZ refund receipt pop-up (built from the order's refund data) */
(function () {
  var esc = function (v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); };
  var money = function (v) { return "Rs. " + Number(v || 0).toLocaleString("en-LK"); };
  var dt = function (v) { if (!v) return "-"; var d = v && v.toDate ? v.toDate() : new Date(v); return isNaN(d) ? "-" : d.toLocaleDateString("en-LK", { day: "2-digit", month: "short", year: "numeric" }); };
  function rows(o) {
    var r = o.refund || {}, b = r.bank || {}, acc = String(b.account || ""), masked = acc.length > 4 ? "****" + acc.slice(-4) : acc;
    return [["Order number", o.id], ["Refund reference", "RF-" + o.id], ["Customer", o.client || o.clientName || "-"], ["Paid by", r.method || o.paymentMethod || "-"], ["Refunded to", (b.holder || "-") + (b.bank ? " - " + b.bank : "")], ["Account", masked || "-"], ["Refund date", dt(r.completedAt)]];
  }
  function png(o, cb) {
    var r = o.refund || {}, W = 800, H = 1000, c = document.createElement("canvas"); c.width = W; c.height = H; var x = c.getContext("2d");
    x.fillStyle = "#0b0b0c"; x.fillRect(0, 0, W, H);
    x.fillStyle = "#fff"; x.textAlign = "center"; x.font = "800 46px Arial"; x.fillText("RIVENZ", W / 2, 110);
    x.font = "700 26px Arial"; x.fillText("REFUND RECEIPT", W / 2, 200);
    x.fillStyle = "#46d391"; x.font = "700 18px Arial"; x.fillText("REFUND COMPLETED", W / 2, 236);
    x.fillStyle = "#fff"; x.font = "800 56px Arial"; x.fillText(money(r.amount), W / 2, 326);
    var y = 410; rows(o).forEach(function (p) { x.textAlign = "left"; x.fillStyle = "#8d8f96"; x.font = "600 18px Arial"; x.fillText(p[0], 70, y); x.textAlign = "right"; x.fillStyle = "#fff"; x.font = "700 20px Arial"; x.fillText(String(p[1]).slice(0, 38), W - 70, y); x.strokeStyle = "#26262a"; x.beginPath(); x.moveTo(70, y + 22); x.lineTo(W - 70, y + 22); x.stroke(); y += 66; });
    x.textAlign = "center"; x.fillStyle = "#8d8f96"; x.font = "500 16px Arial"; x.fillText("Thank you for choosing Rivenz. Style Without Limits.", W / 2, H - 50);
    cb(c.toDataURL("image/png"));
  }
  window.rvzRefundReceipt = function (o) {
    if (!o || !o.refund) return;
    var old = document.getElementById("rvzRcM"); if (old) old.remove();
    if (!document.getElementById("rvzRcCss")) { var st = document.createElement("style"); st.id = "rvzRcCss"; st.textContent = "@keyframes rcIn{from{opacity:0}to{opacity:1}}@keyframes rcUp{from{opacity:0;transform:translateY(18px) scale(.96)}to{opacity:1;transform:none}}#rvzRcM{position:fixed;inset:0;z-index:100003;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;animation:rcIn .2s ease both;font-family:Inter,system-ui,sans-serif}#rvzRcM .rc{width:min(400px,100%);max-height:92vh;overflow:auto;background:#0b0b0c;color:#fff;border:1px solid #26262a;border-radius:22px;padding:24px 22px;text-align:center;animation:rcUp .3s cubic-bezier(.2,.8,.2,1) both}#rvzRcM .rc b.lg{display:block;font-size:20px;letter-spacing:.14em;margin-bottom:14px}#rvzRcM .rc h3{margin:0;font-size:15px;letter-spacing:.12em}#rvzRcM .rc .ok{color:#46d391;font-size:11.5px;font-weight:700;letter-spacing:.14em;margin:6px 0 10px}#rvzRcM .rc .am{font-size:32px;font-weight:800;margin-bottom:14px}#rvzRcM .rr{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid #1f1f23;font-size:13px;text-align:left}#rvzRcM .rr span{color:#8d8f96}#rvzRcM .rr b{text-align:right;word-break:break-word}#rvzRcM .th{color:#9a9ca4;font-size:12px;margin:14px 0 4px}#rvzRcM .ac{display:flex;gap:10px;margin-top:14px}#rvzRcM .ac button{flex:1;height:44px;border-radius:12px;border:1px solid #34343a;background:transparent;color:#d6d8dd;font:600 13.5px Inter,system-ui,sans-serif;cursor:pointer}#rvzRcM .ac .pr{background:#fff;color:#000;border-color:#fff;font-weight:700}"; document.head.appendChild(st); }
    var m = document.createElement("div"); m.id = "rvzRcM";
    m.innerHTML = '<div class="rc" role="dialog" aria-modal="true"><b class="lg">RIVENZ</b><h3>REFUND RECEIPT</h3><div class="ok">REFUND COMPLETED</div><div class="am">' + money(o.refund.amount) + "</div>" + rows(o).map(function (p) { return '<div class="rr"><span>' + esc(p[0]) + "</span><b>" + esc(p[1]) + "</b></div>"; }).join("") + '<div class="th">Thank you for choosing Rivenz.<br>Style Without Limits.</div><div class="ac"><button type="button" data-x>Close</button><button type="button" class="pr" data-dl>Save as image</button></div></div>';
    document.body.appendChild(m);
    m.addEventListener("click", function (e) {
      if (e.target === m || e.target.closest("[data-x]")) return m.remove();
      if (e.target.closest("[data-dl]")) png(o, function (u) { var a = document.createElement("a"); a.href = u; a.download = "RIVENZ-refund-" + o.id + ".png"; document.body.appendChild(a); a.click(); a.remove(); });
    });
  };
})();
