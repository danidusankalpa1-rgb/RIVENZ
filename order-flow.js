import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { app, db } from "./firebase-config.js";

const auth = getAuth(app);
const KEY = "graphicsOrders";
const NOTIFY = "graphicsNotifications";
const FILE_API = window.GRAPHICS_FILE_API || "https://graphics-file-api.danidusankalpa56.workers.dev";
const fileUrlCache = new Map();

function read(key, fallback){ try{return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));}catch(e){return fallback;} }
function write(key,value){ localStorage.setItem(key,JSON.stringify(value)); window.dispatchEvent(new Event("graphics-data")); }
function session(){ return auth.currentUser || null; }

async function account(){
  const user=auth.currentUser; if(!user) return null;
  try{const snap=await getDoc(doc(db,"clients",user.uid)); const profile=snap.exists()?snap.data():{}; return {uid:user.uid,email:profile.email||user.email||"",name:profile.name||user.displayName||"",phone:profile.phone||""};}
  catch(e){return {uid:user.uid,email:user.email||"",name:user.displayName||"",phone:""};}
}

async function withTimeout(promise, ms, label){
  let timer;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+" timed out after "+Math.round(ms/1000)+" seconds.")),ms);});
  try{return await Promise.race([promise,timeout]);} finally{clearTimeout(timer);}
}

async function getIdToken(forceRefresh=false){
  const user=auth.currentUser;
  if(!user) throw new Error("AUTH_REQUIRED");
  return user.getIdToken(forceRefresh);
}

async function newId(){
  // Never query the entire orders collection just to generate an order number.
  // Customer rules intentionally prevent broad order reads, so IDs use a collision-resistant token.
  const year=new Date().getFullYear();
  const token=crypto.randomUUID().replace(/-/g,"").slice(0,8).toUpperCase();
  return {id:`GLK-${year}-${token}`,sequence:Date.now()};
}

function safeHeaderName(name){return String(name||"file").replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,180)||"file";}

async function uploadOrderFile(orderId,file,folder="client"){
  if(!file) throw new Error("FILE_REQUIRED");
  if(file.size>50*1024*1024) throw new Error("FILE_TOO_LARGE");
  const token=await getIdToken();
  async function send(targetFolder){
    const response=await withTimeout(fetch(FILE_API+"/upload",{
      method:"POST",
      headers:{
        Authorization:"Bearer "+token,
        "X-Order-Id":String(orderId),
        "X-Folder":String(targetFolder),
        "X-File-Name":safeHeaderName(file.name),
        "X-File-Type":file.type||"application/octet-stream",
        "X-File-Size":String(file.size||0),
        "Content-Type":file.type||"application/octet-stream"
      },
      body:file
    }), 120000, "Cloudflare R2 upload");
    let data=null;
    try{data=await response.json();}catch(e){}
    if(!response.ok||!data?.ok){
      const error=new Error(data?.error||("R2 upload failed (HTTP "+response.status+")"));
      error.status=response.status;
      throw error;
    }
    return {path:data.path,name:data.name||file.name,type:data.type||file.type||"",size:Number(data.size||file.size||0),url:data.url||"",storage:"r2",folder:targetFolder};
  }
  try{
    return await send(folder);
  }catch(error){
    // Older deployed R2 workers may not yet know the newer `payment` folder.
    // Keep the receipt private under the existing authenticated `client` folder
    // so checkout continues to work until the worker is redeployed.
    if(String(folder)==="payment"){
      console.warn("Payment-folder upload failed; retrying with legacy private client folder.",error);
      return await send("client");
    }
    throw error;
  }
}

