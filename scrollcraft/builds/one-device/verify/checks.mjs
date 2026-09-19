import { chromium } from 'playwright-core';
const CH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const b=await chromium.launch({executablePath:CH,headless:true});
let pass=0,fail=0; const ok=(n,c,note='')=>{c?pass++:fail++;console.log(`  ${c?'PASS':'FAIL'}  ${n}${note?'  '+note:''}`)};

// ---------- motion on ----------
{
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:4510/',{waitUntil:'load'}); await p.waitForTimeout(1500);
const vh=900, W=[1.5,1.5,1.2,1.6,3.4,2.2,1.8,1.5]; const TOTAL=W.reduce((a,b)=>a+b,0);
let c=0; const starts=W.map(w=>{const s=c;c+=w;return s;});

// copy transform cap: translateY must stay inside +/-2vh across every window
let maxY=0;
for(let t=0;t<=TOTAL;t+=0.2){
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.round(t*vh));
  await p.waitForTimeout(60);
  const m=await p.evaluate(()=>Math.max(...[...document.querySelectorAll('[data-sc-copy]')]
    .map(e=>Math.abs(new DOMMatrixReadOnly(getComputedStyle(e).transform).m42))));
  if(m>maxY)maxY=m;
}
ok('copy translate stays inside the 4vh cap', maxY<=vh*0.02+1, `worst ${maxY.toFixed(1)}px of ${vh*0.02}px allowed`);

// Every copy block must actually reach full opacity somewhere. A window whose
// plateau is shorter than the reader's scroll step is a block nobody ever sees
// at full strength, and it looks like a design choice rather than a bug: the
// GPI note shipped at a peak of 0.32 before this check existed.
{
  const peak = new Map();
  for (let t = 0; t <= TOTAL; t += 0.1) {
    // Scroll, then wait two animation frames before reading. The engine writes
    // copy opacity from a rAF callback, so reading straight after scrollTo
    // catches the previous frame's value and reports a block that does reach
    // full opacity as one that never does. That false negative is worse than
    // no check at all, which is why the wait is explicit rather than a sleep.
    await p.evaluate(y => {
      scrollTo({ top: y, behavior: 'instant' });
      return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, Math.round(t * vh));
    const rows = await p.evaluate(() => [...document.querySelectorAll('[data-sc-copy]')]
      .map(e => [ (e.textContent || '').trim().slice(0, 34), +getComputedStyle(e).opacity ]));
    for (const [k, o] of rows) if (!(peak.get(k) >= o)) peak.set(k, o);
  }
  const weak = [...peak.entries()].filter(([, o]) => o < 0.99);
  ok('every copy block reaches full opacity', weak.length === 0,
     weak.length ? weak.map(([k, o]) => `${o.toFixed(2)} "${k}"`).join(' | ')
                 : `${peak.size} blocks, all peak at 1.00`);
}

// seam is one-sided: the outgoing leg holds at 1 until the incoming covers it
const seamT=starts[5]; const rows=[];
for(let d=-0.12;d<=0.12;d+=0.02){
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.round((seamT+d)*vh));
  await p.waitForTimeout(140);
  rows.push(await p.evaluate(()=>[...document.querySelectorAll('[data-sc-segment]')].map(s=>+(+getComputedStyle(s).opacity).toFixed(3))));
}
const outHolds=rows.every(r=>r[4]>0.99||r[5]>0.99);
const inRises=rows.map(r=>r[5]); const mono=inRises.every((v,i)=>i===0||v>=inRises[i-1]-0.02);
ok('seam never drops both legs at once (no flash of page ground)', outHolds, rows.map(r=>`${r[4]}/${r[5]}`).join(' '));
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

// ---------- the clip never hides the app ----------
// Binni photographed a black phone screen, twice. The cause was a <video> with
// no presented frame: on iOS it paints OPAQUE BLACK over its own poster while
// reporting readyState 4 and no error, and `opacity: 0` does not take it out of
// the composite. world.css therefore parks every clip at 2x4px until world.js
// has proved a real frame exists. These checks hold both ends of that deal:
// the clip must still be promoted where decoding works, and where it does not
// the app's own frame must be on screen instead of a black rectangle.
{
for (const [vw, vh, name] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4510/', { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const seen = [];
  for (const t of [0.6, 2.4, 6.0, 10.5]) {
    await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), Math.round(t * vh));
    await p.waitForTimeout(2600);
    seen.push(await p.evaluate(() => {
      const segs = [...document.querySelectorAll('.phone__screen [data-sc-segment]')];
      const act = segs.find(e => +getComputedStyle(e).opacity > 0.9) || segs[0];
      const v = act.querySelector('video');
      return { live: act.classList.contains('clip-live'), w: v.getBoundingClientRect().width };
    }));
  }
  ok(`clip is promoted where the decoder works (${name})`,
     seen.every(s => s.live), seen.map(s => s.live ? 'live' : 'PARKED').join(' '));
  await ctx.close();
}

// And the failure Binni actually hit: the clip cannot be decoded at all.
for (const [vw, vh, name] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh } });
  const p = await ctx.newPage();
  await p.route('**/*.mp4', r => r.abort());
  await p.goto('http://localhost:4510/', { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), Math.round(2.4 * vh));
  await p.waitForTimeout(4000);
  const st = await p.evaluate(() => {
    const segs = [...document.querySelectorAll('.phone__screen [data-sc-segment]')];
    const act = segs.find(e => +getComputedStyle(e).opacity > 0.9) || segs[0];
    const img = act.querySelector('img'), v = act.querySelector('video');
    const vr = v.getBoundingClientRect();
    return {
      posterOp: +getComputedStyle(img).opacity,
      posterPainted: img.complete && img.naturalWidth > 0,
      clipBox: Math.round(vr.width * vr.height),
      live: act.classList.contains('clip-live')
    };
  });
  ok(`a clip that cannot decode never takes the screen (${name})`,
     !st.live && st.clipBox < 200, `clip box ${st.clipBox}px2, live=${st.live}`);
  ok(`the app's own frame holds the screen instead (${name})`,
     st.posterOp > 0.99 && st.posterPainted, `poster opacity ${st.posterOp}`);
  await ctx.close();
}
}

// ---------- reduced motion ----------
{
const ctx=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
const p=await ctx.newPage();
const fetched=[]; p.on('request',r=>{ if(/\.mp4/.test(r.url())) fetched.push(r.url()); });
await p.goto('http://localhost:4510/',{waitUntil:'load'}); await p.waitForTimeout(1200);
for(const t of [0,3,6,8.8,11,13,14.5]){ await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.round(t*900)); await p.waitForTimeout(400); }
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
