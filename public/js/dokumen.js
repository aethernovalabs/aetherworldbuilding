// ===== Dokumen Page Logic =====
// Navigasi & collapse/expand sidebar utama ditangani awb-sidebar.js.

// Toggle Sub-sidebar Dokumen & Bab
const subsidebar = document.getElementById('doc-subsidebar');
const btnCollapseTree = document.getElementById('btn-collapse-tree');

function toggleSubSidebar() {
  if (!subsidebar) return;
  subsidebar.classList.toggle('collapsed');
  const isCol = subsidebar.classList.contains('collapsed');
  if (btnCollapseTree) btnCollapseTree.innerHTML = isCol ? '&gt;' : '&lt;';
}
if (btnCollapseTree) btnCollapseTree.addEventListener('click', toggleSubSidebar);

// 2. Right Drawer Panel Gabungan
const drawer = document.getElementById('doc-side-drawer');
const btnCloseDrawer = document.getElementById('btn-close-drawer');
const railBtnKarakter = document.getElementById('rail-btn-karakter');
const railBtnGlobe = document.getElementById('rail-btn-globe');
const railBtnPlot = document.getElementById('rail-btn-plot');

function toggleDrawer(targetBtn) {
  if (!drawer) return;
  const isOpen = drawer.classList.contains('open');
  const isSameActive = targetBtn.classList.contains('active');

  [railBtnKarakter, railBtnGlobe, railBtnPlot].forEach(b => b?.classList.remove('active'));
  if (isOpen && isSameActive) {
    drawer.classList.remove('open');
  } else {
    drawer.classList.add('open');
    targetBtn.classList.add('active');
  }
}

if (railBtnKarakter) railBtnKarakter.addEventListener('click', () => toggleDrawer(railBtnKarakter));
if (railBtnGlobe) railBtnGlobe.addEventListener('click', () => toggleDrawer(railBtnGlobe));
if (railBtnPlot) railBtnPlot.addEventListener('click', () => toggleDrawer(railBtnPlot));
if (btnCloseDrawer) {
  btnCloseDrawer.addEventListener('click', () => {
    if (drawer) drawer.classList.remove('open');
    [railBtnKarakter, railBtnGlobe, railBtnPlot].forEach(b => b?.classList.remove('active'));
  });
}

// 3. Multi-Pane Editor Grid Dinamis (AturTabDokDanBab.png)
const editorGrid = document.getElementById('editor-grid');
const openDocs = {
  'Bab 1:': 'isi dari Dokumen Bab 1',
  'Dokumen1': 'isi dari Dokumen1'
};
const layoutZones = {
  1: ['a'],
  2: ['a', 'b'],
  3: ['a', 'b'],
  4: ['a', 'b', 'c'],
  5: ['a', 'b', 'c'],
  6: ['a', 'b', 'c', 'd'],
  7: ['a', 'b', 'c'],
  8: ['a', 'b', 'c'],
  9: ['a', 'b', 'c'],
  10: ['a', 'b', 'c']
};
const paneTabs = { a: ['Bab 1:', 'Dokumen1'], b: [], c: [], d: [] };
const paneActive = { a: 'Bab 1:', b: null, c: null, d: null };
const paneBodies = {};
let activeLayout = '8';
let editorBody = null;

