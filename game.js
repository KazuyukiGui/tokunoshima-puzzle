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
  srLive: document.getElementById("sr-live"),
};

// キーボード操作中だけフォーカスリングとヒントを出すためのフラグ
let kbd = false;

function setKeyboardMode(on) {
  if (kbd === on) return;
  kbd = on;
  document.body.classList.toggle("using-keyboard", on);
  if (!on) hideFocusRing();
}

// 同じ文言でも読み上げが走るよう、一度空にしてから入れ直す
function announce(msg) {
  if (!el.srLive) return;
  el.srLive.textContent = "";
  requestAnimationFrame(() => { el.srLive.textContent = msg; });
}

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
    b.type = "button";
    b.className = "tab" + (key === state.stage ? " active" : "");
    b.textContent = TOWNS[key];
    b.dataset.stage = key;
    b.setAttribute("aria-pressed", key === state.stage ? "true" : "false");
    b.addEventListener("click", () => selectStage(key));
    el.tabs.appendChild(b);
  }
}

function selectStage(key) {
  // renderTabs はボタンを作り直すので、タブ上にいたフォーカスは同じタブへ戻す
  const hadTabFocus = el.tabs.contains(document.activeElement);
  state.stage = key;
  state.villages = key === "all" ? VILLAGES : VILLAGES.filter((v) => v.town === key);
  state.placedCount = 0;
  setSelected(null);
  hideToast();
  clearTimeout(overlayTimer);
  hideOverlay();
  renderTabs();
  renderSlots();
  renderTray();
  updateProgress();
  if (hadTabFocus) {
    const tab = el.tabs.querySelector(`.tab[data-stage="${key}"]`);
    if (tab) tab.focus();
  }
}

function renderSlots() {
  el.slots.replaceChildren();
  state.villages.forEach((v, i) => {
    const c = document.createElementNS(svgNS, "circle");
    c.setAttribute("cx", v.x);
    c.setAttribute("cy", v.y);
    c.setAttribute("r", 2.2);
    c.classList.add("slot");
    c.dataset.id = v.id;
    c.setAttribute("role", "button");
    // 読み上げで答えが漏れないよう、未配置の○は番号だけを名前にする
    c.setAttribute("aria-label", `配置場所 ${i + 1}`);
    // ロービングtabindex: Tabで入る先はつねに1つだけ、あとは矢印キーで動く
    c.setAttribute("tabindex", i === 0 ? "0" : "-1");
    el.slots.appendChild(c);
  });
  el.slots.appendChild(focusRing);
  hideFocusRing();
}

function renderTray() {
  el.tray.replaceChildren();
  for (const v of shuffle(state.villages)) {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = v.id;
    card.dataset.name = v.name;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "-1");
    card.setAttribute("aria-pressed", "false");
    card.setAttribute("aria-label", `${v.name} ${v.kana}`);
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = v.name;
    const kana = document.createElement("div");
    kana.className = "kana";
    kana.textContent = v.kana;
    card.append(name, kana);
    el.tray.appendChild(card);
  }
  refreshTrayRoving();
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
  if (selected) {
    selected.classList.remove("selected");
    selected.setAttribute("aria-pressed", "false");
  }
  selected = card;
  if (selected) {
    selected.classList.add("selected");
    selected.setAttribute("aria-pressed", "true");
  }
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
    // pointerdownでpreventDefaultしている分、フォーカスは自前で移す
    refreshTrayRoving(card);
    card.focus({ preventScroll: true });
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
// クリア画面の表示予約。直後にステージを切り替えたら取り消す
let overlayTimer = null;

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

function placeCard(card, slot, viaKeyboard) {
  slot.classList.remove("near");
  slot.classList.add("solved");
  const v = state.villages.find((x) => x.id === slot.dataset.id);
  slot.setAttribute("aria-label", `${v.name}（配置済み）`);
  const label = document.createElementNS(svgNS, "text");
  label.setAttribute("x", v.x);
  label.setAttribute("y", v.y - 3.2);
  label.setAttribute("text-anchor", "middle");
  label.classList.add("slot-label");
  label.textContent = v.name;
  el.slots.appendChild(label);
  playStamp(v);
  showToast(v);
  const cardIndex = trayCards().indexOf(card);
  card.remove();
  updateTrayOverflow(false);
  state.placedCount++;
  updateProgress();
  // 解けた○にキーボードの起点が残らないよう、次の未配置へ移す
  if (slot.getAttribute("tabindex") === "0") {
    const next = el.slots.querySelector(".slot:not(.solved)");
    if (next) setRovingSlot(next);
  }
  if (viaKeyboard) {
    announce(`正解、${v.name}。のこり ${state.villages.length - state.placedCount} 集落`);
    // 次のカードへ戻して「選ぶ→置く」を続けられるようにする
    const rest = trayCards();
    if (rest.length) focusTrayCard(rest[Math.min(Math.max(cardIndex, 0), rest.length - 1)]);
  }
  if (state.placedCount === state.villages.length) {
    el.clearStage.textContent = `${TOWNS[state.stage]} ぜんぶ${state.villages.length}集落、正解！`;
    overlayTimer = setTimeout(showOverlay, 700);
  }
}

