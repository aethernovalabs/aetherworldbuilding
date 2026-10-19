// Registry semua schema Element Dunia
// Memuat 14 file per-tipe di folder types/, lalu expose ke window.AwbElementForm
(function () {
  "use strict";

  // Daftar tipe bawaan. Urutan dipakai sidebar + kategori.
  var ELEMENT_TYPES = [
    "Makhluk", "Faksi", "Pekerjaan", "Lokasi", "Agama", "Sistem Sihir",
    "Teknologi", "Bahasa", "Item", "Kelompok", "Dewa", "Gelar", "Spesies", "Power Tier"
  ];

  // Ikon per tipe (untuk kartu + sidebar)
  var ELEMENT_ICONS = {
    "Makhluk": "lucide:bug",
    "Faksi": "lucide:flag",
    "Pekerjaan": "lucide:briefcase",
    "Lokasi": "lucide:map-pin",
    "Agama": "lucide:landmark",
    "Sistem Sihir": "lucide:zap",
    "Teknologi": "lucide:cpu",
    "Bahasa": "lucide:languages",
    "Item": "lucide:package",
    "Kelompok": "lucide:users",
    "Dewa": "lucide:sparkles",
    "Gelar": "lucide:award",
    "Spesies": "lucide:leaf",
    "Power Tier": "lucide:trending-up",
    "Element Custom": "lucide:puzzle"
  };

  // Field inti (selalu ada di luar schema): name, image, description, tags
  // Skema tipe hanya menambahkan field tambahan di luar 4 field inti.
  var BASE_FIELDS = [
    { key: "name", label: "Nama", kind: "text", required: true },
    { key: "image", label: "Gambar", kind: "image" },
    { key: "description", label: "Deskripsi", kind: "textarea" },
    { key: "tags", label: "Tag", kind: "tags" },
    { key: "extraFields", label: "Bidang Ekstra", kind: "extra" },
    { key: "notes", label: "Catatan Tambahan", kind: "textarea" }
  ];

  // Ambil schema untuk sebuah tipe (custom atau bawaan)
  function getSchema(type) {
    var schemas = window.AwbElementSchemas || {};
    if (schemas[type]) return schemas[type];
    // Fallback: tipe tidak punya schema → hanya field inti
    return [];
  }

  // Tipe custom (diisi dari IndexedDB oleh orkestrator)
  var customTypes = [];

  function getAllTypes() {
    return ELEMENT_TYPES.concat(customTypes);
  }

  function setCustomTypes(list) {
    customTypes = Array.isArray(list) ? list : [];
  }

  // Loader untuk semua file per-tipe
  // Dipanggil sekali oleh orkestrator via window.AwbElementForm.init()
  function init() {
    // Setiap file types/*.js sudah mendaftarkan dirinya ke window.AwbElementSchemas
    // pada evaluasi. Tidak ada langkah tambahan di sini.
  }

  window.AwbElementForm = {
    init: init,
    getSchema: getSchema,
    getAllTypes: getAllTypes,
    getIcons: function () { return ELEMENT_ICONS; },
    getBuiltinTypes: function () { return ELEMENT_TYPES; },
    getBaseFields: function () { return BASE_FIELDS; },
    setCustomTypes: setCustomTypes
  };
})();
