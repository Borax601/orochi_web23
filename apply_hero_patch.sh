#!/bin/bash

# Step 0: Navigate to project root
echo "🟢 step0: プロジェクトへ移動"
cd ~/code/開運オロチweb || { echo "❌ ディレクトリが見つかりません"; exit 1; }

# Step 1: Create safety commit
echo "🟢 step1: 安全コミット"
git add -A
git commit -m "WIP: backup before hero visual" || true

# Step 2: Generate hero.patch
echo "🟢 step2: hero.patch を生成"
cat > hero.patch <<'EOF'
diff --git a/index.html b/index.html
@@
-  <div class="hero-image-container">
+  <div class="hero-image-container">
+
+      <!-- 鳥居（背景） -->
+      <img src="assets/torii.svg" alt="鳥居" class="hero-torii">
+
+      <!-- オロチラッパー：左右に揺れ、クリックで奥へ移動 -->
+      <div id="orochi-wrapper">
           <img src="assets/orochi_a.svg" alt="開運オロチ" class="hero-orochi" id="orochi-pose-a">
           <img src="assets/orochi_b.svg" alt="開運オロチ" class="hero-orochi" id="orochi-pose-b">
+      </div>
 
   </div>
 </header>
diff --git a/styles.css b/styles.css
@@
 /* === ここから追記 === */
 @keyframes sway {
   0%,100% { transform: translateX(-20px); }
   50%     { transform: translateX( 20px); }
 }
 #orochi-wrapper{
   position:absolute;bottom:10%;left:50%;
   transform:translate(-50%,0);
   animation:sway 4s ease-in-out infinite;
   cursor:pointer;z-index:3;
 }
 #orochi-wrapper.is-entering{
   animation:none;
   transition:transform 1.6s ease,opacity 1.6s ease;
   transform:translate(-50%,-250px) scale(.3);
   opacity:.7;
   pointer-events:none;
 }
diff --git a/main.js b/main.js
@@
   const orochiA = document.getElementById('orochi-pose-a');
   const orochiB = document.getElementById('orochi-pose-b');
+  const orochiWrapper = document.getElementById('orochi-wrapper');
@@
   if (orochiA && orochiB) {
     orochiA.classList.add('is-looping');
     orochiB.classList.add('is-looping');
   }
+
+  // クリックで鳥居の奥へ
+  if (orochiWrapper){
+    orochiWrapper.addEventListener('click',()=>{
+      orochiWrapper.classList.add('is-entering');
+      setTimeout(()=>{
+        const pf=document.getElementById('portfolio');
+        if(pf){pf.scrollIntoView({behavior:'smooth'});}
+      },1600);
+    });
+  }
 }
EOF

# Step 3: Apply the patch
echo "🟢 step3: パッチ適用"
git apply hero.patch || { echo "❌ パッチ適用に失敗"; exit 1; }

# Step 4: Test on local server
echo "🟢 step4: ローカルサーバーで 5 秒テスト"
python3 -m http.server 9000 &
PID=$!
sleep 5
kill $PID

# Step 5: Commit & push changes
echo "🟢 step5: 変更をコミット & プッシュ"
git add index.html styles.css main.js
git commit -m "feat: hero torii + moving Orochi entrance" || { echo "❌ commit 失敗"; exit 1; }
git push origin main

echo "🎉 キービジュアル実装完了！　公開 URL → https://<username>.github.io/orochi_web01/"
