/* ═══════════════════════════════════════════════════════════════
   BLIND RANK — Application Logic
   ═══════════════════════════════════════════════════════════════ */

"use strict";

/* ── Brand assets ─────────────────────────────────────────────── */
const BRAND_LOGO_SRC   = "./bce-logo.jpeg";
const BRAND_BANNER_SRC = "./bce-banner.png";

document.getElementById("heroLogo").src = BRAND_LOGO_SRC;
document.getElementById("heroBanner").style.backgroundImage = `url('${BRAND_BANNER_SRC}')`;

/* ── Element refs ─────────────────────────────────────────────── */
const fileInput         = document.getElementById("fileInput");
const uploadZone        = document.getElementById("uploadZone");
const startBtn          = document.getElementById("startBtn");
const toggleControlsBtn = document.getElementById("toggleControlsBtn");
const controlsBody      = document.getElementById("controlsBody");
const newRunBtn         = document.getElementById("newRunBtn");
const undoBtn           = document.getElementById("undoBtn");
const exportBtn         = document.getElementById("exportBtn");
const resetBtn          = document.getElementById("resetBtn");
const slotCountControl  = document.getElementById("slotCountControl");

const statusEl       = document.getElementById("status");
const loadedPill     = document.getElementById("loadedPill");
const uploadsCountEl = document.getElementById("uploadsCount");
const uploadsGridEl  = document.getElementById("uploadsGrid");

const progressPill  = document.getElementById("progressPill");
const queuePill     = document.getElementById("queuePill");
const queuePillTop  = document.getElementById("queuePillTop");
const rankHintEl    = document.getElementById("rankHint");

const stickyMsg  = document.getElementById("stickyMsg");
const stickyPill = document.getElementById("stickyPill");
const stickyFill = document.getElementById("stickyFill");

const rankSlotsEl    = document.getElementById("rankSlots");
const currentCardEl  = document.getElementById("currentCard");
const currentImgEl   = document.getElementById("currentImg");
const currentEmptyEl = document.getElementById("currentEmpty");
const emptyIdleEl    = document.getElementById("emptyIdle");
const emptyDoneEl    = document.getElementById("emptyDone");
const doneCountEl    = document.getElementById("doneCount");
const placeHintEl    = document.getElementById("placeHint");

/* ── State ────────────────────────────────────────────────────── */
let totalSlots   = 5;
let allImages    = [];
let pickedImages = [];
let currentIndex = 0;
let slots        = [];
let history      = [];

/* ── Phase management ─────────────────────────────────────────── */
function setPhase(phase) {
  document.body.dataset.phase = phase;
}

/* ── Status helpers ───────────────────────────────────────────── */
function setStatus(text) { statusEl.textContent = text; }

/* ── Slot count control ───────────────────────────────────────── */
slotCountControl.addEventListener("click", (e) => {
  const btn = e.target.closest(".seg-btn");
  if (!btn || btn.disabled) return;

  if (document.body.dataset.phase === "ranking") return;

  for (const b of slotCountControl.querySelectorAll(".seg-btn")) {
    b.classList.remove("active");
  }
  btn.classList.add("active");
  totalSlots = parseInt(btn.dataset.slots, 10);

  slots = Array(totalSlots).fill(null);
  renderSlots();
  updateProgressUI();
  updateQueueUI();

  if (allImages.length > 0) {
    const enough = allImages.length >= totalSlots;
    startBtn.disabled = !enough;
    if (!enough) {
      setStatus(`Need ${totalSlots}. Loaded ${allImages.length}`);
    } else {
      setStatus("Ready");
    }
  }
});

/* ── Controls toggle ──────────────────────────────────────────── */
toggleControlsBtn.addEventListener("click", () => {
  const open = controlsBody.classList.toggle("open");
  toggleControlsBtn.textContent = open ? "Hide uploads" : "Uploads";
});

/* ── URL cleanup ──────────────────────────────────────────────── */
function clearUrls(list) {
  for (const item of list) {
    if (item?.url) URL.revokeObjectURL(item.url);
  }
}

/* ── Fisher-Yates shuffle ─────────────────────────────────────── */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Helpers ──────────────────────────────────────────────────── */
function placedCount() { return slots.filter(Boolean).length; }