function renderEditorGrid() {
  if (!editorGrid) return;
  const zones = layoutZones[activeLayout] || ['a'];
  const zoneSet = new Set(zones);

  Object.keys(paneTabs).forEach(zone => {
    if (!zoneSet.has(zone)) {
      const moving = paneTabs[zone].filter(t => !(paneTabs.a.includes(t)));
      moving.forEach(t => { if (!paneTabs.a.includes(t)) paneTabs.a.push(t); });
      paneTabs[zone] = [];
      paneActive[zone] = null;
    }
  });

  Object.keys(paneTabs).forEach(zone => {
    if (zoneSet.has(zone) && !paneActive[zone] && paneTabs[zone].length) {
      paneActive[zone] = paneTabs[zone][0];
    }
  });

  const cols = activeLayout === '1' ? '1fr'
    : activeLayout === '2' ? '1fr 1fr'
      : activeLayout === '3' ? '1fr'
        : activeLayout === '4' ? '1fr 1fr 1fr'
          : activeLayout === '5' ? '1fr'
            : activeLayout === '6' ? '1fr 1fr'
              : activeLayout === '7' ? '1fr 1fr'
                : activeLayout === '8' ? '1.2fr 1fr'
                  : activeLayout === '9' ? '1fr 1fr'
                    : '1fr 1fr';
  const rows = activeLayout === '1' ? '1fr'
    : activeLayout === '2' ? '1fr'
      : activeLayout === '3' ? '1fr 1fr'
        : activeLayout === '4' ? '1fr'
          : activeLayout === '5' ? '1fr 1fr 1fr'
            : activeLayout === '6' ? '1fr 1fr'
              : activeLayout === '7' ? '1fr 1fr'
                : activeLayout === '8' ? '1fr 1fr'
                  : activeLayout === '9' ? '1fr 1fr'
                    : '1fr 1fr';
  editorGrid.style.gridTemplateColumns = cols;
  editorGrid.style.gridTemplateRows = rows;

  const areaMap = {
    1: ['a'],
    2: ['a b'],
    3: ['a', 'b'],
    4: ['a b c'],
    5: ['a', 'b', 'c'],
    6: ['a b', 'c d'],
    7: ['a a', 'b c'],
    8: ['a b', 'a c'],
    9: ['a b', 'c c'],
    10: ['a c', 'b c']
  };
  editorGrid.style.gridTemplateAreas = (areaMap[activeLayout] || ['a']).map(r => `"${r}"`).join(' ');

  editorGrid.innerHTML = '';
  zones.forEach(zone => {
    const cell = document.createElement('div');
    cell.className = 'editor-pane-cell';
    cell.dataset.zone = zone;
    cell.style.gridArea = zone;

    const tabsBar = document.createElement('div');
    tabsBar.className = 'pane-tabs-bar';
    paneTabs[zone].forEach(title => {
      const tab = document.createElement('div');
      tab.className = 'pane-tab' + (paneActive[zone] === title ? ' active' : '');
      tab.draggable = true;
      tab.dataset.title = title;
      tab.dataset.zone = zone;
      tab.innerHTML = `<iconify-icon icon="lucide:file-text" width="13"></iconify-icon> ${title} <span class="pane-tab-x">X</span>`;
      tab.addEventListener('click', (e) => {
        if (e.target.closest('.pane-tab-x')) {
          closeTab(zone, title);
          return;
        }
        paneActive[zone] = title;
        renderEditorGrid();
      });
      tab.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/doc-tab', JSON.stringify({ fromZone: zone, title }));
      });
      tabsBar.appendChild(tab);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'pane-tab-add';
    addBtn.title = 'Tambah Tab';
    addBtn.textContent = '+';
    addBtn.addEventListener('click', () => {
      const firstMissing = Object.keys(openDocs).find(t => !paneTabs[zone].includes(t));
      const title = firstMissing || ('Dokumen' + (Object.keys(openDocs).length + 1));
      openDocInPane(zone, title);
    });
    tabsBar.appendChild(addBtn);
    cell.appendChild(tabsBar);

    const body = document.createElement('div');
    body.className = 'pane-body';
    body.contentEditable = 'true';
    if (zone === 'a') body.id = 'editor-body-main';
    const activeTitle = paneActive[zone];
    if (activeTitle && openDocs[activeTitle] !== undefined) {
      body.textContent = openDocs[activeTitle];
      body.addEventListener('input', () => { openDocs[activeTitle] = body.textContent; });
    } else {
      const notice = document.createElement('div');
      notice.className = 'pane-empty-notice';
      notice.textContent = 'Tidak ada Dokumen yang terbuka';
      body.appendChild(notice);
      body.contentEditable = 'false';
      const dropHint = document.createElement('div');
      dropHint.className = 'pane-tab';
      dropHint.innerHTML = '<iconify-icon icon="lucide:file-text" width="13"></iconify-icon> Lepaskan Dokumen ke sini';
      tabsBar.insertBefore(dropHint, addBtn);
    }
    cell.appendChild(body);
    paneBodies[zone] = body;

    cell.addEventListener('dragover', (e) => {
      e.preventDefault();
      cell.classList.add('dragover');
    });
    cell.addEventListener('dragleave', () => cell.classList.remove('dragover'));
    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      cell.classList.remove('dragover');
      try {
        const data = JSON.parse(e.dataTransfer.getData('text/doc-tab'));
        moveTab(data.fromZone, zone, data.title);
      } catch (err) { /* abaikan drop invalid */ }
    });

    editorGrid.appendChild(cell);
  });

  const mainBody = paneBodies.a;
  if (mainBody) editorBody = mainBody;
}

