/* aether-state.js — State bersama untuk Aether Nova.
 *
 * Penyimpanan memakai IndexedDB melalui Dexie.js:
 *   - tabel `projects`     → proyek world building
 *   - tabel `characters`   → karakter
 *   - tabel `elements`     → elemen dunia (lokasi, makhluk, faksi, dll)
 *   - tabel `events`       → peristiwa/linimasa
 *   - tabel `maps`         → data peta visual
 *   - tabel `documents`    → dokumen/bab
 *   - tabel `activityLog`  → log aktivitas
 *   - tabel `state`        → data halaman yang terakhir dibuka (`lastPage`)
 *
 * Penggunaan di halaman:
 *   AetherState.trackCurrentPage()     → rekam halaman yang sekarang dibuka
 *   AetherState.getLastPage()          → path halaman terakhir (atau null)
 *   AetherState.getProjects()          → daftar proyek
 *   AetherState.addProject(p)          → tambah proyek
 *   AetherState.updateProject(p)       → update proyek
 *   AetherState.deleteProject(id)      → hapus proyek
 *   AetherState.getProject(id)         → ambil proyek by id
 *   AetherState.getActiveProject()     → proyek aktif dari URL/localStorage
 *   AetherState.setActiveProject(name) → set proyek aktif
 *   CRUD untuk characters, elements, events, maps, documents
 *   AetherState.getRecentActivity()    → aktivitas terbaru
 *   AetherState.getStats()             → statistik proyek
 *   AetherState.exportProject()        → export data proyek
 *   AetherState.importProject()        → import data proyek
 */
