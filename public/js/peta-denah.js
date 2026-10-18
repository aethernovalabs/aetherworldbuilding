// ===== Peta & Denah Logic =====

const MAPS = {
  map1: {
    name: 'Peta Dimensi Primal (Aethelgar, Aldoria, Mathumis)',
    nodes: {},
    blobs: {},
    customPaths: [],
    backgroundImage: null
  },
  map2: {
    name: 'Peta Pulau Nadir',
    nodes: {},
    blobs: {},
    customPaths: [],
    backgroundImage: null
  },
  map3: {
    name: 'Peta Pulau Aethelgard',
    nodes: {},
    blobs: {},
    customPaths: [],
    backgroundImage: null
  }
};
let currentMapId = 'map1';
let tempImageUrl = null;

const MAP_DATA = {
  aldoria: { name: 'Aldoria', type: 'Wilayah', coord: '48°L, 110°B', cover: '-', desc: 'Isi Deskripsi' },
  aethelgard: { name: 'Aethelgard', type: 'Kerajaan', coord: '55°L, 124°B', cover: 'Akademi Kristral, Fenguard', desc: 'Isi Deskripsi' },
  mathumis: { name: 'Mathumis', type: 'Wilayah', coord: '60°L, 132°B', cover: '-', desc: 'Isi Deskripsi' },
  akademi: { name: 'Akademi Kristral', type: 'Faksi', coord: '53°L, 120°B', cover: '-', desc: 'Isi Deskripsi' },
  fenguard: { name: 'Fenguard', type: 'Kelompok', coord: '54°L, 126°B', cover: '-', desc: 'Isi Deskripsi' },
  lembah: { name: 'Lembah Mujart', type: 'Wilayah', coord: '40°L, 100°B', cover: '-', desc: 'Isi Deskripsi' },
};
const MAP_PATHS = [];
const CUSTOM_PATHS = [];
const SPEEDS = [25, 50, 200, 0];
let mapZoom = 1;
let mapPanX = 0;
let mapPanY = 0;
let isPanning = false;
let pathMode = false;
let currentPathPoints = [];

