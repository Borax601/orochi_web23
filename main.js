window.addEventListener('DOMContentLoaded', () => {
  // --- スプラッシュ画面のインタラクティブ・アニメーション制御 ---
  const splashScreen = document.getElementById('splash-screen');
  const mainContent = document.getElementById('main-content');
  const orochiA = document.getElementById('orochi-pose-a');
  const orochiB = document.getElementById('orochi-pose-b');
  const orochiC = document.getElementById('orochi-pose-c');
  const orochiD = document.getElementById('orochi-pose-d');

  if (orochiA && orochiB) {
    orochiA.classList.add('is-looping');
    orochiB.classList.add('is-looping');
  }

  if (splashScreen && mainContent && orochiC && orochiD) {
    splashScreen.addEventListener('click', () => {
      orochiA.classList.remove('is-looping');
      orochiB.classList.remove('is-looping');
      orochiA.style.opacity = '0';
      orochiB.style.opacity = '0';
      
      // ポーズCを表示
      orochiC.classList.add('is-clicked');

      // 0.5秒後にCを消してDを表示
      setTimeout(() => {
        orochiC.classList.remove('is-clicked');
        orochiD.classList.add('is-clicked');

        // さらに0.5秒後に画面遷移
        setTimeout(() => {
          splashScreen.style.opacity = '0';
          splashScreen.style.visibility = 'hidden';
          mainContent.style.display = 'block';
          setTimeout(() => { mainContent.style.opacity = '1'; }, 50);
        }, 500);
      }, 500);

    }, { once: true });
  }

  // --- いいね機能 ---
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', function(event) {
      event.stopPropagation(); // クリックイベントが親要素に伝播しないように
      const liked = this.getAttribute('data-liked') === 'true';
      const countSpan = this.querySelector('.like-count');
      let count = parseInt(countSpan.textContent, 10);

      if (!liked) {
        this.innerHTML = '❤️ <span class="like-count">' + (count + 1) + '</span>';
        this.setAttribute('data-liked', 'true');
      } else {
        this.innerHTML = '♡ <span class="like-count">' + (count - 1) + '</span>';
        this.setAttribute('data-liked', 'false');
      }
    });
  });

  // --- おみくじ機能 ---
  const omikujiList = [
    '【大吉】最高の運気！このオロチが万事うまくいくよう導いてくれるでしょう！',
    '【中吉】良い兆候。小さな幸せが積み重なる予感。油断は禁物です。',
    '【小吉】ささやかな幸運。なくし物が見つかるかも？',
    '【吉】平穏な一日。このオロチを眺めて心を落ち着かせましょう。',
    '【末吉】今は雌伏の時。しかし、未来には明るい兆しが見えます。',
    '【凶】少し注意が必要な日。でも、このオロチがお守り代わりになってくれるはず！'
  ];
  const modalOverlay = document.getElementById('modal-overlay');
  const omikujiModal = document.getElementById('omikuji-modal');
  const modalImage = document.getElementById('modal-image');
  const omikujiResult = document.getElementById('omikuji-result');
  const closeModalBtn = document.querySelector('.close-modal');

  document.querySelectorAll('.omikuji-btn').forEach(btn => {
    btn.addEventListener('click', function(event) {
      event.stopPropagation(); // クリックイベントが親要素に伝播しないように
      const cardImage = this.closest('.gallery-card').querySelector('img').src;
      modalImage.src = cardImage;
      const result = omikujiList[Math.floor(Math.random() * omikujiList.length)];
      omikujiResult.textContent = result;
      modalOverlay.style.display = 'block';
      omikujiModal.style.display = 'block';
    });
  });

  function closeModal() {
    modalOverlay.style.display = 'none';
    omikujiModal.style.display = 'none';
  }
  
  if(closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  if(modalOverlay) {
    modalOverlay.addEventListener('click', closeModal);
  }
});