/* awb-storage.js — File System Access API integration for local backup.
 *
 * Provides:
 * - pickDirectory(): Let user choose a folder for backups
 * - exportToLocal(projectId, directoryHandle): Export all project data as JSON files
 * - importFromLocal(directoryHandle): Import project data from JSON files
 * - saveDirectoryHandle(handle): Persist directory handle permission
 * - getSavedDirectoryHandle(): Retrieve saved directory handle
 */
(function () {
  "use strict";

  var STORAGE_KEY = "awb_backup_directory";

  function isFileSystemAccessSupported() {
    return "showDirectoryPicker" in window;
  }

  var StorageAPI = {
    isSupported: isFileSystemAccessSupported,

    // Request user to pick a directory for backups
    pickDirectory: function () {
      if (!isFileSystemAccessSupported()) {
        return Promise.reject(new Error("File System Access API not supported"));
      }
      return window.showDirectoryPicker({ mode: "readwrite" });
    },

    // Save directory handle to IndexedDB (via localStorage for simplicity)
    saveDirectoryHandle: function (handle) {
      try {
        // Store serialized handle info (we can't serialize the handle directly)
        // Instead we'll store a reference and re-request permission on load
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: handle.name }));
        return true;
      } catch (e) {
        console.warn("Failed to save directory handle:", e);
        return false;
      }
    },

    // Get saved directory handle (requires user permission each session)
    getSavedDirectoryHandle: function () {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return Promise.resolve(null);
      try {
        var info = JSON.parse(saved);
        // We can't restore the handle directly, need to ask user again
        // But we can indicate a folder was previously selected
        return Promise.resolve(info);
      } catch (e) {
        return Promise.resolve(null);
      }
    },

    // Clear saved directory
    clearDirectoryHandle: function () {
      localStorage.removeItem(STORAGE_KEY);
    },

    // Export project data to local folder as JSON files
    exportToLocal: function (projectData, directoryHandle) {
      if (!directoryHandle) {
        return Promise.reject(new Error("No directory handle provided"));
      }

      var timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      var folderName = "aether-backup-" + (projectData.project?.name || "project") + "-" + timestamp;

      return directoryHandle.getDirectoryHandle(folderName, { create: true })
        .then(function (backupDir) {
          var files = [];

          // Main project file
          files.push(StorageAPI._writeFile(backupDir, "project.json", JSON.stringify(projectData.project, null, 2)));

          // Characters
          if (projectData.characters?.length) {
            files.push(StorageAPI._writeFile(backupDir, "characters.json", JSON.stringify(projectData.characters, null, 2)));
          }

          // Elements
          if (projectData.elements?.length) {
            files.push(StorageAPI._writeFile(backupDir, "elements.json", JSON.stringify(projectData.elements, null, 2)));
          }

          // Events
          if (projectData.events?.length) {
            files.push(StorageAPI._writeFile(backupDir, "events.json", JSON.stringify(projectData.events, null, 2)));
          }

          // Maps
          if (projectData.maps?.length) {
            files.push(StorageAPI._writeFile(backupDir, "maps.json", JSON.stringify(projectData.maps, null, 2)));
          }

          // Documents
          if (projectData.documents?.length) {
            files.push(StorageAPI._writeFile(backupDir, "documents.json", JSON.stringify(projectData.documents, null, 2)));
          }

          // Activity log
          if (projectData.activityLog?.length) {
            files.push(StorageAPI._writeFile(backupDir, "activity-log.json", JSON.stringify(projectData.activityLog, null, 2)));
          }

          // Manifest
          var manifest = {
            projectName: projectData.project?.name,
            exportedAt: projectData.exportedAt,
            version: 1,
            files: [
              "project.json",
              "characters.json",
              "elements.json",
              "events.json",
              "maps.json",
              "documents.json",
              "activity-log.json",
            ].filter(function (f) {
              var key = f.replace(".json", "");
              return projectData[key]?.length || key === "project";
            }),
          };
          files.push(StorageAPI._writeFile(backupDir, "manifest.json", JSON.stringify(manifest, null, 2)));

          return Promise.all(files).then(function () {
            return { folderName: folderName, fileCount: files.length };
          });
        });
    },

    _writeFile: function (dirHandle, fileName, content) {
      return dirHandle.getFileHandle(fileName, { create: true })
        .then(function (fileHandle) {
          return fileHandle.createWritable()
            .then(function (writable) {
              return writable.write(content)
                .then(function () { return writable.close(); });
            });
        });
    },

    // Import project data from local folder
    importFromLocal: function (directoryHandle) {
      if (!directoryHandle) {
        return Promise.reject(new Error("No directory handle provided"));
      }

      var requiredFiles = ["project.json", "characters.json", "elements.json", "events.json", "maps.json", "documents.json", "activity-log.json"];
      var data = {};

      var readPromises = requiredFiles.map(function (fileName) {
        return directoryHandle.getFileHandle(fileName)
          .then(function (fileHandle) {
            return fileHandle.getFile()
              .then(function (file) { return file.text(); })
              .then(function (text) {
                try {
                  data[fileName.replace(".json", "")] = JSON.parse(text);
                } catch (e) {
                  console.warn("Failed to parse " + fileName, e);
                  data[fileName.replace(".json", "")] = [];
                }
              });
          })
          .catch(function () {
            // File doesn't exist, use empty array
            data[fileName.replace(".json", "")] = fileName === "project.json" ? null : [];
          });
      });

      return Promise.all(readPromises).then(function () {
        return data;
      });
    },

    // Format bytes to human readable
    formatBytes: function (bytes) {
      if (bytes === 0) return "0 B";
      var k = 1024;
      var sizes = ["B", "KB", "MB", "GB"];
      var i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    },

    // Estimate IndexedDB storage usage
    estimateStorage: function () {
      if (!navigator.storage || !navigator.storage.estimate) {
        return Promise.resolve({ usage: 0, quota: 0 });
      }
      return navigator.storage.estimate();
    },
  };

  window.AetherStorage = StorageAPI;
})();