function nodePos(el, rect) {
  return { x: parseFloat(el.dataset.x) / 100 * rect.width, y: parseFloat(el.dataset.y) / 100 * rect.height };
}
function drawMapPaths() {
  const canvas = document.getElementById('map-canvas');
  const svg = document.getElementById('map-svg');
  if (!canvas || !svg) return;
  const rect = canvas.getBoundingClientRect();
  const els = {};
  document.querySelectorAll('.map-node').forEach(m => { els[m.dataset.id] = m; });
  const speed = SPEEDS[document.getElementById('path-speed')?.selectedIndex || 0];
  svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);

  let html = '';

  // Node-to-node paths
  html += MAP_PATHS.filter(([a, b]) => els[a] && els[b]).map(([a, b, bend], i) => {
    const p1 = nodePos(els[a], rect), p2 = nodePos(els[b], rect);
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const cx = (p1.x + p2.x) / 2 + (bend || 0) * -dy, cy = (p1.y + p2.y) / 2 + (bend || 0) * dx;
    const len = Math.hypot(2 * (cx - p1.x), 2 * (cy - p1.y));
    const km = Math.round(357 + len / 10);
    const days = speed === 0 ? 0 : Math.max(1, Math.round(km / speed));
    const mode = document.getElementById('path-speed')?.value || '';
    const jalan = mode.indexOf('Jalan') !== -1 ? 'Berkuda' : mode.split(' ')[0];
    const cls = activePathIdx === i && activePathType === 'node' ? 'map-path-hit active' : 'map-path-hit';
    return `<path class="${cls}" data-path="${i}" data-pathtype="node" d="M${p1.x},${p1.y} Q${cx},${cy} ${p2.x},${p2.y}" fill="none" stroke="#7dd3fc" stroke-width="${activePathIdx === i && activePathType === 'node' ? 5 : 2.5}" stroke-dasharray="7,5" opacity="${activePathIdx === i && activePathType === 'node' ? 1 : 0.85}" style="cursor:pointer;pointer-events:stroke;"/>`
      + `<text x="${cx}" y="${cy}" text-anchor="middle" font-size="11" font-weight="700" fill="#e2e8f0" stroke="#0d121f" stroke-width="4" paint-order="stroke" transform="rotate(-18 ${cx} ${cy})">${km}Km</text>`
      + `<text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="10" fill="#94a3b8" stroke="#0d121f" stroke-width="4" paint-order="stroke" transform="rotate(-18 ${cx} ${cy + 13})">${jalan}</text>`
      + `<text x="${cx}" y="${cy + 25}" text-anchor="middle" font-size="10" fill="#94a3b8" stroke="#0d121f" stroke-width="4" paint-order="stroke" transform="rotate(-18 ${cx} ${cy + 25})">${days} Hari</text>`;
  }).join('');

  // Custom paths
  CUSTOM_PATHS.forEach((pathObj, idx) => {
    const pts = pathObj.points;
    if (pts.length < 2) return;
    const isActive = activePathIdx === idx && activePathType === 'custom';
    const pathStr = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    html += `<path class="map-path-hit" data-path="${idx}" data-pathtype="custom" d="${pathStr}" fill="none" stroke="#7dd3fc" stroke-width="${isActive ? 5 : 2.5}" stroke-dasharray="7,5" opacity="${isActive ? 1 : 0.85}" style="cursor:pointer;pointer-events:stroke;"/>`;
    pts.forEach(p => {
      html += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#38bdf8" stroke="#0d121f" stroke-width="2"/>`;
    });
  });

  // Current drawing path
  if (pathMode && currentPathPoints.length > 0) {
    const pts = currentPathPoints;
    const pathStr = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    html += `<path d="${pathStr}" fill="none" stroke="#c4b5fd" stroke-width="3" stroke-dasharray="7,5" opacity="0.8"/>`;
    pts.forEach(p => {
      html += `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#c4b5fd" stroke="#0d121f" stroke-width="2"/>`;
    });
  }

  svg.innerHTML = html;
}
let activeNodeId = null;
let activePathIdx = -1;
let activePathType = null;
function syncBlobs() {
  document.querySelectorAll('.map-node').forEach(n => {
    const id = n.dataset.id;
    const x = n.dataset.x, y = n.dataset.y;
    document.querySelectorAll(`.map-blob[data-node="${id}"]`).forEach(b => {
      b.style.left = x + '%';
      b.style.top = y + '%';
    });
  });
}
function clearSelection() {
  document.querySelectorAll('.map-node').forEach(m => m.classList.remove('active'));
  activeNodeId = null;
  activePathIdx = -1;
  activePathType = null;
  const btnDelNode = document.getElementById('btn-del-node');
  const btnDelPath = document.getElementById('btn-del-path');
  const mapInfo = document.getElementById('map-info');
  if (btnDelNode) btnDelNode.hidden = true;
  if (btnDelPath) btnDelPath.hidden = true;
  if (mapInfo) mapInfo.classList.remove('show');
  syncLuasUI();
  drawMapPaths();
}
function nodeBlob(id) {
  return document.querySelector(`.map-blob[data-node="${id}"]`);
}
function noise2D(x, y, s) { const n = Math.sin(x * 12.9898 + y * 78.233 + s * 43758.5453); return (n * 43758.5453) - Math.floor(n * 43758.5453); }
function seededNoise(angle, seed) {
  let v = 0, a = 1, f = 1;
  for (let i = 0; i < 3; i++) {
    v += noise2D(Math.cos(angle) * f, Math.sin(angle) * f, seed + i * 100) * a;
    a *= 0.5; f *= 2;
  }
  return 0.7 + 0.3 * (v / 3);
}
function organicBlobPath(w, h, seed = Date.now()) {
  const cx = w / 2, cy = h / 2;
  const baseRx = w / 2 * 0.9, baseRy = h / 2 * 0.9;
  const pts = 24;
  const points = [];
  for (let i = 0; i < pts; i++) {
    const angle = (i / pts) * Math.PI * 2;
    const r = seededNoise(angle, seed);
    const rx = baseRx * r, ry = baseRy * r;
    points.push({ x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry });
  }
  if (points.length < 4) return '';
  let d = '';
  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i - 1 + pts) % pts], p1 = points[i], p2 = points[(i + 1) % pts], p3 = points[(i + 2) % pts];
    const cp1x = p1.x + (p2.x - points[(i - 1 + pts) % pts].x) * 0.2 / 6;
    const cp1y = p1.y + (points[(i - 1 + pts) % pts].y - p2.y) * 0.2 / 6;
    const cp2x = p2.x + (p1.x - points[(i + 3) % pts].x) * 0.2 / 6;
    const cp2y = p2.y + (points[(i + 3) % pts].y - p1.y) * 0.2 / 6;
    if (i === 0) d = `M${p1.x.toFixed(1)},${p1.y.toFixed(1)} `;
    else d += `L${p1.x.toFixed(1)},${p1.y.toFixed(1)} `;
    d += `C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${(p1.x + (points[(i + 1) % pts].x - p1.x) * 0.5).toFixed(1)},${(p1.y + (points[(i + 1) % pts].y - p1.y) * 0.5).toFixed(1)} ${points[(i + 1) % pts].x.toFixed(1)},${points[(i + 1) % pts].y.toFixed(1)} `;
  }
  return d + 'Z';
}

