import {spawn} from 'node:child_process';
import {openSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
mkdirSync('/private/tmp/journal-qa',{recursive:true});
const log=openSync('/private/tmp/journal-qa/vite.log','a');
const child=spawn(process.execPath,[root+'node_modules/vite/bin/vite.js',...(process.env.JOURNAL_PREVIEW_BUILD?['preview']:[]),'--host','127.0.0.1','--port',process.env.PORT||'4173'],{cwd:root+'apps/web',detached:true,stdio:['ignore',log,log]});
child.unref();
console.log('Preview PID: '+child.pid+'. The actual free port is printed in /private/tmp/journal-qa/vite.log.');
