import { chromium } from 'playwright-core';
const CH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W=+(process.argv[2]||1440), H=+(process.argv[3]||900);
const b=await chromium.launch({executablePath:CH,headless:true});
const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:1});
await p.goto('http://localhost:4510/',{waitUntil:'load'}); await p.waitForTimeout(1500);

const lum=(r,g,b)=>{const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)};
const ratio=(a,c)=>{const [x,y]=a>c?[a,c]:[c,a];return (x+0.05)/(y+0.05)};

// Sample densely through the whole flight and keep the WORST reading per line.
const worst=new Map();
for(let t=0;t<=13.1;t+=0.3){
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.round(t*H));
  await p.waitForTimeout(260);
  const lines=await p.evaluate(()=>{
    const out=[];
    document.querySelectorAll('[data-sc-copy]').forEach(blk=>{
      if(+getComputedStyle(blk).opacity < 0.55) return;
      blk.querySelectorAll('h1,h2,p,dt,dd,a').forEach(el=>{
        const txt=(el.textContent||'').trim(); if(!txt) return;
        // Skip anything that paints its own ground (the CTA pill): what is
        // behind it is not what its text is read against.
        const bg=getComputedStyle(el).backgroundColor;
        if(bg && bg!=='rgba(0, 0, 0, 0)' && bg!=='transparent') return;
        // Per-line glyph rects, not the element box. A block-level <p> spans the
        // whole column even when its text is six words long, and measuring that
        // box samples whatever the layout happens to sit next to.
        const rng=document.createRange(); rng.selectNodeContents(el);
        for(const r of rng.getClientRects()){
          if(r.width<4||r.height<4||r.bottom<0||r.top>innerHeight) continue;
          out.push({t:txt.slice(0,38), c:getComputedStyle(el).color,
                    x:Math.max(0,r.left),y:Math.max(0,r.top),
                    w:Math.min(r.width,innerWidth-r.left),h:Math.min(r.height,innerHeight-r.top)});
        }
      });
    });
    return out;
  });
  if(!lines.length) continue;
  await p.evaluate(()=>document.querySelectorAll('[data-sc-copy]').forEach(e=>e.style.visibility='hidden'));
  const shot=await p.screenshot({type:'png',timeout:120000});
  await p.evaluate(()=>document.querySelectorAll('[data-sc-copy]').forEach(e=>e.style.visibility=''));
  const px=await p.evaluate(async ({b64,lines})=>{
    const img=new Image(); img.src='data:image/png;base64,'+b64; await img.decode();
    const cv=document.createElement('canvas'); cv.width=img.width; cv.height=img.height;
    const cx=cv.getContext('2d'); cx.drawImage(img,0,0);
    const sx=img.width/innerWidth, sy=img.height/innerHeight;
    return lines.map(L=>{
      const d=cx.getImageData(Math.round(L.x*sx),Math.round(L.y*sy),Math.max(1,Math.round(L.w*sx)),Math.max(1,Math.round(L.h*sy))).data;
      let best=null;
      for(let i=0;i<d.length;i+=4*7){ // brightest patch: light type fails there
        const v=d[i]*0.2126+d[i+1]*0.7152+d[i+2]*0.0722;
        if(!best||v>best.v) best={v,r:d[i],g:d[i+1],bl:d[i+2]};
      }
      return {t:L.t,c:L.c,bg:best};
    });
  },{b64:shot.toString('base64'),lines});
  for(const r of px){
    const m=/(\d+),\s*(\d+),\s*(\d+)/.exec(r.c); if(!m||!r.bg) continue;
    const cr=ratio(lum(+m[1],+m[2],+m[3]), lum(r.bg.r,r.bg.g,r.bg.bl));
    const prev=worst.get(r.t);
    if(!prev||cr<prev.cr) worst.set(r.t,{cr,at:t});
  }
}
const rows=[...worst.entries()].sort((a,c)=>a[1].cr-c[1].cr);
console.log(`viewport ${W}x${H}`);
for(const [t,v] of rows.slice(0,10)) console.log(`  ${v.cr.toFixed(2)}:1  @${v.at.toFixed(2)}vh  "${t}"`);
const bad=rows.filter(r=>r[1].cr<4.5).length;
console.log(bad?`\n${bad} line(s) under 4.5:1`:'\nall lines clear 4.5:1');
await b.close();