function updateProgressUI() {
  const n   = placedCount();
  const pct = totalSlots ? ((n / totalSlots) * 100).toFixed(1) : 0;
  const txt = `${n} of ${totalSlots} placed`;

  progressPill.textContent = txt;
  stickyPill.textContent   = txt;
  if (stickyFill) stickyFill.style.width = `${pct}%`;

  exportBtn.disabled = n !== totalSlots;
}

function updateQueueUI() {
  const shown = Math.min(currentIndex + 1, totalSlots);
  const txt   = `${shown} of ${totalSlots}`;
  queuePill.textContent    = txt;
  queuePillTop.textContent = txt;
}

/* ── Render uploads grid ──────────────────────────────────────── */
function renderUploadsGrid() {
  uploadsGridEl.innerHTML = "";
  for (const item of allImages) {
    const img = document.createElement("img");
    img.className = "u-thumb";
    img.src = item.url;
    img.alt = "";
    uploadsGridEl.appendChild(img);
  }
  const n = allImages.length;
  uploadsCountEl.textContent = `${n}`;
  loadedPill.textContent     = `${n} loaded`;
}

/* ── Render rank slots ────────────────────────────────────────── */
function renderSlots() {
  rankSlotsEl.innerHTML = "";

  for (let i = 0; i < totalSlots; i++) {
    const rankNum = i + 1;
    const filled  = Boolean(slots[i]);

    const slot = document.createElement("div");
    slot.className = "slot" + (filled ? " filled" : "");
    slot.dataset.rank = String(rankNum);

    /* Rank number */
    const numEl = document.createElement("div");
    numEl.className    = "slot-num";
    numEl.textContent  = rankNum;

    /* Thumbnail */
    const thumb = document.createElement("img");
    thumb.className = "slot-thumb";
    thumb.alt       = "";
    if (filled) thumb.src = slots[i].url;

    /* Text body */
    const body  = document.createElement("div");
    body.className = "slot-body";

    const label = document.createElement("div");
    label.className   = "slot-label";
    label.textContent = `Rank ${rankNum}`;

    const hint = document.createElement("div");
    hint.className   = "slot-hint";
    hint.textContent = filled ? "Locked in" : "Tap or drop here";

    body.appendChild(label);
    body.appendChild(hint);

    /* Status badge */
    const badge = document.createElement("span");
    badge.className   = "badge slot-badge";
    badge.textContent = filled ? "Filled" : "Open";

    slot.appendChild(numEl);
    slot.appendChild(thumb);
    slot.appendChild(body);
    slot.appendChild(badge);

    /* Events — only on empty slots */
    if (!filled) {
      slot.addEventListener("click", () => placeIntoSlot(i));
      slot.addEventListener("dragover", (e) => {
        if (!currentCardEl.draggable) return;
        e.preventDefault();
        slot.classList.add("drop-ready");
      });
      slot.addEventListener("dragleave", () => slot.classList.remove("drop-ready"));
      slot.addEventListener("drop", (e) => {
        e.preventDefault();
        slot.classList.remove("drop-ready");
        placeIntoSlot(i);
      });
    }

    rankSlotsEl.appendChild(slot);
  }
}

/* ── Show current cover ───────────────────────────────────────── */
function showCurrent() {
  const done = placedCount() === totalSlots;

  if (done) {
    setStatus("Done");
    setPhase("done");
    stickyMsg.textContent = "Ranking complete — ready to export";

    currentCardEl.draggable = false;
    currentCardEl.classList.remove("dragging", "has-image");

    /* Swap to done state */
    currentImgEl.classList.remove("visible");
    currentImgEl.style.display = "none";
    currentEmptyEl.classList.remove("hidden");
    emptyIdleEl.hidden = true;
    emptyDoneEl.hidden = false;
    if (doneCountEl) doneCountEl.textContent = totalSlots;

    placeHintEl.textContent = "Export ready";
    return;
  }

  const item = pickedImages[currentIndex];
  if (!item) return;

  setStatus(`Place your top ${totalSlots}`);
  setPhase("ranking");
  stickyMsg.textContent = "Place the current cover into a slot";

  /* Hide empty state */
  currentEmptyEl.classList.add("hidden");

  /* Fade-in new image via double-RAF trick */
  currentImgEl.classList.remove("visible");
  currentImgEl.style.display = "none";
  requestAnimationFrame(() => {
    currentImgEl.src          = item.url;
    currentImgEl.alt          = "";
    currentImgEl.style.display = "block";
    requestAnimationFrame(() => {
      currentImgEl.classList.add("visible");
      currentCardEl.classList.add("has-image");
    });
  });

  placeHintEl.textContent = "Drag or tap a slot";
  currentCardEl.draggable = true;

  updateQueueUI();
}

