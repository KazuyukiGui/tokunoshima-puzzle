"use strict";

const svgNS = "http://www.w3.org/2000/svg";

const STAGE_ORDER = ["isen", "amagi", "tokunoshima", "all"];

const state = {
  stage: "isen",
  villages: [],
  placedCount: 0,
};

const el = {
  tabs: document.getElementById("stage-tabs"),
  slots: document.getElementById("slots"),
  tray: document.getElementById("tray"),
  trayWrap: document.getElementById("tray-wrap"),
  remainingNum: document.getElementById("remaining-num"),
  progressText: document.getElementById("progress-text"),
  progressFill: document.getElementById("progress-fill"),
  townChips: document.getElementById("town-chips"),
  toast: document.getElementById("toast"),
  kbLive: document.getElementById("kb-live"),
  overlay: document.getElementById("clear-overlay"),
  clearStage: document.getElementById("clear-stage"),
  retry: document.getElementById("retry"),
  nextStage: document.getElementById("next-stage"),
  map: document.getElementById("map"),
};

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderTabs() {
  el.tabs.replaceChildren();
  for (const key of STAGE_ORDER) {
    const b = document.createElement("button");
    b.className = "tab" + (key === state.stage ? " active" : "");
    b.textContent = TOWNS[key];
    b.addEventListener("click", () => selectStage(key));
    el.tabs.appendChild(b);
  }
}

function selectStage(key) {
  state.stage = key;
  state.villages = key === "all" ? VILLAGES : VILLAGES.filter((v) => v.town === key);
  state.placedCount = 0;
  setSelected(null);
  hideToast();
  el.overlay.hidden = true;
  renderTabs();
  renderSlots();
  renderTray();
  updateProgress();
}

function renderSlots() {
  setCursor(null);
  el.slots.replaceChildren();
  for (const v of state.villages) {
    const c = document.createElementNS(svgNS, "circle");
    c.setAttribute("cx", v.x);
    c.setAttribute("cy", v.y);
    c.setAttribute("r", 2.2);
    c.classList.add("slot");
    c.dataset.id = v.id;
    el.slots.appendChild(c);
  }
}

