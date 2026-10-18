// ===== Karakter Page Logic =====

document.querySelectorAll('.char-modal-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.char-modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.char-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.pane)?.classList.add('active');
  });
});

function resetCharTabs() {
  document.querySelectorAll('.char-modal-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.char-pane').forEach(p => p.classList.remove('active'));
  document.querySelector('[data-pane="pane-identitas"]')?.classList.add('active');
  document.getElementById('pane-identitas')?.classList.add('active');
}

function setCharView(mode) {
  const grid = document.getElementById('char-grid');
  const table = document.getElementById('char-table');
  if (grid) grid.style.display = mode === 'grid' ? '' : 'none';
  if (table) table.style.display = mode === 'list' ? '' : 'none';
  document.getElementById('view-grid')?.classList.toggle('active', mode === 'grid');
  document.getElementById('view-list')?.classList.toggle('active', mode === 'list');
}

function toggleCharSection(head) {
  var section = head.closest('.char-section');
  if (!section) return;
  section.classList.toggle('collapsed');
  var toggle = head.querySelector('.char-section-toggle');
  if (toggle) toggle.textContent = section.classList.contains('collapsed') ? '>' : 'v';
}

// ===================== STATE KARAKTER =====================
var charState = {
  editingId: null,
  image: '',
  birthMode: 'number',
  linked: { spesies: [], tempat: [] },
  customFields: [],
  relations: [],
  tags: []
};

var debounceTimer = null;
function debounce(fn, ms) {
  return function () {
    var args = arguments, ctx = this;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () { fn.apply(ctx, args); }, ms);
  };
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// ===================== POPUP HELPERS =====================
function openPop(id) { document.getElementById(id)?.classList.add('open'); }
function closePop(id) { document.getElementById(id)?.classList.remove('open'); }
document.querySelectorAll('[data-cf-close]').forEach(function (b) {
  b.addEventListener('click', function () { closePop(b.dataset.cfClose); });
});
document.querySelectorAll('.cf-pop').forEach(function (ov) {
  ov.addEventListener('click', function (e) { if (e.target === ov) ov.classList.remove('open'); });
});

// ===================== POPUP IMAGE =====================
var popImgUrl = document.getElementById('pop-img-url');
var popImgPreview = document.getElementById('pop-img-preview');

document.getElementById('cf-img-edit-btn')?.addEventListener('click', function () {
  if (popImgUrl) {
    popImgUrl.value = charState.image || '';
    renderPopImgPreview(charState.image || '');
  }
  openPop('pop-img');
  popImgUrl?.focus();
});

function renderPopImgPreview(url) {
  if (!popImgPreview) return;
  if (!url) {
    popImgPreview.innerHTML = 'Masukkan URL gambar untuk melihat pratinjau';
    return;
  }
  popImgPreview.innerHTML = '';
  var img = new Image();
  img.onload = function () {
    popImgPreview.innerHTML = '';
    popImgPreview.appendChild(img);
  };
  img.onerror = function () {
    popImgPreview.innerHTML = '<span style="color:var(--danger);">URL gambar tidak valid</span>';
  };
  img.src = url;
}

popImgUrl?.addEventListener('input', debounce(function () {
  renderPopImgPreview(popImgUrl.value.trim());
}, 350));

document.getElementById('pop-img-save')?.addEventListener('click', function () {
  var url = popImgUrl ? popImgUrl.value.trim() : '';
  if (url) {
    var test = new Image();
    test.onload = function () {
      charState.image = url;
      applyImagePreview();
      closePop('pop-img');
    };
    test.onerror = function () {
      alert('URL gambar tidak valid, tidak bisa disimpan.');
    };
    test.src = url;
  } else {
    charState.image = '';
    applyImagePreview();
    closePop('pop-img');
  }
});

function applyImagePreview() {
  var img = document.getElementById('cf-img-preview');
  var empty = document.getElementById('cf-img-empty');
  if (!img || !empty) return;
  if (charState.image) {
    img.src = charState.image;
    img.style.display = 'block';
    empty.style.display = 'none';
  } else {
    img.removeAttribute('src');
    img.style.display = 'none';
    empty.style.display = 'flex';
  }
}

// ===================== TANGGAL LAHIR DUAL MODE =====================
var tglNumberWrap = document.getElementById('cf-tgl-number-wrap');
var tglText = document.getElementById('cf-tgl-text');
var tglNumber = document.getElementById('cf-tgl-number');

document.getElementById('cf-tgl-mode-btn')?.addEventListener('click', function () {
  charState.birthMode = charState.birthMode === 'number' ? 'text' : 'number';
  applyBirthMode();
});
document.getElementById('cf-tgl-picker')?.addEventListener('click', function () {
  if (!tglNumber) return;
  if (tglNumber.showPicker) { try { tglNumber.showPicker(); } catch (e) { tglNumber.focus(); } }
  else tglNumber.focus();
});
function applyBirthMode() {
  var isNum = charState.birthMode === 'number';
  if (tglNumberWrap) tglNumberWrap.style.display = isNum ? 'flex' : 'none';
  if (tglText) tglText.style.display = isNum ? 'none' : 'block';
}

