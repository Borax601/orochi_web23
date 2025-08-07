// ページの全てのコンテンツが読み込まれてから実行する
document.addEventListener('DOMContentLoaded', function() {
  setupHeroAnimation();
  initializeApp();
});

// ===== ヒーローアニメーション =====
function setupHeroAnimation() {
  const frames = [
    document.getElementById('orochi-pose-a'),
    document.getElementById('orochi-pose-b'),
    document.getElementById('orochi-pose-c'),
    document.getElementById('orochi-pose-d')
  ];
  const finale = document.getElementById('orochi-pose-e');

  let idx = 0;
  const frameMs   = 1000;
  const loopDelay = 1200;

  const hideAll = () => {
    frames.forEach(f => { if (f) f.style.opacity = 0; });
    if (finale) finale.style.opacity = 0;
  };

  const playLoop = () => {
    hideAll();
    idx = 0;

    const frameTimer = setInterval(() => {
      hideAll();
      if (!frames[idx]) return;
      frames[idx].style.opacity = 1;
      frames[idx].style.zIndex = 2;
      idx++;

      if (idx === frames.length) {
        clearInterval(frameTimer);
        setTimeout(() => {
          hideAll();
          if (!finale) return;
          finale.style.opacity = 1;
          finale.classList.add('fade-out');
          setTimeout(() => {
            finale.classList.remove('fade-out');
            playLoop();
          }, loopDelay);
        }, frameMs);
      }
    }, frameMs);
  };

  playLoop();
}

// ===== Hero Intro Timeline =====
/* ===== hero timeline (overwrite) ===== */
function playHeroIntro(){
  const steps = [...document.querySelectorAll('#hero-intro .intro-step')];
  if(!steps.length) return;
  const delays = [0, 4000, 7000, 10000];
  const holdLast = 3000;
  let idx = 0;

  const next = () => {
    const cur = steps[idx];
    const prev = steps[idx-1];

    if(cur){
      cur.classList.remove('fade-out');
      cur.classList.add('fade-in');
    }
    if(prev){
      prev.classList.remove('fade-in');
      prev.classList.add('fade-out');
    }

    idx++;
    if(idx < steps.length){
      setTimeout(next, delays[idx] - delays[idx-1]);
    }else{
      setTimeout(()=>{
        steps.forEach(s=>s.classList.remove('fade-in','fade-out'));
        idx = 0;
        next();
      }, holdLast);
    }
  };
  next();
}

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();     // 既存初期化
  playHeroIntro();     // ← 最後に呼ぶ
});

// ===== データ取得 共通 =====
const jsonPath = 'オロチポートフォリオ文字データ/works.json';
const csvPath  = 'オロチポートフォリオ文字データ/オロチポートフォリオ表.csv';
const bust     = `?v=${Date.now()}`;

