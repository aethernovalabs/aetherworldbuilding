(function () {
  "use strict";
  window.AwbElementSchemas = window.AwbElementSchemas || {};
  window.AwbElementSchemas.Teknologi = [
    {
      title: "Informasi Umum",
      fields: [
        { key: "tingkatTeknologi", label: "Tingkat Teknologi", kind: "select",
          options: ["Primitif", "Kuno", "Modern", "Futuristik", "Magitek"] },
        { key: "kategori", label: "Kategori", kind: "select",
          options: ["Senjata", "Transportasi", "Komunikasi", "Medis", "Energi", "Lainnya"] },
        { key: "kelangkaan", label: "Kelangkaan", kind: "select",
          options: ["Umum", "Langka", "Sangat Langka", "Unik"] }
      ]
    },
    {
      title: "Detail",
      fields: [
        { key: "fungsional", label: "Fungsional", kind: "textarea" },
        { key: "pencipta", label: "Pencipta", kind: "text" },
        { key: "pengguna", label: "Pengguna", kind: "text" },
        { key: "persyaratan", label: "Persyaratan", kind: "text" },
        { key: "efekSamping", label: "Efek Samping", kind: "text" },
        { key: "terkait", label: "Teknologi Terkait", kind: "text" }
      ]
    }
  ];
})();
