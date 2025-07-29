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
    map.set(String(w.date), { ...w });   // まず JSON
  }
  for (const w of csvArr || []) {
    if (!w || !w.date) continue;
    map.set(String(w.date), { ...w });   // CSV で上書き（CSV優先）
  }
  return Array.from(map.values()).sort((a, b) => Number(b.date) - Number(a.date));
}

// ===== アプリ初期化 =====
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
  } else if (document.getElementById('digest-gallery-grid')) {
    worksToDisplay = worksData
      .filter(w => w.category === 'イラスト' && w.date)
      .sort((a, b) => Number(b.date) - Number(a.date));
  }

  if (document.getElementById('full-gallery-grid')) {
    renderGallery(worksToDisplay, '#full-gallery-grid');
    setupFilter(worksToDisplay);
  }
  if (document.getElementById('digest-gallery-grid')) {
    renderGallery(worksToDisplay.slice(0, 10), '#digest-gallery-grid');
  }

  setupLikeButtons();
  setupHamburgerMenu();
}

// ===== 描画・UI 関数（既存ロジックを流用） =====
function renderGallery(works, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const galleryHtml = works.map(work => {
    const yearMonth = String(work.date).substring(0, 6);
    const imagePath = `assets/gallery_${yearMonth}/${work.image_filename}`;
    return `
      <div class="gallery-card" data-month="${work.month}">
        <img src="${imagePath}" alt="${work.title}" class="card-image" loading="lazy">
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
  if (!btn || !nav) return;
  btn.addEventListener('click', function() {
    this.classList.toggle('active');
    nav.classList.toggle('active');
  });
}