// Element Dunia Main Logic
const ELEMENT_TYPES = [
  'Makhluk', 'Faksi', 'Pekerjaan', 'Lokasi', 'Agama', 'Sistem Sihir',
  'Teknologi', 'Bahasa', 'Item', 'Kelompok', 'Dewa', 'Gelar', 'Spesies', 'Power Tier'
];

const MODAL_MAP = {
  'Makhluk': 'modal-buat-makhluk',
  'Faksi': 'modal-buat-faksi',
  'Pekerjaan': 'modal-buat-pekerjaan',
  'Lokasi': 'modal-buat-lokasi',
  'Agama': 'modal-buat-agama',
  'Sistem Sihir': 'modal-buat-sihir',
  'Teknologi': 'modal-buat-teknologi',
  'Bahasa': 'modal-buat-bahasa',
  'Item': 'modal-buat-item',
  'Kelompok': 'modal-buat-kelompok',
  'Dewa': 'modal-buat-dewa',
  'Gelar': 'modal-buat-gelar',
  'Spesies': 'modal-buat-spesies',
  'Power Tier': 'modal-buat-tier',
};

var allElements = [];
var currentViewMode = 'grid';
var currentSearchTerm = '';
var currentEditingType = null;
var currentEditingId = null;

function debounce(fn, ms) {
  var timer;
  return function() {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, arguments), ms);
  };
}

// Save element form - called from modal button onclick
window.saveElementForm = async function(type) {
  const modalId = MODAL_MAP[type];
  const modal = document.getElementById(modalId);
  if (!modal) return;

  // Validate nama wajib
  const nameInputs = modal.querySelectorAll('input[type="text"]');
  const nameInput = nameInputs[0]; // First text input is always Name
  if (!nameInput || !nameInput.value.trim()) {
    alert('Nama elemen wajib diisi');
    return;
  }

  const id = currentEditingId;
  const descInput = modal.querySelectorAll('textarea')[0]; // First textarea is description
  const imgInput = modal.querySelector('.elem-img-url'); // Image URL dari hidden input
  const tagBadges = modal.querySelectorAll('.badge');

  const data = {
    name: nameInput.value.trim(),
    type: type,
    data: {
      description: descInput?.value || '',
      imageUrl: imgInput?.value || '',
      tags: Array.from(tagBadges).map(b => b.textContent.replace(/\s*[xX]\s*$/, '').trim()).filter(t => t),
      extraFields: {},
      linkedElements: {}
    }
  };

  // Collect extra fields
  const extraItems = modal.querySelectorAll('.extra-item');
  extraItems.forEach(item => {
    const inputs = item.querySelectorAll('input[type="text"]');
    const selects = item.querySelectorAll('select');
    if (inputs.length >= 1 && selects.length >= 1 && inputs[0].value.trim()) {
      data.data.extraFields[inputs[0].value.trim()] = {
        type: selects[0].value || 'text',
        value: inputs.length > 1 ? inputs[inputs.length - 1].value : ''
      };
    }
  });

  try {
    if (id) {
      await window.elementDuniaQuery.updateElement(id, data);
      await window.elementDuniaQuery.logActivity('update', 'element', id, data.name, `${type} diperbarui`);
    } else {
      const created = await window.elementDuniaQuery.addElement(data);
      await window.elementDuniaQuery.logActivity('create', 'element', created.id, data.name, `${type} dibuat`);
    }

    modal.classList.remove('open');
    currentEditingId = null;
    currentEditingType = null;
    
    // Reload data
    const utils = await window.AetherPageUtils.initPage();
    if (utils.query) {
      var promises = ELEMENT_TYPES.map(t => utils.query.getElements(t));
      var results = await Promise.all(promises);
      
      allElements = [];
      ELEMENT_TYPES.forEach((t, idx) => {
        if (results[idx]) {
          allElements = allElements.concat(results[idx].map(e => Object.assign({}, e, { _type: t })));
        }
      });

      filterAndRender();
      updateCategoryCounts();
    }
  } catch (err) {
    console.error('Error saving element:', err);
    alert('Gagal menyimpan elemen: ' + err.message);
  }
};