function advance() {
  currentIndex++;
  showCurrent();
}

/* ── Place into slot ──────────────────────────────────────────── */
function placeIntoSlot(slotIndex) {
  if (slots[slotIndex]) return;
  if (placedCount() === totalSlots) return;

  const item = pickedImages[currentIndex];
  if (!item) return;

  slots[slotIndex] = item;
  history.push({ slotIndex, item });
  undoBtn.disabled = false;

  renderSlots();
  updateProgressUI();

  /* Pop animation on the newly filled slot */
  const slotEls = rankSlotsEl.querySelectorAll(".slot");
  if (slotEls[slotIndex]) {
    slotEls[slotIndex].classList.add("just-filled");
    slotEls[slotIndex].addEventListener(
      "animationend",
      () => slotEls[slotIndex].classList.remove("just-filled"),
      { once: true }
    );
  }

  advance();
}

/* ── Undo last placement ──────────────────────────────────────── */
function undoLast() {
  if (!history.length) return;

  const last = history.pop();
  slots[last.slotIndex] = null;
  if (currentIndex > 0) currentIndex--;

  undoBtn.disabled = history.length === 0;

  renderSlots();
  updateProgressUI();
  updateQueueUI();

  setPhase("ranking");
  setStatus(`Place your top ${totalSlots}`);
  stickyMsg.textContent = "Place the current cover into a slot";

  showCurrent();
}

/* ── Portrait lock ────────────────────────────────────────────── */
async function requestPortraitLock() {
  try {
    if (screen.orientation?.lock) await screen.orientation.lock("portrait");
  } catch (_) { /* not supported — ignore */ }
}

/* ── Start run ────────────────────────────────────────────────── */
function startRun() {
  history      = [];
  currentIndex = 0;
  slots        = Array(totalSlots).fill(null);

  undoBtn.disabled  = true;
  exportBtn.disabled = true;

  pickedImages = shuffle(allImages).slice(0, totalSlots);

  setPhase("ranking");
  setStatus(`Place your top ${totalSlots}`);
  stickyMsg.textContent = "Place the current cover into a slot";

  newRunBtn.disabled = false;
  resetBtn.disabled  = false;

  /* Lock slot count during a run */
  for (const b of slotCountControl.querySelectorAll(".seg-btn")) b.disabled = true;

  renderSlots();
  updateProgressUI();
  updateQueueUI();

  /* Reset current card to empty state before showCurrent() */
  currentImgEl.classList.remove("visible");
  currentImgEl.style.display = "none";
  currentEmptyEl.classList.remove("hidden");
  emptyIdleEl.hidden = false;
  emptyDoneEl.hidden = true;
  currentCardEl.classList.remove("has-image");

  showCurrent();

  controlsBody.classList.remove("open");
  toggleControlsBtn.textContent = "Uploads";
}

/* ── Reset all ────────────────────────────────────────────────── */
function resetAll() {
  clearUrls(allImages);
  allImages    = [];
  pickedImages = [];
  currentIndex = 0;
  slots        = Array(totalSlots).fill(null);
  history      = [];

  fileInput.value         = "";
  uploadsGridEl.innerHTML = "";
  rankSlotsEl.innerHTML   = "";

  uploadsCountEl.textContent = "0";
  loadedPill.textContent     = "0 loaded";
  progressPill.textContent   = `0 of ${totalSlots} placed`;
  queuePill.textContent      = "–";
  queuePillTop.textContent   = "–";
  rankHintEl.textContent     = "Drop or tap";
  if (stickyFill) stickyFill.style.width = "0%";

  stickyMsg.textContent  = "Load images to begin";
  stickyPill.textContent = "–";

  setStatus("Load images");
  setPhase("idle");

  /* Reset current card */
  currentCardEl.draggable = false;
  currentCardEl.classList.remove("has-image", "dragging");
  currentImgEl.classList.remove("visible");
  currentImgEl.style.display = "none";
  currentImgEl.removeAttribute("src");
  currentEmptyEl.classList.remove("hidden");
  emptyIdleEl.hidden = false;
  emptyDoneEl.hidden = true;
  placeHintEl.textContent = "Place it";

  /* Upload zone */
  uploadZone.classList.remove("has-files");

  /* Buttons */
  startBtn.disabled          = true;
  toggleControlsBtn.disabled = true;
  newRunBtn.disabled         = true;
  undoBtn.disabled           = true;
  exportBtn.disabled         = true;
  resetBtn.disabled          = true;

  /* Unlock slot count */
  for (const b of slotCountControl.querySelectorAll(".seg-btn")) b.disabled = false;

  controlsBody.classList.remove("open");
  toggleControlsBtn.textContent = "Uploads";
}

