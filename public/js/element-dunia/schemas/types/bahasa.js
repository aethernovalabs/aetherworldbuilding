(function () {
  "use strict";
  window.AwbElementSchemas = window.AwbElementSchemas || {};
  window.AwbElementSchemas.Bahasa = [
    {
      title: "Informasi Umum",
      fields: [
        { key: "jumlahPenutur", label: "Jumlah Penutur", kind: "text" },
        { key: "sistemPenulisan", label: "Sistem Penulisan", kind: "text" },
        { key: "keluargaBahasa", label: "Keluarga Bahasa", kind: "text" },
        { key: "status", label: "Status", kind: "select",
          options: ["Berkembang", "Punah", "Kuno", "Rahasia"] },
        { key: "penutur", label: "Penutur", kind: "text" },
        { key: "dialek", label: "Dialek", kind: "text" },
        { key: "bahasaTerkait", label: "Bahasa Terkait", kind: "text" },
        { key: "pentingnyaBudaya", label: "Pentingnya Budaya", kind: "textarea" }
      ]
    },
    {
      title: "Frasa Umum",
      fields: [
        { key: "frasaUmum", label: "Frasa Umum (daftar)", kind: "list",
          itemSchema: {
            fields: [
              { key: "frasa", label: "Frasa", kind: "text" },
              { key: "arti", label: "Arti", kind: "text" },
              { key: "konteks", label: "Konteks", kind: "textarea" }
            ]
          }
        }
      ]
    }
  ];
})();