(function () {
  "use strict";

  var DB_NAME = "aethernova";
  var LAST_PAGE_KEY = "lastPage";
  var ACTIVE_PROJECT_KEY = "awb_active_project";
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
    // v1 historis: documents diindeks pada `title`.
    // v2: documents diindeks pada `name` agar konsisten dengan CRUD runtime.
    db.version(1).stores({
      projects: "++id, name, desc, createdAt, lastUpdated",
      characters: "++id, projectId, name, lastUpdated",
      elements: "++id, projectId, name, type, lastUpdated",
      events: "++id, projectId, name, lastUpdated",
      maps: "++id, projectId, name, lastUpdated",
      documents: "++id, projectId, title, lastUpdated",
      activityLog: "++id, projectId, entityType, entityId, timestamp",
      state: "key",
    });
    db.version(2).stores({
      projects: "++id, name, desc, createdAt, lastUpdated",
      characters: "++id, projectId, name, lastUpdated",
      elements: "++id, projectId, name, type, lastUpdated",
      events: "++id, projectId, name, lastUpdated",
      maps: "++id, projectId, name, lastUpdated",
      documents: "++id, projectId, name, lastUpdated",
      activityLog: "++id, projectId, entityType, entityId, timestamp",
      state: "key",
    });
  } catch (err) {
    // Dexie belum terload (mis. offline) — semua operasi jadi no-op.
    console.warn("Dexie init failed:", err);
  }

  function getProjectId() {
    // Ambil projectId dari URL parameter atau localStorage
    var params = new URLSearchParams(window.location.search);
    var worldParam = params.get("world");
    if (worldParam) {
      // Need to resolve name to ID
      return null; // Will be resolved async
    }
    var saved = localStorage.getItem(ACTIVE_PROJECT_KEY);
    return saved ? parseInt(saved, 10) : null;
  }

  var AetherState = {
    get available() {
      return db !== null;
    },

    // ===== Project Management =====
    getProjects: function () {
      if (!db) return Promise.resolve([]);
      return db.projects.toArray().then(function (list) {
        // Urutkan manual: pakai `order` bila ada, lalu fallback createdAt.
        return list.sort(function (a, b) {
          var oa = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
          var ob = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
          if (oa !== ob) return oa - ob;
          return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
        });
      }).catch(function () {
        return [];
      });
    },

    addProject: function (project) {
      if (!db) return Promise.resolve(null);
      var now = new Date().toISOString();
      return db.projects.toArray().then(function (list) {
        var maxOrder = -1;
        list.forEach(function (p) {
          if (typeof p.order === "number" && p.order > maxOrder) maxOrder = p.order;
        });
        var data = {
          name: project.name,
          desc: project.desc || "",
          order: project.order != null ? project.order : maxOrder + 1,
          createdAt: project.createdAt || now,
          lastUpdated: now,
        };
        return db.projects.add(data).then(function (id) {
          return db.projects.get(id);
        });
      });
    },

    updateProject: function (id, updates) {
      if (!db) return Promise.resolve(null);
      var data = Object.assign({}, updates, { lastUpdated: new Date().toISOString() });
      return db.projects.update(id, data).then(function () {
        return db.projects.get(id);
      });
    },

    // Simpan urutan baru. `orderedIds` = array id sesuai urutan tampil.
    reorderProjects: function (orderedIds) {
      if (!db) return Promise.resolve();
      return db.transaction("rw", db.projects, function () {
        return Promise.all(orderedIds.map(function (id, idx) {
          return db.projects.update(id, { order: idx });
        }));
      });
    },

    deleteProject: function (id) {
      if (!db) return Promise.resolve();
      return db.transaction("rw", [db.projects, db.characters, db.elements, db.events, db.maps, db.documents, db.activityLog], function () {
        return Promise.all([
          db.projects.delete(id),
          db.characters.where("projectId").equals(id).delete(),
          db.elements.where("projectId").equals(id).delete(),
          db.events.where("projectId").equals(id).delete(),
          db.maps.where("projectId").equals(id).delete(),
          db.documents.where("projectId").equals(id).delete(),
          db.activityLog.where("projectId").equals(id).delete(),
        ]);
      });
    },

    getProject: function (id) {
      if (!db) return Promise.resolve(null);
      return db.projects.get(id);
    },

    getProjectByName: function (name) {
      if (!db) return Promise.resolve(null);
      return db.projects.where("name").equals(name).first();
    },

    projectExists: function (name) {
      if (!db) return Promise.resolve(false);
      return db.projects.where("name").equals(name).count().then(function (n) {
        return n > 0;
      }).catch(function () {
        return false;
      });
    },

    // ===== Active Project =====
    getActiveProject: function () {
      var self = this;
      if (!db) return Promise.resolve(null);

      var params = new URLSearchParams(window.location.search);
      var worldParam = params.get("world");
      if (worldParam) {
        return self.getProjectByName(worldParam);
      }

      var savedId = localStorage.getItem(ACTIVE_PROJECT_KEY);
      if (savedId) {
        return db.projects.get(parseInt(savedId, 10));
      }

      // Fallback: first project
      return db.projects.orderBy("createdAt").first();
    },

    setActiveProject: function (project) {
      if (!project || !project.id) return Promise.resolve();
      localStorage.setItem(ACTIVE_PROJECT_KEY, String(project.id));
      // Update URL without reload
      var url = new URL(window.location.href);
      url.searchParams.set("world", project.name);
      window.history.replaceState({}, "", url);
      return Promise.resolve(project);
    },

    // ===== Characters =====
    getCharacters: function (projectId) {
      if (!db) return Promise.resolve([]);
      return db.characters.where("projectId").equals(projectId).toArray();
    },

    getCharacter: function (id) {
      if (!db) return Promise.resolve(null);
      return db.characters.get(id);
    },

    addCharacter: function (projectId, character) {
      if (!db) return Promise.resolve(null);
      var now = new Date().toISOString();
      var data = Object.assign({}, character, { projectId: projectId, lastUpdated: now });
      return db.characters.add(data).then(function (id) {
        return db.characters.get(id);
      });
    },

    updateCharacter: function (id, updates) {
      if (!db) return Promise.resolve(null);
      var data = Object.assign({}, updates, { lastUpdated: new Date().toISOString() });
      return db.characters.update(id, data).then(function () {
        return db.characters.get(id);
      });
    },

    deleteCharacter: function (id) {
      if (!db) return Promise.resolve();
      return db.characters.delete(id);
    },

    // ===== Elements =====
    getElements: function (projectId, type) {
      if (!db) return Promise.resolve([]);
      var query = db.elements.where("projectId").equals(projectId);
      if (type) {
        query = query.and(function (e) { return e.type === type; });
      }
      return query.toArray();
    },

    getElement: function (id) {
      if (!db) return Promise.resolve(null);
      return db.elements.get(id);
    },

    addElement: function (projectId, element) {
      if (!db) return Promise.resolve(null);
      var now = new Date().toISOString();
      var data = Object.assign({}, element, { projectId: projectId, lastUpdated: now });
      return db.elements.add(data).then(function (id) {
        return db.elements.get(id);
      });
    },

    updateElement: function (id, updates) {
      if (!db) return Promise.resolve(null);
      var data = Object.assign({}, updates, { lastUpdated: new Date().toISOString() });
      return db.elements.update(id, data).then(function () {
        return db.elements.get(id);
      });
    },

    deleteElement: function (id) {
      if (!db) return Promise.resolve();
      return db.elements.delete(id);
    },

    // ===== Events/Timeline =====
    getEvents: function (projectId) {
      if (!db) return Promise.resolve([]);
      return db.events.where("projectId").equals(projectId).toArray();
    },

    getEvent: function (id) {
      if (!db) return Promise.resolve(null);
      return db.events.get(id);
    },

    addEvent: function (projectId, event) {
      if (!db) return Promise.resolve(null);
      var now = new Date().toISOString();
      var data = Object.assign({}, event, { projectId: projectId, lastUpdated: now });
      return db.events.add(data).then(function (id) {
        return db.events.get(id);
      });
    },

    updateEvent: function (id, updates) {
      if (!db) return Promise.resolve(null);
      var data = Object.assign({}, updates, { lastUpdated: new Date().toISOString() });
      return db.events.update(id, data).then(function () {
        return db.events.get(id);
      });
    },

    deleteEvent: function (id) {
      if (!db) return Promise.resolve();
      return db.events.delete(id);
    },

    // ===== Maps =====
    getMaps: function (projectId) {
      if (!db) return Promise.resolve([]);
      return db.maps.where("projectId").equals(projectId).toArray();
    },

    getMap: function (id) {
      if (!db) return Promise.resolve(null);
      return db.maps.get(id);
    },

    addMap: function (projectId, map) {
      if (!db) return Promise.resolve(null);
      var now = new Date().toISOString();
      var data = Object.assign({}, map, { projectId: projectId, lastUpdated: now });
      return db.maps.add(data).then(function (id) {
        return db.maps.get(id);
      });
    },

    updateMap: function (id, updates) {
      if (!db) return Promise.resolve(null);
      var data = Object.assign({}, updates, { lastUpdated: new Date().toISOString() });
      return db.maps.update(id, data).then(function () {
        return db.maps.get(id);
      });
    },

    deleteMap: function (id) {
      if (!db) return Promise.resolve();
      return db.maps.delete(id);
    },

    // ===== Documents =====
    getDocuments: function (projectId) {
      if (!db) return Promise.resolve([]);
      return db.documents.where("projectId").equals(projectId).toArray();
    },

    getDocument: function (id) {
      if (!db) return Promise.resolve(null);
      return db.documents.get(id);
    },

    addDocument: function (projectId, doc) {
      if (!db) return Promise.resolve(null);
      var now = new Date().toISOString();
      var data = Object.assign({}, doc, { projectId: projectId, lastUpdated: now });
      return db.documents.add(data).then(function (id) {
        return db.documents.get(id);
      });
    },

    updateDocument: function (id, updates) {
      if (!db) return Promise.resolve(null);
      var data = Object.assign({}, updates, { lastUpdated: new Date().toISOString() });
      return db.documents.update(id, data).then(function () {
        return db.documents.get(id);
      });
    },

    deleteDocument: function (id) {
      if (!db) return Promise.resolve();
      return db.documents.delete(id);
    },

    // ===== Activity Log =====
    logActivity: function (projectId, action, entityType, entityId, entityName, details) {
      if (!db) return Promise.resolve();
      return db.activityLog.add({
        projectId: projectId,
        action: action,
        entityType: entityType,
        entityId: entityId,
        entityName: entityName,
        timestamp: new Date().toISOString(),
        details: details || "",
      });
    },

    getRecentActivity: function (projectId, limit) {
      if (!db) return Promise.resolve([]);
      limit = limit || 10;
      return db.activityLog
        .where("projectId")
        .equals(projectId)
        .reverse()
        .sortBy("timestamp")
        .then(function (logs) {
          return logs.slice(0, limit);
        });
    },

    // ===== Statistics =====
    getStats: function (projectId) {
      if (!db) return Promise.resolve({ characters: 0, elements: 0, events: 0, maps: 0, documents: 0 });
      return Promise.all([
        db.characters.where("projectId").equals(projectId).count(),
        db.elements.where("projectId").equals(projectId).count(),
        db.events.where("projectId").equals(projectId).count(),
        db.maps.where("projectId").equals(projectId).count(),
        db.documents.where("projectId").equals(projectId).count(),
      ]).then(function (counts) {
        return {
          characters: counts[0],
          elements: counts[1],
          events: counts[2],
          maps: counts[3],
          documents: counts[4],
        };
      });
    },

    // ===== Export/Import =====
    exportProject: function (projectId) {
      if (!db) return Promise.resolve(null);
      return Promise.all([
        db.projects.get(projectId),
        db.characters.where("projectId").equals(projectId).toArray(),
        db.elements.where("projectId").equals(projectId).toArray(),
        db.events.where("projectId").equals(projectId).toArray(),
        db.maps.where("projectId").equals(projectId).toArray(),
        db.documents.where("projectId").equals(projectId).toArray(),
        db.activityLog.where("projectId").equals(projectId).toArray(),
      ]).then(function (results) {
        return {
          project: results[0],
          characters: results[1],
          elements: results[2],
          events: results[3],
          maps: results[4],
          documents: results[5],
          activityLog: results[6],
          exportedAt: new Date().toISOString(),
        };
      });
    },

    importProject: function (projectId, data) {
      if (!db) return Promise.resolve();
      return db.transaction("rw", [db.characters, db.elements, db.events, db.maps, db.documents, db.activityLog], function () {
        var promises = [];
        if (data.characters) {
          data.characters.forEach(function (c) {
            promises.push(db.characters.put(Object.assign({}, c, { projectId: projectId })));
          });
        }
        if (data.elements) {
          data.elements.forEach(function (e) {
            promises.push(db.elements.put(Object.assign({}, e, { projectId: projectId })));
          });
        }
        if (data.events) {
          data.events.forEach(function (e) {
            promises.push(db.events.put(Object.assign({}, e, { projectId: projectId })));
          });
        }
        if (data.maps) {
          data.maps.forEach(function (m) {
            promises.push(db.maps.put(Object.assign({}, m, { projectId: projectId })));
          });
        }
        if (data.documents) {
          data.documents.forEach(function (d) {
            promises.push(db.documents.put(Object.assign({}, d, { projectId: projectId })));
          });
        }
        if (data.activityLog) {
          data.activityLog.forEach(function (a) {
            promises.push(db.activityLog.put(Object.assign({}, a, { projectId: projectId })));
          });
        }
        return Promise.all(promises);
      });
    },

    // ===== Page Tracking =====
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
  };

  window.AetherState = AetherState;
})();