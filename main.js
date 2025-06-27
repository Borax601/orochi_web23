window.addEventListener('DOMContentLoaded', () => {
  // いいね機能
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const liked = this.getAttribute('data-liked') === 'true';
      const countSpan = this.querySelector('.like-count');
      let count = parseInt(countSpan.textContent, 10);

      if (!liked) {
        // いいねする
        this.innerHTML = '❤️ <span class="like-count">' + (count + 1) + '</span>';
        this.setAttribute('data-liked', 'true');
      } else {
        // いいね解除
        this.innerHTML = '♡ <span class="like-count">' + (count - 1) + '</span>';
        this.setAttribute('data-liked', 'false');
      }
    });
  });

  // おみくじ機能
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
    btn.addEventListener('click', function() {
      // 画像をセット
      const cardImage = this.closest('.gallery-card').querySelector('img').src;
      modalImage.src = cardImage;
      
      // 結果をセット
      const result = omikujiList[Math.floor(Math.random() * omikujiList.length)];
      omikujiResult.textContent = result;
      
      // モーダルを表示
      modalOverlay.style.display = 'block';
      omikujiModal.style.display = 'block';
    });
  });

  // モーダルを閉じる機能
  function closeModal() {
    modalOverlay.style.display = 'none';
    omikujiModal.style.display = 'none';
  }
  
  closeModalBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);
});
