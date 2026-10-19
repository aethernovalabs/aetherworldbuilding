// Skema Makhluk — form Element Dunia
// Setiap group = { title, fields: [{ key, label, kind, options?, linkedType?, placeholder? }] }
(function () {
  "use strict";
  window.AwbElementSchemas = window.AwbElementSchemas || {};
  window.AwbElementSchemas.Makhluk = [
    {
      title: "Karakteristik",
      fields: [
        { key: "typeMakhluk", label: "Type Makhluk", kind: "select",
          options: ["Natural", "Magic", "Hybrid", "Spirit", "Undead", "Konstruk", "Elemental"] },
        { key: "perilaku", label: "Perilaku", kind: "select",
          options: ["Agresif", "Netral", "Pasif", "Teritorial", "Sosial", "Soliter"] },
        { key: "kecerdasan", label: "Kecerdasan", kind: "select",
          options: ["Hewan", "Sapid", "Sentient"] },
        { key: "ukuran", label: "Ukuran", kind: "select",
          options: ["Tiny", "Small", "Medium", "Large", "Huge", "Colossal"] },
        { key: "makanan", label: "Makanan", kind: "select",
          options: ["Daging", "Tumbuhan", "Omnivore", "Energi"] },
        { key: "rentangHidup", label: "Rentang Hidup", kind: "text" },
        { key: "ukuranRata", label: "Ukuran Rata-rata", kind: "text" }
      ]
    },
    {
      title: "Biologi & Kemampuan",
      fields: [
        { key: "ciriFisik", label: "Ciri Fisik", kind: "textarea" },
        { key: "kemampuan", label: "Kemampuan", kind: "textarea" },
        { key: "kelemahan", label: "Kelemahan", kind: "textarea" },
        { key: "sifatMagic", label: "Sifat Magic", kind: "textarea" },
        { key: "dapatDijinakan", label: "Dapat Dijinakan", kind: "bool" },
        { key: "pentingnyaBudaya", label: "Pentingnya Budaya", kind: "textarea" },
        { key: "strukturSosial", label: "Struktur Sosial", kind: "textarea" }
      ]
    },
    {
      title: "Habitat",
      fields: [
        { key: "habitatText", label: "Habitat", kind: "text" },
        { key: "lokasiDiketahuiText", label: "Lokasi Diketahui", kind: "text" },
        { key: "habitat", label: "Habitat (Linked)", kind: "linked", linkedType: "Lokasi" },
        { key: "lokasiDiketahui", label: "Lokasi Diketahui (Linked)", kind: "linked", linkedType: "Lokasi" }
      ]
    }
  ];
})();
