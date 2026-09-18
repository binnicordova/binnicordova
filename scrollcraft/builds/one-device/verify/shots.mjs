// Grab a handful of scroll positions at a given viewport, for eyeballing.
// node scrollcraft/builds/one-device/verify/shots.mjs <w> <h> <outdir> <t...>
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [w,h,out,...ts]=process.argv.slice(2);
fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const p=await b.newPage({viewport:{width:+w,height:+h},deviceScaleFactor:1});
await p.goto('http://localhost:4510/',{waitUntil:'load'}); await p.waitForTimeout(1500);
let i=0;
for(const t of ts){
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.round(parseFloat(t)*(+h)));
  await p.waitForTimeout(700);
  await p.screenshot({path:`${out}/${String(i++).padStart(2,'0')}-${t}.png`,timeout:120000});
}
console.log('shots in',out);
await b.close();