function openDocInPane(zone, title) {
  if (openDocs[title] === undefined) openDocs[title] = 'isi dari ' + title;
  if (!paneTabs[zone].includes(title)) paneTabs[zone].push(title);
  paneActive[zone] = title;
  renderEditorGrid();
}

function moveTab(fromZone, toZone, title) {
  if (fromZone === toZone) return;
  paneTabs[fromZone] = paneTabs[fromZone].filter(t => t !== title);
  if (paneActive[fromZone] === title) paneActive[fromZone] = paneTabs[fromZone][0] || null;
  if (!paneTabs[toZone].includes(title)) paneTabs[toZone].push(title);
  paneActive[toZone] = title;
  renderEditorGrid();
}

function closeTab(zone, title) {
  paneTabs[zone] = paneTabs[zone].filter(t => t !== title);
  if (paneActive[zone] === title) paneActive[zone] = paneTabs[zone][0] || null;
  renderEditorGrid();
}

function openDocEverywhere(title) {
  openDocInPane('a', title);
}

renderEditorGrid();

// 4. View Switcher (Dokumen Lore vs Papan vs Plot Grid)
const viewEditorPanes = document.getElementById('view-editor-panes');
const viewPapanCanvas = document.getElementById('view-papan-canvas');
const viewPlotGridCanvas = document.getElementById('view-plotgrid-canvas');
const mainDocToolbar = document.getElementById('main-doc-toolbar');
const papanDocToolbar = document.getElementById('papan-doc-toolbar');
const boardTitleDisplay = document.getElementById('board-title-display');
const boardDimDisplay = document.getElementById('board-dim-display');
const boardCellsDisplay = document.getElementById('board-cells-display');

function showView(type, title = 'Nama Papan', dim = '3 × 3', cells = '9 total sel') {
  if (viewEditorPanes) viewEditorPanes.style.display = 'none';
  if (viewPapanCanvas) viewPapanCanvas.style.display = 'none';
  if (viewPlotGridCanvas) viewPlotGridCanvas.style.display = 'none';
  if (mainDocToolbar) mainDocToolbar.style.display = 'none';
  if (papanDocToolbar) papanDocToolbar.style.display = 'none';

  if (type === 'lore') {
    if (viewEditorPanes) viewEditorPanes.style.display = 'flex';
    if (mainDocToolbar) mainDocToolbar.style.display = 'flex';
  } else if (type === 'papan') {
    if (viewPapanCanvas) viewPapanCanvas.style.display = 'flex';
    if (papanDocToolbar) papanDocToolbar.style.display = 'flex';
    if (boardTitleDisplay) boardTitleDisplay.textContent = title;
    if (boardDimDisplay) boardDimDisplay.textContent = dim;
    if (boardCellsDisplay) boardCellsDisplay.textContent = cells;
  } else if (type === 'plotgrid') {
    if (viewPlotGridCanvas) viewPlotGridCanvas.style.display = 'flex';
    if (papanDocToolbar) papanDocToolbar.style.display = 'flex';
    if (boardTitleDisplay) boardTitleDisplay.textContent = title;
    if (boardDimDisplay) boardDimDisplay.textContent = dim;
    if (boardCellsDisplay) boardCellsDisplay.textContent = cells;
  }
}

document.getElementById('btn-back-to-doc')?.addEventListener('click', () => showView('lore'));

document.querySelectorAll('.nav-papan').forEach(el => {
  el.addEventListener('click', () => {
    showView('papan', el.dataset.title || 'Judul', el.dataset.size || '3 × 3', el.dataset.cells || '9 total sel');
  });
});

document.querySelectorAll('.nav-plotgrid').forEach(el => {
  el.addEventListener('click', () => {
    showView('plotgrid', el.dataset.title || 'Judul', el.dataset.size || '3 × 3', el.dataset.cells || '9 total sel');
  });
});

