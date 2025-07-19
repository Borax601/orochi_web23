#!/bin/bash

# Step 1: Navigate to project root
echo "🟢 step1: cd to project root"
cd ~/code/開運オロチweb || { echo "❌ Failed to change directory"; exit 1; }

# Step 2: Create safety commit
echo "🟢 step2: create safety commit"
git add -A
git commit -m "WIP: backup before folder rename" || true

# Step 3: Rename folder
echo "🟢 step3: rename folder"
if [ -d "オロチポートフォリオ文字データ" ]; then
    mv "オロチポートフォリオ文字データ" data
else
    echo "❌ フォルダが見つかりません"; exit 1
fi

# Step 4: Update JSON path in main.js
echo "🟢 step4: update jsonPath in main.js"
sed -i '' "s|オロチポートフォリオ文字データ/works.json|data/works.json|" main.js

# Step 5: Check for missed replacements
echo "🟢 step5: grep for old path (should be empty)"
if grep -R "オロチポートフォリオ文字データ" . ; then
    echo "❌ 置換漏れがあります"; exit 1
fi

# Step 6: Start local server for 5 seconds
echo "🟢 step6: start local server (5s quick test)"
python3 -m http.server 9000 &
SERVER_PID=$!
sleep 5
kill $SERVER_PID

# Step 7: Commit & push changes
echo "🟢 step7: git commit & push"
git add -A
git commit -m "Rename JSON folder to data & update path"
git push origin main

echo "🎉 rename 完了 —— https://<username>.github.io/orochi_web01/ で確認してね"
