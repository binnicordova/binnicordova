import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
for(const [w,h] of [[390,844],[1440,900]]){
  const p=await b.newPage({viewport:{width:w,height:h}});
  await p.goto('http://localhost:4510/',{waitUntil:'load'}); await p.waitForTimeout(1500);
  const hero=await p.evaluate(()=>{const e=[...document.querySelectorAll('[data-sc-copy]')].find(x=>(x.textContent||'').includes('Binni Cordova'));
    const r=e.getBoundingClientRect(); return {top:Math.round(r.top), pct:+(r.top/innerHeight*100).toFixed(1), h:Math.round(r.height)};});
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.round(14.5*h));
  await p.waitForTimeout(700);
  const fin=await p.evaluate(()=>{const e=[...document.querySelectorAll('[data-sc-copy]')].find(x=>(x.textContent||'').includes("build the next one"));
    const r=e.getBoundingClientRect(); return {top:Math.round(r.top), pct:+(r.top/innerHeight*100).toFixed(1), h:Math.round(r.height), bottom:Math.round(r.bottom)};});
  console.log(`${w}x${h}  hero top ${hero.pct}% h${hero.h}   finale top ${fin.pct}% h${fin.h} bottom ${fin.bottom}/${h}`);
  await p.close();
}
await b.close();