// 5. Formatting Tools
document.getElementById('btn-fmt-bold')?.addEventListener('click', () => { if (editorBody) { editorBody.focus(); document.execCommand('bold'); } });
document.getElementById('btn-fmt-italic')?.addEventListener('click', () => { if (editorBody) { editorBody.focus(); document.execCommand('italic'); } });
document.getElementById('btn-fmt-underline')?.addEventListener('click', () => { if (editorBody) { editorBody.focus(); document.execCommand('underline'); } });
document.getElementById('btn-fmt-strike')?.addEventListener('click', () => { if (editorBody) { editorBody.focus(); document.execCommand('strikeThrough'); } });
document.getElementById('btn-fmt-head')?.addEventListener('click', () => { if (editorBody) { editorBody.focus(); document.execCommand('formatBlock', false, '<h2>'); } });
document.getElementById('btn-fmt-ul')?.addEventListener('click', () => { if (editorBody) { editorBody.focus(); document.execCommand('insertUnorderedList'); } });
document.getElementById('btn-fmt-ol')?.addEventListener('click', () => { if (editorBody) { editorBody.focus(); document.execCommand('insertOrderedList'); } });
document.getElementById('btn-tool-undo')?.addEventListener('click', () => { if (editorBody) { editorBody.focus(); document.execCommand('undo'); } });
document.getElementById('btn-tool-redo')?.addEventListener('click', () => { if (editorBody) { editorBody.focus(); document.execCommand('redo'); } });

// 6. Symbol Unik Popover
const symbolBtn = document.getElementById('btn-symbol-dropdown');
const symbolPopover = document.getElementById('popover-symbol-unik');
if (symbolBtn && symbolPopover) {
  symbolBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    symbolPopover.classList.toggle('open');
    if (layoutPopover) layoutPopover.classList.remove('open');
  });

  symbolPopover.querySelectorAll('.sym-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (editorBody) {
        editorBody.focus();
        document.execCommand('insertText', false, btn.textContent);
      }
      symbolPopover.classList.remove('open');
    });
  });
}

// 7. Layout Preset Selector Popover (AturTabDokDanBab.png)
const layoutBtn = document.getElementById('btn-layout-dropdown');
const layoutPopover = document.getElementById('popover-layout-preset');
if (layoutBtn && layoutPopover) {
  layoutBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    layoutPopover.classList.toggle('open');
    if (symbolPopover) symbolPopover.classList.remove('open');
  });

  layoutPopover.querySelectorAll('.layout-preset-box').forEach(box => {
    box.addEventListener('click', () => {
      layoutPopover.querySelectorAll('.layout-preset-box').forEach(b => b.classList.remove('active'));
      box.classList.add('active');
      activeLayout = box.dataset.layout;
      renderEditorGrid();
      layoutPopover.classList.remove('open');
    });
  });
}

// 8. Plus Lore Popover (+DokumenLore.png)
const btnPlusLore = document.getElementById('btn-plus-lore');
const plusLorePopover = document.getElementById('popover-plus-lore');
if (btnPlusLore && plusLorePopover) {
  btnPlusLore.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = btnPlusLore.getBoundingClientRect();
    plusLorePopover.style.top = (rect.bottom + 4) + 'px';
    plusLorePopover.style.left = rect.left + 'px';
    plusLorePopover.classList.toggle('open');
  });
}

// 8. Modals Manager
function openModal(id) {
  document.querySelectorAll('.doc-modal-backdrop').forEach(m => m.classList.remove('open'));
  if (plusLorePopover) plusLorePopover.classList.remove('open');
  if (symbolPopover) symbolPopover.classList.remove('open');
  if (layoutPopover) layoutPopover.classList.remove('open');
  const target = document.getElementById(id);
  if (target) target.classList.add('open');
}

function closeAllModals() {
  document.querySelectorAll('.doc-modal-backdrop').forEach(m => m.classList.remove('open'));
}

document.querySelectorAll('.modal-close-x, .modal-btn-batal').forEach(btn => {
  btn.addEventListener('click', closeAllModals);
});

// Trigger buttons for modals
document.getElementById('btn-opt-tambah-dokumen')?.addEventListener('click', () => openModal('modal-tambah-dokumen'));
document.getElementById('btn-opt-tambah-folder')?.addEventListener('click', () => openModal('modal-tambah-folder'));
document.querySelectorAll('.btn-folder-add').forEach(b => b.addEventListener('click', (e) => {
  e.stopPropagation();
  openModal('modal-tambah-dokumen');
}));
document.getElementById('btn-plus-bab')?.addEventListener('click', () => openModal('modal-tambah-bab'));
document.getElementById('btn-plus-papan')?.addEventListener('click', () => openModal('modal-buat-papan'));
document.getElementById('btn-plus-plotgrid')?.addEventListener('click', () => openModal('modal-buat-plotgrid'));

