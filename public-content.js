/* RIVENZ progress UI: top loading bar + upload progress card (shared by user & admin) */
(function(){
  if(window.rvzProgress)return;
  var css=document.createElement('style');
  css.textContent='.rvzp{position:fixed;left:50%;bottom:22px;transform:translate(-50%,18px) scale(.96);min-width:190px;max-width:calc(100% - 28px);padding:10px 14px 11px;border-radius:18px;z-index:2147483001;color:#fff;font:600 12.5px Inter,system-ui,sans-serif;background:rgba(22,24,28,.46);-webkit-backdrop-filter:blur(18px) saturate(1.5);backdrop-filter:blur(18px) saturate(1.5);border:1px solid rgba(255,255,255,.28);box-shadow:0 18px 44px -16px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.25);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .25s,transform .35s cubic-bezier(.22,1,.36,1),visibility .25s}.rvzp.on{opacity:1;visibility:visible;transform:translate(-50%,0) scale(1)}'+
  '.rvzp-row{display:flex;justify-content:space-between;gap:14px;align-items:center}.rvzp-row span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:230px}.rvzp-row b{font-variant-numeric:tabular-nums;font-weight:700}'+
  '.rvzp-tr{margin-top:8px;height:4px;border-radius:99px;background:rgba(255,255,255,.22);overflow:hidden}.rvzp-tr i{display:block;height:100%;width:0;border-radius:99px;background:#fff;transition:width .25s ease}.rvzp.ind .rvzp-tr i{width:40%!important;animation:rvzpI 1.1s ease-in-out infinite}.rvzp.ok .rvzp-tr i{background:#5ff0b0}.rvzp.err .rvzp-tr i{background:#ff8a8a}'+
  '@keyframes rvzpI{0%{transform:translateX(-110%)}100%{transform:translateX(280%)}}@media(prefers-reduced-motion:reduce){.rvzp.ind .rvzp-tr i{animation:none}}';
  document.head.appendChild(css);
  var el=document.createElement('div');el.className='rvzp';el.setAttribute('role','status');el.innerHTML='<div class="rvzp-row"><span id="rvzpL"></span><b id="rvzpP"></b></div><div class="rvzp-tr"><i id="rvzpF"></i></div>';
  function mount(){if(!document.body)return setTimeout(mount,20);document.body.appendChild(el)}mount();
  var pend=0,hideT=null,mode='';
  function show(cls,label,pct){clearTimeout(hideT);el.className='rvzp on '+cls;document.getElementById('rvzpL').textContent=label;document.getElementById('rvzpP').textContent=pct==null?'':pct+'%';document.getElementById('rvzpF').style.width=(pct==null?40:pct)+'%'}
  function hide(d){hideT=setTimeout(function(){if(!pend&&mode!=='up')el.classList.remove('on')},d||0)}
  /* loading (products etc.) */
  function start(label){pend++;if(mode!=='up')show('ind',label||'Loading')}
  function end(){pend=Math.max(0,pend-1);if(!pend)hide(250)}
  /* uploads */
  function setUp(pct,label,state){mode='up';var p=Math.max(0,Math.min(100,Math.round(pct)));show(state||'',state==='err'?'Upload failed':(label||'Uploading'),state==='err'?null:p);if(state==='err'){document.getElementById('rvzpP').textContent='';document.getElementById('rvzpF').style.width='100%'}}
  function finish(ok){setUp(100,ok?'Upload complete':'Upload failed',ok?'ok':'err');hideT=setTimeout(function(){mode='';if(pend)show('ind','Loading');else el.classList.remove('on')},ok?1100:2200)}
  function xhr(url,headers,body,label,timeout){
    return new Promise(function(resolve,reject){
      var x=new XMLHttpRequest();x.open('POST',url,true);
      Object.keys(headers||{}).forEach(function(k){try{x.setRequestHeader(k,headers[k])}catch(e){}});
      x.timeout=timeout||180000;var nm=label||'Uploading';setUp(0,nm);
      x.upload.onprogress=function(e){if(e.lengthComputable)setUp(e.loaded/e.total*100,nm)};
      x.onload=function(){var d=null;try{d=JSON.parse(x.responseText)}catch(e){}finish(x.status>=200&&x.status<300&&(!d||d.ok!==false));resolve({ok:x.status>=200&&x.status<300,status:x.status,data:d})};
      x.onerror=function(){finish(false);reject(new Error('Network error while uploading'))};
      x.ontimeout=function(){finish(false);reject(new Error('Upload timed out'))};
      x.send(body);
    });
  }
  window.rvzProgress={start:start,end:end,xhr:xhr,setUpload:setUp,finish:finish};
})();

