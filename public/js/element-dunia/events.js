// public/js/element-dunia/events.js
// Semua event delegation + wiring untuk halaman Element Dunia.
// Bergantung pada state.js, render.js, form.js (window.AwbElementDunia.state + utils).
(function () {
  "use strict";

  var st = window.AwbElementDunia.state;
  var u = window.AwbElementDunia.utils;
  var IMAGE_POPUP_ID = "pop-elem-img";
  var FORM_MODAL_ID = "modal-buat-element";

  function wireEvents() {
    // ---------- Sidebar collapse ----------
    document.getElementById("btn-collapse-cat")?.addEventListener("click", function (e) {
      var btn = e.currentTarget;
      var c = btn.closest(".elem-cat");
      c?.classList.toggle("collapsed");
      btn.textContent = c?.classList.contains("collapsed") ? ">" : "<";
    });

    // ---------- Entry + custom ----------
    document.getElementById("btn-entry-element")?.addEventListener("click", window.openEntryPicker);
    document.getElementById("btn-custom-element")?.addEventListener("click", function () {
      if (window._elemCustomTypes && typeof window._elemCustomTypes.openManager === "function") {
        window._elemCustomTypes.openManager();
      }
    });
    document.getElementById("btn-tutup-pilih-entry")?.addEventListener("click", window.closeEntryPicker);

    // ---------- Picker click ----------
    document.getElementById("modal-pilih-entry-list")?.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pick-type]");
      if (!b) return;
      var t = b.getAttribute("data-pick-type");
      window.closeEntryPicker();
      window.openElementForm(t);
    });

    // ---------- Category filter ----------
    document.getElementById("elem-cat-list")?.addEventListener("click", function (e) {
      var b = e.target.closest(".elem-cat-item");
      if (!b) return;
      document.querySelectorAll(".elem-cat-item").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      window.filterAndRender();
    });

    // ---------- View toggle ----------
    document.getElementById("view-grid")?.addEventListener("click", function () { window.setView("grid"); });
    document.getElementById("view-list")?.addEventListener("click", function () { window.setView("list"); });

    // ---------- Search ----------
    document.querySelector(".search-field")?.addEventListener("input", u.debounce(function (e) {
      st.currentSearchTerm = (e.target.value || "").toLowerCase();
      window.filterAndRender();
    }, 300));

    // ---------- Card actions (edit/del/klik untuk buka panel detail) ----------
    document.getElementById("elem-groups-container")?.addEventListener("click", function (e) {
      var t = e.target.closest("[data-action]");
      if (t) {
        if (t.getAttribute("data-action") === "edit") {
          window.openElementForm(t.getAttribute("data-type"), Number(t.getAttribute("data-id")));
        } else if (t.getAttribute("data-action") === "del") {
          window.deleteElement(Number(t.getAttribute("data-id")));
        }
        return;
      }
      var card = e.target.closest(".elem-card");
      if (card) {
        var idAttr = card.querySelector("[data-id]")?.getAttribute("data-id");
        var id = idAttr ? Number(idAttr) : NaN;
        if (!isNaN(id)) {
          var elem = st.allElements.find(function (x) { return x.id === id; });
          if (elem && window._elemDetailPanel && typeof window._elemDetailPanel.open === "function") {
            window._elemDetailPanel.open(elem);
          }
        }
      }
    });

    // ---------- Group toggle ----------
    document.getElementById("elem-groups-container")?.addEventListener("click", function (e) {
      if (e.target.closest("[data-toggle-group]")) {
        e.target.closest(".elem-group")?.classList.toggle("open");
      }
    });

    // ---------- Thumbnail image error → fallback placeholder ----------
    document.getElementById("elem-groups-container")?.addEventListener("error", function (e) {
      var img = e.target;
      if (!img || !img.hasAttribute("data-thumb-img")) return;
      var fb = document.createElement("span");
      fb.className = "elem-thumb-fallback";
      var ic = document.createElement("iconify-icon");
      ic.setAttribute("icon", "lucide:image");
      ic.setAttribute("width", "28");
      fb.appendChild(ic);
      img.replaceWith(fb);
    }, true);

    // ---------- Modal save/cancel ----------
    document.getElementById("btn-simpan-element")?.addEventListener("click", function () { return window.saveElementForm(); });
    document.getElementById("btn-batal-element")?.addEventListener("click", window.closeElementForm);

    // ---------- Image popup ----------
    document.getElementById("btn-tutup-pop-img")?.addEventListener("click", function () {
      document.getElementById(IMAGE_POPUP_ID)?.classList.remove("open");
      st.currentImageTargetInput = null;
    });
    document.getElementById("btn-batal-pop-img")?.addEventListener("click", function () {
      document.getElementById(IMAGE_POPUP_ID)?.classList.remove("open");
      st.currentImageTargetInput = null;
    });
    document.getElementById("btn-simpan-pop-img")?.addEventListener("click", window.saveElementImagePreview);
    document.getElementById("elem-pop-img-url")?.addEventListener("input", function () {
      // updateImagePreview dipanggil via form.js scope; sini cukup sinkronkan target
      if (st.currentImageTargetInput) {
        var popInput = document.getElementById("elem-pop-img-url");
        if (popInput) st.currentImageTargetInput.value = popInput.value || "";
      }
    });

    // ---------- Form-body delegated handlers ----------
    var body = document.getElementById("modal-buat-element-body");
    if (body) {
      body.addEventListener("click", function (e) {
        // Image edit button
        var imgBtn = e.target.closest("[data-image-edit]");
        if (imgBtn) {
          var wrap = imgBtn.closest("[data-kind='image']");
          var urlInput = wrap?.querySelector("[data-image-url]");
          if (urlInput) window.openElementImagePopupForInput(urlInput);
          return;
        }
        // Tag input (Enter di-handle di keydown)
        var tagInput = e.target.closest("[data-tag-input]");
        if (tagInput && e.key !== undefined) {/* handled in keydown */}
        // Tag chip remove — hanya saat klik tombol "x" (tag-remove), bukan pada nama tag
        var tagRemove = e.target.closest("[data-tag-list] .tag-remove");
        if (tagRemove) {
          tagRemove.closest(".badge")?.remove();
          return;
        }
        // Linked chip remove — hanya saat klik tombol "x" (linked-remove)
        var linkedRemove = e.target.closest("[data-linked-list] .linked-remove");
        if (linkedRemove) {
          linkedRemove.closest(".badge")?.remove();
          return;
        }
        // Extra add
        var extraAdd = e.target.closest("[data-extra-add], [data-extra-add-top]");
        if (extraAdd) {
          var list = body.querySelector("[data-extra-list]");
          if (list) list.appendChild(window.AwbFormRenderer.buildExtraItem("", "Text", ""));
          return;
        }
        // Extra delete
        var extraDel = e.target.closest("[data-extra-del]");
        if (extraDel) {
          var item = extraDel.closest(".extra-item");
          if (item) item.remove();
          return;
        }
        // List add
        var listAdd = e.target.closest("[data-list-add]");
        if (listAdd) {
          var wrap2 = listAdd.closest(".list-wrap");
          var container = wrap2?.querySelector("[data-list-list]");
          var tpl = wrap2?.querySelector("[data-list-template]");
          if (container && tpl) container.appendChild(tpl.content.firstElementChild.cloneNode(true));
          return;
        }
        // List delete
        var listDel = e.target.closest("[data-list-del]");
        if (listDel) {
          var li = listDel.closest(".list-item");
          if (li) li.remove();
          return;
        }
      });

      body.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        var tagInp = e.target.closest("[data-tag-input]");
        if (tagInp) {
          e.preventDefault();
          var v = tagInp.value.trim();
          if (!v) return;
          var list = tagInp.parentElement.querySelector("[data-tag-list]");
          if (!list) return;
          var b = document.createElement("span");
          b.className = "badge";
          b.textContent = v + " x";
          list.appendChild(b);
          tagInp.value = "";
          return;
        }
        var linkedInp = e.target.closest("[data-linked-input]");
        if (linkedInp) {
          e.preventDefault();
          var linkedType = linkedInp.dataset.linkedType;
          if (window.AwbFormRenderer && window.AwbFormRenderer.handleLinkedInputEnter) {
            window.AwbFormRenderer.handleLinkedInputEnter(document.getElementById(FORM_MODAL_ID), linkedInp, linkedType);
          }
          return;
        }
        if (e.key === "Escape") {
          var escInp = e.target.closest("[data-linked-input]");
          if (escInp && window.AwbFormRenderer && window.AwbFormRenderer.closeLinkedDropdown) {
            window.AwbFormRenderer.closeLinkedDropdown(escInp);
          }
        }
      });

      // Linked dropdown: input/focus → tampilkan, blur → sembunyikan (delay)
      var linkedBlurTimer = null;
      body.addEventListener("input", function (e) {
        var linkedInp = e.target.closest("[data-linked-input]");
        if (!linkedInp) return;
        var linkedType = linkedInp.dataset.linkedType;
        if (window.AwbFormRenderer && window.AwbFormRenderer.renderLinkedDropdown) {
          window.AwbFormRenderer.renderLinkedDropdown(linkedInp, linkedType);
        }
      });
      body.addEventListener("focus", function (e) {
        var linkedInp = e.target.closest("[data-linked-input]");
        if (!linkedInp) return;
        if (linkedBlurTimer) { clearTimeout(linkedBlurTimer); linkedBlurTimer = null; }
        var linkedType = linkedInp.dataset.linkedType;
        if (window.AwbFormRenderer && window.AwbFormRenderer.renderLinkedDropdown) {
          window.AwbFormRenderer.renderLinkedDropdown(linkedInp, linkedType);
        }
      }, true);
      body.addEventListener("blur", function (e) {
        var linkedInp = e.target.closest("[data-linked-input]");
        if (!linkedInp) return;
        linkedBlurTimer = setTimeout(function () {
          if (window.AwbFormRenderer && window.AwbFormRenderer.closeLinkedDropdown) {
            window.AwbFormRenderer.closeLinkedDropdown(linkedInp);
          }
        }, 150);
      }, true);

      // Chip removal: only on click of "x" button (linked-remove), not on name
      body.addEventListener("click", function (e) {
        var removeBtn = e.target.closest(".linked-remove");
        if (removeBtn) {
          removeBtn.closest(".badge")?.remove();
        }
      });
    }
  }

  window.wireEvents = wireEvents;

})();
