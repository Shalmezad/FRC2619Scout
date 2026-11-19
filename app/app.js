'use strict';

/* ============================================================
 * Charge Scout — offline-first scouting data collection
 * Two modes in one app:
 *   Scout: fill form → record saved locally → QR shown to lead
 *   Lead:  scan QRs → consolidated list → export CSV/JSON to Excel
 * All data lives in localStorage. No network required, ever.
 * ============================================================ */

const STORE_KEY = 'charge-scout-records-v1';

/* ---------------- storage ---------------- */

function loadRecords() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORE_KEY, JSON.stringify(records));
}

/** Insert or replace by id. Returns true if it was a duplicate. */
function upsertRecord(rec) {
  const records = loadRecords();
  const idx = records.findIndex(r => r.id === rec.id);
  const dup = idx >= 0;
  if (dup) records[idx] = rec;
  else records.push(rec);
  saveRecords(records);
  return dup;
}

function deleteRecord(id) {
  saveRecords(loadRecords().filter(r => r.id !== id));
}

/* ---------------- record helpers ---------------- */

/** Short, sortable-enough id: time + randomness, base36 (~14 chars). */
function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function newRecord({ match, team, pos, balls, broke, climb, notes }) {
  return {
    id: newId(),
    match: Number(match),
    team: Number(team),
    pos,
    balls: Number(balls) || 0,
    broke: broke === true || broke === 'yes',
    climb: climb === true || climb === 'yes',
    notes: (notes || '').trim(),
    ts: Date.now(),
  };
}

/** Record → compact JSON text embedded in the QR code. */
function encodeForQR(rec) {
  return JSON.stringify({
    v: 1,
    i: rec.id,
    m: rec.match,
    t: rec.team,
    p: rec.pos,
    b: rec.balls,
    d: rec.broke ? 1 : 0,
    c: rec.climb ? 1 : 0,
    n: rec.notes,
    s: rec.ts,
  });
}

/** QR text (or parsed object) → full record, or null if invalid. */
function decodeFromQR(input) {
  let obj = input;
  if (typeof input === 'string') {
    try {
      obj = JSON.parse(input);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== 'object' || obj.v !== 1) return null;
  if (!Number.isFinite(+obj.m) || !Number.isFinite(+obj.t)) return null;
  return {
    id: String(obj.i || newId()),
    match: +obj.m,
    team: +obj.t,
    pos: String(obj.p || ''),
    balls: +obj.b || 0,
    broke: !!obj.d,
    climb: !!obj.c,
    notes: String(obj.n || ''),
    ts: +obj.s || Date.now(),
  };
}

/* ---------------- QR drawing (canvas, no async images) ---------------- */

function drawQR(canvas, text) {
  const qr = qrcode(0, 'M'); // 0 = auto-pick version
  qr.addData(text);
  qr.make();

  const count = qr.getModuleCount();
  const quiet = 4; // quiet-zone modules
  const total = count + quiet * 2;
  const cell = Math.max(1, Math.floor(canvas.width / total));
  const offset = Math.floor((canvas.width - cell * total) / 2);

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(offset + (c + quiet) * cell, offset + (r + quiet) * cell, cell, cell);
      }
    }
  }
}

