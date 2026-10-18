// ===== Dashboard Logic =====
// Navigasi, collapse/expand sidebar, dan "Manajemen Dunia" ditangani awb-sidebar.js.

// ===== Tab klik (wiki + dokument) =====
document.querySelectorAll('.wiki-tabs').forEach(bar => {
  bar.addEventListener('click', e => {
    const tab = e.target.closest('.wiki-tab');
    if (!tab) return;
    bar.querySelectorAll('.wiki-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});
document.querySelectorAll('.doc-tabs').forEach(bar => {
  bar.addEventListener('click', e => {
    const tab = e.target.closest('.doc-tab');
    if (!tab) return;
    bar.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

// ===== File System Access API detection =====
function updateFsaStatus() {
  const pill = document.getElementById('pill-fsa-status');
  if (!pill) return;
  const supported = !!(window.AetherStorage && AetherStorage.isSupported());
  pill.classList.toggle('on', supported);
  pill.classList.toggle('off', !supported);
  pill.innerHTML = '<iconify-icon icon="' + (supported ? 'lucide:check' : 'lucide:x') + '" width="12"></iconify-icon>&nbsp;' +
    (supported ? 'Support' : 'No Support');
}

// ===== Toggle penyimpanan (Auto Save / Cloud Backup) =====
function applyPill(pill, on) {
  pill.classList.toggle('on', on);
  pill.classList.toggle('off', !on);
  if (pill.classList.contains('no-icon')) {
    pill.textContent = on ? pill.dataset.on : pill.dataset.off;
  } else {
    pill.querySelectorAll('iconify-icon').forEach(i => i.remove());
    const icon = on ? 'lucide:check' : (pill.id === 'pill-auto-save' ? 'lucide:save' : 'lucide:cloud-off');
    pill.innerHTML = '<iconify-icon icon="' + icon + '" width="12"></iconify-icon>&nbsp;' + (on ? pill.dataset.on : pill.dataset.off);
  }
}

// Auto Save: default Aktif. Baca preferensi tersimpan.
const pillAutoSave = document.getElementById('pill-auto-save');
let autoSaveEnabled = localStorage.getItem('awb_auto_save') !== 'false';
if (pillAutoSave) applyPill(pillAutoSave, autoSaveEnabled);

if (pillAutoSave) {
  pillAutoSave.addEventListener('click', () => {
    autoSaveEnabled = !autoSaveEnabled;
    localStorage.setItem('awb_auto_save', String(autoSaveEnabled));
    applyPill(pillAutoSave, autoSaveEnabled);
  });
}

// Sinkronkan pill bila Auto Save diubah dari popup Setting sidebar
window.addEventListener('awb:autosave-change', () => {
  if (!pillAutoSave) return;
  autoSaveEnabled = localStorage.getItem('awb_auto_save') !== 'false';
  applyPill(pillAutoSave, autoSaveEnabled);
});

// Cloud Backup: default No Active (fitur belum aktif). Hanya toggle visual + preferensi.
const pillCloud = document.getElementById('pill-cloud-backup');
let cloudEnabled = localStorage.getItem('awb_cloud_backup') === 'true';
if (pillCloud) {
  applyPill(pillCloud, cloudEnabled);
  pillCloud.addEventListener('click', () => {
    cloudEnabled = !cloudEnabled;
    localStorage.setItem('awb_cloud_backup', String(cloudEnabled));
    applyPill(pillCloud, cloudEnabled);
  });
}

updateFsaStatus();

// ===== Modal helpers =====
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(el) { el.closest('.modal-overlay')?.classList.remove('open'); }
document.querySelectorAll('[data-close-modal]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn));
});
document.querySelectorAll('.modal-overlay').forEach(ov => {
  ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
});

// Tombol "Buat Dunia" pada header (jika ada)
const btnOpenCreate = document.getElementById('btn-open-create');
if (btnOpenCreate) btnOpenCreate.addEventListener('click', () => openModal('modal-buat-dunia'));

// Tombol edit nama dunia (ikon pena) → isi form dari proyek aktif
const btnOpenEdit = document.getElementById('btn-open-edit');
if (btnOpenEdit) {
  btnOpenEdit.addEventListener('click', () => {
    whenAether(() => {
      AetherState.getActiveProject().then(project => {
        if (!project) return;
        document.getElementById('input-judul-edit').value = project.name || '';
        document.getElementById('input-deskripsi-edit').value = project.desc || '';
        openModal('modal-edit-dunia');
      });
    });
  });
}

// Simpan edit → persist ke DB lalu perbarui tampilan + URL
document.getElementById('btn-submit-edit')?.addEventListener('click', () => {
  const judul = document.getElementById('input-judul-edit').value.trim();
  const desk = document.getElementById('input-deskripsi-edit').value.trim();
  if (!judul) { alert('Judul dunia wajib diisi'); return; }
  whenAether(() => {
    AetherState.getActiveProject().then(proj => {
      if (!proj) { alert('Tidak ada proyek aktif'); return; }
      AetherState.updateProject(proj.id, { name: judul, desc: desk }).then(updated => {
        currentProject = updated || proj;
        if (document.getElementById('world-title')) document.getElementById('world-title').textContent = judul;
        if (document.getElementById('world-name-display')) document.getElementById('world-name-display').textContent = judul;
        if (document.getElementById('world-desc')) document.getElementById('world-desc').textContent = desk || '';
        closeModal(document.getElementById('btn-submit-edit'));
        const url = new URL(window.location.href);
        url.searchParams.set('world', judul);
        window.history.replaceState({}, '', url);
        AetherState.setActiveProject(currentProject);
      });
    });
  });
});

// Buat dunia baru → tambah project, set aktif, lalu navigasi
document.getElementById('btn-submit-buat')?.addEventListener('click', () => {
  const judul = document.getElementById('input-judul').value.trim();
  if (!judul) { alert('Judul dunia wajib diisi'); return; }
  const desk = document.getElementById('input-deskripsi').value.trim();
  whenAether(() => {
    AetherState.projectExists(judul).then(exists => {
      if (exists) { alert('Nama dunia sudah dipakai'); return; }
      AetherState.addProject({ name: judul, desc: desk }).then(project => {
        if (!project) return;
        AetherState.setActiveProject(project).then(() => {
          location.href = 'dashboard.page.html?world=' + encodeURIComponent(project.name);
        });
      });
    });
  });
});

// ===== Tunggu AetherState (disuntik setelah skrip halaman) =====
function whenAether(fn) {
  if (window.AetherState && AetherState.available) { fn(); return; }
  setTimeout(() => whenAether(fn), 50);
}

// ===== Dashboard Data Loading =====
let currentProject = null;
let backupDirectoryHandle = null;

async function loadDashboardData() {
  await whenAether(async () => {
    try {
      currentProject = await AetherState.getActiveProject();
      const titleEl = document.getElementById('world-title');
      const descEl = document.getElementById('world-desc');
      const editBtn = document.getElementById('btn-open-edit');

      if (!currentProject) {
        // Kondisi kosong: tampilkan judul default + tombol Buat Dunia, sembunyikan Edit Dunia
        if (titleEl) titleEl.textContent = 'Aether Nova Worldbuilding';
        if (descEl) descEl.textContent = '';
        if (editBtn) editBtn.style.display = 'none';
        // Storage & backup tetap dimuat agar status panel akurat
        loadStorageInfo();
        loadBackupFolderInfo();
        return;
      }

      // Ada world: tampilkan info + tombol Edit Dunia
      if (titleEl) titleEl.textContent = currentProject.name;
      if (descEl) descEl.textContent = currentProject.desc || '';
      if (editBtn) editBtn.style.display = '';

      // Load stats
      const stats = await AetherState.getStats(currentProject.id);
      const statChar = document.querySelector('.stat-tile[title="Karakter"] .stat-val');
      if (statChar) statChar.textContent = stats.characters;
      const statLoc = document.querySelector('.stat-tile[title="Lokasi"] .stat-val');
      if (statLoc) statLoc.textContent = stats.elements;
      const statMakhluk = document.querySelector('.stat-tile[title="Makhluk"] .stat-val');
      if (statMakhluk) statMakhluk.textContent = 0;
      const statTotElem = document.querySelector('.stat-tile[title="Total Element"] .stat-val');
      if (statTotElem) statTotElem.textContent = stats.elements;
      const statTotBab = document.querySelector('.stat-tile[title="Total Bab"] .stat-val');
      if (statTotBab) statTotBab.textContent = stats.documents;

      // Load recent activity
      const activities = await AetherState.getRecentActivity(currentProject.id, 10);
      renderRecentActivity(activities);

      // Load storage info
      loadStorageInfo();

      // Load backup folder info
      loadBackupFolderInfo();
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  });
}

function renderRecentActivity(activities) {
  const container = document.querySelector('.rail-panel:nth-child(2)');
  if (!container) return;
  const activityBody = container.querySelector(':scope > div:last-child');
  if (!activityBody) return;

  if (!activities || activities.length === 0) {
    activityBody.innerHTML = '<div class="empty-inner"><iconify-icon icon="lucide:activity"></iconify-icon><span>Belum ada aktivitas</span></div>';
    return;
  }

  const typeIcons = {
    character: 'lucide:user',
    element: 'lucide:gem',
    event: 'lucide:calendar-range',
    map: 'lucide:map',
    document: 'lucide:book-open',
    project: 'lucide:globe',
  };

  const typeBadges = {
    character: '',
    element: 'blue',
    event: 'blue',
    map: 'green',
    document: 'yellow',
    project: 'red',
  };

  activityBody.innerHTML = activities.map(a => {
    const icon = typeIcons[a.entityType] || 'lucide:activity';
    const badgeClass = typeBadges[a.entityType] || '';
    const actionText = a.action === 'create' ? 'ditambahkan' : (a.action === 'update' ? 'diperbarui' : 'dihapus');
    return `
      <div class="change-row">
        <div class="change-ico"><iconify-icon icon="${icon}"></iconify-icon></div>
        <div class="change-body">
          <div class="change-top">
            <div class="change-name">${a.entityName}</div>
            <span class="type-badge ${badgeClass}">${a.entityType}</span>
          </div>
          <div class="change-desc">${a.entityName} ${actionText}${a.details ? ': ' + a.details : '.'}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadStorageInfo() {
  if (!window.AetherStorage) return;
  try {
    const estimate = await AetherStorage.estimateStorage();
    const usedMB = (estimate.usage / (1024 * 1024)).toFixed(1);
    const storageEl = document.getElementById('storage-used');
    if (storageEl) storageEl.textContent = usedMB;
  } catch (err) {
    console.warn('Storage estimate failed:', err);
  }
}

async function loadBackupFolderInfo() {
  if (!window.AetherStorage) return;
  const info = await AetherStorage.getSavedDirectoryHandle();
  const container = document.getElementById('backup-folder-info');
  const nameEl = document.getElementById('backup-folder-name');
  if (info && info.name) {
    if (container) container.style.display = 'flex';
    if (nameEl) nameEl.textContent = info.name;
  } else {
    if (container) container.style.display = 'none';
  }
  updateLastBackupLocal();
}

// Status Last Backup → Local: tampilkan waktu backup terakhir (persist di localStorage)
function updateLastBackupLocal() {
  const pill = document.getElementById('last-backup-local');
  if (!pill) return;
  const ts = localStorage.getItem('awb_last_backup_local');
  if (ts) {
    pill.classList.remove('off');
    pill.classList.add('on');
    pill.innerHTML = '<iconify-icon icon="lucide:check" width="12"></iconify-icon>&nbsp;' + ts;
  } else {
    pill.classList.remove('on');
    pill.classList.add('off');
    pill.innerHTML = '<iconify-icon icon="lucide:minus" width="12"></iconify-icon>&nbsp;(-)';
  }
}

// ===== Storage Panel Actions =====
document.getElementById('btn-pick-folder')?.addEventListener('click', async () => {
  if (!window.AetherStorage || !AetherStorage.isSupported()) {
    alert('File System Access API tidak didukung di browser ini');
    return;
  }
  try {
    backupDirectoryHandle = await AetherStorage.pickDirectory();
    AetherStorage.saveDirectoryHandle(backupDirectoryHandle);
    loadBackupFolderInfo();
    alert('Folder backup dipilih: ' + backupDirectoryHandle.name);
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Pick folder failed:', err);
      alert('Gagal memilih folder: ' + err.message);
    }
  }
});

document.getElementById('btn-export-local')?.addEventListener('click', async () => {
  if (!currentProject) {
    alert('Tidak ada proyek aktif');
    return;
  }
  if (!backupDirectoryHandle) {
    alert('Pilih folder backup terlebih dahulu');
    return;
  }

  const btn = document.getElementById('btn-export-local');
  btn.disabled = true;
  btn.innerHTML = '<iconify-icon icon="lucide:loader" width="16" style="animation:spin 1s linear infinite;"></iconify-icon> Mengekspor...';

  try {
    const data = await AetherState.exportProject(currentProject.id);
    const result = await AetherStorage.exportToLocal(data, backupDirectoryHandle);
    const now = new Date().toLocaleString('id-ID');
    localStorage.setItem('awb_last_backup_local', now);
    const localPill = document.getElementById('last-backup-local');
    if (localPill) {
      localPill.classList.remove('off');
      localPill.classList.add('on');
      localPill.innerHTML = '<iconify-icon icon="lucide:check" width="12"></iconify-icon>&nbsp;' + now;
    }
    alert(`Berhasil mengekspor ${result.fileCount} file ke folder "${result.folderName}"`);
  } catch (err) {
    console.error('Export failed:', err);
    alert('Gagal ekspor: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<iconify-icon icon="lucide:file-down"></iconify-icon> Export to Local';
  }
});

document.getElementById('btn-import-local')?.addEventListener('click', async () => {
  if (!currentProject) {
    alert('Tidak ada proyek aktif');
    return;
  }
  if (!window.AetherStorage || !AetherStorage.isSupported()) {
    alert('File System Access API tidak didukung');
    return;
  }

  try {
    const dirHandle = await AetherStorage.pickDirectory();
    const data = await AetherStorage.importFromLocal(dirHandle);
    if (!data.project) {
      alert('File project.json tidak ditemukan di folder tersebut');
      return;
    }
    await AetherState.importProject(currentProject.id, data);
    alert('Import berhasil! Memuat ulang data...');
    location.reload();
  } catch (err) {
    console.error('Import failed:', err);
    alert('Gagal import: ' + err.message);
  }
});

document.getElementById('btn-clear-folder')?.addEventListener('click', () => {
  if (confirm('Hapus referensi folder backup?')) {
    AetherStorage.clearDirectoryHandle();
    backupDirectoryHandle = null;
    loadBackupFolderInfo();
  }
});

// Initialize
loadDashboardData();

// Listen for world change from sidebar
window.addEventListener('awb:world-change', (e) => {
  if (e.detail?.worldName) {
    location.href = 'dashboard.page.html?world=' + encodeURIComponent(e.detail.worldName);
  }
});
