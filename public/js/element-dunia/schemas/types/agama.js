(function () {
  "use strict";
  window.AwbElementSchemas = window.AwbElementSchemas || {};
  window.AwbElementSchemas.Agama = [
    {
      title: "Informasi Umum",
      fields: [
        { key: "jumlahPengikut", label: "Jumlah Pengikut", kind: "text" },
        { key: "pengaruh", label: "Pengaruh", kind: "select",
          options: ["Sangat Rendah", "Rendah", "Sedang", "Tinggi", "Sangat Tinggi"] },
        { key: "keyakinan", label: "Keyakinan", kind: "text" },
        { key: "praktik", label: "Praktik", kind: "text" },
        { key: "teksSuci", label: "Teks Suci", kind: "text" },
        { key: "kuil", label: "Kuil", kind: "text" }
      ]
    },
    {
      title: "Relasi",
      fields: [
        { key: "lokasi", label: "Lokasi", kind: "linked", linkedType: "Lokasi" }
      ]
    }
  ];
})();