// ===================== LINKED INPUT (Spesies / Tempat / Custom) =====================
function LinkedInput(wrapEl, opts) {
  if (!wrapEl) return null;
  opts = opts || {};
  var type = opts.type || 'Spesies';
  var onChange = opts.onChange || function () {};
  var items = [];
  var cache = [];

  wrapEl.innerHTML =
    '<div class="linked-input-row"><input type="text" class="form-input" placeholder="Ketik lalu Enter untuk tambah..."></div>' +
    '<div class="linked-dropdown"></div>' +
    '<div class="linked-chips"></div>';

  var input = wrapEl.querySelector('input');
  var dropdown = wrapEl.querySelector('.linked-dropdown');
  var chips = wrapEl.querySelector('.linked-chips');

  function refreshCache() {
    if (!window.karakterQuery) return Promise.resolve([]);
    return window.karakterQuery.getElements(type).then(function (els) {
      cache = (els || []).map(function (e) { return { id: e.id, name: e.name, type: e.type }; });
      return cache;
    });
  }

  function renderChips() {
    chips.innerHTML = '';
    items.forEach(function (it, idx) {
      var chip = document.createElement('span');
      chip.className = 'linked-chip';
      chip.innerHTML = escapeHtml(it.name) + ' <button type="button" title="Hapus linked">&times;</button>';
      chip.querySelector('button').addEventListener('click', function () {
        items.splice(idx, 1);
        renderChips();
        onChange(items.slice());
      });
      chips.appendChild(chip);
    });
  }

  function addItem(item) {
    var exists = items.some(function (i) {
      return (item.id && i.id === item.id) || i.name.toLowerCase() === item.name.toLowerCase();
    });
    if (exists) return;
    items.push(item);
    renderChips();
    onChange(items.slice());
  }

  function renderDropdown(query) {
    var q = (query || '').toLowerCase().trim();
    var filtered = cache.filter(function (e) {
      return !items.some(function (i) { return i.id === e.id; }) && e.name.toLowerCase().indexOf(q) !== -1;
    }).slice(0, 8);

    dropdown.innerHTML = '';
    filtered.forEach(function (e) {
      var opt = document.createElement('div');
      opt.className = 'linked-opt';
      opt.innerHTML = '<span>' + escapeHtml(e.name) + '</span><span class="linked-opt-type">' + escapeHtml(e.type) + '</span>';
      opt.addEventListener('mousedown', function (ev) {
        ev.preventDefault();
        addItem({ id: e.id, name: e.name, type: e.type });
        input.value = '';
        closeDropdown();
      });
      dropdown.appendChild(opt);
    });

    var exactExists = cache.some(function (e) { return e.name.toLowerCase() === q; });
    if (q && !exactExists) {
      var createOpt = document.createElement('div');
      createOpt.className = 'linked-opt create';
      createOpt.innerHTML = '<span>+ Buat "' + escapeHtml(input.value.trim()) + '"</span><span class="linked-opt-type">' + escapeHtml(type) + '</span>';
      createOpt.addEventListener('mousedown', function (ev) {
        ev.preventDefault();
        var name = input.value.trim();
        if (!name) return;
        if (!window.karakterQuery) return;
        window.karakterQuery.addElement({ name: name, type: type, data: {} }).then(function (created) {
          if (created) addItem({ id: created.id, name: created.name, type: created.type });
          input.value = '';
          refreshCache();
          closeDropdown();
        });
      });
      dropdown.appendChild(createOpt);
    }

    if (dropdown.children.length) dropdown.classList.add('open');
    else dropdown.classList.remove('open');
  }

  function closeDropdown() { dropdown.classList.remove('open'); }

  input.addEventListener('input', debounce(function () {
    refreshCache().then(function () { renderDropdown(input.value); });
  }, 200));

  input.addEventListener('focus', function () {
    refreshCache().then(function () { renderDropdown(input.value); });
  });

  input.addEventListener('blur', function () {
    setTimeout(closeDropdown, 150);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var name = input.value.trim();
      if (!name) return;
      var found = cache.find(function (x) { return x.name.toLowerCase() === name.toLowerCase(); });
      if (found) {
        addItem({ id: found.id, name: found.name, type: found.type });
        input.value = '';
        closeDropdown();
        return;
      }
      if (!window.karakterQuery) return;
      window.karakterQuery.addElement({ name: name, type: type, data: {} }).then(function (created) {
        if (created) addItem({ id: created.id, name: created.name, type: created.type });
        input.value = '';
        refreshCache();
        closeDropdown();
      });
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  return {
    getItems: function () { return items.slice(); },
    setItems: function (arr) { items = (arr || []).slice(); renderChips(); },
    setType: function (t) { type = t; refreshCache(); },
    refresh: refreshCache,
    _input: input
  };
}

var linkedSpesies = LinkedInput(document.getElementById('linked-spesies'), {
  type: 'Spesies',
  onChange: function (items) { charState.linked.spesies = items; }
});
var linkedTempat = LinkedInput(document.getElementById('linked-tempat'), {
  type: 'Lokasi',
  onChange: function (items) { charState.linked.tempat = items; }
});

// ===================== TOOLTIP INFO (ⓘ) =====================
var hintPop = document.createElement('div');
hintPop.className = 'cf-hint-pop';
document.body.appendChild(hintPop);
var hintPinned = false;

function showHint(el) {
  hintPop.textContent = el.dataset.hint || '';
  hintPop.classList.add('open');
  var r = el.getBoundingClientRect();
  var top = r.bottom + 6;
  var left = Math.min(r.left, window.innerWidth - 336);
  if (left < 8) left = 8;
  if (top + hintPop.offsetHeight > window.innerHeight - 8) {
    top = Math.max(8, r.top - hintPop.offsetHeight - 6);
  }
  hintPop.style.top = top + 'px';
  hintPop.style.left = left + 'px';
}
function hideHint() {
  if (hintPinned) return;
  hintPop.classList.remove('open');
}

document.addEventListener('mouseover', function (e) {
  var el = e.target.closest && e.target.closest('.info-i');
  if (el) showHint(el);
});
document.addEventListener('mouseout', function (e) {
  var el = e.target.closest && e.target.closest('.info-i');
  if (el && !hintPinned) hideHint();
});
document.addEventListener('click', function (e) {
  var el = e.target.closest && e.target.closest('.info-i');
  if (el) {
    e.preventDefault();
    e.stopPropagation();
    hintPinned = !hintPinned;
    if (hintPinned) showHint(el); else hideHint();
    return;
  }
  hintPinned = false;
  hintPop.classList.remove('open');
}, true);

// ===================== LINKED COLLECTION (Latar & Kemampuan) =====================
var linkedCollections = {};

function initLinkedCollection(id) {
  var el = document.getElementById(id);
  if (!el) return null;
  var type = el.dataset.linkedType || 'Spesies';
  var inst = LinkedInput(el, { type: type });
  linkedCollections[id] = inst;
  return inst;
}

var LATAR_LINKED_IDS = [
  'lat-gelar', 'lat-pekerjaan', 'lat-faksi', 'lat-agama',
  'lat-anggota-kelompok', 'lat-pemimpin-kelompok', 'lat-pendiri-kelompok', 'lat-mantan-anggota', 'lat-mantan-pemimpin',
  'lat-pengikut-dewa', 'lat-diberkati-dewa', 'lat-dikutuk-dewa', 'lat-musuh-dewa', 'lat-mantan-pengikut-dewa',
  'lat-makhluk-jinak', 'lat-makhluk-sahabat', 'lat-makhluk-buru', 'lat-makhluk-lindungi', 'lat-makhluk-temui',
  'lat-objek-miliki', 'lat-objek-pernah', 'lat-objek-pencipta', 'lat-objek-penemu', 'lat-objek-pencari', 'lat-objek-penjaga',
  'lat-peserta-peristiwa', 'lat-tokoh-peristiwa', 'lat-pahlawan-peristiwa', 'lat-penyebab-peristiwa', 'lat-saksi-peristiwa'
];
var KEMAMPUAN_LINKED_IDS = [
  'km-magic-digunakan', 'km-magic-diketahui', 'km-magic-dipelajari',
  'km-tek-digunakan', 'km-tek-diketahui', 'km-tek-dibuat', 'km-tek-akses',
  'km-bahasa'
];
var ALL_COLLECTION_IDS = LATAR_LINKED_IDS.concat(KEMAMPUAN_LINKED_IDS);

ALL_COLLECTION_IDS.forEach(function (id) { initLinkedCollection(id); });

function getCollectionItems(id) {
  var inst = linkedCollections[id];
  return inst ? inst.getItems() : [];
}
function setCollectionItems(id, items) {
  var inst = linkedCollections[id];
  if (inst) inst.setItems(items || []);
}
async function refreshAllCollections() {
  for (var key in linkedCollections) {
    if (linkedCollections[key]) await linkedCollections[key].refresh();
  }
}

// ===================== HUBUNGAN =====================
var RELATION_TYPES = [
  { group: 'Keluarga', options: [
    'Ayah / Ibu', 'Putra / Putri', 'Saudara Laki-Laki / Saudara Perempuan', 'Kakek / Nenek', 'Cucu',
    'Paman / Bibi', 'Keponakan', 'Sepupu', 'Ayah Mertua / Ibu Mertua', 'Menantu Laki-Laki / Menantu Perempuan',
    'Ipar Laki-Laki / Ipar Perempuan', 'Ayah Tiri / Ibu Tiri', 'Wali', 'Anak Perwalian'
  ]},
  { group: 'Pasangan Dan Ikatan', options: [
    'Suami / Istri', 'Kekasih', 'Teman', 'Sekutu', 'Saingan', 'Musuh', 'Mantan Pasangan', 'Kenalan', 'Netral'
  ]},
  { group: 'Profesional', options: ['Mentor', 'Murid', 'Atasan', 'Bawahan', 'Guru'] },
  { group: 'Lainnya', options: ['Pencipta', 'Ciptaan', 'Lainnya (Custom)'] }
];

var RELATION_INVERSE = {
  'Ayah / Ibu': 'Putra / Putri',
  'Putra / Putri': 'Ayah / Ibu',
  'Saudara Laki-Laki / Saudara Perempuan': 'Saudara Laki-Laki / Saudara Perempuan',
  'Kakek / Nenek': 'Cucu',
  'Cucu': 'Kakek / Nenek',
  'Paman / Bibi': 'Keponakan',
  'Keponakan': 'Paman / Bibi',
  'Sepupu': 'Sepupu',
  'Ayah Mertua / Ibu Mertua': 'Menantu Laki-Laki / Menantu Perempuan',
  'Menantu Laki-Laki / Menantu Perempuan': 'Ayah Mertua / Ibu Mertua',
  'Ipar Laki-Laki / Ipar Perempuan': 'Ipar Laki-Laki / Ipar Perempuan',
  'Ayah Tiri / Ibu Tiri': 'Putra / Putri',
  'Wali': 'Anak Perwalian',
  'Anak Perwalian': 'Wali',
  'Suami / Istri': 'Suami / Istri',
  'Kekasih': 'Kekasih',
  'Teman': 'Teman',
  'Sekutu': 'Sekutu',
  'Saingan': 'Saingan',
  'Musuh': 'Musuh',
  'Mantan Pasangan': 'Mantan Pasangan',
  'Kenalan': 'Kenalan',
  'Netral': 'Netral',
  'Mentor': 'Murid',
  'Murid': 'Mentor',
  'Atasan': 'Bawahan',
  'Bawahan': 'Atasan',
  'Guru': 'Murid',
  'Pencipta': 'Ciptaan',
  'Ciptaan': 'Pencipta'
};

var SELF_LABEL_HINT = {
  'Ayah / Ibu': 'Kosong: Ayah / Ibu',
  'Putra / Putri': 'Kosong: Putra / Putri',
  'Suami / Istri': 'Kosong: Suami / Istri',
  'Teman': 'Kosong: Teman',
  'Mentor': 'Kosong: Mentor',
  'Murid': 'Kosong: Murid',
  'Musuh': 'Kosong: Musuh'
};

var KNOW_OPTIONS = ['Publik', 'Rahasia', 'Desas-Desus', 'Diperdebatkan'];

function relationTypeOptionsHtml() {
  var html = '<option value="">Pilih Type Hubungan</option>';
  RELATION_TYPES.forEach(function (g) {
    html += '<optgroup label="' + g.group + '">';
    g.options.forEach(function (o) {
      html += '<option value="' + o + '">' + o + '</option>';
    });
    html += '</optgroup>';
  });
  return html;
}

function renderRelations() {
  var list = document.getElementById('relation-list');
  var empty = document.getElementById('relation-empty');
  if (!list) return;
  var rels = charState.relations || [];
  if (!rels.length) {
    list.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  list.style.display = 'flex';
  list.innerHTML = '';
  rels.forEach(function (rel, idx) {
    var card = document.createElement('div');
    card.className = 'field-block hub-card';

    var head = document.createElement('div');
    head.className = 'rel-card-head';
    var title = document.createElement('span');
    title.textContent = 'Hubungan ' + (idx + 1) + (rel.targetName ? ' — ' + rel.targetName : '');
    var del = document.createElement('button');
    del.className = 'win-btn';
    del.style.color = 'var(--danger)';
    del.innerHTML = '<iconify-icon icon="lucide:trash-2"></iconify-icon>';
    del.addEventListener('click', function () {
      rels.splice(idx, 1);
      renderRelations();
    });
    head.appendChild(title);
    head.appendChild(del);
    card.appendChild(head);

    var row1 = document.createElement('div');
    row1.className = 'form-row';
    row1.innerHTML = '<div><label class="form-label">Karakter</label></div><div><label class="form-label">Type Hubungan</label></div>';
    var selChar = document.createElement('select');
    selChar.className = 'form-input';
    selChar.innerHTML = '<option value="">Pilih karakter</option>' + otherCharactersOptions(rel.targetId);
    selChar.value = rel.targetId ? String(rel.targetId) : '';
    selChar.addEventListener('change', function () {
      rel.targetId = selChar.value ? parseInt(selChar.value, 10) : null;
      var c = charCache[rel.targetId];
      rel.targetName = c ? c.name : '';
      renderRelations();
    });
    var selType = document.createElement('select');
    selType.className = 'form-input';
    selType.innerHTML = relationTypeOptionsHtml();
    selType.value = rel.typeKey || '';
    selType.addEventListener('change', function () {
      rel.typeKey = selType.value;
      renderRelations();
    });
    var row1b = document.createElement('div');
    row1b.className = 'form-row';
    var d1 = document.createElement('div'); d1.appendChild(selChar);
    var d2 = document.createElement('div'); d2.appendChild(selType);
    row1b.appendChild(d1); row1b.appendChild(d2);
    card.appendChild(row1b);

    if (rel.typeKey === 'Lainnya (Custom)') {
      var cw = document.createElement('div');
      cw.innerHTML = '<label class="form-label">Nama Ikatan</label>';
      var ci = document.createElement('input');
      ci.type = 'text';
      ci.className = 'form-input';
      ci.value = rel.customName || '';
      ci.placeholder = 'Nama ikatan...';
      ci.addEventListener('input', function () { rel.customName = ci.value; });
      cw.appendChild(ci);
      card.appendChild(cw);
    }

    var lw = document.createElement('div');
    lw.innerHTML = '<label class="form-label">Label Sendiri</label>';
    var li = document.createElement('input');
    li.type = 'text';
    li.className = 'form-input';
    li.value = rel.selfLabel || '';
    li.placeholder = SELF_LABEL_HINT[rel.typeKey] || 'Kosong: (mengikuti type)';
    li.addEventListener('input', function () { rel.selfLabel = li.value; });
    lw.appendChild(li);
    card.appendChild(lw);

    var kw = document.createElement('div');
    kw.innerHTML = '<label class="form-label">Siapa yang tahu?</label>';
    var kr = document.createElement('div');
    kr.className = 'rel-know-row';
    KNOW_OPTIONS.forEach(function (opt) {
      var b = document.createElement('span');
      b.className = 'rel-know-opt' + ((rel.know || 'Publik') === opt ? ' on' : '');
      b.textContent = opt;
      b.addEventListener('click', function () {
        rel.know = opt;
        renderRelations();
      });
      kr.appendChild(b);
    });
    kw.appendChild(kr);
    card.appendChild(kw);

    var sw = document.createElement('div');
    sw.innerHTML = '<label class="form-label">Sejak</label>';
    var si = document.createElement('input');
    si.type = 'text';
    si.className = 'form-input';
    si.value = rel.since || '';
    si.placeholder = 'mis. musim panah 2001';
    si.addEventListener('input', function () { rel.since = si.value; });
    sw.appendChild(si);
    card.appendChild(sw);

    var dw = document.createElement('div');
    dw.innerHTML = '<label class="form-label">Deskripsi Hubungan</label>';
    var di = document.createElement('textarea');
    di.className = 'form-input';
    di.rows = 3;
    di.value = rel.description || '';
    di.addEventListener('input', function () { rel.description = di.value; });
    dw.appendChild(di);
    card.appendChild(dw);

    var tw = document.createElement('label');
    tw.style.display = 'flex';
    tw.style.gap = '0.4rem';
    tw.style.alignItems = 'center';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!rel.twoWay;
    cb.addEventListener('change', function () { rel.twoWay = cb.checked; });
    tw.appendChild(cb);
    tw.appendChild(document.createTextNode(' Hubungan Dua Arah'));
    card.appendChild(tw);

    list.appendChild(card);
  });
}

function otherCharactersOptions(excludeId) {
  var selfId = charState.editingId;
  return (window._allCharacters || []).filter(function (c) {
    return c.id !== selfId;
  }).map(function (c) {
    return '<option value="' + c.id + '"' + (String(c.id) === String(excludeId) ? ' selected' : '') + '>' + escapeHtml(c.name) + '</option>';
  }).join('');
}

document.getElementById('btn-add-relation')?.addEventListener('click', function () {
  var others = (window._allCharacters || []).filter(function (c) { return c.id !== charState.editingId; });
  var used = (charState.relations || []).map(function (r) { return r.targetId; });
  var available = others.filter(function (c) { return used.indexOf(c.id) === -1; });

  if (!others.length) {
    alert('Harap buat karakter lain terlebih dahulu.');
    return;
  }
  if (!available.length) {
    alert('Semua karakter lain sudah dihubungkan dengan karakter ini.');
    return;
  }
  charState.relations.push({
    id: 'rel_' + Date.now(),
    targetId: null,
    targetName: '',
    typeKey: '',
    customName: '',
    selfLabel: '',
    know: 'Publik',
    since: '',
    description: '',
    twoWay: false
  });
  renderRelations();
});

// ===================== TAG =====================
function renderTagChips() {
  var wrap = document.getElementById('cat-tag-chips');
  if (!wrap) return;
  wrap.innerHTML = '';
  (charState.tags || []).forEach(function (t, i) {
    var chip = document.createElement('span');
    chip.className = 'linked-chip';
    chip.innerHTML = escapeHtml(t) + ' <button type="button">&times;</button>';
    chip.querySelector('button').addEventListener('click', function () {
      charState.tags.splice(i, 1);
      renderTagChips();
    });
    wrap.appendChild(chip);
  });
}

function addTagFromInput() {
  var inp = document.getElementById('cat-tag-input');
  if (!inp) return;
  var val = (inp.value || '').trim();
  if (!val) return;
  charState.tags = charState.tags || [];
  if (charState.tags.indexOf(val) === -1) charState.tags.push(val);
  inp.value = '';
  renderTagChips();
}

document.getElementById('btn-add-tag')?.addEventListener('click', addTagFromInput);
document.getElementById('cat-tag-input')?.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') { e.preventDefault(); addTagFromInput(); }
});

// ===================== FISIK TAMBAHAN (toggle detail) =====================
['taring', 'sayap', 'cakar', 'bulu', 'sisik', 'tanduk', 'ekor'].forEach(function (key) {
  var cb = document.getElementById('ap-has-' + key);
  if (!cb) return;
  cb.addEventListener('change', function () {
    var row = document.getElementById('row-' + key);
    if (row) row.style.display = cb.checked ? 'grid' : 'none';
  });
});

// ===================== CUSTOM FIELD =====================
var popCfType = document.getElementById('pop-cf-type');
var popCfLinkedItems = [];
var popCfLinked = LinkedInput(document.getElementById('linked-pop-cf'), {
  type: 'Spesies',
  onChange: function (items) { popCfLinkedItems = items; }
});

document.getElementById('pop-cf-linked-type')?.addEventListener('change', function () {
  popCfLinked?.setType(this.value);
});

popCfType?.addEventListener('change', function () {
  var t = this.value;
  var textWrap = document.getElementById('pop-cf-value-text-wrap');
  var numWrap = document.getElementById('pop-cf-value-number-wrap');
  var boolWrap = document.getElementById('pop-cf-value-bool-wrap');
  var linkedWrap = document.getElementById('pop-cf-value-linked-wrap');
  if (textWrap) textWrap.style.display = t === 'text' ? 'block' : 'none';
  if (numWrap) numWrap.style.display = t === 'number' ? 'block' : 'none';
  if (boolWrap) boolWrap.style.display = t === 'boolean' ? 'block' : 'none';
  if (linkedWrap) linkedWrap.style.display = t === 'linked' ? 'block' : 'none';
  if (t === 'linked') {
    var lt = document.getElementById('pop-cf-linked-type')?.value;
    if (lt) popCfLinked?.setType(lt);
  }
});

document.getElementById('btn-add-custom-field')?.addEventListener('click', function () {
  var nameEl = document.getElementById('pop-cf-name');
  if (nameEl) nameEl.value = '';
  var textEl = document.getElementById('pop-cf-value-text');
  if (textEl) textEl.value = '';
  var numEl = document.getElementById('pop-cf-value-number');
  if (numEl) numEl.value = '';
  var boolEl = document.getElementById('pop-cf-value-bool');
  if (boolEl) boolEl.value = 'Ya';
  if (popCfType) {
    popCfType.value = 'text';
    popCfType.dispatchEvent(new Event('change'));
  }
  popCfLinked?.setItems([]);
  popCfLinkedItems = [];
  openPop('pop-cf');
});

document.getElementById('pop-cf-save')?.addEventListener('click', function () {
  var nameEl = document.getElementById('pop-cf-name');
  var name = nameEl ? nameEl.value.trim() : '';
  if (!name) { alert('Nama Field wajib diisi'); return; }
  var type = popCfType ? popCfType.value : 'text';
  var field = { id: 'cf_' + Date.now(), name: name, type: type };
  if (type === 'text') field.value = document.getElementById('pop-cf-value-text')?.value || '';
  else if (type === 'number') field.value = document.getElementById('pop-cf-value-number')?.value || '';
  else if (type === 'boolean') field.value = document.getElementById('pop-cf-value-bool')?.value || 'Ya';
  else if (type === 'linked') {
    field.elementType = document.getElementById('pop-cf-linked-type')?.value || 'Spesies';
    field.value = popCfLinked ? popCfLinked.getItems() : [];
  }
  charState.customFields.push(field);
  renderCustomFields();
  closePop('pop-cf');
});

function renderCustomFields() {
  var list = document.getElementById('custom-field-list');
  if (!list) return;
  list.innerHTML = '';
  charState.customFields.forEach(function (field, idx) {
    var row = document.createElement('div');
    row.className = 'cf-row';

    var head = document.createElement('div');
    head.className = 'cf-row-head';
    head.innerHTML = '<div><div class="cf-row-name">' + escapeHtml(field.name) + '</div>' +
      '<div class="cf-row-type">' + escapeHtml(typeLabel(field.type)) + (field.elementType ? ' · ' + escapeHtml(field.elementType) : '') + '</div></div>';
    var delBtn = document.createElement('button');
    delBtn.className = 'win-btn';
    delBtn.style.color = 'var(--danger)';
    delBtn.innerHTML = '<iconify-icon icon="lucide:trash-2" width="16"></iconify-icon>';
    delBtn.addEventListener('click', function () {
      pendingDeleteField = idx;
      var confirmText = document.getElementById('pop-confirm-text');
      if (confirmText) confirmText.textContent = 'Hapus custom field "' + field.name + '"?';
      openPop('pop-confirm');
    });
    head.appendChild(delBtn);
    row.appendChild(head);

    var body = document.createElement('div');
    body.className = 'cf-row-body';

    if (field.type === 'text') {
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'form-input';
      inp.value = field.value || '';
      inp.addEventListener('input', function () { field.value = inp.value; });
      body.appendChild(inp);
    } else if (field.type === 'number') {
      var numWrap = document.createElement('div');
      numWrap.className = 'cf-num-wrap';
      var num = document.createElement('input');
      num.type = 'number';
      num.className = 'form-input';
      num.value = field.value || '';
      num.addEventListener('input', function () { field.value = num.value; });
      var step = document.createElement('div');
      step.className = 'cf-num-step';
      var up = document.createElement('button');
      up.type = 'button'; up.innerHTML = '&uarr;';
      up.addEventListener('click', function () { num.value = String((parseFloat(num.value) || 0) + 1); field.value = num.value; });
      var down = document.createElement('button');
      down.type = 'button'; down.innerHTML = '&darr;';
      down.addEventListener('click', function () { num.value = String((parseFloat(num.value) || 0) - 1); field.value = num.value; });
      step.appendChild(up); step.appendChild(down);
      numWrap.appendChild(num); numWrap.appendChild(step);
      body.appendChild(numWrap);
    } else if (field.type === 'boolean') {
      var sel = document.createElement('select');
      sel.className = 'form-input';
      sel.innerHTML = '<option value="Ya">Ya</option><option value="Tidak">Tidak</option>';
      sel.value = field.value || 'Ya';
      sel.addEventListener('change', function () { field.value = sel.value; });
      body.appendChild(sel);
    } else if (field.type === 'linked') {
      var mount = document.createElement('div');
      mount.className = 'linked-wrap';
      mount.style.flex = '1';
      body.appendChild(mount);
      var li = LinkedInput(mount, {
        type: field.elementType || 'Spesies',
        onChange: function (items) { field.value = items; }
      });
      if (li) li.setItems(field.value || []);
    }

    row.appendChild(body);
    list.appendChild(row);
  });
}

function typeLabel(t) {
  return { text: 'Text Bebas', number: 'Number', boolean: 'Boolean', linked: 'Linked' }[t] || t;
}

var pendingDeleteField = -1;
document.getElementById('pop-confirm-yes')?.addEventListener('click', function () {
  if (pendingDeleteField > -1) {
    charState.customFields.splice(pendingDeleteField, 1);
    pendingDeleteField = -1;
    renderCustomFields();
  }
  closePop('pop-confirm');
});

// ===================== OPEN / FILL FORM =====================
var PENAMPILAN_FIELDS = ['ap-tinggi', 'ap-kulit', 'ap-wajah', 'ap-rambut', 'ap-mata', 'ap-dada', 'ap-pinggang'];
var PENAMPILAN_PHYS = [
  { key: 'taring', label: 'Taring' }, { key: 'sayap', label: 'Sayap' }, { key: 'cakar', label: 'Cakar' },
  { key: 'bulu', label: 'Bulu' }, { key: 'sisik', label: 'Sisik' }, { key: 'tanduk', label: 'Tanduk' },
  { key: 'ekor', label: 'Ekor' }
];
var PENAMPILAN_TEXTAREAS = ['ap-desc-fisik', 'ap-desc-unik', 'ap-desc-pakaian', 'ap-desc-aksesoris'];
var KEPRIBADIAN_FIELDS = ['kp-psikologis', 'kp-motivasi', 'kp-kekurangan', 'kp-rahasia', 'kp-suka', 'kp-tidak-suka'];
var KEMAMPUAN_TEXTAREAS = ['km-sifat', 'km-fisik', 'km-mental', 'km-magic'];

function clearPenampilanForm() {
  PENAMPILAN_FIELDS.forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
  PENAMPILAN_PHYS.forEach(function (p) {
    var cb = document.getElementById('ap-has-' + p.key);
    var val = document.getElementById('ap-' + p.key);
    var row = document.getElementById('row-' + p.key);
    if (cb) cb.checked = false;
    if (val) val.value = '';
    if (row) row.style.display = 'none';
  });
  PENAMPILAN_TEXTAREAS.forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
}

function fillPenampilanForm(data) {
  var ap = data.appearance || {};
  PENAMPILAN_FIELDS.forEach(function (id) {
    var key = id.replace('ap-', '');
    var el = document.getElementById(id);
    if (el) el.value = ap[key] || '';
  });
  var phys = ap.physical || {};
  PENAMPILAN_PHYS.forEach(function (p) {
    var enabled = !!phys[p.key];
    var cb = document.getElementById('ap-has-' + p.key);
    var val = document.getElementById('ap-' + p.key);
    var row = document.getElementById('row-' + p.key);
    if (cb) cb.checked = enabled;
    if (val) val.value = phys[p.key] || '';
    if (row) row.style.display = enabled ? 'grid' : 'none';
  });
  var df = document.getElementById('ap-desc-fisik'); if (df) df.value = ap.descFisik || '';
  var du = document.getElementById('ap-desc-unik'); if (du) du.value = ap.descUnik || '';
  var dp = document.getElementById('ap-desc-pakaian'); if (dp) dp.value = ap.descPakaian || '';
  var da = document.getElementById('ap-desc-aksesoris'); if (da) da.value = ap.descAksesoris || '';
}

function collectPenampilan() {
  var ap = {};
  PENAMPILAN_FIELDS.forEach(function (id) {
    var el = document.getElementById(id);
    ap[id.replace('ap-', '')] = el ? el.value.trim() : '';
  });
  ap.physical = {};
  PENAMPILAN_PHYS.forEach(function (p) {
    var cb = document.getElementById('ap-has-' + p.key);
    var val = document.getElementById('ap-' + p.key);
    if (cb && cb.checked && val) {
      ap.physical[p.key] = val.value.trim();
    }
  });
  var df = document.getElementById('ap-desc-fisik'); ap.descFisik = df ? df.value.trim() : '';
  var du = document.getElementById('ap-desc-unik'); ap.descUnik = du ? du.value.trim() : '';
  var dp = document.getElementById('ap-desc-pakaian'); ap.descPakaian = dp ? dp.value.trim() : '';
  var da = document.getElementById('ap-desc-aksesoris'); ap.descAksesoris = da ? da.value.trim() : '';
  return ap;
}

function clearKepribadianForm() {
  KEPRIBADIAN_FIELDS.forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
}
function fillKepribadianForm(data) {
  var kp = data.personality || {};
  var p = document.getElementById('kp-psikologis'); if (p) p.value = kp.psikologis || '';
  var m = document.getElementById('kp-motivasi'); if (m) m.value = kp.motivasi || '';
  var k = document.getElementById('kp-kekurangan'); if (k) k.value = kp.kekurangan || '';
  var r = document.getElementById('kp-rahasia'); if (r) r.value = kp.rahasia || '';
  var s = document.getElementById('kp-suka'); if (s) s.value = kp.suka || '';
  var ts = document.getElementById('kp-tidak-suka'); if (ts) ts.value = kp.tidakSuka || '';
}
function collectKepribadian() {
  var p = document.getElementById('kp-psikologis');
  var m = document.getElementById('kp-motivasi');
  var k = document.getElementById('kp-kekurangan');
  var r = document.getElementById('kp-rahasia');
  var s = document.getElementById('kp-suka');
  var ts = document.getElementById('kp-tidak-suka');
  return {
    psikologis: p ? p.value.trim() : '',
    motivasi: m ? m.value.trim() : '',
    kekurangan: k ? k.value.trim() : '',
    rahasia: r ? r.value.trim() : '',
    suka: s ? s.value.trim() : '',
    tidakSuka: ts ? ts.value.trim() : ''
  };
}

function clearLatarForm() {
  LATAR_LINKED_IDS.forEach(function (id) { setCollectionItems(id, []); });
  var dp = document.getElementById('lat-desc-pribadi');
  if (dp) dp.value = '';
}
function fillLatarForm(data) {
  var lat = data.background || {};
  LATAR_LINKED_IDS.forEach(function (id) {
    var key = id.replace('lat-', '');
    setCollectionItems(id, lat[key] || []);
  });
  var dp = document.getElementById('lat-desc-pribadi');
  if (dp) dp.value = lat.descPribadi || '';
}
function collectLatar() {
  var lat = {};
  LATAR_LINKED_IDS.forEach(function (id) { lat[id.replace('lat-', '')] = getCollectionItems(id); });
  var dp = document.getElementById('lat-desc-pribadi');
  lat.descPribadi = dp ? dp.value.trim() : '';
  return lat;
}

function clearKemampuanForm() {
  KEMAMPUAN_LINKED_IDS.forEach(function (id) { setCollectionItems(id, []); });
  KEMAMPUAN_TEXTAREAS.forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
}
function fillKemampuanForm(data) {
  var km = data.abilities || {};
  KEMAMPUAN_LINKED_IDS.forEach(function (id) {
    var key = id.replace('km-', '');
    setCollectionItems(id, km[key] || []);
  });
  var s = document.getElementById('km-sifat'); if (s) s.value = km.sifat || '';
  var f = document.getElementById('km-fisik'); if (f) f.value = km.fisik || '';
  var m = document.getElementById('km-mental'); if (m) m.value = km.mental || '';
  var mg = document.getElementById('km-magic'); if (mg) mg.value = km.magicSkill || '';
}
function collectKemampuan() {
  var km = {};
  KEMAMPUAN_LINKED_IDS.forEach(function (id) { km[id.replace('km-', '')] = getCollectionItems(id); });
  var s = document.getElementById('km-sifat'); km.sifat = s ? s.value.trim() : '';
  var f = document.getElementById('km-fisik'); km.fisik = f ? f.value.trim() : '';
  var m = document.getElementById('km-mental'); km.mental = m ? m.value.trim() : '';
  var mg = document.getElementById('km-magic'); km.magicSkill = mg ? mg.value.trim() : '';
  return km;
}

function clearIdentitasForm() {
  charState.editingId = null;
  charState.image = '';
  charState.birthMode = 'number';
  charState.customFields = [];
  charState.relations = [];
  charState.tags = [];
  var nl = document.getElementById('cf-nama-lengkap'); if (nl) nl.value = '';
  var nd = document.getElementById('cf-nama-depan'); if (nd) nd.value = '';
  var nb = document.getElementById('cf-nama-belakang'); if (nb) nb.value = '';
  if (tglNumber) tglNumber.value = '';
  if (tglText) tglText.value = '';
  var u = document.getElementById('cf-usia'); if (u) u.value = '';
  var jk = document.getElementById('cf-jenis-kelamin'); if (jk) jk.value = 'None';
  var st = document.getElementById('cf-status'); if (st) st.value = 'None';
  var al = document.getElementById('cf-alias'); if (al) al.value = '';
  var dk = document.getElementById('cf-deskripsi'); if (dk) dk.value = '';
  var tl = document.getElementById('cf-tempat-lahir'); if (tl) tl.value = '';
  var err = document.getElementById('err-nama-lengkap'); if (err) err.style.display = 'none';
  linkedSpesies?.setItems([]);
  linkedTempat?.setItems([]);
  charState.linked.spesies = [];
  charState.linked.tempat = [];
  applyImagePreview();
  applyBirthMode();
  renderCustomFields();

  clearPenampilanForm();
  clearKepribadianForm();
  clearLatarForm();
  clearKemampuanForm();
  renderRelations();
  renderTagChips();
  var cat = document.getElementById('cat-catatan'); if (cat) cat.value = '';
}

function fillIdentitasForm(data) {
  charState.editingId = data._id || null;
  charState.image = data.image || '';
  charState.birthMode = data.birthMode || 'number';
  var nl = document.getElementById('cf-nama-lengkap'); if (nl) nl.value = data.fullName || '';
  var nd = document.getElementById('cf-nama-depan'); if (nd) nd.value = data.firstName || '';
  var nb = document.getElementById('cf-nama-belakang'); if (nb) nb.value = data.lastName || '';
  if (charState.birthMode === 'text') { if (tglText) tglText.value = data.birthDate || ''; }
  else { if (tglNumber) tglNumber.value = data.birthDate || ''; }
  var u = document.getElementById('cf-usia'); if (u) u.value = data.age || '';
  var jk = document.getElementById('cf-jenis-kelamin'); if (jk) jk.value = data.gender || 'None';
  var st = document.getElementById('cf-status'); if (st) st.value = data.status || 'None';
  var al = document.getElementById('cf-alias'); if (al) al.value = data.alias || '';
  var dk = document.getElementById('cf-deskripsi'); if (dk) dk.value = data.description || '';
  var tl = document.getElementById('cf-tempat-lahir'); if (tl) tl.value = data.birthPlace || '';
  linkedSpesies?.setItems(data.species || []);
  linkedTempat?.setItems(data.places || []);
  charState.linked.spesies = (data.species || []).slice();
  charState.linked.tempat = (data.places || []).slice();
  charState.customFields = JSON.parse(JSON.stringify(data.customFields || []));
  applyImagePreview();
  applyBirthMode();
  renderCustomFields();

  fillPenampilanForm(data);
  fillKepribadianForm(data);
  fillLatarForm(data);
  fillKemampuanForm(data);

  charState.relations = JSON.parse(JSON.stringify(data.relations || []));
  renderRelations();
  charState.tags = (data.tags || []).slice();
  renderTagChips();
  var cat = document.getElementById('cat-catatan'); if (cat) cat.value = data.notes || '';
}

function collectIdentitas() {
  var nl = document.getElementById('cf-nama-lengkap');
  var nd = document.getElementById('cf-nama-depan');
  var nb = document.getElementById('cf-nama-belakang');
  var u = document.getElementById('cf-usia');
  var jk = document.getElementById('cf-jenis-kelamin');
  var st = document.getElementById('cf-status');
  var al = document.getElementById('cf-alias');
  var dk = document.getElementById('cf-deskripsi');
  var tl = document.getElementById('cf-tempat-lahir');
  var cat = document.getElementById('cat-catatan');

  return {
    fullName: nl ? nl.value.trim() : '',
    firstName: nd ? nd.value.trim() : '',
    lastName: nb ? nb.value.trim() : '',
    birthDate: (charState.birthMode === 'number' ? (tglNumber?.value || '') : (tglText?.value || '')).trim(),
    birthMode: charState.birthMode,
    age: u ? u.value.trim() : '',
    gender: jk ? jk.value : 'None',
    status: st ? st.value : 'None',
    alias: al ? al.value.trim() : '',
    image: charState.image,
    description: dk ? dk.value.trim() : '',
    birthPlace: tl ? tl.value.trim() : '',
    species: linkedSpesies ? linkedSpesies.getItems() : [],
    places: linkedTempat ? linkedTempat.getItems() : [],
    customFields: charState.customFields,
    appearance: collectPenampilan(),
    personality: collectKepribadian(),
    background: collectLatar(),
    abilities: collectKemampuan(),
    relations: charState.relations,
    tags: charState.tags,
    notes: cat ? cat.value.trim() : ''
  };
}

window.openCharCreate = function() {
  var title = document.getElementById('char-modal-title'); if (title) title.textContent = 'Buat karakter';
  var sub = document.getElementById('char-modal-sub'); if (sub) sub.textContent = 'Nama Karakter';
  var tv = document.getElementById('tab-varian'); if (tv) tv.style.display = 'none';
  var bv = document.getElementById('base-varian-wrap'); if (bv) bv.style.display = 'none';
  var de = document.getElementById('doc-empty'); if (de) de.style.display = 'block';
  var dl = document.getElementById('doc-list'); if (dl) dl.style.display = 'none';
  clearIdentitasForm();
  resetCharTabs();
  document.getElementById('modal-char')?.classList.add('open');
};

window.openCharModal = function(nameOrId) {
  var id = typeof nameOrId === 'number' ? nameOrId : window._charIdByName && window._charIdByName[nameOrId];
  var title = document.getElementById('char-modal-title'); if (title) title.textContent = 'Edit karakter';
  var sub = document.getElementById('char-modal-sub'); if (sub) sub.textContent = nameOrId || 'Nama Karakter';
  var tv = document.getElementById('tab-varian'); if (tv) tv.style.display = '';
  var bv = document.getElementById('base-varian-wrap'); if (bv) bv.style.display = '';
  var de = document.getElementById('doc-empty'); if (de) de.style.display = 'none';
  var dl = document.getElementById('doc-list'); if (dl) dl.style.display = 'flex';
  resetCharTabs();

  var data = id ? window._charCache && window._charCache[id] : null;
  if (data) {
    var ident = Object.assign({}, data.data || {}, { _id: id });
    fillIdentitasForm(ident);
  } else {
    clearIdentitasForm();
  }
  document.getElementById('modal-char')?.classList.add('open');
};

window.openCharDetail = function(nameOrId) {
  var id = typeof nameOrId === 'number' ? nameOrId : window._charIdByName && window._charIdByName[nameOrId];
  var c = id && window._charCache ? window._charCache[id] : null;
  var sidebar = document.getElementById('char-detail');
  if (!sidebar) return;
  var d = c ? (c.data || {}) : {};

  var dn = document.getElementById('detail-name'); if (dn) dn.textContent = (c && c.name) || nameOrId || 'Nama Lengkap';
  var ds = document.getElementById('detail-sub'); if (ds) ds.textContent = [d.firstName, d.lastName].filter(Boolean).join(' ') || (c && c.name) || '';
  var dd = document.getElementById('detail-desc'); if (dd) dd.textContent = d.description || 'Belum ada deskripsi.';

  var variantRow = document.getElementById('variant-row');
  if (variantRow) variantRow.innerHTML = '<button class="char-variant-btn active">Base Varian</button>';

  var sp = (d.species || []).map(function (s) { return '<span class="char-chip">' + escapeHtml(s.name) + '</span>'; }).join('');
  var dsp = document.getElementById('detail-spesies'); if (dsp) dsp.innerHTML = sp || '<span style="color:var(--text-faint);">-</span>';
  var pl = (d.places || []).map(function (s) { return '<span class="char-chip">' + escapeHtml(s.name) + '</span>'; }).join('');
  var dpl = document.getElementById('detail-lokasi'); if (dpl) dpl.innerHTML = pl || '<span style="color:var(--text-faint);">-</span>';

  sidebar.classList.add('open');
};

// ===================== SIMPAN =====================
async function saveCharacter() {
  if (!window.karakterQuery) { alert('Database belum siap'); return; }
  var ident = collectIdentitas();
  var errEl = document.getElementById('err-nama-lengkap');
  var namaInput = document.getElementById('cf-nama-lengkap');
  if (!ident.fullName) {
    if (errEl) errEl.style.display = 'block';
    namaInput?.focus();
    document.querySelectorAll('.char-modal-tab').forEach(function (t) { t.classList.remove('active'); });
    document.querySelectorAll('.char-pane').forEach(function (p) { p.classList.remove('active'); });
    document.querySelector('[data-pane="pane-identitas"]')?.classList.add('active');
    document.getElementById('pane-identitas')?.classList.add('active');
    return;
  }
  if (errEl) errEl.style.display = 'none';

  var payload = { name: ident.fullName, data: ident };
  try {
    var savedId = charState.editingId;
    if (savedId) {
      await window.karakterQuery.updateCharacter(savedId, payload);
      await window.karakterQuery.logActivity('update', 'character', savedId, ident.fullName, 'Diperbarui');
    } else {
      var created = await window.karakterQuery.addCharacter(payload);
      savedId = created.id;
      await window.karakterQuery.logActivity('create', 'character', created.id, ident.fullName, 'Karakter baru dibuat');
    }

    // Sinkronkan hubungan dua arah
    await syncTwoWayRelations(savedId, ident);

    closeCharModal();
    await refreshCharacters();
  } catch (err) {
    console.error(err);
    alert('Gagal menyimpan karakter: ' + err.message);
  }
}

// Buat/perbarui record hubungan balik pada karakter target
async function syncTwoWayRelations(savedId, ident) {
  var rels = ident.relations || [];
  for (var i = 0; i < rels.length; i++) {
    var rel = rels[i];
    if (!rel.twoWay || !rel.targetId) continue;
    var target = charCache[rel.targetId];
    if (!target) continue;
    var tData = JSON.parse(JSON.stringify(target.data || {}));
    tData.relations = tData.relations || [];

    var inverseType = rel.typeKey === 'Lainnya (Custom)'
      ? (rel.customName || 'Lainnya (Custom)')
      : (RELATION_INVERSE[rel.typeKey] || rel.typeKey);

    var existing = tData.relations.find(function (r) { return r.targetId === savedId; });
    if (existing) {
      existing.typeKey = inverseType;
      existing.targetName = ident.fullName;
      existing.twoWay = true;
    } else {
      tData.relations.push({
        id: 'rel_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        targetId: savedId,
        targetName: ident.fullName,
        typeKey: inverseType,
        customName: '',
        selfLabel: '',
        know: rel.know || 'Publik',
        since: rel.since || '',
        description: rel.description || '',
        twoWay: true
      });
    }
    await window.karakterQuery.updateCharacter(rel.targetId, { name: target.name, data: tData });
    await window.karakterQuery.logActivity('update', 'character', rel.targetId, target.name, 'Hubungan dua arah diperbarui');
  }
}

window.closeCharModal = function() {
  document.getElementById('modal-char')?.classList.remove('open');
};

// ===================== RENDER DAFTAR =====================
var charCache = {};
var charIdByName = {};

async function refreshCharacters() {
  if (!window.karakterQuery) return;
  var characters = await window.karakterQuery.getCharacters();
  charCache = {};
  charIdByName = {};
  (characters || []).forEach(function (c) {
    charCache[c.id] = c;
    charIdByName[c.name] = c.id;
  });
  window._charCache = charCache;
  window._charIdByName = charIdByName;
  window._allCharacters = characters || [];
  applyCharFilters();
  if (typeof renderTagFilterBar === 'function') renderTagFilterBar();
  updateCharBadge((characters || []).length);
}

var activeTagFilter = null;

function applyCharFilters() {
  var q = (document.getElementById('char-search') || {}).value || '';
  var st = (document.getElementById('char-filter-status') || {}).value || '';
  q = q.toLowerCase().trim();
  var list = (window._allCharacters || []).filter(function (c) {
    var d = c.data || {};
    var nameMatch = !q || String(c.name || '').toLowerCase().indexOf(q) !== -1;
    var stMatch = !st || String(d.status || '') === st;
    var tagMatch = !activeTagFilter || (d.tags || []).indexOf(activeTagFilter) !== -1;
    return nameMatch && stMatch && tagMatch;
  });
  renderCharacters(list);
}

function renderTagFilterBar() {
  var row = document.getElementById('char-tag-row');
  var listEl = document.getElementById('char-tag-list');
  if (!row || !listEl) return;

  var tagSet = {};
  (window._allCharacters || []).forEach(function (c) {
    ((c.data || {}).tags || []).forEach(function (t) { tagSet[t] = true; });
  });
  var tags = Object.keys(tagSet).sort();

  if (!tags.length) {
    row.style.display = 'none';
    listEl.innerHTML = '';
    activeTagFilter = null;
    return;
  }
  row.style.display = 'flex';
  row.style.alignItems = 'center';
  row.style.gap = '0.35rem';
  row.style.flexWrap = 'wrap';

  listEl.innerHTML = '';
  tags.forEach(function (t) {
    var badge = document.createElement('span');
    badge.className = 'badge';
    badge.style.cursor = 'pointer';
    if (activeTagFilter === t) {
      badge.style.background = 'rgba(139,92,246,0.25)';
      badge.style.borderColor = 'var(--primary)';
      badge.style.color = '#c4b5fd';
    }
    badge.textContent = t;
    badge.addEventListener('click', function () {
      activeTagFilter = (activeTagFilter === t) ? null : t;
      renderTagFilterBar();
      applyCharFilters();
    });
    listEl.appendChild(badge);
  });
}

document.getElementById('char-search')?.addEventListener('input', debounce(applyCharFilters, 200));
document.getElementById('char-filter-status')?.addEventListener('change', applyCharFilters);

function updateCharBadge(n) {
  var badge = document.querySelector('.page-header h1 .badge');
  if (badge) badge.textContent = n + ' Total';
}

function renderCharacters(characters) {
  var grid = document.getElementById('char-grid');
  var tableBody = document.querySelector('#char-table tbody');
  if (!grid) return;

  var addCard = '<div class="char-card-add" onclick="openCharCreate()"><iconify-icon icon="lucide:plus-circle" width="32"></iconify-icon><span>Tambah Karakter</span></div>';

  if (!characters || characters.length === 0) {
    grid.innerHTML = addCard;
    if (tableBody) tableBody.innerHTML = '';
    return;
  }

  grid.innerHTML = characters.map(function (c) {
    var d = c.data || {};
    var img = d.image
      ? '<img src="' + escapeHtml(d.image) + '" alt="" style="width:100%;height:100%;object-fit:cover;">'
      : '<iconify-icon icon="lucide:image" width="44"></iconify-icon>';
    var species = (d.species || []).map(function (s) { return s.name; }).join(', ');
    var places = (d.places || []).map(function (s) { return s.name; }).join(', ');
    return '<div class="char-card" onclick="openCharDetail(' + c.id + ')">' +
      '<div class="char-card-img">' + img + '<span class="char-status">' + escapeHtml(d.status || 'Hidup') + '</span></div>' +
      '<div class="char-info">' +
      '<div class="char-name">' + escapeHtml(c.name) + ' <span class="char-actions">' +
      '<button class="win-btn" onclick="event.stopPropagation();openCharModal(' + c.id + ')"><iconify-icon icon="lucide:pen-line" width="14"></iconify-icon></button>' +
      '<button class="win-btn del" onclick="event.stopPropagation();deleteCharacter(' + c.id + ')"><iconify-icon icon="lucide:trash-2" width="14"></iconify-icon></button>' +
      '</span></div>' +
      '<div class="char-meta">Spesies: ' + escapeHtml(species || '-') + '</div>' +
      '<div class="char-meta">Lokasi: ' + escapeHtml(places || '-') + '</div>' +
      '<div class="char-meta">Status: ' + escapeHtml(d.status || '-') + '</div>' +
      '<div class="char-tags">' + escapeHtml(d.birthDate || '') + '</div>' +
      '</div></div>';
  }).join('') + addCard;

  if (tableBody) {
    tableBody.innerHTML = characters.map(function (c) {
      var d = c.data || {};
      var species = (d.species || []).map(function (s) { return s.name; }).join(', ');
      var places = (d.places || []).map(function (s) { return s.name; }).join(', ');
      return '<tr onclick="openCharDetail(' + c.id + ')">' +
        '<td><span class="char-row-name">' +
        (d.image ? '<span class="char-row-thumb" style="overflow:hidden;padding:0;"><img src="' + escapeHtml(d.image) + '" style="width:100%;height:100%;object-fit:cover;"></span>' : '<span class="char-row-thumb"><iconify-icon icon="lucide:image" width="14"></iconify-icon></span>') +
        escapeHtml(c.name) + '</span></td>' +
        '<td>' + escapeHtml(d.status || '-') + '</td>' +
        '<td>' + escapeHtml(d.alias || '-') + '</td>' +
        '<td>' + escapeHtml(species || '-') + '</td>' +
        '<td>' + escapeHtml(places || '-') + '</td>' +
        '<td>' + escapeHtml(d.birthPlace || '-') + '</td>' +
        '<td>' + escapeHtml(d.birthDate || '-') + '</td>' +
        '<td><button class="win-btn" onclick="event.stopPropagation();openCharModal(' + c.id + ')"><iconify-icon icon="lucide:pen-line" width="14"></iconify-icon></button>' +
        '<button class="win-btn" style="color:var(--danger);" onclick="event.stopPropagation();deleteCharacter(' + c.id + ')"><iconify-icon icon="lucide:trash-2" width="14"></iconify-icon></button></td>' +
        '</tr>';
    }).join('');
  }
}

window.deleteCharacter = async function(id) {
  if (!confirm('Hapus karakter ini?')) return;
  if (!window.karakterQuery) return;
  var c = charCache[id];
  await window.karakterQuery.deleteCharacter(id);
  await window.karakterQuery.logActivity('delete', 'character', id, c ? c.name : 'Character', 'Dihapus dari daftar');
  await refreshCharacters();
  document.getElementById('char-detail')?.classList.remove('open');
};

// ===================== INIT =====================
async function initKarakterPage() {
  if (!window.AetherPageUtils) return;
  var utils = await window.AetherPageUtils.initPage();
  if (!utils.query) {
    console.warn('Tidak ada proyek aktif; karakter tidak dimuat.');
    renderCharacters([]);
    return;
  }
  window.karakterQuery = utils.query;
  if (linkedSpesies) await linkedSpesies.refresh();
  if (linkedTempat) await linkedTempat.refresh();
  await refreshAllCollections();
  await refreshCharacters();
  renderTagFilterBar();

  // tombol Simpan di footer modal
  document.querySelector('#modal-char .btn-confirm')?.addEventListener('click', saveCharacter);
  // Enter di Nama Lengkap → simpan
  document.getElementById('cf-nama-lengkap')?.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); saveCharacter(); }
  });
}

initKarakterPage();
