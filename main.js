// ページの全てのコンテンツが読み込まれてから実行する
document.addEventListener('DOMContentLoaded', function() {
  setupHeroAnimation();
  initializeApp();
});

// ヒーローアニメーションをセットアップする関数
function setupHeroAnimation() {
  const orochiA = document.getElementById('orochi-pose-a');
  const orochiB = document.getElementById('orochi-pose-b');
  if (orochiA && orochiB) {
    orochiA.classList.add('is-looping');
    orochiB.classList.add('is-looping');
  }
}

// アプリケーションを初期化するメインの関数
async function initializeApp() {
  try {
    const jsonPath = 'オロチポートフォリオ文字データ/works.json';
    const worksData = await fetchWorksData(jsonPath);

    if (document.getElementById('digest-gallery-grid')) {
      renderGallery(worksData.slice(0, 6), '#digest-gallery-grid');
    }
    if (document.getElementById('full-gallery-grid')) {
      renderGallery(worksData, '#full-gallery-grid');
      setupFilter(worksData);
    }
    setupLikeButtons();
  } catch (error) {
    console.error('初期化エラー:', error);
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
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetMonth = String(button.dataset.month);
      
      filterButtons.forEach(btn => btn.classList.remove('is-active'));
      button.classList.add('is-active');

      const filteredWorks = (targetMonth === 'all') 
        ? works 
        : works.filter(work => String(work.month) === targetMonth);
      
      renderGallery(filteredWorks, '#full-gallery-grid');
      setupLikeButtons(); 
    });
  });
}