function detectCoverage(nodeId) {
  const blob = nodeBlob(nodeId);
  const node = document.querySelector(`.map-node[data-id="${nodeId}"]`);
  if (!blob || !node) return [];

  const canvas = document.getElementById('map-canvas');
  if (!canvas) return [];
  const rect = canvas.getBoundingClientRect();

  const blobW = parseFloat(blob.style.width) || 0;
  const blobH = parseFloat(blob.style.height) || 0;
  const blobCenterX = parseFloat(node.dataset.x) / 100 * rect.width;
  const blobCenterY = parseFloat(node.dataset.y) / 100 * rect.height;

  const blobRadiusX = (blobW / 2) * 0.72;
  const blobRadiusY = (blobH / 2) * 0.72;

  const covered = [];
  document.querySelectorAll('.map-node').forEach(n => {
    if (n.dataset.id === nodeId) return;
    const nx = parseFloat(n.dataset.x) / 100 * rect.width;
    const ny = parseFloat(n.dataset.y) / 100 * rect.height;

    const dx = nx - blobCenterX;
    const dy = ny - blobCenterY;
    const normalizedDist = (dx * dx) / (blobRadiusX * blobRadiusX) + (dy * dy) / (blobRadiusY * blobRadiusY);

    if (normalizedDist < 1) {
      const name = (MAP_DATA[n.dataset.id] || {}).name || n.dataset.id;
      covered.push(name);
    }
  });

  return covered;
}

function updateCoverageInfo() {
  if (!activeNodeId) return;
  const covered = detectCoverage(activeNodeId);
  const coverText = covered.length > 0 ? covered.join(', ') : '-';
  const coverEl = document.getElementById('map-info-cover');
  if (coverEl) coverEl.textContent = coverText;

  if (MAP_DATA[activeNodeId]) {
    MAP_DATA[activeNodeId].cover = coverText;
  }
}

function blobSize(b) {
  return parseInt(b.dataset.size, 10) || parseFloat(b.style.width) || 0;
}
function applyBlobSize(b, size) {
  if (!b.dataset.baseW) { b.dataset.baseW = parseFloat(b.style.width) || 200; b.dataset.baseH = parseFloat(b.style.height) || 150; }
  const ratio = parseFloat(b.dataset.baseH) / parseFloat(b.dataset.baseW);
  if (size <= 0) { b.style.display = 'none'; b.dataset.size = '0'; return; }
  b.style.display = '';
  b.dataset.size = String(size);
  b.style.width = size + 'px';
  b.style.height = Math.round(size * ratio) + 'px';
  const path = b.querySelector('path');
  if (path) path.setAttribute('d', organicBlobPath(size, size * ratio, parseInt(b.dataset.seed, 10) || Date.now()));
  updateCoverageInfo();
}
function syncLuasUI() {
  const slider = document.getElementById('radius-input');
  const numberInput = document.getElementById('radius-number');
  const target = document.getElementById('radius-target');
  if (!slider) return;
  const b = activeNodeId ? nodeBlob(activeNodeId) : null;
  if (!activeNodeId || !b) {
    slider.disabled = true;
    if (numberInput) numberInput.disabled = true;
    if (target) target.textContent = 'Pilih node';
    if (numberInput) numberInput.value = '0';
    return;
  }
  slider.disabled = false;
  if (numberInput) numberInput.disabled = false;
  if (target) target.textContent = (MAP_DATA[activeNodeId] || {}).name || activeNodeId;
  const size = blobSize(b);
  if (numberInput) numberInput.value = String(size);
}