el.retry.addEventListener("click", () => {
  selectStage(state.stage);
  focusAfterOverlay();
});

el.nextStage.addEventListener("click", () => {
  const i = STAGE_ORDER.indexOf(state.stage);
  selectStage(STAGE_ORDER[(i + 1) % STAGE_ORDER.length]);
  focusAfterOverlay();
});

// ---- キーボード操作 ----
// 流れ: Tabでカードへ → 矢印で選ぶ → Enterで「選択」して地図へ移動
//       → 矢印で○を移動 → Enterで配置 → 自動でトレイに戻る（Escで取り消し）

// SVGの:focus-visibleは環境差が大きいので、フォーカス位置は専用のリングで示す
const focusRing = document.createElementNS(svgNS, "circle");
focusRing.setAttribute("id", "slot-focus-ring");
focusRing.setAttribute("r", 4.6);
focusRing.setAttribute("aria-hidden", "true");
focusRing.style.display = "none";

function showFocusRing(slot) {
  focusRing.setAttribute("cx", slot.getAttribute("cx"));
  focusRing.setAttribute("cy", slot.getAttribute("cy"));
  focusRing.style.display = "";
  el.slots.appendChild(focusRing); // ラベルやスタンプの上に出す
}

function hideFocusRing() {
  focusRing.style.display = "none";
}

function trayCards() {
  return Array.from(el.tray.querySelectorAll(".card"));
}

// トレイ内でTab可能なカードを1枚だけにする(ロービングtabindex)
function refreshTrayRoving(preferred) {
  const cards = trayCards();
  if (!cards.length) return null;
  const target =
    (preferred && cards.includes(preferred) && preferred) ||
    cards.find((c) => c.getAttribute("tabindex") === "0") ||
    cards[0];
  for (const c of cards) c.setAttribute("tabindex", c === target ? "0" : "-1");
  return target;
}

function focusTrayCard(card) {
  const target = refreshTrayRoving(card);
  if (target) target.focus();
}

function setRovingSlot(slot) {
  for (const s of el.slots.querySelectorAll(".slot")) {
    s.setAttribute("tabindex", s === slot ? "0" : "-1");
  }
}

function slotCenter(slot) {
  return { x: parseFloat(slot.getAttribute("cx")), y: parseFloat(slot.getAttribute("cy")) };
}

// 押した矢印の方向にある○のうち、まっすぐ近いものを選ぶ。
// 押した向きを軸とした90度の円錐(横ズレ<=前進量)に絞り、その中で
// 前進量 + 横ズレ×2 が最小のものを取る。
// 円錐を絞らないと、右を押したのに大きく横へ飛んで目的地から遠ざかることがある
// (57集落で「押すたびに近づく」が破綻する割合: 円錐なし17.6% → 90度1.3%)。
// 60度まで狭めると今度は行き先の無い○が出て島の端で詰まるため、90度が上限かつ下限。
function nextSlotInDirection(current, dx, dy, skipSolved) {
  const from = slotCenter(current);
  let best = null;
  let bestScore = Infinity;
  for (const slot of el.slots.querySelectorAll(".slot")) {
    if (slot === current) continue;
    if (skipSolved && slot.classList.contains("solved")) continue;
    const p = slotCenter(slot);
    const vx = p.x - from.x;
    const vy = p.y - from.y;
    const along = vx * dx + vy * dy;
    if (along <= 0) continue; // 逆方向・真横は対象外
    const across = Math.abs(vx * -dy + vy * dx);
    if (across > along) continue; // 90度の円錐から外れる
    const score = along + across * 2;
    if (score < bestScore) {
      best = slot;
      bestScore = score;
    }
  }
  return best;
}

function focusSlotForPlacement() {
  const open = el.slots.querySelectorAll(".slot:not(.solved)");
  if (!open.length) return;
  const current = el.slots.querySelector('.slot[tabindex="0"]');
  const target = current && !current.classList.contains("solved") ? current : open[0];
  setRovingSlot(target);
  target.focus();
}

function cancelSelection() {
  if (!selected) return;
  const card = selected;
  setSelected(null);
  announce("選択を解除しました");
  if (el.tray.contains(card)) focusTrayCard(card);
}

