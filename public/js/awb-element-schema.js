/* awb-element-schema.js — Skema field per tipe Element Dunia.
 *
 * Setiap tipe berisi daftar group; setiap group berisi daftar field.
 * Field: { key, label, kind, options?, linkedType?, placeholder?, cols? }
 *   kind:
 *     'text'     → input teks
 *     'textarea' → textarea
 *     'number'   → input number (+ stepper)
 *     'select'   → dropdown dari options[]
 *     'bool'     → checkbox (nilai 'Ya'/'Tidak' → boolean)
 *     'tags'     → input tag + chips
 *     'image'    → input URL gambar dengan preview
 *     'linked'   → LinkedInput ke element.linkedType
 *
 * Field inti (selalu ada, di luar schema): name, image, description, tags.
 */
(function () {
  "use strict";

  // Opsi umum
  var YA_TIDAK = ["Ya", "Tidak"];
  var TINGKAT_UMUM = ["Sangat Rendah", "Rendah", "Sedang", "Tinggi", "Sangat Tinggi"];

  var ELEMENT_SCHEMA = {
    Makhluk: [
      { title: "Karakteristik", fields: [
        { key: "typeMakhluk", label: "Type Makhluk", kind: "select", options: ["Biasa", "Magic", "Elemental", "Spirit", "Undead", "Konstruk", "Hibrida"] },
        { key: "perilaku", label: "Perilaku", kind: "select", options: ["Netral", "Jinak", "Agresif", "Teritorial", "Sosial", "Soliter", "Predator"] },
        { key: "kecerdasan", label: "Kecerdasan", kind: "select", options: ["Hewan", "Semi-sadar", "Sadar", "Cerdas", "Sangat Cerdas", "Setara Manusia", "Melebihi Manusia"] },
        { key: "ukuran", label: "Ukuran", kind: "select", options: ["Mikro", "Kecil", "Sedang", "Besar", "Sangat Besar", "Kolosal"] },
        { key: "makanan", label: "Makanan", kind: "select", options: ["Daging", "Tumbuhan", "Omnivora", "Energi", "Mana", "Mineral", "Emosi", "Cahaya"] },
        { key: "rentangHidup", label: "Rentang Hidup", kind: "text", placeholder: "Mis. 40 tahun" },
        { key: "ukuranRata", label: "Ukuran Rata-rata", kind: "text", placeholder: "Mis. 2,5 meter" }
      ]},
      { title: "Biologi & Kemampuan", fields: [
        { key: "ciriFisik", label: "Ciri Fisik", kind: "textarea" },
        { key: "kemampuan", label: "Kemampuan", kind: "textarea" },
        { key: "kelemahan", label: "Kelemahan", kind: "textarea" },
        { key: "sifatMagic", label: "Sifat Magic", kind: "textarea" },
        { key: "dapatDijinakan", label: "Dapat Dijinakan", kind: "bool" }
      ]},
      { title: "Sosial & Habitat", fields: [
        { key: "pentingnyaBudaya", label: "Pentingnya Budaya", kind: "textarea" },
        { key: "strukturSosial", label: "Struktur Sosial", kind: "textarea" },
        { key: "habitatText", label: "Habitat (teks)", kind: "text", placeholder: "Deskripsi habitat" },
        { key: "habitat", label: "Habitat (Linked)", kind: "linked", linkedType: "Lokasi" },
        { key: "lokasiDiketahuiText", label: "Lokasi Diketahui (teks)", kind: "text" },
        { key: "lokasiDiketahui", label: "Lokasi Diketahui (Linked)", kind: "linked", linkedType: "Lokasi" }
      ]}
    ],

    Faksi: [
      { title: "Informasi Umum", fields: [
        { key: "typeFaksi", label: "Type Faksi", kind: "select", options: ["Politik", "Militer", "Keagamaan", "Ekonomi", "Rahasia", "Pemberontak", "Guild", "Kerajaan"] },
        { key: "struktur", label: "Struktur", kind: "select", options: ["Hierarkis", "Demokratis", "Kolektif", "Anarki", "Monarki", "Teokrasi", "Sel"] },
        { key: "status", label: "Status", kind: "select", options: ["Aktif", "Bubar", "Legendaris", "Rahasia", "Terlarang"] },
        { key: "pengaruh", label: "Pengaruh", kind: "select", options: TINGKAT_UMUM },
        { key: "tanggalDidirikan", label: "Tanggal Didirikan", kind: "text", placeholder: "Mis. Tahun 231 Era Kedua" },
        { key: "ideologi", label: "Ideologi", kind: "textarea" }
      ]},
      { title: "Kekuatan & Wilayah", fields: [
        { key: "sumberDaya", label: "Sumber Daya", kind: "textarea" },
        { key: "wilayah", label: "Wilayah", kind: "linked", linkedType: "Lokasi" },
        { key: "sekutu", label: "Faksi Sekutu", kind: "linked", linkedType: "Faksi" },
        { key: "musuh", label: "Faksi Musuh", kind: "linked", linkedType: "Faksi" }
      ]}
    ],

    Pekerjaan: [
      { title: "Informasi Umum", fields: [
        { key: "kategori", label: "Kategori", kind: "select", options: ["Produksi", "Jasa", "Militer", "Akademik", "Religius", "Seni", "Perdagangan", "Pemerintahan"] },
        { key: "statusSosial", label: "Status Sosial", kind: "select", options: TINGKAT_UMUM },
        { key: "penghasilan", label: "Penghasilan Rata-Rata", kind: "text", placeholder: "Mis. 50 koin per bulan" },
        { key: "pelatihan", label: "Pelatihan Diperlukan", kind: "text" },
        { key: "keterampilan", label: "Keterampilan yang Dibutuhkan", kind: "textarea" }
      ]},
      { title: "Detail", fields: [
        { key: "ciriUmum", label: "Ciri Umum", kind: "textarea" },
        { key: "kondisiKerja", label: "Kondisi Kerja", kind: "textarea" }
      ]}
    ],

    Lokasi: [
      { title: "Informasi Umum", fields: [
        { key: "tipeLokasi", label: "Tipe Lokasi", kind: "select", options: ["Benua", "Negara", "Kota", "Desa", "Dunia", "Dimensi", "Hutan", "Gunung", "Laut", "Pulau", "Reruntuhan", "Benteng"] },
        { key: "iklim", label: "Iklim", kind: "select", options: ["Tropis", "Subtropis", "Gurun", "Tundra", "Sedang", "Kutub", "Magis", "Abadi"] },
        { key: "populasi", label: "Populasi", kind: "text", placeholder: "Mis. 12.000 jiwa" },
        { key: "pemerintahan", label: "Tipe Pemerintahan", kind: "select", options: ["Monarki", "Republik", "Teokrasi", "Kekaisaran", "Anarki", "Suku", "Dewan", "Tidak ada"] },
        { key: "mataUang", label: "Mata Uang", kind: "text" },
        { key: "medan", label: "Medan", kind: "text" }
      ]},
      { title: "Detail", fields: [
        { key: "fiturTerkemuka", label: "Fitur Terkemuka", kind: "textarea" },
        { key: "ekonomi", label: "Ekonomi", kind: "textarea" },
        { key: "pertahanan", label: "Pertahanan", kind: "textarea" },
        { key: "ancaman", label: "Ancaman", kind: "textarea" },
        { key: "budaya", label: "Budaya", kind: "textarea" },
        { key: "strukturSosial", label: "Struktur Sosial", kind: "textarea" }
      ]},
      { title: "Relasi", fields: [
        { key: "lokasiInduk", label: "Lokasi Induk", kind: "linked", linkedType: "Lokasi" },
        { key: "bahasa", label: "Bahasa", kind: "linked", linkedType: "Bahasa" }
      ]}
    ],

    Agama: [
      { title: "Informasi Umum", fields: [
        { key: "jumlahPengikut", label: "Jumlah Pengikut", kind: "text" },
        { key: "pengaruh", label: "Pengaruh", kind: "select", options: TINGKAT_UMUM },
        { key: "keyakinan", label: "Keyakinan", kind: "textarea" },
        { key: "praktik", label: "Praktik", kind: "textarea" },
        { key: "teksSuci", label: "Teks Suci", kind: "text" }
      ]},
      { title: "Relasi", fields: [
        { key: "kuil", label: "Kuil", kind: "linked", linkedType: "Lokasi" },
        { key: "lokasi", label: "Lokasi", kind: "linked", linkedType: "Lokasi" },
        { key: "dewa", label: "Dewa", kind: "linked", linkedType: "Dewa" }
      ]}
    ],

    "Sistem Sihir": [
      { title: "Informasi Umum", fields: [
        { key: "penerimaanSosial", label: "Penerimaan Sosial", kind: "select", options: TINGKAT_UMUM },
        { key: "metodePembelajaran", label: "Metode Pembelajaran", kind: "select", options: ["Bawaan", "Akademik", "Ritual", "Pewarisan", "Kontrak", "Latihan"] },
        { key: "sumberKekuatan", label: "Sumber Kekuatan", kind: "text" },
        { key: "batasan", label: "Batasan", kind: "textarea" },
        { key: "biaya", label: "Biaya", kind: "textarea" }
      ]},
      { title: "Praktik", fields: [
        { key: "praktisi", label: "Praktisi", kind: "text" },
        { key: "artefak", label: "Artefak", kind: "linked", linkedType: "Item" },
        { key: "sihirTerlarang", label: "Sihir Terlarang", kind: "textarea" },
        { key: "sekolahSihir", label: "Sekolah Sihir", kind: "text" },
        { key: "fokus", label: "Fokus", kind: "text" },
        { key: "mantraUmum", label: "Mantra Umum", kind: "textarea" }
      ]}
    ],

    Teknologi: [
      { title: "Informasi Umum", fields: [
        { key: "tingkatTeknologi", label: "Tingkat Teknologi", kind: "select", options: ["Primitif", "Kuno", "Klasik", "Medieval", "Industrial", "Modern", "Futuristik", "Magitek"] },
        { key: "kategori", label: "Kategori", kind: "select", options: ["Transportasi", "Senjata", "Komunikasi", "Medis", "Konstruksi", "Energi", "Informasi", "Rumah Tangga"] },
        { key: "kelangkaan", label: "Kelangkaan", kind: "select", options: ["Umum", "Langka", "Langka", "Sangat Langka", "Unik", "Legendaris"] },
        { key: "fungsional", label: "Fungsional", kind: "textarea" },
        { key: "pencipta", label: "Pencipta", kind: "linked", linkedType: "Kelompok" },
        { key: "pengguna", label: "Pengguna", kind: "text" },
        { key: "persyaratan", label: "Persyaratan", kind: "textarea" },
        { key: "efekSamping", label: "Efek Samping", kind: "textarea" },
        { key: "terkait", label: "Teknologi Terkait", kind: "linked", linkedType: "Teknologi" }
      ]}
    ],

    Bahasa: [
      { title: "Informasi Umum", fields: [
        { key: "jumlahPenutur", label: "Jumlah Penutur", kind: "text" },
        { key: "sistemPenulisan", label: "Sistem Penulisan", kind: "select", options: ["Alfabet", "Silabis", "Logografis", "Piktografis", "Rune", "Tidak Tertulis"] },
        { key: "keluargaBahasa", label: "Keluarga Bahasa", kind: "text" },
        { key: "status", label: "Status", kind: "select", options: ["Hidup", "Punah", "Punyur", "Rahasia", "Kuno", "Suci"] },
        { key: "pentingnyaBudaya", label: "Pentingnya Budaya", kind: "textarea" }
      ]},
      { title: "Detail", fields: [
        { key: "penutur", label: "Penutur", kind: "linked", linkedType: "Spesies" },
        { key: "dialek", label: "Dialek", kind: "textarea" },
        { key: "bahasaTerkait", label: "Bahasa Terkait", kind: "linked", linkedType: "Bahasa" },
        { key: "frasaUmum", label: "Frasa Umum", kind: "textarea" },
        { key: "arti", label: "Arti", kind: "textarea" },
        { key: "konteks", label: "Konteks", kind: "textarea" }
      ]}
    ],

    Item: [
      { title: "Informasi Umum", fields: [
        { key: "tipeItem", label: "Tipe Item", kind: "select", options: ["Senjata", "Armor", "Artefak", "Ramuan", "Buku", "Permata", "Relik", "Perkakas", "Kendaraan", "Konsumsi"] },
        { key: "kelangkaan", label: "Kelangkaan", kind: "select", options: ["Umum", "Tidak Umum", "Langka", "Sangat Langka", "Unik", "Legendaris", "Mitos"] },
        { key: "kondisi", label: "Kondisi", kind: "select", options: ["Sempurna", "Baik", "Rusak Ringan", "Rusak Berat", "Hancur", "Terpecah"] },
        { key: "nilai", label: "Nilai", kind: "text" },
        { key: "berat", label: "Berat", kind: "text" },
        { key: "dimensi", label: "Dimensi", kind: "text" },
        { key: "bahan", label: "Bahan", kind: "text" },
        { key: "asal", label: "Asal", kind: "text" }
      ]},
      { title: "Sifat", fields: [
        { key: "properti", label: "Properti", kind: "textarea" },
        { key: "sifatMagic", label: "Sifat Magic", kind: "textarea" },
        { key: "effect", label: "Effect", kind: "textarea" },
        { key: "batasan", label: "Batasan", kind: "textarea" },
        { key: "persyaratan", label: "Persyaratan", kind: "textarea" },
        { key: "pentingnyaBudaya", label: "Pentingnya Budaya", kind: "textarea" }
      ]},
      { title: "Relasi", fields: [
        { key: "pemilikSaatIni", label: "Pemilik Saat Ini", kind: "text" },
        { key: "pemilikSebelumnya", label: "Pemilik Sebelumnya", kind: "text" },
        { key: "lokasiSaatIni", label: "Lokasi Saat Ini", kind: "linked", linkedType: "Lokasi" },
        { key: "itemTerkait", label: "Item Terkait", kind: "linked", linkedType: "Item" },
        { key: "faksiTerkait", label: "Faksi Terkait", kind: "linked", linkedType: "Faksi" },
        { key: "kelompokTerkait", label: "Kelompok Terkait", kind: "linked", linkedType: "Kelompok" }
      ]}
    ],

    Kelompok: [
      { title: "Informasi Umum", fields: [
        { key: "typeKelompok", label: "Type Kelompok", kind: "select", options: ["Guild", "Klub", "Ordo", "Klan", "Keluarga", "Sekte", "Persaudaraan", "Organisasi Rahasia"] },
        { key: "ukuran", label: "Ukuran", kind: "text" },
        { key: "status", label: "Status", kind: "select", options: ["Aktif", "Bubar", "Rahasia", "Terlarang", "Legendaris"] },
        { key: "pengaruh", label: "Pengaruh", kind: "select", options: TINGKAT_UMUM },
        { key: "tanggalDidirikan", label: "Tanggal Didirikan", kind: "text" },
        { key: "statusSosial", label: "Status Sosial", kind: "select", options: TINGKAT_UMUM },
        { key: "kepemimpinan", label: "Kepemimpinan", kind: "text" },
        { key: "tujuan", label: "Tujuan", kind: "textarea" }
      ]},
      { title: "Aturan & Budaya", fields: [
        { key: "persyaratan", label: "Persyaratan", kind: "textarea" },
        { key: "manfaat", label: "Manfaat", kind: "textarea" },
        { key: "tradisi", label: "Tradisi", kind: "textarea" },
        { key: "ritual", label: "Ritual", kind: "textarea" },
        { key: "hierarki", label: "Hierarki", kind: "textarea" },
        { key: "sumberDaya", label: "Sumber Daya", kind: "textarea" },
        { key: "rahasia", label: "Rahasia", kind: "textarea" },
        { key: "prosesInisiasi", label: "Proses Inisiasi", kind: "textarea" }
      ]},
      { title: "Relasi", fields: [
        { key: "tempatPertemuan", label: "Tempat Pertemuan", kind: "linked", linkedType: "Lokasi" },
        { key: "wilayah", label: "Wilayah", kind: "linked", linkedType: "Lokasi" },
        { key: "faksiTerkait", label: "Faksi Terkait", kind: "linked", linkedType: "Faksi" },
        { key: "sekutu", label: "Sekutu", kind: "linked", linkedType: "Kelompok" },
        { key: "musuh", label: "Musuh", kind: "linked", linkedType: "Kelompok" }
      ]}
    ],

    Dewa: [
      { title: "Informasi Umum", fields: [
        { key: "typeDewa", label: "Type Dewa", kind: "select", options: ["Primordial", "Langit", "Bumi", "Perang", "Kematian", "Kehidupan", "Cinta", "Pengetahuan", "Chaos", "Order", "Alam", "Laut"] },
        { key: "penyelarasan", label: "Penyelarasan", kind: "select", options: ["Baik", "Netral", "Jahat", "Chaotic", "Lawful", "Campuran"] },
        { key: "tingkatKekuatan", label: "Tingkat Kekuatan", kind: "select", options: TINGKAT_UMUM },
        { key: "intervensi", label: "Intervensi", kind: "select", options: ["Tidak Pernah", "Jarang", "Kadang", "Sering", "Selalu"] },
        { key: "domain", label: "Domain", kind: "text" },
        { key: "symbol", label: "Symbol", kind: "text" }
      ]},
      { title: "Detail", fields: [
        { key: "deskripsiFisik", label: "Deskripsi Fisik", kind: "textarea" },
        { key: "pengikut", label: "Pengikut", kind: "linked", linkedType: "Kelompok" },
        { key: "mitos", label: "Mitos", kind: "textarea" },
        { key: "doa", label: "Doa", kind: "textarea" },
        { key: "persembahan", label: "Persembahan", kind: "textarea" },
        { key: "manifestasi", label: "Manifestasi", kind: "textarea" },
        { key: "kodeMoral", label: "Kode Moral", kind: "textarea" }
      ]},
      { title: "Relasi", fields: [
        { key: "dewaInduk", label: "Dewa Induk", kind: "linked", linkedType: "Dewa" },
        { key: "dewaAnak", label: "Dewa Anak", kind: "linked", linkedType: "Dewa" },
        { key: "dewaSekutu", label: "Dewa Sekutu", kind: "linked", linkedType: "Dewa" },
        { key: "dewaMusuh", label: "Dewa Musuh", kind: "linked", linkedType: "Dewa" },
        { key: "kuil", label: "Kuil", kind: "linked", linkedType: "Lokasi" },
        { key: "agama", label: "Agama", kind: "linked", linkedType: "Agama" }
      ]}
    ],

    Gelar: [
      { title: "Informasi Umum", fields: [
        { key: "jenisGelar", label: "Jenis Gelar", kind: "select", options: ["Bangsawan", "Militer", "Akademik", "Religius", "Kehormatan", "Warisan", "Profesional"] },
        { key: "status", label: "Status", kind: "select", options: ["Aktif", "Kuno", "Punah", "Terlarang", "Legendaris"] },
        { key: "dapatDiturunkan", label: "Dapat Diturunkan?", kind: "bool" },
        { key: "dapatDicabut", label: "Dapat Dicabut?", kind: "bool" },
        { key: "dapatDiwariskan", label: "Dapat Diwariskan?", kind: "bool" },
        { key: "tingkatKesulitan", label: "Tingkat Kesulitan", kind: "select", options: TINGKAT_UMUM },
        { key: "pandanganSosial", label: "Pandangan Sosial", kind: "textarea" },
        { key: "jumlahRata", label: "Jumlah Rata-Rata", kind: "text" }
      ]},
      { title: "Syarat & Manfaat", fields: [
        { key: "syaratPewarisan", label: "Syarat Pewarisan", kind: "textarea" },
        { key: "pencabut", label: "Yang Dapat Mencabut Gelar", kind: "text" },
        { key: "sapaanKhusus", label: "Sapaan Khusus", kind: "text" },
        { key: "caraMemperoleh", label: "Cara Memperoleh Gelar", kind: "textarea" },
        { key: "deskPandangan", label: "Deskripsi Pandangan Sosial", kind: "textarea" },
        { key: "tujuan", label: "Tujuan", kind: "textarea" },
        { key: "manfaat", label: "Manfaat", kind: "textarea" },
        { key: "batasan", label: "Batasan", kind: "textarea" }
      ]},
      { title: "Relasi", fields: [
        { key: "lebihTinggi", label: "Lebih Tinggi dari Gelar", kind: "linked", linkedType: "Gelar" },
        { key: "lebihRendah", label: "Lebih Rendah dari Gelar", kind: "linked", linkedType: "Gelar" },
        { key: "pekerjaan", label: "Pekerjaan", kind: "linked", linkedType: "Pekerjaan" }
      ]}
    ],

    Spesies: [
      { title: "Biologi", fields: [
        { key: "jenisMakanan", label: "Jenis Makanan", kind: "select", options: ["Karnivora", "Herbivora", "Omnivora", "Fotosintesis", "Energi", "Mana", "Mineral"] },
        { key: "rentangHidup", label: "Rentang Hidup", kind: "text", placeholder: "Mis. 200 tahun" },
        { key: "tinggiRata", label: "Tinggi Rata-rata", kind: "text", placeholder: "Mis. 1,8 meter" },
        { key: "asalDunia", label: "Asal Dunia", kind: "text" },
        { key: "ciriFisik", label: "Ciri Fisik", kind: "textarea" },
        { key: "kemampuanKhusus", label: "Kemampuan Khusus", kind: "textarea" }
      ]},
      { title: "Budaya", fields: [
        { key: "budaya", label: "Budaya", kind: "textarea" },
        { key: "strukturSosial", label: "Struktur Sosial", kind: "textarea" }
      ]},
      { title: "Relasi", fields: [
        { key: "sekutu", label: "Spesies Sekutu", kind: "linked", linkedType: "Spesies" },
        { key: "netral", label: "Spesies Netral", kind: "linked", linkedType: "Spesies" },
        { key: "musuh", label: "Spesies Musuh", kind: "linked", linkedType: "Spesies" },
        { key: "bahasa", label: "Bahasa", kind: "linked", linkedType: "Bahasa" },
        { key: "pekerjaan", label: "Pekerjaan", kind: "linked", linkedType: "Pekerjaan" }
      ]}
    ],

    "Power Tier": [
      { title: "Informasi Umum", fields: [
        { key: "type", label: "Type", kind: "select", options: ["Kekuatan Fisik", "Kekuatan Magic", "Kecepatan", "Daya Tahan", "Kecerdasan", "Pengendalian", "Keseluruhan"] },
        { key: "kesulitan", label: "Kesulitan", kind: "select", options: TINGKAT_UMUM },
        { key: "populasi", label: "Populasi", kind: "text" },
        { key: "persyaratan", label: "Persyaratan", kind: "textarea" },
        { key: "sejarah", label: "Sejarah", kind: "textarea" },
        { key: "batasan", label: "Batasan", kind: "textarea" }
      ]},
      { title: "Relasi Tingkat", fields: [
        { key: "lebihTinggi", label: "Lebih Tinggi Dari", kind: "linked", linkedType: "Power Tier" },
        { key: "lebihRendah", label: "Lebih Rendah Dari", kind: "linked", linkedType: "Power Tier" }
      ]}
    ],

    "Element Custom": [
      { title: "Informasi Umum", fields: [
        { key: "kategori", label: "Kategori", kind: "text" },
        { key: "status", label: "Status", kind: "select", options: ["Aktif", "Tidak Aktif", "Rahasia"] }
      ]}
    ]
  };

  // Daftar tipe bawaan (urutan tampilan grup & sidebar)
  var ELEMENT_TYPES = [
    "Makhluk", "Faksi", "Pekerjaan", "Lokasi", "Agama", "Sistem Sihir", "Teknologi",
    "Bahasa", "Item", "Kelompok", "Dewa", "Gelar", "Spesies", "Power Tier"
  ];

  // Label tampilan kategori sidebar → tipe penyimpanan
  var ELEMENT_TYPE_ALIASES = {
    "Sistem Sihir": "Sistem Sihir",
    "Power Tier": "Power Tier"
  };

  // Ikon per tipe (untuk sidebar & kartu)
  var ELEMENT_ICONS = {
    "Makhluk": "lucide:bug",
    "Faksi": "lucide:flag",
    "Pekerjaan": "lucide:briefcase",
    "Lokasi": "lucide:map-pin",
    "Agama": "lucide:landmark",
    "Sistem Sihir": "lucide:zap",
    "Teknologi": "lucide:cpu",
    "Bahasa": "lucide:languages",
    "Item": "lucide:package",
    "Kelompok": "lucide:users",
    "Dewa": "lucide:sparkles",
    "Gelar": "lucide:award",
    "Spesies": "lucide:leaf",
    "Power Tier": "lucide:trending-up",
    "Element Custom": "lucide:puzzle"
  };

  window.AwbElementSchema = {
    schema: ELEMENT_SCHEMA,
    types: ELEMENT_TYPES,
    icons: ELEMENT_ICONS,
    aliases: ELEMENT_TYPE_ALIASES
  };
})();