async function fetchJSON(path) {
  const res = await fetch(path + bust, { cache: 'no-store' });
  if (!res.ok) throw new Error(`JSON fetch failed: ${res.status} ${path}`);
  return await res.json();
}
async function fetchText(path) {
  const res = await fetch(path + bust, { cache: 'no-store' });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status} ${path}`);
  return await res.text();
}

function parseCSVLine(line) {
  const cols = [];
  let cur = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
      continue;
    }
    if (ch === ',' && !inQuotes) { cols.push(cur); cur = ''; continue; }
    cur += ch;
  }
  cols.push(cur);
  return cols;
}

function parseCSVToWorks(text) {
  text = text.replace(/\r/g, '');
  const lines = text.split('\n');
  if (!lines.length) return [];
  lines.shift(); // ヘッダー除去

  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = parseCSVLine(line);
    if (cols.length < 4) { console.warn(`[CSV] L${i+2} 列不足`, line); continue; }

    const rawDate = (cols[0] || '').trim();
    const digits  = rawDate.replace(/\D/g, '');
    if (!/^\d{8}$/.test(digits)) { console.warn(`[CSV] L${i+2} 日付不正`, rawDate); continue; }

    const title       = (cols[1] || '').trim();
    const category    = (cols[2] || '').trim();
    const description = (cols[3] || '').trim();

    out.push({
      id: i + 1,
      date: digits,
      month: parseInt(digits.substring(4, 6), 10),
      title, category, description,
      image_filename: `img_${digits}.png`,
    });
  }
  return out;
}

const lastDate = arr =>
  (arr && arr.length ? arr.map(w => w.date).filter(Boolean).sort().at(-1) : '');

function mergeWorks(jsonArr = [], csvArr = []) {
  const map = new Map();
  for (const w of jsonArr || []) {
    if (!w || !w.date) continue;
    map.set(String(w.date), { ...w, category: (w.category || '').trim() });
  }
  for (const w of csvArr || []) {
    if (!w || !w.date) continue;
    map.set(String(w.date), { ...w, category: (w.category || '').trim() });
  }
  return Array.from(map.values()).sort((a, b) => Number(b.date) - Number(a.date));
}

// ===== アプリ初期化 =====
let digestWorks = []; // TOPページ「奉納作品」用の全データ

async function initializeApp() {
  let jsonData = [];
  let csvData  = [];

  try { jsonData = await fetchJSON(jsonPath); }
  catch (e) { console.warn('JSON 読み込み失敗:', e); }

  try {
    const csvText = await fetchText(csvPath);
    csvData = parseCSVToWorks(csvText);
  } catch (e) {
    console.warn('CSV 読み込み失敗:', e);
  }

  const worksData = mergeWorks(jsonData, csvData);
  console.info('Using MERGED dataset', {
    jsonCount: jsonData.length,
    csvCount: csvData.length,
    merged: worksData.length,
  });
  console.info('months:', [...new Set(worksData.map(w => w.month))].sort((a,b)=>a-b));

  const pageId = document.body.id;
  let worksToDisplay = [];

  if (pageId === 'page-gallery') {
    worksToDisplay = worksData.filter(w => w.category === 'イラスト');
  } else if (pageId === 'page-ai-gallery') {
    worksToDisplay = worksData.filter(w => w.category === 'AI');
  } else if (pageId === 'page-video-gallery') {
    worksToDisplay = worksData.filter(w => w.category === '動画');
  } else if (document.getElementById('digest-gallery-grid')) {
    digestWorks = worksToDisplay = worksData
      .filter(w => w.category === 'イラスト' && w.date)
      .sort((a, b) => Number(b.date) - Number(a.date));
    refreshDigestGrid(); // 下で定義する関数
  }

  if (document.getElementById('full-gallery-grid')) {
    renderGallery(worksToDisplay, '#full-gallery-grid');
    setupFilter(worksToDisplay);
  }
  if (document.getElementById('digest-gallery-grid')) {
    // renderGallery(worksToDisplay.slice(0, 10), '#digest-gallery-grid');
  }

  renderAIDigest(worksData);
  renderVideoDigest(worksData); // 追加

  setupLikeButtons();
  setupHamburgerMenu();
  markCurrentNav();
  // setupHeaderAutoHide();   ← これをコメントアウト

  /* === Header fade-out on scroll (2025-08-07) ================= */
  (function setupHeaderFade(){
    const header = document.querySelector('.global-header');
    if(!header) return;

    const fadeEnd = window.innerHeight * 0.2;  // 20% で完全透明
    header.style.willChange = 'opacity';

    let ticking = false;
    window.addEventListener('scroll', () => {
      if(ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const opacity = Math.max(0, 1 - y / fadeEnd);
        header.style.opacity = opacity.toFixed(3);
        ticking = false;
      });
    }, { passive: true });
  })();
  window.addEventListener('resize', onResizeDigest); // 画面リサイズごとに TOP digest を再描画
}

function refreshDigestGrid() {
  const gridEl = document.getElementById('digest-gallery-grid');
  if (!gridEl || !digestWorks.length) return;

  const maxShow = calcColumns() * 2; // 列数 ×2 行
  renderGallery(digestWorks.slice(0, maxShow), '#digest-gallery-grid');
  setupLikeButtons(); // like 再バインド
}

function onResizeDigest() {
  const newCols = calcColumns();
  if (newCols !== onResizeDigest._prevCols) {
    onResizeDigest._prevCols = newCols;
    refreshDigestGrid();
  }
}
onResizeDigest._prevCols = calcColumns(); // 初期化

// === AI digest responsive (1 row: 4/3/2/1) ===
let aiAllWorks = [];
let _aiPrevCols = 0;

function getAIDigestCols() {
  const w = window.innerWidth;
  if (w >= 1280) return 4;   // 一般PC〜4K
  if (w >= 1024) return 3;   // 小型ノート
  if (w >= 768)  return 2;   // タブレット
  return 1;                  // スマホ
}

function refreshAIDigest() {
  const grid = document.getElementById('ai-digest-grid');
  if (!grid || !aiAllWorks.length) return;
  const cols = getAIDigestCols();
  if (cols === _aiPrevCols && grid.children.length) return; // 無駄な再描画防止
  _aiPrevCols = cols;

  // 1 行だけ描画するため、表示数 = 列数 に限定
  renderGallery(aiAllWorks.slice(0, cols), '#ai-digest-grid');

  // いいね再バインド（既存仕様踏襲）
  if (typeof setupLikeButtons === 'function') setupLikeButtons();
}

function onResizeAIDigest() {
  const cols = getAIDigestCols();
  if (cols !== _aiPrevCols) refreshAIDigest();
}

function renderAIDigest(works) {
  const grid = document.getElementById('ai-digest-grid');
  if (!grid) return;

  aiAllWorks = (works || [])
    .filter(w => w.category === 'AI')
    .sort((a, b) => Number(b.date) - Number(a.date)); // 新しい順

  refreshAIDigest();
  window.addEventListener('resize', onResizeAIDigest);
}

// === Video digest responsive (1 row: 4/3/2/1) ===
let videoAllWorks = [];
let _videoPrevCols = 0;

function getVideoDigestCols() {
  const w = window.innerWidth;
  if (w >= 1280) return 4;   // PC〜4K
  if (w >= 1024) return 3;   // 小型ノート
  if (w >= 768)  return 2;   // タブレット
  return 1;                  // スマホ
}

function renderVideoCards(works, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const html = works.map(w => {
    const ym   = String(w.date).substring(0,6);
    const img  = `assets/gallery_${ym}/${w.image_filename}`;
    const mp4  = `assets/gallery_${ym}/vid_${w.date}.mp4`;
    const MP4  = `assets/gallery_${ym}/vid_${w.date}.MP4`; // フォールバック用

    return `
      <div class="gallery-card" data-month="${w.month}">
        <img src="${img}" alt="${w.title}" class="card-image" loading="lazy"
             data-video="${mp4}" data-video-alt="${MP4}">
        <div class="card-info">
          <h3 class="card-title">${w.title}</h3>
          <p class="card-description">${w.description}</p>
          <div class="gallery-icons">
            <span class="like-btn">♡ 0</span>
          </div>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = html;
}

