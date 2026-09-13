/*
 * awb-sidebar.js
 * Logika sidebar utama konsisten untuk seluruh halaman workspace AWB
 */
(function () {
  function initAwbSidebar() {
    const awbSidebar = document.getElementById('awb-main-sidebar');
    if (!awbSidebar) return;

    const btnExpandMainSidebar = document.getElementById('btn-expand-main-sidebar');
    const btnBottomExpand = document.getElementById('btn-bottom-expand');
    const btnCollapseMainSidebar = document.getElementById('btn-collapse-main-sidebar');
    const btnToggleWorldMenu = document.getElementById('btn-toggle-world-menu');
    const awbWorldDropdown = document.getElementById('awb-world-dropdown');
    const curWorldName = document.getElementById('cur-world-name');
    const btnTambahDuniaOpt = document.getElementById('btn-tambah-dunia-opt');

    // Restore state sidebar (default collapsed atau baca dari localStorage)
    const isSavedExpanded = localStorage.getItem('awb_sidebar_expanded') === 'true';
    if (isSavedExpanded) {
      awbSidebar.classList.add('expanded');
    }

    function expandSidebar() {
      awbSidebar.classList.add('expanded');
      localStorage.setItem('awb_sidebar_expanded', 'true');
    }

    function collapseSidebar() {
      awbSidebar.classList.remove('expanded');
      if (awbWorldDropdown) awbWorldDropdown.classList.remove('open');
      localStorage.setItem('awb_sidebar_expanded', 'false');
    }

    if (btnExpandMainSidebar) btnExpandMainSidebar.onclick = expandSidebar;
    if (btnBottomExpand) btnBottomExpand.onclick = expandSidebar;
    if (btnCollapseMainSidebar) btnCollapseMainSidebar.onclick = collapseSidebar;

    // Toggle dropdown dunia
    if (btnToggleWorldMenu && awbWorldDropdown) {
      btnToggleWorldMenu.onclick = function (e) {
        e.stopPropagation();
        awbWorldDropdown.classList.toggle('open');
      };
    }

    // Bind item dunia
    function setupWorldOpts() {
      if (!awbWorldDropdown) return;
      awbWorldDropdown.querySelectorAll('.awb-world-opt:not(.add-btn)').forEach(opt => {
        opt.onclick = function (e) {
          e.stopPropagation();
          awbWorldDropdown.querySelectorAll('.awb-world-opt').forEach(o => o.classList.remove('active'));
          opt.classList.add('active');
          const worldName = opt.dataset.world || opt.textContent.trim();
          if (curWorldName) curWorldName.textContent = worldName;
          awbWorldDropdown.classList.remove('open');
          localStorage.setItem('awb_active_world', worldName);
          
          // Trigger custom event agar halaman bisa dengar perubahan dunia
          window.dispatchEvent(new CustomEvent('awb:world-change', { detail: { worldName } }));
        };
      });
    }
    setupWorldOpts();

    // Tambah dunia baru
    if (btnTambahDuniaOpt && awbWorldDropdown) {
      btnTambahDuniaOpt.onclick = function (e) {
        e.stopPropagation();
        const nama = prompt('Masukkan nama dunia baru:', 'Dunia Baru');
        if (nama && nama.trim()) {
          const clean = nama.trim();
          const opt = document.createElement('div');
          opt.className = 'awb-world-opt';
          opt.dataset.world = clean;
          opt.textContent = clean;
          awbWorldDropdown.insertBefore(opt, btnTambahDuniaOpt);
          setupWorldOpts();
          opt.click();
          if (window.AetherState && typeof window.AetherState.addProject === 'function') {
            window.AetherState.addProject({ name: clean, desc: 'Dunia baru' }).catch(() => {});
          }
        }
      };
    }

    // Set nama dunia awal dari param / localStorage / fallback
    const urlParams = new URLSearchParams(window.location.search);
    const worldParam = urlParams.get('world');
    const savedWorld = worldParam || localStorage.getItem('awb_active_world');
    if (savedWorld && curWorldName) {
      curWorldName.textContent = savedWorld;
    }

    // Sinkronisasi dengan AetherState IndexedDB bila ada
    if (window.AetherState && typeof window.AetherState.getProjects === 'function' && awbWorldDropdown) {
      window.AetherState.getProjects().then(projects => {
        if (projects && projects.length) {
          awbWorldDropdown.querySelectorAll('.awb-world-opt:not(.add-btn)').forEach(o => o.remove());
          const active = curWorldName ? curWorldName.textContent.trim() : projects[0].name;
          projects.forEach(p => {
            const opt = document.createElement('div');
            opt.className = 'awb-world-opt' + (p.name === active ? ' active' : '');
            opt.dataset.world = p.name;
            opt.textContent = p.name;
            awbWorldDropdown.insertBefore(opt, btnTambahDuniaOpt);
          });
          setupWorldOpts();
        }
      }).catch(() => {});
    }

    // Tutup dropdown dunia jika klik luar
    document.addEventListener('click', function (e) {
      if (awbWorldDropdown && !awbWorldDropdown.contains(e.target) && (!btnToggleWorldMenu || !btnToggleWorldMenu.contains(e.target))) {
        awbWorldDropdown.classList.remove('open');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAwbSidebar);
  } else {
    initAwbSidebar();
  }
})();