// Tambah ke Papan modal
document.querySelectorAll('.add-to-board-cell').forEach(cell => {
  cell.addEventListener('click', () => openModal('modal-tambah-ke-papan'));
});

// 8b. Klik Dokumen/Bab di tree membuka tab di pane aktif
document.querySelectorAll('#doc-subsidebar .sb-row').forEach(row => {
  if (row.classList.contains('tree-folder')) return;
  row.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    const titleEl = row.querySelector('.sb-row-title');
    if (!titleEl) return;
    const title = titleEl.childNodes[0] ? titleEl.childNodes[0].textContent.trim() : titleEl.textContent.trim();
    if (!title) return;
    document.querySelectorAll('#doc-subsidebar .sb-row').forEach(r => r.classList.remove('active'));
    row.classList.add('active');
    openDocEverywhere(title);
  });
});

// 9. Wizard Buat Papan Baru Logic (Standar, Vertikal, Horizontal, Custom)
const papanSizes = {
  standar: [
    { label: '2 × 2 (mini)', w: 2, h: 2 },
    { label: '3 × 3 (kecil)', w: 3, h: 3 },
    { label: '4 × 4 (sedang)', w: 4, h: 4 },
    { label: '5 × 5 (Besar)', w: 5, h: 5 },
    { label: '6 × 6 (sangat Besar)', w: 6, h: 6 }
  ],
  vertikal: [
    { label: '4 × 2', w: 2, h: 4 },
    { label: '6 × 2', w: 2, h: 6 },
    { label: '5 × 3', w: 3, h: 5 },
    { label: '8 × 3', w: 3, h: 8 }
  ],
  horizontal: [
    { label: '2 × 4', w: 4, h: 2 },
    { label: '2 × 6', w: 6, h: 2 },
    { label: '3 × 5', w: 5, h: 3 },
    { label: '3 × 8', w: 8, h: 3 }
  ]
};

let curPapanType = 'standar';
let curPapanW = 3;
let curPapanH = 3;
let curPapanLabel = '3 × 3 (kecil)';

const sizeOptWrap = document.getElementById('papan-size-options');
const customDimsWrap = document.getElementById('papan-custom-dims');
const previewGrid = document.getElementById('papan-preview-grid');
const previewDimLabel = document.getElementById('preview-dim-label');
const previewTotalCells = document.getElementById('preview-total-cells');
const previewDimBadge = document.getElementById('preview-dim-badge');

function updatePapanPreview(w, h, label) {
  curPapanW = w;
  curPapanH = h;
  curPapanLabel = label || `${w} × ${h}`;

  if (previewDimLabel) previewDimLabel.textContent = curPapanLabel;
  const total = w * h;
  if (previewTotalCells) previewTotalCells.textContent = `${total} total Sel`;
  if (previewDimBadge) previewDimBadge.textContent = `${w} × ${h} Dimensi`;

  if (previewGrid) {
    previewGrid.style.gridTemplateColumns = `repeat(${w}, 1fr)`;
    let html = '';
    for (let i = 0; i < total; i++) {
      html += '<div class="preview-cell">+</div>';
    }
    previewGrid.innerHTML = html;
  }
}

