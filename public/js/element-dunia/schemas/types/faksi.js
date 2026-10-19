(function () {
  "use strict";
  window.AwbElementSchemas = window.AwbElementSchemas || {};
  window.AwbElementSchemas.Faksi = [
    {
      title: "Informasi Umum",
      fields: [
        { key: "typeFaksi", label: "Type Faksi", kind: "select",
          options: ["Politik", "Militer", "Religius", "Komersial", "Akademik"] },
        { key: "struktur", label: "Struktur", kind: "select",
          options: ["Hierarki", "Demokratis", "Anarkis", "Oligarki"] },
        { key: "status", label: "Status", kind: "select",
          options: ["Aktif", "Bubar", "Underground", "Dormant"] },
        { key: "pengaruh", label: "Pengaruh", kind: "select",
          options: ["Local", "Regional", "National", "Global"] },
        { key: "tanggalDidirikan", label: "Tanggal Didirikan", kind: "text" },
        { key: "ideologi", label: "Ideologi", kind: "textarea" }
      ]
    },
    {
      title: "Kekuatan",
      fields: [
        { key: "sumberDaya", label: "Sumber Daya", kind: "text" },
        { key: "wilayah", label: "Wilayah", kind: "text" }
      ]
    },
    {
      title: "Relasi",
      fields: [
        { key: "sekutu", label: "Faksi Sekutu", kind: "linked", linkedType: "Faksi" },
        { key: "musuh", label: "Faksi Musuh", kind: "linked", linkedType: "Faksi" }
      ]
    }
  ];
})();
