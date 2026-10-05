(function(){
  const DB='graphicsInvitationStoreV2';
  const FILES='files';
  const KEY='graphicsWeddingInvitationsV1';
  function openDB(){return new Promise((resolve,reject)=>{try{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(FILES))db.createObjectStore(FILES)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('Invitation storage could not open'));}catch(e){reject(e)}})}
  async function putFile(ref,blob){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(FILES,'readwrite');tx.objectStore(FILES).put(blob,ref);tx.oncomplete=()=>resolve(ref);tx.onerror=()=>reject(tx.error||new Error('Screenshot upload failed'))})}
  async function getFile(ref){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(FILES,'readonly');const r=tx.objectStore(FILES).get(ref);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}
  async function delFile(ref){try{const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(FILES,'readwrite');tx.objectStore(FILES).delete(ref);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}catch(e){}}
  function readMeta(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return []}}
  function writeMeta(list){localStorage.setItem(KEY,JSON.stringify(list));localStorage.setItem('graphicsWeddingInvitationsSignal',String(Date.now()));}
  async function all(){return readMeta()}
  async function save(list){writeMeta(list);return list}
  async function migrate(){return readMeta()}
  window.graphicsInvitationStore={all,save,putFile,getFile,delFile,migrate,signal:function(){try{localStorage.setItem('graphicsWeddingInvitationsSignal',String(Date.now()))}catch(e){}}};
})();
