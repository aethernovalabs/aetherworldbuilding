// public/js/element-dunia/render.js
// Fungsi render untuk halaman Element Dunia (kategori, picker, grup, kartu, filter).
// Bergantung pada state.js (window.AwbElementDunia.state + utils).
(function () {
  "use strict";

  var st = window.AwbElementDunia.state;
  var u = window.AwbElementDunia.utils;
  var FORM_MODAL_ID = "modal-buat-element";
  var PICKER_MODAL_ID = "modal-pilih-entry";

  // ---------- Render sidebar kategori ----------
  function renderCategoryList() {
    var host = document.getElementById("elem-cat-list");
    if (!host) return;
    var icons = window.AwbElementDunia.getIcons();
    var types = window.AwbElementDunia.getAllTypes();
    // data-type="all" untuk "Semua Element" (tidak ambigu)
    var html = '<button class="elem-cat-item active" data-type="all">' +
      '<span class="elem-cat-label"><iconify-icon icon="lucide:layers" width="14"></iconify-icon>' +
      '<span class="cat-label-text">Semua Element</span></span>' +
      '<span class="elem-count" data-count="all">0</span></button>';
    types.forEach(function (t) {
      var icon = icons[t] || "lucide:shapes";
      html += '<button class="elem-cat-item" data-type="' + u.escapeHtml(t) + '">' +
        '<span class="elem-cat-label"><iconify-icon icon="' + icon + '" width="14"></iconify-icon>' +
        '<span class="cat-label-text">' + u.escapeHtml(t) + '</span></span>' +
        '<span class="elem-count" data-count="' + u.escapeHtml(t) + '">0</span></button>';
    });
    host.innerHTML = html;
  }

  // ---------- Picker "Entry Element" ----------
  function renderEntryPicker() {
    var body = document.getElementById("modal-pilih-entry-list");
    if (!body) return;
    var icons = window.AwbElementDunia.getIcons();
    body.innerHTML = window.AwbElementDunia.getAllTypes().map(function (t) {
      var icon = icons[t] || "lucide:shapes";
      return '<button class="elem-cat-btn" data-pick-type="' + u.escapeHtml(t) + '">' +
        '<iconify-icon icon="' + icon + '" width="14"></iconify-icon>' +
        u.escapeHtml(t) +
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

  // ---------- Render grup + kartu ----------
  function renderGroups() {
    var container = document.getElementById("elem-groups-container");
    if (!container) return;
    container.innerHTML = "";
    var visibleTypes = visibleTypesAfterFilter();
    if (visibleTypes.length === 0) {
      container.innerHTML =
        '<div class="elem-empty-state" style="padding:3rem 1.5rem;text-align:center;border:1px dashed var(--border);border-radius:var(--radius-md);background:var(--bg-dark);">' +
          '<div style="font-size:1rem;font-weight:700;margin-bottom:0.4rem;">Belum ada Element Dunia</div>' +
          '<div style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1rem;">Mulai buat element pertamamu untuk dunia yang sedang dibangun.</div>' +
          '<button class="btn-confirm" data-empty-entry>+ Buat Element Pertama</button>' +
        '</div>';
      container.addEventListener("click", function _emptyClick(e) {
        if (e.target.closest("[data-empty-entry]")) {
          container.removeEventListener("click", _emptyClick);
          openEntryPicker();
        }
      });
      return;
    }
    container.innerHTML = visibleTypes.map(function (t) {
      return '<div class="elem-group open" data-type="' + u.escapeHtml(t) + '">' +
        '<button class="elem-group-head" data-toggle-group>' +
          u.escapeHtml(t) +
          '<span class="chev" style="margin-left:auto;display:inline-block;transition:transform .15s;">v</span>' +
        '</button>' +
        '<div class="elem-cards"></div>' +
      '</div>';
    }).join("");
    filterAndRender();
  }

  function visibleTypesAfterFilter() {
    var activeBtn = document.querySelector(".elem-cat-item.active");
    var selectedType = activeBtn ? (activeBtn.getAttribute("data-type") || null) : null;
    // "all" = Semua Element → tidak ada filter jenis
    if (selectedType === "all") selectedType = null;
    var activeTag = (window._elemDuniaTagFilter && window._elemDuniaTagFilter.activeTag) || null;
    var set = {};
    st.allElements.forEach(function (e) {
      if (selectedType && e._type !== selectedType) return;
      if (st.currentSearchTerm && !(e.name || "").toLowerCase().includes(st.currentSearchTerm)) return;
      if (activeTag && !(((e.data && e.data.tags) || []).indexOf(activeTag) >= 0)) return;
      set[e._type] = true;
    });
    return window.AwbElementDunia.getAllTypes().filter(function (t) { return set[t]; });
  }

  function filterAndRender() {
    var container = document.getElementById("elem-groups-container");
    if (!container) return;
    var visibleTypes = visibleTypesAfterFilter();
    if (visibleTypes.length === 0) {
      container.innerHTML =
        '<div class="elem-empty-state" style="padding:2.5rem 1.5rem;text-align:center;border:1px dashed var(--border);border-radius:var(--radius-md);background:var(--bg-dark);color:var(--text-muted);font-size:0.9rem;">' +
          'Tidak ada element yang cocok dengan filter saat ini.' +
        '</div>';
      return;
    }
    var existingTypes = {};
    u.$all(".elem-group", container).forEach(function (g) {
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
          '<button class="elem-group-head" data-toggle-group>' + u.escapeHtml(t) +
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
    st.allElements.forEach(function (e) {
      if (window.AwbElementDunia.selectedType() && e._type !== window.AwbElementDunia.selectedType()) return;
      if (st.currentSearchTerm && !(e.name || "").toLowerCase().includes(st.currentSearchTerm)) return;
      if (activeTag && !(((e.data && e.data.tags) || []).indexOf(activeTag) >= 0)) return;
      groups[e._type].push(e);
    });

    visibleTypes.forEach(function (type) {
      var groupEl = container.querySelector('.elem-group[data-type="' + u.cssEscapeAttr(type) + '"]');
      if (!groupEl) return;
      var cards = groupEl.querySelector(".elem-cards");
      if (!cards) return;
      var list = groups[type];
      if (list.length === 0) {
        cards.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-faint);font-size:0.85rem;">Belum ada ' +
          u.escapeHtml(type) + '</div>';
        return;
      }
      cards.className = "elem-cards" + (st.currentViewMode === "list" ? " list-mode" : "");
      cards.innerHTML = list.map(function (e) { return renderCard(e, type); }).join("");
    });
  }

  function renderCard(e, type) {
    var imgUrl = (e.data && (e.data.imageUrl || e.data.image)) || "";
    var img = imgUrl
      ? '<img src="' + u.escapeHtml(imgUrl) + '" alt="" loading="lazy" data-thumb-img>'
      : '<span class="elem-thumb-fallback"><iconify-icon icon="lucide:image" width="28"></iconify-icon></span>';
    var desc = (e.data && e.data.description) || "";
    var tags = ((e.data && e.data.tags) || []).join(" ");
    return '<div class="elem-card">' +
      '<div class="elem-card-top">' +
        '<span class="elem-thumb">' + img + '</span>' +
        '<span class="elem-card-type">' + u.escapeHtml(type) + '</span>' +
      '</div>' +
      '<div class="elem-card-body">' +
        '<div class="elem-card-headrow">' +
          '<div class="elem-card-name">' + u.escapeHtml(e.name || "Unknown") + '</div>' +
          '<div class="elem-card-actions">' +
            '<iconify-icon icon="lucide:pen-line" width="14" data-action="edit" data-id="' + e.id + '" data-type="' + u.escapeHtml(type) + '" style="cursor:pointer;"></iconify-icon>' +
            '<iconify-icon icon="lucide:trash-2" width="14" data-action="del" data-id="' + e.id + '" style="color:var(--danger);cursor:pointer;"></iconify-icon>' +
          '</div>' +
        '</div>' +
        '<div class="elem-card-desc">' + u.escapeHtml(desc) + '</div>' +
        '<div class="elem-card-tags">' + u.escapeHtml(tags) + '</div>' +
      '</div>' +
    '</div>';
  }

  function updateCategoryCounts() {
    var counts = {};
    window.AwbElementDunia.getAllTypes().forEach(function (t) { counts[t] = 0; });
    st.allElements.forEach(function (e) { counts[e._type] = (counts[e._type] || 0) + 1; });
    document.querySelectorAll(".elem-cat-item").forEach(function (btn) {
      var key = btn.getAttribute("data-type") || "";
      var el = btn.querySelector(".elem-count");
      if (!el) return;
      el.textContent = key === "all" ? st.allElements.length : (counts[key] || 0);
    });
  }

  // Expose untuk index.js dan events.js
  window.renderCategoryList = renderCategoryList;
  window.openEntryPicker = openEntryPicker;
  window.closeEntryPicker = closeEntryPicker;
  window.renderGroups = renderGroups;
  window.updateCategoryCounts = updateCategoryCounts;
  window.filterAndRender = filterAndRender;

})();
