(function () {
  "use strict";
  window.AwbElementSchemas = window.AwbElementSchemas || {};
  window.AwbElementSchemas.Lokasi = [
    {
      title: "Informasi Umum",
      fields: [
        { key: "tipeLokasi", label: "Tipe Lokasi", kind: "select",
          options: ["Kota", "Desa", "Hutan", "Gunung", "Laut", "Pulau", "Reruntuhan", "Benteng", "Dunia", "Dimensi"] },
        { key: "iklim", label: "Iklim", kind: "text" },
        { key: "populasi", label: "Populasi", kind: "text" },
        { key: "tipePemerintahan", label: "Tipe Pemerintahan", kind: "text" },
        { key: "mataUang", label: "Mata Uang", kind: "text" }
      ]
    },
    {
      title: "Geografi",
      fields: [
        { key: "medan", label: "Medan", kind: "text" },
        { key: "fiturTerkemuka", label: "Fitur Terkemuka", kind: "text" },
        { key: "ekonomi", label: "Ekonomi", kind: "text" },
        { key: "pertahanan", label: "Pertahanan", kind: "text" },
        { key: "ancaman", label: "Ancaman", kind: "text" }
      ]
    },
    {
      title: "Sosial",
      fields: [
        { key: "budaya", label: "Budaya", kind: "textarea" },
        { key: "strukturSosial", label: "Struktur Sosial", kind: "textarea" }
      ]
    },
    {
      title: "Relasi",
      fields: [
        { key: "lokasiInduk", label: "Lokasi Induk", kind: "linked", linkedType: "Lokasi" },
        { key: "bahasa", label: "Bahasa", kind: "linked", linkedType: "Bahasa" }
      ]
    }
  ];
})();
