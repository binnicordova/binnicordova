// Smoke-test a deployed build. Run from the repository root:
//   node scrollcraft/builds/one-device/verify/live.mjs https://binnicordova.com/
import { chromium } from 'playwright-core';
const URL=process.argv[2]||'https://binnicordova.com/';
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
for(const [label,w,h] of [['desktop',1440,900],['phone',390,844]]){
  const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
  const errs=[],bad=[];
  p.on('pageerror',e=>errs.push(String(e)));
  p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  p.on('response',r=>{ if(r.status()>=400) bad.push(r.status()+' '+r.url()); });
  await p.goto(URL,{waitUntil:'load'});
  await p.waitForTimeout(2500);
  const track=await p.evaluate(()=>({sh:document.documentElement.scrollHeight, want:Math.round((11.3+1)*innerHeight)}));
  // walk the flight and confirm a real clip paints on every leg
  const seen=new Set();
  for(let t=0;t<=11.3;t+=0.4){
    await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.round(t*h));
    await p.waitForTimeout(300);
    const s=await p.evaluate(()=>[...document.querySelectorAll('[data-sc-segment]')]
      .map((g,i)=>({i,op:+getComputedStyle(g).opacity,painted:g.classList.contains('sc-has-clip')})));
    s.filter(x=>x.op>0.99&&x.painted).forEach(x=>seen.add(x.i));
  }
  await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  await p.waitForTimeout(600);
  const cta=await p.evaluate(()=>{const a=document.querySelector('.c--finale .cta');const cs=getComputedStyle(a.closest('[data-sc-copy]'));return {href:a.getAttribute('href'),vis:+cs.opacity,clickable:cs.pointerEvents};});
  console.log(`${label} ${w}x${h}`);
  console.log(`  track ${track.sh}px (want ${track.want}px) ${track.sh===track.want?'OK':'MISMATCH'}`);
  console.log(`  legs painted at full opacity: ${[...seen].sort().join(',')} (${seen.size}/6)`);
  console.log(`  finale CTA: ${cta.href} opacity ${cta.vis} pointer-events ${cta.clickable}`);
  console.log(`  console errors: ${errs.length?errs.join(' | '):'none'}`);
  console.log(`  failed requests: ${bad.length?bad.join(' | '):'none'}`);
  await p.close();
}
await b.close();
