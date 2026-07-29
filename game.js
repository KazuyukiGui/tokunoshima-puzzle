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
  card.remove();
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
