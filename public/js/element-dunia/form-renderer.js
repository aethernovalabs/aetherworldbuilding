// awb-form-renderer.js
// Renderer formulir generik berbasis schema.
// kind yang didukung:
//   text       → <input type="text">
//   textarea   → <textarea>
//   number     → <input type="number">
//   select     → <select> dari options[]
//   bool       → <input type="checkbox"> (nilai true/false)
//   tags       → input + Enter → chip
//   image      → preview + Edit → popup URL
//   linked     → daftar chip linked ke tipe lain (manual chips, ambil dari existing data)
//   extra      → daftar dynamic field (Nama + Type + Isi)
//   list       → daftar item dengan itemSchema.fields
//
// API:
//   renderForm(schema)         → kembalikan HTMLString untuk disisipkan ke modal-body
//   collectForm(modalEl, schema) → kembalikan { name, description, imageUrl, tags,
//                                            extraFields, linkedElements, fields:{}, lists:{} }
//   populateForm(modalEl, schema, data) → isi form dari data existing
(function () {
  "use strict";

  // ---------- builder untuk 1 field ----------
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function inputCls() { return "form-input"; }
  function labelCls() { return "form-label"; }
  function fieldWrap(field, inner) {
    return '<div data-key="' + field.key + '" data-kind="' + field.kind + '">' +
      '<label class="' + labelCls() + '">' + escapeHtml(field.label) + '</label>' + inner + '</div>';
  }

  function renderField(field) {
    var p = field.placeholder ? ' placeholder="' + escapeHtml(field.placeholder) + '"' : '';
    switch (field.kind) {
      case "text":
        return fieldWrap(field, '<input type="text" class="' + inputCls() + '" data-field="' + field.key + '"' + p + '>');
      case "textarea":
        var rows = field.rows || 3;
        return fieldWrap(field, '<textarea class="' + inputCls() + '" rows="' + rows + '" data-field="' + field.key + '"></textarea>');
      case "number":
        return fieldWrap(field, '<input type="number" class="' + inputCls() + '" data-field="' + field.key + '">');
      case "select": {
        var opts = (field.options || []).map(function (o) {
          return '<option value="' + escapeHtml(o) + '">' + escapeHtml(o) + '</option>';
        }).join("");
        return fieldWrap(field, '<select class="' + inputCls() + '" data-field="' + field.key + '"><option value=""></option>' + opts + '</select>');
      }
      case "bool":
        return fieldWrap(field,
          '<label style="display:flex;gap:0.4rem;align-items:center;font-size:0.8rem;">' +
            '<input type="checkbox" data-field="' + field.key + '"> ' +
            '<span>' + escapeHtml(field.placeholder || "Ya/Tidak") + '</span>' +
          '</label>');
      case "tags":
        return fieldWrap(field,
          '<input type="text" class="' + inputCls() + '" data-tag-input placeholder="Ketik lalu Enter">' +
          '<div data-tag-list style="display:flex;gap:0.3rem;flex-wrap:wrap;margin-top:0.3rem;font-size:0.72rem;"></div>');
      case "image":
        return '<div data-key="' + field.key + '" data-kind="image">' +
            '<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;">' +
              '<label class="' + labelCls() + '" style="margin:0;">' + escapeHtml(field.label) + '</label>' +
              '<button type="button" class="win-btn" data-image-edit style="flex-shrink:0;">Edit</button>' +
            '</div>' +
            '<div class="elem-img-preview" data-image-preview style="width:100%;height:120px;border:1px solid var(--border);border-radius:6px;background:var(--bg-surface);display:flex;align-items:center;justify-content:center;color:var(--text-faint);overflow:hidden;"><iconify-icon icon="lucide:image" width="32"></iconify-icon></div>' +
            '<input type="text" class="elem-img-url" data-image-url style="display:none;">' +
          '</div>';
      case "linked":
        return fieldWrap(field,
          '<input type="text" class="' + inputCls() + '" data-linked-input data-linked-type="' + escapeHtml(field.linkedType || "") + '" placeholder="Ketik nama lalu Enter" autocomplete="off">' +
          '<div class="linked-dropdown"></div>' +
          '<div data-linked-list style="display:flex;gap:0.3rem;flex-wrap:wrap;margin-top:0.3rem;font-size:0.72rem;"></div>');
      case "extra":
        return renderExtraField();
      case "list":
        return renderListField(field);
      default:
        return "";
    }
  }

  // Bidang Ekstra (4-type: Text/Number/Boolean/Linked)
  function renderExtraField() {
    return '<div class="extra-wrap" data-key="extraFields" data-kind="extra" ' +
        'style="border:1px solid var(--border);border-radius:var(--radius-md);padding:0.8rem;background:var(--bg-dark);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">' +
          '<span style="font-size:0.82rem;font-weight:700;">Bidang Ekstra</span>' +
          '<button type="button" class="win-btn" data-extra-add-top title="Tambah bidang">+</button>' +
        '</div>' +
        '<div class="extra-list" data-extra-list style="display:flex;flex-direction:column;gap:0.5rem;"></div>' +
        '<button type="button" class="elem-cat-btn" data-extra-add style="width:100%;margin-top:0.5rem;margin-bottom:0;">Tambah Bidang</button>' +
      '</div>';
  }

  function renderExtraItem() {
    return '<div class="extra-item" ' +
        'style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.5rem;background:var(--bg-surface);">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:0.5rem;align-items:end;">' +
          '<div><label class="' + labelCls() + '">Nama</label><input type="text" class="' + inputCls() + '" data-extra-name></div>' +
          '<div><label class="' + labelCls() + '">Type</label><select class="' + inputCls() + '" data-extra-type>' +
            '<option value=""></option>' +
            '<option>Text</option><option>Number</option><option>Boolean</option><option>Linked</option>' +
          '</select></div>' +
          '<div><button type="button" class="win-btn" data-extra-del style="color:var(--danger);" title="Hapus bidang">' +
            '<iconify-icon icon="lucide:trash-2" width="14"></iconify-icon></button></div>' +
        '</div>' +
        '<div style="margin-top:0.5rem;"><label class="' + labelCls() + '">Isi</label>' +
          '<input type="text" class="' + inputCls() + '" data-extra-value></div>' +
      '</div>';
  }

  // List (untuk sekolah sihir, frasa umum, dst)
  function renderListField(field) {
    var sub = (field.itemSchema && field.itemSchema.fields) || [];
    var subs = sub.map(function (s) {
      var inp = s.kind === "textarea"
        ? '<textarea class="' + inputCls() + '" rows="' + (s.rows || 2) + '" data-list-field="' + s.key + '"></textarea>'
        : '<input type="text" class="' + inputCls() + '" data-list-field="' + s.key + '">';
      return '<div><label class="' + labelCls() + '">' + escapeHtml(s.label) + '</label>' + inp + '</div>';
    }).join("");

    return '<div class="list-wrap" data-key="' + field.key + '" data-kind="list" ' +
        'style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.5rem;background:var(--bg-surface);">' +
        '<div data-list-list style="display:flex;flex-direction:column;gap:0.5rem;"></div>' +
        '<button type="button" class="elem-cat-btn" data-list-add style="width:100%;margin-top:0.4rem;margin-bottom:0;">' +
          '+ Tambah ' + escapeHtml(field.label.replace(/\s*\(daftar\)/, "")) +
        '</button>' +
        '<template data-list-template>' +
          '<div class="list-item" style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.5rem;background:var(--bg-surface);">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">' +
              '<span style="font-size:0.78rem;">Item</span>' +
              '<button type="button" class="win-btn" data-list-del style="color:var(--danger);" title="Hapus">' +
                '<iconify-icon icon="lucide:trash-2" width="14"></iconify-icon>' +
              '</button>' +
            '</div>' +
            subs +
          '</div>' +
        '</template>' +
      '</div>';
  }

  function renderGroupCard(group) {
    var fields = (group.fields || []).map(renderField).join("");
    return '<div style="border:1px solid var(--border);border-radius:var(--radius-md);padding:0.8rem;' +
      'background:var(--bg-dark);display:flex;flex-direction:column;gap:0.5rem;">' +
      (group.title ? '<div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;">' +
        escapeHtml(group.title) + '</div>' : '') +
      fields +
    '</div>';
  }

  // ---------- render seluruh schema ----------
  // Otomatis prepend BASE_FIELDS (name, image, description, tags, extraFields, notes)
  // di awal form supaya renderer generik tanpa pemetaan manual.
  var BASE_FIELDS = [
    { key: "name", label: "Nama", kind: "text", required: true },
    { key: "image", label: "Gambar", kind: "image" },
    { key: "description", label: "Deskripsi", kind: "textarea" },
    { key: "tags", label: "Tag", kind: "tags" }
  ];
  var TAIL_FIELDS = [
    { key: "extraFields", label: "Bidang Ekstra", kind: "extra" },
    { key: "notes", label: "Catatan Tambahan", kind: "textarea" }
  ];

  function renderForm(schema) {
    var baseGroup = { title: "", fields: BASE_FIELDS };
    var tailGroup = { title: "", fields: TAIL_FIELDS };
    var groups = [baseGroup];
    if (schema && schema.length) groups = groups.concat(schema);
    groups.push(tailGroup);
    return groups.map(renderGroupCard).join("");
  }

  // ---------- collect ----------
  function getVal(el) {
    if (!el) return "";
    if (el.type === "checkbox") return el.checked;
    return el.value;
  }

  function collectFromModal(modal) {
    // name + image + description + tags
    var nameInput = modal.querySelector('[data-field="name"]');
    var descInput = modal.querySelector('[data-field="description"]');
    var notesInput = modal.querySelector('[data-field="notes"]');
    var imgInput = modal.querySelector('[data-image-url]');

    // tags
    var tagChips = Array.from(modal.querySelectorAll('[data-tag-list] .badge'))
      .map(function (b) { return b.textContent.replace(/\s*[xX]\s*$/, "").trim(); })
      .filter(function (t) { return t; });

    // extra fields
    var extraItems = modal.querySelectorAll('[data-extra-list] .extra-item');
    var extraFields = {};
    extraItems.forEach(function (item) {
      var n = item.querySelector('[data-extra-name]');
      var t = item.querySelector('[data-extra-type]');
      var v = item.querySelector('[data-extra-value]');
      if (n && n.value.trim()) {
        extraFields[n.value.trim()] = { type: (t && t.value) || "text", value: v ? v.value : "" };
      }
    });

    // linked elements - now stores {id, name, type} objects
    var linkedElements = {};
    modal.querySelectorAll('[data-linked-list]').forEach(function (list) {
      var key = list.parentElement.getAttribute("data-key");
      var chips = Array.from(list.querySelectorAll('.badge[data-linked-id]')).map(function (b) {
        return {
          id: b.dataset.linkedId,
          name: b.dataset.linkedName,
          type: b.dataset.linkedType
        };
      }).filter(function (t) { return t && t.id; });
      if (key) linkedElements[key] = chips;
    });

    // field tambahan
    var fields = {};
    modal.querySelectorAll('[data-field]').forEach(function (el) {
      var key = el.getAttribute("data-field");
      if (["name", "description", "notes"].indexOf(key) >= 0) return;
      fields[key] = getVal(el);
    });

    // lists (e.g. sekolahSihir, frasaUmum)
    var lists = {};
    modal.querySelectorAll('[data-kind="list"]').forEach(function (wrap) {
      var key = wrap.getAttribute("data-key");
      var items = Array.from(wrap.querySelectorAll('[data-list-list] .list-item')).map(function (item) {
        var row = {};
        item.querySelectorAll('[data-list-field]').forEach(function (el) {
          row[el.getAttribute("data-list-field")] = el.value;
        });
        return row;
      }).filter(function (r) { return Object.values(r).some(function (v) { return v && String(v).trim(); }); });
      lists[key] = items;
    });

    return {
      name: nameInput ? nameInput.value.trim() : "",
      imageUrl: imgInput ? imgInput.value : "",
      description: descInput ? descInput.value : "",
      notes: notesInput ? notesInput.value : "",
      tags: tagChips,
      extraFields: extraFields,
      linkedElements: linkedElements,
      fields: fields,
      lists: lists
    };
  }

  // ---------- populate (untuk mode edit) ----------
  function populateModal(modal, schema, data) {
    if (!modal || !data) return;
    data = data || {};
    var fields = data.fields || {};
    var lists = data.lists || {};
    var extra = data.extraFields || {};
    var linked = data.linkedElements || {};

    // base
    var nameInput = modal.querySelector('[data-field="name"]');
    if (nameInput) nameInput.value = data.name || "";

    var descInput = modal.querySelector('[data-field="description"]');
    if (descInput) descInput.value = data.description || "";

    var notesInput = modal.querySelector('[data-field="notes"]');
    if (notesInput) notesInput.value = data.notes || "";

    var imgUrl = data.imageUrl || "";
    var imgUrlInput = modal.querySelector('[data-image-url]');
    if (imgUrlInput) imgUrlInput.value = imgUrl;
    var imgPreview = modal.querySelector('[data-image-preview]');
    if (imgPreview) {
      if (imgUrl) {
        var img = document.createElement("img");
        img.src = imgUrl;
        img.style.cssText = "width:100%;height:100%;object-fit:cover;";
        img.onload = function () { imgPreview.innerHTML = ""; imgPreview.appendChild(img); };
        img.onerror = function () { imgPreview.textContent = "URL tidak valid"; };
      } else {
        imgPreview.innerHTML = '<iconify-icon icon="lucide:image" width="32"></iconify-icon>';
      }
    }

    // tags
    var tagList = modal.querySelector('[data-tag-list]');
    if (tagList && Array.isArray(data.tags)) {
      tagList.innerHTML = "";
      data.tags.forEach(function (t) { tagList.appendChild(makeChip(t)); });
    }

    // extra
    var extraList = modal.querySelector('[data-extra-list]');
    if (extraList) {
      extraList.innerHTML = "";
      var names = Object.keys(extra);
      if (names.length === 0) {
        extraList.appendChild(buildExtraItem("", "Text", ""));
      } else {
        names.forEach(function (n) {
          var f = extra[n] || {};
          extraList.appendChild(buildExtraItem(n, f.type || "Text", f.value || ""));
        });
      }
    }

    // linked - now uses makeLinkedChip with ID, name, type
    modal.querySelectorAll('[data-linked-list]').forEach(function (list) {
      var key = list.parentElement.getAttribute("data-key");
      list.innerHTML = "";
      (linked[key] || []).forEach(function (item) {
        var name = item.name || item; // backward compat: string or object
        var id = item.id || "";
        var type = item.type || "";
        list.appendChild(makeLinkedChip(id, name, type));
      });
    });

    // field tambahan
    Object.keys(fields).forEach(function (k) {
      var el = modal.querySelector('[data-field="' + k + '"]');
      if (!el) return;
      if (el.type === "checkbox") el.checked = !!fields[k];
      else el.value = fields[k] == null ? "" : fields[k];
    });

    // lists
    modal.querySelectorAll('[data-kind="list"]').forEach(function (wrap) {
      var key = wrap.getAttribute("data-key");
      var container = wrap.querySelector('[data-list-list]');
      var tpl = wrap.querySelector('[data-list-template]');
      container.innerHTML = "";
      (lists[key] || []).forEach(function (row) {
        var node = tpl.content.firstElementChild.cloneNode(true);
        node.querySelectorAll('[data-list-field]').forEach(function (el) {
          var k = el.getAttribute("data-list-field");
          el.value = row[k] || "";
        });
        container.appendChild(node);
      });
    });
  }

  function makeChip(text) {
    var b = document.createElement("span");
    b.className = "badge";
    b.textContent = text + " x";
    return b;
  }

  // --- Linked field helpers ---

  // Buat chip linked dengan ID, nama, tipe
  function makeLinkedChip(id, name, type) {
    var b = document.createElement("span");
    b.className = "badge";
    b.dataset.linkedId = id;
    b.dataset.linkedName = name;
    b.dataset.linkedType = type;
    b.style.cursor = "pointer";
    b.innerHTML = '<span class="linked-name">' + escapeHtml(name) + '</span>' +
      '<button type="button" class="linked-remove" title="Hapus tautan" aria-label="Hapus ' + escapeHtml(name) + '">&times;</button>';
    return b;
  }

  // Cari/buat element target saat user tekan Enter di linked input
  async function handleLinkedInputEnter(modal, inputEl, linkedType) {
    var name = inputEl.value.trim();
    if (!name) return;

    // Cek duplikat di list
    var list = inputEl.parentElement.querySelector('[data-linked-list]');
    var existing = Array.from(list.querySelectorAll('.badge[data-linked-name]')).some(function (b) {
      return b.dataset.linkedName.toLowerCase() === name.toLowerCase();
    });
    if (existing) {
      inputEl.value = "";
      closeLinkedDropdown(inputEl);
      return;
    }

    // Cari element existing di allElements (by name, case-insensitive, same type)
    var all = window._elemDuniaAll || [];
    var target = all.find(function (e) {
      return e._type === linkedType && (e.name || "").trim().toLowerCase() === name.toLowerCase();
    });

    var targetId, targetName, targetResType;
    if (target) {
      targetId = target.id;
      targetName = target.name;
      targetResType = target._type;
    } else {
      // Buat element baru otomatis (pakai linkedType, bukan target._type)
      if (!window.elementDuniaQuery) return;
      try {
        var created = await window.elementDuniaQuery.addElement({
          name: name,
          type: linkedType,
          data: { description: "", imageUrl: "", tags: [], extraFields: {}, linkedElements: {}, notes: "", fields: {}, lists: {} }
        });
        targetId = created.id;
        targetName = name;
        targetResType = linkedType;
        target = created;
        // Refresh allElements
        if (window._elemDuniaAll) {
          window._elemDuniaAll.push(Object.assign({}, created, { _type: linkedType }));
        }
      } catch (err) {
        console.error("Gagal buat element linked:", err);
        alert("Gagal membuat element terautomasi: " + err.message);
        return;
      }
    }

    // Tambah chip
    var chip = makeLinkedChip(targetId, targetName, targetResType);
    list.appendChild(chip);
    inputEl.value = "";
    closeLinkedDropdown(inputEl);
  }

  // ---------- Linked dropdown (mirip LinkedInput di karakter.js) ----------

  var linkedDropdownState = { input: null, type: null };

  function closeLinkedDropdown(inputEl) {
    var dd = inputEl ? inputEl.parentElement.querySelector('.linked-dropdown') : null;
    if (dd) dd.classList.remove('open');
    linkedDropdownState.input = null;
    linkedDropdownState.type = null;
  }

  function renderLinkedDropdown(inputEl, linkedType) {
    var name = (inputEl.value || '').trim().toLowerCase();
    var dd = inputEl.parentElement.querySelector('.linked-dropdown');
    if (!dd) return;

    // Refresh cache dari allElements (sinkron dengan DB terakhir)
    var all = window._elemDuniaAll || [];
    var cache = all.filter(function (e) { return e._type === linkedType; })
      .map(function (e) { return { id: e.id, name: e.name, type: e._type }; });

    dd.innerHTML = '';
    var shown = 0;

    // Tampilkan match dari cache
    cache.forEach(function (e) {
      if (e.name.toLowerCase().indexOf(name) === -1) return;
      // Skip yang sudah ter-link di list ini
      var list = inputEl.parentElement.querySelector('[data-linked-list]');
      var already = Array.from(list.querySelectorAll('.badge[data-linked-id]')).some(function (b) {
        return b.dataset.linkedId && String(b.dataset.linkedId) === String(e.id);
      });
      if (already) return;

      var opt = document.createElement('div');
      opt.className = 'linked-opt';
      opt.innerHTML = '<span>' + escapeHtml(e.name) + '</span><span class="linked-opt-type">' + escapeHtml(e.type) + '</span>';
      opt.dataset.linkedId = e.id;
      opt.dataset.linkedName = e.name;
      opt.dataset.linkedType = e.type;
      opt.addEventListener('mousedown', function (ev) {
        ev.preventDefault();
        addLinkedItemFromDropdown(inputEl, e);
      });
      dd.appendChild(opt);
      shown++;
    });

    // Opsi buat baru jika nama tidak kosong dan belum ada exact match
    if (name) {
      var exactExists = cache.some(function (e) { return e.name.toLowerCase() === name; });
      if (!exactExists) {
        var createOpt = document.createElement('div');
        createOpt.className = 'linked-opt create';
        createOpt.innerHTML = '<span>+ Buat "' + escapeHtml(inputEl.value.trim()) + '"</span><span class="linked-opt-type">' + escapeHtml(linkedType) + '</span>';
        createOpt.addEventListener('mousedown', function (ev) {
          ev.preventDefault();
          var newName = inputEl.value.trim();
          if (!newName) return;
          // Simulasi Enter untuk auto-create
          inputEl.value = newName;
          closeLinkedDropdown(inputEl);
          if (window.AwbFormRenderer && window.AwbFormRenderer.handleLinkedInputEnter) {
            window.AwbFormRenderer.handleLinkedInputEnter(modalForInput(inputEl), inputEl, linkedType);
          }
        });
        dd.appendChild(createOpt);
        shown++;
      }
    }

    if (shown > 0) {
      dd.classList.add('open');
      linkedDropdownState.input = inputEl;
      linkedDropdownState.type = linkedType;
    } else {
      dd.classList.remove('open');
    }
  }

  function addLinkedItemFromDropdown(inputEl, item) {
    var list = inputEl.parentElement.querySelector('[data-linked-list]');
    // Cek duplikat
    var already = Array.from(list.querySelectorAll('.badge[data-linked-id]')).some(function (b) {
      return b.dataset.linkedId && String(b.dataset.linkedId) === String(item.id);
    });
    if (already) {
      closeLinkedDropdown(inputEl);
      inputEl.value = '';
      return;
    }
    var chip = makeLinkedChip(item.id, item.name, item.type);
    list.appendChild(chip);
    inputEl.value = '';
    closeLinkedDropdown(inputEl);
  }

  function modalForInput(inputEl) {
    return inputEl.closest('.modal-overlay') || document.getElementById('modal-buat-element');
  }

  function buildExtraItem(name, type, value) {
    var tmp = document.createElement("div");
    tmp.innerHTML = renderExtraItem();
    var item = tmp.firstElementChild;
    if (name) item.querySelector("[data-extra-name]").value = name;
    if (type) item.querySelector("[data-extra-type]").value = type;
    if (value) item.querySelector("[data-extra-value]").value = value;
    return item;
  }

  function clearModal(modal) {
    modal.querySelectorAll('[data-field]').forEach(function (el) {
      if (el.type === "checkbox") el.checked = false;
      else el.value = "";
    });
    modal.querySelectorAll('[data-image-preview]').forEach(function (p) {
      p.innerHTML = '<iconify-icon icon="lucide:image" width="32"></iconify-icon>';
    });
    modal.querySelectorAll('[data-image-url]').forEach(function (i) { i.value = ""; });
    modal.querySelectorAll('[data-tag-list], [data-linked-list]').forEach(function (l) { l.innerHTML = ""; });
    modal.querySelectorAll('[data-extra-list]').forEach(function (l) {
      l.innerHTML = "";
      l.appendChild(buildExtraItem("", "Text", ""));
    });
    modal.querySelectorAll('[data-list-list]').forEach(function (l) { l.innerHTML = ""; });
  }

  // expose
  window.AwbFormRenderer = {
    renderForm: renderForm,
    collectFromModal: collectFromModal,
    populateModal: populateModal,
    clearModal: clearModal,
    buildExtraItem: buildExtraItem,
    makeLinkedChip: makeLinkedChip,
    handleLinkedInputEnter: handleLinkedInputEnter,
    renderLinkedDropdown: renderLinkedDropdown,
    closeLinkedDropdown: closeLinkedDropdown
  };
})();
