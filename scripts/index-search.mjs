import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import vm from 'node:vm';
const base=new URL('../dist/',import.meta.url);
const sessions=vm.runInNewContext(await readFile(new URL('catalog.js',base),'utf8')+';sessions');
for(const session of sessions){
 const dir=new URL('content/'+session.id+'/',base);
 for(const scope of ['dialogue','analysis','investment']){
  const data=JSON.parse(await readFile(new URL(scope+'.json',dir),'utf8'));
  const groups=scope==='dialogue'?session.topics.map(t=>[t.key,t.title,t.tag,data[t.key].pars.map(([id,text])=>[id,text.replace(/^[^：]{1,14}：/,'')])]):data.map((section,j)=>['h'+j,section.title,'',section.blocks.map((b,k)=>['d'+j+'-'+k,typeof b==='string'?b:b.flat().join('　')])]);
  await writeFile(new URL('search-'+scope+'.gz',dir),gzipSync(Buffer.from(JSON.stringify(groups))));
 }
}
await import('./version-assets.mjs');
