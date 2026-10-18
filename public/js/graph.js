// ===== Graph / Jaringan Logic =====

// Mode switch
document.querySelectorAll('.net-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.net-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const mode = btn.dataset.mode;
    const viewGraph = document.getElementById('view-graph');
    const viewRelasi = document.getElementById('view-relasi');
    const viewPower = document.getElementById('view-power');
    const tools = document.getElementById('graph-tools');
    const filterBar = document.getElementById('graph-filter-bar');
    if (mode === 'graph') {
      if (viewGraph) viewGraph.style.display = 'flex';
      if (viewRelasi) viewRelasi.style.display = 'none';
      if (viewPower) viewPower.style.display = 'none';
      if (tools) tools.style.display = 'flex';
      if (filterBar) filterBar.style.display = 'flex';
      setTimeout(drawLines, 50);
    } else if (mode === 'relasi') {
      if (viewGraph) viewGraph.style.display = 'none';
      if (viewRelasi) viewRelasi.style.display = 'flex';
      if (viewPower) viewPower.style.display = 'none';
      if (tools) tools.style.display = 'none';
      if (filterBar) filterBar.style.display = 'none';
    } else if (mode === 'power') {
      if (viewGraph) viewGraph.style.display = 'none';
      if (viewRelasi) viewRelasi.style.display = 'none';
      if (viewPower) viewPower.style.display = 'flex';
      if (tools) tools.style.display = 'none';
      if (filterBar) filterBar.style.display = 'none';
    }
  });
});

// View Hubungan: list / grid
document.querySelectorAll('#view-relasi .view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#view-relasi .view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#view-relasi .rel-cards').forEach(c => c.classList.toggle('grid-mode', btn.dataset.relView === 'grid'));
  });
});

// Filter buttons
document.querySelectorAll('.net-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
  });
});

// Drag nodes (graph mode)
let dragNode = null, dragOffsetX = 0, dragOffsetY = 0;
let scale = 1, panX = 0, panY = 0;

document.querySelectorAll('.net-node').forEach(node => {
  node.addEventListener('pointerdown', e => {
    const activeBtn = document.querySelector('.net-mode-btn.active');
    if (activeBtn && activeBtn.dataset.mode !== 'graph') return;
    dragNode = node;
    const rect = node.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    node.classList.add('dragging');
  });
});

document.addEventListener('pointermove', e => {
  if (!dragNode) return;
  const canvas = document.getElementById('view-graph');
  if (!canvas) return;
  const cRect = canvas.getBoundingClientRect();
  const x = (e.clientX - cRect.left - panX) / scale - dragOffsetX;
  const y = (e.clientY - cRect.top - panY) / scale - dragOffsetY;
  dragNode.style.left = `${x}px`;
  dragNode.style.top = `${y}px`;
  drawLines();
});

document.addEventListener('pointerup', () => {
  if (dragNode) {
    dragNode.classList.remove('dragging');
    dragNode = null;
  }
});

// Draw connection lines with SVG
function drawLines() {
  const canvas = document.getElementById('view-graph');
  const svg = document.getElementById('net-svg');
  if (!canvas || !svg) return;
  const cRect = canvas.getBoundingClientRect();
  const nodes = {
    kael: document.querySelector('[data-id="kael"]'),
    lyra: document.querySelector('[data-id="lyra"]'),
    valdris: document.querySelector('[data-id="valdris"]'),
    nadir: document.querySelector('[data-id="nadir"]'),
    akademi: document.querySelector('[data-id="akademi"]'),
    aethelgard: document.querySelector('[data-id="aethelgard"]')
  };
  const centers = {};
  for (const [k, el] of Object.entries(nodes)) {
    if (el) {
      const x = el.offsetLeft + el.offsetWidth / 2;
      const y = el.offsetTop + el.offsetHeight / 2;
      centers[k] = { x, y };
    }
  }
  const lines = [
    { from: 'kael', to: 'lyra', color: '#10b981', dash: '', label: 'Sekutu' },
    { from: 'kael', to: 'valdris', color: '#ef4444', dash: '6,4', label: 'Musuh' },
    { from: 'lyra', to: 'valdris', color: '#f59e0b', dash: '4,4', label: 'Rival' },
    { from: 'kael', to: 'nadir', color: '#38bdf8', dash: '3,3', label: 'Asal' },
    { from: 'lyra', to: 'akademi', color: '#c4b5fd', dash: '', label: 'Anggota' },
    { from: 'valdris', to: 'aethelgard', color: '#ef4444', dash: '', label: 'Target' },
    { from: 'akademi', to: 'aethelgard', color: '#10b981', dash: '4,4', label: 'Pasokan' },
    { from: 'kael', to: 'akademi', color: '#c4b5fd', dash: '2,3', label: 'Alumni' },
    { from: 'lyra', to: 'nadir', color: '#38bdf8', dash: '', label: 'Tinggal' },
  ];
  svg.setAttribute('width', cRect.width);
  svg.setAttribute('height', cRect.height);
  svg.innerHTML = lines
    .filter(l => centers[l.from] && centers[l.to])
    .map(l => {
      const a = centers[l.from], b = centers[l.to];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${l.color}" stroke-width="2" stroke-dasharray="${l.dash}" opacity="0.65"/>`
        + `<circle cx="${a.x}" cy="${a.y}" r="3.5" fill="${l.color}"/>`
        + `<circle cx="${b.x}" cy="${b.y}" r="3.5" fill="${l.color}"/>`
        + `<text x="${mx}" y="${my - 6}" text-anchor="middle" font-size="10" font-weight="700" fill="${l.color}" stroke="#0d121f" stroke-width="3" paint-order="stroke">${l.label}</text>`;
    })
    .join('');
}

