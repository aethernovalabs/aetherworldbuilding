(function () {
  "use strict";
  window.AwbElementSchemas = window.AwbElementSchemas || {};
  window.AwbElementSchemas.Dewa = [
    {
      title: "Informasi Umum",
      fields: [
        { key: "typeDewa", label: "Type Dewa", kind: "select",
          options: ["Dewa", "Dewi", "Roh", "Entitas", "Primordial"] },
        { key: "penyelarasan", label: "Penyelarasan", kind: "select",
          options: ["Baik", "Netral", "Jahat", "Chaotic", "Lawful"] },
        { key: "tingkatKekuatan", label: "Tingkat Kekuatan", kind: "select",
          options: ["Rendah", "Menengah", "Tinggi", "Sangat Tinggi", "Primordial"] },
        { key: "intervensi", label: "Intervensi", kind: "select",
          options: ["Pasif", "Jarang", "Kadang", "Sering", "Aktif"] },
        { key: "domain", label: "Domain", kind: "text" },
        { key: "symbol", label: "Symbol", kind: "text" }
      ]
    },
    {
      title: "Detail",
      fields: [
        { key: "deskripsiFisik", label: "Deskripsi Fisik", kind: "textarea" },
        { key: "pengikut", label: "Pengikut", kind: "text" },
        { key: "mitos", label: "Mitos", kind: "text" },
        { key: "doa", label: "Doa", kind: "text" },
        { key: "persembahan", label: "Persembahan", kind: "text" },
        { key: "manifestasi", label: "Manifestasi", kind: "text" },
        { key: "kodeMoral", label: "Kode Moral", kind: "text" }
      ]
    },
    {
      title: "Relasi",
      fields: [
        { key: "dewaInduk", label: "Dewa Induk", kind: "linked", linkedType: "Dewa" },
        { key: "dewaAnak", label: "Dewa Anak", kind: "linked", linkedType: "Dewa" },
        { key: "dewaSekutu", label: "Dewa Sekutu", kind: "linked", linkedType: "Dewa" },
        { key: "dewaMusuh", label: "Dewa Musuh", kind: "linked", linkedType: "Dewa" },
        { key: "kuil", label: "Kuil", kind: "linked", linkedType: "Lokasi" },
        { key: "agama", label: "Agama", kind: "linked", linkedType: "Agama" }
      ]
    }
  ];
})();