/* ── Canvas helpers ───────────────────────────────────────────── */
function drawRoundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y,     x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x,     y + h, rr);
  ctx.arcTo(x,     y + h, x,     y,     rr);
  ctx.arcTo(x,     y,     x + w, y,     rr);
  ctx.closePath();
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src     = url;
  });
}

function drawCoverContained(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const tr = w / h;
  let dw = w, dh = h, dx = x, dy = y;
  if (ir > tr) { dh = w / ir; dy = y + (h - dh) / 2; }
  else         { dw = h * ir; dx = x + (w - dw) / 2; }
  ctx.drawImage(img, dx, dy, dw, dh);
}

/* ── Export ranking ───────────────────────────────────────────── */
async function exportRanking() {
  if (placedCount() !== totalSlots) return;

  exportBtn.disabled    = true;
  exportBtn.textContent = "Exporting…";
  setStatus("Exporting");
  stickyMsg.textContent = "Generating export image…";

  try {
    const PAD    = 56;
    const CW     = 1080;
    const ROW_H  = 300;
    const ROW_G  = 20;
    const HEAD_H = 250;
    const FOOT_H = 70;
    const CH     = HEAD_H + (ROW_H + ROW_G) * totalSlots - ROW_G + FOOT_H;

    const canvas = document.createElement("canvas");
    canvas.width  = CW;
    canvas.height = CH;
    const ctx = canvas.getContext("2d");

    /* Background */
    const bg = ctx.createLinearGradient(0, 0, 0, CH);
    bg.addColorStop(0, "#060711");
    bg.addColorStop(1, "#111428");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CW, CH);

    /* Header text */
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font      = "900 64px Inter, system-ui, sans-serif";
    ctx.fillText("BCE COMICS POD", PAD, 110);

    ctx.fillStyle = "rgba(255,255,255,0.60)";
    ctx.font      = "600 32px Inter, system-ui, sans-serif";
    ctx.fillText(`Blind Top ${totalSlots}`, PAD, 162);

    /* Separator */
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD, 196);
    ctx.lineTo(CW - PAD, 196);
    ctx.stroke();

    /* Rank medal colors */
    const MEDAL = ["#f5a623", "#9ca3af", "#b87333"];

    for (let i = 0; i < totalSlots; i++) {
      const item = slots[i];
      if (!item) continue;

      const y = HEAD_H + i * (ROW_H + ROW_G);

      /* Row background */
      ctx.fillStyle = "rgba(11,13,29,0.96)";
      drawRoundedRect(ctx, PAD, y, CW - PAD * 2, ROW_H, 20);
      ctx.fill();

      /* Rank number */
      ctx.fillStyle   = MEDAL[i] ?? "rgba(255,255,255,0.38)";
      ctx.font        = `900 ${i < 3 ? 62 : 52}px Inter, system-ui, sans-serif`;
      ctx.textAlign   = "center";
      ctx.fillText(`${i + 1}`, PAD + 44, y + ROW_H * 0.6);
      ctx.textAlign   = "left";

      /* Cover image */
      const img  = await loadImageFromUrl(item.url);
      const imgX = PAD + 100;
      const imgW = CW - PAD * 2 - 120;
      const imgY = y + 16;
      const imgH = ROW_H - 32;

      ctx.save();
      drawRoundedRect(ctx, imgX, imgY, imgW, imgH, 16);
      ctx.clip();
      ctx.fillStyle = "#06070f";
      ctx.fillRect(imgX, imgY, imgW, imgH);
      drawCoverContained(ctx, img, imgX, imgY, imgW, imgH);
      ctx.restore();
    }

    /* Generate output */
    const blob     = await new Promise(r => canvas.toBlob(r, "image/png", 1.0));
    const filename = "bce-blind-rank.png";

    if (!blob) {
      /* Data URL fallback */
      const a = Object.assign(document.createElement("a"), {
        href: canvas.toDataURL("image/png"),
        download: filename,
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "BCE Comics Pod",
          text:  `Blind Top ${totalSlots}`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a   = Object.assign(document.createElement("a"), {
          href: url,
          download: filename,
        });
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      }
    }

    setStatus("Done");
    stickyMsg.textContent = "Exported! Ranking complete.";
  } catch (err) {
    console.error("Export error:", err);
    setStatus("Export failed");
    stickyMsg.textContent = "Export failed — try again";
    alert("Export failed. If downloads are blocked, allow them for this site and retry.");
  } finally {
    exportBtn.textContent = "Export";
    exportBtn.disabled    = placedCount() !== totalSlots;
  }
}

