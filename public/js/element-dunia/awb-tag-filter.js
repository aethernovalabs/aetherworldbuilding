// awb-tag-filter.js — Filter dinamis tag di halaman Element Dunia.
//
// Membaca tag unik dari `allElements` (yang di-expose oleh element-dunia.js
// sebagai window._elemDuniaAll).
//
// API:
//   renderTagFilter()
//       - Baca semua tag unik dari semua element
//       - Jika 0 tag → sembunyikan baris filter tag
//       - Jika >0 → tampilkan chip (tanpa duplikat)
//       - Klik chip = filter aktif; klik lagi = batal
//       - Filter bekerja bersama filter kategori sidebar & search
//
// State:
//   activeTag (string | null) — disimpan di module scope
//   expose: window._elemDuniaTagFilter = { get activeTag, clear, apply }
(function () {
  "use strict";

  var activeTag = null;
  var hostEl = null;

  function collectUniqueTags() {
    var all = window._elemDuniaAll || [];
    var seen = {};
    var tags = [];
    all.forEach(function (e) {
      var list = (e.data && e.data.tags) || [];
      list.forEach(function (t) {
        var key = String(t || "").trim();
        if (!key || seen[key]) return;
        seen[key] = true;
        tags.push(key);
      });
    });
    return tags;
  }

  function renderTagFilter() {
    if (!hostEl) hostEl = document.getElementById("elem-tag-filter-row");
    if (!hostEl) return;

    var tags = collectUniqueTags();

    if (tags.length === 0) {
      // Tidak ada element dengan tag → sembunyikan bagian filter tag
      hostEl.style.display = "none";
      hostEl.innerHTML = "";
      activeTag = null;
      return;
    }

    hostEl.style.display = "";
    var parts = ['<span style="font-size:0.78rem;color:var(--text-muted);">Tag:</span>'];
    tags.forEach(function (t) {
      var isActive = activeTag === t;
      parts.push(
        '<button type="button" data-tag-filter="' + escapeAttr(t) + '"' +
        ' class="elem-tag-chip' + (isActive ? " active" : "") + '"' +
        ' style="font-size:0.72rem;border:1px solid ' + (isActive ? "var(--danger)" : "var(--border)") + ';' +
        'background:' + (isActive ? "var(--bg-dark)" : "var(--bg-surface)") + ';' +
        'color:' + (isActive ? "var(--text)" : "var(--text-muted)") + ';' +
        'border-radius:999px;padding:0.15rem 0.55rem;cursor:pointer;">' +
        escapeHtml(t) +
        '</button>'
      );
    });
    hostEl.innerHTML = parts.join(" ");

    // Klik chip
    hostEl.querySelectorAll("[data-tag-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var val = btn.getAttribute("data-tag-filter");
        // Toggle: klik tag aktif = batal
        activeTag = (activeTag === val) ? null : val;
        renderTagFilter();
        window._elemDuniaTagFilter.apply();
      });
    });
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function escapeAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  window._elemDuniaTagFilter = {
    get activeTag() { return activeTag; },
    setActiveTag: function (t) { activeTag = t || null; },
    renderTagFilter: renderTagFilter,
    // Terapkan activeTag ke filter kartu.
    apply: function () {
      // element-dunia.js mengekspos filterAndRender di window
      if (typeof window.filterAndRender === "function") window.filterAndRender();
    }
  };
})();
