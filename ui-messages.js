(function(){
  if(document.getElementById('gxMessageStyle'))return;
  const style=document.createElement('style');style.id='gxMessageStyle';style.textContent=`
  .gx-message-backdrop{position:fixed;inset:0;z-index:999999;display:grid;place-items:center;padding:22px;background:rgba(0,0,0,.68);backdrop-filter:blur(7px);animation:gxFade .18s ease both}
  .gx-message-box{width:min(520px,calc(100vw - 36px));background:#101216;border:1px solid rgba(255,255,255,.12);border-radius:22px;box-shadow:0 28px 90px rgba(0,0,0,.62);padding:30px 28px 24px;color:#fff;text-align:center;animation:gxPop .2s ease both}
  .gx-message-icon{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;margin:0 auto 15px;font-size:27px;font-weight:800;background:rgba(120,160,255,.1);color:#b9cbff}
  .gx-message-box.ok{border-color:rgba(76,210,150,.35)}.gx-message-box.err{border-color:rgba(255,92,92,.35)}
  .gx-message-box.ok .gx-message-icon{background:rgba(76,210,150,.13);color:#67e3ad}.gx-message-box.err .gx-message-icon{background:rgba(255,92,92,.13);color:#ff8b8b}
  .gx-message-title{font-size:20px;font-weight:800;letter-spacing:-.025em;margin-bottom:8px}.gx-message-text{font-size:13px;line-height:1.65;color:#a8abb2;white-space:pre-wrap}.gx-message-close{margin-top:20px;border:0;border-radius:10px;padding:11px 24px;background:#f4f4f1;color:#08090b;font-size:11px;font-weight:800;cursor:pointer}
  @keyframes gxFade{from{opacity:0}to{opacity:1}}@keyframes gxPop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
  `;document.head.appendChild(style);
  function show(message,type){
    const old=document.querySelector('.gx-message-backdrop');if(old)old.remove();
    const bad=type==='err', good=type==='ok';
    const back=document.createElement('div');back.className='gx-message-backdrop';
    const box=document.createElement('div');box.className='gx-message-box '+(bad?'err':good?'ok':'info');
    const icon=document.createElement('div');icon.className='gx-message-icon';icon.textContent=good?'✓':bad?'!':'i';
    const title=document.createElement('div');title.className='gx-message-title';title.textContent=good?'Success':bad?'Something went wrong':'Notice';
    const text=document.createElement('div');text.className='gx-message-text';text.textContent=String(message||'');
    const close=document.createElement('button');close.type='button';close.className='gx-message-close';close.textContent='Continue';
    close.onclick=()=>back.remove();back.addEventListener('click',e=>{if(e.target===back)back.remove()});
    box.append(icon,title,text,close);back.appendChild(box);document.body.appendChild(back);
  }
  window.graphicsMessage={success:m=>show(m,'ok'),error:m=>show(m,'err'),info:m=>show(m,'info')};
  window.alert=function(message){const text=String(message||'');const bad=/failed|could not|error|invalid|unable|please choose|please enter|not found|full|skipped|smaller than|only after|no valid/i.test(text);const good=/success|saved|added|sent|submitted|approved|confirmed|removed|deleted|updated/i.test(text);show(text,bad?'err':good?'ok':'info')};
})();