function renderPapanSizes(type) {
  curPapanType = type;
  if (type === 'custom') {
    const selectorWrap = document.getElementById('papan-size-selector-wrap');
    if (selectorWrap) selectorWrap.style.display = 'none';
    if (customDimsWrap) customDimsWrap.style.display = 'block';
    const w = parseInt(document.getElementById('inp-custom-w')?.value) || 3;
    const h = parseInt(document.getElementById('inp-custom-h')?.value) || 3;
    updatePapanPreview(w, h, `${w} × ${h} (Custom)`);
  } else {
    const selectorWrap = document.getElementById('papan-size-selector-wrap');
    if (selectorWrap) selectorWrap.style.display = 'block';
    if (customDimsWrap) customDimsWrap.style.display = 'none';
    const list = papanSizes[type] || [];
    if (sizeOptWrap) {
      sizeOptWrap.innerHTML = list.map((opt, idx) => `
        <div class="papan-size-opt ${idx === 1 ? 'active' : ''}" data-w="${opt.w}" data-h="${opt.h}" data-lbl="${opt.label}">
          <iconify-icon icon="lucide:grid-3x3" width="16"></iconify-icon>
          <span>${opt.label}</span>
        </div>
      `).join('');

      // select default (idx 1 or 0)
      const def = list[1] || list[0];
      if (def) updatePapanPreview(def.w, def.h, def.label);

      sizeOptWrap.querySelectorAll('.papan-size-opt').forEach(el => {
        el.addEventListener('click', () => {
          sizeOptWrap.querySelectorAll('.papan-size-opt').forEach(o => o.classList.remove('active'));
          el.classList.add('active');
          updatePapanPreview(parseInt(el.dataset.w), parseInt(el.dataset.h), el.dataset.lbl);
        });
      });
    }
  }
}

document.querySelectorAll('.papan-type-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.papan-type-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    renderPapanSizes(card.dataset.type);
  });
});

document.getElementById('inp-custom-w')?.addEventListener('input', () => {
  const w = Math.min(10, Math.max(1, parseInt(document.getElementById('inp-custom-w').value) || 1));
  const h = Math.min(10, Math.max(1, parseInt(document.getElementById('inp-custom-h').value) || 1));
  updatePapanPreview(w, h, `${w} × ${h} (Custom)`);
});
document.getElementById('inp-custom-h')?.addEventListener('input', () => {
  const w = Math.min(10, Math.max(1, parseInt(document.getElementById('inp-custom-w').value) || 1));
  const h = Math.min(10, Math.max(1, parseInt(document.getElementById('inp-custom-h').value) || 1));
  updatePapanPreview(w, h, `${w} × ${h} (Custom)`);
});

// Initial render wizard sizes
renderPapanSizes('standar');

document.getElementById('btn-confirm-buat-papan')?.addEventListener('click', () => {
  const title = document.getElementById('inp-papan-title')?.value || 'Papan Baru';
  closeAllModals();
  showView('papan', title, `${curPapanW} × ${curPapanH}`, `${curPapanW * curPapanH} total sel`);
});

document.getElementById('btn-confirm-buat-plotgrid')?.addEventListener('click', () => {
  const title = document.getElementById('inp-plotgrid-title')?.value || 'Plot Grid Baru';
  closeAllModals();
  showView('plotgrid', title, '3 × 3', '9 total sel');
});

// Close popovers on window click
window.addEventListener('click', (e) => {
  if (symbolPopover && !symbolPopover.contains(e.target) && e.target !== symbolBtn) {
    symbolPopover.classList.remove('open');
  }
  if (layoutPopover && !layoutPopover.contains(e.target) && !layoutBtn?.contains(e.target)) {
    layoutPopover.classList.remove('open');
  }
  if (plusLorePopover && !plusLorePopover.contains(e.target) && e.target !== btnPlusLore) {
    plusLorePopover.classList.remove('open');
  }
});

// 10. Initialize with AetherPageUtils - load documents from active project
async function initDokumenPage() {
  if (!window.AetherPageUtils) return;
  var utils = await window.AetherPageUtils.initPage();
  if (!utils.query) return;

  // Load documents
  var documents = await utils.query.getDocuments();
  renderDocuments(documents);

  // Make query available globally for modals
  window.dokumenQuery = utils.query;
}

