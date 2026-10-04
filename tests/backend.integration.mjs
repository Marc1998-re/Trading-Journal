import {execFileSync,spawn} from 'node:child_process';
import {mkdtempSync,writeFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import net from 'node:net';
import assert from 'node:assert/strict';

const binary=process.env.POCKETBASE_TEST_BINARY;
if(!binary)throw new Error('Set POCKETBASE_TEST_BINARY to a PocketBase 0.40.4 executable.');
mkdirSync('/private/tmp/journal-qa',{recursive:true});
const root=fileURLToPath(new URL('../apps/pocketbase/',import.meta.url));
const dir=mkdtempSync(join(tmpdir(),'journal-integration-'));
const flags=['--dir='+dir,'--migrationsDir='+root+'pb_migrations','--hooksDir='+root+'pb_hooks'];
const env={...process.env,APP_URL:'http://127.0.0.1:4173',PB_SUPERUSER_EMAIL:'',PB_SUPERUSER_PASSWORD:''};
const password=randomBytes(24).toString('hex');
execFileSync(binary,['migrate','up',...flags],{env,stdio:'pipe'});
execFileSync(binary,['migrate','up',...flags],{env,stdio:'pipe'});
execFileSync(binary,['superuser','upsert','qa-admin@example.test',password,...flags],{env,stdio:'pipe'});
const mails=[];
const smtp=net.createServer(socket=>{
 let input='',data=false,body='';socket.write('220 localhost SMTP\r\n');
 socket.on('data',chunk=>{input+=chunk.toString();let idx;while((idx=input.indexOf('\r\n'))>=0){const line=input.slice(0,idx);input=input.slice(idx+2);if(data){if(line==='.') {mails.push(body);body='';data=false;socket.write('250 accepted\r\n');}else body+=line+'\r\n';}else if(/^EHLO|^HELO/i.test(line))socket.write('250-localhost\r\n250 SIZE 1000000\r\n');else if(/^DATA/i.test(line)){data=true;socket.write('354 Send content\r\n');}else if(/^QUIT/i.test(line)){socket.end('221 bye\r\n');}else socket.write('250 OK\r\n');}});
});
await new Promise(r=>smtp.listen(2526,'127.0.0.1',r));
const child=spawn(binary,['serve','--http=127.0.0.1:8099',...flags],{env,stdio:['ignore','pipe','pipe']});
let logs='';child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const base='http://127.0.0.1:8099/api';
async function request(path,body,token,method='POST'){
 const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:token}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const text=await response.text();return {status:response.status,data:text?JSON.parse(text):null};
}
async function mailToken(index,route){for(let i=0;i<100&&mails.length<=index;i++)await delay(100);assert.ok(mails[index],'SMTP received message');const decoded=mails[index].replace(/=\r\n/g,'').replace(/=([A-Fa-f0-9]{2})/g,(_,hex)=>String.fromCharCode(parseInt(hex,16)));assert.ok(decoded.includes('The Trading Desk'));const match=decoded.match(new RegExp(route+'\\?token=([^\\s"<>]+)'));assert.ok(match,'Correct action link in actual SMTP message');return decodeURIComponent(match[1]);}
try {
 for(let i=0;i<100;i++){try{const r=await fetch(base+'/health');if(r.ok)break;}catch{}await delay(100);}
 const admin=await request('/collections/_superusers/auth-with-password',{identity:'qa-admin@example.test',password});assert.equal(admin.status,200);
 const settings=await request('/settings',{meta:{appName:'QA Journal',appUrl:'http://127.0.0.1:4173',senderName:'QA',senderAddress:'noreply@example.test'},smtp:{enabled:true,host:'127.0.0.1',port:2526,username:'',password:'',tls:false,authMethod:'PLAIN'}},admin.data.token,'PATCH');assert.equal(settings.status,200,JSON.stringify(settings.data));
 const email='qa-trader@example.test';
 const signup=await request('/collections/users/records',{email,password,passwordConfirm:password,name:'QA Trader',verified:false});assert.equal(signup.status,200,JSON.stringify(signup.data));
 const blocked=await request('/collections/users/auth-with-password',{identity:email,password});assert.equal(blocked.status,403,JSON.stringify(blocked.data));
 const verify=await request('/collections/users/request-verification',{email});assert.equal(verify.status,204,JSON.stringify(verify.data));
 const token=await mailToken(0,'/verify-pending');
 assert.equal((await request('/collections/users/confirm-verification',{token})).status,204);
 const auth=await request('/collections/users/auth-with-password',{identity:email,password});assert.equal(auth.status,200);assert.equal(auth.data.record.verified,true);
 const account=await request('/collections/tradingAccounts/records',{accountName:'QA Konto',startingBalance:10000,status:'active',userId:signup.data.id},auth.data.token);assert.equal(account.status,200,JSON.stringify(account.data));
 const trade=await request('/collections/trades/records',{userId:signup.data.id,accountId:account.data.id,symbol:'EUR/USD',date:'2026-08-12',entryDate:'2026-08-12',entryTime:'09:30',profitLoss:200,riskAmount:100,fees:4,rrSecured:2,stopLoss:1,setup:'QA Setup',side:'long',status:'Win'},auth.data.token);assert.equal(trade.status,200,JSON.stringify(trade.data));assert.equal(trade.data.riskAmount,100);
 const review=await request('/collections/trades/records/'+trade.data.id,{notes:'Plan eingehalten.'},auth.data.token,'PATCH');assert.equal(review.status,200);assert.equal(review.data.notes,'Plan eingehalten.');
 assert.equal(review.data.reviewStatus,'');
 const reviewPath='/collections/trades/records/'+trade.data.id;
 const invalidReview=await request(reviewPath,{reviewStatus:'completed',reviewLesson:' ',reviewAction:'Next'},auth.data.token,'PATCH');assert.equal(invalidReview.status,400);
 const unchanged=await request(reviewPath,null,auth.data.token,'GET');assert.equal(unchanged.data.notes,'Plan eingehalten.');assert.equal(unchanged.data.reviewStatus,'');
 const invalidTag=await request(reviewPath,{reviewTags:['not-a-tag']},auth.data.token,'PATCH');assert.equal(invalidTag.status,400);
 const draft=await request(reviewPath,{reviewStatus:'draft',reviewSetup:'yes',reviewRisk:'no',reviewTags:['plan','risk'],reviewLesson:'Lesson',reviewAction:'',reviewCompletedAt:'2000-01-01 00:00:00.000Z'},auth.data.token,'PATCH');assert.equal(draft.status,200,JSON.stringify(draft.data));assert.equal(draft.data.reviewCompletedAt,'');
 const completed=await request(reviewPath,{reviewStatus:'completed',reviewAction:' Check risk before entry ',reviewLesson:' Size first ',reviewCompletedAt:'2000-01-01 00:00:00.000Z'},auth.data.token,'PATCH');assert.equal(completed.status,200,JSON.stringify(completed.data));assert.equal(completed.data.reviewAction,'Check risk before entry');assert.equal(completed.data.reviewLesson,'Size first');assert.ok(Math.abs(Date.now()-Date.parse(completed.data.reviewCompletedAt))<10000);assert.deepEqual(completed.data.reviewTags,['plan','risk']);assert.equal(completed.data.notes,'Plan eingehalten.');
 const stamp=completed.data.reviewCompletedAt;
 const amended=await request(reviewPath,{reviewAction:'Risk checklist',reviewCompletedAt:'2000-01-01 00:00:00.000Z'},auth.data.token,'PATCH');assert.equal(amended.data.reviewCompletedAt,stamp);
 const anonymous=await request(reviewPath,{reviewAction:'Unauthorized'},null,'PATCH');assert.notEqual(anonymous.status,200);
 const reopened=await request(reviewPath,{reviewStatus:'draft'},auth.data.token,'PATCH');assert.equal(reopened.status,200);assert.equal(reopened.data.reviewCompletedAt,'');assert.equal(reopened.data.reviewLesson,'Size first');
 const spoof=await request('/collections/trades/records',{userId:'someone-else',accountId:account.data.id,symbol:'BAD'},auth.data.token);assert.notEqual(spoof.status,200);
 const elevation=await request('/collections/users/records',{email:'bad@example.test',password,passwordConfirm:password,verified:true});assert.notEqual(elevation.status,200);
 const reset=await request('/collections/users/request-password-reset',{email});assert.equal(reset.status,204);
 const resetToken=await mailToken(1,'/reset-password');const nextPassword=randomBytes(24).toString('hex');
 assert.equal((await request('/collections/users/confirm-password-reset',{token:resetToken,password:nextPassword,passwordConfirm:nextPassword})).status,204);
 assert.equal((await request('/collections/users/auth-with-password',{identity:email,password:nextPassword})).status,200);
 console.log('PASS: repeatable fresh migrations; signup and verified login; local SMTP verification/reset; legacy notes; review draft, completion, validation, timestamps and reopening; unauthorized writes blocked; ownership protection.');
 writeFileSync('/private/tmp/journal-qa/backend-results.txt','PASS: auth, local mail and structured-review integration checks with isolated PocketBase 0.40.4.\n');
}catch(error){writeFileSync('/private/tmp/journal-qa/backend-error.log',logs);throw error;}
finally{child.kill('SIGTERM');await new Promise(r=>child.once('close',r));await new Promise(r=>smtp.close(r));}