function selectNode(el) {
  activePathIdx = -1;
  activePathType = null;
  const btnDelPath = document.getElementById('btn-del-path');
  const btnDelNode = document.getElementById('btn-del-node');
  const mapInfo = document.getElementById('map-info');
  if (btnDelPath) btnDelPath.hidden = true;
  document.querySelectorAll('.map-node').forEach(m => m.classList.remove('active'));
  el.classList.add('active');
  activeNodeId = el.dataset.id;
  if (btnDelNode) btnDelNode.hidden = false;
  if (mapInfo) mapInfo.classList.add('show');
  const d = MAP_DATA[activeNodeId] || { name: '-', type: '-', coord: '-', cover: '-', desc: '-' };
  const nameEl = document.getElementById('map-info-name'); if (nameEl) nameEl.textContent = d.name;
  const typeEl = document.getElementById('map-info-type'); if (typeEl) typeEl.textContent = d.type;
  const coordEl = document.getElementById('map-info-coord'); if (coordEl) coordEl.textContent = d.coord;
  const covered = detectCoverage(activeNodeId);
  const coverText = covered.length > 0 ? covered.join(', ') : '-';
  const coverEl = document.getElementById('map-info-cover'); if (coverEl) coverEl.textContent = coverText;
  const descEl = document.getElementById('map-info-desc'); if (descEl) descEl.textContent = d.desc;
  syncLuasUI();
}

function attachNodeEvents(m) {
  m.addEventListener('click', e => { e.stopPropagation(); selectNode(m); });
  m.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    selectNode(m);
    const canvas = document.getElementById('map-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const startX = e.clientX, startY = e.clientY;
    const origX = parseFloat(m.dataset.x), origY = parseFloat(m.dataset.y);
    m.classList.add('dragging');
    function move(ev) {
      const nx = Math.max(0, Math.min(100, origX + (ev.clientX - startX) / rect.width * 100));
      const ny = Math.max(0, Math.min(100, origY + (ev.clientY - startY) / rect.height * 100));
      m.dataset.x = nx.toFixed(2);
      m.dataset.y = ny.toFixed(2);
      m.style.left = nx + '%';
      m.style.top = ny + '%';
      syncBlobs();
      updateCoverageInfo();
      if (activePathIdx >= 0) { activePathIdx = -1; const p = document.getElementById('btn-del-path'); if (p) p.hidden = true; }
      drawMapPaths();
    }
    function up() {
      m.classList.remove('dragging');
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
    }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  });
}

document.querySelectorAll('.map-node').forEach(attachNodeEvents);

document.getElementById('map-svg')?.addEventListener('click', e => {
  const p = e.target.closest('[data-path]');
  if (!p) return;
  e.stopPropagation();
  activePathIdx = parseInt(p.dataset.path, 10);
  activePathType = p.dataset.pathtype;
  activeNodeId = null;
  document.querySelectorAll('.map-node').forEach(m => m.classList.remove('active'));
  const btnDelNode = document.getElementById('btn-del-node'); if (btnDelNode) btnDelNode.hidden = true;
  const btnDelPath = document.getElementById('btn-del-path'); if (btnDelPath) btnDelPath.hidden = false;

  const nameEl = document.getElementById('map-info-name');
  if (activePathType === 'node') {
    const [pa, pb] = MAP_PATHS[activePathIdx] || [];
    const da = MAP_DATA[pa] || { name: '-' }, db = MAP_DATA[pb] || { name: '-' };
    if (nameEl) nameEl.textContent = da.name + ' ↔ ' + db.name;
  } else {
    if (nameEl) nameEl.textContent = 'Jalur Custom';
  }
  const typeEl = document.getElementById('map-info-type'); if (typeEl) typeEl.textContent = 'Jalur';
  const coordEl = document.getElementById('map-info-coord'); if (coordEl) coordEl.textContent = '-';
  const coverEl = document.getElementById('map-info-cover'); if (coverEl) coverEl.textContent = '-';
  const descEl = document.getElementById('map-info-desc'); if (descEl) descEl.textContent = 'Klik Hapus Jalur untuk menghapus';
  document.getElementById('map-info')?.classList.add('show');
  drawMapPaths();
});

document.getElementById('map-canvas')?.addEventListener('click', e => {
  if (e.target.closest('.map-node') || e.target.closest('[data-path]') || e.target.closest('.map-info-card')) return;
  if (pathMode) return;
  clearSelection();
});

