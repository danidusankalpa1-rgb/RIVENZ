/* RIVENZ product card extras: tag (New / Special / Limited) + colour squares (sold-out colours crossed out) */
(function(){
  var HEX={black:'#111111',white:'#ffffff',red:'#e53935',blue:'#2563eb',navy:'#172554',green:'#16a34a',yellow:'#facc15',orange:'#f97316',pink:'#ec4899',purple:'#8b5cf6',grey:'#9ca3af',gray:'#9ca3af',brown:'#8b5e3c',beige:'#d8c3a5',cream:'#f5f0df',maroon:'#7f1d1d'};
  var e=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
  var st=document.createElement('style');
  st.textContent='.rzx-tag{position:absolute;top:10px;left:10px;z-index:2;color:#fff;font:800 10px Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;padding:5px 9px}.rzx-tag.t-new{background:#fff;color:#111}.rzx-tag.t-special{background:#2563eb}.rzx-tag.t-limited{background:#dc2626}.rzx-sw{display:flex;gap:5px;align-items:center;margin-top:10px;flex-wrap:wrap}.rzx-sw i{width:14px;height:14px;border:1px solid rgba(0,0,0,.25);display:block;position:relative}.rzx-sw i.x{filter:brightness(.45) grayscale(.5)}.rzx-sw i.x:after{content:"";position:absolute;inset:-2px;background:linear-gradient(to top right,transparent calc(50% - 1px),#e11d1d calc(50% - 1px),#e11d1d calc(50% + 1px),transparent calc(50% + 1px))}.hx-card .rzx-sw{padding:0 12px 14px;margin-top:0}.sx-img .rzx-tag{top:auto;bottom:10px}.rzx-sw b{font:600 11px Inter,sans-serif;color:#666}';
  st.textContent+=".rz-sold .pc3:after,.se-card.rz-sold span:after{content:'Out of stock';display:block;margin-top:7px;color:#ff3b30;font:600 12px/16px Inter,system-ui,sans-serif;padding-left:19px;background:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ff3b30' stroke-width='2.4' stroke-linecap='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M5.6 5.6l12.8 12.8'/%3E%3C/svg%3E\") no-repeat left center/14px 14px}";

  st.textContent+='.pc3{padding:10px 2px 0}.pc3 .rzx-sw{margin:0 0 9px!important;padding:0!important}.pc3 .rzx-sw i{width:15px;height:15px}.pc3-nm{font-size:14px;font-weight:500;color:#111316;line-height:1.3}.pc3-cn{font-size:12.5px;color:#7b7f87;margin-top:2px}.pc3-pr{font-size:13px;font-weight:500;color:#111316;margin-top:5px}.pc3-pr.hot{color:#c0392b}.pc3-pr s{color:#9a9da1;margin-left:8px;font-weight:400}.hx-card,.cp-card{border:0!important;background:transparent!important;box-shadow:none!important;padding:0!important}.hx-card:hover,.cp-card:hover{box-shadow:none!important;transform:none!important}.hx-img,.cp-img{background:#f3f3f1!important}.sx-card.service-card{border:0!important;background:transparent!important;box-shadow:none!important;border-radius:0!important;padding:0!important}.sx-card .sx-img{border-radius:0!important}.sx-card .sx-body{padding:0!important}.cp-tag.t-new{background:#fff!important;color:#111!important}.cp-tag.t-special{background:#2563eb!important}.cp-tag.t-limited{background:#dc2626!important}';
  document.head.appendChild(st);
  var mny=function(v){return 'Rs. '+Number(v||0).toLocaleString('en-LK',{minimumFractionDigits:2,maximumFractionDigits:2})};
  window.rvzCard={
    info:function(p){var off=Number(p.offer||0)>0&&Number(p.price||0)>0&&Number(p.offer)<Number(p.price),c=(Array.isArray(p.colors)?p.colors:[])[0];return '<div class="pc3">'+window.rvzCard.sw(p)+'<div class="pc3-nm">'+e(p.name||'RIVENZ Product')+'</div>'+(c?'<div class="pc3-cn">'+e(c)+'</div>':'')+'<div class="pc3-pr'+(off?' hot':'')+'">'+mny(off?p.offer:p.price)+(off?'<s>'+mny(p.price)+'</s>':'')+'</div></div>'},
    sold:function(p){var v=[];(function w(x){if(x==null)return;if(typeof x==='object'){Object.keys(x).forEach(function(k){w(x[k])})}else{var n=Number(x);v.push(isFinite(n)?n:0)}})(p&&p.stockByColorSize&&Object.keys(p.stockByColorSize).length?p.stockByColorSize:p&&p.stock);return v.length>0&&!v.some(function(n){return n>0})},
    tag:function(p){var t=String(p&&p.tag||'');return /^(new|special|limited)$/i.test(t)?'<span class="rzx-tag t-'+t.toLowerCase()+'">'+e(t)+'</span>':''},
    sw:function(p){var cols=Array.isArray(p&&p.colors)?p.colors:[];if(!cols.length)return '';var m=p.stockByColorSize||{},meta=p.colorMeta||{};
      return '<div class="rzx-sw">'+cols.slice(0,8).map(function(c){var r=m[c],gone=r&&typeof r==='object'&&!Object.keys(r).some(function(k){return Number(r[k])>0});var h=String(meta[c]||'').trim();if(!/^#[0-9a-f]{6}$/i.test(h))h=HEX[String(c).trim().toLowerCase()]||'#d9d9d4';return '<i'+(gone?' class="x"':'')+' title="'+e(c)+(gone?' (sold out)':'')+'" style="background:'+h+'"></i>'}).join('')+(cols.length>8?'<b>+'+(cols.length-8)+'</b>':'')+'</div>'}
  };
})();

/* Live sold-out: refresh stock every few seconds and update cards in place (no reload) */
(function(){
  var sig={},busy=false;
  function tick(){
    if(busy||document.hidden||!window.graphicsPublicContent||!window.rvzCard)return;
    if(!document.querySelector('[data-pid],a.hx-card,a.cp-card'))return;
    busy=true;
    Promise.resolve(window.graphicsPublicContent.catalog('products',true)).then(function(r){
      if(!Array.isArray(r))return;
      r.forEach(function(p){
        if(!p||p.id==null)return;
        var s=JSON.stringify([p.stockByColorSize,p.stock,p.colors]),id=String(p.id);
        if(sig[id]===undefined){sig[id]=s;return}
        if(sig[id]===s)return;
        sig[id]=s;
        var q=encodeURIComponent(id);
        document.querySelectorAll('[data-pid]').forEach(function(c){if(c.dataset.pid===id)patch(c,p)});
        document.querySelectorAll('a.hx-card,a.cp-card').forEach(function(c){var h=c.getAttribute('href')||'';if(h.slice(-('product='+q).length)==='product='+q)patch(c,p)});
      });
    }).catch(function(){}).then(function(){busy=false});
  }
  function patch(c,p){
    var sold=window.rvzCard.sold(p);
    c.classList.toggle('rz-sold',sold);
    var sw=c.querySelector('.rzx-sw');
    if(sw){var t=document.createElement('div');t.innerHTML=window.rvzCard.sw(p);if(t.firstChild)sw.replaceWith(t.firstChild)}
  }
  setInterval(tick,8000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)tick()});
  setTimeout(tick,2500);
})();
