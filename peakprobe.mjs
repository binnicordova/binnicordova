import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:4510/',{waitUntil:'load'}); await p.waitForTimeout(2000);
console.log('t(vh)  hero   cocaCola');
for(const t of [0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,1.1,1.2,1.3]){
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.round(t*900));
  await p.waitForTimeout(260);                         // let the engine settle
  const r=await p.evaluate(()=>{
    const b=[...document.querySelectorAll('[data-sc-copy]')];
    const g=s=>{const e=b.find(x=>(x.textContent||'').includes(s)); return e?+(+getComputedStyle(e).opacity).toFixed(3):null;};
    return {hero:g('Open to Senior'), cc:g('miMarket')};
  });
  console.log(`${t.toFixed(2)}   ${String(r.hero).padEnd(6)} ${r.cc}`);
}
await b.close();
