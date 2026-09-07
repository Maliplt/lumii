"use strict";

/* Each row is a small subset-sum problem. Search only its valid masks, then
   bound the remaining column totals. Reject ambiguous or expensive boards. */
const Puzzle = (() => {
  function random(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function countSolutions(values, rows, cols, limit = 2) {
    const n = rows.length;
    const options = rows.map((target, r) => {
      const masks = [];
      for (let mask = 0; mask < 1 << n; mask++) {
        let sum = 0;
        for (let c = 0; c < n; c++) if (mask & 1 << c) sum += values[r * n + c];
        if (sum === target) masks.push(mask);
      }
      return {r, masks};
    }).sort((a, b) => a.masks.length - b.masks.length);
    const min = Array.from({length:n + 1}, () => Array(n).fill(0));
    const max = Array.from({length:n + 1}, () => Array(n).fill(0));
    for (let k = n - 1; k >= 0; k--) {
      const {r, masks} = options[k];
      if (!masks.length) return 0;
      for (let c = 0; c < n; c++) {
        min[k][c] = min[k + 1][c] + (masks.every(m => m & 1 << c) ? values[r * n + c] : 0);
        max[k][c] = max[k + 1][c] + (masks.some(m => m & 1 << c) ? values[r * n + c] : 0);
      }
    }
    let count = 0, visits = 0;
    const sums = Array(n).fill(0);
    function search(k) {
      if (++visits > 30000) { count = limit; return; }
      if (k === n) { count++; return; }
      const {r, masks} = options[k];
      for (const mask of masks) {
        let valid = true;
        for (let c = 0; c < n; c++) {
          const next = sums[c] + (mask & 1 << c ? values[r * n + c] : 0);
          if (next + min[k + 1][c] > cols[c] || next + max[k + 1][c] < cols[c]) { valid = false; break; }
        }
        if (!valid) continue;
        for (let c = 0; c < n; c++) if (mask & 1 << c) sums[c] += values[r * n + c];
        search(k + 1);
        for (let c = 0; c < n; c++) if (mask & 1 << c) sums[c] -= values[r * n + c];
        if (count >= limit) return;
      }
    }
    search(0);
    return count;
  }
  function generate(n, seed) {
    if (!Number.isInteger(n) || n < 3 || n > 6) throw new RangeError("Invalid board size");
    const rng = random(seed);
    for (let attempt = 0; attempt < 3000; attempt++) {
      const values = Array.from({length:n * n}, () => 1 + Math.floor(rng() * 9));
      const solution = values.map(() => rng() < .48);
      const rows = Array(n).fill(0), cols = Array(n).fill(0);
      const rowCounts = Array(n).fill(0), colCounts = Array(n).fill(0);
      solution.forEach((on, i) => { if (on) { const r = Math.floor(i / n), c = i % n; rows[r] += values[i]; cols[c] += values[i]; rowCounts[r]++; colCounts[c]++; } });
      if ([...rowCounts, ...colCounts].some(count => count === 0 || count === n)) continue;
      const board = {n, values, solution, rows, cols};
      // A unique solution alone is not enough: every cell must also be
      // deducible by intersecting horizontal and vertical subset candidates.
      const logical = deduce(board);
      if (logical && logical.every((on, i) => on === solution[i]) && countSolutions(values, rows, cols) === 1) return board;
    }
    throw new Error("Bulmaca oluşturulamadı. Lütfen yeniden dene.");
  }
  function deduce({n, values, rows, cols}) {
    const known = Array(n * n).fill(null);
    const lines = [...rows, ...cols].map((target, line) => {
      const indices = Array.from({length:n}, (_, j) => line < n ? line * n + j : j * n + line - n);
      const masks = [];
      for (let mask = 0; mask < 1 << n; mask++) {
        const sum = indices.reduce((total, i, j) => total + (mask & 1 << j ? values[i] : 0), 0);
        if (sum === target) masks.push(mask);
      }
      return {indices, masks};
    });
    let changed = true;
    while (changed) {
      changed = false;
      for (const line of lines) {
        line.masks = line.masks.filter(mask => line.indices.every((i, j) => known[i] === null || known[i] === Boolean(mask & 1 << j)));
        if (!line.masks.length) return null;
        line.indices.forEach((i, j) => {
          if (known[i] !== null) return;
          const first = Boolean(line.masks[0] & 1 << j);
          if (line.masks.every(mask => Boolean(mask & 1 << j) === first)) { known[i] = first; changed = true; }
        });
      }
    }
    return known.every(on => on !== null) ? known : null;
  }
  function fingerprint(board) { return `${board.values.join(",")}/${board.rows.join(",")}/${board.cols.join(",")}`; }
  function chapter(n, series, number, recent = []) {
    // Hash the entire chapter number, rather than truncating it to 32 bits.
    for (let salt = 0; salt < 128; salt++) {
      let seed = 2166136261;
      for (const char of `${series}:${n}:${number}:${salt}`) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
      const board = generate(n, seed >>> 0);
      if (!recent.includes(fingerprint(board))) return board;
    }
    throw new Error("Yeni bölüm hazırlanamadı. Lütfen yeniden dene.");
  }
  function difficulty(number) {
    const index=BigInt(number),boss=index%10n===0n;
    const tier=index<21n?0:index<61n?1:2;
    return {n:Math.min(6,4+tier+(boss?1:0)),boss,samples:boss?28:Math.min(14,1+Number(index>130n?130n:index)/10|0)};
  }
  function complexity(board) {
    const {n,values,rows,cols}=board;
    return [...rows,...cols].reduce((score,target,line)=>{
      let count=0;for(let mask=0;mask<1<<n;mask++){
        let sum=0;for(let j=0;j<n;j++)if(mask>>j&1)sum+=values[line<n?line*n+j:j*n+line-n];
        if(sum===target)count++;
      }return score+Math.log2(count||1);
    },0);
  }
  function progressive(series,number,recent=[]) {
    const spec=difficulty(number);let best=null;
    for(let i=0;i<spec.samples;i++){
      const candidate=chapter(spec.n,series,`${number}:rank:${i}`,recent);
      if(!best||complexity(candidate)>complexity(best))best=candidate;
    }
    return {...best,boss:spec.boss};
  }
  function constellation(series,number,legacy=false) {
    const step=BigInt(number),tier=legacy?0:Number(step>1000n?1000n:step)/5|0,multiplier=1+tier;
    const scale=b=>({...b,values:b.values.map(v=>v*multiplier),rows:b.rows.map(v=>v*multiplier),cols:b.cols.map(v=>v*multiplier)});
    const meta=scale(chapter(3,series,`${number}:final`)),boards=[],recent=[];
    for(let i=0;i<9;i++){
      let board=null;
      for(let candidate=0;candidate<Math.min(12,1+tier);candidate++){
        const next=chapter(6,series,`${number}:sector:${i}${candidate?':'+candidate:''}`,recent);
        if(!board||complexity(next)>complexity(board))board=next;
      }
      recent.push(fingerprint(board));boards.push(scale(board));
    }
    return {meta,boards};
  }
  return {generate, countSolutions, deduce, chapter, fingerprint,difficulty,complexity,progressive,constellation};
})();

if (typeof module !== "undefined" && module.exports) module.exports = Puzzle;

// Progress is independent of the interface so replay and unlock rules can be tested.
class Campaign {
  constructor(seed, next = "1", recent = [], records = {}) {
    this.seed = seed; this.next = next; this.recent = recent; this.records = records;
  }
  board(n, number) {
    if (!/^[1-9]\d*$/.test(number) || BigInt(number) > BigInt(this.next)) throw new RangeError("Locked chapter");
    const entry = this.records[number];
    if (entry?.board?.n === n && Array.isArray(entry.board.values) && entry.board.values.length === n * n && entry.board.values.every(v => Number.isInteger(v) && v >= 1 && v <= 9) &&
        Array.isArray(entry.board.rows) && entry.board.rows.length === n && Array.isArray(entry.board.cols) && entry.board.cols.length === n && [...entry.board.rows,...entry.board.cols].every(v => Number.isInteger(v) && v > 0 && v < n*9)) {
      const solution = Puzzle.deduce(entry.board);
      if (solution) return {...entry.board, solution};
    }
    const board = Puzzle.chapter(n, this.seed, number, number === this.next ? this.recent : []);
    this.records[number] = {board, stars:0, best:null};
    return board;
  }
  complete(number, board, stars, ms, hints) {
    const old = this.records[number] || {};
    this.records[number] = {board, stars:Math.max(old.stars || 0, stars), best:hints === 0 ? Math.min(old.best || Infinity, ms) : old.best || null};
    if (number === this.next) {
      this.next = (BigInt(number) + 1n).toString();
      this.recent = [...this.recent, Puzzle.fingerprint(board)].slice(-128);
    }
  }
}
if (typeof module !== "undefined" && module.exports) module.exports.Campaign = Campaign;

class HintWallet {
  constructor(data={},now=Date.now()) {
    this.charges=Number.isInteger(data.charges)?Math.max(0,Math.min(3,data.charges)):3;
    this.spent=Number.isSafeInteger(data.spent)&&data.spent>=0?data.spent:0;
    this.next=Number.isFinite(data.next)&&data.next>0?Math.min(data.next,now+3600000):0;
    this.refresh(now);
  }
  refresh(now=Date.now()) {
    if(this.charges===3){this.next=0;return;}
    if(!this.next)this.next=now+3600000;
    if(now>=this.next){const earned=1+Math.floor((now-this.next)/3600000);this.charges=Math.min(3,this.charges+earned);this.next=this.charges===3?0:this.next+earned*3600000;}
  }
  use(now=Date.now()){this.refresh(now);if(!this.charges)return false;this.charges--;if(!this.next)this.next=now+3600000;return true;}
  buy(earned,now=Date.now()){this.refresh(now);if(this.charges===3||earned-this.spent<5)return false;this.spent+=5;this.charges++;if(this.charges===3)this.next=0;return true;}
}
if(typeof module!=="undefined"&&module.exports)module.exports.HintWallet=HintWallet;

if (typeof document !== "undefined") (() => {
  const $ = id => document.getElementById(id);
  const storage = {
    get(key) { try { return localStorage.getItem("denge." + key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem("denge." + key, String(value)); } catch { /* Storage may be unavailable; the current session remains playable. */ } }
  };
  // Only these trusted, local strings are rendered as HTML. Dynamic values use textContent.
  const copy = {
    introEyebrow:["HER GÜN BİRAZ DAHA İYİ","A LITTLE BETTER EVERY DAY"],
    introTitle:["Seç. Topla.<br><em>Dengele!</em>","Pick. Add.<br><em>Balance!</em>"],
    introLead:["Sayılarla oyna. Bütün hedefleri tuttur.","Play with numbers. Match every target."],
    demo:["Örnek: 2 ve 5 seçildiğinde toplam 7 olur","Example: selecting 2 and 5 makes a total of 7"],
    demoDone:["✓ DENGEDE","✓ BALANCED"],calm:["Sakin","Calm"],focus:["Odak","Focus"],deep:["Derin","Deep"],
    difficulty:["Zorluk seviyesi","Difficulty"],mainMenu:["Ana menü","Main menu"],explore:["OYNA","PLAY"],
    introFoot:["Tek çözüm. İki yönde denge. Sonsuz bir yol.","One solution. Two directions. An endless journey."],
    chapterPreview:["{name} · Bölüm {number} · Sonsuz seri","{name} · Level {number} · Endless journey"],
    mapTitle:["Senin yolculuğun","Your journey"],mapLead:["Yol burada bitmiyor. Yeni durakları sağa doğru keşfet.","The path keeps going. Explore new stops to the right."],
    backToCurrent:["Bölümüme dön","Back to my level"],dragMap:["← Sürükle ve keşfet →","← Drag to explore →"],
    mapNote:["Tamamladığın bölümlere dönüp yıldızını yükseltebilirsin.","Revisit completed levels to improve your stars."],
    cleared:["{number} bölüm tamamlandı","{number} levels completed"],collected:["★ {number} yıldız","★ {number} stars"],
    previousPage:["Sola ilerle","Travel left"],nextPage:["Sağa ilerle","Travel right"],range:["{first}–{last} · SONSUZ YOLCULUK ∞","{first}–{last} · ENDLESS JOURNEY ∞"],
    playLevel:["Bölüm {number} · Oyna","Level {number} · Play"],level:["Bölüm {number}","Level {number}"],
    locked:["Kilitli","Locked"],completed:["Tamamlandı","Completed"],current:["Sıradaki bölüm","Next to play"],
    gameTitle:["Dengeyi bul.","Find the balance."],time:["SÜRE","TIME"],moves:["HAMLE","MOVES"],balance:["DENGE","BALANCE"],
    boardCaption:["Seçilen sayılar toplanır.","Selected numbers add up."],target:["Hedef","Target"],board:["Sayı bulmacası","Number puzzle"],
    undo:["Geri al","Undo"],reset:["Sıfırla","Reset"],hint:["İpucu","Hint"],hints:["İPUCU","HINTS"],
    keyboard:["Yön tuşlarıyla gezin · Boşluk ile seç · Ctrl / ⌘ + Z ile geri al","Arrow keys to move · Space to select · Ctrl / ⌘ + Z to undo"],
    resultTitle:["Tam dengede.","Perfect balance."],nextLevel:["Sonraki bölüm","Next level"],retry:["Tekrar dene","Try again"],levelMap:["Bölüm haritası","Level map"],
    footer:["MANTIKLA BUL. DENGEYLE BİTİR.","THINK IT THROUGH. FIND YOUR BALANCE."],guide:["DENGE REHBERİ","DENGE GUIDE"],
    help:["Nasıl oynanır?","How to play"],night:["Gece temasına geç","Switch to night theme"],day:["Gündüz temasına geç","Switch to day theme"],
    mute:["Sesi kapat","Mute sound"],unmute:["Sesi aç","Unmute sound"],pause:["Oyunu duraklat","Pause game"],
    initial:["Bir sayı seçerek başla.","Select a number to begin."],over:["Bir hedef aşıldı. Seçtiğin sayıları iki yönde kontrol et.","A target is exceeded. Check your selections in both directions."],
    hinted:["İşaretli sayı çözümüne göre düzeltildi. Buradan devam et.","The outlined number has been corrected. Continue from here."],
    matched:["Toplam tuttu. Yeşil hedef seçimleri kesinleştirmez; iki yönü birlikte düşün.","The sum matches. A green target does not confirm the cells; consider both directions."],
    selected:["Her sayı hem satırına hem sütununa eklenir.","Each number adds to both its row and its column."],
    undone:["Son seçim geri alındı. Geri alma da bir hamle sayılır.","Last selection undone. Undo also counts as a move."],
    resetDone:["Temiz bir başlangıç. Dengeyi yeniden bul.","A fresh start. Find the balance again."],
    cell:["{r}. satır, {c}. sütun: {value}","Row {r}, column {c}: {value}"],row:["Satır {number}","Row {number}"],column:["Sütun {number}","Column {number}"],
    targetLabel:["{line}: toplam {sum}, hedef {goal}","{line}: sum {sum}, target {goal}"],
    checking:["Denge bulundu. Şimdi bütün hesaplara birlikte bakalım.","Balance found. Let’s check every sum together."],
    allVerified:["Tüm satırlar ve sütunlar doğrulandı. İşte denge!","Every row and column verified. That’s balance!"],verified:["{count} / {total} hedef doğrulandı","{count} / {total} targets verified"],
    clearedTitle:["BÖLÜM {number} TAMAMLANDI","LEVEL {number} COMPLETE"],nextCopy:["Sırada bölüm {number}. Yeni sayılar, yeni denge.","Level {number} is next. New numbers, a new balance."],
    stars:["{number} / 3 yıldız","{number} out of 3 stars"],rating1:["Dengeyi buldun. Her deneme yeni bir keşif.","You found it. Every attempt is a new discovery."],
    rating2:["İyi muhakeme. Bir sonraki denemede üç yıldız?","Well reasoned. Three stars on your next attempt?"],rating3:["Az hamle, net düşünce. Kusursuz denge.","Few moves, clear thinking. Beautifully balanced."],
    best:["Bu bölümde en iyi ipucusuz süren · {time}","Your best unassisted time on this level · {time}"],noBest:["İpucusuz tamamla, ilk süre rekorunu kaydet.","Finish without hints to set your first time record."],
    helpTitle:["Az kural, bol keşif.","Simple rules. Room to discover."],
    rule1:["<strong>Sayıları seç.</strong> Dokunarak aç, tekrar dokunarak kaldır. Seçili sayılar toplama katılır.","<strong>Select numbers.</strong> Tap to include a number; tap again to remove it. Only selected numbers add up."],
    rule2:["<strong>İki yönü de düşün.</strong> Sağdaki sayılar satır, alttakiler sütun hedefidir. Küçük kesir, mevcut toplam / hedeftir.","<strong>Think in both directions.</strong> Targets on the right belong to rows; targets below belong to columns. The small fraction shows current sum / target."],
    rule3:["<strong>Hepsini dengele.</strong> Yeşil hedef yalnızca toplamın tuttuğunu söyler. Bütün hedefleri aynı anda tuttur. Her bölüm tek çözümlüdür.","<strong>Balance everything.</strong> Green only means that one sum matches. Match every target at the same time. Each level has one solution."],
    ratingsHelp:["3 yıldız: İpucusuz, gerekli seçim sayısı + en fazla 6 hamle. 2 yıldız: En fazla 2 ipucu ve gerekli seçim sayısının en fazla 3 katı hamle. Diğer çözümler 1 yıldız. Süre yıldızı etkilemez. Haritadan eski bölümlere dönebilirsin.","3 stars: no hints and at most 6 moves above the required selections. 2 stars: at most 2 hints and at most 3 times the required selections. Other solutions earn 1 star. Time does not affect stars. Replay past levels from the map."],
    understood:["Anladım","Got it"],pauseTitle:["Bir nefes molası.","Take a breath."],pauseBody:["Süren durdu. Hazır olduğunda kaldığın yerden devam et.","The timer is paused. Continue whenever you’re ready."],resume:["Devam et","Resume"],
    resetTitle:["Aynı bulmaca, temiz sayfa.","Same puzzle. Fresh start."],resetBody:["Seçimler, süre ve hamleler sıfırlanır. Kullanılan ipuçları yıldız hesabında kalır.","Selections, time and moves will reset. Hints already used still count toward your rating."],
    cancel:["Vazgeç","Cancel"],hintTitle:["Küçük bir yönlendirme?","A little nudge?"],hintBody:["Bir sayı doğru durumuna getirilecek. İpucu kullanmak yıldız puanını etkiler.","One number will be set correctly. Using a hint affects your star rating."],useHint:["İpucu kullan","Use a hint"],
    leaveTitle:["Haritaya dönelim mi?","Back to the map?"],leaveBody:["Bu denemenin seçimleri sıfırlanır. Bölümün ve kazandığın yıldızlar korunur.","This attempt’s selections will reset. Your unlocked levels and stars are kept."],
    errorTitle:["Bir kez daha deneyelim.","Let’s try once more."],errorBody:["Bu bölüm hazırlanamadı. Haritaya dönüp yeniden deneyebilirsin.","This level could not be prepared. Return to the map and try again."],okay:["Tamam","Okay"]
  };
  let tutorialStep=0,tutorialSelection=[false,false,false,false],tutorialPending=null,tutorialSeen=storage.get("tutorial.v1")==="done";
  Object.assign(copy,{
    tutorial:["Öğreticiye geç","Try the tutorial"],tutorialTitle:["Birlikte deneyelim!","Let’s try it together!"],ratingDetails:["Yıldızlar nasıl kazanılır?","How do I earn stars?"],
    tutorial0:["Önce 2’ye dokun. Hem satırına hem sütununa eklenir.","Tap 2 first. It adds to both its row and its column."],
    tutorial1:["İki hedef tuttu! Şimdi 4’e dokunup ne olduğuna bak.","Two targets match! Now tap 4 and see what happens."],
    tutorial2:["2 + 4 = 6. Hedefimiz 2! Kaldırmak için 4’e tekrar dokun.","2 + 4 = 6. Our target is 2! Tap 4 again to remove it."],
    tutorial3:["Son adım: 5’i seç. Bütün hedefleri aynı anda dengele.","Last step: select 5. Match every target at the same time."],
    tutorial4:["Başardın! Bütün satırlar ve sütunlar dengede. Oynamaya hazırsın.","You did it! Every row and column is balanced. You’re ready to play."],
    tutorialFinish:["Hazırım, oynayalım!","I’m ready. Let’s play!"],tutorialClose:["Öğreticiyi kapat","Close tutorial"],
    tutorialWrong:["Parlayan sayıya dokunarak devam et.","Tap the highlighted number to continue."],tutorialProgress:["{number} / 4 adım","Step {number} / 4"]
  });
  Object.assign(copy,{chaosMode:['Sonsuz Kaos','Endless Chaos'],playMode:['Oyna','Play'],zoomIn:['Yakınlaştır','Zoom in'],zoomOut:['Uzaklaştır','Zoom out'],zoomFit:['Tümünü göster','Fit all'],finalPuzzle:['Son denge','Final balance'],sector:['Bulmaca {number}','Puzzle {number}'],reward:['Kazanılan sayı: {number}','Number earned: {number}'],boss:['ZOR BÖLÜM','CHALLENGE'],completed:['Tamamlandı','Completed']});
  let language = storage.get("language") === "en" ? "en" : "tr";
  let theme = storage.get("theme") === "night" ? "night" : "day";
  const t = (key, values = {}) => copy[key][language === "en" ? 1 : 0].replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ""));
  const levelName = () => t(level===1?'chaosMode':'playMode');
  function loadCampaign(i) {
    try {
      const saved = JSON.parse(storage.get(`journey.v3.${i}`)||(i===0?storage.get('journey.v2.0'):null));
      if (saved && Number.isInteger(saved.seed) && typeof saved.next === "string" && /^[1-9]\d{0,99}$/.test(saved.next) && Array.isArray(saved.recent)) {
        const records = Object.fromEntries(Object.entries(saved.records || {}).filter(([key,value]) => /^[1-9]\d{0,99}$/.test(key) && value && typeof value === "object").map(([key,value]) => [key,{board:value.board, stars:Number.isInteger(value.stars) && value.stars >= 0 && value.stars <= 3 ? value.stars : 0, best:Number.isFinite(value.best) && value.best > 0 ? value.best : null}]));
        return new Campaign(saved.seed, saved.next, saved.recent.filter(x => typeof x === "string").slice(-128), records);
      }
    } catch { /* Corrupt saves do not prevent opening the game. */ }
    const seed = window.crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Date.now() >>> 0;
    return new Campaign(seed);
  }
  const campaigns = [0,1].map(loadCampaign);
  let walletData={};try{walletData=JSON.parse(storage.get('hints.v1'))||{};}catch{}
  const hintWallet=new HintWallet(walletData);
  const earnedStars=()=>campaigns.reduce((sum,c)=>sum+Object.values(c.records).reduce((n,r)=>n+(r.stars||0),0),0);
  function syncHints(){
    hintWallet.refresh();const saved=JSON.stringify(hintWallet);if(storage.get('hints.v1')!==saved)storage.set('hints.v1',saved);
    let badge=$('hint').querySelector('.hint-count');
    if(!badge){badge=document.createElement('small');badge.className='hint-count';$('hint').append(badge);}
    badge.textContent=`${hintWallet.charges}/3`;
    const clock=$('hint-clock');if(clock)clock.textContent=hintWallet.next?`${language==='en'?'Next':'Yenilenme'} ${format(Math.max(0,hintWallet.next-Date.now()))}`:(language==='en'?'Full':'Dolu');
  }
  function renderHintDialog(){
    syncHints();const en=language==='en',body=$('dialog-body');body.replaceChildren();
    const summary=document.createElement('strong');summary.className='hint-wallet';summary.textContent=`${hintWallet.charges} / 3     ·     ★ ${Math.max(0,earnedStars()-hintWallet.spent)}`;
    const clock=document.createElement('p');clock.id='hint-clock';
    const rule=document.createElement('p');rule.textContent=en?'1 hint per hour. Tap where the finger points.':'Saatte 1 ipucu. Parmağın gösterdiği sayıya dokun.';
    body.append(summary,clock,rule);syncHints();
    dialogButton('useHint',()=>{
      if(cells.some(c=>c.classList.contains('hinted'))){closeDialog();return;}
      const wrong=selected.findIndex((on,i)=>on&&!puzzle.solution[i]);const i=wrong>=0?wrong:selected.findIndex((on,i)=>on!==puzzle.solution[i]);
      if(i<0||!hintWallet.use())return;
      hints++;syncHints();closeDialog();cells[i].classList.add('hinted');cells[i].focus({preventScroll:true});stashChaos();audio.play('click');
    });
    $('dialog-actions').lastElementChild.disabled=!hintWallet.charges&&!cells.some(c=>c.classList.contains('hinted'));
    const buy=document.createElement('button');buy.className='secondary hint-buy';buy.textContent=en?'5 ★ → 1 hint':'5 ★ → 1 ipucu';buy.disabled=hintWallet.charges===3||earnedStars()-hintWallet.spent<5;
    buy.onclick=()=>{if(hintWallet.buy(earnedStars())){syncHints();renderDialog();audio.play('good');}};$('dialog-actions').append(buy);
    dialogButton('cancel',()=>closeDialog(),true);
  }
  const save = () => storage.set(`journey.v3.${level}`, JSON.stringify(campaigns[level]));
  const audio = {
    context:null, master:null, enabled:storage.get("sound") !== "off",
    tone(frequency, start, duration, type = "sine", end = frequency, volume = .06) {
      if (!this.enabled) return;
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        if (!this.context) { this.context = new Audio(); this.master = this.context.createGain(); this.master.connect(this.context.destination); }
        if (this.context.state === "suspended") this.context.resume().catch(() => {});
        const at = this.context.currentTime + start, osc = this.context.createOscillator(), gain = this.context.createGain();
        osc.type = type; osc.frequency.setValueAtTime(frequency, at); osc.frequency.exponentialRampToValueAtTime(end, at + duration);
        gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(volume, at + Math.min(.004, duration / 4)); gain.gain.exponentialRampToValueAtTime(.001, at + duration);
        osc.connect(gain); gain.connect(this.master); osc.start(at); osc.stop(at + duration + .01);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      } catch { /* Audio is optional. */ }
    },
    play(kind) {
      if (kind === "click") this.tone(430, 0, .018, "sine", 210, .12);
      if (kind === "good") { this.tone(660, 0, .13); this.tone(880, .075, .2); }
      if (kind === "error") this.tone(125, 0, .12, "triangle", 75, .09);
      if (kind === "win") [523.25,659.25,783.99,1046.5].forEach((f,i) => this.tone(f, i*.09, .38));
    }
  };
  const transitions = {menu:["map","atlas"],map:["menu","playing"],atlas:["menu","playing"],playing:["paused","celebrating"],paused:["playing","map","menu","atlas"],celebrating:["won","atlas"],won:["playing","map","menu","atlas"]};
  let state = "menu", level = 0, chapterNumber = "1", mapPage = 0n;
  let mapLanes=window.innerWidth<760?2:1,mapFraction=0,mapVelocity=0,mapFrame=0,mapDrag=null,suppressMapClick=false;
  let puzzle, selected = [], history = [], moves = 0, hints = 0, cells = [], targets = [], previousDone = new Set();
  let elapsed = 0, startedAt = 0, statusKey = "initial", resultData = null, dialogKind = "", returnFocus = null;
  let celebration = null, frameId = 0;
  let chaos=null,chaosIndex=-1,atlasZoom=1,atlasX=0,atlasY=0;
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function format(ms) { const seconds = Math.floor(ms/1000); return `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`; }
  function time() { return elapsed + (state === "playing"&&!$('game').classList.contains('review-board') ? performance.now()-startedAt : 0); }
  function transition(next) {
    if (!transitions[state].includes(next)) throw new Error(`Invalid state transition: ${state} → ${next}`);
    const screenFor=s=>$(s==="menu"?"welcome":s==="map"?"map":s==="atlas"?"atlas":s==="won"?"result":"game");
    const outgoing=screenFor(state),incoming=screenFor(next);
    if(outgoing!==incoming&&!reduceMotion()){
      document.querySelectorAll('.screen-ghost').forEach(el=>el.remove());
      const rect=outgoing.getBoundingClientRect(),ghost=outgoing.cloneNode(true),scale=rect.width/outgoing.offsetWidth;
      ghost.removeAttribute('id');ghost.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
      ghost.classList.add('screen-ghost');ghost.inert=true;ghost.setAttribute('aria-hidden','true');
      Object.assign(ghost.style,{position:'fixed',left:`${rect.left}px`,top:`${rect.top}px`,width:`${outgoing.offsetWidth}px`,height:`${outgoing.offsetHeight}px`,margin:'0',transformOrigin:'top left',zIndex:'8',pointerEvents:'none'});
      document.body.append(ghost);
      ghost.animate([{opacity:1,transform:`scale(${scale})`},{opacity:0,transform:`translateY(-8px) scale(${scale})`}],{duration:180,easing:'ease-out',fill:'forwards'}).onfinish=()=>ghost.remove();
      incoming.animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:340,delay:100,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'});
    }
    if (state === "playing") elapsed += performance.now()-startedAt;
    state = next; if (next === "playing") startedAt = performance.now();
    $("welcome").hidden = next !== "menu"; $("map").hidden = next !== "map";
    $('atlas').hidden=next!=='atlas';
    $("game").hidden = !["playing","paused","celebrating"].includes(next); $("result").hidden = next !== "won";
    document.body.dataset.state = next;
    document.body.classList.toggle('chaos-focus',level===1&&['playing','paused','celebrating'].includes(next));
    fitStage();
  }
  function fitStage(){
    const compact=innerWidth<760,isMap=state==="map"||state==="atlas";
    const focus=level===1&&['playing','paused','celebrating'].includes(state);
    const width=state==='atlas'?innerWidth:isMap?(compact?420:1200):focus?(compact?420:760):(compact?420:720),height=state==='atlas'?innerHeight:isMap?(compact?820:780):focus?(compact?930:1080):(compact?880:1000);
    const app=document.querySelector(".app");
    app.style.setProperty("--stage-w",`${width}px`);app.style.setProperty("--stage-h",`${height}px`);
    app.style.setProperty("--stage-scale",String(Math.min(innerWidth/width,innerHeight/height)));
    const dialog=$("dialog");if(dialog.open)dialog.style.setProperty("--dialog-scale",String(Math.min(1,(innerWidth-20)/dialog.offsetWidth,(innerHeight-20)/dialog.offsetHeight)));
  }
  function status(key) { statusKey = key; $("status").textContent = t(key); }
  function animate(el, name) {
    if(reduceMotion())return;
    const frames=name==="error"?[{transform:'translateX(0)'},{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'translateX(0)'}]:[{transform:'scale(1)'},{transform:name==="line-ripple"?'translateY(-4px) scale(1.04)':name==="pop"?'scale(.94)':'scale(1.09)'},{transform:name==="pop"?'scale(1.045)':'scale(1.02)'},{transform:'scale(1)'}];
    el.getAnimations().filter(a=>a.id==='feedback').forEach(a=>a.cancel());
    const animation=el.animate(frames,{duration:name==='error'?220:360,easing:'cubic-bezier(.2,.7,.3,1)',delay:name==='line-ripple'?parseFloat(el.style.getPropertyValue('--ripple-delay'))||0:0});
    animation.id='feedback';
  }
  function tapEffects(el,on){
    if(reduceMotion())return;
    const rect=el.getBoundingClientRect(),fragment=document.createDocumentFragment(),dialog=el.closest('dialog');
    const layer=dialog||$('particles'),origin=dialog?dialog.getBoundingClientRect():{left:0,top:0,width:1},scale=dialog?origin.width/dialog.offsetWidth:1;
    for(let j=0;j<5;j++){
      const dot=document.createElement('i'),angle=(j/5)*Math.PI*2;
      dot.className='tap-mote';dot.style.left=`${(rect.left+rect.width/2-origin.left)/scale}px`;dot.style.top=`${(rect.top+rect.height/2-origin.top)/scale}px`;
      dot.style.background=on?'var(--green)':'var(--orange)';fragment.append(dot);
      const distance=rect.width/scale*(on?.64:.44);
      dot.animate([{transform:'translate(-50%,-50%) scale(.5)',opacity:0},{opacity:.85,offset:.15},{transform:`translate(${Math.cos(angle)*distance}px,${Math.sin(angle)*distance}px) scale(0)`,opacity:0}],{duration:420,easing:'ease-out',fill:'forwards'}).onfinish=()=>dot.remove();
    }
    layer.append(fragment);
  }
  function refreshLabels() {
    document.documentElement.lang = language;
    document.title = language === "en" ? "Denge — Every number has its place." : "Denge — Her sayının bir yeri var.";
    document.querySelector('meta[name="description"]').content = language === "en" ? "Endless number puzzles. Balance every row and column and follow your own path." : "Sonsuz sayı bulmacaları. Satırları ve sütunları dengele, kendi yolunda ilerle.";
    document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n));
    document.querySelectorAll("[data-html]").forEach(el => el.innerHTML = t(el.dataset.html));
    document.querySelectorAll("[data-label]").forEach(el => el.setAttribute("aria-label", t(el.dataset.label)));
    $('start').querySelector('b').textContent=t('playMode');
    $("language").textContent = language === "tr" ? "EN" : "TR";
    $("language").setAttribute("aria-label", language === "tr" ? "Switch to English" : "Türkçeye geç");
    $("chapter-preview").textContent = t("level", {number:campaigns[0].next});
    updateTheme(); updateSound();
    if (state === "map") renderMap();
    if(state==='atlas')renderAtlas();
    if (puzzle) { updateGameLabel();render(); }
    if (state === "celebrating") showProof(celebration.line); else status(statusKey);
    if (state === "won") renderResult();
    if (dialogKind) renderDialog();
  }
  function updateTheme() {
    document.documentElement.dataset.theme = theme;
    $("theme").textContent = theme === "night" ? "☀" : "☾";
    $("theme").setAttribute("aria-label", t(theme === "night" ? "day" : "night"));
    $("theme").setAttribute("aria-pressed", theme === "night");
    document.querySelector('meta[name="theme-color"]').content = theme === "night" ? "#141414" : "#faf5e9";
  }
  function updateSound() {
    if (audio.master) audio.master.gain.setValueAtTime(audio.enabled ? 1 : 0, audio.context.currentTime);
    $("sound").classList.toggle("muted", !audio.enabled); $("sound").setAttribute("aria-pressed",audio.enabled); $("sound").setAttribute("aria-label",t(audio.enabled ? "mute" : "unmute"));
  }
  function showMap(center = true) {
    if(level===1){showAtlas();return;}
    if (state !== "map") transition("map");
    cancelAnimationFrame(mapFrame); mapVelocity=0;
    if(center){mapPage=(BigInt(campaigns[level].next)-1n)/BigInt(mapLanes);mapPage=mapPage>2n?mapPage-2n:0n;mapFraction=0;}
    renderMap();$("map-title").tabIndex=-1;$("map-title").focus({preventScroll:true});
  }
  function panMap(columns){
    mapFraction+=columns;
    const whole=Math.floor(mapFraction);
    if(whole){mapPage+=BigInt(whole);mapFraction-=whole;}
    if(mapPage<0n){mapPage=0n;mapFraction=0;mapVelocity=0;}
    renderMap();
  }
  function renderMap(){
    const journey=campaigns[level],next=BigInt(journey.next),first=mapPage*BigInt(mapLanes)+1n,columns=10/mapLanes;
    $("map-eyebrow").textContent=levelName();
    $("map-progress").textContent=t("cleared",{number:String(next-1n)});
    $("map-stars").textContent=t("collected",{number:Math.max(0,earnedStars()-hintWallet.spent)});
    $("map-range").textContent=t("dragMap");
    $("map-prev").disabled=mapPage===0n&&mapFraction===0;
    $("map-current").hidden=next>=first&&next<first+10n;
    $("map-play-label").textContent=t("playLevel",{number:journey.next});
    const existing=new Map([...$("map-nodes").children].map(el=>[el.dataset.chapter,el]));
    const active=new Set(),points=[];
    for(let col=-1;col<=columns+1;col++){
      const absolute=mapPage+BigInt(col);if(absolute<0n)continue;
      for(let lane=0;lane<mapLanes;lane++){
        const number=absolute*BigInt(mapLanes)+BigInt(lane)+1n,key=String(number);
        const x=(col+.5-mapFraction)/columns*100;
        // Seeded terrain: stable during dragging, with irregular but safe spacing.
        let terrain=2166136261;
        for(const char of `${journey.seed}:${absolute}`)terrain=Math.imul(terrain^char.charCodeAt(0),16777619);
        terrain=Math.imul(terrain^(terrain>>>16),0x7feb352d);
        terrain=Math.imul(terrain^(terrain>>>15),0x846ca68b);
        terrain^=terrain>>>16;
        const noise=(terrain>>>0)/4294967296;
        const y=mapLanes===2?(lane===0?23+noise*19:62+(1-noise)*17):29+noise*42;
        points.push({x,y,number});active.add(key);
        let button=existing.get(key);
        const locked=number>next,completed=number<next,entry=journey.records[key];
        if(!button){button=document.createElement("button");button.dataset.chapter=key;button.innerHTML='<strong></strong><small aria-hidden="true"></small>';button.onclick=()=>{if(!suppressMapClick)startGame(key);};$("map-nodes").append(button);}
        button.className=`level-node${locked?" locked":completed?" complete":" current"}${number%10n===0n?' challenge-node':''}`;button.disabled=locked;
        button.style.left=`${x}%`;button.style.top=`${y}%`;
        button.tabIndex=x>=0&&x<=100&&!locked?0:-1;
        button.setAttribute("aria-label",`${t("level",{number:key})} · ${t(locked?"locked":completed?"completed":"current")}`);
        if(number===next)button.setAttribute("aria-current","step");else button.removeAttribute("aria-current");
        button.firstChild.textContent=key;
        button.lastChild.textContent=locked?(number%10n===0n?'!':'·'):entry?.stars?"★".repeat(entry.stars):completed?"✓":number%10n===0n?'!':'▶';
      }
    }
    for(const [key,el] of existing)if(!active.has(key))el.remove();
    const path=points.map((point,i)=>{if(!i)return `M${point.x*12} ${point.y*5}`;const previous=points[i-1],mid=(previous.x+point.x)*6;return `C${mid} ${previous.y*5},${mid} ${point.y*5},${point.x*12} ${point.y*5}`;}).join(" ");
    $("map-road").innerHTML=`<path class="road" d="${path}"/><path class="road-dashes" d="${path}"/>`;
  }
  function coastMap(){
    cancelAnimationFrame(mapFrame);let last=0;
    const tick=now=>{if(state!=="map"||mapDrag)return;const dt=last?Math.min(32,now-last):16;last=now;
      panMap(mapVelocity*dt);mapVelocity*=Math.pow(.92,dt/16);
      if(Math.abs(mapVelocity)>.00015)mapFrame=requestAnimationFrame(tick);
    };mapFrame=requestAnimationFrame(tick);
  }
  function moveMap(direction){if(reduceMotion()){panMap(direction);return;}mapVelocity=direction*.012;coastMap();}
  function buildBoard() {
    const {n,values} = puzzle; cells=[]; targets=[]; previousDone.clear(); $("board").replaceChildren(); $("board").style.setProperty("--n",n);
    for(let r=0;r<n;r++) {
      for(let c=0;c<n;c++) {
        const i=r*n+c, button=document.createElement("button"); button.className="cell"; button.textContent=values[i]; button.dataset.index=i; button.tabIndex=i===0?0:-1;
        button.onclick=()=>toggle(i); cells.push(button); $("board").append(button);
      }
      const target=document.createElement("div"); target.className="target"; targets.push(target); $("board").append(target);
    }
    for(let c=0;c<n;c++){const target=document.createElement("div");target.className="target bottom";targets.push(target);$("board").append(target);}
    const corner=document.createElement("span");corner.className="corner";corner.textContent="↗";corner.setAttribute("aria-hidden","true");$("board").append(corner);
    $("line-total").textContent=` / ${n*2}`;
    $("level-label").textContent=`${levelName()} · ${n} × ${n} · ${t("level",{number:chapterNumber})}`;
  }
  function render() {
    const {n,values,rows,cols}=puzzle,sums=Array(n*2).fill(0),goals=[...rows,...cols];
    selected.forEach((on,i)=>{
      if(on){sums[Math.floor(i/n)]+=values[i];sums[n+i%n]+=values[i];}
      cells[i].classList.toggle("selected",on);cells[i].setAttribute("aria-pressed",on);
      cells[i].setAttribute("aria-label",t("cell",{r:Math.floor(i/n)+1,c:i%n+1,value:values[i]}));
    });
    const done=new Set();
    targets.forEach((el,i)=>{
      const matches=sums[i]===goals[i];if(matches)done.add(i);
      el.classList.toggle("done",matches);el.classList.toggle("over",sums[i]>goals[i]);
      if(!el.firstChild)el.innerHTML='<span></span><small></small>';
      el.firstChild.textContent=goals[i];el.lastChild.textContent=`${sums[i]} / ${goals[i]}`;
      el.setAttribute("aria-label",t("targetLabel",{line:t(i<n?"row":"column",{number:i%n+1}),sum:sums[i],goal:goals[i]}));
      if(matches&&!previousDone.has(i))animate(el,"flash");
    });
    const newLines=[...done].filter(i=>!previousDone.has(i));const gained=newLines.length>0;previousDone=done;
    $("moves").textContent=moves;$("balanced").textContent=done.size;$("progress").style.width=`${done.size/(n*2)*100}%`;
    $("undo").disabled=!history.length||state!=="playing"||$('game').classList.contains('review-board');
    return {won:done.size===n*2,gained,newLines,over:sums.some((v,i)=>v>goals[i])};
  }
  function startGame(number = campaigns[level].next) {
    if(!["map","won"].includes(state))return;
    if(number==="1"&&!tutorialSeen){tutorialPending=number;beginTutorial();return;}
    let board;
    try{
      const campaign=campaigns[0];
      if(BigInt(number)>BigInt(campaign.next))return;
      const cached=campaign.records[number]?.board;
      const solution=cached?.n===Puzzle.difficulty(number).n?Puzzle.deduce(cached):null;
      board=solution?{...cached,solution}:Puzzle.progressive(campaign.seed,number,number===campaign.next?campaign.recent:[]);
      campaign.records[number]={...(campaign.records[number]||{}),board};
    }catch{openDialog("error");return;}
    launchBoard(board,number);
  }
  function launchBoard(board,number){
    cancelAnimationFrame(frameId);celebration=null;resultData=null;
    chapterNumber=number;puzzle=board;selected=board.values.map(()=>false);history=[];moves=0;hints=0;elapsed=0;
    $("game").classList.remove("closing","celebrating","all-verified","review-board","chaos-awarded");
    ["reset","hint","pause","help","brand","language"].forEach(id=>$(id).disabled=false);
    transition("playing");buildBoard();render();status("initial");$("timer").textContent="00:00";save();audio.play("click");cells[0].focus({preventScroll:true});
    updateGameLabel();
  }
  function toggle(i){
    if(state!=="playing"||$('game').classList.contains('review-board')||i<0||i>=cells.length)return;
    history.push({i,before:selected[i]});selected[i]=!selected[i];moves++;
    cells.forEach((el,j)=>{if(j===i)el.classList.remove("hinted");el.tabIndex=j===i?0:-1;});
    const outcome=render();stashChaos();tapEffects(cells[i],selected[i]);animate(cells[i],"pop");
    if(outcome.gained)celebrateLines(outcome.newLines,i);
    if(outcome.won){win();return;}
    if(outcome.over){audio.play("error");animate(cells[i],"error");status("over");}
    else if(outcome.gained){audio.play("good");status("matched");}
    else{audio.play("click");status("selected");}
  }
  function undo(){if($("game").classList.contains("review-board")||state!=="playing"||!history.length)return;const action=history.pop();selected[action.i]=action.before;moves++;cells.forEach(el=>el.classList.remove("hinted"));render();stashChaos();audio.play("click");status("undone");}

  function celebrateLines(lines,index){
    if(reduceMotion())return;
    const n=puzzle.n,board=$("board"),bounds=board.getBoundingClientRect(),scale=bounds.width/board.offsetWidth;
    const cross=lines.some(line=>line<n)&&lines.some(line=>line>=n);
    for(const line of lines){
      const indices=Array.from({length:n},(_,j)=>line<n?line*n+j:j*n+line-n);
      indices.forEach((i,j)=>{cells[i].style.setProperty("--ripple-delay",`${j*45}ms`);animate(cells[i],"line-ripple");});
      animate(targets[line],"target-burst");
      const first=cells[indices[0]].getBoundingClientRect(),last=cells[indices[n-1]].getBoundingClientRect();
      const beam=document.createElement("i");beam.className=`line-beam ${line<n?"horizontal":"vertical"}${cross?" crossed":""}`;
      beam.style.left=`${(first.left-bounds.left)/scale}px`;beam.style.top=`${(first.top-bounds.top)/scale}px`;
      beam.style.width=`${(last.right-first.left)/scale}px`;beam.style.height=`${(last.bottom-first.top)/scale}px`;
      board.append(beam);setTimeout(()=>beam.remove(),1000);
    }
    if(cross){
      const rect=cells[index].getBoundingClientRect(),spark=document.createElement("span");spark.className="cross-spark";spark.textContent="+";
      spark.style.left=`${(rect.left+rect.width/2-bounds.left)/scale}px`;spark.style.top=`${(rect.top+rect.height/2-bounds.top)/scale}px`;board.append(spark);setTimeout(()=>spark.remove(),1100);
      audio.tone(1046,0,.18);audio.tone(1318,.09,.24);
    }
  }

  function win(){
    const ms=time(),minimum=puzzle.solution.filter(Boolean).length;
    const stars=hints===0&&moves<=minimum+6?3:hints<=2&&moves<=minimum*3?2:1;
    resultData={ms,moves,hints,stars};
    if(level===1){
      stashChaos();
      if(chaosIndex<9){chaos.done[chaosIndex]=true;chaos.stars[chaosIndex]=stars;}
      else{
        resultData.ms=chaos.sessions.reduce((s,x)=>s+(x?.elapsed||0),0);
        resultData.moves=chaos.sessions.reduce((s,x)=>s+(x?.moves||0),0);
        resultData.hints=chaos.sessions.reduce((s,x)=>s+(x?.hints||0),0);
        resultData.stars=resultData.hints===0?3:resultData.hints<=5?2:1;
        campaigns[1].complete(chapterNumber,puzzle,resultData.stars,resultData.ms,resultData.hints);chaos.finished=true;
      }
      saveChaos();
    }else campaigns[0].complete(chapterNumber,puzzle,stars,ms,hints);
    save();
    transition("celebrating");$("timer").textContent=format(ms);status("checking");
    $("game").classList.add("celebrating");
    cells.forEach(el=>el.disabled=true);["undo","reset","hint","pause","help","brand","language"].forEach(id=>$(id).disabled=true);
    celebration={elapsed:0,last:0,line:-2};showProof(-1);
    // Visible animation time only: a hidden tab cannot silently skip the finale.
    frameId=requestAnimationFrame(celebrateFrame);
  }
  function showProof(line){
    const {n}=puzzle,total=n*2;
    cells.forEach(el=>el.classList.remove("verified-cell"));targets.forEach(el=>el.classList.remove("verifying"));
    if(line<0)return;
    if(line>=total){status("allVerified");return;}
    const indices=Array.from({length:n},(_,j)=>line<n?line*n+j:j*n+line-n);
    const numbers=indices.filter(i=>selected[i]);numbers.forEach(i=>cells[i].classList.add("verified-cell"));targets[line].classList.add("verifying");
    animate(targets[line],"target-burst");
  }
  function celebrateFrame(now){
    if(state!=="celebrating")return;
    const step=reduceMotion()?100:240,total=puzzle.n*2,lead=350,hold=850,fade=500;
    if(celebration.last&&!document.hidden)celebration.elapsed+=Math.min(50,now-celebration.last);
    celebration.last=now;
    const line=Math.min(total,Math.floor((celebration.elapsed-lead)/step));
    if(line!==celebration.line&&line>=0){celebration.line=line;showProof(line);if(line<total)audio.tone(440+line*33,0,.10,"sine",440+line*33,.025);else{audio.play("win");$("game").classList.add("all-verified");}}
    if(level===1&&chaosIndex<9&&line>=total){showChaosAward();return;}
    if(celebration.elapsed>=lead+total*step+hold)$("game").classList.add("closing");
    if(celebration.elapsed>=lead+total*step+hold+fade){
      ['help','brand','language'].forEach(id=>$(id).disabled=false);
      if(level===1&&chaosIndex<9){showAtlas();const earned=$('atlas-world').children[chaosIndex];animate(earned,'target-burst');tapEffects(earned,true);return;}
      transition('won');renderResult();burst();$('again').focus({preventScroll:true});return;
    }
    frameId=requestAnimationFrame(celebrateFrame);
  }
  function renderResult(){
    if(!resultData)return;
    $("result-chapter").textContent=t("clearedTitle",{number:chapterNumber});$("next-chapter").textContent=t("nextCopy",{number:(BigInt(chapterNumber)+1n).toString()});
    $("stars").replaceChildren();
    for(let i=0;i<3;i++){const star=document.createElement("span");star.textContent="★";star.className=i<resultData.stars?"earned":"empty";star.style.setProperty("--delay",`${i*180+180}ms`);$("stars").append(star);}
    $("stars").setAttribute("aria-label",t("stars",{number:resultData.stars}));$("rating-note").textContent=t(`rating${resultData.stars}`);
    $("final-time").textContent=format(resultData.ms);$("final-moves").textContent=resultData.moves;$("final-hints").textContent=resultData.hints;
    const best=campaigns[level].records[chapterNumber]?.best;$("best").textContent=best?t("best",{time:format(best)}):t("noBest");
  }
  function burst(){
    if(reduceMotion())return;const rect=$("stars").getBoundingClientRect();
    for(let i=0;i<26;i++){const p=document.createElement("i");p.className="particle";p.style.left=`${rect.left+rect.width/2}px`;p.style.top=`${rect.top}px`;p.style.background=["var(--green)","var(--orange)","var(--ink)"][i%3];p.style.setProperty("--x",`${(Math.random()-.5)*350}px`);p.style.setProperty("--y",`${Math.random()*220-100}px`);p.style.setProperty("--r",`${Math.random()*500}deg`);$("particles").append(p);setTimeout(()=>p.remove(),900);}
  }
  function openDialog(kind){
    if($("dialog").open||state==="celebrating")return;returnFocus=document.activeElement;dialogKind=kind;if(state==="playing")transition("paused");renderDialog();$("dialog").showModal();fitStage();
  }
  function closeDialog(resume=true){$("dialog").close();if(dialogKind==="tutorial")tutorialPending=null;dialogKind="";if(resume&&state==="paused")transition("playing");returnFocus?.focus({preventScroll:true});}
  function dialogButton(label,action,secondary=false){const b=document.createElement("button");b.className=secondary?"text-button":"primary";b.textContent=t(label);b.onclick=action;$("dialog-actions").append(b);}
  function renderDialog(){
    $("dialog-actions").replaceChildren();$("dialog").dataset.kind=dialogKind;const kind=dialogKind;
    if(kind==="tutorial"){renderTutorial();return;}
    $("dialog-title").textContent=t(`${kind}Title`);
    if(kind==="help"){
      $("dialog-body").innerHTML='<div class="help-example" aria-hidden="true"><span>2</span><b>+</b><span>5</span><b>=</b><span>7 ✓</span></div>'+[1,2,3].map(n=>`<div class="rule"><b>${n}</b><span>${t(`rule${n}`)}</span></div>`).join("")+`<details class="rating-details"><summary>${t("ratingDetails")}</summary><p>${t("ratingsHelp")}</p></details>`;dialogButton("tutorial",()=>{closeDialog(false);beginTutorial();});dialogButton("understood",()=>closeDialog(),true);return;
    }
    $("dialog-body").textContent="";const p=document.createElement("p");p.textContent=t(`${kind}Body`);$("dialog-body").append(p);
    if(kind==="pause"){dialogButton("resume",()=>closeDialog());dialogButton("levelMap",()=>{dialogKind="leave";renderDialog();},true);return;}
    if(kind==="leave"){dialogButton("levelMap",()=>{closeDialog(false);showMap();});dialogButton("cancel",()=>closeDialog(),true);return;}
    if(kind==="reset"){dialogButton("reset",()=>{selected.fill(false);history=[];moves=0;elapsed=0;cells.forEach(el=>el.classList.remove("hinted"));previousDone.clear();closeDialog();render();stashChaos();$("timer").textContent="00:00";status("resetDone");audio.play("click");});dialogButton("cancel",()=>closeDialog(),true);return;}
    if(kind==="hint"){renderHintDialog();return;}
    dialogButton("okay",()=>closeDialog());
  }
  function beginTutorial(){
    tutorialStep=0;tutorialSelection=[false,false,false,false];openDialog("tutorial");
  }
  function renderTutorial(){
    $("dialog-title").textContent=t("tutorialTitle");
    if(!$("dialog-body").querySelector('.tutorial-board'))$("dialog-body").innerHTML='<p class="tutorial-instruction" role="status"></p><div class="tutorial-board"></div><p class="tutorial-progress"></p>';
    $("dialog-body").querySelector('.tutorial-instruction').textContent=t(`tutorial${tutorialStep}`);
    $("dialog-body").querySelector('.tutorial-progress').textContent=t('tutorialProgress',{number:Math.min(tutorialStep+1,4)});
    const board=$("dialog-body").querySelector(".tutorial-board"),values=[2,4,3,5],goals=[2,5,2,5];
    const sums=[(tutorialSelection[0]?2:0)+(tutorialSelection[1]?4:0),(tutorialSelection[2]?3:0)+(tutorialSelection[3]?5:0),(tutorialSelection[0]?2:0)+(tutorialSelection[2]?3:0),(tutorialSelection[1]?4:0)+(tutorialSelection[3]?5:0)];
    const expected=[0,1,1,3][tutorialStep];
    const target=i=>{const el=document.createElement("div");el.className=`target${sums[i]===goals[i]?" done":sums[i]>goals[i]?" over":""}`;el.innerHTML=`<span>${goals[i]}</span><small>${sums[i]} / ${goals[i]} ${sums[i]===goals[i]?"✓":""}</small>`;return el;};
    for(let i=0;i<4;i++){
      const button=board.querySelector(`[data-tutorial-cell="${i}"]`)||document.createElement("button");button.className=`cell${tutorialSelection[i]?" selected":""}${i===expected?" tutorial-expected":""}`;button.textContent=values[i];button.dataset.tutorialCell=i;button.setAttribute("aria-pressed",tutorialSelection[i]);button.disabled=tutorialStep===4;
      button.onclick=()=>{if(i!==expected){audio.play("error");animate(button,"error");return;}tutorialSelection[i]=!tutorialSelection[i];tutorialStep++;audio.play(tutorialStep===2?"click":tutorialStep===4?"win":"good");renderDialog();animate(button,'pop');tapEffects(button,tutorialSelection[i]);const next=$("dialog").querySelector(".tutorial-expected")||$("dialog-actions").querySelector(".primary");next?.focus({preventScroll:true});};
      if(!button.parentNode){board.append(button);if(i%2===1)board.append(target(Math.floor(i/2)));}
    }
    if(!board.querySelector('.bottom')){const bottomTargets=[target(2),target(3)];bottomTargets.forEach(el=>el.classList.add("bottom"));board.append(...bottomTargets);}
    board.classList.toggle('tutorial-victory',tutorialStep===4);
    board.querySelectorAll('.target').forEach((el,i)=>{
      const gained=sums[i]===goals[i]&&!el.classList.contains('done');
      el.classList.toggle('done',sums[i]===goals[i]);el.classList.toggle('over',sums[i]>goals[i]);el.querySelector('small').textContent=`${sums[i]} / ${goals[i]}`;
      if(gained&&!reduceMotion()){
        animate(el,'target-burst');
        const indexes=i<2?[i*2,i*2+1]:[i-2,i],buttons=indexes.map(j=>board.querySelector(`[data-tutorial-cell="${j}"]`));
        buttons.forEach(b=>animate(b,'line-ripple'));
        const beam=document.createElement('i');beam.className='line-beam '+(i<2?'horizontal':'vertical');
        Object.assign(beam.style,{left:buttons[0].offsetLeft+'px',top:buttons[0].offsetTop+'px',width:buttons[1].offsetLeft+buttons[1].offsetWidth-buttons[0].offsetLeft+'px',height:buttons[1].offsetTop+buttons[1].offsetHeight-buttons[0].offsetTop+'px'});
        board.append(beam);setTimeout(()=>beam.remove(),850);
      }
    });
    if(tutorialStep===4)dialogButton("tutorialFinish",()=>{tutorialSeen=true;storage.set("tutorial.v1","done");const pending=tutorialPending;tutorialPending=null;closeDialog();if(pending==='chaos'){level=1;prepareChaos();showAtlas();}else if(pending&&state==="map")startGame(pending);else if(state==="menu"){level=0;showMap();}});
    dialogButton("tutorialClose",()=>{tutorialPending=null;closeDialog();},true);
  }
  function updateGameLabel(){
    $('game-return').hidden=level!==1;$('game-return').disabled=state!=='playing';
    const boss=level===0&&Puzzle.difficulty(chapterNumber).boss;
    $('level-label').textContent=level===1?`${t('chaosMode')} · ${t('level',{number:chapterNumber})} · ${chaosIndex===9?t('finalPuzzle'):t('sector',{number:chaosIndex+1})}`:`${t('level',{number:chapterNumber})}${boss?' · '+t('boss'):''}`;
    $('game').classList.toggle('boss-board',boss);$('game').classList.toggle('chaos-board',level===1);
  }
  function saveChaos(){if(chaos)storage.set('chaos.v1',JSON.stringify({generatorVersion:chaos.generatorVersion,number:chaos.number,done:chaos.done,stars:chaos.stars,sessions:chaos.sessions,finished:chaos.finished}));}
  function stashChaos(){
    if(level!==1||!chaos||chaosIndex<0||chaos.done[chaosIndex]||state!=='playing'&&state!=='paused')return;
    chaos.sessions[chaosIndex]={selected:[...selected],moves,hints,elapsed:time(),history:history.map(x=>({...x}))};saveChaos();
  }
  function prepareChaos(number=campaigns[1].next,fresh=false){
    if(chaos?.number===number&&!fresh)return;
    let previous=null;try{previous=JSON.parse(storage.get('chaos.v1'))}catch{}
    const legacy=!fresh&&previous?.number===number&&previous.generatorVersion!==2&&previous.sessions?.some(Boolean);
    const generated=Puzzle.constellation(campaigns[1].seed,number,legacy);
    chaos={...generated,generatorVersion:legacy?1:2,number,done:Array(9).fill(false),stars:Array(9).fill(0),sessions:Array(10).fill(null),finished:false};atlasZoom=1;atlasX=atlasY=0;
    try{
      const saved=JSON.parse(storage.get('chaos.v1'));
      if(!fresh&&saved?.number===number&&Array.isArray(saved.sessions)){
        saved.sessions.slice(0,10).forEach((s,i)=>{
          const b=i===9?chaos.meta:chaos.boards[i];
          if(!s||!Array.isArray(s.selected)||s.selected.length!==b.values.length||!s.selected.every(v=>typeof v==='boolean'))return;
          const safe=n=>Number.isFinite(n)&&n>=0?n:0;
          chaos.sessions[i]={selected:s.selected,moves:safe(s.moves),hints:safe(s.hints),elapsed:safe(s.elapsed),history:[]};
          if(i<9){chaos.done[i]=s.selected.every((v,j)=>v===b.solution[j]);if(chaos.done[i]){const minimum=b.solution.filter(Boolean).length;chaos.stars[i]=s.hints===0&&s.moves<=minimum+6?3:s.hints<=2&&s.moves<=minimum*3?2:1;}}
        });
        chaos.finished=chaos.done.every(Boolean)&&chaos.sessions[9]?.selected.every((v,j)=>v===chaos.meta.solution[j]);
      }
    }catch{}
    saveChaos();
  }
  function showAtlas(){
    atlasClocks.clear();
    stashChaos();level=1;if(!chaos||chaos.finished)prepareChaos(campaigns[1].next);
    atlasPointers.clear();atlasLast=null;atlasSuppress=false;
    transition('atlas');renderAtlas();
  }
  function renderAtlas(){
    $('atlas-chapter').textContent=t('level',{number:chaos.number});
    const count=chaos.done.filter(Boolean).length;$('atlas-progress').textContent=`${count} / 9`;
    $('atlas-world').replaceChildren();$('atlas-rewards').replaceChildren();
    chaos.boards.forEach((b,i)=>{
      const card=document.createElement('div');card.className='atlas-card'+(chaos.done[i]?' solved':'');card.dataset.sector=i;
      const expand=document.createElement('button');expand.className='sector-expand';expand.textContent=language==='tr'?'Aç':'Open';expand.setAttribute('aria-label',`${expand.textContent} · ${t('sector',{number:i+1})}`);expand.onclick=()=>{if(!atlasSuppress)startSector(i)};card.append(expand);
      card.setAttribute('aria-label',`${t('sector',{number:i+1})}${chaos.done[i]?' · '+t('completed')+' · '+t('reward',{number:chaos.meta.values[i]}):''}`);
      if(chaos.done[i]){const reward=document.createElement('b');reward.className='reward-number';reward.textContent=chaos.meta.values[i];const label=document.createElement('small');label.textContent=t('completed');const stars=document.createElement('span');stars.className='card-stars';stars.textContent='★'.repeat(chaos.stars[i]);card.append(reward,label,stars);}
      else{
        const mini=document.createElement('span');mini.className='mini-grid';
        const selection=chaos.sessions[i]?.selected||[];
        for(let r=0;r<6;r++){
          for(let c=0;c<6;c++){const j=r*6+c,cell=document.createElement('button');cell.className='mini-cell';cell.dataset.cell=j;cell.textContent=b.values[j];cell.classList.toggle('on',!!selection[j]);cell.setAttribute('aria-pressed',!!selection[j]);cell.setAttribute('aria-label',t('cell',{r:r+1,c:c+1,value:b.values[j]}));cell.onclick=e=>{e.stopPropagation();if(!atlasSuppress)toggleAtlas(i,j)};mini.append(cell)}
          const target=document.createElement('b');target.className='mini-target row';target.textContent=b.rows[r];mini.append(target);
        }
        b.cols.forEach(v=>{const target=document.createElement('b');target.className='mini-target column';target.textContent=v;mini.append(target)});
        const corner=document.createElement('b');corner.className='mini-corner';mini.append(corner);card.append(mini);
      }
      $('atlas-world').append(card);
      const token=document.createElement('span');token.textContent=chaos.done[i]?chaos.meta.values[i]:'·';token.className=chaos.done[i]?'earned':'';$('atlas-rewards').append(token);
    });
    $('atlas-final').disabled=count!==9;$('atlas-final').textContent=count===9?(language==='tr'?'Son soruyu aç':'Open final puzzle'):`${count} / 9 · ${language==='tr'?'Kilitli':'Locked'}`;
    $('chaos-flow').textContent=count===9?(language==='tr'?'Hazır! Sayıları seç, hedefleri tuttur.':'Ready! Select numbers to match the targets.'):(language==='tr'?'9 bulmacayı tamamla, son soruyu aç.':'Complete 9 puzzles to unlock the final puzzle.');
    $('atlas-rewards').classList.toggle('final-ready',count===9);
    [...$('atlas-rewards').children].forEach((el,i)=>{el.style.gridRow=String(Math.floor(i/3)+1);el.style.gridColumn=String(i%3+1)});
    for(let k=0;k<6;k++){const target=document.createElement('span');target.className='reward-target';target.textContent=[...chaos.meta.rows,...chaos.meta.cols][k];target.style.gridRow=String(k<3?k+1:4);target.style.gridColumn=String(k<3?4:k-2);$('atlas-rewards').append(target)}
    $('atlas-final').classList.toggle('ready',count===9);applyAtlasCamera();
    chaos.boards.forEach((b,i)=>{if(!chaos.done[i])updateAtlasTotals(i)});
  }
  const atlasClocks=new Map();
  function updateAtlasTotals(index){
    const b=chaos.boards[index],session=chaos.sessions[index],sums=Array(12).fill(0),card=$('atlas-world').children[index];
    (session?.selected||[]).forEach((on,j)=>{if(on){sums[Math.floor(j/6)]+=b.values[j];sums[6+j%6]+=b.values[j]}});
    card.querySelectorAll('.mini-target').forEach((el,j)=>{const goal=[...b.rows,...b.cols][j];el.classList.toggle('done',sums[j]===goal);el.classList.toggle('over',sums[j]>goal);el.dataset.progress=`${sums[j]} / ${goal}`;el.setAttribute('aria-label',el.dataset.progress);el.title=el.dataset.progress});return sums;
  }
  function toggleAtlas(index,cell){
    if(state!=='atlas'||chaos.done[index])return;
    const b=chaos.boards[index],session=chaos.sessions[index]||{selected:Array(36).fill(false),moves:0,hints:0,elapsed:0,history:[]};chaos.sessions[index]=session;
    const now=performance.now();if(atlasClocks.has(index))session.elapsed+=now-atlasClocks.get(index);atlasClocks.clear();atlasClocks.set(index,now);
    session.history.push({i:cell,before:session.selected[cell]});session.selected[cell]=!session.selected[cell];session.moves++;
    const card=$('atlas-world').children[index],button=card.querySelector(`[data-cell="${cell}"]`);button.classList.toggle('on',session.selected[cell]);button.setAttribute('aria-pressed',session.selected[cell]);animate(button,'pop');tapEffects(button,session.selected[cell]);
    const sums=updateAtlasTotals(index),goals=[...b.rows,...b.cols];
    if(sums.every((v,i)=>v===goals[i])){
      const minimum=b.solution.filter(Boolean).length;chaos.done[index]=true;chaos.stars[index]=session.hints===0&&session.moves<=minimum+6?3:session.hints<=2&&session.moves<=minimum*3?2:1;
      audio.play('win');saveChaos();renderAtlas();animate($('atlas-world').children[index],'target-burst');tapEffects($('atlas-world').children[index],true);
    }else{audio.play(sums.some((v,i)=>v>goals[i])?'error':sums.some((v,i)=>v===goals[i])?'good':'click');saveChaos();}
  }
  function paintChaosContext(){
    let backdrop=$('chaos-context');if(!backdrop){backdrop=document.createElement('div');backdrop.id='chaos-context';backdrop.setAttribute('aria-hidden','true');backdrop.inert=true;document.body.prepend(backdrop);}
    backdrop.replaceChildren();const grid=document.createElement('div');grid.className='context-grid';
    [...$('atlas-world').children].forEach((card,i)=>{const tile=document.createElement('div');tile.className='context-card'+(i===chaosIndex?' active':'');tile.innerHTML=card.innerHTML;grid.append(tile)});backdrop.append(grid);
  }
  function showChaosAward(){
    if($('chaos-award'))return;
    const award=document.createElement('div');award.id='chaos-award';award.className='chaos-award';award.setAttribute('role','status');
    const number=document.createElement('strong');number.textContent=chaos.meta.values[chaosIndex];
    const label=document.createElement('span');label.textContent=t('completed');
    const stars=document.createElement('div');stars.className='award-stars';stars.textContent='★'.repeat(chaos.stars[chaosIndex]);stars.setAttribute('aria-label',t('stars',{number:chaos.stars[chaosIndex]}));
    const back=document.createElement('button');back.className='secondary award-return';back.textContent=t('allPuzzles');back.onclick=()=>$('game-return').click();
    award.append(number,label,stars,back);$('board').append(award);$('game').classList.add('chaos-awarded');$('game-return').disabled=false;
    if(!reduceMotion())award.animate([{opacity:0,transform:'scale(.85)'},{opacity:1,transform:'scale(1)'}],{duration:350,easing:'cubic-bezier(.2,.8,.2,1)'});
  }
  function startSector(index){
    atlasClocks.clear();
    if(state!=='atlas'||index===9&&!chaos.done.every(Boolean))return;
    chaosIndex=index;paintChaosContext();launchBoard(index===9?chaos.meta:chaos.boards[index],chaos.number);
    const session=chaos.sessions[index];
    if(session){selected=[...session.selected];moves=session.moves;hints=session.hints;elapsed=session.elapsed;history=session.history.map(x=>({...x}));startedAt=performance.now();render();}
    const review=index<9&&chaos.done[index];
    $('game').classList.toggle('review-board',review);
    if(review){cells.forEach(el=>el.disabled=true);['undo','reset','hint'].forEach(id=>$(id).disabled=true);showChaosAward();}
    updateGameLabel();
  }
  function applyAtlasCamera(){
    const area=$('atlas-window'),limitX=(atlasZoom-1)*area.clientWidth/2,limitY=(atlasZoom-1)*area.clientHeight/2;
    atlasX=Math.max(-limitX,Math.min(limitX,atlasX));atlasY=Math.max(-limitY,Math.min(limitY,atlasY));
    const world=$('atlas-world'),width=area.clientWidth*atlasZoom,height=area.clientHeight*atlasZoom;
    Object.assign(world.style,{width:`${width}px`,height:`${height}px`,left:`${(area.clientWidth-width)/2}px`,top:`${(area.clientHeight-height)/2}px`,translate:`${atlasX}px ${atlasY}px`,transform:'none'});
    world.style.setProperty('--az',String(atlasZoom));
    $('zoom-out').disabled=atlasZoom<=1;$('zoom-in').disabled=atlasZoom>=3;
  }
  let cameraFrame=0;
  function scheduleAtlasCamera(){if(!cameraFrame)cameraFrame=requestAnimationFrame(()=>{cameraFrame=0;applyAtlasCamera();});}
  function zoomAtlas(delta,clientX,clientY){
    const rect=$('atlas-window').getBoundingClientRect(),scale=rect.width/$('atlas-window').offsetWidth;
    const x=clientX===undefined?0:(clientX-rect.left-rect.width/2)/scale,y=clientY===undefined?0:(clientY-rect.top-rect.height/2)/scale;
    const old=atlasZoom;atlasZoom=Math.max(1,Math.min(3,atlasZoom+delta));
    atlasX=x-(x-atlasX)*atlasZoom/old;atlasY=y-(y-atlasY)*atlasZoom/old;scheduleAtlasCamera();
  }
  let atlasSuppress=false,atlasPointers=new Map(),atlasLast=null;
  $('atlas-window').addEventListener('pointerdown',e=>{if(e.button!==0)return;if(!atlasPointers.size)atlasSuppress=false;atlasPointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});atlasLast=null;});
  $('atlas-window').addEventListener('pointermove',e=>{
    const old=atlasPointers.get(e.pointerId);if(!old)return;
    const dx=e.clientX-old.x,dy=e.clientY-old.y;atlasPointers.set(e.pointerId,{...old,x:e.clientX,y:e.clientY});
    if(atlasPointers.size===2){
      const [a,b]=[...atlasPointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);
      if(atlasLast)zoomAtlas(atlasZoom*(distance/atlasLast-1),(a.x+b.x)/2,(a.y+b.y)/2);atlasLast=distance;atlasSuppress=true;
    }else if(atlasZoom>1&&(Math.hypot(e.clientX-old.startX,e.clientY-old.startY)>5||atlasSuppress)){
      atlasSuppress=true;const scale=$('atlas-window').getBoundingClientRect().width/$('atlas-window').offsetWidth;atlasX+=dx/scale;atlasY+=dy/scale;scheduleAtlasCamera();
    }
    if(atlasSuppress)$('atlas-window').setPointerCapture(e.pointerId);
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(event,e=>{atlasPointers.delete(e.pointerId);atlasLast=null;});
  $('atlas-window').addEventListener('click',e=>{if(atlasSuppress&&e.detail!==0){e.preventDefault();e.stopPropagation();atlasSuppress=false;}else if(e.detail===0)atlasSuppress=false;},true);
  $('atlas-window').addEventListener('wheel',e=>{e.preventDefault();zoomAtlas(-Math.sign(e.deltaY)*.15,e.clientX,e.clientY)},{passive:false});
  $('atlas-window').addEventListener('keydown',e=>{if(['+','=','-','0'].includes(e.key)){e.preventDefault();if(e.key==='0'){atlasZoom=1;atlasX=atlasY=0;applyAtlasCamera()}else zoomAtlas(e.key==='-'?-.25:.25)}});
  $('zoom-in').onclick=()=>zoomAtlas(.5);$('zoom-out').onclick=()=>zoomAtlas(-.5);$('zoom-fit').onclick=()=>{atlasZoom=1;atlasX=atlasY=0;applyAtlasCamera()};
  copy.allPuzzles=['Geri Dön','Go Back'];
  const returnButton=document.createElement('button');returnButton.id='game-return';returnButton.className='secondary';returnButton.hidden=true;returnButton.dataset.label='allPuzzles';
  returnButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 6-6 6 6 6M4 12h16"/></svg><span data-i18n="allPuzzles"></span>';
  $('game').prepend(returnButton);
  returnButton.onclick=()=>{if(level!==1||!['playing','celebrating'].includes(state))return;if(state==='playing')transition('paused');['help','brand','language'].forEach(id=>$(id).disabled=false);showAtlas();audio.play('click')};
  copy.backMenu=['Ana menü','Main menu'];
  for(const id of ['atlas-home','map-home']){
    const back=$(id);back.className='secondary navigation-back';back.dataset.label='backMenu';
    back.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 6-6 6 6 6M4 12h16"/></svg><span data-i18n="backMenu"></span>';
  }
  $('atlas-final').onclick=()=>startSector(9);$('atlas-home').onclick=()=>{transition('menu');refreshLabels()};
  $('chaos-start').onclick=()=>{level=1;if(!tutorialSeen){tutorialPending='chaos';beginTutorial();return;}prepareChaos();if(chaos.finished)prepareChaos(campaigns[1].next);showAtlas();audio.play('click')};
  window.addEventListener('beforeunload',stashChaos);
  $("welcome-help").onclick=()=>openDialog("help");
  $("start").onclick=()=>{level=0;audio.play("click");showMap();};$("map-play").onclick=()=>startGame();
  $("map-home").onclick=()=>{transition("menu");refreshLabels();$("start").focus();};
  $("map-prev").onclick=()=>moveMap(-1);
  $("map-next").onclick=()=>moveMap(1);
  for(const [id,d] of [['map-prev','m14 6-6 6 6 6M8 12h12'],['map-next','m10 6 6 6-6 6M4 12h12']])$(id).innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  $("map-current").onclick=()=>showMap();
  $("map-window").addEventListener("pointerdown",event=>{
    if(event.button!==0)return;cancelAnimationFrame(mapFrame);mapVelocity=0;suppressMapClick=false;
    mapDrag={x:event.clientX,start:event.clientX,time:performance.now(),id:event.pointerId};
  });
  $("map-window").addEventListener("pointermove",event=>{
    if(!mapDrag||mapDrag.id!==event.pointerId)return;
    const delta=mapDrag.x-event.clientX,now=performance.now(),step=$("map-window").getBoundingClientRect().width/(10/mapLanes);
    if(Math.abs(event.clientX-mapDrag.start)>5){suppressMapClick=true;$("map-window").setPointerCapture(event.pointerId);}
    if(suppressMapClick){panMap(delta/step);mapVelocity=delta/step/Math.max(8,now-mapDrag.time);}
    mapDrag.x=event.clientX;mapDrag.time=now;
  });
  const releaseMap=()=>{if(!mapDrag)return;if(performance.now()-mapDrag.time>90)mapVelocity=0;mapDrag=null;if(suppressMapClick&&!reduceMotion())coastMap();};
  $("map-window").addEventListener("pointerup",releaseMap);
  $("map-window").addEventListener("pointercancel",()=>{mapDrag=null;mapVelocity=0;});
  $("map-window").addEventListener("click",event=>{if(suppressMapClick){event.preventDefault();event.stopPropagation();suppressMapClick=false;}},true);
  $("map-window").addEventListener("wheel",event=>{event.preventDefault();cancelAnimationFrame(mapFrame);panMap((Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY)/($("map-window").getBoundingClientRect().width/(10/mapLanes)));},{passive:false});
  $("map-window").addEventListener("keydown",event=>{if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();suppressMapClick=false;moveMap(event.key==="ArrowRight"?1:-1);}});
  window.addEventListener("resize",()=>{const lanes=window.innerWidth<760?2:1;if(lanes!==mapLanes){mapPage=mapPage*BigInt(mapLanes)/BigInt(lanes);mapLanes=lanes;mapFraction=0;}if(state==="map")renderMap();});
  $('again').onclick=()=>{if(level===1){prepareChaos(campaigns[1].next);showAtlas()}else startGame((BigInt(chapterNumber)+1n).toString())};
  $('retry').onclick=()=>{if(level===1){prepareChaos(chapterNumber,true);showAtlas()}else startGame(chapterNumber)};$('home').onclick=()=>showMap();
  $("brand").onclick=()=>{if(state==="playing")openDialog("leave");else if(state==="map"||state==="won"||state==='atlas'){transition("menu");refreshLabels();}};
  $("help").onclick=()=>openDialog("help");$("pause").onclick=()=>openDialog("pause");$("undo").onclick=undo;
  $("reset").onclick=()=>{if(state==="playing")openDialog("reset");};$("hint").onclick=()=>{if(state==="playing")openDialog("hint");};
  $("language").onclick=()=>{language=language==="tr"?"en":"tr";storage.set("language",language);refreshLabels();};
  $("theme").onclick=()=>{theme=theme==="day"?"night":"day";storage.set("theme",theme);updateTheme();audio.play("click");};
  $("sound").onclick=()=>{audio.enabled=!audio.enabled;storage.set("sound",audio.enabled?"on":"off");updateSound();audio.play("click");};
  document.querySelectorAll("[data-level]").forEach(button=>button.onclick=()=>{level=Number(button.dataset.level);audio.play("click");document.querySelectorAll("[data-level]").forEach(el=>{const on=el===button;el.classList.toggle("chosen",on);el.setAttribute("aria-pressed",on);});refreshLabels();});
  $("dialog").addEventListener("cancel",event=>{event.preventDefault();closeDialog();});
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&state==="playing")openDialog("pause");});
  document.addEventListener("keydown",event=>{
    if(state!=="playing"||event.altKey)return;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="z"){event.preventDefault();undo();return;}
    if(event.key==="Escape"){openDialog("pause");return;}
    if(!event.target.matches(".cell")||event.ctrlKey||event.metaKey)return;
    const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-puzzle.n,ArrowDown:puzzle.n}[event.key];
    if(delta!==undefined){event.preventDefault();const index=(Number(event.target.dataset.index)+delta+cells.length)%cells.length;cells.forEach((el,i)=>el.tabIndex=i===index?0:-1);cells[index].focus();}
  });
  setInterval(()=>{if(state==="playing")$("timer").textContent=format(time());},200);
  syncHints();setInterval(()=>{const before=hintWallet.charges;syncHints();if(dialogKind==='hint'&&before!==hintWallet.charges)renderDialog();},1000);
  window.addEventListener("resize",fitStage);
  window.addEventListener('resize',()=>{if(state==='atlas')applyAtlasCamera()});
  new ResizeObserver(()=>fitStage()).observe($("dialog"));
  refreshLabels();
  fitStage();
})();
