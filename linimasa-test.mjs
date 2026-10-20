// Uji runtime halaman Linimasa (revisi: edit sync, create Faksi/Kelompok, layout list/grid)
import fs from "fs";
import { JSDOM } from "jsdom";

const ROOT = "/home/aethernova/Documents/aetherworldbuilding";
const html = fs.readFileSync(ROOT + "/pages/linimasa.page.html", "utf8");

const scripts = [
  ROOT + "/public/js/dexie.min.js",
  ROOT + "/public/js/aether-state.js",
  ROOT + "/public/js/awb-page-utils.js",
  ROOT + "/public/js/element-dunia/form-renderer.js"
];

const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "dangerously" });
const win = dom.window;
const doc = win.document;

let errors = [];
let alerts = [];
let confirmResult = true;
win.addEventListener("error", (e) => errors.push("window error: " + (e.message || e)));
win.addEventListener("unhandledrejection", (e) => errors.push("unhandledrejection: " + (e.reason && e.reason.message ? e.reason.message : e.reason)));
win.alert = (m) => alerts.push(m);
win.confirm = (m) => confirmResult;

const project = { id: 7, name: "Dunia Test" };
let events = [
  { id: 100, projectId: 7, name: "Perpecahan Besar", lastUpdated: "t", data: {
      type: "Bencana", era: "Era Permulaan",
      fields: { type: "Bencana", era: "Era Permulaan", cause: "Ledakan aetherial", consequence: "Kepulauan terbentuk", publicKnowledge: "Diketahui Umum", durasi: "1 hari" },
      imageUrl: "https://example.com/img.jpg", tags: ["bencana", "era-permulaan"],
      linkedElements: {
        tokohKunci: [{ id: 1, name: "Kael Dawnward", type: "Karakter" }],
        lokasi: [{ id: 10, name: "Pulau Aethelgard", type: "Lokasi" }],
        orangTerlibat: [{ id: 2, name: "Lira", type: "Karakter" }],
        faksiKelompok: [{ id: 11, name: "Ordo Api", type: "Faksi" }]
      },
      description: "Daratan utama pecah.", notes: "",
      major: true, location: "Pulau Aethelgard Barat", people: "Kael Dawnward, Lira"
  }}
];
let nextEventId = 200;
const fakeQuery = {
  getCharacters: async () => [{ id: 1, name: "Kael Dawnward" }, { id: 2, name: "Lira" }],
  getElements: async () => [
    { id: 10, name: "Pulau Aethelgard", type: "Lokasi" },
    { id: 11, name: "Ordo Api", type: "Faksi" },
    { id: 12, name: "Klan Bayu", type: "Kelompok" }
  ],
  getEvents: async () => events.slice(),
  addEvent: async (payload) => {
    const id = nextEventId++; const ev = { id, projectId: 7, name: payload.name, data: payload.data, lastUpdated: "t" };
    events.push(ev); return ev;
  },
  updateEvent: async (id, payload) => {
    const ev = events.find(e => e.id === id); Object.assign(ev, { name: payload.name, data: payload.data, lastUpdated: "t" }); return ev;
  },
  deleteEvent: async (id) => { events = events.filter(e => e.id !== id); },
  logActivity: async () => {},
  addCharacter: async (data) => ({ id: 901, name: data.name, data: data.data || {} }),
  addElement: async (data) => ({ id: 902, name: data.name, type: data.type, data: data.data || {} }),
  addEventCreate: async (payload) => { const id = nextEventId++; const ev = { id, projectId: 7, name: payload.name, data: payload.data, lastUpdated: "t" }; events.push(ev); return ev; }
};

