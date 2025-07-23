const fs = require('fs');
const path = require('path');

// --- ファイルパスの定義 ---
const projectRoot = __dirname;
const csvFilePath = path.join(projectRoot, 'オロチポートフォリオ文字データ', 'オロチポートフォリオ表.csv');
const jsonFilePath = path.join(projectRoot, 'オロチポートフォリオ文字データ', 'works.json');

// --- メイン処理 ---
try {
  // 1. CSVファイルを読み込む
  const csvData = fs.readFileSync(csvFilePath, 'utf8');

  // 2. CSVを1行ごとの配列に分割し、JSONオブジェクトの配列に変換
  const lines = csvData.trim().split('\n');
  const header = lines.shift(); // ヘッダー行を読み飛ばす
  
  const works = lines.map((line, index) => {
    const columns = line.split(',');
    const dateStr = columns[0];

    return {
      id: index + 1,
      date: dateStr,
      month: parseInt(dateStr.substring(4, 6), 10),
      title: columns[1],
      category: columns[2], // カテゴリー列を追加
      description: columns[3].replace(/"/g, ''), // 説明文のダブルクォートを削除
      image_filename: `img_${dateStr}.png`
    };
  });

  // 3. JSONファイルとして書き出す
  fs.writeFileSync(jsonFilePath, JSON.stringify(works, null, 2), 'utf8');

  console.log(`✅ Success: ${jsonFilePath} が正常に更新されました。`);

} catch (error) {
  console.error(`❌ Error: 処理に失敗しました。`, error);
  if (error.code === 'ENOENT') {
    console.error(`  [原因] ファイルが見つかりません: ${error.path}`);
    console.error(`  [確認] プロジェクトのルートディレクトリ（開運オロチweb/）でこのコマンドを実行していますか？`);
  }
}
