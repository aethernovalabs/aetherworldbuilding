(function () {
  "use strict";
  window.AwbElementSchemas = window.AwbElementSchemas || {};
  window.AwbElementSchemas.Gelar = [
    {
      title: "Informasi Umum",
      fields: [
        { key: "jenisGelar", label: "Jenis Gelar", kind: "select",
          options: ["Bangsawan", "Militer", "Akademik", "Religius", "Kehormatan", "Lainnya"] },
        { key: "status", label: "Status", kind: "select",
          options: ["Aktif", "Kuno", "Punah", "Terlarang"] },
        { key: "dapatDiturunkan", label: "Dapat Diturunkan?", kind: "select", options: ["Ya", "Tidak"] },
        { key: "dapatDicabut", label: "Dapat Dicabut?", kind: "select", options: ["Ya", "Tidak"] },
        { key: "dapatDiwariskan", label: "Dapat Diwariskan?", kind: "select", options: ["Ya", "Tidak"] },
        { key: "tingkatKesulitan", label: "Tingkat Kesulitan", kind: "select",
          options: ["Rendah", "Sedang", "Tinggi", "Sangat Tinggi"] },
        { key: "pandanganSosial", label: "Pandangan Sosial", kind: "select",
          options: ["Ditakuti", "Dihormati", "Dicurigai", "Populer"] },
        { key: "jumlahRata", label: "Jumlah Rata-Rata", kind: "select",
          options: ["Sedikit", "Sedang", "Banyak"] }
      ]
    },
    {
      title: "Detail",
      fields: [
        { key: "syaratPewarisan", label: "Syarat Pewarisan", kind: "text" },
        { key: "pencabut", label: "Yang Dapat Mencabut Gelar", kind: "text" },
        { key: "sapaanKhusus", label: "Sapaan Khusus", kind: "text" },
        { key: "caraMemperoleh", label: "Cara Memperoleh Gelar", kind: "textarea" },
        { key: "deskPandangan", label: "Deskripsi Pandangan Sosial", kind: "textarea" },
        { key: "tujuan", label: "Tujuan", kind: "text" },
        { key: "manfaat", label: "Manfaat", kind: "textarea" },
        { key: "batasan", label: "Batasan", kind: "text" }
      ]
    },
    {
      title: "Relasi",
      fields: [
        { key: "lebihTinggi", label: "Lebih Tinggi dari Gelar", kind: "linked", linkedType: "Gelar" },
        { key: "lebihRendah", label: "Lebih Rendah dari Gelar", kind: "linked", linkedType: "Gelar" },
        { key: "pekerjaan", label: "Pekerjaan", kind: "linked", linkedType: "Pekerjaan" }
      ]
    }
  ];
})();
