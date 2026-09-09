import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// Halaman statik dari folder `pages/` (format `*.page.html`)
// Dengan `import.meta.glob` + `?raw`, Vite membundel setiap file sebagai string
// sehingga file baru yang ditambahkan ke folder `pages/` otomatis ikut ter-serve
// tanpa perlu mengubah kode.
// ---------------------------------------------------------------------------
const pageSources = import.meta.glob<string>("../../pages/*.page.html", {
	query: "?raw",
	import: "default",
	eager: true,
});

for (const [key, html] of Object.entries(pageSources)) {
	const fileName = key.split("/").pop() ?? "";
	const slug = fileName.replace(/\.page\.html$/i, "");

	if (!slug) continue;

	// `/karakter` (URL clean) dan `/karakter.page.html` (URL yang dipakai
	// link antar-halaman) → serve isi `pages/karakter.page.html`
	app.get(`/${slug}`, (c) => c.html(html));
	app.get(`/${slug}.page.html`, (c) => c.html(html));
}

// CSS bersama (`styles/shared-workspace.css`) disimpan di `public/styles/`
// sehingga otomatis disajikan sebagai aset statis di URL `/styles/shared-workspace.css`
// baik saat dev maupun production (dikopi Vite ke `dist/client`).

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

export default app;
