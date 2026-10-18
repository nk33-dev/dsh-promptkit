import { writeFile } from 'node:fs/promises';

export async function connect(port = 19473) {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find(t => t.type === 'page' && /DeepSeek Harness/.test(t.title)) || targets.find(t => t.type === 'page');
  if (!target) throw new Error('No Harness page');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true}); });
  let sequence = 0; const pending = new Map(),events=[];
  socket.addEventListener('close',()=>{for(const item of pending.values()){clearTimeout(item.timer);item.reject(new Error('Harness closed'));}pending.clear();});
  socket.addEventListener('message',event=>{const packet=JSON.parse(event.data);if(packet.method)events.push(packet);if(packet.id&&pending.has(packet.id)){const{resolve,reject,timer}=pending.get(packet.id);clearTimeout(timer);pending.delete(packet.id);packet.error?reject(new Error(packet.error.message)):resolve(packet.result);}});
  function call(method, params = {}) { return new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`${method} timed out`));},120000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));}); }
  return {
    call,events,
    async evaluate(expression) { const response=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(response.exceptionDetails)throw new Error(response.exceptionDetails.exception?.description||response.exceptionDetails.text);return response.result.value; },
    async screenshot(path,clip) { const {data}=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,...clip?{clip}: {}});await writeFile(path,Buffer.from(data,'base64')); },
    close() { for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('Connection closed'));}pending.clear();socket.close(); },
  };
}
if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll('\\','/')}`).href) {
  const page=await connect();
  try { console.log(JSON.stringify(await page.evaluate(process.argv[2] || `({buttons:[...document.querySelectorAll('button')].map(b=>b.getAttribute('aria-label')||b.textContent).filter(Boolean), globals:Object.keys(window).filter(k=>/DSH|ModuleLoader/.test(k))})`),null,2)); }
  finally {page.close();}
}
