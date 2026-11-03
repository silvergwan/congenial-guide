import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const files=new Set(['index.html','styles.css','app.mjs','state.mjs','assets/PretendardVariable.woff2']);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.woff2':'font/woff2'};
const port=Number(process.env.PORT||4173);
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const file=url.pathname==='/'?'index.html':url.pathname.slice(1);
  if(!['GET','HEAD'].includes(req.method)||!files.has(file)){res.writeHead(404);res.end('Not found');return;}
  const body=await readFile(path.join(root,file));
  res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(500);res.end('Preview unavailable');}
}).listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port));