function renderTray() {
  el.tray.replaceChildren();
  for (const v of shuffle(state.villages)) {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = v.id;
    // キーボード操作用: Tabで送れるようにする(ポインタ操作の挙動は変えない)
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${v.name}（${v.kana}）のカード`);
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = v.name;
    const kana = document.createElement("div");
    kana.className = "kana";
    kana.textContent = v.kana;
    card.append(name, kana);
    el.tray.appendChild(card);
  }
  updateTrayOverflow(true);
}

// あふれ検知(端フェード表示)と、初回のスクロールナッジで「続きがある」ことを見せる
function updateTrayOverflow(nudge) {
  requestAnimationFrame(() => {
    const overflowing = el.tray.scrollWidth > el.tray.clientWidth + 4;
    el.trayWrap.classList.toggle("overflowing", overflowing);
    if (nudge) {
      el.tray.scrollLeft = 0;
      if (overflowing) {
        setTimeout(() => el.tray.scrollTo({ left: 70, behavior: "smooth" }), 300);
        setTimeout(() => el.tray.scrollTo({ left: 0, behavior: "smooth" }), 900);
      }
    }
  });
}

function updateProgress() {
  const total = state.villages.length;
  const done = state.placedCount;
  el.remainingNum.textContent = total - done;
  el.progressText.textContent = `${done} / ${total} 置けた`;
  el.progressFill.style.width = total ? (done / total) * 100 + "%" : "0%";

  // 全島ステージのみ町別の進捗を出す
  if (state.stage !== "all") {
    el.townChips.hidden = true;
    return;
  }
  el.townChips.hidden = false;
  el.townChips.replaceChildren();
  for (const key of ["isen", "amagi", "tokunoshima"]) {
    const tv = VILLAGES.filter((v) => v.town === key);
    const solved = tv.filter((v) => isSolved(v.id)).length;
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = TOWNS[key].replace("町", "");
    const n = document.createElement("span");
    n.textContent = `${solved}/${tv.length}`;
    chip.appendChild(n);
    el.townChips.appendChild(chip);
  }
}

function isSolved(id) {
  const s = el.slots.querySelector(`.slot[data-id="${id}"]`);
  return !!s && s.classList.contains("solved");
}

// ---- 配置操作: ドラッグ&ドロップ + タップ選択→スロットタップ ----

let drag = null; // { card, id, startX, startY, lastX, mode: null|"scroll"|"drag" }
let selected = null; // タップ選択中のカード
let pointerInteracting = false; // ポインタ操作中のフォーカスを「キーボード操作」と誤認しないための目印

function setSelected(card) {
  if (selected) selected.classList.remove("selected");
  selected = card;
  if (selected) selected.classList.add("selected");
}

function rejectCard(card) {
  card.classList.add("shake");
  setTimeout(() => card.classList.remove("shake"), 420);
}

el.tray.addEventListener("pointerdown", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  e.preventDefault();
  pointerInteracting = true;
  drag = { card, id: card.dataset.id, startX: e.clientX, startY: e.clientY, lastX: e.clientX, mode: null };
  // 以降のpointermove/upを確実に受け取る(指がカード外に出ても途切れない)
  try { card.setPointerCapture(e.pointerId); } catch (_) { /* 古いブラウザは無視 */ }
});

// タッチ時は判定点(照準リング)を指より上に出す。カードの下にぶら下がるリングの中心が判定点
const TOUCH_AIM_OFFSET = 44;

function aimPoint(e) {
  const offset = e.pointerType === "mouse" ? 0 : TOUCH_AIM_OFFSET;
  return { x: e.clientX, y: e.clientY - offset };
}

document.addEventListener("pointermove", (e) => {
  if (!drag) return;
  if (!drag.mode) {
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.hypot(dx, dy) < 6) return;
    // 最初の6pxの向きで一度だけ確定: 横優勢=トレイスクロール / 縦優勢=ドラッグ
    if (Math.abs(dx) > Math.abs(dy)) {
      drag.mode = "scroll";
    } else {
      drag.mode = "drag";
      setSelected(null);
      drag.card.classList.add("dragging");
    }
  }
  if (drag.mode === "scroll") {
    el.tray.scrollLeft -= e.clientX - drag.lastX;
    drag.lastX = e.clientX;
    return;
  }
  moveCard(e);
  const aim = aimPoint(e);
  const near = findSlotAt(aim.x, aim.y);
  clearNear();
  if (near) near.classList.add("near");
});

document.addEventListener("pointerup", (e) => {
  if (!drag) return;
  const { card, id, mode } = drag;
  drag = null;
  if (mode === null) {
    // 動いていない=タップ → 選択のトグル
    setSelected(selected === card ? null : card);
    return;
  }
  if (mode === "scroll") return;
  card.classList.remove("dragging");
  card.style.left = "";
  card.style.top = "";
  clearNear();
  const aim = aimPoint(e);
  const slot = findSlotAt(aim.x, aim.y);
  if (!slot) return;
  if (slot.dataset.id === id) {
    placeCard(card, slot);
  } else {
    rejectCard(card);
  }
});

// 選択中に地図側をタップ → スロット照合(外れたら選択解除)
// 未選択時は正解済みの○タップで豆知識を再表示
el.map.addEventListener("click", (e) => {
  if (!selected) {
    const solvedSlot = findSlotAt(e.clientX, e.clientY, ".slot.solved");
    if (solvedSlot) {
      const v = state.villages.find((x) => x.id === solvedSlot.dataset.id);
      if (v) showToast(v);
    }
    return;
  }
  const slot = findSlotAt(e.clientX, e.clientY);
  if (!slot) {
    setSelected(null);
    return;
  }
  const card = selected;
  if (slot.dataset.id === card.dataset.id) {
    setSelected(null);
    placeCard(card, slot);
  } else {
    rejectCard(card);
  }
});

document.addEventListener("pointercancel", () => {
  if (!drag) return;
  if (drag.mode === "drag") {
    drag.card.classList.remove("dragging");
    drag.card.style.left = "";
    drag.card.style.top = "";
  }
  drag = null;
  clearNear();
});

function moveCard(e) {
  // カードは照準点の14px上に浮かせる(::afterのリング中心=照準点)
  const aim = aimPoint(e);
  drag.card.style.left = aim.x + "px";
  drag.card.style.top = aim.y + "px";
}

function clearNear() {
  for (const s of el.slots.querySelectorAll(".slot.near")) s.classList.remove("near");
}

function findSlotAt(clientX, clientY, selector = ".slot:not(.solved)") {
  let best = null;
  let bestDist = Infinity;
  for (const slot of el.slots.querySelectorAll(selector)) {
    const r = slot.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dist = Math.hypot(clientX - cx, clientY - cy);
    const threshold = Math.max(28, r.width * 1.8);
    if (dist < threshold && dist < bestDist) {
      best = slot;
      bestDist = dist;
    }
  }
  return best;
}

// 波紋2重 + スタンプが押される演出(アニメ終了後に自分を消す)
function playStamp(v) {
  const g = document.createElementNS(svgNS, "g");
  const mk = (cls, r) => {
    const c = document.createElementNS(svgNS, "circle");
    c.setAttribute("cx", v.x);
    c.setAttribute("cy", v.y);
    c.setAttribute("r", r);
    c.setAttribute("class", cls);
    return c;
  };
  const stamp = mk("stamp", 1.7);
  stamp.style.transformOrigin = `${v.x}px ${v.y}px`;
  g.append(mk("ripple ripple-1", 2.2), mk("ripple ripple-2", 2.2), stamp);
  el.slots.appendChild(g);
  setTimeout(() => g.remove(), 1000);
}

let toastTimer = null;

function showToast(v) {
  el.toast.querySelector(".toast-name").textContent = v.name;
  el.toast.querySelector(".toast-kana").textContent = v.kana;
  el.toast.querySelector(".toast-town").textContent = TOWNS[v.town];
  // 特徴がある集落のみ1行表示。無い集落はヘッダ行だけ(「情報なし」とは出さない)
  const note = el.toast.querySelector(".toast-note");
  if (v.note) {
    note.textContent = v.note;
    note.hidden = false;
  } else {
    note.hidden = true;
  }
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  // 特徴ありは読める長さ(5秒)、なしは従来通り
  toastTimer = setTimeout(hideToast, v.note ? 5000 : 2200);
}

function hideToast() {
  el.toast.hidden = true;
}

function placeCard(card, slot) {
  slot.classList.remove("near");
  slot.classList.add("solved");
  const v = state.villages.find((x) => x.id === slot.dataset.id);
  const label = document.createElementNS(svgNS, "text");
  label.setAttribute("x", v.x);
  label.setAttribute("y", v.y - 3.2);
  label.setAttribute("text-anchor", "middle");
  label.classList.add("slot-label");
  label.textContent = v.name;
  el.slots.appendChild(label);
  playStamp(v);
  showToast(v);
  // キーボード操作でカードが消えるとフォーカスが飛ぶので、隣のカードへ引き継ぐ
  const refocus = document.activeElement === card ? (card.nextElementSibling || card.previousElementSibling) : null;
  if (selected === card) setSelected(null);
  card.remove();
  if (refocus) refocus.focus();
  // ○カーソルを使っていた場合だけ、次の未配置の○へ送る
  if (cursorSlot === slot) setCursor(firstUnsolvedSlot());
  updateTrayOverflow(false);
  state.placedCount++;
  updateProgress();
  if (state.placedCount === state.villages.length) {
    el.clearStage.textContent = `${TOWNS[state.stage]} ぜんぶ${state.villages.length}集落、正解！`;
    setTimeout(() => { el.overlay.hidden = false; }, 700);
  }
}

el.retry.addEventListener("click", () => selectStage(state.stage));

el.nextStage.addEventListener("click", () => {
  const i = STAGE_ORDER.indexOf(state.stage);
  selectStage(STAGE_ORDER[(i + 1) % STAGE_ORDER.length]);
});

// ---- キーボード操作: Tabでカード送り / 矢印キーで○を移動 / Enterで配置 ----
// ポインタ操作(ドラッグ&ドロップ・タップ)とは独立した経路。selected(選択中カード)は共用する。

let cursorSlot = null; // 地図上の○カーソル

// タップ/ドラッグ由来のフォーカスを拾わないよう、ポインタ操作の終了を見張る
document.addEventListener("pointerup", () => { pointerInteracting = false; });
document.addEventListener("pointercancel", () => { pointerInteracting = false; });

function announce(msg) {
  if (el.kbLive) el.kbLive.textContent = msg;
}

function allSlots() {
  return Array.from(el.slots.querySelectorAll(".slot"));
}

function firstUnsolvedSlot() {
  return el.slots.querySelector(".slot:not(.solved)");
}

function slotCenter(slot) {
  return { x: Number(slot.getAttribute("cx")), y: Number(slot.getAttribute("cy")) };
}

function setCursor(slot) {
  if (cursorSlot) cursorSlot.classList.remove("cursor");
  cursorSlot = slot || null;
  if (!cursorSlot) return;
  cursorSlot.classList.add("cursor");
  announceCursor();
}

function ensureCursor() {
  if (!cursorSlot || !cursorSlot.isConnected) setCursor(firstUnsolvedSlot());
  return cursorSlot;
}

// 正解を漏らさないよう、未配置の○は名前ではなく位置(何番目か)だけ読み上げる
function announceCursor() {
  const slots = allSlots();
  const i = slots.indexOf(cursorSlot) + 1;
  if (cursorSlot.classList.contains("solved")) {
    const v = state.villages.find((x) => x.id === cursorSlot.dataset.id);
    announce(`${i} / ${slots.length} 番目の○ ${v ? v.name : "配置ずみ"}`);
  } else {
    announce(`${i} / ${slots.length} 番目の○ 空いています`);
  }
}

const KEY_DIRS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  Up: [0, -1],
  Down: [0, 1],
  Left: [-1, 0],
  Right: [1, 0],
};

// 押した向きの円錐内でいちばん近い○へ。円錐内に無ければ、その向きにある中で最も近い○へ
function moveCursor(dx, dy) {
  const from = ensureCursor();
  if (!from) return;
  const o = slotCenter(from);
  let best = null;
  let bestScore = Infinity;
  let fallback = null;
  let fallbackScore = Infinity;
  for (const s of allSlots()) {
    if (s === from) continue;
    const p = slotCenter(s);
    const vx = p.x - o.x;
    const vy = p.y - o.y;
    const along = vx * dx + vy * dy; // 押した向きの成分
    if (along <= 0.01) continue;
    const perp = Math.abs(vx * dy - vy * dx); // 向きからの横ずれ
    const score = along + perp * 2.2;
    if (perp <= along * 1.4 && score < bestScore) {
      best = s;
      bestScore = score;
    }
    if (score < fallbackScore) {
      fallback = s;
      fallbackScore = score;
    }
  }
  const next = best || fallback;
  if (!next) return;
  setCursor(next);
  keepMapInView();
}

function keepMapInView() {
  const r = el.map.getBoundingClientRect();
  if (r.top < 0 || r.bottom > window.innerHeight) {
    el.map.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function focusedCard() {
  const a = document.activeElement;
  return a && a.classList && a.classList.contains("card") ? a : null;
}

// Enter/Space: カーソル上の○に、選択中のカードを置く(配置ずみなら豆知識を再表示)
function activateCursor() {
  const slot = ensureCursor();
  if (!slot) return;
  if (slot.classList.contains("solved")) {
    const v = state.villages.find((x) => x.id === slot.dataset.id);
    if (v) showToast(v);
    return;
  }
  const card = focusedCard() || selected;
  if (!card || !card.isConnected) {
    announce("Tabでカードを選んでください");
    return;
  }
  if (slot.dataset.id === card.dataset.id) {
    placeCard(card, slot);
  } else {
    rejectCard(card);
    announce("そこではありません");
  }
}

// カードにフォーカスが入ったら選択状態にし、○カーソルを出す(キーボード操作の入口)
el.tray.addEventListener("focusin", (e) => {
  if (pointerInteracting) return;
  const card = e.target.closest(".card");
  if (!card) return;
  setSelected(card);
  ensureCursor();
});

document.addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const card = focusedCard();
  // フォーカスがカードにある時か、タップでカードを選んでいる時だけ横取りする
  if (!card) {
    if (!selected) return;
    const a = document.activeElement;
    if (a && a.closest && a.closest("input, textarea, select, button, a, summary, [contenteditable]")) return;
  }

  const dir = KEY_DIRS[e.key];
  if (dir) {
    e.preventDefault();
    moveCursor(dir[0], dir[1]);
    return;
  }
  if (e.key === "Enter" || (card && (e.key === " " || e.key === "Spacebar"))) {
    e.preventDefault();
    activateCursor();
    return;
  }
  if (e.key === "Escape" || e.key === "Esc") {
    setSelected(null);
    setCursor(null);
    announce("選択を解除しました");
    if (card) card.blur();
  }
});

// ---- devモード: ?dev=1 で地図クリック座標をviewBox座標で出力 ----
if (new URLSearchParams(location.search).get("dev") === "1") {
  el.map.addEventListener("click", (e) => {
    const pt = new DOMPoint(e.clientX, e.clientY);
    const p = pt.matrixTransform(el.map.getScreenCTM().inverse());
    console.log(`x: ${p.x.toFixed(1)}, y: ${p.y.toFixed(1)}`);
  });
}

// 地図パス(map-paths.js)を流し込む
document.getElementById("island").setAttribute("d", ISLAND_PATH);
document.getElementById("island-clip").setAttribute("d", ISLAND_PATH);

// 浅瀬エコー・等高線バンドは同じ島パスを重ね描き(太さはCSS側で指定)
for (const id of ["shore", "contours"]) {
  const g = document.getElementById(id);
  for (let i = 0; i < 3; i++) {
    const p = document.createElementNS(svgNS, "path");
    p.setAttribute("d", ISLAND_PATH);
    g.appendChild(p);
  }
}

const bordersGroup = document.getElementById("borders");
for (const d of BORDER_PATHS) {
  const p = document.createElementNS(svgNS, "path");
  p.setAttribute("d", d);
  p.classList.add("border");
  bordersGroup.appendChild(p);
}

renderTabs();
selectStage("all");