setTimeout(drawLines, 200);
setTimeout(drawLines, 700);
setTimeout(drawLines, 1500);

// Zoom controls
const viewGraph = document.getElementById('view-graph');
const viewport = document.getElementById('viewport');

function updateTransform(){
  if (viewport) viewport.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

document.querySelector('[title="Zoom In"]')?.addEventListener('click', () => { scale *= 1.2; updateTransform(); });
document.querySelector('[title="Zoom Out"]')?.addEventListener('click', () => { scale /= 1.2; updateTransform(); });
document.querySelector('[title="Reset View"]')?.addEventListener('click', () => { scale = 1; panX = 0; panY = 0; updateTransform(); });

// Pan canvas (graph mode) – avoid conflict with node drag
let panStart = null;
if (viewGraph) {
  viewGraph.addEventListener('pointerdown', e => {
    if (e.target.closest('.net-node')) return;
    const activeBtn = document.querySelector('.net-mode-btn.active');
    if (activeBtn && activeBtn.dataset.mode !== 'graph') return;
    panStart = { x: e.clientX, y: e.clientY, startX: panX, startY: panY };
  });
}

document.addEventListener('pointermove', e => {
  if (!panStart) return;
  panX = panStart.startX + (e.clientX - panStart.x);
  panY = panStart.startY + (e.clientY - panStart.y);
  updateTransform();
});
document.addEventListener('pointerup', () => { panStart = null; });
window.addEventListener('load', drawLines);
window.addEventListener('resize', drawLines);

// Initialize with AetherPageUtils
async function initGraphPage() {
  if (!window.AetherPageUtils) return;
  var utils = await window.AetherPageUtils.initPage();
  if (!utils.query) return;
  
  // Load characters and elements for graph nodes
  var characters = await utils.query.getCharacters();
  var elements = await utils.query.getElements();
  
  // Render nodes from database
  renderGraphNodes(characters, elements);
  
  // Load relationships
  loadRelationships(utils.query);
  
  window.graphQuery = utils.query;
}

function renderGraphNodes(characters, elements) {
  var viewportEl = document.getElementById('viewport');
  if (!viewportEl) return;
  
  // Clear existing dynamic nodes (keep static ones for now)
  var existingNodes = viewportEl.querySelectorAll('.net-node:not([data-static])');
  existingNodes.forEach(n => n.remove());
  
  // Add character nodes
  var positions = [
    { left: '25%', top: '20%' },
    { left: '50%', top: '35%' },
    { left: '75%', top: '55%' },
    { left: '15%', top: '65%' },
    { left: '85%', top: '20%' },
    { left: '50%', top: '75%' },
  ];
  
  var idx = 0;
  characters.forEach(function(c) {
    if (idx >= positions.length) return;
    var pos = positions[idx++];
    var node = document.createElement('div');
    node.className = 'net-node net-node-main';
    node.dataset.id = 'char-' + c.id;
    node.dataset.type = 'karakter';
    node.style.left = pos.left;
    node.style.top = pos.top;
    node.innerHTML = '<iconify-icon icon="lucide:user"></iconify-icon><span>' + (c.name || 'Unknown') + '</span><span class="net-node-label">Karakter</span>';
    viewportEl.appendChild(node);
  });
  
  // Add element nodes (locations, factions, etc.)
  var elementTypes = ['Lokasi', 'Faksi', 'Organisasi'];
  elements.filter(function(e) { return elementTypes.includes(e.type); }).forEach(function(e) {
    if (idx >= positions.length) return;
    var pos = positions[idx++];
    var iconMap = { 'Lokasi': 'lucide:map-pin', 'Faksi': 'lucide:building-2', 'Organisasi': 'lucide:users' };
    var classMap = { 'Lokasi': 'net-node-location', 'Faksi': 'net-node-faction', 'Organisasi': 'net-node-secondary' };
    var node = document.createElement('div');
    node.className = 'net-node ' + (classMap[e.type] || 'net-node-secondary');
    node.dataset.id = 'elem-' + e.id;
    node.dataset.type = e.type.toLowerCase();
    node.style.left = pos.left;
    node.style.top = pos.top;
    node.innerHTML = '<iconify-icon icon="' + (iconMap[e.type] || 'lucide:gem') + '"></iconify-icon><span>' + (e.name || 'Unknown') + '</span><span class="net-node-label">' + e.type + '</span>';
    viewportEl.appendChild(node);
  });
  
  setTimeout(drawLines, 100);
}

async function loadRelationships(query) {
  // Load from elements with type 'Hubungan' or from a dedicated table
  // For now, this is a placeholder
  console.log('Loading relationships...');
}

function openNodeDetail(id) {
  console.log('openNodeDetail:', id);
}

initGraphPage();
