import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('https://binnicordova.com/',{waitUntil:'load'});
await p.waitForTimeout(2000);
// park inside the peak and give the biggest clip time to arrive
await p.evaluate(()=>scrollTo({top:Math.round(4.0*innerHeight),behavior:'instant'}));
for(const wait of [1000,2000,3000,5000,8000]){
  await p.waitForTimeout(wait===1000?wait:wait-  (wait/2));
  const s=await p.evaluate(()=>{
    const g=document.querySelectorAll('[data-sc-segment]')[2];
    const v=g.querySelector('video');
    return {op:+getComputedStyle(g).opacity, painted:g.classList.contains('sc-has-clip'),
            rs:v.readyState, t:+(v.currentTime||0).toFixed(2), buffered:v.buffered.length?+v.buffered.end(0).toFixed(1):0};
  });
  console.log(`  +${wait}ms  op=${s.op} painted=${s.painted} readyState=${s.rs} t=${s.t}s buffered=${s.buffered}s`);
  if(s.painted) break;
}
await b.close();
