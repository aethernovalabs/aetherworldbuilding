(function () {
  "use strict";
  window.AwbElementSchemas = window.AwbElementSchemas || {};
  window.AwbElementSchemas["Sistem Sihir"] = [
    {
      title: "Informasi Umum",
      fields: [
        { key: "penerimaanSosial", label: "Penerimaan Sosial", kind: "select",
          options: ["Diterima", "Netral", "Kontroversial", "Terlarang"] },
        { key: "metodePembelajaran", label: "Metode Pembelajaran", kind: "select",
          options: ["Studi", "Bawaan", "Ritual", "Pewarisan", "Kontrak"] },
        { key: "sumberKekuatan", label: "Sumber Kekuatan", kind: "textarea" },
        { key: "batasan", label: "Batasan", kind: "text" },
        { key: "biaya", label: "Biaya", kind: "text" },
        { key: "praktisi", label: "Praktisi", kind: "text" }
      ]
    },
    {
      title: "Sekolah Sihir",
      fields: [
        { key: "sekolahSihir", label: "Sekolah Sihir (daftar)", kind: "list",
          itemSchema: {
            fields: [
              { key: "nama", label: "Nama Sekolah", kind: "text" },
              { key: "fokus", label: "Fokus", kind: "text" },
              { key: "mantra", label: "Mantra Umum", kind: "text" }
            ]
          }
        },
        { key: "artefak", label: "Artefak", kind: "linked", linkedType: "Item" },
        { key: "sihirTerlarang", label: "Sihir Terlarang", kind: "text" }
      ]
    }
  ];
})();