function activateSlot(slot) {
  if (!selected) {
    if (slot.classList.contains("solved")) {
      const v = state.villages.find((x) => x.id === slot.dataset.id);
      // showToast の中身は role="status" なので読み上げは自動で走る
      if (v) showToast(v);
    } else {
      announce("先に集落カードを選んでください");
    }
    return;
  }
  const card = selected;
  if (slot.dataset.id === card.dataset.id) {
    setSelected(null);
    placeCard(card, slot, true);
  } else {
    rejectCard(card);
    announce(`ここは ${card.dataset.name} ではありません`);
  }
}

const ARROWS = Object.assign(Object.create(null), {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
});

const TRAY_STEP = Object.assign(Object.create(null), {
  ArrowRight: 2,
  ArrowLeft: -2,
  ArrowDown: 1,
  ArrowUp: -1,
});

function isEnterOrSpace(e) {
  return e.key === "Enter" || e.key === " " || e.key === "Spacebar";
}

// トレイ: 2段の列送りグリッドなので 左右=±2、上下=±1 で隣に移る
el.tray.addEventListener("keydown", (e) => {
  const card = e.target.closest && e.target.closest(".card");
  if (!card) return;
  const cards = trayCards();
  const i = cards.indexOf(card);
  const step = TRAY_STEP[e.key];
  if (step !== undefined) {
    e.preventDefault();
    focusTrayCard(cards[Math.min(cards.length - 1, Math.max(0, i + step))]);
    return;
  }
  if (e.key === "Home" || e.key === "End") {
    e.preventDefault();
    focusTrayCard(e.key === "Home" ? cards[0] : cards[cards.length - 1]);
    return;
  }
  if (isEnterOrSpace(e)) {
    e.preventDefault();
    if (selected === card) {
      cancelSelection();
      return;
    }
    setSelected(card);
    refreshTrayRoving(card);
    announce(`${card.dataset.name} を選びました。矢印キーで地図の○を選び、Enterで置きます`);
    focusSlotForPlacement();
    return;
  }
  if (e.key === "Escape") {
    e.preventDefault();
    cancelSelection();
  }
});

el.slots.addEventListener("keydown", (e) => {
  const slot = e.target;
  if (!slot.classList || !slot.classList.contains("slot")) return;
  const dir = ARROWS[e.key];
  if (dir) {
    e.preventDefault();
    const next = nextSlotInDirection(slot, dir[0], dir[1], !!selected);
    if (next) {
      setRovingSlot(next);
      next.focus();
    }
    return;
  }
  if (isEnterOrSpace(e)) {
    e.preventDefault();
    activateSlot(slot);
    return;
  }
  if (e.key === "Escape") {
    e.preventDefault();
    cancelSelection();
  }
});

el.slots.addEventListener("focusin", (e) => {
  const slot = e.target;
  if (!slot.classList || !slot.classList.contains("slot")) return;
  setRovingSlot(slot);
  if (kbd) showFocusRing(slot);
});

el.slots.addEventListener("focusout", hideFocusRing);

// ステージタブは左右キーでも移動できるようにする
el.tabs.addEventListener("keydown", (e) => {
  const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
  if (!dir) return;
  const tabs = Array.from(el.tabs.querySelectorAll(".tab"));
  const i = tabs.indexOf(document.activeElement);
  if (i < 0) return;
  e.preventDefault();
  tabs[(i + dir + tabs.length) % tabs.length].focus();
});

// クリア画面はダイアログとして扱う(フォーカスを閉じ込め、Escで閉じる)
function showOverlay() {
  el.overlay.hidden = false;
  el.retry.focus();
}

function hideOverlay() {
  el.overlay.hidden = true;
}

// 閉じたクリア画面の中にフォーカスを残さない。
// カードが残っていればトレイへ、全部置き済みなら現在のステージタブへ戻す
function focusAfterOverlay() {
  const cards = trayCards();
  if (cards.length) {
    focusTrayCard(cards[0]);
    return;
  }
  const tab = el.tabs.querySelector(`.tab[data-stage="${state.stage}"]`);
  if (tab) tab.focus();
}

el.overlay.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    hideOverlay();
    focusAfterOverlay();
    return;
  }
  if (e.key !== "Tab") return;
  const f = [el.retry, el.nextStage];
  const i = f.indexOf(document.activeElement);
  e.preventDefault();
  f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
});

// キーボードを使い始めたらフォーカスリングと操作ヒントを出す
// (情報提供フォームへの文字入力はゲーム操作ではないので対象外)
function isTextField(t) {
  return !!t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.isContentEditable);
}

document.addEventListener("keydown", (e) => {
  if (isTextField(e.target) && e.key !== "Tab") return;
  if (e.key === "Tab" || e.key === "Escape" || e.key in ARROWS || isEnterOrSpace(e)) {
    setKeyboardMode(true);
  }
}, true);

document.addEventListener("pointerdown", () => setKeyboardMode(false), true);

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
