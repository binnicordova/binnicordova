import { chromium } from 'playwright-core';
const CH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const b=await chromium.launch({executablePath:CH,headless:true});
let pass=0,fail=0; const ok=(n,c,note='')=>{c?pass++:fail++;console.log(`  ${c?'PASS':'FAIL'}  ${n}${note?'  '+note:''}`)};

// ---------- motion on ----------
{
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:4510/',{waitUntil:'load'}); await p.waitForTimeout(1500);
const vh=900, W=[1.5,1.5,3.2,1.8,1.8,1.5]; let c=0; const starts=W.map(w=>{const s=c;c+=w;return s;});

// copy transform cap: translateY must stay inside +/-2vh across every window
let maxY=0;
for(let t=0;t<=11.3;t+=0.15){
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.round(t*vh));
  await p.waitForTimeout(60);
  const m=await p.evaluate(()=>Math.max(...[...document.querySelectorAll('[data-sc-copy]')]
    .map(e=>Math.abs(new DOMMatrixReadOnly(getComputedStyle(e).transform).m42))));
  if(m>maxY)maxY=m;
}
ok('copy translate stays inside the 4vh cap', maxY<=vh*0.02+1, `worst ${maxY.toFixed(1)}px of ${vh*0.02}px allowed`);

// seam is one-sided: the outgoing leg holds at 1 until the incoming covers it
const seamT=starts[3]; const rows=[];
for(let d=-0.12;d<=0.12;d+=0.02){
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.round((seamT+d)*vh));
  await p.waitForTimeout(140);
  rows.push(await p.evaluate(()=>[...document.querySelectorAll('[data-sc-segment]')].map(s=>+(+getComputedStyle(s).opacity).toFixed(3))));
}
const outHolds=rows.every(r=>r[2]>0.99||r[3]>0.99);
const inRises=rows.map(r=>r[3]); const mono=inRises.every((v,i)=>i===0||v>=inRises[i-1]-0.02);
ok('seam never drops both legs at once (no flash of page ground)', outHolds, rows.map(r=>`${r[2]}/${r[3]}`).join(' '));
ok('incoming leg rises monotonically across the seam', mono);

// camera + playhead both converge after a jump
// Jump inside a stretch where cz is monotonic, so overshoot is separable from
// the camera legitimately flying past the glass and back on its way there.
await p.evaluate(()=>scrollTo({top:Math.round(0.2*900),behavior:'instant'})); await p.waitForTimeout(900);
await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.round(1.3*900));
const samples=await p.evaluate(()=>new Promise(res=>{const s=[];let n=0;(function f(){
  s.push(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cz')));
  if(++n<90)requestAnimationFrame(f); else res(s);})();}));
const tail=samples.slice(-12); const spread=Math.max(...tail)-Math.min(...tail);
const overshoot=Math.max(...samples)>Math.max(...tail)+2;
ok('camera lerp converges', spread<0.5, `last-12 spread ${spread.toFixed(3)}px`);
ok('camera lerp does not overshoot its target', !overshoot);
await p.close();
}

// ---------- reduced motion ----------
{
const ctx=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
const p=await ctx.newPage();
const fetched=[]; p.on('request',r=>{ if(/\.mp4/.test(r.url())) fetched.push(r.url()); });
await p.goto('http://localhost:4510/',{waitUntil:'load'}); await p.waitForTimeout(1200);
for(const t of [0,3,5.4,8,11]){ await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.round(t*900)); await p.waitForTimeout(400); }
ok('reduced motion fetches no clip', fetched.length===0, fetched.length?fetched.join(','):'0 mp4 requests');
const st=await p.evaluate(()=>{
  const cs=getComputedStyle(document.documentElement);
  const posterVisible=[...document.querySelectorAll('.sc-world__poster')].some(i=>+getComputedStyle(i).opacity>0.5);
  const strata=[...document.querySelectorAll('.stratum')].map(s=>+(+getComputedStyle(s).opacity).toFixed(2));
  const rig=getComputedStyle(document.querySelector('.rig')).transform;
  const por=+getComputedStyle(document.querySelector('.portrait')).opacity;
  const copyT=[...document.querySelectorAll('[data-sc-copy]')].map(e=>getComputedStyle(e).transform);
  return {posterVisible,strata,rig,por,copyNone:copyT.every(t=>t==='none')};
});
ok('reduced motion still shows a painted poster', st.posterVisible);
ok('reduced motion holds the exploded stack (all six planes present)', st.strata.every(v=>v>0.5), st.strata.join(','));
ok('reduced motion shows the portrait', st.por>0.9);
ok('reduced motion drops every copy transform', st.copyNone);
await ctx.close();
}
console.log(`\n${pass} passed, ${fail} failed`);
await b.close();
process.exit(fail?1:0);