const API = window.GRAPHICS_FILE_API || 'https://graphics-file-api.danidusankalpa56.workers.dev';

async function getAuthUser(){
  const {getAuth, onIdTokenChanged} = await import('https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js');
  const {app} = await import('./firebase-config.js');
  const auth = getAuth(app);
  if(auth.currentUser) return auth.currentUser;
  return new Promise(resolve=>{
    let done=false;
    const stop=onIdTokenChanged(auth,user=>{
      if(done) return;
      done=true;
      stop();
      resolve(user||null);
    });
  });
}
async function getToken(force=false){
  const user=await getAuthUser();
  if(!user) throw new Error('AUTH_REQUIRED');
  return user.getIdToken(force);
}
function safeName(name){return String(name||'file').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,180)||'file';}
async function jsonRequest(path,options={},retry=true){
  const P=window.rvzProgress,show=P&&/type=products/.test(path);if(show)P.start('Loading products');
  let r;try{r=await fetch(API+path,{...options,cache:'no-store'})}finally{if(show)P.end()}
  let d=null; try{d=await r.json()}catch(e){}
  if(!r.ok || d?.ok===false){
    const message=d?.error||`Request failed (HTTP ${r.status})`;
    if(retry && r.status===401 && options.headers?.Authorization){
      const token=await getToken(true);
      const headers=new Headers(options.headers);
      headers.set('Authorization','Bearer '+token);
      return jsonRequest(path,{...options,headers},false);
    }
    throw new Error(message);
  }
  return d||{};
}
async function upload(file,type){
  if(!file) throw new Error('FILE_REQUIRED');
  if(file.size>(/^video\//i.test(file.type||'')?100:25)*1024*1024) throw new Error('FILE_TOO_LARGE');
  const token=await getToken(true);
  const headers={Authorization:'Bearer '+token,'X-Public-Type':String(type||'portfolio'),'X-File-Name':safeName(file.name),'X-File-Type':file.type||'application/octet-stream','X-File-Size':String(file.size||0),'Content-Type':file.type||'application/octet-stream'};
  const P=window.rvzProgress;
  if(!P) return jsonRequest('/public/upload',{method:'POST',headers,body:await file.arrayBuffer()});
  const body=await file.arrayBuffer();
  const res=await P.xhr(API+'/public/upload',headers,body,'Uploading '+String(file.name||'file').slice(0,28));
  if(!res.ok||res.data?.ok===false) throw new Error(res.data?.error||('Upload failed (HTTP '+res.status+')'));
  return res.data||{};
}
async function rawCatalog(type){
  const d=await jsonRequest('/public/catalog?type='+encodeURIComponent(String(type||'portfolio')));
  return Array.isArray(d.items)?d.items:[];
}
async function rawSave(type,items){
  const token=await getToken(true);
  const d=await jsonRequest('/public/catalog',{
    method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({type:String(type||'portfolio'),items:Array.isArray(items)?items:[]})
  });
  return Array.isArray(d.items)?d.items:[];
}
async function removeFile(key){
  if(!key) return;
  const token=await getToken();
  await jsonRequest('/public/file?key='+encodeURIComponent(String(key)),{method:'DELETE',headers:{Authorization:'Bearer '+token}});
}
// Settings (home/payment/special-event) live inside the allowed 'showcase' catalog as items tagged _key.
const SETTINGS_KEYS=['home-settings','payment-settings','special-event'];
async function catalog(type){
  if(!SETTINGS_KEYS.includes(type)) return rawCatalog(type);
  const all=await rawCatalog('showcase');const it=all.find(x=>x&&x._key===type);
  if(!it) return [];const {_key,...rest}=it;return [rest];
}
async function saveCatalog(type,items){
  if(!SETTINGS_KEYS.includes(type)) return rawSave(type,items);
  const all=(await rawCatalog('showcase')).filter(x=>x&&x._key!==type);
  const v=Array.isArray(items)&&items[0]?items[0]:null;if(v)all.push({...v,_key:type});
  await rawSave('showcase',all);return items;
}
window.graphicsPublicContent={API,upload,catalog,saveCatalog,removeFile,getAuthUser};
window.graphicsPublicContentReady=Promise.resolve(window.graphicsPublicContent);
window.dispatchEvent(new Event('graphics-public-content-ready'));