function bindLayerToggle(id, layer) {
  const b = document.getElementById(id);
  if (!b) return;
  b.addEventListener('click', () => {
    const on = b.textContent.trim() === 'Aktif';
    b.textContent = on ? 'Mati' : 'Aktif';
    b.classList.toggle('active', !on);
    document.querySelectorAll(`.map-blob[data-layer="${layer}"]`).forEach(r => { r.style.display = on ? 'none' : 'block'; });
  });
}
bindLayerToggle('toggle-borders', 'wilayah');
bindLayerToggle('toggle-faksi', 'faksi');
bindLayerToggle('toggle-kelompok', 'kelompok');

const tp = document.getElementById('toggle-paths');
tp?.addEventListener('click', () => {
  const on = tp.textContent.trim() === 'Aktif';
  tp.textContent = on ? 'Mati' : 'Aktif';
  tp.classList.toggle('active', !on);
  const svg = document.getElementById('map-svg');
  if (svg) svg.style.display = on ? 'none' : 'block';
});

(function () {
  const slider = document.getElementById('radius-input');
  const numberInput = document.getElementById('radius-number');
  if (!slider || !numberInput) return;

  function getActiveBlob() {
    return activeNodeId ? nodeBlob(activeNodeId) : null;
  }

  function applySize(size) {
    const b = getActiveBlob();
    if (!b) return;
    applyBlobSize(b, size);
    if (numberInput) numberInput.value = String(size);
  }

  numberInput.addEventListener('input', () => {
    const size = Math.max(0, parseInt(numberInput.value, 10) || 0);
    slider.value = 50;
    applySize(size);
  });

  slider.addEventListener('pointerdown', () => {
    const b = getActiveBlob();
    if (b) b._baseSize = blobSize(b);
  });

  slider.addEventListener('input', () => {
    const b = getActiveBlob();
    if (!b || !b._baseSize) return;
    const val = parseInt(slider.value, 10);
    const scale = val <= 50 ? val / 50 : 1 + (val - 50) * 0.08;
    const next = Math.max(0, Math.round(b._baseSize * scale));
    applySize(next);
  });

  slider.addEventListener('pointerup', () => {
    slider.value = 50;
    const b = getActiveBlob();
    if (b) delete b._baseSize;
  });
  slider.addEventListener('pointercancel', () => {
    slider.value = 50;
    const b = getActiveBlob();
    if (b) delete b._baseSize;
  });
})();

