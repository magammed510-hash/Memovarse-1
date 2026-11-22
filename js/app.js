const HASH='062c6a1cf4e087f27d755e9dad0c3ec953a66eeb64825a095d2d97dc8ad1fd15';
const {useState,useEffect,useRef,useMemo,useCallback}=React;
const html=htm.bind(React.createElement);
const LS={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let E=[],SERVER=false;
const byId=id=>E.find(e=>e.id===id);
const cover=e=>e.cover||e.imgs[0];
const prog=id=>LS.get('mv_pg_'+id,0);
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const toJpeg=(file,w=1280)=>new Promise((ok,no)=>{const im=new Image(),u=URL.createObjectURL(file);im.onload=()=>{const s=Math.min(1,w/im.width),c=document.createElement('canvas');c.width=im.width*s;c.height=im.height*s;c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',.82))};im.onerror=()=>no(new Error('Расм кушода нашуд'));im.src=u});
async function loadAll(){
  SERVER=await fetch('api/ping',{cache:'no-store'}).then(r=>r.ok&&r.json()).then(j=>!!(j&&j.ok)).catch(()=>false);
  const base=await fetch('data/episodes.json',{cache:'no-store'}).then(r=>r.json()).catch(()=>[]);
  E=[...base,...(SERVER?[]:LS.get('mv_extra',[]))].sort((a,b)=>b.n-a.n);
}
function useHash(){
  const [h,setH]=useState(location.hash||'#/');
  useEffect(()=>{const f=()=>{setH(location.hash||'#/');window.scrollTo(0,0)};addEventListener('hashchange',f);return()=>removeEventListener('hashchange',f)},[]);
  return h;
}

function Header({filter,setFilter}){
  return html`<header class="top"><a class="logo" href="#/">Memoverse</a>
    <nav>${['all','fav'].map(f=>html`<button key=${f} class=${'chip'+(filter===f?' on':'')} onClick=${()=>{setFilter(f);location.hash='#/'}}>${f==='all'?'Ҳама':'♥ Интихобшуда'}</button>`)}
    <a class="chip" href="#/admin">⚙ Админ</a></nav></header>`;
}

function Card({e,fav,onFav}){
  const p=prog(e.id);
  return html`<a class="card" href=${'#/ep/'+e.id}>
    <img src=${cover(e)} alt=${e.name} loading="lazy"/>
    ${p>1?html`<span class="bm">Саҳ. ${p}</span>`:null}
    <button class=${'hb'+(fav?' on':'')} aria-label="Интихоб" onClick=${ev=>{ev.preventDefault();onFav(e.id)}}>♥</button>
    <div><b>Эпизоди ${e.n}</b><small>${e.name}</small></div></a>`;
}

function Marquee({list}){
  const ref=useRef(),box=useRef();
  const seq=useMemo(()=>{const s=[];while(s.length<8)s.push(...list);return s},[list]);
  useEffect(()=>{
    const el=ref.current,bx=box.current,slow=matchMedia('(prefers-reduced-motion:reduce)').matches;
    let pos=0,last=performance.now(),drag=null,hov=false,raf;
    const tick=t=>{const dt=Math.min(t-last,50);last=t;const w=el.scrollWidth/2;
      if(!drag&&!hov&&!slow)pos+=dt*0.045;pos=((pos%w)+w)%w;el.style.transform=`translate3d(${-pos}px,0,0)`;raf=requestAnimationFrame(tick)};
    raf=requestAnimationFrame(tick);
    const dn=e=>{drag={x:e.clientX,p:pos,m:false}};
    const mv=e=>{if(!drag)return;const d=e.clientX-drag.x;if(Math.abs(d)>6&&!drag.m){drag.m=true;bx.setPointerCapture(e.pointerId)}if(drag.m)pos=drag.p-d};
    const up=()=>{if(drag&&drag.m)bx._moved=true;drag=null};
    const en=e=>{if(e.pointerType==='mouse')hov=true},lv=()=>{hov=false};
    bx.addEventListener('pointerdown',dn);bx.addEventListener('pointermove',mv);bx.addEventListener('pointerup',up);bx.addEventListener('pointercancel',up);bx.addEventListener('pointerenter',en);bx.addEventListener('pointerleave',lv);
    const wh=e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){e.preventDefault();pos+=e.deltaX}};bx.addEventListener('wheel',wh,{passive:false});
    return()=>{cancelAnimationFrame(raf);bx.removeEventListener('pointerdown',dn);bx.removeEventListener('pointermove',mv);bx.removeEventListener('pointerup',up);bx.removeEventListener('pointercancel',up);bx.removeEventListener('pointerenter',en);bx.removeEventListener('pointerleave',lv);bx.removeEventListener('wheel',wh)}
  },[seq]);
  const click=ev=>{if(box.current._moved){ev.preventDefault();box.current._moved=false}};
  return html`<div class="mq" ref=${box} onClickCapture=${click}><div class="mq-track" ref=${ref}>
    ${[0,1].map(k=>seq.map((e,i)=>html`<a key=${k+'-'+i} href=${'#/ep/'+e.id} draggable="false"><img src=${cover(e)} alt=${e.name} draggable="false"/><span>Эп. ${e.n} · ${e.name}</span></a>`))}</div></div>`;
}

function Home({filter,favs,onFav}){
  const last=byId(LS.get('mv_last')),list=E.filter(e=>filter==='all'||favs.includes(e.id)),top=E.slice(0,10);
  return html`<div>
    <section class="hero">${E.length?html`<div class="hero-bg" style=${{backgroundImage:`url(${cover(E[0])})`}}></div>`:null}
      <div class="hero-txt"><span class="badge">Комикс</span><h1>Memoverse</h1>
        <p class="lead">Ҳар эпизод — як ҳикояи нав. Эпизодҳои нав мунтазам илова мешаванд.</p>
        <div class="cta">${E.length?html`<a class="btn" href=${'#/ep/'+E[0].id}>Эпизоди нав</a>`:null}
          ${last&&prog(last.id)>1?html`<a class="btn ghost" href=${`#/read/${last.id}/${prog(last.id)}`}>Давом додан · Эп. ${last.n}, саҳ. ${prog(last.id)}</a>`:null}</div></div>
      ${top.length?html`<${Marquee} list=${top}/>`:null}</section>
    <main><h2>${filter==='fav'?'Интихобшуда':'Ҳамаи эпизодҳо'}</h2>
      <div class="grid">${list.map(e=>html`<${Card} key=${e.id} e=${e} fav=${favs.includes(e.id)} onFav=${onFav}/>`)}</div>
      ${list.length?null:html`<p class="empty">Ҳоло чизе нест. Дар саҳифаи эпизод тугмаи ♥-ро пахш кунед.</p>`}</main>
    <footer>© Memoverse · Эпизоди навбатӣ ба зудӣ</footer></div>`;
}

function Episode({e,favs,onFav}){
  const p=prog(e.id),fav=favs.includes(e.id),others=E.filter(x=>x.id!==e.id);
  return html`<div><div class="ep">
    <aside class="ep-side"><img src=${cover(e)} alt=${e.name}/>
      <a class="btn" href=${`#/read/${e.id}/${p>1?p:1}`}>${p>1?`Давом додан · саҳ. ${p}`:'Хондан сар кун'}</a>
      ${p>1?html`<a class="btn ghost" href=${`#/read/${e.id}/1`}>Аз аввал</a>`:null}
      <button class=${'btn ghost'+(fav?' on':'')} onClick=${()=>onFav(e.id)}>${fav?'♥ Дар интихобшуда':'♡ Ба интихобшуда'}</button></aside>
    <section class="ep-main"><a class="crumb" href="#/">← Ҳамаи эпизодҳо</a>
      <h1>${e.name}</h1><p class="sub">Memoverse · Эпизоди ${e.n}</p>
      <div class="tags">${(e.tags||[]).map(t=>html`<span key=${t}>${t}</span>`)}</div>
      ${e.desc?html`<p class="d">${e.desc}</p>`:null}
      <div class="info"><div><span>Саҳифаҳо</span><b>${e.imgs.length}</b></div><div><span>Ҳолат</span><b>${e.status||'Давом дорад'}</b></div></div>
      ${others.length?html`<h2>Эпизодҳои дигар</h2><div class="row">${others.map(o=>html`<${Card} key=${o.id} e=${o} fav=${favs.includes(o.id)} onFav=${onFav}/>`)}</div>`:null}
    </section></div></div>`;
}

function Reader({e,start,favs,onFav}){
  const n=e.imgs.length,src=e.imgs,tr=useRef(),tm=useRef(),[p,setP]=useState(start),[toast,setToast]=useState('');
  const next=E.find(x=>x.n===e.n+1),fav=favs.includes(e.id);
  const go=useCallback((q,smooth=true)=>{q=Math.max(1,Math.min(n+1,q));const t=tr.current;t.style.scrollBehavior=smooth?'smooth':'auto';t.scrollTo({left:(q-1)*t.clientWidth});setP(q)},[n]);
  useEffect(()=>{document.body.style.overflow='hidden';go(Math.min(start,n+1),false);return()=>{document.body.style.overflow=''}},[]);
  useEffect(()=>{const v=Math.min(p,n);LS.set('mv_pg_'+e.id,v);LS.set('mv_last',e.id);history.replaceState(null,'',`#/read/${e.id}/${v}`)},[p]);
  useEffect(()=>{
    const k=ev=>{if(ev.key==='ArrowRight')go(p+1);if(ev.key==='ArrowLeft')go(p-1);if(ev.key==='Escape')location.hash='#/ep/'+e.id};
    const r=()=>go(p,false);addEventListener('keydown',k);addEventListener('resize',r);
    return()=>{removeEventListener('keydown',k);removeEventListener('resize',r)}},[p]);
  const onScroll=()=>{clearTimeout(tm.current);tm.current=setTimeout(()=>{const t=tr.current,q=Math.round(t.scrollLeft/t.clientWidth)+1;if(q!==p)setP(q)},90)};
  const like=()=>{onFav(e.id);setToast(fav?'Аз интихобшуда хориҷ шуд':'Ба интихобшуда илова шуд ♥');setTimeout(()=>setToast(''),1800)};
  const v=Math.min(p,n);
  return html`<div id="reader">
    <div class="bar"><button aria-label="Бозгашт" onClick=${()=>{location.hash='#/ep/'+e.id}}>←</button>
      <div class="ttl"><b>Эп. ${e.n} · ${e.name}</b><span>${p>n?'Охир':`Саҳифа ${v} аз ${n}`}</span></div>
      <button id="likeBtn" class=${fav?'on':''} aria-label="Интихоб" onClick=${like}>♥</button></div>
    <div class="prog"><i style=${{width:(v/n*100)+'%'}}></i></div>
    <div class="track" ref=${tr} onScroll=${onScroll}>
      ${src.map((s,i)=>html`<div class="pg" key=${i}><img src=${s} alt=${'Саҳифа '+(i+1)} loading=${i>1?'lazy':'eager'}/></div>`)}
      <div class="pg end"><h3>Давом дорад…</h3>
        ${next?html`<p>Эпизоди навбатӣ омода аст.</p><a class="btn" href=${`#/ep/${next.id}`}>Эпизоди ${next.n} →</a>`:html`<p>Эпизоди навбатӣ ба зудӣ мебарояд.</p>`}
        <a class="btn ghost" href=${'#/ep/'+e.id}>Ба саҳифаи эпизод</a></div></div>
    <button class="arr l" aria-label="Қафо" disabled=${p<=1} onClick=${()=>go(p-1)}>‹</button>
    <button class="arr r" aria-label="Пеш" disabled=${p>n} onClick=${()=>go(p+1)}>›</button>
    <div class="nav"><button onClick=${()=>go(1)}>«</button>
      <input type="range" min="1" max=${n} value=${v} onInput=${ev=>go(+ev.target.value)}/>
      <select value=${v} aria-label="Саҳифа" onChange=${ev=>go(+ev.target.value)}>${src.map((_,i)=>html`<option key=${i} value=${i+1}>${i+1} / ${n}</option>`)}</select>
      <button onClick=${()=>go(n)}>»</button></div>
    <div class=${'toast'+(toast?' show':'')}>${toast}</div></div>`;
}

function Admin({reload}){
  const [tok,setTok]=useState(sessionStorage.getItem('mv_tok')||''),[err,setErr]=useState('');
  const [f,setF]=useState({name:'',desc:'',tags:''}),[files,setFiles]=useState([]),[cov,setCov]=useState(null),[busy,setBusy]=useState(false),[msg,setMsg]=useState('');
  const thumbs=useMemo(()=>files.map(x=>URL.createObjectURL(x)),[files]),covUrl=useMemo(()=>cov?URL.createObjectURL(cov):'',[cov]);
  const addFiles=list=>setFiles(prev=>{const all=[...prev];[...list].filter(x=>x.type.startsWith('image/')).forEach(x=>{if(!all.some(y=>y.name===x.name&&y.size===x.size))all.push(x)});return all.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}))});
  const logout=()=>{sessionStorage.removeItem('mv_tok');setTok('')};
  const login=async ev=>{ev.preventDefault();const d=new FormData(ev.target),name=d.get('name'),password=d.get('password');setErr('');
    try{
      if(SERVER){const r=await fetch('api/login',{method:'POST',body:JSON.stringify({name,password})});
        if(r.ok){const j=await r.json();sessionStorage.setItem('mv_tok',j.token);setTok(j.token)}else setErr(r.status===429?'Хеле зиёд кӯшиш. Баъдтар кӯшиш кунед.':'Ном ё рамз нодуруст аст')}
      else if(await sha(name+':'+password)===HASH){sessionStorage.setItem('mv_tok','local');setTok('local')}else setErr('Ном ё рамз нодуруст аст');
    }catch(e){setErr('Хато. Саҳифаро аз localhost ё https кушоед.')}};
  const submit=async ev=>{ev.preventDefault();
    if(!f.name.trim())return setMsg('Номи эпизодро нависед');if(!files.length)return setMsg('Расмҳои эпизодро интихоб кунед');
    setBusy(true);setMsg('Расмҳо омода мешаванд…');
    try{
      const pages=[];for(const x of files)pages.push(await toJpeg(x));const c=cov?await toJpeg(cov,700):'';
      const tags=f.tags.split(',').map(t=>t.trim()).filter(Boolean);
      if(SERVER){const r=await fetch('api/episodes',{method:'POST',headers:{Authorization:'Bearer '+tok},body:JSON.stringify({name:f.name.trim(),desc:f.desc.trim(),tags,cover:c,pages})});
        if(r.status===401){logout();throw new Error('Сессия тамом шуд. Боз ворид шавед.')}if(!r.ok)throw new Error('Хато дар сервер')}
      else{const x=LS.get('mv_extra',[]),n=Math.max(0,...E.map(e=>e.n))+1;
        x.push({id:'ep'+n,n,name:f.name.trim(),desc:f.desc.trim(),status:'Давом дорад',tags,cover:c,imgs:pages,local:true});
        try{localStorage.setItem('mv_extra',JSON.stringify(x))}catch(q){throw new Error('Хотираи браузер пур шуд. Барои сайти воқеӣ «node server.js»-ро истифода баред.')}}
      await reload();setF({name:'',desc:'',tags:''});setFiles([]);setCov(null);setMsg(`Эпизод илова шуд ✓ (${pages.length} саҳифа) — корт дар саҳифаи асосӣ пайдо шуд.`);
    }catch(e){setMsg('⚠ '+e.message)}
    setBusy(false)};
  const del=async e=>{if(!confirm('«'+e.name+'» нест карда шавад?'))return;
    if(SERVER){const r=await fetch('api/episodes/'+e.id,{method:'DELETE',headers:{Authorization:'Bearer '+tok}});if(!r.ok)return setMsg('⚠ Нест нашуд')}
    else localStorage.setItem('mv_extra',JSON.stringify(LS.get('mv_extra',[]).filter(x=>x.id!==e.id)));
    await reload()};
  if(!tok)return html`<div class="adm" style=${{maxWidth:'440px'}}><form class="glass" onSubmit=${login}>
    <h2>Вуруд ба админ</h2><label>Ном</label><input type="text" name="name" autocomplete="username" required/>
    <label>Рамз</label><input type="password" name="password" autocomplete="current-password" required/>
    <button class="btn" style=${{width:'100%'}}>Ворид шудан</button>${err?html`<p class="msg err">${err}</p>`:null}</form></div>`;
  return html`<div class="adm"><div class="admtop"><h1>Админ</h1><button class="chip" onClick=${logout}>Баромадан</button></div>
    ${SERVER?null:html`<p class="sub">Реҷаи браузер: эпизодҳо танҳо дар ҳамин браузер нигоҳ дошта мешаванд. Барои ҳама — «node server.js».</p>`}
    <form class="glass" onSubmit=${submit}><h2>Эпизоди нав</h2>
      <label>Номи эпизод</label><input type="text" value=${f.name} onInput=${ev=>setF({...f,name:ev.target.value})}/>
      <label>Коментария / тавсиф</label><textarea value=${f.desc} onInput=${ev=>setF({...f,desc:ev.target.value})}></textarea>
      <label>Жанрҳо (бо вергул ҷудо кунед)</label><input type="text" placeholder="боевик, фэнтези" value=${f.tags} onInput=${ev=>setF({...f,tags:ev.target.value})}/>
      <label>Расмҳои саҳифаҳо (бо тартиби ном)</label>
      <label class="drop" onDragOver=${ev=>ev.preventDefault()} onDrop=${ev=>{ev.preventDefault();addFiles(ev.dataTransfer.files)}}>${files.length?`${files.length} расм интихоб шуд — барои илова кардани боз ҳам пахш кунед ё кашида партоед`:'Расмҳоро интихоб кунед ё кашида партоед (якбора якчанд)'}
        <input type="file" accept="image/*" multiple onChange=${ev=>{addFiles(ev.target.files);ev.target.value=''}}/></label>
      ${thumbs.length?html`<div class="thumbs">${thumbs.map((u,i)=>html`<div key=${i} class=${cov===files[i]?'iscov':''}><img src=${u}/><b>${i+1}</b><button type="button" aria-label="Хориҷ кардан" onClick=${()=>setFiles(fs=>fs.filter((_,j)=>j!==i))}>×</button><button type="button" class="st" title="Муқова кардан" onClick=${()=>setCov(files[i])}>★</button></div>`)}</div>`:null}
      <label>Муқова — дар болои расм ★ пахш кунед ё аз файл интихоб кунед (агар набошад, саҳифаи 1)</label>
      ${covUrl?html`<div class="covprev"><img src=${covUrl}/><span>Муқова</span><button type="button" onClick=${()=>setCov(null)}>× Хориҷ кардан</button></div>`:null}
      <label class="drop">${cov?'Муқоваи дигар интихоб кунед':'Муқоваро аз файл интихоб кунед'}<input type="file" accept="image/*" onChange=${ev=>{setCov(ev.target.files[0]||null);ev.target.value=''}}/></label>
      <button class="btn" disabled=${busy}>${busy?'Лутфан интизор шавед…':'Илова кардан'}</button>
      ${msg?html`<p class=${'msg'+(msg[0]==='⚠'?' err':'')}>${msg}</p>`:null}</form>
    <div class="glass"><h2>Эпизодҳо (${E.length})</h2>
      ${E.map(e=>html`<div class="arow" key=${e.id}><img src=${cover(e)}/><div><b>Эп. ${e.n} · ${e.name}</b><small>${e.imgs.length} саҳифа</small></div>
        ${SERVER||e.local?html`<button onClick=${()=>del(e)}>Нест кардан</button>`:null}</div>`)}</div></div>`;
}