/* ── Current card drag ────────────────────────────────────────── */
currentCardEl.addEventListener("dragstart", (e) => {
  if (!currentCardEl.draggable) { e.preventDefault(); return; }
  currentCardEl.classList.add("dragging");
  e.dataTransfer.setData("text/plain", "current");
});

currentCardEl.addEventListener("dragend", () => {
  currentCardEl.classList.remove("dragging");
  document.querySelectorAll(".slot").forEach(s => s.classList.remove("drop-ready"));
});

/* ── Body-level drag-over (highlight upload zone) ─────────────── */
document.addEventListener("dragover", (e) => {
  if (e.dataTransfer?.types.includes("Files")) {
    e.preventDefault();
    uploadZone.classList.add("drag-over");
  }
});
document.addEventListener("dragleave", (e) => {
  if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
    uploadZone.classList.remove("drag-over");
  }
});
document.addEventListener("drop", (e) => {
  uploadZone.classList.remove("drag-over");
  if (e.dataTransfer?.types.includes("Files")) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) loadFiles(files);
  }
});

/* ── File loading ─────────────────────────────────────────────── */
function loadFiles(files) {
  clearUrls(allImages);
  allImages = files.map((f, i) => ({
    id:   `${Date.now()}-${i}`,
    name: f.name || `Image ${i + 1}`,
    file: f,
    url:  URL.createObjectURL(f),
  }));

  renderUploadsGrid();
  uploadZone.classList.add("has-files");

  /* Reset run state */
  pickedImages = [];
  currentIndex = 0;
  slots        = Array(totalSlots).fill(null);
  history      = [];
  undoBtn.disabled = true;

  renderSlots();
  updateProgressUI();

  /* Reset current card */
  currentCardEl.draggable = false;
  currentCardEl.classList.remove("has-image", "dragging");
  currentImgEl.classList.remove("visible");
  currentImgEl.style.display = "none";
  currentImgEl.removeAttribute("src");
  currentEmptyEl.classList.remove("hidden");
  emptyIdleEl.hidden = false;
  emptyDoneEl.hidden = true;
  placeHintEl.textContent = "Place it";

  stickyMsg.textContent  = "Load images to begin";
  stickyPill.textContent = "–";

  const n      = allImages.length;
  const enough = n >= totalSlots;

  startBtn.disabled          = !enough;
  resetBtn.disabled          = n === 0;
  toggleControlsBtn.disabled = n === 0;
  newRunBtn.disabled         = true;
  exportBtn.disabled         = true;

  setPhase(n === 0 ? "idle" : "ready");
  setStatus(enough ? "Ready" : `Need ${totalSlots}. Loaded ${n}`);

  controlsBody.classList.remove("open");
  toggleControlsBtn.textContent = "Uploads";
}

fileInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files ?? []);
  if (files.length) loadFiles(files);
});

/* ── Button handlers ──────────────────────────────────────────── */
startBtn.addEventListener("click", async () => {
  await requestPortraitLock();
  startRun();
});

newRunBtn.addEventListener("click", async () => {
  if (allImages.length < totalSlots) return;
  await requestPortraitLock();
  startRun();
});

undoBtn.addEventListener("click", undoLast);
exportBtn.addEventListener("click", exportRanking);
resetBtn.addEventListener("click", resetAll);

/* ── Initialise ───────────────────────────────────────────────── */
resetAll();
