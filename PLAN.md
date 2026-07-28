# 徳之島集落パズル 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 徳之島のデフォルメSVG地図上に集落名カードをドラッグ&ドロップで配置するパズルゲームを静的サイトとして構築し、GitHub Pagesで公開する。

**Architecture:** ビルドなしの完全静的構成。`index.html` がインラインSVG地図とレイアウトを持ち、`data.js` が集落マスタ（58件・正規化座標）、`game.js` がステージ管理とPointer EventsによるD&Dを担当。テストは手動（SPEC.md「テスト・検証」承認済みのため自動テストなし。各タスク末尾にブラウザ確認手順を置く）。

**Tech Stack:** HTML / CSS / Vanilla JS / SVG。依存ゼロ。確認用に `python3 -m http.server`。

**注意（座標データ）:** data.js の座標は地理知識からの暫定値。Task 5 の devモード（`?dev=1` でクリック座標をコンソール出力）で地理院地図と見比べながら調整して確定する。

---

### Task 1: プロジェクト骨格（index.html + style.css）

**Files:**
- Create: `projects/tokunoshima-puzzle/index.html`
- Create: `projects/tokunoshima-puzzle/style.css`

- [ ] **Step 1: index.html を作成**（SVG輪郭・タブ・トレイ・クリアオーバーレイの器。スロットとカードはJSが生成）
- [ ] **Step 2: style.css を作成**（モバイルファースト。地図は max-height 60vh、トレイは flex-wrap）
- [ ] **Step 3: 確認** — `python3 -m http.server 8123` を起動し `http://100.107.1.8:8123/` で骨格表示を確認（島の輪郭が出る・コンソールエラーは data.js/game.js 未作成分の404のみ）
- [ ] **Step 4: Commit** — `git add index.html style.css && git commit -m "feat: 画面骨格とデフォルメ地図SVG"`

### Task 2: 集落データ（data.js）

**Files:**
- Create: `projects/tokunoshima-puzzle/data.js`

- [ ] **Step 1: data.js を作成** — SPEC.mdの58集落（徳之島町27・天城町11・伊仙町20）を `{id, name, kana, town, x, y}` で定義。TOWNS定数（isen/amagi/tokunoshima/all の表示名）も定義
- [ ] **Step 2: 検証** — `node -e` で件数チェック（town別 20/11/27、計58、id重複なし）を実行し期待値一致を確認
- [ ] **Step 3: Commit** — `git commit -m "feat: 集落マスタデータ58件（暫定座標）"`

### Task 3: ステージ選択とスロット・カード描画（game.js 前半）

**Files:**
- Create: `projects/tokunoshima-puzzle/game.js`

- [ ] **Step 1: 描画ロジックを実装** — タブ生成（伊仙町→天城町→徳之島町→全島、初期=伊仙町）／ステージ切替で `#slots` に○スロット、`#tray` にシャッフル済みカードを生成／残り枚数表示
- [ ] **Step 2: 確認** — ブラウザで4タブ切替。スロット数・カード数がステージ定義と一致、シャッフルされている
- [ ] **Step 3: Commit** — `git commit -m "feat: ステージ選択とスロット・カード描画"`

### Task 4: ドラッグ&ドロップと正誤判定（game.js 後半）

**Files:**
- Modify: `projects/tokunoshima-puzzle/game.js`

- [ ] **Step 1: Pointer EventsでD&D実装** — pointerdownでカードを浮かせ、pointermoveで追従、pointerupで最寄りスロット（画面距離しきい値内）と照合。正解=固定・塗り・集落名表示、不正解=トレイへ戻す
- [ ] **Step 2: クリア判定** — 全カード配置で `#clear-overlay` 表示（ステージ名＋「クリア」＋もう一回ボタン）
- [ ] **Step 3: 確認** — スマホ実機（タッチ）とPC（マウス）で伊仙町ステージをクリアまで通しプレイ
- [ ] **Step 4: Commit** — `git commit -m "feat: D&Dと正誤判定・クリア演出"`

### Task 5: 座標調整・README・公開

**Files:**
- Modify: `projects/tokunoshima-puzzle/data.js`（座標調整）
- Modify: `projects/tokunoshima-puzzle/game.js`（devモード追加）
- Create: `projects/tokunoshima-puzzle/README.md`

- [ ] **Step 1: devモード実装** — `?dev=1` で地図クリック時に正規化座標をコンソール出力
- [ ] **Step 2: 座標調整** — 地理院地図で各集落の実位置を確認しながら data.js の x/y を修正（相対位置関係を合わせる）。集落名・よみをSPEC出典と再照合
- [ ] **Step 3: README.md 作成** — ゲーム説明・出典・「位置はデフォルメ地図上の近似」の断り書き
- [ ] **Step 4: Commit** — `git commit -m "docs: README・座標調整"`
- [ ] **Step 5: GitHub公開（ユーザー確認後）** — `gh repo create tokunoshima-puzzle --public --source=. --push` → Pages有効化（`gh api` でbranch=main,path=/）→ 公開URL動作確認

---

## Self-Review結果
- Spec coverage: 遊び方=Task 3-4／ステージ=Task 3／データ=Task 2・5／地図=Task 1／公開=Task 5 — 網羅
- 座標の正確性リスクはTask 5 Step 2で吸収（SPECの「実装時に再照合」に対応）
- 公開（パブリックリポジトリ作成）は外部公開行為のためユーザー確認を挟む