/* ---------------- CSV / export ---------------- */

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function toCSV(records) {
  const header = ['match', 'team', 'position', 'balls_scored', 'broke_down',
                  'climbed', 'notes', 'timestamp', 'id'];
  const rows = records.map(r => [
    r.match, r.team, r.pos, r.balls,
    r.broke ? 'Yes' : 'No',
    r.climb ? 'Yes' : 'No',
    r.notes,
    new Date(r.ts).toISOString(),
    r.id,
  ]);
  const sorted = rows.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  // UTF-8 BOM so Excel opens special characters correctly
  return '\uFEFF' + [header, ...sorted].map(r => r.map(csvCell).join(',')).join('\r\n');
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function stamp() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

/* ---------------- UI helpers ---------------- */

const $ = sel => document.querySelector(sel);

let toastTimer = null;
function toast(msg, kind = '') {
  const el = $('#toast');
  el.textContent = msg;
  el.className = kind;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
}

function recordTitle(r) {
  return `M${r.match} · Team ${r.team} · ${r.pos}`;
}

function recordSubtitle(r) {
  const bits = [`${r.balls} balls`];
  if (r.broke) bits.push('BROKE');
  if (r.climb) bits.push('Climbed');
  if (r.notes) bits.push(r.notes);
  return bits.join(' · ');
}

function renderList({ listEl, emptyEl, countEl, records, withQR }) {
  listEl.innerHTML = '';
  countEl.textContent = records.length;
  emptyEl.hidden = records.length > 0;

  for (const r of [...records].sort((a, b) => a.match - b.match || a.team - b.team)) {
    const li = document.createElement('li');

    const main = document.createElement('div');
    main.className = 'rec-main';
    main.innerHTML =
      `<div class="rec-title"></div><div class="rec-sub"></div>`;
    main.querySelector('.rec-title').textContent = recordTitle(r);
    main.querySelector('.rec-sub').textContent = recordSubtitle(r);
    li.appendChild(main);

    if (withQR) {
      const qrBtn = document.createElement('button');
      qrBtn.className = 'rec-qr';
      qrBtn.textContent = 'QR';
      qrBtn.addEventListener('click', () => showQR(r));
      li.appendChild(qrBtn);
    }

    const del = document.createElement('button');
    del.className = 'rec-del';
    del.textContent = '✕';
    del.setAttribute('aria-label', 'Delete record');
    del.addEventListener('click', () => {
      if (confirm(`Delete ${recordTitle(r)}?`)) {
        deleteRecord(r.id);
        renderAll();
        toast('Deleted');
      }
    });
    li.appendChild(del);

    listEl.appendChild(li);
  }
}

function renderAll() {
  const records = loadRecords();
  renderList({
    listEl: $('#history-list'),
    emptyEl: $('#history-empty'),
    countEl: $('#history-count'),
    records,
    withQR: true,
  });
  renderList({
    listEl: $('#lead-list'),
    emptyEl: $('#lead-empty'),
    countEl: $('#lead-count'),
    records,
    withQR: false,
  });
}

/* ---------------- tabs ---------------- */

function switchTab(name) {
  const scout = name === 'scout';
  $('#view-scout').hidden = !scout;
  $('#view-lead').hidden = scout;
  $('#tab-scout').classList.toggle('active', scout);
  $('#tab-lead').classList.toggle('active', !scout);
  $('#tab-scout').setAttribute('aria-selected', scout);
  $('#tab-lead').setAttribute('aria-selected', !scout);
  if (!scout) stopScan(); // camera should not run while hidden
}

/* ---------------- scout form ---------------- */

const formState = { pos: 'R1', broke: 'no', climb: 'no' };

function showQR(rec) {
  drawQR($('#qr-canvas'), encodeForQR(rec));
  $('#qr-caption').textContent = `${recordTitle(rec)} — ${recordSubtitle(rec)}`;
  $('#qr-panel').hidden = false;
  $('#qr-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function initScoutForm() {
  const form = $('#scout-form');

  // steppers
  form.addEventListener('click', e => {
    const step = e.target.closest('.step');
    if (!step) return;
    const input = document.getElementById(step.dataset.target);
    const delta = Number(step.dataset.step);
    const minAttr = input.getAttribute('min');
    const min = minAttr == null || minAttr === '' ? -Infinity : Number(minAttr);
    const next = Math.max(min, (Number(input.value) || 0) + delta);
    input.value = String(next);
  });

  // segmented controls (pos / broke / climb)
  form.querySelectorAll('.seg').forEach(seg => {
    seg.addEventListener('click', e => {
      const btn = e.target.closest('button[data-val]');
      if (!btn) return;
      seg.querySelectorAll('button').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      formState[seg.dataset.field] = btn.dataset.val;
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const match = Number($('#match').value);
    const team = Number($('#team').value);
    if (!Number.isFinite(match) || match < 1) return toast('Enter a match #', 'warn');
    if (!Number.isFinite(team) || team < 1) return toast('Enter a team #', 'warn');

    const rec = newRecord({
      match,
      team,
      pos: formState.pos,
      balls: $('#balls').value,
      broke: formState.broke,
      climb: formState.climb,
      notes: $('#notes').value,
    });
    upsertRecord(rec);
    renderAll();
    showQR(rec);
    toast('Saved to this device', 'good');

    // prepare next entry: increment match, clear team-dependent fields
    $('#match').value = match + 1;
    $('#team').value = '';
    $('#balls').value = 0;
    $('#notes').value = '';
  });

  $('#qr-close').addEventListener('click', () => { $('#qr-panel').hidden = true; });

  $('#scout-export-csv').addEventListener('click', () => {
    const records = loadRecords();
    if (!records.length) return toast('Nothing to export', 'warn');
    download(`charge-scout-${stamp()}.csv`, toCSV(records), 'text/csv;charset=utf-8');
    toast('CSV downloaded', 'good');
  });
  $('#scout-export-json').addEventListener('click', () => {
    const records = loadRecords();
    if (!records.length) return toast('Nothing to export', 'warn');
    download(`charge-scout-backup-${stamp()}.json`,
             JSON.stringify(records, null, 2), 'application/json');
    toast('Backup downloaded', 'good');
  });
}

/* ---------------- lead: QR scanning ---------------- */

let mediaStream = null;
let scanLoopId = null;
let lastDecode = { text: '', at: 0 };

// Offscreen frame buffer + stats for the decode pipeline (module-level so the
// pipeline is testable without a physical camera — see __processFrame).
const scanCanvas = document.createElement('canvas');
const scanCtx = scanCanvas.getContext('2d', { willReadFrequently: true });
const scanStats = (window.__scanStats = { frames: 0, decoded: 0 });

// Shared decode pipeline — takes any drawable source (video or canvas).
function processFrame(source) {
  const w = source.videoWidth || source.width;
  const h = source.videoHeight || source.height;
  if (!w || !h) return false;
  if (scanCanvas.width !== w) scanCanvas.width = w;
  if (scanCanvas.height !== h) scanCanvas.height = h;
  scanCtx.drawImage(source, 0, 0);
  const img = scanCtx.getImageData(0, 0, w, h);
  scanStats.frames++;
  const found = jsQR(img.data, w, h, { inversionAttempts: 'attemptBoth' });
  if (!found || !found.data) return false;
  scanStats.decoded++;
  const now = Date.now();
  // ignore the same code held in view repeatedly
  if (found.data === lastDecode.text && now - lastDecode.at < 3000) return true;
  lastDecode = { text: found.data, at: now };
  ingestQRText(found.data);
  return true;
}
window.__processFrame = processFrame; // test hook

function ingestQRText(text, { silent } = {}) {
  const rec = decodeFromQR(text);
  if (!rec) {
    if (!silent) toast('Not a Charge Scout QR', 'warn');
    return false;
  }
  const dup = upsertRecord(rec);
  renderAll();
  if (!silent) {
    if (dup) toast(`Already have ${recordTitle(rec)}`);
    else toast(`Added ${recordTitle(rec)}`, 'good');
  }
  if (!dup && navigator.vibrate) navigator.vibrate(60);
  return !dup;
}

async function startScan() {
  const status = $('#scan-status');
  status.hidden = false;
  status.textContent = 'Starting camera…';
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
      audio: false,
    });
  } catch (err) {
    status.textContent = 'Camera unavailable: ' + (err && err.name || err);
    toast('Camera permission needed', 'warn');
    return;
  }

  const video = $('#scan-video');
  video.srcObject = mediaStream;
  try { await video.play(); } catch { /* autoplay guard */ }
  $('#scanner').hidden = false;
  $('#scan-start').hidden = true;
  status.textContent = 'Scanning…';

  let lastTick = 0;
  const tick = ts => {
    if (!mediaStream) return;
    // ~15 fps: plenty for QR decoding, much kinder to phone batteries
    if (ts - lastTick >= 66) {
      lastTick = ts;
      // NOTE: readyState is 0..4 — compare against HAVE_CURRENT_DATA (2),
      // never against videoWidth (a pixel count) — that was a real bug.
      if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        processFrame(video);
      }
    }
    scanLoopId = requestAnimationFrame(tick);
  };
  scanLoopId = requestAnimationFrame(tick);
}

