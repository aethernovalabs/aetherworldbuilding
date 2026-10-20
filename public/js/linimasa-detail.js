// public/js/linimasa-detail.js
// Panel sidebar kanan detail peristiwa (pola visual seperti info element dunia).
// Dibuka saat kartu peristiwa diklik. Mode baca-saja + aksi Tutup/Edit/Hapus.
//
// API (exposed via window._eventDetailPanel):
//   open(event)    → buka panel untuk objek peristiwa
//   close()        → tutup panel
//   isOpen()       → boolean
//   init()         → pasang wiring tombol, section toggle, Escape
//   currentId      → id peristiwa yang sedang ditampilkan

(function () {
  "use strict";

  var PANEL_ID = "event-detail-panel";
  var currentId = null;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function isEmptyVal(val) {
    return val === undefined || val === null || val === "" ||
      (typeof val === "boolean" && val === false);
  }

  function formatByKind(kind, val) {
    if (kind === "bool") return val ? "Ya" : "Tidak";
    return esc(String(val));
  }

  function makeSection(title) {
    var sec = document.createElement("div");
    sec.className = "elem-section";
    var head = document.createElement("div");
    head.className = "elem-section-head";
    head.innerHTML = '<span class="elem-section-toggle">v</span><span>' + esc(title) + "</span>";
    var body = document.createElement("div");
    body.className = "elem-section-body";
    sec.appendChild(head);
    sec.appendChild(body);
    return { sec: sec, body: body };
  }

  function appendCard(body, label, innerNodeOrHtml, isHtml) {
    var card = document.createElement("div");
    card.className = "elem-info-card";
    var lab = document.createElement("div");
    lab.className = "elem-info-card-label";
    lab.textContent = label;
    card.appendChild(lab);
    if (innerNodeOrHtml && innerNodeOrHtml.nodeType) {
      card.appendChild(innerNodeOrHtml);
    } else {
      var val = document.createElement("div");
      val.className = "elem-info-card-value";
      if (isHtml) val.innerHTML = innerNodeOrHtml || "";
      else val.textContent = innerNodeOrHtml || "";
      card.appendChild(val);
    }
    body.appendChild(card);
  }

  // Chip relasi: Peristiwa → buka panel peristiwa lain; selain itu → navigasi halaman target
  function chipRow(items) {
    var row = document.createElement("div");
    row.className = "elem-chip-row";
    (items || []).forEach(function (item) {
      var name = (item && item.name) ? item.name : item;
      var id = (item && item.id) ? item.id : "";
      var type = (item && item.type) ? item.type : "";
      if (!name) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "elem-linked-chip";
      btn.textContent = name;
      btn.dataset.linkedId = id;
      btn.dataset.linkedType = type;
      row.appendChild(btn);
    });
    return row;
  }

  function navigateChip(id, type) {
    if (type === "Peristiwa") {
      var ev = window._linimasaGetEvent ? window._linimasaGetEvent(Number(id)) : null;
      if (ev) open(ev);
      return;
    }
    if (window._linimasaNavigate) window._linimasaNavigate(type);
  }

  // Schema grup peristiwa dibagikan oleh linimasa.js (single source of truth).
  function getSchema() {
    return window._linimasaSchema || [];
  }

  function renderInto(ev) {
    var panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    var d = ev.data || {};
    var fields = d.fields || {};
    var extra = d.extraFields || {};
    var linked = d.linkedElements || {};
    var lists = d.lists || {};
    var imgUrl = d.imageUrl || "";
    var type = fields.type || d.type || "";
    var era = fields.era || d.era || "";

    var thumb = imgUrl
      ? '<img src="' + esc(imgUrl) + '" alt="" loading="lazy" data-detail-thumb-img>'
      : '<span class="elem-detail-thumb-fallback"><iconify-icon icon="lucide:image" width="16"></iconify-icon></span>';
    panel.querySelector(".elem-detail-thumb").innerHTML = thumb;
    panel.querySelector(".elem-detail-name").textContent = ev.name || "(tanpa nama)";
    var sub = [];
    if (type) sub.push("Tipe: " + type);
    if (era) sub.push(era);
    panel.querySelector(".elem-detail-sub").textContent = sub.join(" · ");

    var descEl = panel.querySelector("[data-detail-desc]");
    if (descEl) {
      var desc = d.description && String(d.description).trim();
      descEl.textContent = desc || "Belum ada deskripsi.";
    }

    var host = panel.querySelector("[data-detail-sections]");
    if (!host) return;
    host.innerHTML = "";

    var schema = getSchema();
    var usedLinked = {};
    // Nilai field: dukung data legacy bersarang maupun top-level (era/type lama, dll)
    var values = Object.assign({}, d, fields);

    schema.forEach(function (group) {
      var built = makeSection(group.title || "Informasi");
      var filled = false;
      (group.fields || []).forEach(function (f) {
        if (f.kind === "linked") {
          usedLinked[f.key] = true;
          var chips = linked[f.key] || [];
          if (!chips.length) return;
          filled = true;
          appendCard(built.body, f.label || f.key, chipRow(chips));
          return;
        }
        if (f.kind === "list" || f.kind === "image" || f.kind === "tags") return;
        var val = values[f.key];
        if (isEmptyVal(val)) return;
        filled = true;
        appendCard(built.body, f.label || f.key, formatByKind(f.kind, val), true);
      });
      if (filled) host.appendChild(built.sec);
    });

    // Relasi legacy (data lama: teks location/people, flag major)
    var legacySec = makeSection("Informasi Tambahan");
    var legacyFilled = false;
    if (d.major === true) {
      appendCard(legacySec.body, "Peristiwa Mayor", "Ya", true);
      legacyFilled = true;
    }
    if (!isEmptyVal(d.location)) {
      appendCard(legacySec.body, "Lokasi", esc(String(d.location)), true);
      legacyFilled = true;
    }
    if (!isEmptyVal(d.people)) {
      appendCard(legacySec.body, "Orang Terlibat", esc(String(d.people)), true);
      legacyFilled = true;
    }
    if (legacyFilled) host.appendChild(legacySec.sec);

    var extraKeys = Object.keys(extra);
    if (extraKeys.length) {
      var ex = makeSection("Bidang Ekstra");
      extraKeys.forEach(function (k) {
        var v = extra[k];
        var valText = typeof v === "object" && v !== null ? (v.value || "") : (v || "");
        var valType = typeof v === "object" && v !== null && v.type ? " (" + v.type + ")" : "";
        appendCard(ex.body, k, esc(valText) + esc(valType), true);
      });
      host.appendChild(ex.sec);
    }

    // Relasi yang tidak masuk schema (kunci tambahan dari data)
    Object.keys(linked).forEach(function (k) {
      if (usedLinked[k]) return;
      var chips = linked[k] || [];
      if (!chips.length) return;
      var lsec = makeSection(k);
      appendCard(lsec.body, k, chipRow(chips));
      host.appendChild(lsec.sec);
    });

    Object.keys(lists).forEach(function (k) {
      var items = lists[k] || [];
      if (!items.length) return;
      var lsec = makeSection(k);
      items.forEach(function (row, idx) {
        var text = Object.keys(row).map(function (fk) {
          return fk + ": " + (row[fk] || "");
        }).join(" · ");
        appendCard(lsec.body, "Item " + (idx + 1), text, false);
      });
      host.appendChild(lsec.sec);
    });

    var hasTags = Array.isArray(d.tags) && d.tags.length;
    var hasNotes = d.notes && String(d.notes).trim();
    if (hasTags || hasNotes) {
      var catatan = makeSection("Catatan");
      if (hasTags) appendCard(catatan.body, "Tag", chipRow(d.tags));
      if (hasNotes) appendCard(catatan.body, "Catatan", d.notes, false);
      host.appendChild(catatan.sec);
    }

    if (!host.children.length) {
      var empty = document.createElement("div");
      empty.style.cssText = "color:var(--text-faint);font-size:0.85rem;text-align:center;padding:1.2rem 0 2rem;";
      empty.textContent = "Tidak ada data tambahan yang terisi.";
      host.appendChild(empty);
    }

    var thumbImg = panel.querySelector("[data-detail-thumb-img]");
    if (thumbImg) {
      thumbImg.addEventListener("error", function () {
        var fb = document.createElement("span");
        fb.className = "elem-detail-thumb-fallback";
        var ic = document.createElement("iconify-icon");
        ic.setAttribute("icon", "lucide:image");
        ic.setAttribute("width", "16");
        fb.appendChild(ic);
        thumbImg.replaceWith(fb);
      }, true);
    }
  }

  function open(ev) {
    if (!ev || !ev.id) return;
    currentId = ev.id;
    var panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    renderInto(ev);
    var body = panel.querySelector(".elem-detail-body");
    if (body) body.scrollTop = 0;
  }

  function close() {
    var panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    currentId = null;
  }

  function isOpen() {
    var panel = document.getElementById(PANEL_ID);
    return panel ? panel.classList.contains("open") : false;
  }

  function toggleSection(head) {
    var section = head.closest(".elem-section");
    if (!section) return;
    section.classList.toggle("collapsed");
    var toggle = head.querySelector(".elem-section-toggle");
    if (toggle) toggle.textContent = section.classList.contains("collapsed") ? ">" : "v";
  }

  function init() {
    var panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    panel.addEventListener("click", function (e) {
      var chip = e.target.closest(".elem-linked-chip");
      if (chip && panel.contains(chip)) {
        navigateChip(chip.dataset.linkedId, chip.dataset.linkedType);
        return;
      }
      var head = e.target.closest(".elem-section-head");
      if (head && panel.contains(head)) {
        toggleSection(head);
        return;
      }
      if (e.target.closest("[data-detail-close]")) {
        close();
        return;
      }
      if (e.target.closest("[data-detail-edit]")) {
        if (currentId && typeof window.openPeristiwaModal === "function") {
          window.openPeristiwaModal(currentId);
        }
        return;
      }
      if (e.target.closest("[data-detail-delete]")) {
        if (currentId && typeof window.deletePeristiwa === "function") {
          window.deletePeristiwa(currentId);
        }
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) close();
    });
  }

  window._eventDetailPanel = {
    open: open,
    close: close,
    isOpen: isOpen,
    init: init,
    get currentId() { return currentId; }
  };

  // Wiring internal panel (DOM sudah ada karena script dimuat di akhir body).
  init();
})();
