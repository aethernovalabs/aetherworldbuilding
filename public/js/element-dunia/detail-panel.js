// public/js/element-dunia/detail-panel.js
// Panel detail sidebar kanan untuk element dunia (pola visual seperti info karakter).
// Dibuka saat kartu diklik. Mode baca-saja, dirender dari schema per-tipe.
//
// API (exposed via window._elemDetailPanel):
//   open(element)   → buka panel untuk `element`
//   close()         → tutup panel
//   isOpen()        → boolean
//   currentId       → id element yang sedang ditampilkan
(function () {
  "use strict";

  var PANEL_ID = "elem-detail-panel";
  var currentId = null;
  var currentType = null;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function findByTypeAndName(type, name) {
    var all = window._elemDuniaAll || [];
    var target = String(name || "").trim().toLowerCase();
    if (!target) return null;
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e._type === type && String(e.name || "").trim().toLowerCase() === target) return e;
    }
    return null;
  }

  function getSchemaFor(type) {
    if (!window.AwbElementForm) return [];
    return window.AwbElementForm.getSchema(type) || [];
  }

  function isEmptyVal(val) {
    return val === undefined || val === null || val === "" || (typeof val === "boolean" && val === false);
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

  function chipRow(names, clickable, fieldKey, elemType) {
    var row = document.createElement("div");
    row.className = "elem-chip-row";
    (names || []).forEach(function (item) {
      // item bisa string (legacy) atau object {id, name, type}
      var name = (item && item.name) ? item.name : item;
      var id = (item && item.id) ? item.id : "";
      var type = (item && item.type) ? item.type : "";
      if (clickable) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "elem-linked-chip";
        btn.textContent = name;
        btn.dataset.linkedId = id;
        btn.dataset.linkedName = name;
        btn.dataset.linkedType = type;
        btn.addEventListener("click", function () {
          navigateToLinked(fieldKey, name, elemType);
        });
        row.appendChild(btn);
      } else {
        var chip = document.createElement("span");
        chip.className = "elem-chip";
        chip.textContent = name;
        row.appendChild(chip);
      }
    });
    return row;
  }

  function collectSchemaLinkedKeys(schema) {
    var keys = {};
    schema.forEach(function (group) {
      (group.fields || []).forEach(function (f) {
        if (f.kind === "linked") keys[f.key] = true;
      });
    });
    return keys;
  }

  function renderInto(elem) {
    var panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    var data = elem.data || {};
    var fields = data.fields || {};
    var extra = data.extraFields || {};
    var linked = data.linkedElements || {};
    var lists = data.lists || {};
    var imgUrl = data.imageUrl || data.image || "";
    var type = elem._type;
    var schema = getSchemaFor(type);

    var thumb = imgUrl
      ? '<img src="' + esc(imgUrl) + '" alt="" loading="lazy" data-detail-thumb-img>'
      : '<span class="elem-detail-thumb-fallback"><iconify-icon icon="lucide:image" width="16"></iconify-icon></span>';
    panel.querySelector(".elem-detail-thumb").innerHTML = thumb;
    panel.querySelector(".elem-detail-name").textContent = elem.name || "(tanpa nama)";
    panel.querySelector(".elem-detail-sub").textContent = type ? "Tipe: " + type : "";

    var descEl = panel.querySelector("[data-detail-desc]");
    if (descEl) {
      var desc = data.description && String(data.description).trim();
      descEl.textContent = desc || "Belum ada deskripsi.";
    }

    var host = panel.querySelector("[data-detail-sections]");
    if (!host) return;
    host.innerHTML = "";

    var usedLinked = collectSchemaLinkedKeys(schema);

    schema.forEach(function (group) {
      var built = makeSection(group.title || "Informasi");
      var filled = false;
      (group.fields || []).forEach(function (f) {
        if (f.kind === "linked") {
          var chips = linked[f.key] || [];
          if (!chips.length) return;
          filled = true;
          appendCard(built.body, f.label || f.key, chipRow(chips, true, f.key, type));
          return;
        }
        if (f.kind === "list") return;
        var val = fields[f.key];
        if (isEmptyVal(val)) return;
        filled = true;
        appendCard(built.body, f.label || f.key, formatByKind(f.kind, val), true);
      });
      if (filled) host.appendChild(built.sec);
    });

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

    Object.keys(linked).forEach(function (k) {
      if (usedLinked[k]) return;
      var chips = linked[k] || [];
      if (!chips.length) return;
      var lsec = makeSection(k);
      appendCard(lsec.body, k, chipRow(chips, true, k, type));
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

    var hasTags = Array.isArray(data.tags) && data.tags.length;
    var hasNotes = data.notes && String(data.notes).trim();
    if (hasTags || hasNotes) {
      var catatan = makeSection("Catatan");
      if (hasTags) appendCard(catatan.body, "Tag", chipRow(data.tags, false));
      if (hasNotes) appendCard(catatan.body, "Catatan", data.notes, false);
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

  function resolveLinkedType(elemType, fieldKey) {
    var schema = getSchemaFor(elemType);
    for (var i = 0; i < schema.length; i++) {
      var flds = schema[i].fields || [];
      for (var j = 0; j < flds.length; j++) {
        if (flds[j].key === fieldKey && flds[j].kind === "linked") {
          return flds[j].linkedType || fieldKey;
        }
      }
    }
    return fieldKey;
  }

  function navigateToLinked(fieldKey, name, fromElemType) {
    var targetType = resolveLinkedType(fromElemType || currentType, fieldKey);
    var target = findByTypeAndName(targetType, name);
    if (target) open(target);
  }

  function open(elem) {
    if (!elem || !elem.id) return;
    currentId = elem.id;
    currentType = elem._type || elem.type;
    var panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    renderInto(elem);
    var body = panel.querySelector(".elem-detail-body");
    if (body) body.scrollTop = 0;
  }

  function close() {
    var panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    currentId = null;
    currentType = null;
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
        if (currentId && currentType && typeof window.openElementForm === "function") {
          window.openElementForm(currentType, currentId);
        }
        return;
      }
      if (e.target.closest("[data-detail-delete]")) {
        if (currentId && typeof window.deleteElement === "function") {
          window.deleteElement(currentId);
        }
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) close();
    });
  }

  window._elemDetailPanel = {
    open: open,
    close: close,
    isOpen: isOpen,
    init: init,
    get currentId() { return currentId; },
    get currentType() { return currentType; }
  };
})();