function refreshVideoDigest() {
  const grid = document.getElementById('video-digest-grid');
  if (!grid || !videoAllWorks.length) return;
  const cols = getVideoDigestCols();
  if (cols === _videoPrevCols && grid.children.length) return;
  _videoPrevCols = cols;
  // 1行表示：列数=表示数
  renderVideoCards(videoAllWorks.slice(0, cols), '#video-digest-grid');
  if (typeof setupLikeButtons === 'function') setupLikeButtons();
}

function onResizeVideoDigest() {
  const cols = getVideoDigestCols();
  if (cols !== _videoPrevCols) refreshVideoDigest();
}

function renderVideoDigest(works) {
  const grid = document.getElementById('video-digest-grid');
  if (!grid) return;

  // CSV/JSONのうち category=動画 を新しい順に
  videoAllWorks = (works || [])
    .filter(w => w.category === '動画')
    .sort((a,b) => Number(b.date) - Number(a.date));

  refreshVideoDigest();
  window.addEventListener('resize', onResizeVideoDigest);
}

// ===== 描画・UI 関数（既存ロジックを流用） =====
function renderGallery(works, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const galleryHtml = works.map(work => {
    const yearMonth = String(work.date).substring(0, 6);
    const imagePath = `assets/gallery_${yearMonth}/${work.image_filename}`;
    let dataAttr = '';
    if (work.category === '動画') {
      const mp4 = `assets/gallery_${yearMonth}/vid_${work.date}.mp4`;
      const MP4 = `assets/gallery_${yearMonth}/vid_${work.date}.MP4`;
      dataAttr = ` data-video="${mp4}" data-video-alt="${MP4}"`;
    }
    return `
      <div class="gallery-card" data-month="${work.month}">
        <img src="${imagePath}" alt="${work.title}" class="card-image" loading="lazy"${dataAttr}>
        <div class="card-info">
          <h3 class="card-title">${work.title}</h3>
          <p class="card-description">${work.description}</p>
          <div class="gallery-icons">
            <span class="like-btn">♡ 0</span>
          </div>
        </div>
      </div>`;
  }).join('');
  container.innerHTML = galleryHtml;
}

