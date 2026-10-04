import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire(process.env.JOURNAL_QA_RUNTIME+'/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
const output='/private/tmp/journal-qa';
mkdirSync(output,{recursive:true});
const errors=[],results=[];
const routes=['/demo','/demo/trades','/demo/analysis','/demo/charts','/demo/review','/','/login','/signup','/verify-pending','/reset-password'];
for(const width of [1440,390,768]){
 const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push({width,error:e.message}));
 for(const route of routes){
  await page.goto('http://127.0.0.1:4173'+route,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth,h1:document.querySelector('h1')?.textContent,brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)}));
  results.push({width,route,...dimensions});
  await page.screenshot({path:output+'/'+width+route.replaceAll('/','-')+'.png',fullPage:true});
  if(width===1440&&route==='/demo')await page.screenshot({path:new URL('../apps/web/public/assets/journal-preview.png',import.meta.url).pathname});
 }
 await page.goto('http://127.0.0.1:4173/demo/trades');
 await page.getByRole('textbox',{name:'Trades durchsuchen'}).fill('EUR/USD');
 await page.waitForTimeout(100);
 const symbols=await page.locator('tbody tr td:first-child strong').allTextContents();
 if(!symbols.length||symbols.some(s=>s!=='EUR/USD'))errors.push({width,error:'Symbol search failed'});
 await page.getByRole('textbox',{name:'Trades durchsuchen'}).fill('no-match');
 if(!await page.getByText('Keine Trades in dieser Auswahl').isVisible())errors.push({width,error:'Empty filter failed'});
 await page.goto('http://127.0.0.1:4173/demo');
 await page.getByRole('button',{name:'Vorheriger Monat'}).click();
 if(!await page.getByText('Juli 2026',{exact:true}).first().isVisible())errors.push({width,error:'Month navigation failed'});
 await page.close();
}
writeFileSync(output+'/browser-results.json',JSON.stringify({results,errors},null,2));
console.log(JSON.stringify({results,errors},null,2));
await browser.close();
if(errors.length||results.some(r=>r.scroll>r.viewport||!r.h1||r.brokenImages.length))process.exitCode=1;
