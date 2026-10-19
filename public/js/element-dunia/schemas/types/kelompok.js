(function () {
  "use strict";
  window.AwbElementSchemas = window.AwbElementSchemas || {};
  window.AwbElementSchemas.Kelompok = [
    {
      title: "Informasi Umum",
      fields: [
        { key: "typeKelompok", label: "Type Kelompok", kind: "select",
          options: ["Guild", "Ordo", "Klan", "Keluarga", "Sekte", "Organisasi", "Lainnya"] },
        { key: "ukuran", label: "Ukuran", kind: "text" },
        { key: "status", label: "Status", kind: "select",
          options: ["Aktif", "Bubar", "Rahasia"] },
        { key: "pengaruh", label: "Pengaruh", kind: "select",
          options: ["Local", "Regional", "National", "Global"] },
        { key: "tanggalDidirikan", label: "Tanggal Didirikan", kind: "text" },
        { key: "statusSosial", label: "Status Sosial", kind: "select",
          options: ["Rendah", "Netral", "Tinggi", "Elite"] },
        { key: "kepemimpinan", label: "Kepemimpinan", kind: "text" },
        { key: "tujuan", label: "Tujuan", kind: "text" }
      ]
    },
    {
      title: "Aturan & Budaya",
      fields: [
        { key: "persyaratan", label: "Persyaratan", kind: "text" },
        { key: "manfaat", label: "Manfaat", kind: "text" },
        { key: "tradisi", label: "Tradisi", kind: "text" },
        { key: "ritual", label: "Ritual", kind: "text" },
        { key: "hierarki", label: "Hierarki", kind: "textarea" },
        { key: "sumberDaya", label: "Sumber Daya", kind: "text" },
        { key: "rahasia", label: "Rahasia", kind: "textarea" },
        { key: "prosesInisiasi", label: "Proses Inisiasi", kind: "textarea" },
        { key: "tempatPertemuan", label: "Tempat Pertemuan", kind: "text" }
      ]
    },
    {
      title: "Relasi",
      fields: [
        { key: "wilayah", label: "Wilayah", kind: "linked", linkedType: "Lokasi" },
        { key: "faksiTerkait", label: "Faksi Terkait", kind: "linked", linkedType: "Faksi" },
        { key: "sekutu", label: "Sekutu", kind: "linked", linkedType: "Kelompok" },
        { key: "musuh", label: "Musuh", kind: "linked", linkedType: "Kelompok" }
      ]
    }
  ];
})();
