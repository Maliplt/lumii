'use strict';

// Each bit represents one connector, clockwise from north. Generation starts
// with a spanning tree, so every scrambled board has a reachable solved state.
const Circuit=(()=>{
  const dirs=[[-1,0],[0,1],[1,0],[0,-1]];
  const rotate=(mask,turns=1)=>{turns=((turns%4)+4)%4;return ((mask<<turns)|(mask>>(4-turns)))&15;};
  const rng=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
  function hash(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
  function connected(masks,n,root){
    const lit=Array(n*n).fill(false),depth=Array(n*n).fill(0),queue=[root];lit[root]=true;
    for(let k=0;k<queue.length;k++){
      const i=queue[k],r=Math.floor(i/n),c=i%n;
      dirs.forEach(([dr,dc],d)=>{const nr=r+dr,nc=c+dc,j=nr*n+nc;
        if(nr<0||nc<0||nr>=n||nc>=n||lit[j]||!(masks[i]&(1<<d))||!(masks[j]&(1<<((d+2)%4))))return;
        lit[j]=true;depth[j]=depth[i]+1;queue.push(j);
      });
    }
    return {lit,depth,count:queue.length};
  }
  function base(seed,level){
    const chapter=BigInt(level),boss=chapter%10n===0n,n=chapter<=3n?3:chapter<=14n?4:chapter<=39n?5:6;
    const random=rng(hash(`${seed}/${chapter}`)),size=chapter%20n===0n?(chapter>=60n?8:7):boss?Math.min(6,n+1):n;
    const root=Math.floor(size/2)*size+Math.floor((size-1)/2),solution=Array(size*size).fill(0),visited=new Set([root]),frontier=[root];
    while(frontier.length){
      const at=random()<(boss?.9:.65)?frontier.length-1:Math.floor(random()*frontier.length),i=frontier[at],r=Math.floor(i/size),c=i%size;
      const choices=dirs.map(([dr,dc],d)=>({r:r+dr,c:c+dc,d})).filter(p=>p.r>=0&&p.r<size&&p.c>=0&&p.c<size&&!visited.has(p.r*size+p.c));
      if(!choices.length){frontier.splice(at,1);continue;}
      const p=choices[Math.floor(random()*choices.length)],j=p.r*size+p.c;solution[i]|=1<<p.d;solution[j]|=1<<((p.d+2)%4);visited.add(j);frontier.push(j);
    }
    const masks=solution.map(m=>rotate(m,Math.floor(random()*4)));
    // Rotate a leaf if a rare random scramble is already solved.
    if(connected(masks,size,root).count===masks.length){const i=solution.findIndex(m=>(m&(m-1))===0);masks[i]=rotate(masks[i]);}
    const crystals=solution.map((m,i)=>(m&(m-1))===0&&i!==root?i:-1).filter(i=>i>=0);
    const par=masks.reduce((sum,m,i)=>{let turn=0;while(rotate(m,turn)!==solution[i]&&turn<4)turn++;return sum+turn;},0);
    return {n:size,root,solution,masks,crystals,par,level:String(chapter),boss};
  }
  function difficulty(level){const k=BigInt(level),boss=k%10n===0n,n=k<=3n?3:k<=14n?4:k<=39n?5:6;return {n:k%20n===0n?(k>=60n?8:7):boss?Math.min(6,n+1):n,boss,tier:k<15n?0:k<40n?1:k<100n?2:3};}
  function complexity(b){const net=connected(b.solution,b.n,b.root);const branches=b.solution.filter(m=>[7,11,13,14,15].includes(m)).length;return Math.max(...net.depth)*2+branches*3+b.par;}
  function generate(seed,level){
    const profile=difficulty(level),k=BigInt(level),within=Number((k-1n)%10n),samples=profile.boss?12:2+Math.floor(within/3)+profile.tier;
    let best=null;for(let a=0;a<samples;a++){const b=base(hash(`${seed}:v2:${a}`),level);if(!best||complexity(b)>complexity(best))best=b;}
    best.fixed=[];
    if(k>=8n){const count=Math.max(1,Math.floor(best.n*(profile.boss?.7:.4)));const order=best.solution.map((_,i)=>i).filter(i=>i!==best.root).sort((a,b)=>hash(`${seed}:${level}:pin:${a}`)-hash(`${seed}:${level}:pin:${b}`));best.fixed=order.slice(0,count);for(const i of best.fixed)best.masks[i]=best.solution[i];}
    if(connected(best.masks,best.n,best.root).count===best.masks.length){const i=best.masks.findIndex((m,i)=>!best.fixed.includes(i)&&m!==15);best.masks[i]=rotate(best.masks[i]);}
    best.par=best.masks.reduce((sum,m,i)=>{let r=0;while(rotate(m,r)!==best.solution[i]&&r<4)r++;return sum+r;},0);
    best.difficulty=profile.tier;return best;
  }
  return {rotate,connected,generate,hash,difficulty,complexity};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=Circuit;

if(typeof document!=='undefined')(()=>{
 const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const read=k=>{try{return JSON.parse(localStorage.getItem('prizma.'+k));}catch{return null;}},write=(k,v)=>{try{localStorage.setItem('prizma.'+k,JSON.stringify(v));}catch{}};
 const legacy=read('journey'),saved=read('journey.v2');
 const validLevel=x=>typeof x==='string'&&/^[1-9]\d{0,99}$/.test(x);
 const progress={seed:Number.isInteger(saved?.seed)?saved.seed:Number.isInteger(legacy?.seed)?legacy.seed:crypto.getRandomValues(new Uint32Array(1))[0],next:validLevel(saved?.next)?saved.next:validLevel(legacy?.next)?legacy.next:'1',records:saved?.records||legacy?.records||{}};
 const save=()=>write('journey.v2',progress);save();
 let lang=read('lang.v2')==='en'?'en':'tr';
 const words={introLabel:['BİR IŞIK BULMACASI','A LIGHT PUZZLE'],tagline:['Yolları döndür. Bağlantıyı tamamla.','Turn the paths. Complete the connection.'],energy:['SAF ENERJİ','PURE ENERGY'],play:['OYNA','PLAY'],levels:['Bölümler','Levels'],learn:['Nasıl oynanır?','How to play'],journey:['SEÇ · DÖNDÜR · BAĞLA','SELECT · ROTATE · CONNECT'],mapTitle:['Devre arşivi','Circuit archive'],menu:['Ana menü','Home'],myLevel:['Bölümüme dön','My level'],level:['BÖLÜM','LEVEL'],time:['SÜRE','TIME'],moves:['HAMLE','MOVES'],undo:['Geri al','Undo'],hint:['Yol göster','Hint'],reset:['Sıfırla','Reset'],objective:['Hepsini uyandır.','Wake them all.'],objectiveSmall:['Tek kaynak. Tam bağlantı.','One source. Every tile.'],connected:['TAM GÜÇ!','FULL POWER!'],resultTitle:['Müthiş bağlantı!','Brilliantly done!'],score:['PUAN','SCORE'],next:['DEVAM ET','CONTINUE'],retry:['Tekrar çöz','Try again'],pauseTitle:['Kısa bir mola.','Take a breath.'],pauseBody:['Devren seni bekliyor.','Your circuit is waiting.'],resume:['OYUNA DÖN','RESUME'],helpTitle:['Enerjiyi bağla!','Connect the energy!'],rule1:['Dokun: parça 90° dönsün.','Tap to rotate a tile 90°.'],rule2:['Enerji kaynağını bütün parçalara bağla.','Connect every tile to the energy source.'],rule3:['Kristalleri uyandır, tam güce ulaş.','Wake the crystals. Reach full power.'],tryTutorial:['DENEYEREK ÖĞREN','TRY IT YOURSELF'],cancel:['Vazgeç','Cancel'],resetTitle:['Yeniden deneyelim mi?','A fresh start?'],resetBody:['Aynı bulmaca başa döner. İpucu kullanımı korunur.','The same puzzle starts over. Used hints still count.'],resetAction:['YENİDEN BAŞLA','RESTART'],leaveTitle:['Bölümlere dön?','Back to levels?'],leaveBody:['Hamlelerin kaydedilir. İstediğin zaman devam edebilirsin.','Your moves are saved. Come back anytime.'],leaveAction:['BÖLÜMLERE DÖN','BACK TO LEVELS'],tutorialTitle:['Birlikte bağlayalım.','Let’s connect.'],tutorial0:['Bu parçayı döndür.','Rotate this tile.'],tutorial1:['Şimdi yolu yukarı bağla.','Now connect the path above.'],tutorial2:['Son kristali uyandır!','Wake the last crystal!'],tutorialDone:['Hazırsın!','You’re ready!'],startReal:['İLK BÖLÜME GEÇ','LET’S PLAY'],challenge:['GÜÇ SINAVI','POWER TEST'],names0:['İlk kıvılcım','First spark'],names1:['Akımı yakala','Catch the current'],names2:['Bağlantı ustası','Connection master'],names3:['Tam kapasite','Full capacity'],difficulty0:['ISINMA','WARM UP'],difficulty1:['ODAK','FOCUS'],difficulty2:['USTALIK','EXPERT'],difficulty3:['YÜKSEK VOLTAJ','HIGH VOLTAGE'],gained:['YENİ BAĞLANTI','NEW CONNECTIONS'],crystals:['KRİSTAL','CRYSTALS'],hintEmpty:['Bu bölümde 3 ipucu kullanıldı.','All 3 hints used this level.'],hintTitle:['Küçük bir yönlendirme','A little nudge'],hintBody:['Parmağın gösterdiği parçayı döndür. Doğru yöne gelene kadar işaret kalır.','Turn the tile under the finger. It stays until the path faces the right way.'],okay:['TAMAM','OKAY'],locked:['Kilitli','Locked'],turn:['Döndür','Rotate'],soundOn:['Sesi kapat','Mute'],soundOff:['Sesi aç','Unmute'],saved:['Devam et','Continue'],chapter:['SERİ','SET'],completed:['tamamlandı','completed'],unlock:['açıldı','unlocked'],endless:['Sonsuz yol','Endless path']};
 const t=k=>words[k]?.[lang==='en'?1:0]??k,svg=id=>`<svg aria-hidden="true"><use href="#${id}"/></svg>`;
 let state='menu',busy=false,sequence=0,board=null,masks=[],lit=[],depth=[],moves=0,hints=0,history=[],rotations=[],gains=[],elapsed=0,started=0,level=progress.next,hinted=-1,hover=-1,focused=-1,tutorial=false,tutorialStep=0,tutorialReturn='menu',tutorialResume=null,lastResult=null,modalKind='',modalPaused=false,winTimers=[],mapStart=0n,feedbackUntil=0;
 const allowed={menu:['playing','map'],map:['menu','playing'],playing:['paused','celebrating'],paused:['playing','map','menu'],celebrating:['result','map','menu'],result:['playing','map','menu']};
 const screen=s=>['playing','paused','celebrating'].includes(s)?'game':s;
 const nowTime=()=>elapsed+(state==='playing'?performance.now()-started:0),time=ms=>`${String(Math.floor(ms/60000)).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`;
 async function change(next){
  if(next===state)return;if(!allowed[state]?.includes(next))throw Error(`State ${state} → ${next}`);
  if(state==='playing')elapsed+=performance.now()-started;
  const old=$(screen(state)),target=$(screen(next));state=next;document.body.dataset.state=next;if(next==='playing')started=performance.now();
  if(old===target)return;
  const token=++sequence;busy=true;
  if(!reduce())await old.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.975) translateY(-6px)'}],{duration:170,easing:'ease-in'}).finished.catch(()=>{});
  if(token!==sequence)return;old.hidden=true;target.hidden=false;fit();
  if(!reduce())await target.animate([{opacity:0,transform:'translateY(13px) scale(.975)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:290,easing:'cubic-bezier(.2,.85,.25,1)'}).finished.catch(()=>{});
  if(token===sequence){busy=false;target.querySelector('button:not(:disabled)')?.focus({preventScroll:true});}
 }
 const audio={ctx:null,muted:read('mute.v2')===true,
  unlock(){if(this.muted)return;try{this.ctx??=new(window.AudioContext||window.webkitAudioContext)();this.ctx.resume().catch(()=>{});}catch{}},
  tone(f,d,delay=0,type='sine',volume=.055,end=f){if(this.muted||!this.ctx)return;const at=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,at);o.frequency.exponentialRampToValueAtTime(Math.max(25,end),at+d);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(volume,at+.005);g.gain.exponentialRampToValueAtTime(.0001,at+d);o.connect(g);g.connect(this.ctx.destination);o.start(at);o.stop(at+d+.015);o.onended=()=>{o.disconnect();g.disconnect();};},
  play(kind,size=1){this.unlock();if(kind==='tap'){this.tone(260,.024,0,'triangle',.07,110);this.tone(900,.016,.008,'sine',.02);}if(kind==='light'){const f=392*Math.pow(2,Math.min(size,6)/12);this.tone(f,.17);this.tone(f*1.5,.22,.055,'sine',.045);}if(kind==='dim')this.tone(115,.07,0,'triangle',.022,72);if(kind==='open'){this.tone(330,.08);this.tone(440,.11,.05);}if(kind==='win')[392,493.88,587.33,783.99,987.77].forEach((f,i)=>this.tone(f,.55,i*.085,'sine',.055));}
 };
 function labels(){document.documentElement.lang=lang;document.querySelectorAll('[data-text]').forEach(e=>e.textContent=t(e.dataset.text));$('language').textContent=lang==='tr'?'EN':'TR';$('sound').classList.toggle('muted',audio.muted);$('sound').setAttribute('aria-label',t(audio.muted?'soundOff':'soundOn'));$('help').setAttribute('aria-label',t('learn'));$('pause').setAttribute('aria-label',t('pauseTitle'));$('map-prev').setAttribute('aria-label',lang==='tr'?'Önceki bölümler':'Previous levels');$('map-next').setAttribute('aria-label',lang==='tr'?'Sonraki bölümler':'Next levels');
  const gems=Object.values(progress.records).reduce((s,r)=>s+(Number(r.stars)||0),0);$('total-gems').innerHTML=svg('gem')+`<span>${gems}</span>`;$('menu-level').textContent=`${t('level')} ${progress.next}`;const previewLabel=$('preview-level');if(previewLabel)previewLabel.textContent=`${t('level')} ${progress.next.padStart(2,'0')}`;
  const k=BigInt(progress.next)-1n;$('home-progress-label').textContent=`${t('chapter')} ${k/10n+1n} · ${Number(k%10n)} / 10`;$('home-progress-score').textContent=`${gems} ◇`;$('home-progress-fill').style.width=`${Number(k%10n)*10}%`;
  if(board)hud();if(state==='map')renderMap();if(modalKind)renderModal();if(lastResult&&state==='result')renderResult();
 }
 function persistSession(){if(!board||tutorial||!['playing','paused'].includes(state))return;write('session.v2',{level,masks,moves,hints,history,elapsed:nowTime()});}
 function validSession(s,b){return s&&s.level===b.level&&Array.isArray(s.masks)&&s.masks.length===b.masks.length&&s.masks.every((m,i)=>(!b.fixed?.includes(i)||m===b.solution[i])&&Number.isInteger(m)&&[0,1,2,3].some(r=>Circuit.rotate(b.solution[i],r)===m))&&Number.isFinite(s.elapsed)&&s.elapsed>=0&&Number.isInteger(s.moves)&&s.moves>=0&&Number.isInteger(s.hints)&&s.hints>=0&&s.hints<=3;}
 const tutorialBoard=()=>({n:3,root:6,solution:[6,10,8,5,2,12,3,10,9],masks:[6,10,8,10,1,12,3,10,12],crystals:[2,4],par:3,level:'0',boss:false,difficulty:0});
 const tutorialExpected=[3,8,4];
 async function launch(which=progress.next,{fresh=false,learn=false}={}){
  if(busy)return;winTimers.forEach(clearTimeout);winTimers=[];tutorial=learn;tutorialStep=0;level=String(which);
  if(!learn&&(!validLevel(level)||BigInt(level)>BigInt(progress.next)))return;
  board=learn?tutorialBoard():Circuit.generate(progress.seed,level);masks=[...board.masks];moves=hints=elapsed=0;history=[];hinted=-1;lit=[];depth=[];hover=focused=-1;
  const session=!learn&&!fresh?read('session.v2'):null;
  if(validSession(session,board)&&Circuit.connected(session.masks,board.n,board.root).count<board.masks.length){masks=[...session.masks];moves=session.moves;hints=session.hints;elapsed=session.elapsed;history=Array.isArray(session.history)?session.history.filter(a=>Number.isInteger(a.i)&&a.i>=0&&a.i<masks.length&&!board.fixed?.includes(a.i)&&[0,1,2,3].some(r=>Circuit.rotate(board.solution[a.i],r)===a.mask)).slice(-500):[];}
  rotations=masks.map(()=>({from:0,to:0,at:-1000}));gains=masks.map(()=>-1000);$('board').classList.remove('sealed');$('game').dataset.tutorial=String(learn);$('game').dataset.boss=String(board.boss);$('tutorial-bar').hidden=!learn;$('tiles').replaceChildren();$('tiles').style.setProperty('--n',board.n);
  masks.forEach((m,i)=>{const b=document.createElement('button');b.className='tile';b.dataset.index=i;b.tabIndex=i===board.root?0:-1;b.title=lang==='tr'?'Sol tık: saat yönü · Sağ tık: ters yön':'Click: clockwise · Right click: counterclockwise';b.onclick=()=>turn(i);b.oncontextmenu=e=>{e.preventDefault();if(!tutorial)turn(i,-1);};b.onpointerenter=()=>hover=i;b.onpointerleave=()=>hover=-1;b.onfocus=()=>focused=i;b.onblur=()=>focused=-1;$('tiles').append(b);});
  recompute(false);if(state!=='playing')await change('playing');else{started=performance.now();fit();}hud();if(learn)guide();audio.play('open');persistSession();
 }
 function hud(){if(!board)return;const count=lit.filter(Boolean).length,crystalCount=board.crystals.filter(i=>lit[i]).length;
  $('level-label').textContent=tutorial?t('tutorialTitle'):`${t('level')} ${level}`;$('game-title').textContent=tutorial?t('tutorialTitle'):board.n>6?(lang==='tr'?'Büyük düzen':'Grand circuit'):board.boss?t('challenge'):t('names'+board.difficulty);$('level-stamp').textContent=level;$('difficulty-label').textContent=t('difficulty'+board.difficulty);
  $('power').textContent=Math.round(count/masks.length*100);$('energy-fill').style.width=`${count/masks.length*100}%`;$('crystals').textContent=`◇ ${crystalCount} / ${board.crystals.length}`;$('crystals').title=lang==='tr'?'Bağlanan kristaller':'Connected crystals';const fixedLabel=$('fixed-label');if(fixedLabel){fixedLabel.hidden=!board.fixed?.length;fixedLabel.textContent=board.fixed?.length?`${board.fixed.length} ${lang==='tr'?'sabit parça · vidalı parçalar dönmez':'fixed tiles · screwed tiles cannot rotate'}`:'';}$('moves').textContent=moves;$('time').textContent=time(nowTime());$('hint-count').textContent=3-hints;
  const off=state==='celebrating';$('undo').disabled=off||tutorial||!history.length;$('hint').disabled=off||tutorial||hints>=3;$('reset').disabled=off||tutorial;$('pause').disabled=off;
  [...$('tiles').children].forEach((b,i)=>{b.disabled=off||board.fixed?.includes(i);if(board.fixed?.includes(i))b.title=lang==='tr'?'Sabit parça — döndürülemez':'Fixed tile — cannot rotate';b.setAttribute('aria-pressed',String(lit[i]));b.setAttribute('aria-label',`${board.fixed?.includes(i)?(lang==='tr'?'Sabit parça':'Fixed tile'):t('turn')}: ${Math.floor(i/board.n)+1}, ${i%board.n+1}${lit[i]?' · '+(lang==='tr'?'bağlı':'connected'):''}`);});
  const k=tutorial?0n:BigInt(level)-1n;$('chapter-progress').replaceChildren();for(let i=0;i<10;i++){const el=document.createElement('i');el.className=i<Number(k%10n)?'done':i===Number(k%10n)?'current':'';$('chapter-progress').append(el);}$('milestone-label').textContent=`${t('challenge')} · ${((k/10n)+1n)*10n}`;
  if(tutorial){$('tutorial-step').textContent=`${Math.min(3,tutorialStep+1)} / 3`;$('tutorial-copy').textContent=t('tutorial'+Math.min(2,tutorialStep));}
 }
 function recompute(feedback=true){const next=Circuit.connected(masks,board.n,board.root),at=performance.now(),newly=next.lit.map((on,i)=>on&&!lit[i]?i:-1).filter(i=>i>=0),lost=lit.filter((on,i)=>on&&!next.lit[i]).length;
  newly.forEach((i,k)=>gains[i]=at+Math.min(k*24,300));lit=next.lit;depth=next.depth;
  if(feedback&&newly.length){audio.play('light',newly.length);newly.forEach((i,k)=>{if(board.crystals.includes(i))burst(i,'#bf8154',20);});const toast=$('connection-reward');if(toast){toast.textContent=`+${newly.length} ${lang==='tr'?'bağlantı':'connections'}`;toast.classList.add('visible');}$('chain-feedback').classList.add('visible');$('chain-feedback').querySelector('strong').textContent=`+${newly.length}`;$('chain-feedback').querySelector('span').textContent=t('gained');feedbackUntil=at+1350;}else if(feedback&&lost)audio.play('dim');hud();return next.count===masks.length;
 }
 function turn(i,direction=1){if(state!=='playing'||busy||i<0||i>=masks.length||board.fixed?.includes(i))return;const at=performance.now();if(at-rotations[i].at<150)return;
  if(tutorial&&i!==tutorialExpected[tutorialStep]){burst(tutorialExpected[tutorialStep],'#d8a366',5);return;}
  history.push({i,mask:masks[i],direction});if(history.length>500)history.shift();masks[i]=Circuit.rotate(masks[i],direction);moves++;const r=rotations[i];r.from=currentAngle(r,at);r.to+=direction*Math.PI/2;r.at=at;
  if(hinted===i&&masks[i]===board.solution[i])hinted=-1;
  audio.play('tap');const won=recompute();burst(i,lit[i]?'#d8a366':'#8ca59a',lit[i]?10:5);
  if(tutorial){tutorialStep++;guide();}else placePointer();persistSession();if(won)win();
 }
 function undo(){if(state!=='playing'||busy||tutorial||!history.length)return;const a=history.pop(),r=rotations[a.i],at=performance.now();masks[a.i]=a.mask;moves++;r.from=currentAngle(r,at);r.to-=(a.direction===-1?-1:1)*Math.PI/2;r.at=at;if(hinted===a.i&&masks[a.i]===board.solution[a.i])hinted=-1;recompute();placePointer();persistSession();audio.play('tap');}
 function hint(){if(state!=='playing'||tutorial||busy||hints>=3)return;if(hinted>=0){burst(hinted,'#d8a366',8);return;}hinted=masks.findIndex((m,i)=>lit[i]&&m!==board.solution[i]);if(hinted<0)hinted=masks.findIndex((m,i)=>m!==board.solution[i]);if(hinted<0)return;hints++;placePointer();hud();persistSession();audio.play('light');}
 function guide(){hinted=tutorialStep<3?tutorialExpected[tutorialStep]:-1;placePointer();hud();}
 function placePointer(){const el=$('pointer');el.hidden=hinted<0||state==='celebrating';if(el.hidden||!board)return;const tile=$('tiles').children[hinted];if(!tile)return;el.style.left=`${tile.offsetLeft+tile.offsetWidth*.56}px`;el.style.top=`${tile.offsetTop+tile.offsetHeight*.56}px`;}
 function win(){change('celebrating');hinted=-1;placePointer();hud();audio.play('win');$('announce').textContent=t('connected');
  const stars=hints===0&&moves<=board.par+Math.max(4,Math.floor(board.par*.3))?3:hints<=1&&moves<=board.par*2?2:1,score=Math.max(100,board.n*800-moves*8-Math.floor(elapsed/1000)-hints*140);
  lastResult={stars,score,ms:elapsed,moves,tutorial,level};
  if(!tutorial){const old=progress.records[level];progress.records[level]={stars:Math.max(old?.stars||0,stars),score:Math.max(old?.score||0,score)};if(BigInt(level)>=BigInt(progress.next))progress.next=String(BigInt(level)+1n);save();write('session.v2',null);}else write('learned.v2',true);
  board.crystals.forEach((i,k)=>winTimers.push(setTimeout(()=>burst(i,'#bf8154',25),k*65)));winTimers.push(setTimeout(()=>$('board').classList.add('sealed'),650));winTimers.push(setTimeout(()=>{renderResult();change('result');labels();},2000));
 }
 function renderResult(){if(!lastResult)return;const r=lastResult;$('result-title').textContent=r.tutorial?t('tutorialDone'):t('resultTitle');$('result-level').textContent=r.tutorial?t('tutorialTitle'):`${t('level')} ${r.level} · ${t('connected')}`;$('result-time').textContent=time(r.ms);$('result-moves').textContent=r.moves;$('result-score').textContent=r.score.toLocaleString(lang);$('rating').innerHTML=[0,1,2].map(i=>`<span class="medal ${i>=r.stars?'empty':''}" aria-hidden="true">${i<r.stars?'✓':'·'}</span>`).join('');$('rating').setAttribute('aria-label',`${r.stars} / 3`);$('unlock-label').textContent=r.tutorial?t('startReal'):`${t('level')} ${progress.next} ${t('unlock')}`;$('next').querySelector('span').textContent=r.tutorial?t('startReal'):t('next');}
 function openModal(kind){if(busy||state==='celebrating'||$('dialog').open)return;audio.unlock();modalPaused=state==='playing';if(modalPaused){change('paused');persistSession();}modalKind=kind;renderModal();$('dialog').showModal();}
 function closeModal(resume=true){$('dialog').close();modalKind='';if(resume&&modalPaused&&state==='paused')change('playing');modalPaused=false;}
 function modalButton(key,fn,quiet=false){const b=document.createElement('button');b.className='button '+(quiet?'quiet':'primary');b.textContent=t(key);b.onclick=fn;$('dialog-actions').append(b);}
 function renderModal(){const kind=modalKind;$('dialog-title').textContent=t(kind+'Title');$('dialog-body').replaceChildren();$('dialog-actions').replaceChildren();
  if(kind==='help'){$('dialog-body').innerHTML=`<div class="help-visual" aria-hidden="true">${svg('bolt')}<span>↻</span>${svg('gem')}</div>`;for(let i=1;i<=3;i++){const r=document.createElement('div');r.className='help-rule';r.innerHTML=`<b>${i}</b><span>${t('rule'+i)}</span>`;$('dialog-body').append(r);}modalButton('tryTutorial',()=>{tutorialReturn=state==='paused'?'playing':state;tutorialResume=read('session.v2');closeModal(false);launch('0',{learn:true});});modalButton('cancel',()=>closeModal(),true);return;}
  const p=document.createElement('p');p.textContent=t(kind+'Body');$('dialog-body').append(p);
  if(kind==='pause'){modalButton('resume',()=>closeModal());modalButton('levels',()=>{closeModal(false);goMap();},true);}
  if(kind==='leave'){modalButton('leaveAction',()=>{closeModal(false);goMap();});modalButton('cancel',()=>closeModal(),true);}
  if(kind==='reset'){modalButton('resetAction',()=>{const spent=hints;closeModal();launch(level,{fresh:true}).then(()=>{hints=spent;hud();persistSession();});});modalButton('cancel',()=>closeModal(),true);}
 }
 async function goMap(center=true){if(busy)return;persistSession();if(state==='playing')change('paused');tutorial=false;hinted=-1;if(center)mapStart=(BigInt(progress.next)-1n)/10n*10n;renderMap();await change('map');renderMap();audio.play('open');}
 const previewCache=new Map();
 function preview(number){
  if(!previewCache.has(number)){
   const b=Circuit.generate(progress.seed,number),n=b.n,lit=Circuit.connected(b.masks,n,b.root).lit;let tiles='';
   b.masks.forEach((mask,i)=>{
    const x=(i%n)*24,y=Math.floor(i/n)*24,root=i===b.root,fixed=b.fixed?.includes(i),on=lit[i],ends=[];
    for(let d=0;d<4;d++)if(mask&(1<<d))ends.push(d);
    const pt=d=>[11+Math.sin(d*Math.PI/2)*11,11-Math.cos(d*Math.PI/2)*11];let path='';
    if(ends.length===2&&(ends[0]+2)%4!==ends[1]){const a=pt(ends[0]),b=pt(ends[1]);path=`M${a} L${11+(a[0]-11)*.36} ${11+(a[1]-11)*.36} Q11 11 ${11+(b[0]-11)*.36} ${11+(b[1]-11)*.36} L${b}`;}
    else ends.forEach(d=>{path+=`M11 11 L${pt(d)}`;});
    tiles+=`<g transform="translate(${x} ${y})"><rect y="1" width="22" height="22" rx="4" fill="#c8c3b5"/><rect width="22" height="22" rx="4" fill="${fixed?'#dad3c2':on?'#fff3da':'#faf7ee'}"/><path d="${path}" fill="none" stroke="${on?'#aa6046':'#6e8d89'}" stroke-width="4" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${on?'#d47e5c':'#92aaa6'}" stroke-width="3" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${on?'#edb08b':'#c9d9d1'}" stroke-width=".8" stroke-linejoin="round"/>`;
    if(root||b.crystals.includes(i))tiles+=`<circle cx="11" cy="11" r="${root?4:3}" fill="${on?'#d47e5c':'#92aaa6'}"/><circle cx="11" cy="11" r="${root?2:1.4}" fill="#fff7df"/>`;
    if(fixed)tiles+='<circle cx="3" cy="3" r=".7" fill="#968b74"/>';
    tiles+='</g>';
   });
   previewCache.set(number,`<svg class="level-preview" viewBox="-1 -1 ${n*24} ${n*24}" aria-hidden="true">${tiles}</svg>`);if(previewCache.size>40)previewCache.delete(previewCache.keys().next().value);
  }return previewCache.get(number);
 }
 function renderMap(){
  $('map-nodes').replaceChildren();$('map-road').replaceChildren();
  for(let i=0;i<10;i++){const number=String(mapStart+BigInt(i)+1n),record=progress.records[number],locked=BigInt(number)>BigInt(progress.next),current=number===progress.next,boss=BigInt(number)%10n===0n;
   const b=document.createElement('button');b.className='map-node'+(record?' done':'')+(current?' current':'')+(boss?' boss':'');b.disabled=locked;b.dataset.level=number;
   b.innerHTML=`<div class="level-card-top"><strong>${number.length>6?'…'+number.slice(-4):number.padStart(2,'0')}</strong><small>${record?'●'.repeat(record.stars):current?'▶':svg('lock')}</small></div>${locked?`<span class="level-locked" aria-hidden="true">${svg('lock')}</span>`:preview(number)}<span class="level-card-caption">${boss?t('challenge'):Circuit.difficulty(number).n+' × '+Circuit.difficulty(number).n}</span>`;
   b.setAttribute('aria-label',`${t('level')} ${number}${locked?' · '+t('locked'):''}${record?' · '+record.stars+'/3':''}`);b.onclick=()=>launch(number);$('map-nodes').append(b);
  }
  $('map-sector').textContent=`${t('chapter')} ${mapStart/10n+1n} / ${mapStart+1n}–${mapStart+10n}`;$('map-record').textContent=`${Object.keys(progress.records).length} ${t('completed')}`;$('map-prev').disabled=mapStart===0n;$('map-play').querySelector('span').textContent=`${t('play')} · ${t('level')} ${progress.next}`;
 }
 function shiftMap(delta){if(busy||state!=='map')return;mapStart=mapStart+BigInt(delta)*10n;if(mapStart<0n)mapStart=0n;renderMap();if(!reduce())$('map-nodes').animate([{opacity:.2,transform:`translateX(${delta*22}px)`},{opacity:1,transform:'translateX(0)'}],{duration:240,easing:'ease-out'});audio.play('tap');}
 const fc=$('field').getContext('2d'),hc=$('hero').getContext('2d'),ec=$('effects').getContext('2d');let size=0,heroW=0,heroH=0,pad=10,gap=6,step=0,particles=[],lastFrame=0;
 function canvasSize(c,w,h){const d=Math.min(devicePixelRatio||1,2),W=Math.round(w*d),H=Math.round(h*d);if(c.width!==W||c.height!==H){c.width=W;c.height=H;}c.getContext('2d').setTransform(d,0,0,d,0,0);}
 function fit(){size=$('board').clientWidth;if(size>0){canvasSize($('field'),size,size);pad=Math.max(7,size*.021);gap=Math.max(4,size*.012);$('tiles').style.setProperty('--pad',pad+'px');$('tiles').style.setProperty('--gap',gap+'px');if(board)step=(size-2*pad+gap)/board.n;}heroW=$('hero').clientWidth;heroH=$('hero').clientHeight;if(heroW&&heroH)canvasSize($('hero'),heroW,heroH);canvasSize($('effects'),innerWidth,innerHeight);placePointer();if(state==='map')renderMap();}
 new ResizeObserver(fit).observe(document.querySelector('.app'));new ResizeObserver(fit).observe($('board'));window.addEventListener('resize',fit);
 function round(c,x,y,w,h,r,fill,stroke=null,line=1){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
 function gem(c,x,y,r,color){c.save();c.beginPath();c.arc(x,y,r*.7,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=Math.max(1.5,r*.18);c.stroke();c.beginPath();c.arc(x,y,r*.29,0,Math.PI*2);c.fillStyle=color;c.fill();c.restore();}
 function bolt(c,r){c.beginPath();c.moveTo(r*.15,-r);c.lineTo(-r*.67,r*.2);c.lineTo(-r*.05,r*.2);c.lineTo(-r*.13,r);c.lineTo(r*.73,-r*.25);c.lineTo(r*.1,-r*.25);c.closePath();c.fill();}
 function currentAngle(r,at){const p=reduce()?1:Math.min(1,Math.max(0,(at-r.at)/230)),ease=1-Math.pow(1-p,3);return r.from+(r.to-r.from)*ease;}
 const pipePalette={active:'#d47e5c',activeEdge:'#aa6046',activeLight:'#edb08b',idle:'#92aaa6',idleEdge:'#6e8d89',idleLight:'#c9d9d1'};
 function paintPipe(c,path,width,on){
  c.lineJoin='round';c.lineCap='butt';
  c.strokeStyle=on?pipePalette.activeEdge:pipePalette.idleEdge;c.lineWidth=width;path();c.stroke();
  c.strokeStyle=on?pipePalette.active:pipePalette.idle;c.lineWidth=width*.76;path();c.stroke();
  c.save();c.translate(-width*.07,-width*.10);c.strokeStyle=on?pipePalette.activeLight:pipePalette.idleLight;c.lineWidth=width*.23;path();c.stroke();c.restore();
 }
 function ports(mask){return [0,1,2,3].filter(d=>mask&(1<<d));}
 function portXY(d,len){return [Math.sin(d*Math.PI/2)*len,-Math.cos(d*Math.PI/2)*len];}
 function moduleDraw(c,x,y,w,mask,on,root,crystal,angle,at,index,flash=0,highlight=false){
  const fixed=board?.fixed?.includes(index)&&c===fc,radius=w*.14;
  const rotating=c===fc&&rotations[index]&&at-rotations[index].at<230;
  const phase=rotating?(at-rotations[index].at)/230:1;
  const press=rotating&&!reduce()?Math.sin(phase*Math.PI)*2.2:0;
  const reward=flash>0&&!reduce()?Math.sin((1-flash)*Math.PI)*.025:0;
  c.save();c.translate(x,y+press);c.scale(1+reward,1+reward);
  round(c,-w/2,-w/2+4,w,w-4,radius,'#b5ae9e');
  round(c,-w/2,-w/2,w,w-5,radius,fixed?'#d8d5c7':on?'#fff3e4':'#f7f6ed',highlight?'#9d7451':'#d4cdbe',highlight?2:1);
  c.save();c.beginPath();c.roundRect(-w/2+2,-w/2+2,w-4,w-9,radius);c.clip();c.rotate(angle);
  const ends=ports(mask),elbow=ends.length===2&&(ends[0]+2)%4!==ends[1];
  const route=()=>{c.beginPath();if(elbow){const a=portXY(ends[0],w*.52),b=portXY(ends[1],w*.52);c.moveTo(...a);c.lineTo(a[0]*.36,a[1]*.36);c.quadraticCurveTo(0,0,b[0]*.36,b[1]*.36);c.lineTo(...b);}else for(const d of ends){c.moveTo(0,0);c.lineTo(...portXY(d,w*.52));}};
  paintPipe(c,route,w*.17,on);
  // Small sleeves at the edges make adjoining modules read as connected fittings.
  for(const d of ends){c.save();c.rotate(d*Math.PI/2);round(c,-w*.108,-w*.49,w*.216,w*.075,w*.012,on?'#d18c6a':'#aabeb5',on?'#b17453':'#859e93',Math.max(.7,w*.006));c.restore();}
  c.restore();
  if(root||crystal){c.beginPath();c.arc(0,0,w*(root?.18:.135),0,7);c.fillStyle=on?'#d47e5c':'#e9eee4';c.fill();c.strokeStyle=on?'#ac674b':'#8eaaa2';c.lineWidth=1.5;c.stroke();
   if(root){c.fillStyle='#fff0cc';c.beginPath();c.arc(0,0,w*.065,0,7);c.fill();c.strokeStyle='#f8d9b1';c.lineWidth=1.5;c.beginPath();c.arc(0,0,w*.123,-Math.PI*.38,Math.PI*1.38);c.stroke();}
   else gem(c,0,0,w*.105,on?'#ffe0af':'#92b2a6');
  }

  if(fixed){for(const [sx,sy]of[[-1,-1],[1,1]]){const px=sx*(w/2-8),py=sy*(w/2-10);c.beginPath();c.arc(px,py,3,0,7);c.fillStyle='#9c937f';c.fill();c.strokeStyle='#e8e0cd';c.lineWidth=1;c.beginPath();c.moveTo(px-2,py);c.lineTo(px+2,py);c.stroke();}}
  if(flash>0&&!reduce()){c.globalAlpha=flash*.75;round(c,-w/2+2,-w/2+2,w-4,w-9,radius,null,'#d77555',2.5);c.globalAlpha=1;}
  c.restore();
 }
 function drawBoard(at){if(!board||!size)return;fc.clearRect(0,0,size,size);round(fc,1,3,size-2,size-4,size*.035,'#c5beb0');round(fc,1,1,size-2,size-5,size*.035,'#ded9cc','#c9c2b2',1);
  const w=step-gap;
  masks.forEach((m,i)=>{const x=pad+w/2+i%board.n*step,y=pad+w/2+Math.floor(i/board.n)*step,r=rotations[i],angle=currentAngle(r,at)-r.to,age=at-gains[i],flash=age>=0&&age<600?1-age/600:0;
   moduleDraw(fc,x,y,w,m,lit[i],i===board.root,board.crystals.includes(i),angle,at,i,flash,focused===i||hover===i||hinted===i);
  });
 }
 function drawFlow(at){
  if(!board||reduce()||state==='paused')return;const w=step-gap,len=w*.48;
  for(let i=0;i<masks.length;i++)if(lit[i]&&at-rotations[i].at>=230){
   const ends=ports(masks[i]),neighbors=d=>{const r=Math.floor(i/board.n)+[-1,0,1,0][d],col=i%board.n+[0,1,0,-1][d];return r<0||col<0||r>=board.n||col>=board.n?-1:r*board.n+col;};
   const incoming=ends.find(d=>{const j=neighbors(d);return j>=0&&lit[j]&&depth[j]===depth[i]-1&&(masks[j]&(1<<((d+2)%4)));});
   const outgoing=ends.filter(d=>{const j=neighbors(d);return j>=0&&lit[j]&&depth[j]===depth[i]+1&&(masks[j]&(1<<((d+2)%4)));});
   if(!outgoing.length&&incoming!==undefined)outgoing.push(-1);
   const phase=((at/650-depth[i])%4+4)%4;if(phase>1)continue;
   for(const d of outgoing){const a=incoming===undefined?[0,0]:portXY(incoming,len),b=d<0?[0,0]:portXY(d,len),curved=incoming!==undefined&&d>=0&&ends.length===2&&(incoming+2)%4!==d;
    const point=t=>{if(!curved){if(t<.5)return[a[0]*(1-t*2),a[1]*(1-t*2)];return[b[0]*(t*2-1),b[1]*(t*2-1)];}
     const ar=[a[0]*.39,a[1]*.39],br=[b[0]*.39,b[1]*.39];
     if(t<.3){const u=t/.3;return[a[0]+(ar[0]-a[0])*u,a[1]+(ar[1]-a[1])*u];}
     if(t>.7){const u=(t-.7)/.3;return[br[0]+(b[0]-br[0])*u,br[1]+(b[1]-br[1])*u];}
     const u=(t-.3)/.4;return[(1-u)*(1-u)*ar[0]+u*u*br[0],(1-u)*(1-u)*ar[1]+u*u*br[1]];
    };
    const p=point(phase),q=point(Math.min(1,phase+.015));fc.save();fc.translate(pad+w/2+i%board.n*step+p[0],pad+w/2+Math.floor(i/board.n)*step+p[1]);fc.rotate(Math.atan2(q[1]-p[1],q[0]-p[0]));fc.strokeStyle='#fffaf0';fc.lineWidth=Math.max(1.3,w*.018);fc.lineCap='round';const v=Math.max(2.1,w*.031);fc.beginPath();fc.moveTo(-v,-v*.55);fc.lineTo(0,0);fc.lineTo(-v,v*.55);fc.stroke();fc.restore();
   }
  }
 }
 function drawHero(at){
  if(!heroW||!heroH)return;hc.clearRect(0,0,heroW,heroH);const scale=Math.min(heroW/500,heroH/270);hc.save();hc.translate(heroW/2,heroH/2);hc.scale(scale,scale);
  const branches=[[[ -196,0],[-115,0],[-115,-82],[95,-82],[95,0],[193,0]],[[ -45,-82],[-45,92],[151,92]]];
  function trace(points){hc.beginPath();hc.moveTo(...points[0]);for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],r=24,ab=Math.hypot(b[0]-a[0],b[1]-a[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]);hc.lineTo(b[0]-(b[0]-a[0])/ab*r,b[1]-(b[1]-a[1])/ab*r);hc.quadraticCurveTo(...b,b[0]+(c[0]-b[0])/bc*r,b[1]+(c[1]-b[1])/bc*r);}hc.lineTo(...points[points.length-1]);}
  branches.forEach(points=>paintPipe(hc,()=>trace(points),19,true));
  for(const [x,y]of[[-153,0],[27,-82],[150,0],[90,92]])round(hc,x-4,y-13,8,26,2,'#d9926e','#b97c5a',1);
  for(const [x,y,source]of[[-196,0,true],[193,0,false],[151,92,false]]){hc.beginPath();hc.arc(x,y,source?24:18,0,7);hc.fillStyle='#d47e5c';hc.fill();hc.strokeStyle='#aa6046';hc.lineWidth=1.5;hc.stroke();if(source){hc.beginPath();hc.arc(x,y,14,0,7);hc.strokeStyle='#f8d9b1';hc.stroke();hc.beginPath();hc.arc(x,y,6,0,7);hc.fillStyle='#fff0cc';hc.fill();}else gem(hc,x,y,11,'#ffe0af');}
  hc.restore();
 }
 function burst(i,color,count){if(reduce()||!board)return;const box=$('board').getBoundingClientRect(),scale=box.width/size,w=step-gap,x=box.x+(pad+w/2+i%board.n*step)*scale,y=box.y+(pad+w/2+Math.floor(i/board.n)*step)*scale;for(let k=0;k<count;k++){const a=Math.random()*Math.PI*2,v=35+Math.random()*130;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,age:0,life:.35+Math.random()*.35,color,r:2+Math.random()*3,spin:Math.random()*6});}if(particles.length>250)particles.splice(0,particles.length-250);}
 function frame(at){const dt=Math.min(.035,(at-lastFrame)/1000||0);lastFrame=at;if(!document.hidden){if(state==='menu')drawHero(at);if(['playing','paused','celebrating'].includes(state)){drawBoard(at);drawFlow(at);}ec.clearRect(0,0,innerWidth,innerHeight);particles=particles.filter(p=>p.age<p.life);for(const p of particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=130*dt;ec.save();ec.translate(p.x,p.y);ec.rotate(p.spin+p.age*4);ec.globalAlpha=Math.max(0,1-p.age/p.life);ec.fillStyle=p.color;ec.fillRect(-p.r/2,-p.r/2,p.r,p.r);ec.restore();}if(feedbackUntil&&at>feedbackUntil){$('chain-feedback').classList.remove('visible');$('connection-reward')?.classList.remove('visible');feedbackUntil=0;}}requestAnimationFrame(frame);}
 $('play').onclick=()=>{audio.unlock();if(read('learned.v2')!==true)openModal('help');else launch();};$('levels').onclick=()=>goMap();$('learn').onclick=()=>openModal('help');$('help').onclick=()=>openModal('help');$('home').onclick=()=>{if(busy)return;if(state==='playing')openModal('pause');else if(state!=='menu'&&state!=='celebrating')change('menu');};$('map-home').onclick=()=>{if(!busy)change('menu');};$('game-back').onclick=()=>openModal('leave');$('pause').onclick=()=>openModal('pause');$('undo').onclick=undo;$('hint').onclick=hint;$('reset').onclick=()=>openModal('reset');$('map-play').onclick=()=>launch();$('map-prev').onclick=()=>shiftMap(-1);$('map-next').onclick=()=>shiftMap(1);$('map-current').onclick=()=>{mapStart=(BigInt(progress.next)-1n)/10n*10n;renderMap();};$('result-map').onclick=()=>goMap();$('retry').onclick=()=>launch(lastResult.tutorial?'0':lastResult.level,{fresh:true,learn:lastResult.tutorial});$('next').onclick=()=>{if(lastResult.tutorial&&tutorialResume&&tutorialReturn==='playing'){write('session.v2',tutorialResume);launch(tutorialResume.level);}else launch();};
 $('language').onclick=()=>{lang=lang==='tr'?'en':'tr';write('lang.v2',lang);labels();};$('sound').onclick=()=>{audio.muted=!audio.muted;write('mute.v2',audio.muted);if(audio.muted&&audio.ctx)audio.ctx.suspend().catch(()=>{});else audio.play('tap');labels();};
 $('dialog').addEventListener('cancel',e=>{e.preventDefault();closeModal();});
 $('tiles').addEventListener('keydown',e=>{const i=Number(e.target.dataset.index);if(!Number.isInteger(i)||!board)return;const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:board.n,ArrowUp:-board.n}[e.key];if(delta===undefined)return;e.preventDefault();let j=(i+masks.length+delta)%masks.length;for(let k=0;k<masks.length&&$('tiles').children[j].disabled;k++)j=(j+masks.length+delta)%masks.length;[...$('tiles').children].forEach((b,k)=>b.tabIndex=k===j?0:-1);$('tiles').children[j].focus({preventScroll:true});});
 let mapTouch=null,mapSwiped=false;$('map-window').addEventListener('pointerdown',e=>{mapSwiped=false;mapTouch={x:e.clientX,y:e.clientY};});$('map-window').addEventListener('pointerup',e=>{if(mapTouch&&Math.abs(e.clientX-mapTouch.x)>45&&Math.abs(e.clientX-mapTouch.x)>Math.abs(e.clientY-mapTouch.y)){mapSwiped=true;shiftMap(e.clientX<mapTouch.x?1:-1);}mapTouch=null;});$('map-window').addEventListener('click',e=>{if(mapSwiped){e.preventDefault();e.stopPropagation();mapSwiped=false;}},true);$('map-window').addEventListener('pointercancel',()=>mapTouch=null);$('map-window').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();shiftMap(e.key==='ArrowRight'?1:-1);}});
 window.addEventListener('keydown',e=>{if($('dialog').open)return;if(e.key==='Escape'&&state==='playing'){e.preventDefault();openModal('pause');}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing'){persistSession();if(!busy)openModal('pause');}});window.addEventListener('beforeunload',persistSession);
 setInterval(()=>{if(state==='playing')$('time').textContent=time(nowTime());},250);setInterval(persistSession,5000);labels();fit();document.body.dataset.state=state;requestAnimationFrame(frame);
})();
