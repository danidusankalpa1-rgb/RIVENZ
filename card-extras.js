/* RIVENZ product card extras: tag (New / Special / Limited) + colour squares (sold-out colours crossed out) */
(function(){
  var HEX={black:'#111111',white:'#ffffff',red:'#e53935',blue:'#2563eb',navy:'#172554',green:'#16a34a',yellow:'#facc15',orange:'#f97316',pink:'#ec4899',purple:'#8b5cf6',grey:'#9ca3af',gray:'#9ca3af',brown:'#8b5e3c',beige:'#d8c3a5',cream:'#f5f0df',maroon:'#7f1d1d'};
  var e=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
  var st=document.createElement('style');
  st.textContent='.rzx-tag{position:absolute;top:10px;left:10px;z-index:2;color:#fff;font:800 10px Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;padding:5px 9px}.rzx-tag.t-new{background:#16a34a}.rzx-tag.t-special{background:#7c3aed}.rzx-tag.t-limited{background:#dc2626}.rzx-sw{display:flex;gap:5px;align-items:center;margin-top:10px;flex-wrap:wrap}.rzx-sw i{width:14px;height:14px;border:1px solid rgba(0,0,0,.25);display:block;position:relative}.rzx-sw i.x{filter:brightness(.45) grayscale(.5)}.rzx-sw i.x:after{content:"";position:absolute;inset:-2px;background:linear-gradient(to top right,transparent calc(50% - 1px),#e11d1d calc(50% - 1px),#e11d1d calc(50% + 1px),transparent calc(50% + 1px))}.hx-card .rzx-sw{padding:0 12px 14px;margin-top:0}.sx-img .rzx-tag{top:auto;bottom:10px}.rzx-sw b{font:600 11px Inter,sans-serif;color:#666}';
  document.head.appendChild(st);
  window.rvzCard={
    tag:function(p){var t=String(p&&p.tag||'');return /^(new|special|limited)$/i.test(t)?'<span class="rzx-tag t-'+t.toLowerCase()+'">'+e(t)+'</span>':''},
    sw:function(p){var cols=Array.isArray(p&&p.colors)?p.colors:[];if(!cols.length)return '';var m=p.stockByColorSize||{},meta=p.colorMeta||{};
      return '<div class="rzx-sw">'+cols.slice(0,8).map(function(c){var r=m[c],gone=r&&typeof r==='object'&&!Object.keys(r).some(function(k){return Number(r[k])>0});var h=String(meta[c]||'').trim();if(!/^#[0-9a-f]{6}$/i.test(h))h=HEX[String(c).trim().toLowerCase()]||'#d9d9d4';return '<i'+(gone?' class="x"':'')+' title="'+e(c)+(gone?' (sold out)':'')+'" style="background:'+h+'"></i>'}).join('')+(cols.length>8?'<b>+'+(cols.length-8)+'</b>':'')+'</div>'}
  };
})();