document.getElementById('path-speed')?.addEventListener('change', drawMapPaths);
document.querySelector('[title="Zoom In"]')?.addEventListener('click', () => { 
  mapZoom = Math.min(2, mapZoom + 0.2); 
  updateStageTransform();
  setTimeout(drawMapPaths, 60); 
});
document.querySelector('[title="Zoom Out"]')?.addEventListener('click', () => { 
  mapZoom = Math.max(0.6, mapZoom - 0.2); 
  updateStageTransform();
  setTimeout(drawMapPaths, 60); 
});
document.querySelector('[title="Fullscreen"]')?.addEventListener('click', () => { 
  const c = document.getElementById('map-canvas'); 
  if (document.fullscreenElement) document.exitFullscreen(); 
  else c?.requestFullscreen?.(); 
  setTimeout(drawMapPaths, 300); 
});
document.querySelector('[title="Download"]')?.addEventListener('click', () => {
  const svg = document.getElementById('map-svg');
  if (!svg) return;
  const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">${svg.innerHTML}</svg>`], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'peta.svg';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});

document.getElementById('btn-del-node')?.addEventListener('click', () => {
  const a = document.querySelector('.map-node.active');
  if (a) {
    const id = a.dataset.id;
    a.remove();
    document.querySelectorAll(`.map-blob[data-node="${id}"]`).forEach(b => b.remove());
    clearSelection();
    drawMapPaths();
  }
});

document.getElementById('btn-del-path')?.addEventListener('click', () => {
  if (activePathIdx >= 0) {
    if (activePathType === 'node') {
      MAP_PATHS.splice(activePathIdx, 1);
    } else if (activePathType === 'custom') {
      CUSTOM_PATHS.splice(activePathIdx, 1);
    }
    clearSelection();
    drawMapPaths();
  }
});

document.getElementById('btn-add-path')?.addEventListener('click', () => {
  pathMode = !pathMode;
  const btn = document.getElementById('btn-add-path');
  if (!btn) return;
  if (pathMode) {
    btn.textContent = 'Tambah Jalur Aktif';
    btn.style.background = 'rgba(139, 92, 246, 0.25)';
    btn.style.borderColor = 'var(--primary)';
    currentPathPoints = [];
  } else {
    btn.textContent = '+ Tambah Jalur';
    btn.style.background = '';
    btn.style.borderColor = '';
    if (currentPathPoints.length >= 2) {
      CUSTOM_PATHS.push({ points: [...currentPathPoints], id: Date.now() });
    }
    currentPathPoints = [];
    drawMapPaths();
  }
});

let nodeCounter = 0;
function createNode(type) {
  const stage = document.getElementById('map-stage');
  if (!stage) return;
  const id = `${type}_${Date.now()}_${nodeCounter++}`;
  const x = 50 + Math.random() * 20 - 10;
  const y = 50 + Math.random() * 20 - 10;

  const colors = { lokasi: '#3333cc', faksi: '#22b8e6', kelompok: '#35c835' };
  const layerMap = { lokasi: 'wilayah', faksi: 'faksi', kelompok: 'kelompok' };
  const strokes = { lokasi: '#3333ff', faksi: '#22b8e6', kelompok: '#35c835' };

  const blob = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  blob.classList.add('map-blob');
  blob.setAttribute('data-layer', layerMap[type]);
  blob.setAttribute('data-blob', id);
  blob.setAttribute('data-node', id);
  const seed = Math.floor(Math.random() * 999999);
  blob.setAttribute('data-seed', seed);
  blob.style.top = y + '%';
  blob.style.left = x + '%';
  blob.style.width = '250px';
  blob.style.height = '180px';
  blob.setAttribute('preserveAspectRatio', 'none');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', organicBlobPath(250, 180, seed));
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', strokes[type]);
  path.setAttribute('stroke-width', '2');
  blob.appendChild(path);
  blob.dataset.baseW = '250';
  blob.dataset.baseH = '180';
  blob.dataset.size = '250';
  stage.appendChild(blob);

  const node = document.createElement('div');
  node.classList.add('map-node');
  node.dataset.x = x.toFixed(2);
  node.dataset.y = y.toFixed(2);
  node.dataset.id = id;
  node.style.top = y + '%';
  node.style.left = x + '%';

  const dot = document.createElement('span');
  dot.classList.add('map-dot');
  dot.style.background = colors[type];

  const name = document.createElement('span');
  name.classList.add('map-node-name');
  name.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Baru`;

  node.appendChild(dot);
  node.appendChild(name);
  stage.appendChild(node);

  MAP_DATA[id] = {
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Baru`,
    type: type.charAt(0).toUpperCase() + type.slice(1),
    coord: `${Math.floor(Math.random() * 90)}°L, ${Math.floor(Math.random() * 180)}°B`,
    cover: '-',
    desc: 'Deskripsi baru'
  };

  attachNodeEvents(node);
  selectNode(node);
}

document.getElementById('btn-add-lokasi')?.addEventListener('click', () => createNode('lokasi'));
document.getElementById('btn-add-faksi')?.addEventListener('click', () => createNode('faksi'));
document.getElementById('btn-add-kelompok')?.addEventListener('click', () => createNode('kelompok'));

function updateStageTransform() {
  const stage = document.getElementById('map-stage');
  if (!stage) return;
  stage.style.transform = `translate(${mapPanX}px, ${mapPanY}px) scale(${mapZoom})`;
}

document.getElementById('map-canvas')?.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.map-node') || e.target.closest('[data-path]') || e.target.closest('.map-info-card')) return;
  
  if (pathMode) {
    const canvas = document.getElementById('map-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    currentPathPoints.push({ x, y });
    drawMapPaths();
    return;
  }
  
  if (e.button === 0) {
    e.preventDefault();
    isPanning = true;
    const startX = e.clientX - mapPanX;
    const startY = e.clientY - mapPanY;
    
    function panMove(ev) {
      if (!isPanning) return;
      mapPanX = ev.clientX - startX;
      mapPanY = ev.clientY - startY;
      updateStageTransform();
    }
    
    function panUp() {
      isPanning = false;
      document.removeEventListener('pointermove', panMove);
      document.removeEventListener('pointerup', panUp);
      document.removeEventListener('pointercancel', panUp);
    }
    
    document.addEventListener('pointermove', panMove);
    document.addEventListener('pointerup', panUp);
    document.addEventListener('pointercancel', panUp);
    return;
  }
  
  clearSelection();
});

