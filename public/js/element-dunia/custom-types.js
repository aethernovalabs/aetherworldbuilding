// public/js/element-dunia/custom-types.js
// Pengelola tipe Element Dunia custom: buat, edit, hapus.
//
// Tipe custom disimpan di tabel `elementTypes` (per proyek) dan diregister
// ke registry skema via window.AwbElementForm.setCustomTypes() +
// window.AwbElementSchemas[name] = schema, sehingga:
//   - muncul di sidebar kategori & picker "Entry Element" seperti tipe bawaan
//   - memakai renderer generik yang sama (form-renderer.js)
//
// Tipe bawaan (14) TIDAK dikelola di sini (tidak ada record di tabel).
//
// API (window._elemCustomTypes):
//   init()          → pasang listener modal
//   openManager()   → buka modal pengelola (daftar tipe + form buat/edit)
//   loadForProject(projectId) → ambil tipe custom proyek, register ke skema, return list
(function () {
  "use strict";

  var MODAL_ID = "modal-aturn-element-custom";

  // 6 jenis field yang bisa dipilih user
  var FIELD_KINDS = [
    { key: "text", label: "Teks" },
    { key: "number", label: "Angka" },
    { key: "textarea", label: "Teks Panjang" },
    { key: "select", label: "Dropdown" },
    { key: "tags", label: "Tag" },
    { key: "linked", label: "Linked Element" }
  ];

  // Preset ikon lucide untuk tipe custom
  var ICON_PRESETS = [
    "lucide:puzzle", "lucide:box", "lucide:hexagon", "lucide:hexagon-dashed",
    "lucide:star", "lucide:heart", "lucide:flame", "lucide:droplets",
    "lucide:scroll-text", "lucide:shield", "lucide:sword", "lucide:gem",
    "lucide:scroll", "lucide:circle-dot", "lucide:circle-help", "lucide:shapes"
  ];

  // Tipe referensi untuk field linked (tipe bawaan saja, v1)
  function builtinTypeNames() {
    return window.AwbElementForm ? window.AwbElementForm.getBuiltinTypes() : [];
  }

  // ---------- Render daftar tipe di modal ----------
  function renderTypeList(list, query) {
    var host = document.getElementById("custom-type-list");
    if (!host) return;
    if (!list || !list.length) {
      host.innerHTML = '<div style="color:var(--text-faint);font-size:0.8rem;padding:0.5rem;">Belum ada tipe custom. Buat satu untuk mulai.</div>';
      return;
    }
    host.innerHTML = list.map(function (t) {
      var icon = t.icon || "lucide:puzzle";
      var fieldsCount = (t.fields || []).length;
      return (
        '<div class="custom-type-item" data-ct-id="' + t.id + '" style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.5rem 0.6rem;background:var(--bg-surface);display:flex;align-items:center;gap:0.5rem;">' +
          '<iconify-icon icon="' + icon + '" width="18"></iconify-icon>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:0.85rem;font-weight:700;">' + escapeHtml(t.name) + '</div>' +
            '<div style="font-size:0.72rem;color:var(--text-muted);">' + fieldsCount + ' field</div>' +
          '</div>' +
          '<button class="win-btn" data-ct-edit="' + t.id + '" title="Edit" style="color:var(--text-muted);"><iconify-icon icon="lucide:pen-line" width="14"></iconify-icon></button>' +
          '<button class="win-btn" data-ct-del="' + t.id + '" title="Hapus" style="color:var(--danger);"><iconify-icon icon="lucide:trash-2" width="14"></iconify-icon></button>' +
        '</div>'
      );
    }).join("");

    // Edit
    host.querySelectorAll("[data-ct-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = Number(btn.getAttribute("data-ct-edit"));
        var t = list.find(function (x) { return x.id === id; });
        if (t) loadForm(t);
      });
    });
    // Hapus (dengan konfirmasi keras jika ada element di bawahnya)
    host.querySelectorAll("[data-ct-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = Number(btn.getAttribute("data-ct-del"));
        var t = list.find(function (x) { return x.id === id; });
        if (t) deleteType(t, query);
      });
    });
  }

  // ---------- Render form buat/edit ----------
  function loadForm(t) {
    var body = document.getElementById("custom-type-form");
    if (!body) return;
    var isEdit = !!(t && t.id);
    var type = t || { name: "", icon: ICON_PRESETS[0], fields: [] };

    var iconOpts = ICON_PRESETS.map(function (ic) {
      var sel = ic === type.icon ? " selected" : "";
      return '<option value="' + ic + '"' + sel + '>' + ic + '</option>';
    }).join("");

    var refOpts = '<option value=""></option>' + builtinTypeNames().map(function (n) {
      return '<option value="' + escapeHtml(n) + '">' + escapeHtml(n) + '</option>';
    }).join("");

    // Baris field dinamis
    var fieldRows = (type.fields || []).map(function (f) { return fieldRowHtml(f); }).join("");

    body.innerHTML =
      '<div class="ct-form" data-ct-id="' + (type.id || "") + '">' +
        '<div><label class="form-label">Nama Tipe *</label><input type="text" class="form-input" data-ct-name value="' + escapeHtml(type.name) + '" placeholder="Mis. Artefak"></div>' +
        '<div style="margin-top:0.5rem;"><label class="form-label">Ikon</label><select class="form-input" data-ct-icon>' + iconOpts + '</select></div>' +
        '<div style="margin-top:0.5rem;font-size:0.82rem;font-weight:700;">Daftar Field</div>' +
        '<div data-ct-field-list style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.3rem;">' + (fieldRows || fieldRowHtml({ key: "", label: "", kind: "text" })) + '</div>' +
        '<button type="button" class="elem-cat-btn" data-ct-add-field style="width:100%;margin-top:0.4rem;">+ Tambah Field</button>' +
        '<div class="ct-form-actions" style="display:flex;gap:0.5rem;margin-top:0.8rem;">' +
          (isEdit
            ? '<button class="btn-cancel" data-ct-cancel style="color:var(--danger);">Batal Edit</button>'
            : '<button class="btn-cancel" data-ct-cancel>Reset</button>') +
          '<div style="flex:1;display:flex;gap:0.5rem;">' +
            '<button class="btn-cancel" data-ct-cancel style="flex:1;">Batal</button>' +
            '<button class="btn-confirm" data-ct-save style="flex:1;">' + (isEdit ? "Simpan Perubahan" : "Simpan Tipe") + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    wireForm(body, t, isEdit);
  }

  function fieldRowHtml(f) {
    f = f || {};
    var kindOpts = FIELD_KINDS.map(function (k) {
      var sel = k.key === f.kind ? " selected" : "";
      return '<option value="' + k.key + '"' + sel + '>' + k.label + '</option>';
    }).join("");
    var refOpts = '<option value=""></option>' + builtinTypeNames().map(function (n) {
      var sel = (f.linkedRef === n) ? " selected" : "";
      return '<option value="' + escapeHtml(n) + '"' + sel + '>' + escapeHtml(n) + '</option>';
    }).join("");
    // input opsional (select/linked) selalu dirender tapi disembunyikan;
    // visibilitas di-toggle oleh handler perubahan jenis di wireForm.
    var optionsInput = '<div data-f-optwrap style="margin-top:0.3rem;' + (f.kind === "select" ? "" : "display:none;") + '"><label class="form-label" style="font-size:0.72rem;">Opsi (pisahkan dengan koma)</label><input type="text" class="form-input" data-f-optlist value="' + escapeHtml((f.options || []).join(", ")) + '" placeholder="Opsi A, Opsi B, Opsi C"></div>';
    var refInput = '<div data-f-refwrap style="margin-top:0.3rem;' + (f.kind === "linked" ? "" : "display:none;") + '"><label class="form-label" style="font-size:0.72rem;">Tipe Referensi</label><select class="form-input" data-f-ref>' + refOpts + '</select></div>';
    return (
      '<div class="ct-field-row" style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.5rem;background:var(--bg-dark);display:grid;grid-template-columns:1fr 1fr auto;gap:0.4rem;align-items:start;">' +
        '<div><label class="form-label" style="font-size:0.72rem;">Label</label><input type="text" class="form-input" data-f-label value="' + escapeHtml(f.label || "") + '" placeholder="Nama field"></div>' +
        '<div><label class="form-label" style="font-size:0.72rem;">Jenis</label><select class="form-input" data-f-kind>' + kindOpts + '</select>' + optionsInput + refInput + '</div>' +
        '<button type="button" class="win-btn" data-f-del style="color:var(--danger);align-self:start;"><iconify-icon icon="lucide:trash-2" width="14"></iconify-icon></button>' +
      '</div>'
    );
  }

  function wireForm(body, origType, isEdit) {
    var formEl = body.querySelector(".ct-form");
    var ctId = formEl.getAttribute("data-ct-id") || "";

    // Tambah field
    body.querySelector("[data-ct-add-field]").addEventListener("click", function () {
      var list = formEl.querySelector("[data-ct-field-list]");
      var tmp = document.createElement("div");
      tmp.innerHTML = fieldRowHtml({ key: "", label: "", kind: "text" });
      list.appendChild(tmp.firstElementChild);
    });

    // Hapus field (delegated)
    body.addEventListener("click", function (e) {
      var del = e.target.closest("[data-f-del]");
      if (del) del.closest(".ct-field-row").remove();
    });

    // Ganti jenis field → tampilkan/sembunyikan input opsional
    formEl.querySelectorAll("[data-f-kind]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var row = sel.closest(".ct-field-row");
        var optWrap = row.querySelector("[data-f-optwrap]");
        var refWrap = row.querySelector("[data-f-refwrap]");
        if (optWrap) optWrap.style.display = sel.value === "select" ? "" : "none";
        if (refWrap) refWrap.style.display = sel.value === "linked" ? "" : "none";
      });
    });

    // Batal
    body.querySelectorAll("[data-ct-cancel]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        loadForm(null); // reset ke form kosong
      });
    });

    // Simpan
    body.querySelector("[data-ct-save]").addEventListener("click", function () {
      saveForm(formEl, ctId, isEdit);
    });
  }

  function collectForm(formEl) {
    var name = formEl.querySelector("[data-ct-name]").value.trim();
    var icon = formEl.querySelector("[data-ct-icon]").value;
    var rows = formEl.querySelectorAll(".ct-field-row");
    var fields = [];
    rows.forEach(function (row) {
      var label = row.querySelector("[data-f-label]").value.trim();
      var kind = row.querySelector("[data-f-kind]").value;
      var f = { key: label ? label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") : "", label: label, kind: kind };
      if (!f.key) return; // skip field tanpa label
      if (kind === "select") {
        var o = row.querySelector("[data-f-optlist]");
        f.options = o ? o.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean) : [];
      }
      if (kind === "linked") {
        var r = row.querySelector("[data-f-ref]");
        f.linkedRef = r ? r.value : "";
      }
      fields.push(f);
    });
    return { name: name, icon: icon, fields: fields };
  }

  function saveForm(formEl, ctId, isEdit) {
    var q = window.elementDuniaQuery;
    if (!q) return;
    var payload = collectForm(formEl);
    if (!payload.name) { alert("Nama tipe wajib diisi"); return; }

    var doSave;
    if (isEdit && ctId) {
      doSave = q.updateCustomType(Number(ctId), payload).then(function () { return q.getCustomTypes(); });
    } else {
      doSave = q.addCustomType(payload).then(function () { return q.getCustomTypes(); });
    }

    doSave.then(function (list) {
      registerAll(list);
      refreshManager(list);
      notifyOrchestrator(list);
    }).catch(function (err) {
      console.error("Gagal simpan tipe custom:", err);
      alert("Gagal menyimpan tipe custom: " + (err && err.message ? err.message : err));
    });
  }

  // ---------- Hapus tipe (konfirmasi keras jika ada element) ----------
  function deleteType(t, query) {
    var q = query || window.elementDuniaQuery;
    if (!q) return;
    // Cek jumlah element di bawah tipe ini
    if (q.countElementsOfType) {
      q.countElementsOfType(t.name).then(function (count) {
        var msg = "Hapus tipe '" + t.name + "'?";
        if (count > 0) {
          msg += "\n\nPERHATIAN: " + count + " element dengan tipe ini akan DIHAPUS PERMANEN.";
        }
        if (!confirm(msg)) return;
        // Hapus tipe + element di bawahnya
        var p = (q.deleteCustomTypeWithElements && count > 0)
          ? q.deleteCustomTypeWithElements(t.id, [t.name])
          : q.deleteCustomType(t.id);
        p.then(function () {
          return q.getCustomTypes();
        }).then(function (list) {
          registerAll(list);
          refreshManager(list);
          notifyOrchestrator(list);
        });
      });
    } else {
      if (!confirm("Hapus tipe '" + t.name + "'?")) return;
      q.deleteCustomType(t.id).then(function () { return q.getCustomTypes(); }).then(function (list) {
        registerAll(list);
        refreshManager(list);
        notifyOrchestrator(list);
      });
    }
  }

  // ---------- Register ke registry skema ----------
  // Konversi field def custom → skema group yang dimengerti form-renderer.
  function toSchema(fields) {
    var clean = (fields || []).filter(function (f) {
      if (!f || !f.label) return false;
      if (!f.key) f.key = f.label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      return true;
    }).map(function (f) {
      // form-renderer membaca `linkedType`; def custom menyimpan `linkedRef`
      var out = Object.assign({}, f);
      if (f.kind === "linked") out.linkedType = f.linkedRef || f.linkedType || "";
      return out;
    });
    if (!clean.length) return [];
    return [{ title: "Tipe Custom", fields: clean }];
  }

  // Daftarkan ikon tipe custom ke map ikon global (juga dipakai sidebar & picker).
  function registerIcons(list) {
    if (!window.AwbElementForm || !window.AwbElementForm.getIcons) return;
    try {
      var icons = window.AwbElementForm.getIcons();
      (list || []).forEach(function (t) {
        if (t.icon) icons[t.name] = t.icon;
      });
    } catch (e) { /* map ikon read-only */ }
  }

  function registerAll(list) {
    if (!window.AwbElementSchemas) window.AwbElementSchemas = {};
    if (!window.AwbElementForm) return;
    var names = (list || []).map(function (t) { return t.name; });
    window.AwbElementForm.setCustomTypes(names);
    // Register skema per tipe
    (list || []).forEach(function (t) {
      window.AwbElementSchemas[t.name] = toSchema(t.fields);
    });
    registerIcons(list);
  }

  function refreshManager(list) {
    renderTypeList(list, window.elementDuniaQuery);
  }

  function notifyOrchestrator(list) {
    // Ingatkan orkestrator element-dunia.js untuk re-render sidebar + picker
    if (window._elemDuniaOnCustomTypesChanged && typeof window._elemDuniaOnCustomTypesChanged === "function") {
      window._elemDuniaOnCustomTypesChanged(list);
    }
  }

  // ---------- Load untuk proyek aktif ----------
  function loadForProject() {
    var q = window.elementDuniaQuery;
    if (!q || !q.getCustomTypes) return Promise.resolve([]);
    return q.getCustomTypes().then(function (list) {
      registerAll(list);
      return list;
    });
  }

  // ---------- Buka modal pengelola ----------
  function openManager() {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    var listP = loadForProject();
    listP.then(function (list) {
      renderTypeList(list, window.elementDuniaQuery);
      loadForm(null);
      modal.classList.add("open");
    });
  }

  function closeManager() {
    document.getElementById(MODAL_ID)?.classList.remove("open");
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ---------- Init ----------
  function init() {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    modal.querySelector("[data-ct-modal-close]")?.addEventListener("click", closeManager);
    // Esc tutup
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("open")) closeManager();
    });
    // Klik backdrop
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeManager();
    });
  }

  window._elemCustomTypes = {
    init: init,
    openManager: openManager,
    closeManager: closeManager,
    loadForProject: loadForProject,
    registerAll: registerAll,
    FIELD_KINDS: FIELD_KINDS,
    ICON_PRESETS: ICON_PRESETS
  };
})();
