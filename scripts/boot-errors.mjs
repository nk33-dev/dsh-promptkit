import { connect } from './cdp.mjs';
const page=await connect();
try {
  await page.call('Runtime.enable'); await page.call('Log.enable');
  await new Promise(r=>setTimeout(r,300));
  for (const event of page.events) {
    if (event.method==='Runtime.exceptionThrown') console.log(event.params.exceptionDetails.exception?.description||event.params.exceptionDetails.text);
    if(event.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(event.params.type)) console.log(event.params.args.map(a=>a.description||a.value||'').join(' ').slice(0,2000));
    if(event.method==='Log.entryAdded'&&event.params.entry.level==='error') console.log(event.params.entry.text.slice(0,2000));
  }
} finally {page.close();}