document.getElementById('btn-collapse-cat')?.addEventListener('click', e => { const btn = e.currentTarget; const c = btn.closest('.elem-cat'); c?.classList.toggle('collapsed'); btn.textContent = c?.classList.contains('collapsed') ? '>' : '<'; });
document.getElementById('btn-entry-element')?.addEventListener('click', () => document.getElementById('modal-pilih-entry').classList.add('open'));
document.getElementById('btn-custom-element')?.addEventListener('click', () => document.getElementById('modal-custom').classList.add('open'));

document.querySelector('#modal-pilih-entry .modal-body')?.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const t = b.textContent;
  for (const k in MODAL_MAP) {
    if (t.includes(k)) {
      document.getElementById('modal-pilih-entry').classList.remove('open');
      openElementForm(k);
      break;
    }
  }
});

function setView(v) {
  currentViewMode = v;
  document.querySelectorAll('.elem-cards').forEach(c => c.classList.toggle('list-mode', v === 'list'));
  document.getElementById('view-grid')?.classList.toggle('active', v === 'grid');
  document.getElementById('view-list')?.classList.toggle('active', v === 'list');
}

document.getElementById('view-grid')?.addEventListener('click', () => setView('grid'));
document.getElementById('view-list')?.addEventListener('click', () => setView('list'));

document.querySelector('.search-field')?.addEventListener('input', debounce(function(e) {
  currentSearchTerm = e.target.value.toLowerCase();
  filterAndRender();
}, 300));

document.querySelectorAll('.elem-cat-item').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.elem-cat-item').forEach(x => x.classList.remove('active'));
    this.classList.add('active');
    filterAndRender();
  });
});

document.addEventListener('click', e => {
  const add = e.target.closest('.extra-add,.extra-add-top');
  if (add) { const w = add.closest('.extra-wrap'); const l = w?.querySelector('.extra-list'); const f = l?.querySelector('.extra-item'); if (l && f) l.appendChild(f.cloneNode(true)); return; }
  const del = e.target.closest('.extra-del');
  if (del) { const w = del.closest('.extra-wrap'); const l = w?.querySelector('.extra-list'); const it = del.closest('.extra-item'); if (l && it && l.querySelectorAll('.extra-item').length > 1) it.remove(); return; }
});

async function initElementDuniaPage() {
  if (!window.AetherPageUtils) return;
  var utils = await window.AetherPageUtils.initPage();
  if (!utils.query) {
    console.warn('Tidak ada proyek aktif');
    return;
  }

  window.elementDuniaQuery = utils.query;
  
  // Load hanya element yang sudah dibuat (jangan placeholder)
  var promises = ELEMENT_TYPES.map(type => utils.query.getElements(type));
  var results = await Promise.all(promises);
  
  allElements = [];
  ELEMENT_TYPES.forEach((type, idx) => {
    if (results[idx]) {
      allElements = allElements.concat(results[idx].map(e => Object.assign({}, e, { _type: type })));
    }
  });

  renderGroups();
  updateCategoryCounts();
}

function renderGroups() {
  const container = document.getElementById('elem-groups-container');
  if (!container) return;

  container.innerHTML = ELEMENT_TYPES.map(type => `
    <div class="elem-group open" data-type="${type}">
      <button class="elem-group-head" onclick="this.parentElement.classList.toggle('open')">
        ${type}
        <span class="chev" style="margin-left:auto;display:inline-block;transition:transform .15s;">v</span>
      </button>
      <div class="elem-cards"></div>
    </div>
  `).join('');

  filterAndRender();
}

