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
  const r=await fetch(API+path,{...options,cache:'no-store'});
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
  if(file.size>25*1024*1024) throw new Error('FILE_TOO_LARGE');
  const token=await getToken(true);
  const body=await file.arrayBuffer();
  return jsonRequest('/public/upload',{
    method:'POST',
    headers:{Authorization:'Bearer '+token,'X-Public-Type':String(type||'portfolio'),'X-File-Name':safeName(file.name),'X-File-Type':file.type||'application/octet-stream','X-File-Size':String(file.size||0),'Content-Type':file.type||'application/octet-stream'},
    body
  });
}
async function catalog(type){
  const d=await jsonRequest('/public/catalog?type='+encodeURIComponent(String(type||'portfolio')));
  return Array.isArray(d.items)?d.items:[];
}
async function saveCatalog(type,items){
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
window.graphicsPublicContent={API,upload,catalog,saveCatalog,removeFile,getAuthUser};
window.graphicsPublicContentReady=Promise.resolve(window.graphicsPublicContent);
window.dispatchEvent(new Event('graphics-public-content-ready'));
