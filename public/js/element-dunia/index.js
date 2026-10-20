// public/js/element-dunia/index.js
// Orkestrator halaman Element Dunia. Memuat state, render, form, events,
// lalu inisialisasi halaman dan expose API global.
// Urutan script di HTML: state.js → render.js → form.js → events.js → index.js.
(function () {
  "use strict";

  var st = window.AwbElementDunia.state;
  var u = window.AwbElementDunia.utils;

  // ---------- Reload + render grup ----------
  async function reloadAll() {
    if (!window.elementDuniaQuery) return;
    var types = window.AwbElementDunia.getAllTypes();
    var promises = types.map(function (t) { return window.elementDuniaQuery.getElements(t); });
    var results = await Promise.all(promises);
    st.allElements = [];
    types.forEach(function (t, idx) {
      if (results[idx]) {
        st.allElements = st.allElements.concat(
          results[idx].map(function (e) { return Object.assign({}, e, { _type: t }); })
        );
      }
    });
    // Expose agar awb-tag-filter.js bisa membaca seluruh element untuk bangun daftar tag unik
    window._elemDuniaAll = st.allElements;
    window.renderGroups();
    window.updateCategoryCounts();
    // Refresh daftar tag dinamis (setelah create/edit/delete)
    if (window._elemDuniaTagFilter && typeof window._elemDuniaTagFilter.renderTagFilter === "function") {
      window._elemDuniaTagFilter.renderTagFilter();
    }
  }

  // Expose reloadAll agar form.js bisa memanggilnya setelah save
  window.AwbElementDunia.reloadAll = reloadAll;

  // ---------- Init ----------
  async function initPage() {
    if (!window.AetherPageUtils) return;
    var utils = await window.AetherPageUtils.initPage();
    if (!utils.query) {
      console.warn("Tidak ada proyek aktif");
      return;
    }
    window.elementDuniaQuery = utils.query;
    st.elementDuniaQuery = utils.query;
    if (window.AwbElementForm && typeof window.AwbElementForm.init === "function") {
      window.AwbElementForm.init();
    }
    window.renderCategoryList();
    // Sinkronkan state tombol view-grid / view-list dengan currentViewMode (mungkin persist dari localStorage)
    document.getElementById("view-grid")?.classList.toggle("active", st.currentViewMode === "grid");
    document.getElementById("view-list")?.classList.toggle("active", st.currentViewMode === "list");
    window.wireEvents();
    if (window._elemDetailPanel && typeof window._elemDetailPanel.init === "function") {
      window._elemDetailPanel.init();
    }
    // Muat + register tipe custom proyek ini, lalu render ulang daftar
    if (window._elemCustomTypes && typeof window._elemCustomTypes.init === "function") {
      window._elemCustomTypes.init();
    }
    if (window._elemCustomTypes && typeof window._elemCustomTypes.loadForProject === "function") {
      await window._elemCustomTypes.loadForProject();
    }
    await reloadAll();
  }

  // ---------- Expose API global ----------
  window._elemDuniaOnCustomTypesChanged = function () {
    window.renderCategoryList();
    reloadAll();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
  } else {
    initPage();
  }

})();
