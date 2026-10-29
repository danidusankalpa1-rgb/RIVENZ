/* RIVENZ contact + social settings. Edited in Admin (showcase catalog, key "site-contact"). */
(function () {
  if (window.rvzContact) return;
  var API = window.GRAPHICS_FILE_API || "https://graphics-file-api.danidusankalpa56.workers.dev";
  var DEF = {
    kicker: "WE ARE HERE TO HELP", title: "Contact us",
    intro: "If you need any help with an order, or you want to know more about our products, please get in touch. Call us, message us on WhatsApp or send an email, and we will be happy to help you.",
    tagline: "Style Without Limits",
    items: [
      { id: "phone", label: "Phone", value: "0753443030", link: "tel:+94753443030", show: true },
      { id: "whatsapp", label: "WhatsApp", value: "0753443030", link: "https://wa.me/94753443030", show: true },
      { id: "email", label: "Email", value: "rivenz.support@gmail.com", link: "mailto:rivenz.support@gmail.com", show: true },
      { id: "facebook", label: "Facebook", value: "Rivenz", link: "https://www.facebook.com/share/1ENwD8VyHG/", show: true },
      { id: "instagram", label: "Instagram", value: "@rivenz.official", link: "https://www.instagram.com/rivenz.official", show: true },
      { id: "tiktok", label: "TikTok", value: "@rivenz.official", link: "", show: true }
    ]
  };
  var K = "rvzContactCfg";
  function merge(c) {
    var o = JSON.parse(JSON.stringify(DEF));
    if (!c) return o;
    ["kicker", "title", "intro", "tagline"].forEach(function (k) { if (typeof c[k] === "string") o[k] = c[k]; });
    if (Array.isArray(c.items)) o.items.forEach(function (d) {
      var s = c.items.find(function (x) { return x && x.id === d.id; });
      if (s) { ["label", "value", "link"].forEach(function (k) { if (typeof s[k] === "string") d[k] = s[k]; }); if (typeof s.show === "boolean") d.show = s.show; }
    });
    return o;
  }
  function cached() { try { return merge(JSON.parse(localStorage.getItem(K))); } catch (e) { return merge(null); } }
  function href(it) {
    var l = (it.link || "").trim(), v = (it.value || "").trim();
    if (l) return l;
    var d = v.replace(/[^\d+]/g, "");
    if (it.id === "phone" && d) return "tel:" + d;
    if (it.id === "whatsapp" && d) return "https://wa.me/" + d.replace(/^\+/, "").replace(/^0/, "94");
    if (it.id === "email" && v) return "mailto:" + v;
    return "";
  }
  var p;
  function get() {
    if (p) return p;
    p = fetch(API + "/public/catalog?type=showcase", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) {
      var it = (Array.isArray(d.items) ? d.items : []).find(function (x) { return x && x._key === "site-contact"; });
      try { localStorage.setItem(K, JSON.stringify(it || null)); } catch (e) {}
      return merge(it);
    }).catch(function () { return cached(); });
    return p;
  }
  window.rvzContact = { DEF: DEF, cached: cached, get: get, href: href };
})();