function setupLikeButtons() {
  const likeButtons = document.querySelectorAll('.like-btn');
  likeButtons.forEach(button => {
    const card = button.closest('.gallery-card');
    if (!card) return;
    const imageElement = card.querySelector('.card-image');
    if (!imageElement) return;

    const likeId = 'like-' + imageElement.src;

    if (button.dataset.listenerAttached) return;

    const saved = localStorage.getItem(likeId);
    if (saved) {
      button.innerText = '♥ ' + saved;
      button.classList.add('is-liked');
    }

    button.addEventListener('click', () => {
      if (button.classList.contains('is-liked')) return;
      button.classList.add('is-liked');

      let current = parseInt(button.innerText.replace(/[♡♥]\s?/, '')) || 0;
      const next = current + 1;
      button.innerText = '♥ ' + next;
      localStorage.setItem(likeId, next);

      button.classList.add('is-popping');
      setTimeout(() => button.classList.remove('is-popping'), 300);
    });

    button.dataset.listenerAttached = 'true';
  });
}

function setupFilter(works) {
  const filterBar = document.querySelector('.filter-bar');
  if (!filterBar) return;

  const uniqueMonths = [...new Set(works.map(w => w.month))].sort((a,b)=>a-b);
  const monthButtonsHtml = uniqueMonths.map(m => `<button class="filter-btn" data-month="${m}">${m}月</button>`).join('');

  filterBar.innerHTML = `
    <button class="filter-btn is-active" data-month="all">全て表示</button>
    ${monthButtonsHtml}
  `;

  const buttons = filterBar.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', function(){
      buttons.forEach(b => b.classList.remove('is-active'));
      this.classList.add('is-active');
      const target = this.dataset.month;
      const filtered = (target === 'all') ? works : works.filter(w => String(w.month) === target);
      renderGallery(filtered, '#full-gallery-grid');
      setupLikeButtons();
    });
  });
}

