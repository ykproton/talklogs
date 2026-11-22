import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const root = new URL('../dist/', import.meta.url);
const read = path => readFileSync(new URL(path,root));
const sessions = vm.runInNewContext(read('catalog.js').toString()+';sessions');
const html = read('index.html').toString();
const assets = JSON.parse(html.match(/id="asset-versions">(.*?)<\/script>/s)[1]);
for(const [,path,hash] of html.matchAll(/(?:src|href)="([^"?]+)\?v=(\w+)"/g)) assets[path]=hash;
for(const [path,hash] of Object.entries(assets)){
  assert.equal(createHash('sha256').update(read(path)).digest('hex').slice(0,16),hash,path);
}
const keys=new Set();
for(const s of sessions){
  assert(!keys.has(s.id),s.id);keys.add(s.id);
  assert(assets['posters/'+s.id+'.jpg'],s.id);
  const dir='content/'+s.id+'/';
  const dialogue=JSON.parse(read(dir+'dialogue.json'));
  for(const scope of ['dialogue','analysis','investment']){
    const doc=JSON.parse(read(dir+scope+'.json'));
    const bytes=read(dir+'search-'+scope+'.gz');
    const index=JSON.parse(bytes[0]===31?gunzipSync(bytes):bytes);
    const expected=scope==='dialogue'
      ? s.topics.map(t=>[t.key,t.title,t.tag,doc[t.key].pars.map(([id,text])=>[id,text.replace(/^[^：]{1,14}：/,'')])])
      : doc.map((v,j)=>['h'+j,v.title,'',v.blocks.map((b,k)=>['d'+j+'-'+k,typeof b==='string'?b:b.flat().join('　')])]);
    assert.equal(JSON.stringify(index),JSON.stringify(expected),dir+scope);
    if(scope!=='dialogue')for(const section of doc){
      if(section.source){const {key,anchor}=section.source;assert(dialogue[key]?.pars.some(([id])=>id===anchor),section.title)}
    }
    assert(statSync(new URL('originals/'+s.id+'/'+scope+'.'+(s.originalFormat||'docx'),root)).size>0);
  }
}
console.log('Verified '+sessions.length+' sessions, search indexes, sources, downloads and asset versions.');
