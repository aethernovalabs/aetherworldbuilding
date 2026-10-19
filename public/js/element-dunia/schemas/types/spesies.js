(function () {
  "use strict";
  window.AwbElementSchemas = window.AwbElementSchemas || {};
  window.AwbElementSchemas.Spesies = [
    {
      title: "Biologi",
      fields: [
        { key: "jenisMakanan", label: "Jenis Makanan", kind: "select",
          options: ["Karnivora", "Herbivora", "Omnivora", "Fotosintesis", "Energi"] },
        { key: "rentangHidup", label: "Rentang Hidup", kind: "text" },
        { key: "tinggiRata", label: "Tinggi Rata-rata", kind: "text" },
        { key: "asalDunia", label: "Asal Dunia", kind: "text" },
        { key: "ciriFisik", label: "Ciri Fisik", kind: "text" },
        { key: "kemampuanKhusus", label: "Kemampuan Khusus", kind: "text" }
      ]
    },
    {
      title: "Budaya",
      fields: [
        { key: "budaya", label: "Budaya", kind: "textarea" },
        { key: "strukturSosial", label: "Struktur Sosial", kind: "textarea" }
      ]
    },
    {
      title: "Relasi",
      fields: [
        { key: "sekutu", label: "Spesies Sekutu", kind: "linked", linkedType: "Spesies" },
        { key: "netral", label: "Spesies Netral", kind: "linked", linkedType: "Spesies" },
        { key: "musuh", label: "Spesies Musuh", kind: "linked", linkedType: "Spesies" },
        { key: "bahasa", label: "Bahasa", kind: "linked", linkedType: "Bahasa" },
        { key: "pekerjaan", label: "Pekerjaan", kind: "linked", linkedType: "Pekerjaan" }
      ]
    }
  ];
})();