async function fileUrl(ref){
  if(!ref) return "";
  const raw=typeof ref==="string"?ref:"";
  const value=typeof ref==="string"?{path:ref}:ref;
  if(raw && /^https?:/i.test(raw)){
    try{
      const u=new URL(raw);
      if(u.pathname==="/file" && u.searchParams.get("key")){
        value.path=u.searchParams.get("key");
        value.storage="r2";
      }else if(u.pathname==="/public/file") return raw;
      else return raw;
    }catch(e){return raw;}
  }
  if(value?.url && /^https?:/i.test(String(value.url)) && value?.storage!=="r2") return value.url;
  if(value?.storage==="r2" && value?.url){
    try{
      const u=new URL(value.url);
      if(u.pathname==="/file" && u.searchParams.get("key")) value.path=u.searchParams.get("key");
      else if(u.pathname==="/public/file") return value.url;
    }catch(e){}
  }
  const path=value?.path||value?.key||((typeof ref==="string"&&ref.startsWith("users/"))?ref:"");
  if(!path) return "";
  if(fileUrlCache.has(path)) return fileUrlCache.get(path);
  const token=await getIdToken();
  const response=await withTimeout(fetch(FILE_API+"/file?key="+encodeURIComponent(path),{headers:{Authorization:"Bearer "+token}}),30000,"Cloudflare R2 file request");
  if(!response.ok){
    if(response.status===401){
      const fresh=await getIdToken(true);
      const retry=await withTimeout(fetch(FILE_API+"/file?key="+encodeURIComponent(path),{headers:{Authorization:"Bearer "+fresh}}),30000,"Cloudflare R2 file retry");
      if(!retry.ok) throw new Error("FILE_ACCESS_DENIED");
      const blob=await retry.blob(); const url=URL.createObjectURL(blob); fileUrlCache.set(path,url); return url;
    }
    throw new Error("FILE_NOT_FOUND");
  }
  const blob=await response.blob();
  const url=URL.createObjectURL(blob);
  fileUrlCache.set(path,url);
  return url;
}

async function save(order){
  const user=auth.currentUser; if(!user) throw new Error("AUTH_REQUIRED");
  const ownerUid=order.uid||user.uid;
  const payload={...order,uid:ownerUid,email:order.email||user.email||"",updatedAt:serverTimestamp()};
  if(!order.createdAt) payload.createdAt=serverTimestamp();
  await withTimeout(setDoc(doc(db,"orders",order.id),payload,{merge:true}),15000,"Firestore order save");
  const local=read(KEY,[]); const i=local.findIndex(x=>x.id===order.id);
  const cache={...order,uid:ownerUid}; if(i>=0) local[i]={...local[i],...cache}; else local.push(cache);
  write(KEY,local); write("graphicsOrder_"+order.id,cache); return cache;
}

async function adminGet(orderId){
  try{const snap=await getDoc(doc(db,"orders",orderId)); return snap.exists()?{id:snap.id,...snap.data()}:null;}catch(e){console.warn("Firebase admin order read failed:",e); return read(KEY,[]).find(o=>o.id===orderId)||null;}
}

async function get(orderId){
  const user=auth.currentUser; if(!user) return null;
  try{
    const snap=await getDoc(doc(db,"orders",orderId));
    if(snap.exists()){
      const data={id:snap.id,...snap.data()};
      if(data.uid && data.uid!==user.uid) return null;
      return data;
    }
  }catch(e){console.warn("Firebase order read failed:",e);}
  const local=read(KEY,[]); const found=local.find(x=>x.id===orderId);
  if(found && found.uid && found.uid!==user.uid) return null;
  return found||null;
}

async function orders(){
  const user=auth.currentUser; if(!user) return [];
  try{
    const snap=await getDocs(query(collection(db,"orders"),where("uid","==",user.uid)));
    return snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>{
      const stamp=v=>v?.toMillis?v.toMillis():Date.parse(String(v||""))||0;
      return stamp(b.createdAt)-stamp(a.createdAt);
    });
  }catch(e){
    console.warn("Firebase orders read failed:",e);
    return read(KEY,[]).filter(o=>!o.uid||o.uid===user.uid);
  }
}