function setupHamburgerMenu() {
  const btn = document.querySelector('.hamburger-menu');
  const nav = document.querySelector('.global-nav');
  if (!btn || !nav || btn.dataset.bound) return;   // 二重バインド防止

  btn.dataset.bound = '1';
  btn.setAttribute('aria-expanded', 'false');

  btn.addEventListener('click', () => {
    const willOpen = !nav.classList.contains('active');
    btn.classList.toggle('active', willOpen);
    nav.classList.toggle('active', willOpen);
    btn.setAttribute('aria-expanded', String(willOpen));
  });

  // PC幅に戻ったら自動で閉じる
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && nav.classList.contains('active')) {
      nav.classList.remove('active');
      btn.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

function calcColumns() {
  const grid = document.getElementById('digest-gallery-grid');
  if (!grid) return 1;

  const firstCard = grid.querySelector('.gallery-card');
  const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 260;

  const style = window.getComputedStyle(grid);
  const gapX = parseInt(style.columnGap || style.gap || 0, 10);

  const gridW = grid.getBoundingClientRect().width;
  return Math.max(1, Math.floor((gridW + gapX) / (cardWidth + gapX)));
}

// ===== Self Test (Shift + D) =====
window.OrochiSelfTest = (() => {
  const bust = () => `?v=${Date.now()}`;
  const norm = c => (c === '動画' ? 'AI' : (c || ''));

  // CSV パーサ（クォート対応）
  function parseCSV(text) {
    text = text.replace(/\r/g, '');
    const lines = text.split('\n');
    if (!lines.length) return [];
    lines.shift();
    const out = [];
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      if (!line.trim()) continue;
      const cols = [];
      let cur = '', q = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { if (q && line[i+1] === '"') { cur += '"'; i++; } else { q = !q; } continue; }
        if (ch === ',' && !q) { cols.push(cur); cur=''; continue; }
        cur += ch;
      }
      cols.push(cur);
      if (cols.length < 4) continue;
      const rawDate = (cols[0]||'').trim();
      const digits = rawDate.replace(/\D/g,'');
      if (!/^\d{8}$/.test(digits)) continue;
      out.push({
        id: li+1,
        date: digits,
        month: parseInt(digits.substring(4,6),10),
        title: (cols[1]||'').trim(),
        category: (cols[2]||'').trim(),
        description: (cols[3]||'').trim(),
        image_filename: `img_${digits}.png`,
      });
    }
    return out;
  }

  async function headOK(url) {
    try {
      const r = await fetch(url + bust(), { cache: 'no-store' });
      return { ok: r.ok, status: r.status };
    } catch (e) {
      return { ok: false, status: 0, error: e.message };
    }
  }

  function merge(jsonArr=[], csvArr=[]) {
    const map = new Map();
    for (const w of jsonArr || []) if (w?.date) map.set(String(w.date), { ...w, category: norm(w.category) });
    let overwrites = 0;
    for (const w of csvArr || []) if (w?.date) {
      const k = String(w.date);
      if (map.has(k)) overwrites++;
      map.set(k, { ...w, category: norm(w.category) });
    }
    const merged = Array.from(map.values()).sort((a,b)=>Number(b.date)-Number(a.date));
    return { merged, overwrites };
  }

  function ensureStyle() {
    if (document.getElementById('orochi-selftest-style')) return;
    const css = `
      .orochi-selftest-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998;}
      .orochi-selftest-modal{position:fixed;inset:auto;left:50%;top:10%;transform:translateX(-50%);width:min(720px,92vw);background:#1e1930;color:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.35);z-index:9999;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
      .orochi-selftest-header{padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.12);display:flex;align-items:center;gap:12px}
      .orochi-selftest-title{font-size:18px;font-weight:700}
      .orochi-selftest-body{padding:16px 20px;max-height:60vh;overflow:auto}
      .orochi-selftest-list{list-style:none;padding:0;margin:0;display:grid;gap:10px}
      .orochi-selftest-item{padding:12px;border-radius:12px;background:rgba(255,255,255,.06);display:flex;gap:12px;align-items:flex-start}
      .orochi-selftest-badge{min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700}
      .ok{background:#12b886;color:#0c2f23}
      .ng{background:#ff6b6b;color:#3d0a0a}
      .orochi-selftest-footer{padding:12px 20px;border-top:1px solid rgba(255,255,255,.12);display:flex;justify-content:flex-end;gap:8px}
      .orochi-selftest-btn{background:#372e51;border:none;color:#fff;border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer}
      .orochi-selftest-btn:hover{filter:brightness(1.05)}
      .orochi-selftest-summary{font-size:16px;font-weight:700}
    `;
    const style = document.createElement('style');
    style.id = 'orochi-selftest-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function show(results) {
    ensureStyle();
    const backdrop = document.createElement('div');
    backdrop.className = 'orochi-selftest-backdrop';
    const modal = document.createElement('div');
    modal.className = 'orochi-selftest-modal';

    const okAll = results.items.every(i => i.ok);
    const summary = okAll ? '🎉 ALL PASS' : '⚠️ 要確認があります';

    modal.innerHTML = `
      <div class="orochi-selftest-header">
        <div class="orochi-selftest-title">開運オロチ 自己診断</div>
        <div class="orochi-selftest-summary">${summary}</div>
      </div>
      <div class="orochi-selftest-body">
        <ul class="orochi-selftest-list">
          ${results.items.map(i => `
            <li class="orochi-selftest-item">
              <div class="orochi-selftest-badge ${i.ok?'ok':'ng'}">${i.ok?'✓':'!'}</div>
              <div>
                <div><b>${i.label}</b></div>
                <div style="opacity:.85">${i.detail || ''}</div>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
      <div class="orochi-selftest-footer">
        <button class="orochi-selftest-btn" data-close>閉じる (Esc)</button>
      </div>
    `;
    function close(){ backdrop.remove(); modal.remove(); }
    backdrop.addEventListener('click', close);
    modal.querySelector('[data-close]').addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); }, { once:true });

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
  }

  async function run() {
    const results = { items: [] };

    // 1) favicon
    const rIco = await headOK('favicon.ico');
    results.items.push({ ok: rIco.ok, label: 'favicon.ico', detail:`status=${rIco.status}` });

    // 2) works.json
    let json = [];
    let rJson = await headOK('オロチポートフォリオ文字データ/works.json');
    if (rJson.ok) {
      try {
        const res = await fetch('オロチポートフォリオ文字データ/works.json' + bust(), { cache:'no-store' });
        json = await res.json();
      } catch {}
    }
    results.items.push({ ok: rJson.ok, label: 'works.json 取得', detail:`count=${json.length} status=${rJson.status}` });

    // 3) CSV
    let csv = [];
    let rCsv = await headOK('オロチポートフォリオ文字データ/オロチポートフォリオ表.csv');
    if (rCsv.ok) {
      try {
        const res = await fetch('オロチポートフォリオ文字データ/オロチポートフォリオ表.csv' + bust(), { cache:'no-store' });
        csv = parseCSV(await res.text());
      } catch {}
    }
    results.items.push({ ok: rCsv.ok, label: 'CSV 取得/解析', detail:`count=${csv.length} status=${rCsv.status}` });

    // 4) マージ（CSV優先）
    const { merged, overwrites } = merge(json, csv);
    results.items.push({ ok: merged.length > 0, label: 'マージ結果', detail:`merged=${merged.length} csvOverwrite=${overwrites}` });

    // 5) months
    const months = [...new Set(merged.map(w=>w.month))].sort((a,b)=>a-b);
    results.items.push({ ok: months.length > 0, label: '月フィルタ', detail:`months=[${months.join(',')}]` });

    // 6) カテゴリ正規化
    const stillVideo = merged.filter(w => w.category === '動画').length;
    results.items.push({ ok: stillVideo === 0, label: 'カテゴリ正規化（動画→AI）', detail:`残存動画=${stillVideo}` });

    // 7) 直近3件の画像存在
    let imgOK = true, details = [];
    for (const w of merged.slice(0,3)) {
      const p = `assets/gallery_${w.date.slice(0,6)}/${w.image_filename}`;
      const r = await headOK(p);
      imgOK = imgOK && r.ok;
      details.push(`${p} ${r.status}`);
    }
    results.items.push({ ok: imgOK, label: '最新画像 3 件', detail: details.join(' | ') });

    show(results);
    return results;
  }

  // Shortcut
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'd' && e.shiftKey) {
      run();
    }
  });

  return { run };
})();

/* ==== Lightbox (image + video) ========================================== */
(function () {
  const GRIDS = ['#digest-gallery-grid', '#ai-digest-grid', '#video-digest-grid', '#full-gallery-grid'];
  let overlay, imgEl, videoEl, captionEl, currentList = [], currentIndex = -1;

  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'orochi-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="orochi-lightbox__content" aria-live="polite">
        <button class="orochi-lightbox__close" aria-label="閉じる">✕</button>
        <button class="orochi-lightbox__prev" aria-label="前へ">‹</button>
        <img class="orochi-lightbox__img" alt="">
        <video class="orochi-lightbox__video" style="display:none" playsinline controls></video>
        <button class="orochi-lightbox__next" aria-label="次へ">›</button>
        <div class="orochi-lightbox__caption"></div>
      </div>`;
    document.body.appendChild(overlay);
    imgEl     = overlay.querySelector('.orochi-lightbox__img');
    videoEl   = overlay.querySelector('.orochi-lightbox__video');
    captionEl = overlay.querySelector('.orochi-lightbox__caption');

    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('.orochi-lightbox__close').addEventListener('click', close);
    overlay.querySelector('.orochi-lightbox__prev').addEventListener('click', () => step(-1));
    overlay.querySelector('.orochi-lightbox__next').addEventListener('click', () => step(1));

    document.addEventListener('keydown', e => {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  function collect(container) { return Array.from(container.querySelectorAll('img.card-image')); }

  function captionFor(img) {
    const card  = img.closest('.gallery-card');
    const title = card?.querySelector('.card-title')?.textContent?.trim() || img.alt || '';
    const desc  = card?.querySelector('.card-description')?.textContent?.trim() || '';
    return [title, desc].filter(Boolean).join(' — ');
  }

  function openFrom(img, list) {
    ensureOverlay();
    currentList = list;
    currentIndex = Math.max(0, currentList.indexOf(img));
    show();
    document.body.classList.add('modal-open');
    overlay.classList.add('open');
  }

  function setVideoSrcWithFallback(lower, upper) {
    videoEl.pause();
    videoEl.src = lower;
    let triedUpper = false;
    videoEl.onerror = () => {
      if (upper && !triedUpper) {
        triedUpper = true;
        videoEl.src = upper;
        videoEl.play().catch(()=>{});
      }
    };
    videoEl.currentTime = 0;
    videoEl.play().catch(()=>{});
  }

  function show() {
    const cur = currentList[currentIndex];
    if (!cur) return close();

    const lower   = cur.getAttribute('data-video');      // .mp4
    const upper   = cur.getAttribute('data-video-alt');  // .MP4
    const caption = captionFor(cur);
    captionEl.textContent = caption;

    if (lower) {
      // 動画モード
      imgEl.style.display = 'none';
      videoEl.style.display = '';
      setVideoSrcWithFallback(lower, upper);
    } else {
      // 画像モード
      videoEl.pause(); videoEl.removeAttribute('src'); videoEl.style.display = 'none';
      imgEl.style.display = '';
      imgEl.src = cur.currentSrc || cur.src;
      imgEl.alt = cur.alt || '';
    }

    overlay.querySelector('.orochi-lightbox__prev').disabled = (currentIndex <= 0);
    overlay.querySelector('.orochi-lightbox__next').disabled = (currentIndex >= currentList.length - 1);
  }

  function step(d) {
    const n = currentIndex + d;
    if (n < 0 || n >= currentList.length) return;
    currentIndex = n;
    show();
  }

  function close() {
    overlay.classList.remove('open');
    document.body.classList.remove('modal-open');
    videoEl.pause(); videoEl.removeAttribute('src');
    imgEl.removeAttribute('src');
    captionEl.textContent = '';
    currentList = []; currentIndex = -1;
  }

  function onGridClick(e) {
    const img = e.target.closest('img.card-image');
    if (!img) return;
    openFrom(img, collect(e.currentTarget));
  }

  // すべてのグリッドに委任（重複バインド防止フラグ付き）
  (function init(){
    const bind = sel => { const g = document.querySelector(sel); if (g && !g.__lb) { g.addEventListener('click', onGridClick); g.__lb = true; } };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => GRIDS.forEach(bind));
    } else {
      GRIDS.forEach(bind);
    }
  })();
})();