function updateMapSelect() {
  const select = document.getElementById('map-select');
  if (!select) return;
  select.innerHTML = '';
  Object.keys(MAPS).forEach(id => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = MAPS[id].name;
    if (id === currentMapId) opt.selected = true;
    select.appendChild(opt);
  });
}

document.getElementById('btn-add-map')?.addEventListener('click', () => {
  const name = prompt('Nama peta baru:');
  if (!name || !name.trim()) return;
  const id = 'map_' + Date.now();
  MAPS[id] = { name: name.trim(), nodes: {}, blobs: {}, customPaths: [] };
  currentMapId = id;
  updateMapSelect();
  document.querySelectorAll('.map-node').forEach(n => n.remove());
  document.querySelectorAll('.map-blob').forEach(b => b.remove());
  CUSTOM_PATHS.length = 0;
  clearSelection();
  drawMapPaths();
});

document.getElementById('btn-rename-map')?.addEventListener('click', () => {
  const newName = prompt('Rename peta:', MAPS[currentMapId]?.name || '');
  if (!newName || !newName.trim()) return;
  MAPS[currentMapId].name = newName.trim();
  updateMapSelect();
});

document.getElementById('btn-delete-map')?.addEventListener('click', () => {
  if (Object.keys(MAPS).length <= 1) {
    alert('Tidak bisa menghapus peta terakhir');
    return;
  }
  if (!confirm(`Hapus peta "${MAPS[currentMapId]?.name}"?`)) return;
  delete MAPS[currentMapId];
  currentMapId = Object.keys(MAPS)[0];
  updateMapSelect();
  document.querySelectorAll('.map-node').forEach(n => n.remove());
  document.querySelectorAll('.map-blob').forEach(b => b.remove());
  CUSTOM_PATHS.length = 0;
  clearSelection();
  drawMapPaths();
});

document.getElementById('map-select')?.addEventListener('change', (e) => {
  currentMapId = e.target.value;
  document.querySelectorAll('.map-node').forEach(n => n.remove());
  document.querySelectorAll('.map-blob').forEach(b => b.remove());
  CUSTOM_PATHS.length = 0;
  clearSelection();
  drawMapPaths();
});

updateMapSelect();
clearSelection();
syncBlobs();
setTimeout(drawMapPaths, 200);
setTimeout(drawMapPaths, 800);
window.addEventListener('resize', drawMapPaths);
window.addEventListener('load', drawMapPaths);

// Map Image Modal
function applyBackgroundImage(url) {
  const bgLayer = document.getElementById('map-stage-bg');
  if (!bgLayer) return;
  if (url) {
    bgLayer.style.backgroundImage = `url("${url}")`;
  } else {
    bgLayer.style.backgroundImage = '';
  }
}

document.getElementById('btn-open-image-modal')?.addEventListener('click', () => {
  const modal = document.getElementById('map-image-modal');
  const input = document.getElementById('image-url-input');
  const preview = document.getElementById('image-preview');
  if (!modal || !input || !preview) return;
  
  modal.classList.add('show');
  const currentBg = MAPS[currentMapId]?.backgroundImage || '';
  input.value = currentBg;
  tempImageUrl = currentBg;
  
  if (currentBg) {
    preview.innerHTML = `<img src="${currentBg}" alt="Preview">`;
  } else {
    preview.innerHTML = '<span class="map-image-preview-empty">Preview gambar akan muncul di sini</span>';
  }
});

document.getElementById('btn-close-image-modal')?.addEventListener('click', () => {
  document.getElementById('map-image-modal')?.classList.remove('show');
  tempImageUrl = null;
});

document.getElementById('btn-cancel-image')?.addEventListener('click', () => {
  document.getElementById('map-image-modal')?.classList.remove('show');
  tempImageUrl = null;
});

document.getElementById('btn-check-image')?.addEventListener('click', () => {
  const input = document.getElementById('image-url-input');
  const preview = document.getElementById('image-preview');
  if (!input || !preview) return;
  const url = input.value.trim();
  
  if (!url) {
    preview.innerHTML = '<span class="map-image-preview-empty">Preview gambar akan muncul di sini</span>';
    tempImageUrl = null;
    return;
  }
  
  const img = new Image();
  img.onload = () => {
    preview.innerHTML = `<img src="${url}" alt="Preview">`;
    tempImageUrl = url;
  };
  img.onerror = () => {
    preview.innerHTML = '<span class="map-image-preview-empty" style="color:#fca5a5;">URL gambar tidak valid</span>';
    tempImageUrl = null;
  };
  img.src = url;
});

