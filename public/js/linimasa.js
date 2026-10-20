// ===== Linimasa Logic =====
// Halaman linimasa mengikuti pola Elemen Dunia: formulir generik (AwbFormRenderer),
// preview gambar + popup, tag chips, dan linked chips dengan dropdown.

(function () {
  "use strict";

  // ---------- State ----------
  var state = {
    project: null,
    query: null,
    allCharacters: [],
    allElements: [],
    allEvents: [],
    currentEditingEventId: null,
    currentImageTargetInput: null,
    activeTag: null,
    searchTerm: "",
    typeFilter: ""
  };

  var MODAL_ID = "modal-peristiwa";
  var BODY_ID = "modal-peristiwa-body";
  var POPUP_ID = "pop-peristiwa-img";
  var POPUP_URL_ID = "pop-peristiwa-img-url";
  var POPUP_PREVIEW_ID = "elem-pop-img-preview-peristiwa";

  var TYPE_OPTIONS = ["Perang", "Bencana", "Penemuan", "Politik", "Budaya", "Institusi", "Kelahiran", "Lainnya"];
  var PUBLIC_OPTIONS = ["Diketahui Umum", "Rahasia", "Legenda"];

  // Sumber data linked per tipe. 'multi' = campuran tipe (Faksi,Kelompok).
  var LINKED_SOURCES = {
    Karakter: { source: "characters", label: "Karakter", add: "addCharacter" },
    Peristiwa: { source: "events", label: "Peristiwa", add: "addEvent" },
    Lokasi: { source: "elements", elementType: "Lokasi", label: "Lokasi", add: "addElement" },
    Faksi: { source: "elements", elementType: "Faksi", label: "Faksi", add: "addElement" },
    Kelompok: { source: "elements", elementType: "Kelompok", label: "Kelompok", add: "addElement" },
    "Faksi,Kelompok": {
      source: "elements", elementTypes: ["Faksi", "Kelompok"], label: "Faksi/Kelompok", multi: true
    }
  };

  // ---------- Schema formulir peristiwa ----------
  var SCHEMA = [
    {
      title: "Detail Peristiwa",
      fields: [
        { key: "type", label: "Tipe Peristiwa", kind: "select", options: TYPE_OPTIONS },
        { key: "era", label: "Tanggal / Era", kind: "text", placeholder: "cth: Tahun 0 PE" },
        { key: "durasi", label: "Durasi", kind: "text" },
        { key: "publicKnowledge", label: "Pengetahuan Publik", kind: "select", options: PUBLIC_OPTIONS }
      ]
    },
    {
      title: "Narasi Sejarah",
      fields: [
        { key: "cause", label: "Penyebab", kind: "textarea", rows: 2 },
        { key: "consequence", label: "Konsekuensi", kind: "textarea", rows: 2 },
        { key: "historicalSignificance", label: "Pentingnya Sejarah", kind: "textarea", rows: 2 }
      ]
    },
    {
      title: "Relasi Dunia",
      fields: [
        { key: "tokohKunci", label: "Tokoh Kunci", kind: "linked", linkedType: "Karakter" },
        { key: "peristiwaTerkait", label: "Peristiwa Terkait", kind: "linked", linkedType: "Peristiwa" },
        { key: "lokasi", label: "Lokasi", kind: "linked", linkedType: "Lokasi" },
        { key: "orangTerlibat", label: "Orang yang Terlibat", kind: "linked", linkedType: "Karakter" },
        { key: "faksiKelompok", label: "Faksi / Kelompok yang Terlibat", kind: "linked", linkedType: "Faksi,Kelompok" }
      ]
    }
  ];

  // Dipakai panel sidebar detail (linimasa-detail.js): schema, lookup, navigasi linked.
  window._linimasaSchema = SCHEMA;
  window._linimasaGetEvent = function (id) {
    return state.allEvents.find(function (e) { return String(e.id) === String(id); }) || null;
  };
  window._linimasaNavigate = function (type) {
    var world = state.project ? state.project.name : "";
    if (type === "Karakter") {
      location.href = "karakter.page.html?world=" + encodeURIComponent(world);
      return true;
    }
    if (type === "Lokasi" || type === "Faksi" || type === "Kelompok") {
      location.href = "element-dunia.page.html?world=" + encodeURIComponent(world);
      return true;
    }
    return false;
  };

  // ---------- Utilitas ----------
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function escapeAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }
  function debounce(fn, ms) {
    var timer;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  // ---------- Load data ----------
  async function loadData() {
    if (!state.query) return;
    state.allCharacters = await state.query.getCharacters() || [];
    state.allElements = (await state.query.getElements() || []).map(function (e) {
      return Object.assign({}, e, { _type: e.type });
    });
    state.allEvents = await state.query.getEvents() || [];
  }

  // ---------- Filter ----------
  function filteredEvents() {
    var q = state.searchTerm;
    var typeFilter = state.typeFilter;
    return state.allEvents.filter(function (ev) {
      var d = ev.data || {};
      var f = d.fields || {};
      var name = String(ev.name || "").toLowerCase();
      var desc = String(d.description || d.deskripsi || "").toLowerCase();
      if (q && name.indexOf(q) === -1 && desc.indexOf(q) === -1) return false;
      if (typeFilter && typeFilter !== "Semua Type" && String(f.type || d.type || "") !== typeFilter) return false;
      if (state.activeTag && !(d.tags || []).includes(state.activeTag)) return false;
      return true;
    });
  }

  // ---------- Render tag filter ----------
  function renderTagFilter() {
    var host = document.getElementById("timeline-tag-filter");
    if (!host) return;
    var seen = {};
    state.allEvents.forEach(function (e) {
      (e.data && e.data.tags || []).forEach(function (t) {
        var k = String(t || "").trim();
        if (k && !seen[k]) seen[k] = true;
      });
    });
    var tags = Object.keys(seen);
    if (!tags.length) {
      host.style.display = "none";
      host.innerHTML = "";
      return;
    }
    host.style.display = "";
    var parts = ['<span style="font-size:0.78rem;color:var(--text-muted);">Tag:</span>'];
    tags.forEach(function (t) {
      var isActive = state.activeTag === t;
      parts.push(
        '<button type="button" data-tag-filter="' + escapeAttr(t) + '"' +
        ' class="btn-tag-filter' + (isActive ? " active" : "") + '"' +
        ' style="font-size:0.72rem;border:1px solid ' + (isActive ? "var(--danger)" : "var(--border)") + ';' +
        'background:' + (isActive ? "var(--bg-dark)" : "var(--bg-surface)") + ';' +
        'color:' + (isActive ? "var(--text)" : "var(--text-muted)") + ';' +
        'border-radius:999px;padding:0.15rem 0.55rem;cursor:pointer;">' +
        escapeHtml(t) +
        '</button>'
      );
    });
    host.innerHTML = parts.join(" ");
    host.querySelectorAll("[data-tag-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var val = btn.getAttribute("data-tag-filter");
        state.activeTag = (state.activeTag === val) ? null : val;
        render();
      });
    });
  }

  // ---------- Helper ----------
  function badgeForType(type) {
    var t = String(type || "").toLowerCase();
    if (t === "perang" || t === "bencana") return "badge-red";
    if (t === "penemuan" || t === "kelahiran") return "badge-purple";
    if (t === "politik" || t === "institusi" || t === "budaya") return "badge-blue";
    return "badge-purple";
  }
  // ---------- Render timeline (list / grid) ----------
  function renderTimeline(events) {
    var container = document.getElementById("timeline-content");
    if (!container) return;
    if (!events || events.length === 0) {
      container.innerHTML =
        '<div style="padding:2rem;text-align:center;color:var(--text-faint);font-size:0.85rem;">' +
        'Belum ada peristiwa.<br><br>' +
        '</div>';
      return;
    }

    var byEra = {};
    events.forEach(function (e) {
      var d = e.data || {};
      var f = d.fields || {};
      var era = f.era || d.era || "Era Tidak Diketahui";
      if (!byEra[era]) byEra[era] = [];
      byEra[era].push(e);
    });

    var html = "";
    Object.entries(byEra).forEach(function (entry) {
      var era = entry[0];
      var evs = entry[1];
      html += '<div class="era-section">';
      html += '<div class="era-title"><iconify-icon icon="lucide:sun"></iconify-icon> ' + escapeHtml(era) + '</div>';
      html += '<div class="timeline-track">';
      evs.forEach(function (ev) {
        var d = ev.data || {};
        var f = d.fields || {};
        var isMajor = d.major === true;
        var type = f.type || d.type || "Lainnya";
        var imageUrl = d.imageUrl || "";
        var tags = Array.isArray(d.tags) ? d.tags : [];

        var tagHtml = tags.map(function (t) {
          return '<span class="badge">' + escapeHtml(t) + '</span>';
        }).join("");
        var typeBadge = '<span class="badge ' + badgeForType(type) + '">' + escapeHtml(type) + '</span>';
        var eraBadge = '<span class="badge badge-purple event-date">' + escapeHtml(era) + '</span>';
        var headerBtns =
          '<button class="win-btn" title="Edit" onclick="event.stopPropagation();window.openPeristiwaModal(' + ev.id + ')"><iconify-icon icon="lucide:pen-line" width="14"></iconify-icon></button>' +
          '<button class="win-btn event-del" title="Hapus" style="color:var(--danger);" onclick="event.stopPropagation();window.deletePeristiwa(' + ev.id + ')"><iconify-icon icon="lucide:trash-2" width="14"></iconify-icon></button>';
        var thumb = imageUrl
          ? '<img src="' + escapeHtml(imageUrl) + '" alt="" loading="lazy">'
          : '<span class="event-thumb-fallback"><iconify-icon icon="lucide:image" width="22"></iconify-icon></span>';
        var cause = (f.cause || d.cause || "").trim();
        var consequence = (f.consequence || d.consequence || "").trim();
        var description = (d.description || d.deskripsi || "").trim();
        var visibleCause = cause
          ? '<div class="event-box"><div class="event-box-label">Penyebab</div><div>' + escapeHtml(cause) + '</div></div>'
          : "";
        var visibleConsequence = consequence
          ? '<div class="event-box"><div class="event-box-label">Konsekuensi</div><div>' + escapeHtml(consequence) + '</div></div>'
          : "";
        var visibleTags = tagHtml ? '<div class="event-tags">' + tagHtml + '</div>' : "";

        html += '<div class="timeline-event' + (isMajor ? ' major' : '') + '">';
        html += '<div class="event-card" data-id="' + ev.id + '">';
        html += '<div class="event-thumb">' + thumb +
          '<div class="event-overlay">' +
          '<div class="event-actions">' + headerBtns + '</div>' +
          '<div class="event-meta">' + eraBadge + typeBadge + '</div>' +
          '</div></div>';
        html += '<div class="event-main">' +
          '<div class="event-name">' + escapeHtml(ev.name || "Unknown") + '</div>' +
          '<div class="event-meta">' + eraBadge + typeBadge + '</div>' +
          '</div>';
        html += '<div class="event-actions">' + headerBtns + '</div>';
        if (description || visibleCause || visibleConsequence || visibleTags) {
          html += '<div class="event-sep"></div>';
          if (description) html += '<div class="event-desc">' + escapeHtml(description) + '</div>';
          if (visibleCause || visibleConsequence) {
            html += '<div class="event-cause-conseq">' + visibleCause + visibleConsequence + '</div>';
          }
          html += visibleTags;
        }
        html += '</div></div>';
      });
      html += '</div></div>';
    });
    container.innerHTML = html;
  }

  function render() {
    renderTimeline(filteredEvents());
    renderTagFilter();
  }

  // ---------- Sumber data linked ----------
  function resolveLinkedSource(linkedType) {
    var cfg = LINKED_SOURCES[linkedType];
    if (!cfg) return [];
    var list = [];
    var types = cfg.elementTypes || (cfg.elementType ? [cfg.elementType] : []);
    if (cfg.source === "characters") {
      state.allCharacters.forEach(function (c) { list.push({ id: c.id, name: c.name, type: "Karakter" }); });
    } else if (cfg.source === "events") {
      state.allEvents.forEach(function (e) {
        if (state.currentEditingEventId && String(e.id) === String(state.currentEditingEventId)) return;
        list.push({ id: e.id, name: e.name || "Unknown", type: "Peristiwa" });
      });
    } else if (cfg.source === "elements") {
      state.allElements.forEach(function (e) {
        if (types.length && types.indexOf(e._type) === -1) return;
        list.push({ id: e.id, name: e.name || "Unknown", type: e._type });
      });
    }
    return list;
  }

  function isAlreadyLinked(listEl, id) {
    return Array.from(listEl.querySelectorAll(".badge[data-linked-id]")).some(function (b) {
      return b.dataset.linkedId && String(b.dataset.linkedId) === String(id);
    });
  }

  function addLinkedChip(inputEl, id, name, type) {
    var list = inputEl.parentElement.querySelector("[data-linked-list]");
    if (!list || isAlreadyLinked(list, id)) return;
    var chip = window.AwbFormRenderer.makeLinkedChip(id, name, type);
    list.appendChild(chip);
    inputEl.value = "";
    closeLinkedDropdown(inputEl);
  }

  function closeLinkedDropdown(inputEl) {
    var dd = inputEl ? inputEl.parentElement.querySelector(".linked-dropdown") : null;
    if (dd) dd.classList.remove("open");
  }

  function renderLinkedDropdown(inputEl) {
    var linkedType = inputEl.dataset.linkedType;
    var dd = inputEl.parentElement.querySelector(".linked-dropdown");
    if (!dd) return;
    var name = (inputEl.value || "").trim().toLowerCase();
    var source = resolveLinkedSource(linkedType);
    var cfg = LINKED_SOURCES[linkedType];

    dd.innerHTML = "";
    var shown = 0;
    source.forEach(function (item) {
      if (item.name.toLowerCase().indexOf(name) === -1) return;
      var list = inputEl.parentElement.querySelector("[data-linked-list]");
      if (isAlreadyLinked(list, item.id)) return;
      var opt = document.createElement("div");
      opt.className = "linked-opt";
      opt.innerHTML = '<span>' + escapeHtml(item.name) + '</span><span class="linked-opt-type">' + escapeHtml(item.type) + '</span>';
      opt.dataset.linkedId = item.id;
      opt.dataset.linkedName = item.name;
      opt.dataset.linkedType = item.type;
      opt.addEventListener("mousedown", function (ev) {
        ev.preventDefault();
        addLinkedChip(inputEl, item.id, item.name, item.type);
      });
      dd.appendChild(opt);
      shown++;
    });

    if (name && cfg) {
      if (cfg.multi) {
        // Faksi / Kelompok campuran: dua opsi buat
        ["Faksi", "Kelompok"].forEach(function (createType) {
          var exactExists = source.some(function (e) { return e.type === createType && e.name.toLowerCase() === name; });
          if (exactExists) return;
          var createOpt = document.createElement("div");
          createOpt.className = "linked-opt create";
          createOpt.innerHTML = '<span>+ Buat "' + escapeHtml(inputEl.value.trim()) + '" (' + createType + ')</span><span class="linked-opt-type">' + escapeHtml(createType) + '</span>';
          createOpt.addEventListener("mousedown", function (ev) {
            ev.preventDefault();
            closeLinkedDropdown(inputEl);
            handleLinkedEnter(inputEl, createType);
          });
          dd.appendChild(createOpt);
          shown++;
        });
      } else {
        var exactExists = source.some(function (e) { return e.name.toLowerCase() === name; });
        if (!exactExists) {
          var createOpt = document.createElement("div");
          createOpt.className = "linked-opt create";
          createOpt.innerHTML = '<span>+ Buat "' + escapeHtml(inputEl.value.trim()) + '"</span><span class="linked-opt-type">' + escapeHtml(linkedType) + '</span>';
          createOpt.addEventListener("mousedown", function (ev) {
            ev.preventDefault();
            closeLinkedDropdown(inputEl);
            handleLinkedEnter(inputEl);
          });
          dd.appendChild(createOpt);
          shown++;
        }
      }
    }

    if (shown > 0) dd.classList.add("open");
    else dd.classList.remove("open");
  }

  async function handleLinkedEnter(inputEl, overrideType) {
    var name = inputEl.value.trim();
    if (!name) return;
    var linkedType = inputEl.dataset.linkedType;
    var list = inputEl.parentElement.querySelector("[data-linked-list]");
    var cfg = LINKED_SOURCES[linkedType];

    var existingName = Array.from(list.querySelectorAll(".badge[data-linked-name]")).some(function (b) {
      return b.dataset.linkedName.toLowerCase() === name.toLowerCase();
    });
    if (existingName) {
      inputEl.value = "";
      closeLinkedDropdown(inputEl);
      return;
    }

    var source = resolveLinkedSource(linkedType);
    var target = source.find(function (e) { return e.name.toLowerCase() === name.toLowerCase(); });
    if (target) {
      addLinkedChip(inputEl, target.id, target.name, target.type);
      render();
      inputEl.value = "";
      closeLinkedDropdown(inputEl);
      return;
    }

    if (!cfg) {
      inputEl.value = "";
      closeLinkedDropdown(inputEl);
      return;
    }

    var createType = overrideType || cfg.elementType;
    if (cfg.multi && !createType) {
      inputEl.value = "";
      closeLinkedDropdown(inputEl);
      return;
    }

    var created;
    try {
      if (cfg.source === "characters") {
        created = await state.query.addCharacter({ name: name, data: {} });
      } else if (cfg.source === "events") {
        created = await state.query.addEvent({ name: name, data: {} });
      } else {
        created = await state.query.addElement({ name: name, type: createType, data: {} });
      }
    } catch (err) {
      console.error("Gagal buat element linked:", err);
      alert("Gagal membuat " + createType + " baru: " + (err && err.message ? err.message : err));
      return;
    }
    if (created) {
      await loadData();
      addLinkedChip(inputEl, created.id, created.name, createType);
      render();
    }
    inputEl.value = "";
    closeLinkedDropdown(inputEl);
  }

  // ---------- Form modal ----------
  function extractFields(d) {
    var reserved = {
      description: 1, imageUrl: 1, image: 1, tags: 1, extraFields: 1,
      linkedElements: 1, lists: 1, fields: 1, notes: 1
    };
    var fields = {};
    Object.keys(d).forEach(function (k) {
      if (!reserved[k]) fields[k] = d[k];
    });
    // Gabungkan fields bersarang (type, era, cause, consequence, dll) agar edit tampil lengkap.
    if (d.fields && typeof d.fields === "object") {
      Object.assign(fields, d.fields);
    }
    return fields;
  }

  window.openPeristiwaModal = async function (id) {
    if (!state.query) {
      alert("Pilih proyek terlebih dahulu.");
      return;
    }
    var modal = document.getElementById(MODAL_ID);
    var body = document.getElementById(BODY_ID);
    var titleEl = document.getElementById("modal-peristiwa-title");
    if (!modal || !body) return;

    body.innerHTML = window.AwbFormRenderer.renderForm(SCHEMA);
    window.AwbFormRenderer.clearModal(modal);

    state.currentEditingEventId = id || null;
    if (titleEl) titleEl.textContent = id ? "Edit Peristiwa" : "Tambah Peristiwa";

    if (id) {
      var ev = state.allEvents.find(function (e) { return e.id === id; });
      // Fallback: ambil dari DB langsung jika belum ada di memori (data sinkron)
      if (!ev && state.AetherState) {
        ev = await state.AetherState.getEvent(id);
      }
      if (ev) {
        var d = ev.data || {};
        window.AwbFormRenderer.populateModal(modal, SCHEMA, {
          name: ev.name || "",
          description: d.description || "",
          imageUrl: d.imageUrl || "",
          tags: d.tags || [],
          extraFields: d.extraFields || {},
          linkedElements: d.linkedElements || {},
          notes: d.notes || "",
          fields: extractFields(d),
          lists: d.lists || {}
        });
      } else {
        console.warn("Event id " + id + " tidak ditemukan saat dibuka untuk edit.");
      }
    }
    wireModalBody();
    modal.classList.add("open");
  };

  window.closePeristiwaModal = function () {
    document.getElementById(MODAL_ID)?.classList.remove("open");
    state.currentImageTargetInput = null;
  };

  window.savePeristiwa = async function () {
    if (!state.query) return;
    var modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    var collected = window.AwbFormRenderer.collectFromModal(modal);
    var newName = String(collected.name || "").trim();
    if (!newName) {
      alert("Nama peristiwa wajib diisi");
      return;
    }
    // Larang nama duplikat (tanpa memedakan huruf besar/kecil); saat edit, kecualikan peristiwa ini sendiri
    var isDuplicate = state.allEvents.some(function (x) {
      if (state.currentEditingEventId && String(x.id) === String(state.currentEditingEventId)) return false;
      return String(x.name || "").trim().toLowerCase() === newName.toLowerCase();
    });
    if (isDuplicate) {
      alert('Peristiwa dengan nama "' + newName + '" sudah ada. Ganti nama dengan yang lain.');
      return;
    }
    var data = {
      description: collected.description,
      imageUrl: collected.imageUrl,
      tags: collected.tags,
      extraFields: collected.extraFields,
      linkedElements: collected.linkedElements,
      notes: collected.notes,
      fields: collected.fields,
      lists: collected.lists
    };
    var payload = { name: newName, data: data };
    try {
      if (state.currentEditingEventId) {
        // Pertahankan field legacy (major/location/people) yang tidak diwakili formulir
        var prev = state.allEvents.find(function (x) { return String(x.id) === String(state.currentEditingEventId); });
        if (prev && prev.data) {
          ["major", "location", "people"].forEach(function (k) {
            if (prev.data[k] !== undefined) data[k] = prev.data[k];
          });
        }
        await state.query.updateEvent(state.currentEditingEventId, payload);
        await state.query.logActivity("update", "event", state.currentEditingEventId, newName, "Peristiwa diperbarui");
      } else {
        var created = await state.query.addEvent(payload);
        await state.query.logActivity("create", "event", created.id, newName, "Peristiwa baru dibuat");
      }
      window.closePeristiwaModal();
      await loadData();
      render();
      // Segarkan panel detail jika menampilkan peristiwa yang baru disimpan
      var panel = window._eventDetailPanel;
      var savedId = state.currentEditingEventId || (created && created.id);
      if (panel && panel.isOpen() && savedId != null && String(panel.currentId) === String(savedId)) {
        var fresh = state.allEvents.find(function (x) { return String(x.id) === String(savedId); });
        if (fresh) panel.open(fresh);
      }
    } catch (err) {
      console.error("Error saving event:", err);
      alert("Gagal menyimpan peristiwa: " + (err && err.message ? err.message : err));
    }
  };

  window.deletePeristiwa = async function (id) {
    if (!confirm("Hapus peristiwa ini?")) return;
    if (!state.query) return;
    try {
      await state.query.deleteEvent(id);
      await state.query.logActivity("delete", "event", id, "Peristiwa", "Dihapus dari linimasa");
      await loadData();
      render();
      // Tutup panel detail jika menampilkan peristiwa yang dihapus
      if (window._eventDetailPanel && String(window._eventDetailPanel.currentId) === String(id)) {
        window._eventDetailPanel.close();
      }
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Gagal menghapus peristiwa");
    }
  };

  // ---------- Wiring modal body ----------
  function wireModalBody() {
    var body = document.getElementById(BODY_ID);
    if (!body) return;
    if (body.dataset.linimasaWired === "1") return;
    body.dataset.linimasaWired = "1";

    body.addEventListener("click", function (e) {
      var imgBtn = e.target.closest("[data-image-edit]");
      if (imgBtn) {
        var wrap = imgBtn.closest("[data-kind='image']");
        var urlInput = wrap ? wrap.querySelector("[data-image-url]") : null;
        if (urlInput) openImagePopup(urlInput);
        return;
      }
      var tagRemove = e.target.closest("[data-tag-list] .tag-remove");
      if (tagRemove) {
        tagRemove.closest(".badge")?.remove();
        return;
      }
      var linkedRemove = e.target.closest("[data-linked-list] .linked-remove");
      if (linkedRemove) {
        linkedRemove.closest(".badge")?.remove();
        return;
      }
      var linkedName = e.target.closest("[data-linked-list] .linked-name");
      if (linkedName) {
        var chip = linkedName.closest(".badge");
        var type = chip ? chip.dataset.linkedType : "";
        var id = chip ? chip.dataset.linkedId : "";
        if (!id) return;
        if (type === "Peristiwa") {
          window.openPeristiwaModal(Number(id));
          return;
        }
        if (type === "Karakter") {
          location.href = "karakter.page.html?world=" + encodeURIComponent(state.project ? state.project.name : "");
          return;
        }
        if (type === "Lokasi" || type === "Faksi" || type === "Kelompok") {
          location.href = "element-dunia.page.html?world=" + encodeURIComponent(state.project ? state.project.name : "");
          return;
        }
        return;
      }
    });

    body.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var tagInp = e.target.closest("[data-tag-input]");
        if (tagInp) {
          e.preventDefault();
          var val = tagInp.value.trim();
          if (!val) return;
          var list = tagInp.parentElement.querySelector("[data-tag-list]");
          if (!list) return;
          var sudah = Array.from(list.querySelectorAll(".badge")).some(function (b) {
            return b.textContent.replace(/\s*[xX]\s*$/, "").trim().toLowerCase() === val.toLowerCase();
          });
          if (!sudah) {
            var b = document.createElement("span");
            b.className = "badge";
            b.textContent = val + " x";
            list.appendChild(b);
          }
          tagInp.value = "";
          return;
        }
        var linkedInp = e.target.closest("[data-linked-input]");
        if (linkedInp) {
          e.preventDefault();
          handleLinkedEnter(linkedInp);
          return;
        }
      }
      if (e.key === "Escape") {
        var escInp = e.target.closest("[data-linked-input]");
        if (escInp && window.AwbFormRenderer && window.AwbFormRenderer.closeLinkedDropdown) {
          window.AwbFormRenderer.closeLinkedDropdown(escInp);
        }
      }
    });

    body.addEventListener("input", function (e) {
      var linkedInp = e.target.closest("[data-linked-input]");
      if (!linkedInp) return;
      renderLinkedDropdown(linkedInp);
    });
    body.addEventListener("focus", function (e) {
      var linkedInp = e.target.closest("[data-linked-input]");
      if (!linkedInp) return;
      renderLinkedDropdown(linkedInp);
    }, true);
    body.addEventListener("blur", function (e) {
      var linkedInp = e.target.closest("[data-linked-input]");
      if (!linkedInp) return;
      setTimeout(function () {
        closeLinkedDropdown(linkedInp);
      }, 150);
    }, true);
  }

  // ---------- Popup preview gambar ----------
  function openImagePopup(urlInput) {
    state.currentImageTargetInput = urlInput;
    var inputEl = document.getElementById(POPUP_URL_ID);
    var preview = document.getElementById(POPUP_PREVIEW_ID);
    if (inputEl) inputEl.value = urlInput.value || "";
    updateImagePopupPreview();
    document.getElementById(POPUP_ID)?.classList.add("open");
    inputEl?.focus();
  }
  function updateImagePopupPreview() {
    var inputEl = document.getElementById(POPUP_URL_ID);
    var preview = document.getElementById(POPUP_PREVIEW_ID);
    if (!inputEl || !preview) return;
    var url = (inputEl.value || "").trim();
    if (!url) { preview.textContent = "Masukkan URL gambar untuk melihat pratinjau"; return; }
    preview.textContent = "Loading...";
    var img = document.createElement("img");
    img.src = url;
    img.onload = function () { preview.innerHTML = ""; preview.appendChild(img); };
    img.onerror = function () { preview.textContent = "URL gambar tidak valid"; };
  }
  function saveImagePopup() {
    if (!state.currentImageTargetInput) return;
    var inputEl = document.getElementById(POPUP_URL_ID);
    var url = (inputEl?.value || "").trim();
    if (!url) { alert("Masukkan URL gambar"); return; }
    state.currentImageTargetInput.value = url;
    var preview = state.currentImageTargetInput.parentElement.querySelector(".elem-img-preview");
    if (preview) {
      var img = document.createElement("img");
      img.src = url;
      img.style.cssText = "width:100%;height:100%;object-fit:cover;";
      img.onload = function () { preview.innerHTML = ""; preview.appendChild(img); };
      img.onerror = function () { preview.textContent = "URL tidak valid"; };
    }
    document.getElementById(POPUP_ID)?.classList.remove("open");
    state.currentImageTargetInput = null;
  }
  function closeImagePopup() {
    document.getElementById(POPUP_ID)?.classList.remove("open");
    state.currentImageTargetInput = null;
  }

  // ---------- Toolbar ----------
  function wireToolbar() {
    var search = document.getElementById("timeline-search");
    var typeSel = document.getElementById("timeline-type-filter");
    if (search) {
      search.addEventListener("input", debounce(function () {
        state.searchTerm = (search.value || "").toLowerCase();
        render();
      }, 300));
    }
    if (typeSel) {
      typeSel.addEventListener("change", function () {
        state.typeFilter = typeSel.value;
        render();
      });
    }
    document.querySelectorAll(".view-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".view-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var c = document.getElementById("timeline-content");
        if (c) {
          c.classList.remove("view-grid");
          if (btn.dataset.view === "grid") c.classList.add("view-grid");
        }
      });
    });
  }

  // ---------- Init ----------
  // Klik kartu peristiwa → buka sidebar detail (tombol Edit/Hapus di kartu pakai
  // stopPropagation sehingga tidak ikut membuka panel).
  function wireTimelineDetail() {
    var content = document.getElementById("timeline-content");
    if (!content) return;
    content.addEventListener("click", function (e) {
      if (e.target.closest("button, a")) return;
      var card = e.target.closest(".event-card");
      if (!card || !card.dataset.id) return;
      var ev = window._linimasaGetEvent(card.dataset.id);
      if (ev && window._eventDetailPanel) window._eventDetailPanel.open(ev);
    });
  }

  async function initLinimasaPage() {
    if (!window.AetherPageUtils) return;
    if (!window.AwbFormRenderer) {
      console.error("AwbFormRenderer belum tersedia (form-renderer.js belum dimuat)");
      return;
    }
    var utils = await window.AetherPageUtils.initPage();
    if (!utils.query) {
      console.warn("Tidak ada proyek aktif");
      return;
    }
    state.query = utils.query;
    state.project = utils.project;
    state.AetherState = utils.AetherState;

    await loadData();
    render();
    wireToolbar();
    wireTimelineDetail();

    var popupUrl = document.getElementById(POPUP_URL_ID);
    if (popupUrl) popupUrl.addEventListener("input", updateImagePopupPreview);
    document.getElementById("btn-tutup-pop-img-peristiwa")?.addEventListener("click", closeImagePopup);
    document.getElementById("btn-batal-pop-img-peristiwa")?.addEventListener("click", closeImagePopup);
    document.getElementById("btn-simpan-pop-img-peristiwa")?.addEventListener("click", saveImagePopup);

    wireModalBody();
  }

  initLinimasaPage();

})();
