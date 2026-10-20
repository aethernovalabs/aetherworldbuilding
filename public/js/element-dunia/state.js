// public/js/element-dunia/state.js
// State bersama + utilitas untuk modul Element Dunia.
// Semua modul baca/tulis langsung ke window.AwbElementDunia.state
// (jangan menyalin array/objek ke variabel lokal untuk di-mutasi).
(function () {
  "use strict";

  window.AwbElementDunia = window.AwbElementDunia || {};

  // ---------- State bersama ----------
  window.AwbElementDunia.state = {
    allElements: [],
    VIEW_STORAGE_KEY: "awb_element_view_mode",
    currentViewMode: (function () {
      try {
        var v = localStorage.getItem("awb_element_view_mode");
        return v === "list" || v === "grid" ? v : "grid";
      } catch (e) { return "grid"; }
    })(),
    currentSearchTerm: "",
    currentEditingId: null,
    currentEditingType: null,
    currentImageTargetInput: null, // .elem-img-url yang sedang diedit
    elementDuniaQuery: null
  };

  // ---------- Utilitas murni ----------
  window.AwbElementDunia.utils = {
    debounce: function (fn, ms) {
      var timer;
      return function () {
        var args = arguments, ctx = this;
        clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
      };
    },

    $: function (sel, root) { return (root || document).querySelector(sel); },
    $all: function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); },

    escapeHtml: function (s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    },

    // Escape untuk attribute selector di dalam tanda kutip ganda.
    // Dipakai saat membangun selector [data-type="..."] di querySelector.
    cssEscapeAttr: function (s) {
      return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }
  };

  // ---------- Getter dari registry skema ----------
  window.AwbElementDunia.getAllTypes = function () {
    return window.AwbElementForm ? window.AwbElementForm.getAllTypes() : [];
  };

  window.AwbElementDunia.getIcons = function () {
    return (window.AwbElementForm && window.AwbElementForm.getIcons()) || {};
  };

  // Tipe yang dipilih di sidebar kategori. "all" (Semua Element) → null (tanpa filter jenis).
  window.AwbElementDunia.selectedType = function () {
    var activeBtn = document.querySelector(".elem-cat-item.active");
    var dt = activeBtn ? activeBtn.getAttribute("data-type") : null;
    return dt === "all" ? null : dt;
  };

  // Alias global untuk modul luar (form-renderer, awb-tag-filter, detail-panel, custom-types).
  // Di-sinkronkan oleh index.js saat init dan oleh form.js saat data berubah.
  window._elemDuniaAll = window.AwbElementDunia.state.allElements;
  window.elementDuniaQuery = null;

})();
