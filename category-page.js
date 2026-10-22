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
  function img(p){var a=Array.isArray(p.images)?p.images:[];var f=a.find(function(x){return x&&x.url});return f?f.url:(p.image&&p.image.url)||""}
  function card(p,i){
    var off=Number(p.offer||0)>0&&Number(p.price||0)>0&&Number(p.offer)<Number(p.price),im=img(p);
    return '<a class="cp-card" style="animation-delay:'+Math.min(i,10)*50+'ms" href="services.html?product='+encodeURIComponent(p.id)+'"><div class="cp-img">'+(im?'<img loading="lazy" alt="'+esc(p.name)+'" src="'+esc(im)+'">':'')+(off?'<span class="cp-off">-'+Math.round((1-p.offer/p.price)*100)+'%</span>':'')+'</div><div class="cp-info"><h2>'+esc(p.name||"RIVENZ Product")+'</h2><div class="cp-pr'+(off?' hot':'')+'">'+money(off?p.offer:p.price)+(off?'<s>'+money(p.price)+'</s>':'')+'</div></div></a>';
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
  gp.catalog("products").then(function(r){
    var list=(Array.isArray(r)?r:[]).filter(function(p){return p&&p.active!==false&&match(p)}).reverse();
    $("cpCount").textContent=list.length+(list.length===1?" product":" products");
    $("cpGrid").innerHTML=list.length?list.map(card).join(""):'<div class="cp-empty">No products here yet. Please check back soon.</div>';
  }).catch(function(){$("cpGrid").innerHTML='<div class="cp-empty">Could not load products. Please refresh.</div>'});
})();