document.getElementById('btn-remove-image')?.addEventListener('click', () => {
  const preview = document.getElementById('image-preview');
  const input = document.getElementById('image-url-input');
  if (preview) preview.innerHTML = '<span class="map-image-preview-empty">Preview gambar akan muncul di sini</span>';
  if (input) input.value = '';
  tempImageUrl = null;
});

document.getElementById('btn-save-image')?.addEventListener('click', () => {
  if (MAPS[currentMapId]) MAPS[currentMapId].backgroundImage = tempImageUrl;
  applyBackgroundImage(tempImageUrl);
  document.getElementById('map-image-modal')?.classList.remove('show');
  tempImageUrl = null;
});

applyBackgroundImage(MAPS[currentMapId]?.backgroundImage);

// Initialize with AetherPageUtils
async function initPetaDenahPage() {
  if (!window.AetherPageUtils) return;
  var utils = await window.AetherPageUtils.initPage();
  if (!utils.query) return;
  
  var maps = await utils.query.getMaps();
  if (maps && maps.length > 0) {
    var firstMap = maps[0];
    try {
      var mapData = JSON.parse(firstMap.svgData || '{}');
      if (mapData.nodes) {
        MAPS[currentMapId].nodes = mapData.nodes;
        MAPS[currentMapId].blobs = mapData.blobs || {};
        MAPS[currentMapId].customPaths = mapData.paths || [];
        MAPS[currentMapId].backgroundImage = mapData.backgroundImage || null;
        
        renderNodesFromDB(mapData.nodes);
        renderBlobsFromDB(mapData.blobs);
        CUSTOM_PATHS.length = 0;
        if (mapData.paths) {
          mapData.paths.forEach(function(p) { CUSTOM_PATHS.push(p); });
        }
        setTimeout(drawMapPaths, 100);
      }
    } catch (e) {
      console.warn('Failed to parse map data:', e);
    }
  }
  
  window.petaDenahQuery = utils.query;
}

function renderNodesFromDB(nodes) {
  document.querySelectorAll('.map-node').forEach(n => n.remove());
  document.querySelectorAll('.map-blob').forEach(b => b.remove());
  
  Object.entries(nodes).forEach(function([id, nodeData]) {
    var node = document.createElement('div');
    node.classList.add('map-node');
    node.dataset.x = nodeData.x || 50;
    node.dataset.y = nodeData.y || 50;
    node.dataset.id = id;
    node.style.top = (nodeData.y || 50) + '%';
    node.style.left = (nodeData.x || 50) + '%';
    
    var dot = document.createElement('span');
    dot.classList.add('map-dot');
    dot.style.background = nodeData.color || '#3333cc';
    
    var name = document.createElement('span');
    name.classList.add('map-node-name');
    name.textContent = nodeData.name || id;
    
    node.appendChild(dot);
    node.appendChild(name);
    document.getElementById('map-stage')?.appendChild(node);
    
    attachNodeEvents(node);
  });
  
  syncBlobs();
}

function renderBlobsFromDB(blobs) {
  Object.entries(blobs).forEach(function([id, blobData]) {
    var blob = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    blob.classList.add('map-blob');
    blob.setAttribute('data-layer', blobData.layer || 'wilayah');
    blob.setAttribute('data-blob', blobData.blobId || id);
    blob.setAttribute('data-node', id);
    blob.style.top = (blobData.y || 50) + '%';
    blob.style.left = (blobData.x || 50) + '%';
    blob.style.width = (blobData.width || 250) + 'px';
    blob.style.height = (blobData.height || 180) + 'px';
    blob.setAttribute('preserveAspectRatio', 'none');
    blob.dataset.baseW = String(blobData.width || 250);
    blob.dataset.baseH = String(blobData.height || 180);
    blob.dataset.size = String(blobData.width || 250);
    
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', blobData.path || organicBlobPath(blobData.width || 250, blobData.height || 180, blobData.seed || Date.now()));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', blobData.stroke || '#3333ff');
    path.setAttribute('stroke-width', '2');
    blob.appendChild(path);
    
    document.getElementById('map-stage')?.appendChild(blob);
  });
}

initPetaDenahPage();