function App(){
  const h=useHash(),[ready,setReady]=useState(false),[,bump]=useState(0),[filter,setFilter]=useState('all'),[favs,setFavs]=useState(LS.get('mv_favs',[]));
  const reload=useCallback(async()=>{await loadAll();bump(x=>x+1)},[]);
  useEffect(()=>{loadAll().then(()=>setReady(true))},[]);
  const onFav=id=>setFavs(f=>{const x=f.includes(id)?f.filter(i=>i!==id):[...f,id];LS.set('mv_favs',x);return x});
  if(!ready)return html`<p class="empty" style=${{padding:'40px 5vw'}}>Бор мешавад…</p>`;
  const rd=h.match(/^#\/read\/([\w-]+)\/(\d+)/),ep=h.match(/^#\/ep\/([\w-]+)/);
  if(rd&&byId(rd[1]))return html`<${Reader} key=${rd[1]} e=${byId(rd[1])} start=${+rd[2]} favs=${favs} onFav=${onFav}/>`;
  return html`<${Header} filter=${filter} setFilter=${setFilter}/>
    ${h.startsWith('#/admin')?html`<${Admin} reload=${reload}/>`:ep&&byId(ep[1])?html`<${Episode} key=${ep[1]} e=${byId(ep[1])} favs=${favs} onFav=${onFav}/>`:html`<${Home} filter=${filter} favs=${favs} onFav=${onFav}/>`}`;
}
ReactDOM.createRoot(document.getElementById('root')).render(html`<${App}/>`);
