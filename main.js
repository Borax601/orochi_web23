// ページの全てのコンテンツが読み込まれてから実行する
document.addEventListener('DOMContentLoaded', function() {
  setupHeroAnimation();
  initializeApp();
});

// ヒーローアニメーションをセットアップする関数
function setupHeroAnimation() {
  const frames = [
    document.getElementById('orochi-pose-a'),
    document.getElementById('orochi-pose-b'),
    document.getElementById('orochi-pose-c'),
    document.getElementById('orochi-pose-d')
  ];
  const finale = document.getElementById('orochi-pose-e');

  let idx = 0;
  const frameMs   = 1000;  // 1 second per frame
  const pauseMs   = 500;  // d のあと 0.5 秒タメ
  const loopDelay = 1200; // フェード完了後、次ループまでの待機

  const hideAll = () => {
    frames.forEach(f => {
      if (f) {
        f.style.opacity = 0;
      }
    });
    if (finale) {
      finale.style.opacity = 0;
    }
  };

  const playLoop = () => {
    hideAll();
    idx = 0;

    /* 1️⃣ コマ送り */
    const frameTimer = setInterval(() => {
      hideAll();
      frames[idx].style.opacity = 1;
      frames[idx].style.zIndex = 2; // Ensure it's on top
      idx++;

      if (idx === frames.length) {
        clearInterval(frameTimer);

        /* 2️⃣ d → 少し溜め → フェードアウト */
        setTimeout(() => {
          hideAll();
          finale.style.opacity = 1;
          finale.classList.add('fade-out');

          /* 3️⃣ 次ループの準備 */
          setTimeout(() => {
            finale.classList.remove('fade-out');
            playLoop();               // 再帰で次周へ
          }, loopDelay);

        }, frameMs); // Changed pauseMs to frameMs
      }
    }, frameMs);
  };

  playLoop();
}

// アプリケーションを初期化するメインの関数
async function initializeApp() {
  try {
    const jsonPath = 'オロチポートフォリオ文字データ/works.json';
    const worksData = await fetchWorksData(jsonPath);

    // ★「イラスト」カテゴリーのみにフィルタリング
    const illustrationWorks = worksData.filter(work => work.category === 'イラスト');

    if (document.getElementById('digest-gallery-grid')) {
      renderGallery(illustrationWorks.slice(0, 6), '#digest-gallery-grid');
    }
    if (document.getElementById('full-gallery-grid')) {
      renderGallery(illustrationWorks, '#full-gallery-grid');
      setupFilter(illustrationWorks);
    }
    setupLikeButtons();
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

// JSONファイルを読み込む関数
async function fetchWorksData(jsonPath) {
  const response = await fetch(jsonPath);
  if (!response.ok) {
    throw new Error(`JSONファイルの読み込みに失敗: ${jsonPath}`);
  }
  return response.json();
}

// 作品データを基に、HTMLを組み立ててページに表示する関数
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
      </div>
    `;
  }).join('');
  container.innerHTML = galleryHtml;
}

// 「いいね」ボタンの機能をセットアップする関数
function setupLikeButtons() {
  const likeButtons = document.querySelectorAll('.like-btn');
  likeButtons.forEach(button => {
    const card = button.closest('.gallery-card');
    if (!card) return;
    const imageElement = card.querySelector('.card-image');
    if (!imageElement) return;
    
    const imageSrc = imageElement.src;
    const likeId = 'like-' + imageSrc;
    
    if (button.dataset.listenerAttached) return;

    const savedLikes = localStorage.getItem(likeId);
    if (savedLikes) {
      button.innerText = '♥ ' + savedLikes;
      button.classList.add('is-liked');
    }

    button.addEventListener('click', function() {
      if (button.classList.contains('is-liked')) return;
      button.classList.add('is-liked');
      
      let currentLikes = parseInt(button.innerText.replace('♡ ', '').replace('♥ ', ''));
      let newLikes = currentLikes + 1;
      
      button.innerText = '♥ ' + newLikes;
      localStorage.setItem(likeId, newLikes);

      button.classList.add('is-popping');
      setTimeout(() => button.classList.remove('is-popping'), 300);
    });
    
    button.dataset.listenerAttached = 'true';
  });
}

// 月別フィルター機能をセットアップする関数
function setupFilter(works) {
  const filterBar = document.querySelector('.filter-bar');
  if (!filterBar) return;

  // 1. データからユニークな月のリストを作成 (例: [2, 3, 6, 7])
  const uniqueMonths = [...new Set(works.map(work => work.month))].sort((a, b) => a - b);

  // 2. 月別ボタンのHTMLを生成
  const monthButtonsHtml = uniqueMonths.map(month => `
    <button class="filter-btn" data-month="${month}">${month}月</button>
  `).join('');

  // 3. 「全て表示」ボタンと月別ボタンをコンテナに挿入
  filterBar.innerHTML = `
    <button class="filter-btn is-active" data-month="all">全て表示</button>
    ${monthButtonsHtml}
  `;

  // 4. 各ボタンにクリックイベントを設定
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetMonth = this.dataset.month;
      
      filterButtons.forEach(btn => btn.classList.remove('is-active'));
      this.classList.add('is-active');

      const filteredWorks = (targetMonth === 'all') 
        ? works 
        : works.filter(work => String(work.month) === targetMonth);
      
      renderGallery(filteredWorks, '#full-gallery-grid');
      setupLikeButtons(); 
    });
  });
}