function filterAndRender() {
  const activeCategory = document.querySelector('.elem-cat-item.active');
  const selectedType = activeCategory?.textContent.includes('Semua') ? null : activeCategory?.textContent.trim().split('\n')[0];

  // Group by type and filter
  var groups = {};
  ELEMENT_TYPES.forEach(t => groups[t] = []);

  allElements.forEach(e => {
    if (selectedType && e._type !== selectedType) return;
    if (currentSearchTerm && !e.name.toLowerCase().includes(currentSearchTerm)) return;
    groups[e._type].push(e);
  });

  // Render each group
  ELEMENT_TYPES.forEach(type => {
    const groupEl = document.querySelector(`[data-type="${type}"]`);
    if (!groupEl) return;
    const cardsContainer = groupEl.querySelector('.elem-cards');
    if (!cardsContainer) return;

    const elements = groups[type];
    if (elements.length === 0) {
      cardsContainer.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-faint);font-size:0.85rem;">Belum ada ${type}</div>`;
      return;
    }

    cardsContainer.className = 'elem-cards' + (currentViewMode === 'list' ? ' list-mode' : '');
    cardsContainer.innerHTML = elements.map(e => renderCard(e, type)).join('');
  });
}

function renderCard(e, type) {
  const imgUrl = e.data?.imageUrl || e.data?.image || '';
  const img = imgUrl ? `<img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover;">` : '<iconify-icon icon="lucide:image" width="28"></iconify-icon>';
  const desc = e.data?.description || '';
  const tags = (e.data?.tags || []).join(' ');

  return `<div class="elem-card">
    <div class="elem-card-top"><span class="elem-thumb">${img}</span><span class="elem-card-type">${type}</span></div>
    <div class="elem-card-body">
      <div class="elem-card-headrow">
        <div class="elem-card-name">${e.name || 'Unknown'}</div>
        <div class="elem-card-actions">
          <iconify-icon icon="lucide:pen-line" width="14" onclick="event.stopPropagation();openElementForm('${type}', ${e.id})" style="cursor:pointer;"></iconify-icon>
          <iconify-icon icon="lucide:trash-2" width="14" style="color:var(--danger);cursor:pointer;" onclick="event.stopPropagation();deleteElement(${e.id})"></iconify-icon>
        </div>
      </div>
      <div class="elem-card-desc">${desc}</div>
      <div class="elem-card-tags">${tags}</div>
    </div>
  </div>`;
}

function updateCategoryCounts() {
  const counts = {};
  ELEMENT_TYPES.forEach(t => counts[t] = 0);
  allElements.forEach(e => counts[e._type]++);

  document.querySelectorAll('.elem-cat-item').forEach((btn, i) => {
    const text = btn.textContent.trim();
    if (text.includes('Semua Element')) {
      const countEl = btn.querySelector('.elem-count');
      if (countEl) countEl.textContent = allElements.length;
    } else {
      for (const type of ELEMENT_TYPES) {
        if (text.includes(type)) {
          const countEl = btn.querySelector('.elem-count');
          if (countEl) countEl.textContent = counts[type];
          break;
        }
      }
    }
  });
}

function clearFormData(modal) {
  modal.querySelectorAll('input[type="text"], input[type="number"], textarea, select').forEach(f => f.value = '');
  modal.querySelectorAll('input[type="checkbox"]').forEach(f => f.checked = false);
  modal.querySelectorAll('.badge').forEach(b => b.remove());
  modal.querySelectorAll('.extra-item').forEach((item, i) => i > 0 && item.remove());
}

// Image preview popup handlers
var currentImageButton = null;

window.openElementImagePopup = function(button) {
  currentImageButton = button;
  const modal = button.closest('.modal-overlay') || button.closest('[class*="modal"]');
  const imgUrlInput = modal?.querySelector('.elem-img-url');
  
  const popInput = document.getElementById('elem-pop-img-url');
  if (popInput) popInput.value = imgUrlInput?.value || '';
  updateImagePreview();
  document.getElementById('pop-elem-img')?.classList.add('open');
};

function updateImagePreview() {
  const inputEl = document.getElementById('elem-pop-img-url');
  const preview = document.getElementById('elem-pop-img-preview');
  if (!inputEl || !preview) return;
  const url = inputEl.value.trim();
  
  if (!url) {
    preview.textContent = 'Masukkan URL gambar untuk melihat pratinjau';
    return;
  }

  const img = document.createElement('img');
  img.src = url;
  img.onload = function() {
    preview.innerHTML = '';
    preview.appendChild(img);
  };
  img.onerror = function() {
    preview.textContent = 'URL gambar tidak valid';
  };
  preview.textContent = 'Loading...';
}

