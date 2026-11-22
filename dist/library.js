const assetVersions = JSON.parse(document.getElementById('asset-versions')?.textContent || '{}');
function assetUrl(path) {
 return assetVersions[path] ? path + '?v=' + assetVersions[path] : path;
}
const docNames=['直播对话稿','交流内容分析','投资分析专题'];
const fileKeys=['dialogue','analysis','investment'];
const order=s=>s.topics.map((_,i)=>i);
const slug=(s,n)=>s.topics[n].key;
const study=(s,d)=>home(s)+'/study/'+fileKeys[d];
function original(s,d) {
 const format=s.originalFormat||'docx';
 const name=(s.series?seriesLabel(s)+'第'+issueNumber(s)+'期_'+s.title:s.id)+'_'+docNames[d]+'.'+format;
 return '<a download="'+esc(name)+'" href="'+assetUrl('originals/'+s.id+'/'+fileKeys[d]+'.'+format)+'">'+docNames[d]+' <small>'+(d?'AI 生成 · ':'直播整理 · ')+(format==='md'?'Markdown':'Word')+' ↓</small></a>';
}
function resources(s){return '<section class="resources"><h2>本场资料</h2><div class="studies">'+[1,2].map(d=>'<a href="'+study(s,d)+'">'+docNames[d]+' <span>阅读全文 →</span></a>').join('')+'</div><details><summary>原始文档下载 · 3 份</summary><div class="downloads">'+docNames.map((_,d)=>original(s,d)).join('')+'</div></details></section>'}
function docBlock(block,id,isQuote=false){if(isQuote && typeof block==='string')return '<blockquote id="'+id+'" data-position>'+esc(block)+'</blockquote>';if(typeof block==='string')return '<p id="'+id+'" data-position>'+esc(block)+'</p>';return '<div class="tableWrap" id="'+id+'" data-position><table>'+block.map((row,i)=>'<tr>'+row.map(x=>i?'<td>'+esc(x)+'</td>':'<th scope="col">'+esc(x)+'</th>').join('')+'</tr>').join('')+'</table></div>'}
const fileCache=new Map();
function content(s,key){
 const url=assetUrl('content/'+s.id+'/'+key+'.json');
 if(!fileCache.has(url))fileCache.set(url,fetch(url).then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).catch(err=>{fileCache.delete(url);throw err}));
 return fileCache.get(url)
}
function consultParams(origin=returnTo){return origin?'?from='+encodeURIComponent(origin):''}
function subchapter(title){return /^\d+[.．、]\s*/.test(title)}
function chapterMenu(sections,route,tail){
 const groups=[];
 sections.forEach((section,index)=>{
  const link='<a href="'+route+'/h'+index+tail+'">'+esc(section.title)+'</a>';
  if(subchapter(section.title) && groups.length)groups.at(-1).children.push(link);
  else groups.push({link,children:[]});
 });
 return groups.map(group=>group.link+(group.children.length?'<details class="subchapters"><summary>本章小节 · '+group.children.length+'</summary>'+group.children.join('')+'</details>':'')).join('');
}
function studyPage(s,d,sections){
 const route=study(s,d),tail=consultParams();
 return '<article class="read"><div class="readbar"><a href="'+home(s)+'">‹ 本场直播</a><button data-share class="textAction">分享位置</button>'+original(s,d)+'</div><small>'+issueContext(s)+'　·　'+s.title+'</small><h1>'+docNames[d]+'</h1><p class="credit">非官方 · 本篇作'+ (d===2?'为投资分析':'为直播分析')+'，由 AI 根据直播整理稿生成。</p><details class="chapterList"><summary>文内目录</summary>'+chapterMenu(sections,route,tail)+'</details>'+sections.map((sec,j)=>{
 let ref='';if(sec.source){const {key,anchor,title}=sec.source;ref='<a class="sourceQuote" href="'+home(s)+'/topic/'+key+'/'+anchor+tail+'">对照直播原话 · '+esc(title)+' →</a>'}
 return '<section class="studySection"><'+(subchapter(sec.title)?'h3':'h2')+' data-position id="h'+j+'">'+esc(sec.title)+'</'+(subchapter(sec.title)?'h3':'h2')+'>'+ref+sec.blocks.map((b,k)=>docBlock(b,'d'+j+'-'+k,sec.quotes?.includes(k))).join('')+'</section>'
 }).join('')+'<a class="quiet" href="'+home(s)+'">← 返回本场直播</a></article>'
}
function paragraphs(s,n){return s.dialogue[s.topics[n].key].pars.map(([id,text])=>{
 const pattern=s.id==='2026-11-21'?/^(吉米|金先生|金冰|主持人|听众)：([\s\S]*)$/:/^([^：]{1,14})：([\s\S]*)$/;const m=text.match(pattern);let name=m?.[1]||'';
 if(s.id==='2026-11-14'&&name==='金先生')name='金冰';if(s.id==='2026-11-07'&&name==='嘉宾')name='方言老师';
 return {id,name,body:m?m[2]:text}})}
