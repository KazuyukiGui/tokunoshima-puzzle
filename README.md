# 徳之島集落パズル

生まれ故郷・徳之島の集落名を、デフォルメ地図の正しい場所にドラッグ&ドロップで置いていくパズルゲームです。

## 遊び方

1. ステージ（伊仙町・天城町・徳之島町・全島）を選ぶ
2. 画面下に並んだ集落名カードを、地図上の○の位置へドラッグ&ドロップ
3. 正しい場所なら固定され、集落名が地図に刻まれます
4. 全部置けたらクリア

スマホのタッチ操作・PCのマウス操作どちらでも遊べます。

## 集落データについて

- 集落の一覧は各町の公式サイト等に基づいています
  - [徳之島町「集落別人口」](https://www.tokunoshima-town.org/kikakuka/chose/toke/jinko.html)（公式30集落）
  - [伊仙町「集落紹介」](https://town.isen.kagoshima.jp/mirai/syuurakujouhou.html)（公式31集落を20地域に統合）
  - [Wikipedia「天城町」](https://ja.wikipedia.org/wiki/%E5%A4%A9%E5%9F%8E%E7%94%BA)（11大字）
- 亀津市街の南区・中区・北区・東区は「亀津」に、大原1・大原2は「大原」に統合しています（徳之島町は計26カード）
- 母間・花徳・山は大字名のためカードにはありません（それぞれ池間/反川/大当/花時名、前川/新村/上花徳、港川/内千川/山里/畦が該当集落です）
- 集落の位置は実際の経緯度（OSM placeノード・国土地理院AddressSearch・周辺施設）から投影していますが、
  近接集落はゲーム操作性のため最小間隔まで押し広げています。**厳密な測地位置ではありません**
- 一部の小集落（`approx: true`）は公的座標データが無いため周辺情報からの推定です

## 地図データの出典

- 島の輪郭・町境・集落位置の一部: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors（ODbL）
- 集落位置のジオコーディング: [国土地理院 住所検索API](https://msearch.gsi.go.jp/address-search/AddressSearch)

## 技術

素の HTML / CSS / JavaScript のみ。ビルドなし・外部依存なし。

開発用: URLに `?dev=1` を付けると、地図クリックでviewBox座標がコンソールに出ます（座標調整用）。

## アクセス解析

[GoatCounter](https://www.goatcounter.com/) を使用（`count.js` はISCライセンスで同梱・セルフホスト）。
サイトコード: `tokunoshima-puzzle` / ダッシュボード: https://tokunoshima-puzzle.goatcounter.com/

## ライセンス

MIT（同梱の `count.js` はISC、地図データは © OpenStreetMap contributors / ODbL）