window.saveElementImagePreview = function() {
  if (!currentImageButton) return;
  
  const inputEl = document.getElementById('elem-pop-img-url');
  const url = inputEl?.value.trim() || '';
  if (!url) {
    alert('Masukkan URL gambar');
    return;
  }

  const modal = currentImageButton.closest('.modal-overlay') || currentImageButton.closest('[class*="modal"]');
  const imgUrlInput = modal?.querySelector('.elem-img-url');
  const imgPreview = modal?.querySelector('.elem-img-preview');
  
  if (imgUrlInput) imgUrlInput.value = url;
  
  if (imgPreview) {
    const img = document.createElement('img');
    img.src = url;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    img.onload = function() {
      imgPreview.innerHTML = '';
      imgPreview.appendChild(img);
    };
    img.onerror = function() {
      imgPreview.textContent = 'URL tidak valid';
    };
  }

  document.getElementById('pop-elem-img')?.classList.remove('open');
  currentImageButton = null;
};

// Live preview di image URL input
document.getElementById('elem-pop-img-url')?.addEventListener('input', updateImagePreview);

window.openElementForm = function(type, id) {
  const modalId = MODAL_MAP[type];
  if (!modalId) return;
  
  const modal = document.getElementById(modalId);
  if (!modal) return;

  clearFormData(modal);
  
  if (id) {
    const elem = allElements.find(e => e.id === id);
    if (elem) {
      const nameInputs = modal.querySelectorAll('input[type="text"]');
      if (nameInputs[0]) nameInputs[0].value = elem.name;

      const textareas = modal.querySelectorAll('textarea');
      if (textareas[0]) textareas[0].value = elem.data?.description || '';

      // Load image ke preview & hidden input
      const imgUrl = elem.data?.imageUrl || '';
      const imgUrlInput = modal.querySelector('.elem-img-url');
      const imgPreview = modal.querySelector('.elem-img-preview');
      
      if (imgUrlInput) imgUrlInput.value = imgUrl;
      if (imgUrl && imgPreview) {
        const img = document.createElement('img');
        img.src = imgUrl;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        img.onload = function() {
          imgPreview.innerHTML = '';
          imgPreview.appendChild(img);
        };
      }

      // Load tags
      if (elem.data?.tags && elem.data.tags.length > 0) {
        const tagInputDiv = Array.from(modal.querySelectorAll('input[type="text"]')).find(inp => inp.placeholder && inp.placeholder.includes('Tag'))?.parentElement;
        if (tagInputDiv) {
          elem.data.tags.forEach(tag => {
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = tag + ' x';
            tagInputDiv.appendChild(badge);
          });
        }
      }

      // Load extra fields
      const extraLists = modal.querySelectorAll('.extra-list');
      extraLists.forEach(list => {
        if (elem.data?.extraFields) {
          const fields = Object.entries(elem.data.extraFields);
          const items = list.querySelectorAll('.extra-item');
          items.forEach((item, i) => {
            if (i < fields.length) {
              const [name, field] = fields[i];
              const inputs = item.querySelectorAll('input[type="text"]');
              const selects = item.querySelectorAll('select');
              if (inputs[0]) inputs[0].value = name;
              if (selects[0]) selects[0].value = field.type;
              if (inputs[1]) inputs[1].value = field.value;
            }
          });
        }
      });
    }

    currentEditingId = id;
  } else {
    currentEditingId = null;
  }

  currentEditingType = type;
  modal.classList.add('open');
};

async function deleteElement(id) {
  if (!confirm('Hapus element ini?')) return;
  if (!window.elementDuniaQuery) return;

  try {
    await window.elementDuniaQuery.deleteElement(id);
    await window.elementDuniaQuery.logActivity('delete', 'element', id, 'Element', 'Dihapus');
    
    allElements = allElements.filter(e => e.id !== id);
    filterAndRender();
    updateCategoryCounts();
  } catch (err) {
    console.error('Error deleting element:', err);
    alert('Gagal menghapus elemen');
  }
}

