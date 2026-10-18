// ===== Linimasa Logic =====

document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const c = document.getElementById('timeline-content');
    if (c) {
      c.classList.remove('view-grid');
      if (btn.dataset.view === 'grid') c.classList.add('view-grid');
    }
  });
});

document.addEventListener('click', e => {
  const edel = e.target.closest('.event-del');
  if (edel) {
    const ev = edel.closest('.timeline-event');
    if (ev) ev.remove();
    return;
  }
  const add = e.target.closest('.extra-add,.extra-add-top');
  if (add) {
    const w = add.closest('.extra-wrap');
    const l = w?.querySelector('.extra-list');
    const f = l?.querySelector('.extra-item');
    if (l && f) l.appendChild(f.cloneNode(true));
    return;
  }
  const del = e.target.closest('.extra-del');
  if (del) {
    const w = del.closest('.extra-wrap');
    const l = w?.querySelector('.extra-list');
    const it = del.closest('.extra-item');
    if (l && it && l.querySelectorAll('.extra-item').length > 1) it.remove();
    return;
  }
});

// Initialize with AetherPageUtils
async function initLinimasaPage() {
  if (!window.AetherPageUtils) return;
  var utils = await window.AetherPageUtils.initPage();
  if (!utils.query) return;
  
  // Load events from database
  var events = await utils.query.getEvents();
  renderTimeline(events);
  
  window.linimasaQuery = utils.query;
}

function renderTimeline(events) {
  var container = document.getElementById('timeline-content');
  if (!container) return;
  
  var track = container.querySelector('.timeline-track');
  if (!track) return;
  
  if (!events || events.length === 0) {
    track.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-faint);font-size:0.85rem;">Belum ada peristiwa<br><button class="btn-action" style="margin-top:0.5rem;" onclick="document.getElementById(\'modal-peristiwa\')?.classList.add(\'open\')">+ Tambah Peristiwa</button></div>';
    return;
  }
  
  // Group events by era
  var eventsByEra = {};
  events.forEach(function(e) {
    var era = e.data?.era || 'Era Tidak Diketahui';
    if (!eventsByEra[era]) eventsByEra[era] = [];
    eventsByEra[era].push(e);
  });
  
  var html = '';
  Object.entries(eventsByEra).forEach(function([era, eraEvents]) {
    html += '<div class="era-section">';
    html += '<div class="era-title"><iconify-icon icon="lucide:sun"></iconify-icon> ' + era + '</div>';
    html += '<div class="timeline-track">';
    eraEvents.forEach(function(ev) {
      var isMajor = ev.data?.major === true;
      html += '<div class="timeline-event' + (isMajor ? ' major' : '') + '">';
      html += '<div class="event-card">';
      html += '<div class="event-header">';
      html += '<div class="event-name">' + (ev.name || 'Unknown') + '</div>';
      html += '<div style="display:flex;gap:0.3rem;align-items:center;">';
      html += '<button class="win-btn" title="Edit" onclick="event.stopPropagation();openEventModal(' + ev.id + ')"><iconify-icon icon="lucide:pen-line" width="14"></iconify-icon></button>';
      html += '<button class="win-btn event-del" title="Hapus" style="color:var(--danger);" onclick="event.stopPropagation();deleteEvent(' + ev.id + ')"><iconify-icon icon="lucide:trash-2" width="14"></iconify-icon></button>';
      html += '</div>';
      html += '</div>';
      html += '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.5rem;">';
      html += '<span class="badge badge-' + (ev.data?.type || 'lainnya').toLowerCase() + '">' + (ev.data?.type || 'Lainnya') + '</span>';
      html += '<span class="badge badge-purple">Era: ' + era + '</span>';
      html += '</div>';
      html += '<div class="event-desc">' + (ev.data?.description || ev.data?.deskripsi || '-') + '</div>';
      html += '<div style="margin-top:0.5rem;font-size:0.78rem;color:var(--text-faint);display:flex;flex-direction:column;gap:0.25rem;">';
      if (ev.data?.cause) html += '<div><strong style="color:var(--text-muted);">Penyebab:</strong> ' + ev.data.cause + '</div>';
      if (ev.data?.consequence) html += '<div><strong style="color:var(--text-muted);">Konsekuensi:</strong> ' + ev.data.consequence + '</div>';
      if (ev.data?.location) html += '<div><strong style="color:var(--text-muted);">Lokasi:</strong> ' + ev.data.location + '</div>';
      if (ev.data?.people) html += '<div><strong style="color:var(--text-muted);">Orang Terlibat:</strong> ' + ev.data.people + '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div></div>';
  });
  
  track.innerHTML = html;
}

window.openEventModal = function(id) {
  document.getElementById('modal-peristiwa')?.classList.add('open');
};

window.deleteEvent = async function(id) {
  if (!confirm('Hapus peristiwa ini?')) return;
  if (!window.linimasaQuery) return;
  await window.linimasaQuery.deleteEvent(id);
  await window.linimasaQuery.logActivity('delete', 'event', id, 'Event', 'Dihapus dari linimasa');
  var events = await window.linimasaQuery.getEvents();
  renderTimeline(events);
};

initLinimasaPage();
