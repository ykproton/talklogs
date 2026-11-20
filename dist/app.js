const seriesInfo = {
  wuliaoshi: {
    title: '无聊室',
    line: '人生悟道 · 渡人渡己',
    intro: '金冰和朋友们的即兴对谈。每次从一个话题聊起，听听同桌的人怎样想。'
  }
};
const airdate = s => s.date || s.id;
sessions.sort((a,b) => airdate(b).localeCompare(airdate(a)) || (b.issue || 0) - (a.issue || 0));
const main = document.querySelector('main');
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const home = s => '#live/' + s.id;
const page = (s,n) => home(s) + '/topic/' + slug(s,n);
const poster = s => 'posters/' + s.id + '.jpg';
const date = s => airdate(s).replaceAll('-','.');
const issueNumber = s => String(s.issue).padStart(3,'0');
const seriesRoute = key => '#series/' + key;
const seriesLabel = s => seriesInfo[s.series]?.title || '常规直播';
const issueLabel = s => seriesLabel(s) + (s.issue ? ' · 第 ' + issueNumber(s) + ' 期' : '');
const issueContext = s => s.series ? issueLabel(s) + ' · ' + date(s) : date(s);
function get(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
const notes=get('jb-notes',{});

function validOrigin(s,route) {
  if (!s || typeof route !== 'string') return false;
  const parts = route.split('/');
  return parts[0] === '#live' && parts[1] === s.id && parts[2] === 'topic'
    && s.topics.some(t => t.key === parts[3])
    && (parts.length === 4 || (parts.length === 5 && /^p[0-9]+-[0-9]+$/.test(parts[4])));
}
function updateNavigation(parts,s) {
  const route = parts[0] === 'series' ? seriesRoute(parts[1])
    : parts[0] === 'live' && s?.series ? seriesRoute(s.series)
    : parts[0] === 'live' ? '#archive' : '#' + parts[0];
  for (const link of document.querySelectorAll('.bar a')) {
    if (link.getAttribute('href') === route) link.setAttribute('aria-current', parts[0] === 'live' ? 'location' : 'page');
    else link.removeAttribute('aria-current');
  }
}
function posterImage(s, alt, small=false) {
  const src=poster(s);
  const variants=s.posterWidths?.map(w=>'posters/'+s.id+'-'+w+'.webp '+w+'w').join(', ');
  return '<img src="'+src+'" alt="'+esc(alt)+'"'+(small?' loading="lazy"':'')+
    (variants?' srcset="'+variants+'" sizes="'+(small?'56px':'(max-width: 720px) 26vw, 204px')+'" width="865" height="1536"':'')+'>';
}
function fullPoster(s) {
  const imageLink = '<a class="poster" href="'+poster(s)+'" target="_blank" rel="noopener" aria-label="'+esc('查看《'+s.title+'》完整海报')+'">'+posterImage(s,s.title+'直播海报')+'</a>';
  if (!s.videoUrl) return imageLink;
  return '<div class="posterGroup">'+imageLink+'<a class="posterVideo" href="'+esc(s.videoUrl)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc('在哔哩哔哩观看《'+s.title+'》直播录像')+'">观看录像 ↗</a></div>';
}
function readingButton(s,front=false) {
  const mark=front?null:episodeMemory(s);
  const route=mark?mark.route+(mark.anchor?'/'+mark.anchor:''):page(s,0);
  const label=mark?'继续阅读':'开始阅读';
  return '<a class="pill" href="'+esc(route)+'"'+(mark?' aria-label="'+esc('继续阅读 · '+mark.title)+'"':'')+'>'+label+' <span aria-hidden="true">→</span></a>';
}
function hero(s,front=false) {
  const room=seriesInfo[s.series];
  let label=room?'<div class="issueLine"><a href="'+seriesRoute(s.series)+'">'+room.title+'</a><span>第 '+issueNumber(s)+' 期</span></div>':'<small>'+date(s)+'　·　'+s.hosts+'</small>';
  const byline=room?'<div class="eventMeta"><span>'+date(s)+(s.timeLabel?' · '+esc(s.timeLabel):'')+(s.venue?' · '+esc(s.venue):'')+'</span><span>'+esc(s.hosts)+'</span></div>':'';
  return '<section class="hero'+(room?' roomHero':'')+'"><div>'+label+'<'+(front?'h2':'h1')+'>'+esc(s.title)+'</'+(front?'h2':'h1')+'>'+byline+
    '<p>'+esc(s.desc)+'</p><div class="heroActions">'+readingButton(s,front)+
    (front?'<a class="contentsLink" href="'+home(s)+'">本场目录</a>':'')+'</div><div class="heroTools"><a href="'+study(s,1)+'">交流内容分析</a><a href="'+study(s,2)+'">投资主题</a><a href="'+home(s)+'/originals">原稿下载 ↓</a></div></div>'+fullPoster(s)+'</section>';
}
function archiveRow(s) {
  return '<a class="archiveRow" href="'+home(s)+'">'+posterImage(s,'',true)+'<div><small>'+issueLabel(s)+'　·　'+date(s)+(s.series?'':'　·　'+esc(s.hosts))+'</small><h3>'+esc(s.title)+'</h3><p>'+esc(s.desc)+'</p></div><span class="count">'+s.topics.length+' 个主题　›</span></a>';
}
function topics(s,items=s.topics){return '<div class="rows">'+items.map(t=>'<a class="row" href="'+page(s,s.topics.indexOf(t))+'"><small>'+t.tag+'</small><span>'+t.title+'</span><i>›</i></a>').join('')+'</div>'}
function selections(s) {
  const chosen=(s.picks || [s.topics[0].key,'company-research',s.topics.find(t=>t.tag==='教育')?.key]).map(k=>s.topics.find(t=>t.key===k));
  return [...new Set([...chosen,...s.topics].filter(Boolean))].slice(0,3);
}
function homePage() {
  const s = sessions[0];
  return '<div class="wrap"><section class="identity"><h1>悟道渡己 · 听记</h1><p>渡友整理「人生悟道 · 渡人渡己」直播对话</p><small>本站为非官方听记。文字稿根据直播内容整理，直播分析与投资分析均由 AI 生成。</small></section>'+resumeLink()+hero(s,true)+'<section class="columns"><div><h2>本场选读</h2>'+topics(s,selections(s))+'<a class="quiet" href="'+home(s)+'">查看全部 '+s.topics.length+' 个主题 →</a></div><aside><h2>最近场次</h2>'+sessions.slice(1,4).map(archiveRow).join('')+'<a class="quiet" href="#archive">全部场次 →</a></aside></section></div>';
}
function archive(filter) {
  const choices=[['','全部'],['main','常规直播'],...Object.entries(seriesInfo).map(([k,v])=>[k,v.title])];
  const current=choices.some(([k])=>k===filter)?filter:'';
  const filters='<div class="filters archiveFilters" aria-label="按栏目筛选">'+choices.map(([k,title])=>'<a '+(current===k?'class="on" aria-current="true" ':'')+'href="#archive'+(k?'/'+k:'')+'">'+title+'</a>').join('')+'</div>';
  let year='';
  const rows=sessions.filter(s=>!current||(s.series||'main')===current).map(s=>{
    const y=airdate(s).slice(0,4),heading=year===y?'':'<h2>'+y+'</h2>';
    year=y;return heading+archiveRow(s);
  });
  return '<div class="library"><h1>场次目录</h1>'+filters+rows.join('')+'</div>';
}
function seriesPage(key) {
  const info=seriesInfo[key], issues=sessions.filter(s=>s.series===key).sort((a,b)=>b.issue-a.issue);
  const [s,...older]=issues;
  const feature=s?'<article class="roomFeature"><div class="roomFeatureText"><div class="issueLine"><span>第 '+issueNumber(s)+' 期</span>'+(s.edition?'<span>'+esc(s.edition)+'</span>':'')+'</div><h2><a href="'+home(s)+'">'+esc(s.title)+'</a></h2><p>'+esc(s.desc)+'</p><div class="eventMeta"><span>'+date(s)+(s.timeLabel?' · '+esc(s.timeLabel):'')+'</span><span>'+esc(s.hosts)+'</span></div><div class="heroActions">'+readingButton(s)+'<a class="contentsLink" href="'+home(s)+'">本期目录 · '+s.topics.length+' 个主题</a></div></div>'+fullPoster(s)+'</article>':'';
  return '<div class="wrap seriesWrap"><section class="seriesMast"><small>'+info.line+'</small><h1>'+info.title+'</h1><p>'+info.intro+'</p></section>'+feature+
    (older.length?'<section class="seriesPast"><h2>往期对谈</h2>'+older.map(archiveRow).join('')+'</section>':'')+
    (s?'<section class="columns seriesExtras"><div><h2>本期选读</h2>'+topics(s,selections(s))+'</div><aside><h2>本期资料</h2><div class="seriesDocs"><a href="'+study(s,1)+'">交流内容分析 <span>→</span></a><a href="'+study(s,2)+'">投资主题 <span>→</span></a><a href="'+home(s)+'/originals">原稿下载 <span>↓</span></a></div></aside></section>':'')+'</div>';
}
function themes(tag='全部'){const tags=['全部',...new Set(sessions.flatMap(s=>s.topics.map(t=>t.tag)))];return '<div class="library"><h1>主题索引</h1><input type="search" id="query" aria-label="搜索直播正文" placeholder="搜索主题或对话中的一句话"><fieldset class="searchScope"><legend>搜索范围</legend>'+fileKeys.map((v,d)=>'<label><input type="radio" name="scope" value="'+v+'" '+(d===0?'checked':'')+'>'+docNames[d]+'</label>').join('')+'</fieldset><div class="filters" id="tagFilters">'+tags.map(t=>'<a class="'+(t===tag?'on':'')+'" href="#themes/'+encodeURIComponent(t)+'">'+t+'</a>').join('')+'</div><div id="hits"></div><div id="browse">'+sessions.map(s=>{let rows=s.topics.map(({title,tag:cat},n)=>tag==='全部'||tag===cat?'<a class="row" href="'+page(s,n)+'"><small>'+cat+'</small><span>'+title+'</span><i>›</i></a>':'').join('');return rows?'<h2>'+s.title+' <small>'+issueContext(s)+'</small></h2>'+rows:''}).join('')+'</div></div>'}
function sessionPage(s){return '<div class="wrap">'+hero(s)+'<div class="sessionList"><h2>本场主题</h2>'+topics(s)+resources(s)+'</div></div>'}
function noteBox(key){return '<details class="notebox"><summary>本节笔记'+(notes[key]?' · 已记录':'')+'</summary><textarea id="note" aria-label="本节笔记" placeholder="记下你的想法">'+esc(notes[key]||'')+'</textarea><small id="save">保存在当前浏览器</small></details>'}
function relatedReading(s,n){const {links}=s.dialogue[s.topics[n].key];return '<details class="related"><summary>查阅本场分析</summary>'+links.map(([key,anchor,line])=>'<p>'+esc(line)+'</p><a data-consult href="'+study(s,fileKeys.indexOf(key))+'/'+anchor+'">读这段分析 →</a>').join('')+'<div class="studyLinks">'+[1,2].map(d=>'<a data-consult href="'+study(s,d)+'">'+docNames[d]+'全文 →</a>').join('')+'</div></details>'}
function reader(s,n){const {title,tag,lead,insight,subheads}=s.topics[n];const sequence=order(s),at=sequence.indexOf(n),next=s.topics[sequence[at+1]];return '<article class="read"><div class="readbar"><a href="'+home(s)+'">‹ '+s.title+'</a><label><span class="sr">主题目录</span><select id="toc">'+sequence.map((i,j)=>'<option value="'+page(s,i)+'" '+(i===n?'selected':'')+'>'+ (j+1)+' / '+s.topics.length+'　'+s.topics[i].title+'</option>').join('')+'</select></label><details class="readTools"><summary>资料</summary><div>'+[1,2].map(d=>'<a data-consult href="'+study(s,d)+'">'+docNames[d]+'</a>').join('')+'</div></details></div><small>'+issueContext(s)+'　 /　'+tag+'</small><h1>'+title+'</h1><p class="credit">非官方 · 渡友根据直播内容整理</p><p class="lead">'+lead+'</p>'+Object.entries(subheads).map(([id,label])=>'<a class="caseJump" href="'+page(s,n)+'/'+id+'">'+label+' ↓</a>').join('')+'<div class="dialogue">'+dialogue(s,n)+'</div>'+(insight?'<aside class="insight"><small>阅读旁注</small><p>'+insight+'</p></aside>':'')+relatedReading(s,n)+cross(s,n)+noteBox(s.id+'@'+s.topics[n].legacy)+'<div class="next"><a class="quiet" href="'+(at?page(s,sequence[at-1]):home(s))+'">← '+(n?'上一主题':'本场目录')+'</a><a href="'+(next?page(s,sequence[at+1]):home(s))+'">'+(next?'下一主题 · '+next.title:'读完本场 · 返回场次目录')+' →</a></div></article>'}
function legacyTopic(s,d,i){if(d===0){let n=s.topics.findIndex(t=>t.sections.includes(i));return n<0?home(s):page(s,n)}return s.headings[d]?.[i]&&d>0?study(s,d)+'/h'+i:home(s)}
function noteInfo(key){if(key.includes('@')){let [id,n]=key.split('@'),s=sessions.find(s=>s.id===id);return s?.topics.find(t=>t.legacy===+n)&&[s,s.topics.find(t=>t.legacy===+n).title,home(s)+'/topic/'+s.topics.find(t=>t.legacy===+n).key]}let keys=key.split('/'),s=keys.length===2?sessions.find(s=>s.id===keys[0]):sessions.find(s=>s.id==='2026-11-14'),[d,i]=keys.pop().split('-');return s?.headings[d]?.[i]&&[s,s.headings[d][i],legacyTopic(s,+d,+i)]}
function notebook(){let items=Object.entries(notes).filter(([k])=>noteInfo(k));return '<div class="library"><h1>我的笔记</h1>'+(items.length?'<button id="export">导出笔记</button>':'<p>阅读时可在各主题末尾记下心得。</p>')+items.map(([k,v])=>{let [s,title,url]=noteInfo(k);return '<section class="entry"><small>'+issueContext(s)+'</small><h3><a href="'+url+'">'+esc(title)+' ↗</a></h3><p>'+esc(v)+'</p></section>'}).join('')+'</div>'}
let generation=0,returnTo='';
async function render(){const ticket=++generation;activeReading=null;let restore=null,tag='全部';let [h,opts='']=location.hash.split('?');const origin=new URLSearchParams(opts).get('from')||'';let parts=h.slice(1).split('/'),s=sessions.find(x=>x.id===parts[1]),key,html;
 returnTo=validOrigin(s,origin)?origin:'';let legacy=h.match(/^#(?:live\/(\d{4}-\d\d-\d\d)\/)?read\/(\d+)\/(\d+)$/);
 if(legacy){let item=sessions.find(x=>x.id===(legacy[1]||'2026-11-14'));if(item){location.replace(legacyTopic(item,+legacy[2],+legacy[3]));return}}
 if(parts[0]==='live'&&s){let n=/^\d+$/.test(parts[3]||'')?s.topics.findIndex(t=>t.legacy===Number(parts[3])-1):s.topics.findIndex(t=>t.key===parts[3]);if(parts[2]==='topic'&&s.topics[n]){s.dialogue=await content(s,'dialogue');if(ticket!==generation)return;html=reader(s,n);key=s.id+'@'+s.topics[n].legacy;restore=[s,page(s,n),s.topics[n].title,parts[4]]}else if(parts[2]==='study'&&['analysis','investment'].includes(parts[3])){let d=fileKeys.indexOf(parts[3]);const doc=await content(s,fileKeys[d]);if(ticket!==generation)return;if(!returnTo){const m=get('jr-main',null);if(m?.id===s.id&&validOrigin(s,m.route))returnTo=m.route+(m.anchor?'/'+m.anchor:'')}html=studyPage(s,d,doc);restore=[s,study(s,d),docNames[d],parts[4]]}else if(parts[2]==='originals'){html='<div class="library"><a class="quiet" href="'+home(s)+'">‹ '+s.title+'</a><h1>原稿下载</h1><small>'+issueContext(s)+' · '+s.hosts+'</small>'+(s.sourceNote?'<p class="sourceNote">'+esc(s.sourceNote)+'</p>':'')+'<div class="downloads">'+docNames.map((_,d)=>original(s,d)).join('')+'</div></div>'}else html=sessionPage(s)}else if(parts[0]==='series'&&Object.hasOwn(seriesInfo,parts[1]))html=seriesPage(parts[1]);else if(parts[0]==='archive')html=archive(parts[1]);else if(parts[0]==='themes'){try{tag=decodeURIComponent(parts[1]||tag)}catch{}html=themes(tag)}else if(parts[0]==='notes')html=notebook();else html=homePage();
 main.innerHTML=html;updateNavigation(parts,s);if(restore&&returnTo){const back=main.querySelector('.readbar a');if(back){back.href=returnTo;back.textContent='‹ 返回刚才的对话'}}document.title=parts[0]?(main.querySelector('h1')?.textContent||'直播档案')+' | 悟道渡己 · 听记':'悟道渡己 · 听记';let toc=document.querySelector('#toc');if(toc)toc.onchange=()=>location.hash=toc.value;let el=document.querySelector('#note');if(el)el.oninput=()=>{if(el.value.trim())notes[key]=el.value;else delete notes[key];try{localStorage.setItem('jb-notes',JSON.stringify(notes));document.querySelector('#save').textContent='已保存在当前浏览器'}catch{document.querySelector('#save').textContent='未能保存，请复制留存'}};
 let exp=document.querySelector('#export');if(exp)exp.onclick=()=>{let txt=Object.entries(notes).filter(([k])=>noteInfo(k)).map(([k,v])=>{let [s,t]=noteInfo(k);return issueContext(s)+' · '+t+'\n'+v}).join('\n\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain;charset=utf-8'}));a.download='悟道渡己-阅读笔记.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};window.scrollTo(0,0);oldScroll=0;if(restore)setReading(...restore);
 if(document.querySelector('#query'))bindSearch(tag);
}
function safeRender(){const h=location.hash;render().catch(()=>{if(h===location.hash){main.innerHTML='<div class="library"><p>本页内容加载失败。</p><button id="retry">重新加载</button></div>';document.querySelector('#retry').onclick=safeRender}})}
if('scrollRestoration' in history)history.scrollRestoration='manual';window.addEventListener('hashchange',safeRender);safeRender();
