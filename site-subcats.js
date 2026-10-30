/* RIVENZ sub categories (Mens > T-shirts ...). Edited in Admin (showcase catalog, key "subcategories"). */
(function () {
  if (window.rvzSub) return;
  var API = window.GRAPHICS_FILE_API || "https://graphics-file-api.danidusankalpa56.workers.dev", K = "rvzSubMap", p;
  function norm(m, im) { var o = { mens: [], women: [], shoes: [], accessories: [], images: {} }; if (im && typeof im === "object") Object.keys(im).forEach(function (k) { if (im[k] && im[k].url) o.images[k] = String(im[k].url); }); if (m && typeof m === "object") Object.keys(o).forEach(function (k) { if (Array.isArray(m[k])) o[k] = m[k].map(function (x) { return String(x || "").trim(); }).filter(Boolean); }); return o; }
  function cached() { try { var c = JSON.parse(localStorage.getItem(K)) || {}; return norm(c.map, c.images); } catch (e) { return norm(null); } }
  function get() {
    if (p) return p;
    p = fetch(API + "/public/catalog?type=showcase", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) {
      var it = (Array.isArray(d.items) ? d.items : []).find(function (x) { return x && x._key === "subcategories"; });
      try { localStorage.setItem(K, JSON.stringify(it ? { map: it.map, images: it.images } : null)); } catch (e) {}
      return norm(it && it.map, it && it.images);
    }).catch(function () { return cached(); });
    return p;
  }
  window.rvzSub = { cached: cached, get: get };
})();
