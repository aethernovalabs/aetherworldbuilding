(function () {
  "use strict";
  window.AwbElementSchemas = window.AwbElementSchemas || {};
  window.AwbElementSchemas.Item = [
    {
      title: "Informasi Umum",
      fields: [
        { key: "tipeItem", label: "Tipe Item", kind: "select",
          options: ["Senjata", "Armor", "Artefak", "Ramuan", "Buku", "Lainnya"] },
        { key: "kelangkaan", label: "Kelangkaan", kind: "select",
          options: ["Umum", "Langka", "Sangat Langka", "Unik", "Legendaris"] },
        { key: "kondisi", label: "Kondisi", kind: "select",
          options: ["Baik", "Rusak Ringan", "Rusak Berat", "Hancur"] },
        { key: "nilai", label: "Nilai", kind: "text" },
        { key: "berat", label: "Berat", kind: "text" },
        { key: "dimensi", label: "Dimensi", kind: "text" }
      ]
    },
    {
      title: "Sifat",
      fields: [
        { key: "properti", label: "Properti", kind: "text" },
        { key: "sifatMagic", label: "Sifat Magic", kind: "text" },
        { key: "bahan", label: "Bahan", kind: "text" },
        { key: "effect", label: "Effect", kind: "text" },
        { key: "batasan", label: "Batasan", kind: "text" },
        { key: "persyaratan", label: "Persyaratan", kind: "text" },
        { key: "asal", label: "Asal", kind: "textarea" },
        { key: "pentingnyaBudaya", label: "Pentingnya Budaya", kind: "textarea" }
      ]
    },
    {
      title: "Relasi",
      fields: [
        { key: "pemilikSaatIni", label: "Pemilik Saat Ini", kind: "text" },
        { key: "pemilikSebelumnya", label: "Pemilik Sebelumnya", kind: "text" },
        { key: "lokasiSaatIni", label: "Lokasi Saat Ini", kind: "linked", linkedType: "Lokasi" },
        { key: "itemTerkait", label: "Item Terkait", kind: "linked", linkedType: "Item" },
        { key: "faksiTerkait", label: "Faksi Terkait", kind: "linked", linkedType: "Faksi" },
        { key: "kelompokTerkait", label: "Kelompok Terkait", kind: "linked", linkedType: "Kelompok" }
      ]
    }
  ];
})();
