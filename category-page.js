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
  var lastSig="",lastR=[],sub=(new URLSearchParams(location.search).get("sub")||"").trim(),SK=cat==="accessories"?"accessories":cat;
  var CH='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
  var tb=document.createElement("div");tb.className="cp-tb";
  tb.innerHTML='<div class="cp-dd" id="cpSubWrap" hidden><button type="button" class="cp-tbtn" id="cpSubBtn"><span>All</span>'+CH+'</button><div class="cp-menu" id="cpSubMenu" hidden></div></div><button type="button" class="cp-tbtn" id="cpFBtn"><span>Filter</span>'+CH+'</button>';
  $("cpGrid").parentNode.insertBefore(tb,$("cpGrid"));
  var subList=[];
  function setSub(v){sub=v||"";try{var u=new URL(location.href);if(sub)u.searchParams.set("sub",sub);else u.searchParams.delete("sub");history.replaceState(null,"",u)}catch(x){}lastSig="";drawSubs();resetF();paint(lastR)}
  function drawSubs(){
    var l=subList.slice();if(sub&&!l.some(function(n){return n.toLowerCase()===sub.toLowerCase()}))l.push(sub);
    $("cpSubWrap").hidden=!l.length;if(!l.length)return;
    $("cpSubBtn").firstChild.textContent=sub||"All";
    $("cpSubMenu").innerHTML=['All'].concat(l).map(function(n,i){var on=i===0?!sub:n.toLowerCase()===sub.toLowerCase();return '<button type="button" class="cp-mi'+(on?' on':'')+'" data-s="'+(i===0?'':esc(n))+'">'+esc(n)+'</button>'}).join("");
  }
  $("cpSubBtn").addEventListener("click",function(e){e.stopPropagation();var m=$("cpSubMenu");m.hidden=!m.hidden;$("cpSubBtn").classList.toggle("open",!m.hidden)});
  $("cpSubMenu").addEventListener("click",function(e){var b=e.target.closest(".cp-mi");if(!b)return;$("cpSubMenu").hidden=true;$("cpSubBtn").classList.remove("open");setSub(b.dataset.s||"")});
  document.addEventListener("click",function(e){if(!e.target.closest(".cp-dd")){$("cpSubMenu").hidden=true;$("cpSubBtn").classList.remove("open")}});
  function loadSubs(){var go=function(m){subList=(m&&m[SK])||[];drawSubs()};var run=function(){go(window.rvzSub.cached());window.rvzSub.get().then(go)};if(window.rvzSub)run();else{var sc=document.createElement("script");sc.src="site-subcats.js?v=2";sc.onload=run;document.head.appendChild(sc)}}
  loadSubs();
  /* ---- filters ---- */
  var F={av:{},min:null,max:null,sz:{},co:{}},D=null,base=[],bounds=[0,0];
  function resetF(){F={av:{},min:null,max:null,sz:{},co:{}};updFBtn()}
  function eff(p){var o=Number(p.offer||0),pr=Number(p.price||0);return o>0&&pr>0&&o<pr?o:pr}
  function sizesOf(p){var o={};(Array.isArray(p.sizes)?p.sizes:[]).forEach(function(z){z=String(z||"").trim();if(z)o[z.toLowerCase()]=z});var m=p.stockByColorSize;if(m&&typeof m==="object")Object.keys(m).forEach(function(c){var r=m[c];if(r&&typeof r==="object")Object.keys(r).forEach(function(z){o[String(z).toLowerCase()]=String(z)})});if(!Object.keys(o).length&&p.stock&&typeof p.stock==="object")Object.keys(p.stock).forEach(function(z){o[String(z).toLowerCase()]=String(z)});return o}
  function colorsOf(p){var o={};(Array.isArray(p.colors)?p.colors:[]).forEach(function(c){c=String(c||"").trim();if(c)o[c.toLowerCase()]=c});return o}
  function pass(p,f){
    var a=f.av.in,b=f.av.out;if(a!==b){var sd=rzSold(p);if(a&&sd)return false;if(b&&!sd)return false}
    var e=eff(p);if(f.min!=null&&e<f.min)return false;if(f.max!=null&&e>f.max)return false;
    var zs=Object.keys(f.sz).filter(function(k){return f.sz[k]});if(zs.length){var s=sizesOf(p);if(!zs.some(function(k){return s[k]}))return false}
    var cs=Object.keys(f.co).filter(function(k){return f.co[k]});if(cs.length){var c=colorsOf(p);if(!cs.some(function(k){return c[k]}))return false}
    return true}
  function nF(){var n=0;if(F.av.in)n++;if(F.av.out)n++;if(F.min!=null||F.max!=null)n++;Object.keys(F.sz).forEach(function(k){if(F.sz[k])n++});Object.keys(F.co).forEach(function(k){if(F.co[k])n++});return n}
  function updFBtn(){var n=nF();$("cpFBtn").firstChild.textContent=n?"Filter ("+n+")":"Filter";$("cpFBtn").classList.toggle("act",!!n)}
  var dr=document.createElement("div");dr.id="cpFd";dr.innerHTML='<div class="fd-bd"></div><aside class="fd-pn" role="dialog" aria-modal="true" aria-label="Filter"><div class="fd-hd"><b>FILTER BY</b><button type="button" class="fd-x" aria-label="Close">&times;</button></div><div class="fd-bd2" id="fdBody"></div><div class="fd-ft"><button type="button" class="fd-clr">CLEAR ALL</button><button type="button" class="fd-ok">APPLY FILTERS</button></div></aside>';
  document.body.appendChild(dr);
  function sec(t,h,open){return '<section class="fd-s'+(open===false?' shut':'')+'"><button type="button" class="fd-st"><span>'+t+'</span>'+CH+'</button><div class="fd-sb">'+h+'</div></section>'}
  function cnt(map){return Object.keys(map).sort(function(a,b){var na=parseFloat(a),nb=parseFloat(b);if(isFinite(na)&&isFinite(nb)&&String(na)===a&&String(nb)===b)return na-nb;var o=["xxs","xs","s","m","l","xl","xxl","xxxl"],ia=o.indexOf(a),ib=o.indexOf(b);if(ia>-1&&ib>-1)return ia-ib;return a<b?-1:a>b?1:0})}
  function drawF(){
    var sz={},co={},nin=0,nout=0,lo=Infinity,hi=0;
    base.forEach(function(p){var s=sizesOf(p),c=colorsOf(p);Object.keys(s).forEach(function(k){sz[k]=sz[k]||{n:s[k],c:0};sz[k].c++});Object.keys(c).forEach(function(k){co[k]=co[k]||{n:c[k],c:0};co[k].c++});rzSold(p)?nout++:nin++;var e=eff(p);if(e>0){lo=Math.min(lo,e);hi=Math.max(hi,e)}});
    if(!isFinite(lo)){lo=0}lo=Math.floor(lo/100)*100;hi=Math.ceil(hi/100)*100;bounds=[lo,hi];
    var cb=function(g,k,l,c,on){return '<label class="fd-c"><input type="checkbox" data-g="'+g+'" data-k="'+esc(k)+'"'+(on?' checked':'')+'><i></i><span>'+esc(l)+'</span><em>('+c+')</em></label>'};
    var h=sec('Availability',cb('av','in','In stock',nin,D.av.in)+cb('av','out','Out of stock',nout,D.av.out));
    var mn=D.min!=null?D.min:lo,mx=D.max!=null?D.max:hi;
    if(hi>lo)h+=sec('Price','<div class="fd-pr"><span>From: <b id="fdMn">'+money(mn)+'</b></span><span>To: <b id="fdMx">'+money(mx)+'</b></span></div><div class="fd-rg"><input type="range" id="fdR1" min="'+lo+'" max="'+hi+'" step="100" value="'+mn+'"><input type="range" id="fdR2" min="'+lo+'" max="'+hi+'" step="100" value="'+mx+'"></div>');
    var zk=cnt(sz);if(zk.length)h+=sec('Size',zk.map(function(k){return cb('sz',k,sz[k].n,sz[k].c,D.sz[k])}).join(""));
    var ck=Object.keys(co).sort();if(ck.length)h+=sec('Color',ck.map(function(k){return cb('co',k,co[k].n,co[k].c,D.co[k])}).join(""));
    $("fdBody").innerHTML=h}
  function openF(){D=JSON.parse(JSON.stringify(F));drawF();dr.classList.add("on");document.documentElement.style.overflow="hidden"}
  function closeF(){dr.classList.remove("on");document.documentElement.style.overflow=""}
  $("cpFBtn").addEventListener("click",openF);
  dr.querySelector(".fd-bd").addEventListener("click",closeF);dr.querySelector(".fd-x").addEventListener("click",closeF);
  dr.addEventListener("click",function(e){var t=e.target.closest(".fd-st");if(t)t.parentNode.classList.toggle("shut")});
  dr.addEventListener("change",function(e){var c=e.target;if(c.type!=="checkbox")return;var g=c.dataset.g,k=c.dataset.k;if(g==="av")D.av[k]=c.checked;else D[g][k]=c.checked});
  dr.addEventListener("input",function(e){if(e.target.id!=="fdR1"&&e.target.id!=="fdR2")return;var a=+$("fdR1").value,b=+$("fdR2").value;if(a>b){if(e.target.id==="fdR1"){a=b;$("fdR1").value=a}else{b=a;$("fdR2").value=b}}D.min=a<=bounds[0]?null:a;D.max=b>=bounds[1]?null:b;$("fdMn").textContent=money(a);$("fdMx").textContent=money(b)});
  dr.querySelector(".fd-clr").addEventListener("click",function(){D={av:{},min:null,max:null,sz:{},co:{}};drawF()});
  dr.querySelector(".fd-ok").addEventListener("click",function(){F=D;updFBtn();closeF();lastSig="";paint(lastR)});
  function paint(r){
    lastR=r;
    base=(Array.isArray(r)?r:[]).filter(function(p){return p&&p.active!==false&&!p.special&&match(p)&&(!sub||String(p.subCategory||"").trim().toLowerCase()===sub.toLowerCase())}).reverse();
    var list=base.filter(function(p){return pass(p,F)});
    $("cpCount").textContent=list.length+(list.length===1?" product":" products");
    var sig=JSON.stringify(list.map(function(p){return [p.id,p.stockByColorSize,p.stock,p.price,p.offer,p.colors]}));if(sig===lastSig)return;lastSig=sig;
    $("cpGrid").innerHTML=list.length?list.map(card).join(""):'<div class="cp-empty">'+(nF()?"No products match your filters.":sub?"No products in this category yet.":"No products here yet. Please check back soon.")+'</div>';
  }
  gp.catalog("products").then(paint).catch(function(){$("cpGrid").innerHTML='<div class="cp-empty">Could not load products. Please refresh.</div>'});
  setInterval(function(){if(document.hidden)return;gp.catalog("products",true).then(paint).catch(function(){})},8000);
})();
