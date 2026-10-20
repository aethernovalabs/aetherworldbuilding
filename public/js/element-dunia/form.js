// public/js/element-dunia/form.js
// Fungsi form (buka/simpan/hapus) + popup gambar untuk halaman Element Dunia.
// Bergantung pada state.js (window.AwbElementDunia.state + utils).
(function () {
  "use strict";

  var st = window.AwbElementDunia.state;
  var u = window.AwbElementDunia.utils;
  var FORM_MODAL_ID = "modal-buat-element";
  var PICKER_MODAL_ID = "modal-pilih-entry";
  var IMAGE_POPUP_ID = "pop-elem-img";

  // ---------- Render form ke modal tunggal ----------
  function openElementForm(type, id) {
    if (!window.AwbFormRenderer) return;
    var modal = document.getElementById(FORM_MODAL_ID);
    if (!modal) return;
    var titleEl = document.getElementById("modal-buat-element-title");
    var body = document.getElementById("modal-buat-element-body");
    if (!body) return;

    var schema = window.AwbElementForm.getSchema(type);
    body.innerHTML = window.AwbFormRenderer.renderForm(schema);
    window.AwbFormRenderer.clearModal(modal);

    var action = id ? "Edit" : "Buat";
    if (titleEl) titleEl.innerHTML =
      '<span style="width:32px;height:32px;border:1px solid var(--border);display:inline-flex;align-items:center;justify-content:center;">' +
      '<iconify-icon icon="lucide:image" width="16"></iconify-icon></span>' +
      action + " " + u.escapeHtml(type);

    st.currentEditingId = id || null;
    st.currentEditingType = type;
    if (id) {
      var el = st.allElements.find(function (e) { return e.id === id; });
      if (el) {
        var baseData = el.data || {};
        var fields = {};
        if (baseData.fields && typeof baseData.fields === "object") {
          fields = Object.assign({}, baseData.fields);
        } else {
          var reserved = { description: 1, imageUrl: 1, image: 1, tags: 1, extraFields: 1,
            linkedElements: 1, lists: 1, fields: 1, notes: 1 };
          Object.keys(baseData).forEach(function (k) {
            if (!reserved[k]) fields[k] = baseData[k];
          });
        }
        window.AwbFormRenderer.populateModal(modal, schema, {
          name: el.name || "",
          description: baseData.description || "",
          imageUrl: baseData.imageUrl || baseData.image || "",
          tags: baseData.tags || [],
          extraFields: baseData.extraFields || {},
          linkedElements: baseData.linkedElements || {},
          notes: baseData.notes || "",
          fields: fields,
          lists: baseData.lists || {}
        });
      }
    }
    modal.classList.add("open");
  }

  function closeElementForm() {
    document.getElementById(FORM_MODAL_ID)?.classList.remove("open");
    st.currentEditingId = null;
    st.currentEditingType = null;
  }

  // ---------- Save ----------
  async function saveCurrentElement() {
    if (!window.elementDuniaQuery) return;
    var modal = document.getElementById(FORM_MODAL_ID);
    if (!modal) return;
    var collected = window.AwbFormRenderer.collectFromModal(modal);
    if (!collected.name) {
      alert("Nama elemen wajib diisi");
      return;
    }
    var type = st.currentEditingType;
    var id = st.currentEditingId;
    var data = {
      name: collected.name,
      type: type,
      data: {
        description: collected.description,
        imageUrl: collected.imageUrl,
        tags: collected.tags,
        extraFields: collected.extraFields,
        linkedElements: collected.linkedElements,
        notes: collected.notes,
        fields: collected.fields,
        lists: collected.lists
      }
    };
    try {
      if (id) {
        await window.elementDuniaQuery.updateElement(id, data);
        await window.elementDuniaQuery.logActivity("update", "element", id, data.name, type + " diperbarui");
      } else {
        var created = await window.elementDuniaQuery.addElement(data);
        await window.elementDuniaQuery.logActivity("create", "element", created.id, data.name, type + " dibuat");
      }
      closeElementForm();
      await window.AwbElementDunia.reloadAll();
    } catch (err) {
      console.error("Error saving element:", err);
      alert("Gagal menyimpan elemen: " + (err && err.message ? err.message : err));
    }
  }

  // ---------- Delete ----------
  async function deleteElement(id) {
    if (!confirm("Hapus element ini?")) return;
    if (!window.elementDuniaQuery) return;
    try {
      await window.elementDuniaQuery.deleteElement(id);
      await window.elementDuniaQuery.logActivity("delete", "element", id, "Element", "Dihapus");
      st.allElements = st.allElements.filter(function (e) { return e.id !== id; });
      window._elemDuniaAll = st.allElements;
      // Tutup panel detail jika element yang dihapus sedang ditampilkan
      if (window._elemDetailPanel && window._elemDetailPanel.currentId === id) {
        window._elemDetailPanel.close();
      }

      // Bersihkan referensi linked ke elemen yang dihapus di elemen lain (orphan link cleanup)
      var cleanupPromises = [];
      st.allElements.forEach(function (other) {
        var otherData = other.data || {};
        var linked = otherData.linkedElements || {};
        var changed = false;
        Object.keys(linked).forEach(function (fieldKey) {
          var links = linked[fieldKey];
          if (!Array.isArray(links)) return;
          var beforeLen = links.length;
          linked[fieldKey] = links.filter(function (l) {
            return !l || String(l.id) !== String(id);
          });
          if (linked[fieldKey].length !== beforeLen) changed = true;
        });
        if (changed) {
          cleanupPromises.push(
            window.elementDuniaQuery.updateElement(other.id, {
              data: Object.assign({}, otherData, { linkedElements: linked })
            })
          );
        }
      });
      if (cleanupPromises.length) {
        await Promise.all(cleanupPromises);
      }

      window.filterAndRender();
      window.updateCategoryCounts();
    } catch (err) {
      console.error("Error deleting element:", err);
      alert("Gagal menghapus elemen");
    }
  }

  // ---------- View mode ----------
  function setView(v) {
    if (v !== "grid" && v !== "list") return;
    st.currentViewMode = v;
    try { localStorage.setItem(st.VIEW_STORAGE_KEY, v); } catch (e) { /* storage penuh / private mode → abaikan */ }
    document.querySelectorAll(".elem-cards").forEach(function (c) {
      c.classList.toggle("list-mode", v === "list");
    });
    document.getElementById("view-grid")?.classList.toggle("active", v === "grid");
    document.getElementById("view-list")?.classList.toggle("active", v === "list");
  }

  // ---------- Image popup ----------
  function openImagePopupForInput(urlInput) {
    st.currentImageTargetInput = urlInput;
    var popInput = document.getElementById("elem-pop-img-url");
    if (popInput) popInput.value = urlInput.value || "";
    updateImagePreview();
    document.getElementById(IMAGE_POPUP_ID)?.classList.add("open");
  }
  function updateImagePreview() {
    var inputEl = document.getElementById("elem-pop-img-url");
    var preview = document.getElementById("elem-pop-img-preview");
    if (!inputEl || !preview) return;
    var url = (inputEl.value || "").trim();
    if (!url) { preview.textContent = "Masukkan URL gambar untuk melihat pratinjau"; return; }
    var img = document.createElement("img");
    img.src = url;
    img.onload = function () { preview.innerHTML = ""; preview.appendChild(img); };
    img.onerror = function () { preview.textContent = "URL gambar tidak valid"; };
    preview.textContent = "Loading...";
  }
  function saveImagePopup() {
    if (!st.currentImageTargetInput) return;
    var inputEl = document.getElementById("elem-pop-img-url");
    var url = (inputEl?.value || "").trim();
    if (!url) { alert("Masukkan URL gambar"); return; }
    st.currentImageTargetInput.value = url;
    var preview = st.currentImageTargetInput.parentElement.querySelector(".elem-img-preview");
    if (preview) {
      var img = document.createElement("img");
      img.src = url;
      img.style.cssText = "width:100%;height:100%;object-fit:cover;";
      img.onload = function () { preview.innerHTML = ""; preview.appendChild(img); };
      img.onerror = function () { preview.textContent = "URL tidak valid"; };
    }
    document.getElementById(IMAGE_POPUP_ID)?.classList.remove("open");
    st.currentImageTargetInput = null;
  }

  // Expose untuk detail-panel.js dan inline onclick di HTML
  window.openElementForm = openElementForm;
  window.saveElementForm = function (type) {
    if (typeof type === "string") st.currentEditingType = type;
    return saveCurrentElement();
  };
  window.closeElementForm = closeElementForm;
  window.deleteElement = deleteElement;
  window.openElementImagePopupForInput = openImagePopupForInput;
  window.openElementImagePopup = function (btn) {
    var wrap = btn.closest("[data-kind='image']");
    var urlInput = wrap?.querySelector("[data-image-url]");
    if (urlInput) openImagePopupForInput(urlInput);
  };
  window.saveElementImagePreview = saveImagePopup;
  window.setView = setView;

})();
