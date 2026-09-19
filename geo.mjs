import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const p=await b.newPage({viewport:{width:390,height:844}});
await p.goto('http://localhost:4510/',{waitUntil:'load'}); await p.waitForTimeout(1800);
await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.round(10.8*844));
await p.waitForTimeout(600);
console.log(JSON.stringify(await p.evaluate(()=>{
  const blk=[...document.querySelectorAll('[data-sc-copy]')].find(e=>(e.textContent||'').includes('Agents work'));
  const r=blk.getBoundingClientRect();
  const rows=[...blk.querySelectorAll('p,h2,li')].map(e=>{const q=e.getBoundingClientRect();
    return {t:(e.textContent||'').trim().slice(0,26), top:Math.round(q.top), pct:+(q.top/innerHeight*100).toFixed(1)};});
  return {vh:innerHeight, blockTop:Math.round(r.top), blockH:Math.round(r.height), rows};
}),null,1));
await b.close();