const qualifications={'2026-11-14':{'p5-2':'收益率为讲者设定的演算情境，倍数来自口述，未经核算。','p9-8':'这里的百分比是讲者对人性影响的口述估计。','p13-6':'“50 万”是现场对听众借款金额的推测。'}};
function dialogue(s,n){let last='';return paragraphs(s,n).map(p=>{const label=s.topics[n].subheads[p.id],header=label?'<h2>'+esc(label)+'</h2>':'';
 const by=p.name!==last&&p.name?'<div class="speaker">'+esc(p.name)+'</div>':'';if(p.name)last=p.name;const note=qualifications[s.id]?.[p.id];
 const breaks=s.dialogue[s.topics[n].key].breaks?.[p.id]||[];
 const parts=[p.body];
 for(const marker of breaks){const tail=parts.pop(),at=tail.indexOf(marker);if(at>0)parts.push(tail.slice(0,at),tail.slice(at));else parts.push(tail)}
 const body=parts.map(esc).join('<span class="speechBreak"></span>');
 return header+by+'<p id="'+p.id+'" data-position>'+body+'</p>'+(note?'<details class="caveat"><summary>口述说明</summary>'+note+'</details>':'')}).join('')}
function cross(s,n){const item=s.topics[n].cross;if(!item)return '';const [id,key,reason]=item,other=sessions.find(e=>e.id===id),i=other.topics.findIndex(t=>t.key===key);return '<aside class="pair"><small>跨场对读 · '+issueContext(other)+'</small><p>'+reason+'</p><a href="'+page(other,i)+'">'+other.topics[i].title+' →</a></aside>'}
let activeReading=null,scrollFrame=0;
function memory(){let m=get('jr-main',null)||get('jr-last',null);if(!m)return null;let s=sessions.find(s=>s.id===m.id);if(!s)return null;if(!m.route&&s.topics.find(t=>t.legacy===m.n))return {id:s.id,route:home(s)+'/topic/'+s.topics.find(t=>t.legacy===m.n).key,title:s.topics.find(t=>t.legacy===m.n).title};return m.route?m:null}
function episodeMemory(s) {
 const last=get('jr-episode:'+s.id,null)||memory();
 return last?.id===s.id&&validOrigin(s,last.route)?last:null;
}
function resumeLink(){let m=memory();if(!m)return '';return '<a class="resumeCard" href="'+esc(m.route+(m.anchor?'/'+m.anchor:''))+'"><small>继续阅读　·　'+esc(issueContext(sessions.find(s=>s.id===m.id)))+'</small><strong>'+esc(m.title)+'　→</strong>'+(m.snippet?'<span>'+esc(m.snippet)+'…</span>':'')+'</a>'}
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-share]');
 if(!button||!activeReading)return;
 const {nodes,route}=activeReading;
 const anchor=nodes.find(node=>node.getBoundingClientRect().bottom>95)?.id || nodes.at(-1)?.id;
 const url=new URL(location.href);url.hash=route+(anchor?'/'+anchor:'');
 try{await navigator.clipboard.writeText(url.href);button.textContent='链接已复制'}
 catch{window.prompt('复制段落链接',url.href)}
});
function savePlace(){if(!activeReading)return;const {nodes,id,route,title}=activeReading;const target=nodes.find(p=>p.getBoundingClientRect().bottom>95)||nodes.at(-1);if(!target)return;const data={id,route,title,anchor:target.id,snippet:target.textContent.trim().slice(0,44)};try{if(returnTo&&route.includes('/topic/'))return;
 const value=JSON.stringify(data);if(localStorage.getItem('jr-pos:'+route)===value&&activeReading.recorded)return;
 const previous=memory();if(!get('jr-main',null)&&previous?.route.includes('/topic/'))localStorage.setItem('jr-main',JSON.stringify(previous));
 localStorage.setItem('jr-pos:'+route,value);localStorage.setItem('jr-last',value);
 if(route.includes('/topic/')){localStorage.setItem('jr-main',value);localStorage.setItem('jr-episode:'+id,value)}activeReading.recorded=true}catch{}}
