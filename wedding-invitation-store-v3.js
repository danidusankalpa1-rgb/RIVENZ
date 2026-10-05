(function(){
  const DB='graphicsWeddingInvitationStoreV3', STORE='files';
  function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('Invitation storage unavailable'));});}
  async function put(ref,file){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(file,ref);tx.oncomplete=()=>resolve(ref);tx.onerror=()=>reject(tx.error||new Error('Screenshot upload failed'));});}
  async function get(ref){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const r=tx.objectStore(STORE).get(ref);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}
  async function del(ref){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(ref);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
  window.graphicsWeddingInvitationStoreV3={put,get,del};
})();
