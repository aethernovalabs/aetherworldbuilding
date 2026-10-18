/*
 * awb-sidebar.js
 * Logika sidebar utama + Manajemen Dunia (switch / edit / hapus / urut / tambah).
 * Modal di-inject dari JS agar konsisten di semua halaman tanpa mengubah tiap HTML.
 */
(function () {
  "use strict";

  function whenAether(fn) {
    if (window.AetherState && AetherState.available) { fn(AetherState); return; }
    setTimeout(function () { whenAether(fn); }, 50);
  }

  function currentWorldName() {
    var params = new URLSearchParams(window.location.search);
    return params.get("world") || "";
  }

  // --- Inject style (sekali) ---
  function ensureStyle() {
    if (document.getElementById("awb-mgmt-style")) return;
    var css = [
      ".awb-mgmt-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(3px);z-index:9000;display:none;align-items:center;justify-content:center;padding:1rem;}",
      ".awb-mgmt-overlay.open{display:flex;}",
      ".awb-mgmt-box{width:100%;max-width:520px;max-height:80vh;background:#111726;border:1px solid #293850;border-radius:8px;box-shadow:0 20px 40px rgba(0,0,0,.8);display:flex;flex-direction:column;overflow:hidden;color:#f1f5f9;font-family:'Plus Jakarta Sans',system-ui,sans-serif;}",
      ".awb-mgmt-head{padding:.75rem 1rem;border-bottom:1px solid #243048;display:flex;align-items:center;justify-content:space-between;font-weight:700;font-size:.9rem;}",
      ".awb-mgmt-close{cursor:pointer;background:transparent;border:none;color:#94a3b8;font-size:1rem;line-height:1;}",
      ".awb-mgmt-close:hover{color:#fff;}",
      ".awb-mgmt-body{padding:.75rem;overflow-y:auto;display:flex;flex-direction:column;gap:.4rem;min-height:0;}",
      ".awb-mgmt-row{display:flex;align-items:center;gap:.4rem;padding:.5rem .6rem;background:#0f1626;border:1px solid #1f2b40;border-radius:6px;}",
      ".awb-mgmt-row.active{border-color:#8b5cf6;background:rgba(139,92,246,.12);}",
      ".awb-mgmt-name{flex:1;cursor:pointer;font-size:.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".awb-mgmt-desc{font-size:.68rem;color:#94a3b8;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".awb-mgmt-btn{width:24px;height:24px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;background:#182235;border:1px solid #2b3952;border-radius:4px;color:#cbd5e1;cursor:pointer;font-size:.72rem;padding:0;}",
      ".awb-mgmt-btn:hover{background:#25334c;color:#fff;}",
      ".awb-mgmt-btn.danger:hover{background:#7f1d1d;border-color:#ef4444;color:#fff;}",
      ".awb-mgmt-btn:disabled{opacity:.3;cursor:default;}",
      ".awb-mgmt-edit-area{display:flex;flex-direction:column;gap:.4rem;flex:1;min-width:0;}",
      ".awb-mgmt-inp{width:100%;padding:.4rem .55rem;background:#0a0e18;border:1px solid #25334a;border-radius:4px;color:#f1f5f9;font-size:.78rem;outline:none;}",
      ".awb-mgmt-add{margin-top:.35rem;padding-top:.6rem;border-top:1px solid #243048;display:flex;flex-direction:column;gap:.4rem;}",
      ".awb-mgmt-addlabel{font-size:.72rem;font-weight:700;color:#94a3b8;}",
      ".awb-mgmt-primary{padding:.45rem 1rem;background:#162032;border:1px solid #8b5cf6;border-radius:5px;color:#c4b5fd;font-weight:700;font-size:.78rem;cursor:pointer;}",
      ".awb-mgmt-primary:hover{background:#1e2a42;}",
      ".awb-mgmt-empty{padding:1.5rem;text-align:center;color:#64748b;font-size:.82rem;}",
      ".awb-set-row{display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:.6rem .65rem;background:#0f1626;border:1px solid #1f2b40;border-radius:6px;}",
      ".awb-set-row .lbl{display:flex;align-items:center;gap:.45rem;font-size:.82rem;font-weight:600;color:#e2e8f0;}",
      ".awb-set-row .sub{font-size:.68rem;color:#94a3b8;font-weight:400;margin-top:2px;}",
      ".awb-set-toggle{font-size:.74rem;font-weight:700;padding:.25rem .7rem;border-radius:9999px;border:1px solid #25334a;background:#0a0e18;color:#94a3b8;cursor:pointer;min-width:74px;text-align:center;}",
      ".awb-set-toggle.on{color:#10b981;border-color:rgba(16,185,129,.5);background:rgba(16,185,129,.12);}"
    ].join("");
    var el = document.createElement("style");
    el.id = "awb-mgmt-style";
    el.textContent = css;
    document.head.appendChild(el);
  }

  // --- Inject modal (sekali) ---
  function ensureModal() {
    if (document.getElementById("awb-mgmt-overlay")) return;
    var ov = document.createElement("div");
    ov.className = "awb-mgmt-overlay";
    ov.id = "awb-mgmt-overlay";
    ov.innerHTML =
      '<div class="awb-mgmt-box">' +
        '<div class="awb-mgmt-head">' +
          '<span><iconify-icon icon="lucide:globe" width="16"></iconify-icon> Manajemen Dunia</span>' +
          '<button class="awb-mgmt-close" id="awb-mgmt-close" title="Tutup">&times;</button>' +
        '</div>' +
        '<div class="awb-mgmt-body">' +
          '<div id="awb-mgmt-list"></div>' +
          '<div class="awb-mgmt-add">' +
            '<div class="awb-mgmt-addlabel">Tambah Dunia Baru</div>' +
            '<input class="awb-mgmt-inp" id="awb-mgmt-new-name" placeholder="Nama dunia...">' +
            '<input class="awb-mgmt-inp" id="awb-mgmt-new-desc" placeholder="Deskripsi singkat (opsional)">' +
            '<button class="awb-mgmt-primary" id="awb-mgmt-add-btn">+ Tambah Dunia</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    ov.addEventListener("click", function (e) { if (e.target === ov) closeMgmt(); });
    document.getElementById("awb-mgmt-close").addEventListener("click", closeMgmt);
  }

  function openMgmt() {
    ensureStyle();
    ensureModal();
    document.getElementById("awb-mgmt-overlay").classList.add("open");
    renderMgmtList();
  }

  function closeMgmt() {
    var ov = document.getElementById("awb-mgmt-overlay");
    if (ov) ov.classList.remove("open");
  }

  function goToWorld(name) {
    window.location.href = window.location.pathname + "?world=" + encodeURIComponent(name);
  }

  // --- Setting popup (Auto Save) ---
  function ensureSettingsModal() {
    if (document.getElementById("awb-set-overlay")) return;
    var ov = document.createElement("div");
    ov.className = "awb-mgmt-overlay";
    ov.id = "awb-set-overlay";
    ov.innerHTML =
      '<div class="awb-mgmt-box" style="max-width:420px;">' +
        '<div class="awb-mgmt-head">' +
          '<span><iconify-icon icon="lucide:settings-2" width="16"></iconify-icon> Pengaturan</span>' +
          '<button class="awb-mgmt-close" id="awb-set-close" title="Tutup">&times;</button>' +
        '</div>' +
        '<div class="awb-mgmt-body">' +
          '<div class="awb-set-row">' +
            '<div><div class="lbl"><iconify-icon icon="lucide:save" width="15"></iconify-icon> Auto Save</div>' +
            '<div class="sub">Simpan perubahan otomatis ke IndexedDB.</div></div>' +
            '<button class="awb-set-toggle" id="awb-set-autosave">No Active</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) { if (e.target === ov) closeSettings(); });
    document.getElementById("awb-set-close").addEventListener("click", closeSettings);

    var toggle = document.getElementById("awb-set-autosave");
    toggle.addEventListener("click", function () {
      var on = !(localStorage.getItem("awb_auto_save") !== "false");
      localStorage.setItem("awb_auto_save", String(!on));
      applyAutoSaveToggle();
      // Sinkronkan pill Auto Save di Dashboard jika ada
      window.dispatchEvent(new CustomEvent("awb:autosave-change"));
    });
  }

  function applyAutoSaveToggle() {
    var toggle = document.getElementById("awb-set-autosave");
    if (!toggle) return;
    var on = localStorage.getItem("awb_auto_save") !== "false";
    toggle.classList.toggle("on", on);
    toggle.textContent = on ? "Active" : "No Active";
  }

  function openSettings() {
    ensureStyle();
    ensureSettingsModal();
    applyAutoSaveToggle();
    document.getElementById("awb-set-overlay").classList.add("open");
  }

  function closeSettings() {
    var ov = document.getElementById("awb-set-overlay");
    if (ov) ov.classList.remove("open");
  }

  function renderMgmtList() {
    var list = document.getElementById("awb-mgmt-list");
    if (!list || !window.AetherState) return;
    var activeName = currentWorldName();

    AetherState.getProjects().then(function (projects) {
      if (!projects || !projects.length) {
        list.innerHTML = '<div class="awb-mgmt-empty">Belum ada dunia. Tambahkan di bawah.</div>';
        return;
      }
      list.innerHTML = "";
      projects.forEach(function (p, idx) {
        var row = document.createElement("div");
        row.className = "awb-mgmt-row" + (p.name === activeName ? " active" : "");
        row.dataset.id = p.id;

        var nameWrap = document.createElement("div");
        nameWrap.className = "awb-mgmt-name";
        nameWrap.innerHTML = escapeHtml(p.name) +
          (p.desc ? '<div class="awb-mgmt-desc">' + escapeHtml(p.desc) + '</div>' : "");
        nameWrap.title = "Klik untuk pindah ke dunia ini";
        nameWrap.addEventListener("click", function () {
          if (p.name === currentWorldName()) { closeMgmt(); return; }
          AetherState.setActiveProject(p).then(function () { goToWorld(p.name); });
        });
        row.appendChild(nameWrap);

        row.appendChild(mgmtBtn("lucide:chevron-up", "Naikkan", idx === 0, function () { moveProject(projects, idx, -1); }));
        row.appendChild(mgmtBtn("lucide:chevron-down", "Turunkan", idx === projects.length - 1, function () { moveProject(projects, idx, 1); }));
        row.appendChild(mgmtBtn("lucide:pen-line", "Edit", false, function () { startEdit(row, p); }));
        row.appendChild(mgmtBtn("lucide:trash-2", "Hapus", false, function () { confirmDelete(p); }, "danger"));

        list.appendChild(row);
      });
    });
  }

  function mgmtBtn(icon, title, disabled, onClick, extraClass) {
    var b = document.createElement("button");
    b.className = "awb-mgmt-btn" + (extraClass ? " " + extraClass : "");
    b.title = title;
    b.disabled = !!disabled;
    b.innerHTML = '<iconify-icon icon="' + icon + '" width="14"></iconify-icon>';
    if (!disabled) b.addEventListener("click", onClick);
    return b;
  }

  function moveProject(projects, idx, dir) {
    var to = idx + dir;
    if (to < 0 || to >= projects.length) return;
    var arr = projects.slice();
    var tmp = arr[idx]; arr[idx] = arr[to]; arr[to] = tmp;
    AetherState.reorderProjects(arr.map(function (p) { return p.id; })).then(renderMgmtList);
  }

  function startEdit(row, project) {
    row.innerHTML = "";
    var area = document.createElement("div");
    area.className = "awb-mgmt-edit-area";
    area.innerHTML =
      '<input class="awb-mgmt-inp" id="awb-mgmt-edit-name" value="' + escapeAttr(project.name) + '">' +
      '<input class="awb-mgmt-inp" id="awb-mgmt-edit-desc" value="' + escapeAttr(project.desc || "") + '" placeholder="Deskripsi">';
    row.appendChild(area);
    row.appendChild(mgmtBtn("lucide:check", "Simpan", false, function () {
      var newName = (document.getElementById("awb-mgmt-edit-name").value || "").trim();
      var newDesc = (document.getElementById("awb-mgmt-edit-desc").value || "").trim();
      if (!newName) { alert("Nama dunia wajib diisi"); return; }
      var wasActive = project.name === currentWorldName();
      AetherState.updateProject(project.id, { name: newName, desc: newDesc }).then(function () {
        if (wasActive) {
          AetherState.setActiveProject({ id: project.id, name: newName }).then(function () {
            goToWorld(newName);
          });
        } else {
          renderMgmtList();
        }
      });
    }));
    row.appendChild(mgmtBtn("lucide:x", "Batal", false, renderMgmtList));
    var nameInput = document.getElementById("awb-mgmt-edit-name");
    if (nameInput) nameInput.focus();
  }

  function confirmDelete(project) {
    if (!confirm('Hapus dunia "' + project.name + '" beserta seluruh datanya? Tindakan ini tidak bisa dibatalkan.')) return;
    var wasActive = project.name === currentWorldName();
    AetherState.deleteProject(project.id).then(function () {
      if (wasActive) {
        AetherState.getProjects().then(function (rest) {
          if (rest && rest.length) {
            AetherState.setActiveProject(rest[0]).then(function () { goToWorld(rest[0].name); });
          } else {
            window.location.href = window.location.pathname;
          }
        });
      } else {
        renderMgmtList();
      }
    });
  }

  function addWorld() {
    var nameEl = document.getElementById("awb-mgmt-new-name");
    var descEl = document.getElementById("awb-mgmt-new-desc");
    var name = (nameEl.value || "").trim();
    if (!name) { alert("Nama dunia wajib diisi"); return; }
    var desc = (descEl.value || "").trim();
    AetherState.projectExists(name).then(function (exists) {
      if (exists) { alert("Nama dunia sudah dipakai"); return; }
      AetherState.addProject({ name: name, desc: desc }).then(function (project) {
        if (!project) { renderMgmtList(); return; }
        AetherState.setActiveProject(project).then(function () { goToWorld(project.name); });
      });
    });
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function escapeAttr(s) { return escapeHtml(s); }

  function initAwbSidebar() {
    var awbSidebar = document.getElementById("awb-main-sidebar");
    if (!awbSidebar) return;

    var btnExpandMainSidebar = document.getElementById("btn-expand-main-sidebar");
    var btnBottomExpand = document.getElementById("btn-bottom-expand");
    var btnCollapseMainSidebar = document.getElementById("btn-collapse-main-sidebar");
    var btnToggleWorldMenu = document.getElementById("btn-toggle-world-menu");
    var btnOpenSettings = document.getElementById("btn-open-settings");

    var isSavedExpanded = localStorage.getItem("awb_sidebar_expanded") === "true";
    if (isSavedExpanded) awbSidebar.classList.add("expanded");

    function expandSidebar() {
      awbSidebar.classList.add("expanded");
      localStorage.setItem("awb_sidebar_expanded", "true");
    }
    function collapseSidebar() {
      awbSidebar.classList.remove("expanded");
      localStorage.setItem("awb_sidebar_expanded", "false");
    }
    if (btnExpandMainSidebar) btnExpandMainSidebar.onclick = expandSidebar;
    if (btnBottomExpand) btnBottomExpand.onclick = expandSidebar;
    if (btnCollapseMainSidebar) btnCollapseMainSidebar.onclick = collapseSidebar;

    // Tombol "World Manager" → buka modal Manajemen Dunia
    if (btnToggleWorldMenu) {
      btnToggleWorldMenu.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        openMgmt();
        var addBtn = document.getElementById("awb-mgmt-add-btn");
        if (addBtn && !addBtn._bound) {
          addBtn._bound = true;
          addBtn.addEventListener("click", addWorld);
        }
      };
    }

    // Tombol Setting → buka popup Pengaturan (Auto Save)
    if (btnOpenSettings) {
      btnOpenSettings.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        openSettings();
      };
    }

    // Pastikan proyek aktif tersimpan bila datang dari param ?world=
    var worldParam = new URLSearchParams(window.location.search).get("world");
    if (worldParam) {
      whenAether(function (AetherState) {
        AetherState.getProjectByName(worldParam).then(function (project) {
          if (project) AetherState.setActiveProject(project);
        });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAwbSidebar);
  } else {
    initAwbSidebar();
  }
})();