function setReading(s,route,title,anchor){activeReading={id:s.id,route,title,nodes:[...main.querySelectorAll('[data-position]')]};anchor=anchor||get('jr-pos:'+route,null)?.anchor;if(anchor){const p=document.getElementById(anchor);if(p?.hasAttribute('data-position'))p.scrollIntoView({block:'start'})}savePlace()}
let oldScroll=0;
window.addEventListener('scroll',()=>{if(!activeReading||scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;const y=window.scrollY;if(activeReading){if(Math.abs(y-oldScroll)>4)main.querySelector('.readbar')?.classList.toggle('hideBar',y>oldScroll&&y>150);savePlace()}oldScroll=y})},{passive:true});
window.addEventListener('pagehide',savePlace);
document.addEventListener('visibilitychange',()=>{if(document.hidden)savePlace()});
document.addEventListener('click',event=>{
 const link=event.target.closest('a[data-consult]');if(!link||!activeReading)return;
 const record=get('jr-pos:'+activeReading.route,null);
 const origin=returnTo||activeReading.route+(record?.anchor?'/'+record.anchor:'');
 link.hash=link.hash.split('?')[0]+consultParams(origin)
});
async function searchIndex(s,scope){
 const url=assetUrl('content/'+s.id+'/search-'+scope+'.gz');
 if(!fileCache.has(url))fileCache.set(url,(async()=>{
  if(typeof DecompressionStream==='function'){const response=await fetch(url);if(!response.ok)throw Error(response.status);
   const bytes=new Uint8Array(await response.arrayBuffer());if(bytes[0]!==31)return JSON.parse(new TextDecoder().decode(bytes));
   return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json()}
  const data=await content(s,scope);
  if(scope==='dialogue')return s.topics.map(t=>[t.key,t.title,t.tag,data[t.key].pars.map(([id,text])=>[id,text.replace(/^[^：]{1,14}：/,'')])]);
  return data.map((v,j)=>['h'+j,v.title,'',v.blocks.map((b,k)=>['d'+j+'-'+k,typeof b==='string'?b:b.flat().join('　')])])
 })().catch(e=>{fileCache.delete(url);throw e}));
 return fileCache.get(url)
}
function excerpt(text,q){
 const at=text.toLocaleLowerCase().indexOf(q);
 if(at<0)return esc(text.slice(0,62));
 return (at>20?'…':'')+esc(text.slice(Math.max(0,at-20),at))+'<mark>'+esc(text.slice(at,at+q.length))+'</mark>'+esc(text.slice(at+q.length,at+q.length+48))
}
function searchGroup(s,scope,group,query,tag){
 const [key,title,cat,paragraphs]=group;
 if(scope==='dialogue'&&tag!=='全部'&&tag!==cat)return '';
 const matches=paragraphs.filter(([,text])=>text.toLocaleLowerCase().includes(query));
 const base=home(s)+(scope==='dialogue'?'/topic/'+key:'/study/'+scope);
 if(!matches.length&&!title.toLocaleLowerCase().includes(query))return '';
 const caption=issueContext(s)+' · '+(cat||docNames[fileKeys.indexOf(scope)]);
 if(!matches.length)return '<a class="hit" href="'+base+(cat?'':'/'+key)+'"><small>'+caption+'</small><strong>'+esc(title)+'</strong></a>';
 return '<details class="match"><summary><small>'+caption+'</small><strong>'+esc(title)+'</strong><span>'+matches.length+' 处</span></summary>'+matches.map(([anchor,text])=>'<a class="matchLine" href="'+base+'/'+anchor+'">'+excerpt(text,query)+'　›</a>').join('')+'</details>'
}
let nextFilterState=null;
function bindSearch(tag){
 const input=document.querySelector('#query'),hits=document.querySelector('#hits'),browse=document.querySelector('#browse');let version=0,timer;
 let restore=history.state?.search || nextFilterState;nextFilterState=null;
 if(restore){
  input.value=restore.q;
  const radio=[...document.querySelectorAll('input[name=scope]')].find(el=>el.value===restore.scope);
  if(radio)radio.checked=true;
 }
 function remember(){
  const open=[...hits.querySelectorAll('.match[open]')].map(el=>el.querySelector('a')?.hash);
  history.replaceState({...history.state,search:{q:input.value,scope:document.querySelector('input[name=scope]:checked').value,open,y:window.scrollY}},'');
 }
 input.closest('.library').addEventListener('click',event=>{
  if(!event.target.closest('a'))return;
  remember();
  if(event.target.closest('#tagFilters a'))nextFilterState={...history.state.search,open:[],y:0};
 },true);
 function update(){clearTimeout(timer);const ticket=++version,query=input.value.trim().toLocaleLowerCase(),scope=document.querySelector('input[name=scope]:checked').value;
 document.querySelector('#tagFilters').hidden=scope!=='dialogue';browse.hidden=!!query||scope!=='dialogue';
 if(!query){hits.innerHTML=scope==='dialogue'?'':sessions.map(s=>'<a class="row" href="'+study(s,fileKeys.indexOf(scope))+'">'+issueContext(s)+'　'+s.title+' ›</a>').join('');if(restore){window.scrollTo(0,restore.y||0);restore=null}return}
 hits.textContent='正在查找…';
 timer=setTimeout(async()=>{try{const lists=await Promise.allSettled(sessions.map(s=>searchIndex(s,scope)));if(ticket!==version||!hits.isConnected)return;
 hits.innerHTML=lists.map((list,i)=>{
  if(list.status==='rejected')return '';
  const s=sessions[i],matches=list.value.map(group=>searchGroup(s,scope,group,query,tag)).join('');
  const meta=[s.title,issueLabel(s),s.hosts,date(s)].join(' ').replaceAll(' ','').toLocaleLowerCase();
  const match=meta.includes(query.replaceAll(' ',''));
  const filtered=scope==='dialogue'&&tag!=='全部';
  const link=scope==='dialogue'?home(s):study(s,fileKeys.indexOf(scope));
  const episode=match&&!filtered?'<a class="hit" href="'+link+'"><small>'+issueContext(s)+'</small><strong>'+esc(s.title)+(scope==='dialogue'?' · 本场目录':' · '+docNames[fileKeys.indexOf(scope)])+' →</strong></a>':'';
  return episode+matches;
 }).join('')||'';
 if(lists.some(list=>list.status==='rejected')){
  hits.insertAdjacentHTML('beforeend','<p>部分场次未能加载。 <button type="button">重新查找</button></p>');
  hits.querySelector('button').onclick=update;
 }else if(!hits.innerHTML)hits.innerHTML='<p>没有找到匹配内容。</p>';
 if(restore){
  for(const el of hits.querySelectorAll('.match'))el.open=restore.open?.includes(el.querySelector('a')?.hash)||false;
  window.scrollTo(0,restore.y||0);restore=null;
 }
 }catch{if(ticket===version)hits.innerHTML='<p>未能加载搜索索引。</p><button type="button">重试</button>';hits.querySelector('button')?.addEventListener('click',update)}},120)}
 input.oninput=()=>{restore=null;remember();update()};document.querySelectorAll('input[name=scope]').forEach(el=>el.onchange=input.oninput);update()
}
