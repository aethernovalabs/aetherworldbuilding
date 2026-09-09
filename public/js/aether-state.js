/* aether-state.js — State bersama untuk Aether Nova.
 *
 * Penyimpanan memakai IndexedDB melalui Dexie.js:
 *   - tabel `projects` → projeck world building
 *   - tabel `state`    → data halaman yang terakhir dibuka (`lastPage`)
 *
 * Penggunaan di halaman:
 *   AetherState.trackCurrentPage()  → rekam halaman yang sekarang dibuka
 *   AetherState.getLastPage()       → path halaman terakhir (atau null)
 *   AetherState.getProjects()       → daftar projeck
 *   AetherState.addProject(p)       → tambah projeck
 *   AetherState.projectExists(name) → cek projeck berdasarkan nama
 */
(function () {
  "use strict";

  var DB_NAME = "aethernova";
  var LAST_PAGE_KEY = "lastPage";
  var ALLOWED_SLUGS = [
    "buat-projeck", "dashboard", "dokumen", "element-dunia",
    "hubungan", "jaringan", "karakter", "linimasa", "peta-denah",
  ];

  function normalizePath(pathname) {
    var clean = pathname.replace(/\.page\.html$/i, "");
    clean = clean.replace(/\/+$/, "");
    return clean || "/";
  }

  var db = null;
  try {
    db = new Dexie(DB_NAME);
    db.version(1).stores({
      projects: "++id, name, desc, createdAt",
      state: "key",
    });
  } catch (err) {
    // Dexie belum terload (mis. offline) — semua operasi jadi no-op.
  }

  var AetherState = {
    get available() {
      return db !== null;
    },

    // Rekam halaman yang sekarang dibuka sebagai "halaman terakhir".
    trackCurrentPage: function () {
      if (!db) return Promise.resolve();
      try {
        var path = normalizePath(window.location.pathname);
        var slug = path.replace(/^\//, "");
        if (path === "/" || ALLOWED_SLUGS.indexOf(slug) === -1) return Promise.resolve();
        return db.state.put({ key: LAST_PAGE_KEY, value: path + window.location.search });
      } catch (err) {
        return Promise.resolve();
      }
    },

    // Ambil path halaman terakhir yang dibuka (null bila belum pernah).
    getLastPage: function () {
      if (!db) return Promise.resolve(null);
      return db.state.get(LAST_PAGE_KEY).then(function (row) {
        if (!row || typeof row.value !== "string") return null;
        var base = window.location.origin || (window.location.protocol + "//" + window.location.host);
        var parsed = new URL(row.value, base);
        var slug = normalizePath(parsed.pathname).replace(/^\//, "");
        if (ALLOWED_SLUGS.indexOf(slug) === -1) return null;
        return normalizePath(parsed.pathname) + parsed.search;
      }).catch(function () {
        return null;
      });
    },

    getProjects: function () {
      if (!db) return Promise.resolve([]);
      return db.projects.orderBy("createdAt").toArray().catch(function () {
        return [];
      });
    },

    addProject: function (project) {
      if (!db) return Promise.resolve(null);
      return db.projects.add(project);
    },

    projectExists: function (name) {
      if (!db) return Promise.resolve(false);
      return db.projects.where("name").equals(name).count().then(function (n) {
        return n > 0;
      }).catch(function () {
        return false;
      });
    },
  };

  window.AetherState = AetherState;
})();