function markCurrentNav(){
  const bodyId = document.body.id || "";
  // サブメニューのアンカー
  const linkIllust = document.querySelector('.subnav a[href$="gallery.html"]');
  const linkAI     = document.querySelector('.subnav a[href$="toki-sude-ni-orochi.html"]');
  const linkVideo  = document.querySelector('.subnav a[href$="video.html"]');
  const parentItem = document.querySelector('.global-nav li.has-sub > a');

  // すべての current をリセット
  [linkIllust, linkAI, linkVideo].forEach(a => {
    if (!a) return;
    a.classList.remove('is-current');
    a.removeAttribute('aria-current');
  });
  if (parentItem) parentItem.parentElement.classList.remove('is-current');

  // body id に応じて付与
  let target = null;
  if (bodyId === 'page-gallery')        target = linkIllust;
  else if (bodyId === 'page-ai-gallery')    target = linkAI;
  else if (bodyId === 'page-video-gallery') target = linkVideo;

  if (target) {
    target.classList.add('is-current');
    target.setAttribute('aria-current', 'page');  // アクセシビリティ対応
    if (parentItem) parentItem.parentElement.classList.add('is-current');
  }
}

/* ==== Header auto hide on hero section (TOP only) ==== */
function setupHeaderAutoHide(){
  const header = document.querySelector('.global-header');
  const hero   = document.querySelector('#key-visual, .hero-section');
  if (!header || !hero) return; // ヒーローが無い下層ページは何もしない

  // ハンバーガー展開中は強制表示
  const btn = document.querySelector('.hamburger-menu');
  const nav = document.querySelector('.global-nav');
  if (btn && nav){
    btn.addEventListener('click', () => {
      const open = nav.classList.contains('active');
      header.classList.toggle('force-show', open);
      if (open) header.classList.remove('is-hidden');
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768){
        header.classList.remove('force-show');
      }
    });
  }

  // ヒーローが画面にある間はヘッダーを隠す
  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      // 20% 以上可視 → 隠す / それ未満 → 表示
      if (!header.classList.contains('force-show')){
        header.classList.toggle('is-hidden', e.isIntersecting && e.intersectionRatio >= 0.2);
      }
    },
    { root: null, threshold: [0, 0.2, 1] }
  );
  io.observe(hero);
}

/* === Splash fade logic =============================================== */
(function splashFade(){
  const splash = document.getElementById('splash');
  if(!splash) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      splash.classList.add('fade-out');          // 0.7s 待ってからフェード開始
      setTimeout(() => splash.remove(), 800);    // フェード 0.8s 後に DOM から削除
    }, 700);
  });
})();