let fails = [];
function check(cond, msg) {
  if (cond) { console.log("ok  :", msg); }
  else { fails.push(msg); console.error("FAIL:", msg); }
}
function $(s) { return doc.querySelector(s); }
function $$(s) { return Array.from(doc.querySelectorAll(s)); }
function mousedown(el) {
  el.dispatchEvent(new win.MouseEvent("mousedown", { bubbles: true, cancelable: true }));
}
function tick(ms = 120) { return new Promise(r => setTimeout(r, ms)); }
function setInput(sel, val) {
  const el = $(sel); el.value = val;
  el.dispatchEvent(new win.Event("input", { bubbles: true }));
}
function keyDown(sel, key) {
  const el = $(sel);
  el.dispatchEvent(new win.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

for (const p of scripts) {
  win.eval(fs.readFileSync(p, "utf8"));
}
win.AetherPageUtils.initPage = async () => ({ query: fakeQuery, project, setActiveProject: () => {} });
win.eval(fs.readFileSync(ROOT + "/public/js/linimasa.js", "utf8"));
win.eval(fs.readFileSync(ROOT + "/public/js/linimasa-detail.js", "utf8"));

await tick(300);

// ---------- 1. Render awal ----------
check($$(".timeline-event").length === 1, "1 peristiwa dirender saat init");
check($(".timeline-event").textContent.includes("Perpecahan Besar"), "peristiwa 100 ada");
check(!doc.body.textContent.includes("Ordo Api"), "faksi linked tidak di kartu (sidebar nanti)");
check($("#timeline-content .btn-action") === null, "tidak ada tombol btn-action duplikat di area timeline");

// ---------- 2. Edit sync ----------
$(".win-btn[title='Edit']").click();
await tick();
check($("#modal-peristiwa-title").textContent === "Edit Peristiwa", "judul Edit Peristiwa");
check($("[data-field='name']").value === "Perpecahan Besar", "nama terisi saat edit");
check($("[data-field='type']").value === "Bencana", "type terisi saat edit (fix sync)");
check($("[data-field='era']").value === "Era Permulaan", "era terisi saat edit (fix sync)");
check($("[data-field='cause']").value === "Ledakan aetherial", "cause terisi saat edit (fix sync)");
check($("[data-field='consequence']").value === "Kepulauan terbentuk", "consequence terisi saat edit (fix sync)");
check($("[data-image-url]").value === "https://example.com/img.jpg", "imageUrl terisi saat edit");
check($$(".badge[data-linked-id='11']").length === 1, "chip faksi Ordo Api ter render saat edit");

// ubah semua field dan simpan
setInput("[data-field='name']", "Perpecahan Besar Revisi");
setInput("[data-field='type']", "Perang");
setInput("[data-field='era']", "Era Baru");
setInput("[data-field='cause']", "Penyebab baru");
setInput("[data-field='consequence']", "Konsekuensi baru");
for (const tag of ["bencana", "era-permulaan"]) {
  const tagInp = $("[data-tag-input]");
  tagInp.value = tag;
  tagInp.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
}
$("#modal-peristiwa .btn-confirm").click();
await tick(250);
const updated = events.find(e => e.id === 100);
check(updated && updated.name === "Perpecahan Besar Revisi", "nama update tersimpan");
check(updated && updated.data.fields.type === "Perang", "type update tersimpan di fields");
check(updated && updated.data.fields.era === "Era Baru", "era update tersimpan di fields");
check(updated && updated.data.fields.cause === "Penyebab baru", "cause update tersimpan di fields");
check(updated && updated.data.major === true, "field legacy major dipertahankan saat edit");
check(updated && updated.data.location === "Pulau Aethelgard Barat", "field legacy location dipertahankan saat edit");
check(updated && updated.data.people === "Kael Dawnward, Lira", "field legacy people dipertahankan saat edit");
await tick(200);
check(doc.body.textContent.includes("Perpecahan Besar Revisi"), "update muncul di timeline");

// ---------- 3. Tambah + create Faksi & Kelompok via dropdown ----------
win.openPeristiwaModal(); await tick();
  check($("#modal-peristiwa-title").textContent === "Tambah Peristiwa", "judul Tambah Peristiwa");
const fkInp = $("[data-linked-input][data-linked-type='Faksi,Kelompok']");
fkInp.value = "Faksi Baru Linimasa";
fkInp.dispatchEvent(new win.Event("input", { bubbles: true }));
await tick(150);
const createOps = $$(".linked-opt.create");
check(createOps.length >= 1, "dropdown opsi create muncul");
const opFaksi = createOps.find(o => o.textContent.includes("(Faksi)"));
check(opFaksi !== undefined, "opsi 'Buat ... (Faksi)' ada");
mousedown(opFaksi);
await tick(250);
const chipsAfterFaksi = $$("[data-linked-list] .badge");
console.log("DEBUG chips after Faksi:", chipsAfterFaksi.map(c => c.dataset.linkedId + ":" + c.dataset.linkedType + "=" + c.textContent.trim()));
check($$(".badge[data-linked-id='902'][data-linked-type='Faksi']").length === 1, "Faksi baru dibuat dan jadi chip");

// buka lagi untuk create Kelompok
win.openPeristiwaModal(); await tick();
const fkInp2 = $("[data-linked-input][data-linked-type='Faksi,Kelompok']");
fkInp2.value = "Kelompok Baru Linimasa";
fkInp2.dispatchEvent(new win.Event("input", { bubbles: true }));
await tick(150);
const createOps2 = $$(".linked-opt.create");
const opKelompok = createOps2.find(o => o.textContent.includes("(Kelompok)"));
check(opKelompok !== undefined, "opsi 'Buat ... (Kelompok)' ada");
mousedown(opKelompok);
await tick(250);
const chipsAfterKelompok = $$("[data-linked-list] .badge");
console.log("DEBUG chips after Kelompok:", chipsAfterKelompok.map(c => c.dataset.linkedId + ":" + c.dataset.linkedType + "=" + c.textContent.trim()));
check($$(".badge[data-linked-id='902'][data-linked-type='Kelompok']").length === 1, "Kelompok baru dibuat dan jadi chip");

// ---------- 4. Filter ----------
const typeSel = $("#timeline-type-filter");
typeSel.value = "Perang";
typeSel.dispatchEvent(new win.Event("change", { bubbles: true }));
await tick(350);
check($$(".timeline-event").length === 1, "filter Perang → 1 perisiwa (hanya 1 event ada)");
typeSel.value = "Semua Type";
typeSel.dispatchEvent(new win.Event("change", { bubbles: true }));
await tick(350);
check($$(".timeline-event").length === 1, "kembali Semua Type → 1 perisiwa");

setInput("#timeline-search", "Perpecahan");
await tick(350);
check($$(".timeline-event").length === 1, "cari 'Perpecahan' → 1");
setInput("#timeline-search", "");
await tick(350);
check($$(".timeline-event").length === 1, "hapus cari → 1");

// tag
const tagBtns = $$("#timeline-tag-filter [data-tag-filter]");
console.log("DEBUG tag buttons:", tagBtns.map(b => b.textContent));
const tagEra = tagBtns.find(b => b.getAttribute("data-tag-filter") === "era-permulaan");
check(tagEra !== undefined, "tag filter 'era-permulaan' tersedia");
if (tagEra) {
  tagEra.click(); await tick(350);
  check($$(".timeline-event").length === 1, "filter tag era-permulaan → 1");
  const tagEra2 = $$("#timeline-tag-filter [data-tag-filter]").find(b => b.getAttribute("data-tag-filter") === "era-permulaan");
  tagEra2.click(); await tick(350);
  check($$(".timeline-event").length === 1, "batalkan tag → 1");
}

// ---------- 5. Layout class grid ----------
doc.querySelector('[data-view="grid"]').click();
await tick();
check(doc.getElementById("timeline-content").classList.contains("view-grid"), "class view-grid aktif");
check($$(".event-main").length === 1, "wrapper .event-main ada di grid");
doc.querySelector('[data-view="list"]').click();
await tick();
check(!doc.getElementById("timeline-content").classList.contains("view-grid"), "kembali ke list");

// ---------- 6. Sidebar detail peristiwa ----------
const panel = $("#event-detail-panel");
check(panel !== null, "aside panel detail peristiwa ada di halaman");
check(typeof win._linimasaGetEvent === "function" && win._linimasaGetEvent(100), "helper lookup event tersedia");
check(Array.isArray(win._linimasaSchema), "schema peristiwa dibagikan ke panel");
check($(".event-card").getAttribute("data-id") === "100", "kartu memuat data-id peristiwa");

$(".event-card").click();
await tick(50);
check(panel.classList.contains("open"), "klik kartu membuka panel detail");
check($(".elem-detail-name").textContent.includes("Perpecahan Besar"), "nama peristiwa tampil di panel");
check($(".elem-detail-sub").textContent.includes("Perang"), "sub panel memuat tipe peristiwa");
check($("[data-detail-desc]").textContent.includes("Daratan utama pecah"), "deskripsi tampil di panel");
const sectionsText = $(".elem-detail-sections").textContent;
check(sectionsText.includes("Era Baru"), "era tampil di section panel");
check(sectionsText.includes("Penyebab baru"), "penyebab tampil di section panel");
check(sectionsText.includes("Konsekuensi baru"), "konsekuensi tampil di section panel");
check(sectionsText.includes("Ordo Api"), "chip relasi faksi tampil di section panel");
check(sectionsText.includes("Pulau Aethelgard"), "chip relasi lokasi tampil di section panel");

const firstHead = $(".elem-detail-sections .elem-section-head");
firstHead.click();
check(firstHead.closest(".elem-section").classList.contains("collapsed"), "section panel bisa dilipat");
firstHead.click();

$("[data-detail-edit]").click();
await tick(200);
check($("#modal-peristiwa-title").textContent === "Edit Peristiwa", "tombol Edit panel buka modal edit");
win.closePeristiwaModal();

doc.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
check(!panel.classList.contains("open"), "Escape menutup panel");

$(".event-card").click();
check(panel.classList.contains("open"), "panel terbuka lagi");
$("[data-detail-close]").click();
check(!panel.classList.contains("open"), "tombol Tutup menutup panel");

$(".event-card .win-btn[title='Edit']").click();
await tick(200);
check($("#modal-peristiwa-title").textContent === "Edit Peristiwa", "Edit dari kartu tetap buka modal edit");
check(!panel.classList.contains("open"), "klik tombol Edit kartu tidak membuka panel detail");
win.closePeristiwaModal();

// ---------- 7. Data minim, metadata tersembunyi, dan hapus ----------
events.push({ id: 301, projectId: 7, name: "Peristiwa Ringkas", data: {
  fields: { era: "Era Sunyi", type: "Politik" }, tags: [], linkedElements: {}
} });
confirmResult = true;
// Panel sedang menampilkan peristiwa 100 → harus ikut tertutup saat dihapus
$(".event-card").click();
check($("#event-detail-panel").classList.contains("open"), "panel terbuka sebelum hapus");
await win.deletePeristiwa(100);
await tick(200);
check(!events.some(e => e.id === 100), "event 100 dihapus");
check(!$("#event-detail-panel").classList.contains("open"), "panel tertutup otomatis setelah peristiwa dihapus");
const cardHost = doc.getElementById("timeline-content");
check(!cardHost.textContent.includes("Ordo Api"), "metadata linked tidak tampil di kartu");
check(!cardHost.textContent.includes("Lokasi"), "lokasi tidak tampil di kartu");
check(doc.querySelector('[data-view="list"]') && doc.querySelector('[data-view="grid"]'), "kontrol list dan grid tersedia");
doc.querySelector('[data-view="grid"]').click();
const sparseCard = $$(".event-card").find(card => card.textContent.includes("Peristiwa Ringkas"));
check(!!sparseCard, "kartu peristiwa minim data dirender");
check(sparseCard && !sparseCard.querySelector(".event-cause-conseq"), "kotak penyebab/konsekuensi kosong disembunyikan");
check(sparseCard && !sparseCard.querySelector(".event-sep"), "pemisah tanpa konten bawah disembunyikan");
check(sparseCard && sparseCard.querySelector(".event-thumb .event-overlay .event-meta"), "meta tampil di atas gambar grid");
check(sparseCard && !sparseCard.querySelector(".event-thumb img"), "gambar kosong pakai placeholder");
await win.deletePeristiwa(301);
await tick(200);
check($$(".timeline-event").length === 0, "timeline kosong setelah seluruh peristiwa dihapus");

// ---------- 8. Validasi nama duplikat ----------
win.openPeristiwaModal(); await tick();
// auto-create peristiwa "aaa" lewat linked Peristiwa Terkait (skenario yang ditemukan USER)
const ptInp = $("[data-linked-input][data-linked-type='Peristiwa']");
ptInp.value = "aaa";
ptInp.dispatchEvent(new win.Event("input", { bubbles: true }));
await tick(150);
const optAaa = $$(".linked-opt.create").find(o => o.textContent.includes('Buat "aaa"'));
check(optAaa !== undefined, "opsi buat peristiwa 'aaa' muncul di dropdown");
mousedown(optAaa);
await tick(250);
check(events.filter(e => e.name === "aaa").length === 1, "peristiwa 'aaa' dibuat sekali via auto-create");

// nama form sama persis dengan peristiwa hasil auto-create → simpan harus ditolak
setInput("[data-field='name']", "aaa");
alerts.length = 0;
$("#modal-peristiwa .btn-confirm").click();
await tick(250);
check(events.filter(e => e.name === "aaa").length === 1, "simpan nama duplikat ditolak");
check(alerts.some(a => a.includes("sudah ada")), "notifikasi nama duplikat muncul");
check($("#modal-peristiwa").classList.contains("open"), "modal tetap terbuka setelah duplikat ditolak");

// beda kapital + spasi tepi tetap dianggap duplikat
setInput("[data-field='name']", "AAA ");
alerts.length = 0;
$("#modal-peristiwa .btn-confirm").click();
await tick(250);
check(events.filter(e => e.name.toLowerCase() === "aaa").length === 1, "duplikat beda kapital + spasi tepi ditolak");

// ganti nama unik → boleh
setInput("[data-field='name']", "Peristiwa Unik");
$("#modal-peristiwa .btn-confirm").click();
await tick(250);
check(events.some(e => e.name === "Peristiwa Unik"), "nama unik tersimpan setelah duplikat ditolak");

// rename ke nama milik peristiwa lain → ditolak
const unikId = events.find(e => e.name === "Peristiwa Unik").id;
await win.openPeristiwaModal(unikId); await tick();
setInput("[data-field='name']", "aaa");
alerts.length = 0;
$("#modal-peristiwa .btn-confirm").click();
await tick(250);
check(events.find(e => e.id === unikId).name === "Peristiwa Unik", "rename ke nama peristiwa lain ditolak");

// rename ke nama sendiri (dengan spasi tepi) → tetap boleh
setInput("[data-field='name']", "Peristiwa Unik ");
$("#modal-peristiwa .btn-confirm").click();
await tick(250);
check(events.find(e => e.id === unikId).name === "Peristiwa Unik", "rename ke nama sendiri tetap boleh");
win.closePeristiwaModal();

// ---------- Ringkasan ----------
console.log("\n=====");
if (fails.length) {
  console.error("GAGAL " + fails.length + " uji:");
  fails.forEach(f => console.error(" - " + f));
  if (errors.length) { console.error("JS errors:"); errors.forEach(e => console.error(" - " + e)); }
  process.exit(1);
}
console.log("Semua uji berlus. JS errors:", errors.length ? errors : "(tidak ada)");
process.exit(0);

