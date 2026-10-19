(function () {
  "use strict";
  window.AwbElementSchemas = window.AwbElementSchemas || {};
  window.AwbElementSchemas["Power Tier"] = [
    {
      title: "Informasi Umum",
      fields: [
        { key: "type", label: "Type", kind: "select",
          options: ["Grade", "Level", "Tier", "Rank"] },
        { key: "kesulitan", label: "Kesulitan", kind: "select",
          options: ["Mudah", "Sedang", "Sulit", "Sangat Sulit", "Hampir Mustahil"] },
        { key: "populasi", label: "Populasi", kind: "select",
          options: ["Sangat Sedikit", "Sedikit", "Sedang", "Banyak"] }
      ]
    },
    {
      title: "Detail",
      fields: [
        { key: "persyaratan", label: "Persyaratan", kind: "textarea" },
        { key: "sejarah", label: "Sejarah", kind: "textarea" },
        { key: "batasan", label: "Batasan", kind: "textarea" }
      ]
    },
    {
      title: "Relasi",
      fields: [
        { key: "lebihTinggi", label: "Lebih Tinggi Dari", kind: "linked", linkedType: "Power Tier" },
        { key: "lebihRendah", label: "Lebih Rendah Dari", kind: "linked", linkedType: "Power Tier" }
      ]
    }
  ];
})();