// Wire tag input handlers for all modals
document.querySelectorAll('input[placeholder*="Tag"]').forEach(input => {
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = this.value.trim();
      if (!tag) return;
      
      const container = this.parentElement;
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = tag + ' x';
      container.appendChild(badge);
      this.value = '';
    }
  });
});

document.querySelectorAll('.modal-overlay .btn-cancel').forEach(btn => {
  btn.addEventListener('click', e => {
    e.target.closest('.modal-overlay')?.classList.remove('open');
    currentEditingId = null;
  });
});

// Populate dropdown options per modal
function populateDropdownOptions() {
  const dropdownOptions = {
    'Makhluk': {
      'Type Makhluk': ['Natural', 'Magic', 'Hybrid'],
      'Perilaku': ['Agresif', 'Netral', 'Pasif'],
      'Kecerdasan': ['Hewan', 'Sapid', 'Sentient'],
      'Ukuran': ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Colossal'],
      'Makanan': ['Daging', 'Tumbuhan', 'Omnivore', 'Energi']
    },
    'Faksi': {
      'Type Faksi': ['Politik', 'Militer', 'Religius', 'Komersial', 'Akademik'],
      'Struktur': ['Hierarki', 'Demokratis', 'Anarkis', 'Oligarki'],
      'Status': ['Aktif', 'Dormant', 'Bubar', 'Underground'],
      'Pengaruh': ['Local', 'Regional', 'National', 'Global']
    },
    'Pekerjaan': {
      'Kategori': ['Manual', 'Administrative', 'Kreatif', 'Teknis', 'Layanan'],
      'Status Social': ['Rendah', 'Menengah', 'Tinggi', 'Elite']
    },
    'Lokasi': {
      'Tipe': ['Kota', 'Desa', 'Wilderness', 'Dungeon', 'Sacred Site'],
      'Status': ['Aktif', 'Abandoned', 'Legendary', 'Hidden']
    },
    'Agama': {
      'Monotheism': ['Monotheism', 'Polytheism', 'Pantheism'],
      'Praktik': ['Ritual', 'Kontemplasi', 'Zealotry']
    },
    'Sistem Sihir': {
      'Tipe': ['Elemental', 'Divine', 'Arcane', 'Primal', 'Hybrid'],
      'Source': ['Innate', 'Learned', 'Divine', 'Cursed']
    },
    'Teknologi': {
      'Era': ['Stone', 'Bronze', 'Iron', 'Medieval', 'Industrial', 'Advanced'],
      'Fokus': ['Military', 'Civilian', 'Medical', 'Transportation']
    },
    'Bahasa': {
      'Tipe': ['Oral', 'Written', 'Gestural', 'Telepathic'],
      'Spoken': ['Ja', 'Tidak']
    },
    'Item': {
      'Kategori': ['Weapon', 'Armor', 'Tool', 'Magical', 'Artifact'],
      'Rarity': ['Common', 'Uncommon', 'Rare', 'Legendary', 'Unique']
    }
  };

  for (const [elemType, dropdowns] of Object.entries(dropdownOptions)) {
    const modalId = MODAL_MAP[elemType];
    if (!modalId) continue;
    const modal = document.getElementById(modalId);
    if (!modal) continue;

    for (const [label, options] of Object.entries(dropdowns)) {
      const selects = Array.from(modal.querySelectorAll('select'));
      const targetSelect = selects.find(s => s.previousElementSibling?.textContent?.includes(label));
      
      if (targetSelect) {
        // Remove placeholder
        targetSelect.querySelectorAll('option').forEach((opt, i) => i > 0 && opt.remove());
        targetSelect.innerHTML = '<option></option>';
        
        options.forEach(opt => {
          const optionEl = document.createElement('option');
          optionEl.value = opt;
          optionEl.textContent = opt;
          targetSelect.appendChild(optionEl);
        });
      }
    }
  }
}

populateDropdownOptions();

initElementDuniaPage();
