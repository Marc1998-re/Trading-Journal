import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
 plugins:[react()],
 resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},
 server:{host:'127.0.0.1',proxy:{'/hcgi/platform':{target:'http://127.0.0.1:8090',changeOrigin:true,rewrite:path=>path.replace(/^\/hcgi\/platform/,'')}}},
 build:{outDir:'../../dist/apps/web',emptyOutDir:true}
});
