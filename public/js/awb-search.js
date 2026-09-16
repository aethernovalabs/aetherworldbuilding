(function () {
  "use strict";
  var PAGES = [
    { slug: "dashboard", label: "Dashboard", icon: "lucide:layout-dashboard" },
    { slug: "dokumen", label: "Dokumen", icon: "lucide:book-open" },
    { slug: "karakter", label: "Karakter", icon: "lucide:users" },
    { slug: "element-dunia", label: "Element Dunia", icon: "lucide:gem" },
    { slug: "linimasa", label: "Linimasa", icon: "lucide:calendar-range" },
    { slug: "graph", label: "Graph", icon: "lucide:network" },
    { slug: "peta-denah", label: "Peta", icon: "lucide:map" }
  ];
  var PENDING_KEY = "awb_search_pending";
  var cache = {};
  var fetching = {};
  var activeIdx = -1;

  function slugNow() {
    var m = window.location.pathname.match(/([^\/]+?)(?:\.page\.html)?\/?$/);
    var s = (m && m[1]) || "";
    if (s === "" || s === "/") return "dashboard";
    return s;
  }
  function norm(s) { return (s || "").toLowerCase(); }
  function txt(el) { return ((el && el.textContent) || "").replace(/\s+/g, " ").trim(); }
  function firstText(el) {
    if (!el) return "";
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.textContent.trim()) return n.textContent.trim();
    }
    return txt(el);
  }
  function item(type, icon, title, sub, page, el, url) {
    if (!title) return null;
    return { type: type, icon: icon, title: title, sub: (sub || "").slice(0, 140), page: page.slug, pageLabel: page.label, el: el || null, url: url || ("/" + page.slug + ".page.html") };
  }
  function by(slug) { for (var i = 0; i < PAGES.length; i++) if (PAGES[i].slug === slug) return PAGES[i]; return { slug: slug, label: slug, icon: "lucide:file" }; }

  var H = {
    dokumen: function (root, live) {
      var out = [], page = by("dokumen");
      root.querySelectorAll(".doc-top-title").forEach(function (el) { out.push(item("Judul Dokumen", "lucide:book-open", txt(el), "", page, live ? el : null)); });
      root.querySelectorAll(".pg-card").forEach(function (el) {
        if (el.classList.contains("empty-col")) return;
        var t = txt(el).slice(0, 80);
        if (!t || t.indexOf("Tambah") === 0 || t.indexOf("Hubungkan") !== -1) return;
        var kind = el.classList.contains("bab-col") ? "Bab" : "Catatan";
        out.push(item(kind, kind === "Bab" ? "lucide:bookmark" : "lucide:notebook-pen", t.split("isi catatan")[0].trim(), t, page, live ? el : null));
      });
      return out.filter(Boolean);
    },
    karakter: function (root, live) {
      var out = [], page = by("karakter");
      root.querySelectorAll(".char-card").forEach(function (el) {
        var n = el.querySelector(".char-name");
        var name = n ? firstText(n) : "";
        if (!name || name === "Name") return;
        var meta = Array.prototype.map.call(el.querySelectorAll(".char-meta"), txt).join(" · ");
        out.push(item("Karakter", "lucide:user", name, meta, page, live ? el : null));
      });
      root.querySelectorAll("#char-table tbody tr").forEach(function (el) {
        var c = el.querySelector("td");
        var name = c ? txt(c) : "";
        if (!name) return;
        out.push(item("Karakter", "lucide:user", name, "tabel", page, live ? el : null));
      });
      return out.filter(Boolean);
    },
    "element-dunia": function (root, live) {
      var out = [], page = by("element-dunia");
      root.querySelectorAll(".elem-card").forEach(function (el) {
        var n = el.querySelector(".elem-card-name");
        var name = n ? firstText(n) : "";
        if (!name) return;
        var tp = el.querySelector(".elem-card-type");
        var ds = el.querySelector(".elem-card-desc");
        out.push(item(tp ? txt(tp) : "Element", "lucide:gem", name, ds ? txt(ds) : "", page, live ? el : null));
      });
      return out.filter(Boolean);
    },
    linimasa: function (root, live) {
      var out = [], page = by("linimasa");
      root.querySelectorAll(".event-card").forEach(function (el) {
        var n = el.querySelector(".event-name");
        var d = el.querySelector(".event-date");
        var ds = el.querySelector(".event-desc");
        if (!n || !txt(n)) return;
        out.push(item("Peristiwa", "lucide:calendar-range", txt(n), (d ? txt(d) + " · " : "") + (ds ? txt(ds) : ""), page, live ? el : null));
      });
      return out.filter(Boolean);
    },
    graph: function (root, live) {
      var out = [], page = by("graph");
      root.querySelectorAll(".net-node").forEach(function (el) {
        var t = txt(el);
        if (!t) return;
        out.push(item("Node", "lucide:circle-dot", t.slice(0, 60), "", page, live ? el : null));
      });
      root.querySelectorAll(".rel-card").forEach(function (el) {
        var tp = el.querySelector(".rel-card-type");
        var names = Array.prototype.map.call(el.querySelectorAll(".rel-name"), txt).join(" ↔ ");
        out.push(item(tp ? txt(tp) : "Hubungan", "lucide:heart-handshake", names || "Hubungan", txt(el.querySelector(".rel-desc")), page, live ? el : null));
      });
      return out.filter(Boolean);
    },
    "peta-denah": function (root, live) {
      var out = [], page = by("peta-denah");
      root.querySelectorAll(".map-marker").forEach(function (el) {
        var lb = el.querySelector(".map-marker-label");
        var name = lb ? txt(lb) : el.getAttribute("title");
        if (!name) return;
        out.push(item("Lokasi", "lucide:map-pin", name, el.getAttribute("title") || "", page, live ? el : null));
      });
      return out.filter(Boolean);
    },
    dashboard: function (root, live) {
      var out = [], page = by("dashboard");
      var t = root.querySelector("#world-title");
      if (t && txt(t)) out.push(item("Dunia", "lucide:globe", txt(t), "", page, live ? t : null));
      return out.filter(Boolean);
    }
  };

  function harvestLive() {
    var out = [];
    var slug = slugNow();
    Object.keys(H).forEach(function (k) {
      if (k !== slug) return;
      try { out = out.concat(H[k](document, true)); } catch (e) {}
    });
    var seen = {};
    return out.filter(function (it) {
      var key = it.page + "|" + it.title;
      if (seen[key]) return false;
      seen[key] = 1;
      return true;
    });
  }
  function harvestDoc(slug, doc) {
    try { return H[slug] ? H[slug](doc, false) : []; } catch (e) { return []; }
  }
  function ensureOthers(q, rerender) {
    PAGES.forEach(function (p) {
      if (p.slug === slugNow() || cache[p.slug] || fetching[p.slug]) return;
      fetching[p.slug] = true;
      fetch("/" + p.slug + ".page.html", { credentials: "same-origin" }).then(function (r) {
        if (!r.ok) throw 0;
        return r.text();
      }).then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        cache[p.slug] = harvestDoc(p.slug, doc);
        if (norm(input().value).length >= 2) rerender();
      }).catch(function () { cache[p.slug] = []; }).finally(function () { fetching[p.slug] = false; });
    });
  }

  function overlay() { return document.getElementById("gs-overlay"); }
  function input() { return document.getElementById("gs-input"); }
  function results() { return document.getElementById("gs-results"); }

  function build() {
    if (overlay()) return;
    var ov = document.createElement("div");
    ov.className = "gs-overlay";
    ov.id = "gs-overlay";
    ov.innerHTML = '<div class="gs-panel" role="dialog" aria-label="Pencarian global">'
      + '<div class="gs-input-row"><iconify-icon icon="lucide:search" width="17"></iconify-icon>'
      + '<input id="gs-input" type="text" placeholder="Cari dokumen, bab, karakter, element, peristiwa, lokasi…" autocomplete="off">'
      + '<kbd>ESC</kbd></div>'
      + '<div class="gs-results" id="gs-results"></div>'
      + '<div class="gs-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigasi</span><span><kbd>↵</kbd> buka</span><span><kbd>Ctrl K</kbd> cari</span></div>'
      + '</div>';
    document.body.appendChild(ov);
    ov.addEventListener("mousedown", function (e) { if (e.target === ov) close(); });
    input().addEventListener("input", function () { activeIdx = -1; render(); });
    input().addEventListener("keydown", function (e) {
      var items = results().querySelectorAll(".gs-item");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        activeIdx = e.key === "ArrowDown" ? Math.min(items.length - 1, activeIdx + 1) : Math.max(0, activeIdx - 1);
        items.forEach(function (el, i) { el.classList.toggle("active", i === activeIdx); });
        if (items[activeIdx]) items[activeIdx].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        var t = items[activeIdx >= 0 ? activeIdx : 0];
        if (t) t.click();
      }
    });
  }
  function open(q) {
    build();
    overlay().classList.add("open");
    document.body.style.overflow = "hidden";
    input().value = q || "";
    activeIdx = -1;
    setTimeout(function () { input().focus(); input().select(); }, 30);
    render();
  }
  function close() {
    var ov = overlay();
    if (ov) ov.classList.remove("open");
    document.body.style.overflow = "";
  }
  function score(it, q) {
    var t = norm(it.title), s = norm(it.sub), ty = norm(it.type);
    if (t.indexOf(q) === 0) return 0;
    if (t.indexOf(q) !== -1) return 1;
    if (ty.indexOf(q) !== -1) return 2;
    if (s.indexOf(q) !== -1) return 3;
    return 9;
  }
  function render() {
    var q = norm(input().value.trim());
    var box = results();
    if (q.length < 2) {
      box.innerHTML = '<div class="gs-empty">Ketik minimal 2 huruf untuk mencari di semua halaman.</div>';
      return;
    }
    var all = harvestLive();
    PAGES.forEach(function (p) { if (cache[p.slug]) all = all.concat(cache[p.slug]); });
    ensureOthers(q, render);
    var hits = all.map(function (it) { return { it: it, sc: score(it, q) }; })
      .filter(function (r) { return r.sc < 9; })
      .sort(function (a, b) { return a.sc - b.sc || a.it.title.localeCompare(b.it.title); })
      .slice(0, 60);
    var pagesHit = PAGES.filter(function (p) { return norm(p.label).indexOf(q) !== -1; });
    var html = "";
    if (pagesHit.length) {
      html += '<div class="gs-group"><div class="gs-group-t">Halaman</div>' + pagesHit.map(function (p, i) {
        return '<div class="gs-item" data-g="page" data-s="' + i + '"><iconify-icon icon="' + p.icon + '" width="15"></iconify-icon><span class="gs-t">Buka ' + p.label + '</span><span class="gs-page">' + p.label + '</span></div>';
      }).join("") + "</div>";
    }
    var groups = {};
    hits.forEach(function (r) {
      var k = r.it.pageLabel + " · " + r.it.type;
      (groups[k] = groups[k] || []).push(r.it);
    });
    Object.keys(groups).forEach(function (k) {
      html += '<div class="gs-group"><div class="gs-group-t">' + k + "</div>" + groups[k].map(function (it) {
        var idx = all.indexOf(it);
        return '<div class="gs-item" data-g="hit" data-s="' + idx + '"><iconify-icon icon="' + it.icon + '" width="15"></iconify-icon>'
          + '<span class="gs-t">' + escapeHtml(it.title) + (it.sub ? '<small>' + escapeHtml(it.sub) + "</small>" : "") + '</span>'
          + '<span class="gs-page">' + it.pageLabel + "</span></div>";
      }).join("") + "</div>";
    });
    if (!html) html = '<div class="gs-empty">Tidak ada hasil untuk "' + escapeHtml(input().value.trim()) + '".</div>';
    box.innerHTML = html;
    box._all = all;
    box._pages = pagesHit;
    box.querySelectorAll(".gs-item").forEach(function (el) {
      el.addEventListener("click", function () {
        if (el.dataset.g === "page") {
          var p = box._pages[parseInt(el.dataset.s, 10)];
          goPage(p.slug, q);
        } else {
          var it = box._all[parseInt(el.dataset.s, 10)];
          select(it, q);
        }
      });
      el.addEventListener("mousemove", function () {
        box.querySelectorAll(".gs-item").forEach(function (x) { x.classList.remove("active"); });
        el.classList.add("active");
      });
    });
    activeIdx = -1;
  }
  function escapeHtml(s) { return (s || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function goPage(slug, q) {
    if (slug === slugNow()) { close(); return; }
    try { sessionStorage.setItem(PENDING_KEY, q); } catch (e) {}
    window.location.href = "/" + slug + ".page.html";
  }
  function select(it, q) {
    if (!it) return;
    if (it.el && document.contains(it.el)) {
      close();
      it.el.scrollIntoView({ behavior: "smooth", block: "center" });
      var o = it.el.style.outline;
      it.el.style.outline = "2px solid #8b5cf6";
      it.el.style.outlineOffset = "2px";
      setTimeout(function () { it.el.style.outline = o; it.el.style.outlineOffset = ""; }, 1800);
    } else {
      goPage(it.page, q);
    }
  }
  function init() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a.awb-nav-link[title="Pencarian"]');
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();
      open("");
    }, true);
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && norm(e.key) === "k") { e.preventDefault(); overlay() && overlay().classList.contains("open") ? close() : open(""); return; }
      if (e.key === "Escape" && overlay() && overlay().classList.contains("open")) close();
    });
    try {
      var pending = sessionStorage.getItem(PENDING_KEY);
      if (pending) {
        sessionStorage.removeItem(PENDING_KEY);
        setTimeout(function () { open(pending); }, 350);
      }
    } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
