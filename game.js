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
  remaining: document.getElementById("remaining"),
  overlay: document.getElementById("clear-overlay"),
  clearStage: document.getElementById("clear-stage"),
  retry: document.getElementById("retry"),
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
  el.overlay.hidden = true;
  renderTabs();
  renderSlots();
  renderTray();
  updateRemaining();
}

function renderSlots() {
  el.slots.replaceChildren();
  for (const v of state.villages) {
    const c = document.createElementNS(svgNS, "circle");
    c.setAttribute("cx", v.x);
    c.setAttribute("cy", v.y);
    c.setAttribute("r", 2.1);
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
    card.textContent = v.name;
    const kana = document.createElement("span");
    kana.className = "kana";
    kana.textContent = v.kana;
    card.appendChild(kana);
    el.tray.appendChild(card);
  }
}

function updateRemaining() {
  const total = state.villages.length;
  el.remaining.textContent = `のこり ${total - state.placedCount} / ${total}`;
}

// ---- ドラッグ&ドロップ（Pointer Events・タッチ/マウス両対応） ----

let drag = null; // { card, id }

el.tray.addEventListener("pointerdown", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  e.preventDefault();
  drag = { card, id: card.dataset.id };
  card.classList.add("dragging");
  moveCard(e);
});

document.addEventListener("pointermove", (e) => {
  if (!drag) return;
  moveCard(e);
  const near = findSlotAt(e.clientX, e.clientY);
  clearNear();
  if (near) near.classList.add("near");
});

document.addEventListener("pointerup", (e) => {
  if (!drag) return;
  const { card, id } = drag;
  drag = null;
  card.classList.remove("dragging");
  card.style.left = "";
  card.style.top = "";
  clearNear();
  const slot = findSlotAt(e.clientX, e.clientY);
  if (!slot) return;
  if (slot.dataset.id === id) {
    placeCard(card, slot);
  } else {
    card.classList.add("shake");
    setTimeout(() => card.classList.remove("shake"), 350);
  }
});

document.addEventListener("pointercancel", () => {
  if (!drag) return;
  drag.card.classList.remove("dragging");
  drag.card.style.left = "";
  drag.card.style.top = "";
  drag = null;
  clearNear();
});

function moveCard(e) {
  drag.card.style.left = e.clientX + "px";
  drag.card.style.top = e.clientY + "px";
}

function clearNear() {
  for (const s of el.slots.querySelectorAll(".slot.near")) s.classList.remove("near");
}

function findSlotAt(clientX, clientY) {
  let best = null;
  let bestDist = Infinity;
  for (const slot of el.slots.querySelectorAll(".slot:not(.solved)")) {
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

function placeCard(card, slot) {
  slot.classList.add("solved");
  const v = state.villages.find((x) => x.id === slot.dataset.id);
  const label = document.createElementNS(svgNS, "text");
  label.setAttribute("x", v.x);
  label.setAttribute("y", v.y - 3);
  label.setAttribute("text-anchor", "middle");
  label.classList.add("slot-label");
  label.textContent = v.name;
  el.slots.appendChild(label);
  card.remove();
  state.placedCount++;
  updateRemaining();
  if (state.placedCount === state.villages.length) {
    el.clearStage.textContent = `${TOWNS[state.stage]}ステージ 全${state.villages.length}集落`;
    el.overlay.hidden = false;
  }
}

el.retry.addEventListener("click", () => selectStage(state.stage));

// ---- devモード: ?dev=1 で地図クリック座標をviewBox座標で出力 ----
if (new URLSearchParams(location.search).get("dev") === "1") {
  el.map.addEventListener("click", (e) => {
    const pt = new DOMPoint(e.clientX, e.clientY);
    const p = pt.matrixTransform(el.map.getScreenCTM().inverse());
    console.log(`x: ${p.x.toFixed(1)}, y: ${p.y.toFixed(1)}`);
  });
}

renderTabs();
selectStage("isen");
