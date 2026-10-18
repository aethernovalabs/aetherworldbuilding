/* awb-linked.js — Komponen LinkedInput untuk menghubungkan entitas lintas tabel.
 *
 * Dipakai halaman karakter & element-dunia.
 * Bergantung pada window.AetherPageQuery (objek query dengan getElements/addElement)
 * yang diset oleh halaman setelah AetherPageUtils.initPage().
 *
 * API:
 *   var inst = AwbLinked.create(wrapEl, { type: 'Spesies', onChange: fn });
 *   inst.getItems()   → [{id,name,type}]
 *   inst.setItems(arr)
 *   inst.setType(t)
 *   inst.refresh()    → Promise (muat ulang cache element tipe ini)
 *
 * Perilaku:
 *  - Mengetik memunculkan dropdown saran dari element bertipe sama.
 *  - Opsi "+ Buat '<nama>'" muncul jika nama belum ada; klik/Enter → buat element baru.
 *  - Enter dengan nama yang sudah ada → langsung linked.
 *  - Item terpilih berupa chip [Nama ×].
 */
(function () {
  "use strict";

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function getQuery() {
    return window.AetherPageQuery || window.karakterQuery || window.elementDuniaQuery || null;
  }

  function create(wrapEl, opts) {
    opts = opts || {};
    var type = opts.type || "Spesies";
    var onChange = opts.onChange || function () {};
    var items = [];
    var cache = [];
    var debounceTimer = null;

    if (!wrapEl) return null;

    wrapEl.innerHTML =
      '<div class="linked-input-row">' +
        '<input type="text" class="form-input" placeholder="Ketik lalu Enter untuk tambah...">' +
      '</div>' +
      '<div class="linked-dropdown"></div>' +
      '<div class="linked-chips"></div>';

    var input = wrapEl.querySelector("input");
    var dropdown = wrapEl.querySelector(".linked-dropdown");
    var chips = wrapEl.querySelector(".linked-chips");

    function refreshCache() {
      var q = getQuery();
      if (!q || typeof q.getElements !== "function") {
        cache = [];
        return Promise.resolve(cache);
      }
      return q.getElements(type).then(function (els) {
        cache = (els || []).map(function (e) {
          return { id: e.id, name: e.name, type: e.type };
        });
        return cache;
      }).catch(function () {
        cache = [];
        return cache;
      });
    }

    function renderChips() {
      chips.innerHTML = "";
      items.forEach(function (it, idx) {
        var chip = document.createElement("span");
        chip.className = "linked-chip";
        chip.innerHTML = escapeHtml(it.name) + ' <button type="button" title="Hapus linked">&times;</button>';
        chip.querySelector("button").addEventListener("click", function () {
          items.splice(idx, 1);
          renderChips();
          onChange(items.slice());
        });
        chips.appendChild(chip);
      });
    }

    function addItem(item) {
      var exists = items.some(function (i) {
        return (item.id && i.id === item.id) || String(i.name).toLowerCase() === String(item.name).toLowerCase();
      });
      if (exists) return;
      items.push(item);
      renderChips();
      onChange(items.slice());
    }

    function createElementByName(name) {
      var q = getQuery();
      if (!q || typeof q.addElement !== "function") return Promise.resolve(null);
      return q.addElement({ name: name, type: type, data: {} }).then(function (created) {
        if (created) {
          addItem({ id: created.id, name: created.name, type: created.type });
        }
        return refreshCache();
      });
    }

    function renderDropdown(query) {
      var q = (query || "").toLowerCase().trim();
      var usedIds = items.map(function (i) { return i.id; });
      var filtered = cache.filter(function (e) {
        return usedIds.indexOf(e.id) === -1 && e.name.toLowerCase().indexOf(q) !== -1;
      }).slice(0, 8);

      dropdown.innerHTML = "";
      filtered.forEach(function (e) {
        var opt = document.createElement("div");
        opt.className = "linked-opt";
        opt.innerHTML = '<span>' + escapeHtml(e.name) + '</span><span class="linked-opt-type">' + escapeHtml(e.type) + '</span>';
        opt.addEventListener("mousedown", function (ev) {
          ev.preventDefault();
          addItem({ id: e.id, name: e.name, type: e.type });
          input.value = "";
          closeDropdown();
        });
        dropdown.appendChild(opt);
      });

      var exactExists = cache.some(function (e) { return e.name.toLowerCase() === q; });
      if (q && !exactExists) {
        var createOpt = document.createElement("div");
        createOpt.className = "linked-opt create";
        createOpt.innerHTML = '<span>+ Buat "' + escapeHtml(input.value.trim()) + '"</span><span class="linked-opt-type">' + escapeHtml(type) + '</span>';
        createOpt.addEventListener("mousedown", function (ev) {
          ev.preventDefault();
          var name = input.value.trim();
          if (!name) return;
          createElementByName(name).then(function () {
            input.value = "";
            closeDropdown();
          });
        });
        dropdown.appendChild(createOpt);
      }

      if (dropdown.children.length) dropdown.classList.add("open");
      else dropdown.classList.remove("open");
    }

    function closeDropdown() { dropdown.classList.remove("open"); }

    input.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        refreshCache().then(function () { renderDropdown(input.value); });
      }, 200);
    });

    input.addEventListener("focus", function () {
      refreshCache().then(function () { renderDropdown(input.value); });
    });

    input.addEventListener("blur", function () {
      setTimeout(closeDropdown, 150);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        var name = input.value.trim();
        if (!name) return;
        var found = cache.find(function (x) { return x.name.toLowerCase() === name.toLowerCase(); });
        if (found) {
          addItem({ id: found.id, name: found.name, type: found.type });
          input.value = "";
          closeDropdown();
          return;
        }
        createElementByName(name).then(function () {
          input.value = "";
          closeDropdown();
        });
      } else if (e.key === "Escape") {
        closeDropdown();
      }
    });

    return {
      getItems: function () { return items.slice(); },
      setItems: function (arr) { items = (arr || []).slice(); renderChips(); },
      setType: function (t) { type = t; return refreshCache(); },
      getType: function () { return type; },
      refresh: refreshCache,
      _input: input
    };
  }

  window.AwbLinked = { create: create, escapeHtml: escapeHtml };
})();