function stopScan() {
  if (scanLoopId) cancelAnimationFrame(scanLoopId);
  scanLoopId = null;
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop());
    mediaStream = null;
  }
  const video = $('#scan-video');
  video.srcObject = null;
  $('#scanner').hidden = true;
  $('#scan-start').hidden = false;
  $('#scan-status').hidden = true;
}

function initLead() {
  $('#scan-start').addEventListener('click', startScan);
  $('#scan-stop').addEventListener('click', stopScan);

  $('#paste-add').addEventListener('click', () => {
    const text = $('#paste-json').value.trim();
    if (!text) return toast('Paste something first', 'warn');
    if (ingestQRText(text)) $('#paste-json').value = '';
  });

  $('#lead-export-csv').addEventListener('click', () => {
    const records = loadRecords();
    if (!records.length) return toast('No records yet', 'warn');
    download(`charge-scout-consolidated-${stamp()}.csv`, toCSV(records),
             'text/csv;charset=utf-8');
    toast(`Exported ${records.length} records`, 'good');
  });
  $('#lead-export-json').addEventListener('click', () => {
    const records = loadRecords();
    if (!records.length) return toast('No records yet', 'warn');
    download(`charge-scout-consolidated-${stamp()}.json`,
             JSON.stringify(records, null, 2), 'application/json');
    toast('JSON downloaded', 'good');
  });
  $('#lead-clear').addEventListener('click', () => {
    const n = loadRecords().length;
    if (!n) return;
    if (confirm(`Delete all ${n} records from this device?`)) {
      saveRecords([]);
      renderAll();
      toast('Cleared');
    }
  });
}

/* ---------------- PWA: install + service worker ---------------- */

function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline still works via cache once SW installs */ });
  }

  let deferredPrompt = null;
  const installBtn = $('#install-btn');
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });
}

/* ---------------- boot ---------------- */

document.addEventListener('DOMContentLoaded', () => {
  $('#tab-scout').addEventListener('click', () => switchTab('scout'));
  $('#tab-lead').addEventListener('click', () => switchTab('lead'));
  initScoutForm();
  initLead();
  initPWA();
  renderAll();
});