function renderDocuments(documents) {
  var list = document.querySelector('#doc-subsidebar .sb-block:first-child .sb-item-list');
  if (!list) return;

  if (!documents || documents.length === 0) {
    list.innerHTML = '<div class="sb-row" style="color:#64748b;font-size:0.73rem;padding:0.5rem;text-align:center;">Belum ada dokumen</div>';
    return;
  }

  var html = documents.map(function(d) {
    var title = d.name || 'Tanpa Judul';
    var folder = d.data?.folder || '';
    var folderHtml = folder ? '<span class="sb-badge-linked">' + folder + '</span>' : '';
    return '<div class="sb-row" data-doc-id="' + d.id + '">' +
      '<iconify-icon icon="lucide:file-text" width="13"></iconify-icon>' +
      '<span class="sb-row-title">' + title + '</span>' +
      '<div class="sb-row-acts">' +
      '<button class="sb-act-icon trash" title="Hapus" onclick="event.stopPropagation();deleteDocument(' + d.id + ')"><iconify-icon icon="lucide:trash-2" width="12"></iconify-icon></button>' +
      '<button class="sb-act-icon" title="Edit" onclick="event.stopPropagation();editDocument(' + d.id + ')"><iconify-icon icon="lucide:pen-line" width="12"></iconify-icon></button>' +
      '</div>' +
      folderHtml +
      '</div>';
  }).join('');

  list.innerHTML = html;

  // Add click handlers for opening documents
  list.querySelectorAll('.sb-row[data-doc-id]').forEach(function(row) {
    row.addEventListener('click', function(e) {
      if (e.target.closest('button')) return;
      var docId = parseInt(this.dataset.docId, 10);
      openDocInPane('a', this.querySelector('.sb-row-title').textContent.trim());
      document.querySelectorAll('#doc-subsidebar .sb-row').forEach(function(r) { r.classList.remove('active'); });
      this.classList.add('active');
    });
  });
}

window.deleteDocument = async function(id) {
  if (!confirm('Hapus dokumen ini?')) return;
  if (!window.dokumenQuery) return;
  await window.dokumenQuery.deleteDocument(id);
  await window.dokumenQuery.logActivity('delete', 'document', id, 'Document', 'Dihapus dari daftar');
  var documents = await window.dokumenQuery.getDocuments();
  renderDocuments(documents);
};

window.editDocument = async function(id) {
  if (!window.dokumenQuery) return;
  var doc = await window.dokumenQuery.getDocuments().then(function(docs) { return docs.find(function(d) { return d.id === id; }); });
  if (!doc) return;
  var newName = prompt('Nama baru untuk dokumen:', doc.name);
  if (newName && newName.trim() && newName !== doc.name) {
    await window.dokumenQuery.updateDocument(id, { name: newName.trim() });
    await window.dokumenQuery.logActivity('update', 'document', id, newName.trim(), 'Nama diperbarui');
    var documents = await window.dokumenQuery.getDocuments();
    renderDocuments(documents);
  }
};

// Add document handler
document.getElementById('btn-confirm-add-doc')?.addEventListener('click', async function() {
  var nameInput = document.getElementById('inp-doc-name');
  var name = nameInput.value.trim();
  if (!name) { alert('Nama dokumen wajib diisi'); return; }
  if (!window.dokumenQuery) return;
  var link = document.getElementById('inp-doc-link')?.value;
  var doc = await window.dokumenQuery.addDocument({ name: name, data: { linkedElement: link === 'None' ? null : link } });
  await window.dokumenQuery.logActivity('create', 'document', doc.id, name, 'Dokumen baru dibuat');
  closeAllModals();
  nameInput.value = '';
  var documents = await window.dokumenQuery.getDocuments();
  renderDocuments(documents);
});

// Add folder handler
document.getElementById('btn-confirm-add-folder')?.addEventListener('click', async function() {
  var nameInput = document.getElementById('inp-folder-name');
  var name = nameInput.value.trim();
  if (!name) { alert('Nama folder wajib diisi'); return; }
  // Folder is just a document with a type flag
  if (!window.dokumenQuery) return;
  var doc = await window.dokumenQuery.addDocument({ name: name, data: { isFolder: true } });
  await window.dokumenQuery.logActivity('create', 'folder', doc.id, name, 'Folder baru dibuat');
  closeAllModals();
  nameInput.value = '';
  var documents = await window.dokumenQuery.getDocuments();
  renderDocuments(documents);
});

// Add chapter handler
document.getElementById('btn-confirm-add-bab')?.addEventListener('click', async function() {
  var nameInput = document.getElementById('inp-bab-name');
  var name = nameInput.value.trim();
  if (!name) { alert('Nama bab wajib diisi'); return; }
  if (!window.dokumenQuery) return;
  var doc = await window.dokumenQuery.addDocument({ name: name, data: { isChapter: true } });
  await window.dokumenQuery.logActivity('create', 'chapter', doc.id, name, 'Bab baru dibuat');
  closeAllModals();
  nameInput.value = '';
  var documents = await window.dokumenQuery.getDocuments();
  renderDocuments(documents);
});

initDokumenPage();
