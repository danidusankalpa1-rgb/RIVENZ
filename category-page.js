(function(){
  var cat=document.body.dataset.cat, KEY="category-"+cat;
  var T={mens:["Men's","Everyday pieces made for men."],women:["Women","Clean, modern pieces for women."],shoes:["Shoes","Step out in RIVENZ."],accessories:["Accessories","Finish the look."]}[cat]||["Collection",""];
  var $=function(i){return document.getElementById(i)};
  var esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
  var money=function(v){return"Rs. "+Number(v||0).toLocaleString("en-LK")};
  $("cpT").textContent=T[0];$("cpD").textContent=T[1];
  function match(p){
    var c=String(p.category||"").toLowerCase(),t=String(p.productType||"").toLowerCase();
    if(cat==="shoes")return c==="shoes"||t==="shoes";
    if(c==="shoes"||t==="shoes")return false;
    if(cat==="accessories")return c.indexOf("accessories")===0||t==="accessories";
    if(cat==="women")return c==="women"||c==="ladies";
    return c==="mens";
  }
  function vid(p){var a=Array.isArray(p.videos)?p.videos:[];var f=a.find(function(x){return x&&x.url});return f?f.url:''}
  function img(p){var a=Array.isArray(p.images)?p.images:[];var f=a.find(function(x){return x&&x.url});return f?f.url:(p.image&&p.image.url)||""}
  var HEX={black:'#111111',white:'#ffffff',red:'#e53935',blue:'#2563eb',navy:'#172554',green:'#16a34a',yellow:'#facc15',orange:'#f97316',pink:'#ec4899',purple:'#8b5cf6',grey:'#9ca3af',gray:'#9ca3af',brown:'#8b5e3c',beige:'#d8c3a5',cream:'#f5f0df',maroon:'#7f1d1d'};
  var rzSold=function(p){var v=[];(function w(x){if(x==null)return;if(typeof x==='object'){Object.keys(x).forEach(function(k){w(x[k])})}else{var n=Number(x);v.push(isFinite(n)?n:0)}})(p&&p.stockByColorSize&&Object.keys(p.stockByColorSize).length?p.stockByColorSize:p&&p.stock);return v.length>0&&!v.some(function(n){return n>0})};(function(){var st=document.createElement('style');document.head.appendChild(st)})();
  function sw(p){var cols=Array.isArray(p.colors)?p.colors:[],m=p.stockByColorSize||{},meta=p.colorMeta||{};
    var out=cols;
    return out.length?'<div class="cp-sw">'+out.slice(0,8).map(function(c){var r=m[c],gone=r&&typeof r==='object'&&!Object.keys(r).some(function(k){return Number(r[k])>0});var h=String(meta[c]||'').trim();if(!/^#[0-9a-f]{6}$/i.test(h))h=HEX[String(c).trim().toLowerCase()]||'#d9d9d4';return '<i'+(gone?' class="x"':'')+' title="'+esc(c)+(gone?' (sold out)':'')+'" style="background:'+h+'"></i>'}).join('')+(out.length>8?'<b>+'+(out.length-8)+'</b>':'')+'</div>':'';}
  function card(p,i){
    var off=Number(p.offer||0)>0&&Number(p.price||0)>0&&Number(p.offer)<Number(p.price),im=img(p);
    return '<a class="cp-card'+(rzSold(p)?' rz-sold':'')+'" style="animation-delay:'+Math.min(i,10)*50+'ms" href="services.html?product='+encodeURIComponent(p.id)+'"><div class="cp-img">'+(im?'<img '+(i<4?'fetchpriority="high" ':'loading="lazy" ')+'decoding="async" alt="" src="'+esc(im)+'">':'')+(/^(new|special|limited)$/i.test(p.tag||'')?'<span class="cp-tag t-'+String(p.tag).toLowerCase()+'">'+esc(p.tag)+'</span>':'')+(off?'<span class="cp-off">-'+Math.round((1-p.offer/p.price)*100)+'%</span>':'')+'</div>'+(window.rvzCard?rvzCard.info(p):'')+'</a>';
  }
  function hero(c){
    if(!c)return;
    if(c.title)$("cpT").innerHTML=esc(c.title).replace(/\n/g,"<br>");
    if(c.subtitle!==undefined&&c.subtitle!=="")$("cpD").textContent=c.subtitle;
    if(c.overlay!=null&&c.overlay!=="")$("cpHero").style.setProperty("--ov",Math.max(0,Math.min(1,Number(c.overlay)/100)));
    var m=c.media;if(m&&m.url){
      var vid=m.type==="video"||/\.(mp4|webm|mov|m4v)(\?|$)/i.test(m.url);
      var el=document.createElement(vid?"video":"img");el.className="cl-media";el.src=m.url;
      if(vid){el.muted=true;el.loop=true;el.autoplay=true;el.playsInline=true;el.setAttribute("muted","");el.setAttribute("playsinline","");el.addEventListener("canplay",function(){el.play().catch(function(){})})}else el.alt="";
      $("cpHero").prepend(el);
    }
  }
  var gp=window.graphicsPublicContent;
  if(!gp){$("cpGrid").innerHTML='<div class="cp-empty">Could not load products.</div>';return}
  gp.catalog("showcase").then(function(r){hero((Array.isArray(r)?r:[]).find(function(x){return x&&x._key===KEY}))}).catch(function(){});
  var lastSig="";
  function paint(r){
    var list=(Array.isArray(r)?r:[]).filter(function(p){return p&&p.active!==false&&!p.special&&match(p)}).reverse();
    $("cpCount").textContent=list.length+(list.length===1?" product":" products");
    var sig=JSON.stringify(list.map(function(p){return [p.id,p.stockByColorSize,p.stock,p.price,p.offer,p.colors]}));if(sig===lastSig)return;lastSig=sig;
    $("cpGrid").innerHTML=list.length?list.map(card).join(""):'<div class="cp-empty">No products here yet. Please check back soon.</div>';
  }
  gp.catalog("products").then(paint).catch(function(){$("cpGrid").innerHTML='<div class="cp-empty">Could not load products. Please refresh.</div>'});
  setInterval(function(){if(document.hidden)return;gp.catalog("products",true).then(paint).catch(function(){})},8000);
})();
