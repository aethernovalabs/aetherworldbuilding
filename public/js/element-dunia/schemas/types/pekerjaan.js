(function () {
  "use strict";
  window.AwbElementSchemas = window.AwbElementSchemas || {};
  window.AwbElementSchemas.Pekerjaan = [
    {
      title: "Informasi Umum",
      fields: [
        { key: "kategori", label: "Kategori", kind: "select",
          options: ["Manual", "Administratif", "Kreatif", "Teknis", "Layanan", "Akademik", "Militer"] },
        { key: "statusSosial", label: "Status Sosial", kind: "select",
          options: ["Rendah", "Menengah", "Tinggi", "Elite"] },
        { key: "penghasilan", label: "Penghasilan Rata-Rata", kind: "text" },
        { key: "pelatihan", label: "Pelatihan Diperlukan", kind: "text" }
      ]
    },
    {
      title: "Detail",
      fields: [
        { key: "keterampilan", label: "Keterampilan yang Dibutuhkan", kind: "text" },
        { key: "ciriUmum", label: "Ciri Umum", kind: "text" },
        { key: "kondisiKerja", label: "Kondisi Kerja", kind: "textarea" }
      ]
    }
  ];
})();
