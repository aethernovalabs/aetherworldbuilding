/* awb-page-utils.js — Shared utilities for all module pages.
 *
 * Provides:
 * - getActiveProject(): Returns current project from URL or localStorage
 * - waitForAetherState(): Waits for AetherState to be available
 * - setupPageTitle(): Updates page header with project name
 * - query helpers for each entity type filtered by projectId
 */
(function () {
  "use strict";

  // Wait for AetherState to be available
  function waitForAetherState() {
    return new Promise(function (resolve) {
      function check() {
        if (window.AetherState && AetherState.available) {
          resolve(window.AetherState);
        } else {
          setTimeout(check, 50);
        }
      }
      check();
    });
  }

  // Get active project from URL parameter or localStorage
  async function getActiveProject(AetherState) {
    var params = new URLSearchParams(window.location.search);
    var worldParam = params.get("world");
    if (worldParam) {
      var project = await AetherState.getProjectByName(worldParam);
      if (project) return project;
    }

    var savedId = localStorage.getItem("awb_active_project");
    if (savedId) {
      var project = await AetherState.getProject(parseInt(savedId, 10));
      if (project) return project;
    }

    // Fallback: first project
    var projects = await AetherState.getProjects();
    return projects[0] || null;
  }

  // Set active project in localStorage and URL
  function setActiveProject(project) {
    if (!project || !project.id) return;
    localStorage.setItem("awb_active_project", String(project.id));
    var url = new URL(window.location.href);
    url.searchParams.set("world", project.name);
    window.history.replaceState({}, "", url);
  }

  // Update page header with project name
  function setupPageTitle(project) {
    if (!project) return;
    var titleEl = document.getElementById("world-title") || document.querySelector("h1");
    if (titleEl) {
      var baseTitle = titleEl.textContent.replace(/^[^:]+:\s*/, ""); // Remove existing prefix
      titleEl.textContent = project.name + (baseTitle ? ": " + baseTitle : "");
    }
  }

  // Generic query helper - returns entities for current project
  function createQueryHelpers(AetherState, projectId) {
    return {
      // Characters
      getCharacters: function () {
        return AetherState.getCharacters(projectId);
      },
      addCharacter: function (data) {
        return AetherState.addCharacter(projectId, data);
      },
      updateCharacter: function (id, data) {
        return AetherState.updateCharacter(id, data);
      },
      deleteCharacter: function (id) {
        return AetherState.deleteCharacter(id);
      },

      // Elements
      getElements: function (type) {
        return AetherState.getElements(projectId, type);
      },
      addElement: function (data) {
        return AetherState.addElement(projectId, data);
      },
      updateElement: function (id, data) {
        return AetherState.updateElement(id, data);
      },
      deleteElement: function (id) {
        return AetherState.deleteElement(id);
      },

      // Element Types (custom)
      getCustomTypes: function () {
        return AetherState.getCustomTypes(projectId);
      },
      addCustomType: function (data) {
        return AetherState.addCustomType(projectId, data);
      },
      updateCustomType: function (id, data) {
        return AetherState.updateCustomType(id, data);
      },
      deleteCustomType: function (id) {
        return AetherState.deleteCustomType(id);
      },
      deleteCustomTypeWithElements: function (id, names) {
        return AetherState.deleteCustomTypeWithElements(id, projectId, names);
      },
      countElementsOfType: function (typeName) {
        return AetherState.countElementsOfType(projectId, typeName);
      },

      // Events
      getEvents: function () {
        return AetherState.getEvents(projectId);
      },
      addEvent: function (data) {
        return AetherState.addEvent(projectId, data);
      },
      updateEvent: function (id, data) {
        return AetherState.updateEvent(id, data);
      },
      deleteEvent: function (id) {
        return AetherState.deleteEvent(id);
      },

      // Maps
      getMaps: function () {
        return AetherState.getMaps(projectId);
      },
      addMap: function (data) {
        return AetherState.addMap(projectId, data);
      },
      updateMap: function (id, data) {
        return AetherState.updateMap(id, data);
      },
      deleteMap: function (id) {
        return AetherState.deleteMap(id);
      },

      // Documents
      getDocuments: function () {
        return AetherState.getDocuments(projectId);
      },
      addDocument: function (data) {
        return AetherState.addDocument(projectId, data);
      },
      updateDocument: function (id, data) {
        return AetherState.updateDocument(id, data);
      },
      deleteDocument: function (id) {
        return AetherState.deleteDocument(id);
      },

      // Stats
      getStats: function () {
        return AetherState.getStats(projectId);
      },

      // Activity
      getRecentActivity: function (limit) {
        return AetherState.getRecentActivity(projectId, limit);
      },
      logActivity: function (action, entityType, entityId, entityName, details) {
        return AetherState.logActivity(projectId, action, entityType, entityId, entityName, details);
      },

      // Export/Import
      exportProject: function () {
        return AetherState.exportProject(projectId);
      },
      importProject: function (data) {
        return AetherState.importProject(projectId, data);
      },
    };
  }

  // Initialize page with active project
  async function initPage() {
    var AetherState = await waitForAetherState();
    var project = await getActiveProject(AetherState);
    setupPageTitle(project);

    return {
      AetherState: AetherState,
      project: project,
      projectId: project ? project.id : null,
      query: project ? createQueryHelpers(AetherState, project.id) : null,
      setActiveProject: setActiveProject,
    };
  }

  // Listen for world change event
  window.addEventListener("awb:world-change", function (e) {
    if (e.detail?.worldName) {
      window.location.href = window.location.pathname + "?world=" + encodeURIComponent(e.detail.worldName);
    }
  });

  // Expose utilities globally
  window.AetherPageUtils = {
    waitForAetherState: waitForAetherState,
    getActiveProject: getActiveProject,
    setActiveProject: setActiveProject,
    setupPageTitle: setupPageTitle,
    createQueryHelpers: createQueryHelpers,
    initPage: initPage,
  };
})();