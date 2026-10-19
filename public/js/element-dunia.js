// public/js/element-dunia.js
// Orkestrator halaman Element Dunia.
// Form dinamis di-render oleh form-renderer.js berdasarkan schema per-tipe di folder schemas/types/.
// Menambah tipe element baru: tambah 1 file kecil di schemas/types/ lalu daftarkan di schemas/index.js.
(function () {
  "use strict";

  // ---------- Konfigurasi ----------
  var FORM_MODAL_ID = "modal-buat-element";
  var PICKER_MODAL_ID = "modal-pilih-entry";
  var IMAGE_POPUP_ID = "pop-elem-img";

  // ---------- State ----------
  var allElements = [];
  // Pilihan view (grid/list) diingat di localStorage supaya konsisten setelah refresh
  var VIEW_STORAGE_KEY = "awb_element_view_mode";
  var currentViewMode = (function () {
    try {
      var v = localStorage.getItem(VIEW_STORAGE_KEY);
      return v === "list" || v === "grid" ? v : "grid";
    } catch (e) { return "grid"; }
  })();
  var currentSearchTerm = "";
  var currentEditingId = null;
  var currentEditingType = null;
  var currentImageTargetInput = null; // .elem-img-url yang sedang diedit

  // ---------- Utilities ----------
  function debounce(fn, ms) {
    var timer;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function getAllTypes() {
    return window.AwbElementForm ? window.AwbElementForm.getAllTypes() : [];
  }
  function getIcons() {
    return (window.AwbElementForm && window.AwbElementForm.getIcons()) || {};
  }

  // ---------- Render sidebar kategori ----------
  function renderCategoryList() {
    var host = document.getElementById("elem-cat-list");
    if (!host) return;
    var icons = getIcons();
    var types = getAllTypes();
    var html = '<button class="elem-cat-item active" data-type="">' +
      '<span class="elem-cat-label"><iconify-icon icon="lucide:layers" width="14"></iconify-icon>' +
      '<span class="cat-label-text">Semua Element</span></span>' +
      '<span class="elem-count" data-count="">0</span></button>';
    types.forEach(function (t) {
      var icon = icons[t] || "lucide:shapes";
      html += '<button class="elem-cat-item" data-type="' + t + '">' +
        '<span class="elem-cat-label"><iconify-icon icon="' + icon + '" width="14"></iconify-icon>' +
        '<span class="cat-label-text">' + escapeHtml(t) + '</span></span>' +
        '<span class="elem-count" data-count="' + t + '">0</span></button>';
    });
    host.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ---------- Picker "Entry Element" ----------
  function renderEntryPicker() {
    var body = document.getElementById("modal-pilih-entry-list");
    if (!body) return;
    var icons = getIcons();
    body.innerHTML = getAllTypes().map(function (t) {
      var icon = icons[t] || "lucide:shapes";
      return '<button class="elem-cat-btn" data-pick-type="' + escapeHtml(t) + '">' +
        '<iconify-icon icon="' + icon + '" width="14"></iconify-icon>' +
        escapeHtml(t) +
      '</button>';
    }).join("");
  }

  function openEntryPicker() {
    renderEntryPicker();
    document.getElementById(PICKER_MODAL_ID)?.classList.add("open");
  }
  function closeEntryPicker() {
    document.getElementById(PICKER_MODAL_ID)?.classList.remove("open");
  }

  // ---------- Render form ke modal tunggal ----------
  function openElementForm(type, id) {
    if (!window.AwbFormRenderer) return;
    var modal = document.getElementById(FORM_MODAL_ID);
    if (!modal) return;
    var titleEl = document.getElementById("modal-buat-element-title");
    var body = document.getElementById("modal-buat-element-body");
    if (!body) return;

    // Render schema
    var schema = window.AwbElementForm.getSchema(type);
    body.innerHTML = window.AwbFormRenderer.renderForm(schema);
    window.AwbFormRenderer.clearModal(modal);

    // Title
    var action = id ? "Edit" : "Buat";
    if (titleEl) titleEl.innerHTML =
      '<span style="width:32px;height:32px;border:1px solid var(--border);display:inline-flex;align-items:center;justify-content:center;">' +
      '<iconify-icon icon="lucide:image" width="16"></iconify-icon></span>' +
      action + " " + escapeHtml(type);

    // Populate kalau edit
    currentEditingId = id || null;
    currentEditingType = type;
    if (id) {
      var el = allElements.find(function (e) { return e.id === id; });
      if (el) {
        // Susun data untuk renderer
        var baseData = el.data || {};
        var fields = {};
        // Ambil fields dari baseData.fields (baru) atau baseData langsung (legacy)
        if (baseData.fields && typeof baseData.fields === "object") {
          fields = Object.assign({}, baseData.fields);
        } else {
          // Migrasi: salin semua key yang bukan field inti
          var reserved = { description: 1, imageUrl: 1, image: 1, tags: 1, extraFields: 1,
            linkedElements: 1, lists: 1, fields: 1, notes: 1 };
          Object.keys(baseData).forEach(function (k) {
            if (!reserved[k]) fields[k] = baseData[k];
          });
        }
        window.AwbFormRenderer.populateModal(modal, schema, {
          name: el.name || "",
          description: baseData.description || "",
          imageUrl: baseData.imageUrl || baseData.image || "",
          tags: baseData.tags || [],
          extraFields: baseData.extraFields || {},
          linkedElements: baseData.linkedElements || {},
          notes: baseData.notes || "",
          fields: fields,
          lists: baseData.lists || {}
        });
      }
    }

    modal.classList.add("open");
  }

  function closeElementForm() {
    document.getElementById(FORM_MODAL_ID)?.classList.remove("open");
    currentEditingId = null;
    currentEditingType = null;
  }

  // ---------- Save ----------
  async function saveCurrentElement() {
    if (!window.elementDuniaQuery) return;
    var modal = document.getElementById(FORM_MODAL_ID);
    if (!modal) return;
    var collected = window.AwbFormRenderer.collectFromModal(modal);
    if (!collected.name) {
      alert("Nama elemen wajib diisi");
      return;
    }
    var type = currentEditingType;
    var id = currentEditingId;
    var data = {
      name: collected.name,
      type: type,
      data: {
        description: collected.description,
        imageUrl: collected.imageUrl,
        tags: collected.tags,
        extraFields: collected.extraFields,
        linkedElements: collected.linkedElements,
        notes: collected.notes,
        fields: collected.fields,
        lists: collected.lists
      }
    };
    try {
      if (id) {
        await window.elementDuniaQuery.updateElement(id, data);
        await window.elementDuniaQuery.logActivity("update", "element", id, data.name, type + " diperbarui");
      } else {
        var created = await window.elementDuniaQuery.addElement(data);
        await window.elementDuniaQuery.logActivity("create", "element", created.id, data.name, type + " dibuat");
      }
      closeElementForm();
      await reloadAll();
    } catch (err) {
      console.error("Error saving element:", err);
      alert("Gagal menyimpan elemen: " + (err && err.message ? err.message : err));
    }
  }

  // ---------- Reload + render grup ----------
  async function reloadAll() {
    if (!window.elementDuniaQuery) return;
    var types = getAllTypes();
    var promises = types.map(function (t) { return window.elementDuniaQuery.getElements(t); });
    var results = await Promise.all(promises);
    allElements = [];
    types.forEach(function (t, idx) {
      if (results[idx]) {
        allElements = allElements.concat(
          results[idx].map(function (e) { return Object.assign({}, e, { _type: t }); })
        );
      }
    });
    // Expose agar awb-tag-filter.js bisa membaca seluruh element untuk bangun daftar tag unik
    window._elemDuniaAll = allElements;
    renderGroups();
    updateCategoryCounts();
    // Refresh daftar tag dinamis (setelah create/edit/delete)
    if (window._elemDuniaTagFilter && typeof window._elemDuniaTagFilter.renderTagFilter === "function") {
      window._elemDuniaTagFilter.renderTagFilter();
    }
  }

  function renderGroups() {
    var container = document.getElementById("elem-groups-container");
    if (!container) return;
    container.innerHTML = "";
    // Tipe yang punya minimal 1 element setelah filter pencarian & kategori
    var visibleTypes = visibleTypesAfterFilter();
    if (visibleTypes.length === 0) {
      container.innerHTML =
        '<div class="elem-empty-state" style="padding:3rem 1.5rem;text-align:center;border:1px dashed var(--border);border-radius:var(--radius-md);background:var(--bg-dark);">' +
          '<div style="font-size:1rem;font-weight:700;margin-bottom:0.4rem;">Belum ada Element Dunia</div>' +
          '<div style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1rem;">Mulai buat element pertamamu untuk dunia yang sedang dibangun.</div>' +
          '<button class="btn-confirm" data-empty-entry>+ Buat Element Pertama</button>' +
        '</div>';
      // Delegated click untuk tombol empty state
      container.addEventListener("click", function _emptyClick(e) {
        if (e.target.closest("[data-empty-entry]")) {
          container.removeEventListener("click", _emptyClick);
          openEntryPicker();
        }
      });
      return;
    }
    container.innerHTML = visibleTypes.map(function (t) {
      return '<div class="elem-group open" data-type="' + escapeHtml(t) + '">' +
        '<button class="elem-group-head" data-toggle-group>' +
          escapeHtml(t) +
          '<span class="chev" style="margin-left:auto;display:inline-block;transition:transform .15s;">v</span>' +
        '</button>' +
        '<div class="elem-cards"></div>' +
      '</div>';
    }).join("");
    filterAndRender();
  }

  // Tipe yang muncul setelah filter kategori + search diterapkan.
  // Dipakai untuk render section — agar section kosong tidak ditampilkan
  // (BUG 2). Sidebar tetap menampilkan semua tipe untuk filter & picker.
  function visibleTypesAfterFilter() {
    var activeBtn = document.querySelector(".elem-cat-item.active");
    var selectedType = activeBtn ? (activeBtn.getAttribute("data-type") || null) : null;
    var activeTag = (window._elemDuniaTagFilter && window._elemDuniaTagFilter.activeTag) || null;
    var set = {};
    allElements.forEach(function (e) {
      if (selectedType && e._type !== selectedType) return;
      if (currentSearchTerm && !(e.name || "").toLowerCase().includes(currentSearchTerm)) return;
      if (activeTag && !(((e.data && e.data.tags) || []).indexOf(activeTag) >= 0)) return;
      set[e._type] = true;
    });
    // Pertahankan urutan dari getAllTypes()
    return getAllTypes().filter(function (t) { return set[t]; });
  }

  function filterAndRender() {
    var container = document.getElementById("elem-groups-container");
    if (!container) return;
    // Re-render section karena daftar tipe bisa berubah (search/filter)
    var visibleTypes = visibleTypesAfterFilter();
    if (visibleTypes.length === 0) {
      // Tampilkan empty state di tempat section
      container.innerHTML =
        '<div class="elem-empty-state" style="padding:2.5rem 1.5rem;text-align:center;border:1px dashed var(--border);border-radius:var(--radius-md);background:var(--bg-dark);color:var(--text-muted);font-size:0.9rem;">' +
          'Tidak ada element yang cocok dengan filter saat ini.' +
        '</div>';
      return;
    }
    // Sinkronkan DOM dengan daftar tipe yang terlihat
    var existingTypes = {};
    Array.prototype.forEach.call(container.querySelectorAll(".elem-group"), function (g) {
      existingTypes[g.getAttribute("data-type")] = g;
    });
    var frag = document.createDocumentFragment();
    visibleTypes.forEach(function (t) {
      if (existingTypes[t]) {
        frag.appendChild(existingTypes[t]);
        delete existingTypes[t];
      } else {
        var g = document.createElement("div");
        g.className = "elem-group open";
        g.setAttribute("data-type", t);
        g.innerHTML =
          '<button class="elem-group-head" data-toggle-group>' + escapeHtml(t) +
            '<span class="chev" style="margin-left:auto;display:inline-block;transition:transform .15s;">v</span>' +
          '</button>' +
          '<div class="elem-cards"></div>';
        frag.appendChild(g);
      }
    });
    container.innerHTML = "";
    container.appendChild(frag);

    var groups = {};
    visibleTypes.forEach(function (t) { groups[t] = []; });
    var activeTag = (window._elemDuniaTagFilter && window._elemDuniaTagFilter.activeTag) || null;
    allElements.forEach(function (e) {
      if (selectedType() && e._type !== selectedType()) return;
      if (currentSearchTerm && !(e.name || "").toLowerCase().includes(currentSearchTerm)) return;
      if (activeTag && !(((e.data && e.data.tags) || []).indexOf(activeTag) >= 0)) return;
      groups[e._type].push(e);
    });

    visibleTypes.forEach(function (type) {
      // Scope ke container (jangan sampai ketemu .elem-cat-item di sidebar)
      var groupEl = container.querySelector('.elem-group[data-type="' + cssEscapeAttr(type) + '"]');
      if (!groupEl) return;
      var cards = groupEl.querySelector(".elem-cards");
      if (!cards) return;
      var list = groups[type];
      if (list.length === 0) {
        cards.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-faint);font-size:0.85rem;">Belum ada ' +
          escapeHtml(type) + '</div>';
        return;
      }
      cards.className = "elem-cards" + (currentViewMode === "list" ? " list-mode" : "");
      cards.innerHTML = list.map(function (e) { return renderCard(e, type); }).join("");
    });
  }

  function selectedType() {
    var activeBtn = document.querySelector(".elem-cat-item.active");
    return activeBtn ? (activeBtn.getAttribute("data-type") || null) : null;
  }

  function renderCard(e, type) {
    var imgUrl = (e.data && (e.data.imageUrl || e.data.image)) || "";
    // Gambar fill box .elem-card-top via CSS .elem-thumb (object-fit:cover).
    // URL gagal → JS swap ke fallback placeholder (data-thumb-img, delegation di wireEvents).
    var img = imgUrl
      ? '<img src="' + escapeHtml(imgUrl) + '" alt="" loading="lazy" data-thumb-img>'
      : '<span class="elem-thumb-fallback"><iconify-icon icon="lucide:image" width="28"></iconify-icon></span>';
    var desc = (e.data && e.data.description) || "";
    var tags = ((e.data && e.data.tags) || []).join(" ");
    return '<div class="elem-card">' +
      '<div class="elem-card-top">' +
        '<span class="elem-thumb">' + img + '</span>' +
        '<span class="elem-card-type">' + escapeHtml(type) + '</span>' +
      '</div>' +
      '<div class="elem-card-body">' +
        '<div class="elem-card-headrow">' +
          '<div class="elem-card-name">' + escapeHtml(e.name || "Unknown") + '</div>' +
          '<div class="elem-card-actions">' +
            '<iconify-icon icon="lucide:pen-line" width="14" data-action="edit" data-id="' + e.id + '" data-type="' + escapeHtml(type) + '" style="cursor:pointer;"></iconify-icon>' +
            '<iconify-icon icon="lucide:trash-2" width="14" data-action="del" data-id="' + e.id + '" style="color:var(--danger);cursor:pointer;"></iconify-icon>' +
          '</div>' +
        '</div>' +
        '<div class="elem-card-desc">' + escapeHtml(desc) + '</div>' +
        '<div class="elem-card-tags">' + escapeHtml(tags) + '</div>' +
      '</div>' +
    '</div>';
  }

  function updateCategoryCounts() {
    var counts = {};
    getAllTypes().forEach(function (t) { counts[t] = 0; });
    allElements.forEach(function (e) { counts[e._type] = (counts[e._type] || 0) + 1; });
    document.querySelectorAll(".elem-cat-item").forEach(function (btn) {
      var key = btn.getAttribute("data-type") || "";
      var el = btn.querySelector(".elem-count");
      if (!el) return;
      el.textContent = key === "" ? allElements.length : (counts[key] || 0);
    });
  }

  function cssEscape(s) {
    if (window.CSS && CSS.escape) return CSS.escape(s);
    return String(s).replace(/[^a-zA-Z0-9_-]/g, function (c) { return "\\" + c; });
  }

  // Escape untuk attribute selector di dalam tanda kutip ganda.
  // Dipakai saat membangun selector [data-type="..."] di querySelector.
  function cssEscapeAttr(s) {
    return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  // ---------- Delete ----------
  async function deleteElement(id) {
    if (!confirm("Hapus element ini?")) return;
    if (!window.elementDuniaQuery) return;
    try {
      await window.elementDuniaQuery.deleteElement(id);
      await window.elementDuniaQuery.logActivity("delete", "element", id, "Element", "Dihapus");
      allElements = allElements.filter(function (e) { return e.id !== id; });
      window._elemDuniaAll = allElements;
      // Tutup panel detail jika element yang dihapus sedang ditampilkan
      if (window._elemDetailPanel && window._elemDetailPanel.currentId === id) {
        window._elemDetailPanel.close();
      }
      filterAndRender();
      updateCategoryCounts();
    } catch (err) {
      console.error("Error deleting element:", err);
      alert("Gagal menghapus elemen");
    }
  }

  // ---------- View mode ----------
  function setView(v) {
    if (v !== "grid" && v !== "list") return;
    currentViewMode = v;
    try { localStorage.setItem(VIEW_STORAGE_KEY, v); } catch (e) { /* storage penuh / private mode → abaikan */ }
    document.querySelectorAll(".elem-cards").forEach(function (c) {
      c.classList.toggle("list-mode", v === "list");
    });
    document.getElementById("view-grid")?.classList.toggle("active", v === "grid");
    document.getElementById("view-list")?.classList.toggle("active", v === "list");
  }

  // ---------- Image popup ----------
  function openImagePopupForInput(urlInput) {
    currentImageTargetInput = urlInput;
    var popInput = document.getElementById("elem-pop-img-url");
    if (popInput) popInput.value = urlInput.value || "";
    updateImagePreview();
    document.getElementById(IMAGE_POPUP_ID)?.classList.add("open");
  }
  function updateImagePreview() {
    var inputEl = document.getElementById("elem-pop-img-url");
    var preview = document.getElementById("elem-pop-img-preview");
    if (!inputEl || !preview) return;
    var url = (inputEl.value || "").trim();
    if (!url) { preview.textContent = "Masukkan URL gambar untuk melihat pratinjau"; return; }
    var img = document.createElement("img");
    img.src = url;
    img.onload = function () { preview.innerHTML = ""; preview.appendChild(img); };
    img.onerror = function () { preview.textContent = "URL gambar tidak valid"; };
    preview.textContent = "Loading...";
  }
  function saveImagePopup() {
    if (!currentImageTargetInput) return;
    var inputEl = document.getElementById("elem-pop-img-url");
    var url = (inputEl?.value || "").trim();
    if (!url) { alert("Masukkan URL gambar"); return; }
    currentImageTargetInput.value = url;
    // Update preview di form
    var preview = currentImageTargetInput.parentElement.querySelector(".elem-img-preview");
    if (preview) {
      var img = document.createElement("img");
      img.src = url;
      img.style.cssText = "width:100%;height:100%;object-fit:cover;";
      img.onload = function () { preview.innerHTML = ""; preview.appendChild(img); };
      img.onerror = function () { preview.textContent = "URL tidak valid"; };
    }
    document.getElementById(IMAGE_POPUP_ID)?.classList.remove("open");
    currentImageTargetInput = null;
  }

  // ---------- Wire events ----------
  function wireEvents() {
    // Sidebar collapse
    document.getElementById("btn-collapse-cat")?.addEventListener("click", function (e) {
      var btn = e.currentTarget;
      var c = btn.closest(".elem-cat");
      c?.classList.toggle("collapsed");
      btn.textContent = c?.classList.contains("collapsed") ? ">" : "<";
    });

    // Entry + custom
    document.getElementById("btn-entry-element")?.addEventListener("click", openEntryPicker);
    document.getElementById("btn-custom-element")?.addEventListener("click", function () {
      if (window._elemCustomTypes && typeof window._elemCustomTypes.openManager === "function") {
        window._elemCustomTypes.openManager();
      }
    });
    document.getElementById("btn-tutup-pilih-entry")?.addEventListener("click", closeEntryPicker);

    // Picker click
    document.getElementById("modal-pilih-entry-list")?.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pick-type]");
      if (!b) return;
      var t = b.getAttribute("data-pick-type");
      closeEntryPicker();
      openElementForm(t);
    });

    // Category filter
    document.getElementById("elem-cat-list")?.addEventListener("click", function (e) {
      var b = e.target.closest(".elem-cat-item");
      if (!b) return;
      document.querySelectorAll(".elem-cat-item").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      filterAndRender();
    });

    // View toggle
    document.getElementById("view-grid")?.addEventListener("click", function () { setView("grid"); });
    document.getElementById("view-list")?.addEventListener("click", function () { setView("list"); });

    // Search
    document.querySelector(".search-field")?.addEventListener("input", debounce(function (e) {
      currentSearchTerm = (e.target.value || "").toLowerCase();
      filterAndRender();
    }, 300));

    // Card actions (edit/del/klik untuk buka panel detail) — event delegation
    document.getElementById("elem-groups-container")?.addEventListener("click", function (e) {
      var t = e.target.closest("[data-action]");
      if (t) {
        if (t.getAttribute("data-action") === "edit") {
          openElementForm(t.getAttribute("data-type"), Number(t.getAttribute("data-id")));
        } else if (t.getAttribute("data-action") === "del") {
          deleteElement(Number(t.getAttribute("data-id")));
        }
        return; // Jangan lanjut ke buka panel detail
      }
      // Klik kartu → buka panel detail (jika module detail-panel tersedia)
      var card = e.target.closest(".elem-card");
      if (card) {
        var idAttr = card.querySelector("[data-id]")?.getAttribute("data-id");
        var id = idAttr ? Number(idAttr) : NaN;
        if (!isNaN(id)) {
          var elem = allElements.find(function (x) { return x.id === id; });
          if (elem && window._elemDetailPanel && typeof window._elemDetailPanel.open === "function") {
            window._elemDetailPanel.open(elem);
          }
        }
      }
    });

    // Group toggle
    document.getElementById("elem-groups-container")?.addEventListener("click", function (e) {
      if (e.target.closest("[data-toggle-group]")) {
        e.target.closest(".elem-group")?.classList.toggle("open");
      }
    });

    // Thumbnail image error → fallback placeholder (URL mati / tidak valid)
    document.getElementById("elem-groups-container")?.addEventListener("error", function (e) {
      var img = e.target;
      if (!img || !img.hasAttribute("data-thumb-img")) return;
      var fb = document.createElement("span");
      fb.className = "elem-thumb-fallback";
      var ic = document.createElement("iconify-icon");
      ic.setAttribute("icon", "lucide:image");
      ic.setAttribute("width", "28");
      fb.appendChild(ic);
      img.replaceWith(fb);
    }, true); // capture: error tidak bubble

    // Modal save/cancel
    document.getElementById("btn-simpan-element")?.addEventListener("click", saveCurrentElement);
    document.getElementById("btn-batal-element")?.addEventListener("click", closeElementForm);

    // Image popup
    document.getElementById("btn-tutup-pop-img")?.addEventListener("click", function () {
      document.getElementById(IMAGE_POPUP_ID)?.classList.remove("open");
      currentImageTargetInput = null;
    });
    document.getElementById("btn-batal-pop-img")?.addEventListener("click", function () {
      document.getElementById(IMAGE_POPUP_ID)?.classList.remove("open");
      currentImageTargetInput = null;
    });
    document.getElementById("btn-simpan-pop-img")?.addEventListener("click", saveImagePopup);
    document.getElementById("elem-pop-img-url")?.addEventListener("input", updateImagePreview);

    // Form-body delegated handlers (open image popup, tag chips, extra add/del, list add/del, linked chips)
    var body = document.getElementById("modal-buat-element-body");
    if (body) {
      body.addEventListener("click", function (e) {
        // Image edit button
        var imgBtn = e.target.closest("[data-image-edit]");
        if (imgBtn) {
          var wrap = imgBtn.closest("[data-kind='image']");
          var urlInput = wrap?.querySelector("[data-image-url]");
          if (urlInput) openImagePopupForInput(urlInput);
          return;
        }
        // Tag input
        var tagInput = e.target.closest("[data-tag-input]");
        if (tagInput && e.key !== undefined) {/* handled in keydown */}
        // Tag chip remove (click on .badge inside [data-tag-list])
        var chip = e.target.closest("[data-tag-list] .badge, [data-linked-list] .badge");
        if (chip) { chip.remove(); return; }
        // Extra add
        var extraAdd = e.target.closest("[data-extra-add], [data-extra-add-top]");
        if (extraAdd) {
          var list = body.querySelector("[data-extra-list]");
          if (list) list.appendChild(window.AwbFormRenderer.buildExtraItem("", "Text", ""));
          return;
        }
        // Extra delete
        var extraDel = e.target.closest("[data-extra-del]");
        if (extraDel) {
          var item = extraDel.closest(".extra-item");
          if (item) item.remove();
          return;
        }
        // List add
        var listAdd = e.target.closest("[data-list-add]");
        if (listAdd) {
          var wrap2 = listAdd.closest(".list-wrap");
          var container = wrap2?.querySelector("[data-list-list]");
          var tpl = wrap2?.querySelector("[data-list-template]");
          if (container && tpl) container.appendChild(tpl.content.firstElementChild.cloneNode(true));
          return;
        }
        // List delete
        var listDel = e.target.closest("[data-list-del]");
        if (listDel) {
          var li = listDel.closest(".list-item");
          if (li) li.remove();
          return;
        }
      });

      body.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        var tagInp = e.target.closest("[data-tag-input]");
        if (tagInp) {
          e.preventDefault();
          var v = tagInp.value.trim();
          if (!v) return;
          var list = tagInp.parentElement.querySelector("[data-tag-list]");
          if (!list) return;
          var b = document.createElement("span");
          b.className = "badge";
          b.textContent = v + " x";
          list.appendChild(b);
          tagInp.value = "";
          return;
        }
        var linkedInp = e.target.closest("[data-linked-input]");
        if (linkedInp) {
          e.preventDefault();
          var linkedType = linkedInp.dataset.linkedType;
          if (window.AwbFormRenderer && window.AwbFormRenderer.handleLinkedInputEnter) {
            window.AwbFormRenderer.handleLinkedInputEnter(modal, linkedInp, linkedType);
          }
          return;
        }
        if (e.key === "Escape") {
          var escInp = e.target.closest("[data-linked-input]");
          if (escInp && window.AwbFormRenderer && window.AwbFormRenderer.closeLinkedDropdown) {
            window.AwbFormRenderer.closeLinkedDropdown(escInp);
          }
        }
      });

      // Linked dropdown: input/focus → tampilkan, blur → sembunyikan (delay)
      var linkedBlurTimer = null;
      body.addEventListener("input", function (e) {
        var linkedInp = e.target.closest("[data-linked-input]");
        if (!linkedInp) return;
        var linkedType = linkedInp.dataset.linkedType;
        if (window.AwbFormRenderer && window.AwbFormRenderer.renderLinkedDropdown) {
          window.AwbFormRenderer.renderLinkedDropdown(linkedInp, linkedType);
        }
      });
      body.addEventListener("focus", function (e) {
        var linkedInp = e.target.closest("[data-linked-input]");
        if (!linkedInp) return;
        if (linkedBlurTimer) { clearTimeout(linkedBlurTimer); linkedBlurTimer = null; }
        var linkedType = linkedInp.dataset.linkedType;
        if (window.AwbFormRenderer && window.AwbFormRenderer.renderLinkedDropdown) {
          window.AwbFormRenderer.renderLinkedDropdown(linkedInp, linkedType);
        }
      }, true);
      body.addEventListener("blur", function (e) {
        var linkedInp = e.target.closest("[data-linked-input]");
        if (!linkedInp) return;
        linkedBlurTimer = setTimeout(function () {
          if (window.AwbFormRenderer && window.AwbFormRenderer.closeLinkedDropdown) {
            window.AwbFormRenderer.closeLinkedDropdown(linkedInp);
          }
        }, 150);
      }, true);

      // Chip removal: only on click of "x" button (linked-remove), not on name
      body.addEventListener("click", function (e) {
        var removeBtn = e.target.closest(".linked-remove");
        if (removeBtn) {
          removeBtn.closest(".badge")?.remove();
        }
      });
    }
  }

  // ---------- Init ----------
  async function initPage() {
    if (!window.AetherPageUtils) return;
    var utils = await window.AetherPageUtils.initPage();
    if (!utils.query) {
      console.warn("Tidak ada proyek aktif");
      return;
    }
    window.elementDuniaQuery = utils.query;
    if (window.AwbElementForm && typeof window.AwbElementForm.init === "function") {
      window.AwbElementForm.init();
    }
    renderCategoryList();
    // Sinkronkan state tombol view-grid / view-list dengan currentViewMode (mungkin persist dari localStorage)
    document.getElementById("view-grid")?.classList.toggle("active", currentViewMode === "grid");
    document.getElementById("view-list")?.classList.toggle("active", currentViewMode === "list");
    wireEvents();
    if (window._elemDetailPanel && typeof window._elemDetailPanel.init === "function") {
      window._elemDetailPanel.init();
    }
    // Muat + register tipe custom proyek ini, lalu render ulang daftar
    if (window._elemCustomTypes && typeof window._elemCustomTypes.init === "function") {
      window._elemCustomTypes.init();
    }
    // Load tipe custom proyek aktif (register skema) sebelum reloadAll,
    // agar tipe custom ikut termuat saat membaca element.
    if (window._elemCustomTypes && typeof window._elemCustomTypes.loadForProject === "function") {
      await window._elemCustomTypes.loadForProject();
    }
    await reloadAll();
  }

  // Expose untuk konsistensi dengan kode lama
  // Expose untuk module tag-filter (awb-tag-filter.js)
  window.filterAndRender = filterAndRender;
  // Callback untuk modul custom-types.js: saat tipe custom berubah,
  // re-render sidebar + picker + muat ulang data.
  window._elemDuniaOnCustomTypesChanged = function () {
    renderCategoryList();
    reloadAll();
  };
  window.openElementForm = openElementForm;
  window.saveElementForm = function (type) {
    // Dipanggil dari button onclick lama; redirect ke flow baru
    if (type) currentEditingType = type;
    return saveCurrentElement();
  };
  window.openElementImagePopup = function (btn) {
    var wrap = btn.closest("[data-kind='image']");
    var urlInput = wrap?.querySelector("[data-image-url]");
    if (urlInput) openImagePopupForInput(urlInput);
  };
  window.saveElementImagePreview = saveImagePopup;
  window.deleteElement = deleteElement;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
  } else {
    initPage();
  }
})();