async function adminOrders(){
  // Admin view must show both Firestore orders and the local cache used by
  // older orders. Never let a Firestore permission/index problem hide orders
  // that are already available locally.
  let remote=[];
  try{
    const snap=await withTimeout(getDocs(collection(db,"orders")),15000,"Firebase admin orders request");
    remote=snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){
    console.warn("Firebase admin order read failed:",e);
  }

  const local=read(KEY,[]);
  const merged=new Map();
  for(const item of local) if(item?.id) merged.set(item.id,item);
  for(const item of remote) if(item?.id) merged.set(item.id,{...(merged.get(item.id)||{}),...item});

  const list=[...merged.values()];
  list.sort((a,b)=>{
    const stamp=value=>{
      if(value?.toMillis) return value.toMillis();
      if(value instanceof Date) return value.getTime();
      if(typeof value==="number") return value;
      const parsed=Date.parse(String(value||""));
      return Number.isFinite(parsed)?parsed:0;
    };
    return stamp(b.updatedAt||b.createdAt)-stamp(a.updatedAt||a.createdAt);
  });
  return list;
}

async function notify(order,message){
  const user=auth.currentUser;
  const item={client:order.email||user?.email||"",clientName:order.client||"",uid:order.uid||user?.uid||"",orderId:order.id,message,time:new Date().toLocaleString()};
  let remoteSaved=false;
  try{
    await setDoc(doc(db,"orders",order.id,"notifications",String(Date.now())),{...item,createdAt:serverTimestamp()});
    remoteSaved=true;
  }catch(e){console.warn("Notification subcollection save failed:",e);}
  const notifications=read(NOTIFY,[]); notifications.push(item); write(NOTIFY,notifications);
  return remoteSaved;
}

async function notifications(orderList=[]){
  const user=auth.currentUser;
  if(!user) return [];
  const orders=Array.isArray(orderList)?orderList:[];
  const merged=new Map();

  // The order document is the reliable primary source. Admin status updates
  // write `lastNotification` together with the order, so customer rules only
  // need to permit access to the customer's own order.
  orders.forEach(o=>{
    if(!o?.id || String(o.uid||user.uid)!==String(user.uid)) return;
    const n=o?.lastNotification;
    if(n && String(n.uid||user.uid)===String(user.uid)){
      merged.set(String(o.id)+':last',{
        id:'last-'+String(o.id),
        orderId:o.id,
        ...n
      });
    }
  });

  // Also read the notification subcollection when available. A permission,
  // index, or older-document issue must never make the whole notifications
  // panel fail.
  for(const order of orders){
    const orderId=String(order?.id||'');
    if(!orderId || String(order?.uid||user.uid)!==String(user.uid)) continue;
    try{
      const snap=await getDocs(query(
        collection(db,"orders",orderId,"notifications"),
        orderBy("createdAt","desc"),
        limit(8)
      ));
      snap.forEach(d=>merged.set(orderId+':'+d.id,{id:d.id,orderId,...d.data()}));
    }catch(e){
      console.warn("Notification subcollection unavailable for",orderId,e);
    }
  }

  // Keep local notifications only as a compatibility fallback for older
  // sessions; never let malformed local data break the panel.
  let local=[];
  try{
    local=read(NOTIFY,[])
      .filter(n=>String(n?.uid||'')===String(user.uid))
      .map((n,i)=>({...n,id:n.id||'local-'+i}));
  }catch(e){
    local=[];
  }

  const all=[...merged.values(),...local];
  all.sort((a,b)=>{
    const stamp=v=>v?.toMillis?v.toMillis():Date.parse(String(v||''))||0;
    return stamp(b.createdAt||b.time)-stamp(a.createdAt||a.time);
  });
  return all.slice(0,12);
}
let resolveReady; const ready=new Promise(resolve=>resolveReady=resolve);
onAuthStateChanged(auth,user=>{resolveReady(user); window.dispatchEvent(new CustomEvent("graphics-auth-ready",{detail:{user}}));});

window.graphicsOrderFlow={read,write,session,account,save,get,adminGet,orders,adminOrders,notify,notifications,newId,uploadOrderFile,fileUrl,ready};
window.graphicsOrderFlowReady=ready;
window.dispatchEvent(new Event("graphics-order-flow-ready"));
