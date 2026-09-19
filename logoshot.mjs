import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const p=await b.newPage({viewport:{width:1240,height:1000},deviceScaleFactor:1});
await p.goto('file:///private/tmp/claude-501/-Users-binnicordova-github-binnicordova/3636ba8d-9949-46fd-bd9a-ff022d85826a/scratchpad/preview/index.html',{waitUntil:'load'});
await p.waitForTimeout(1200);
await p.screenshot({path:'/private/tmp/claude-501/-Users-binnicordova-github-binnicordova/3636ba8d-9949-46fd-bd9a-ff022d85826a/scratchpad/logos-preview.png',fullPage:true});
// report any that failed to load or render with zero size
console.log(JSON.stringify(await p.evaluate(()=>[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src'))),null,0));
await b.close();
