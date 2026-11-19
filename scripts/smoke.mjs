// Smoke test output statis (out/) — dijalankan CI tanpa network.
// Memeriksa marker penting ada di HTML hasil export / chunk JS.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "out");

let fail = 0;
const check = (name, ok) => {
  console.log(ok ? `PASS ${name}` : `FAIL ${name}`);
  if (!ok) fail++;
};

const readAll = (dir) => {
  let out = "";
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out += readAll(p);
    else if (/\.(html|js|txt)$/.test(e.name)) out += fs.readFileSync(p, "utf8");
  }
  return out;
};

check("out/ ada", fs.existsSync(OUT));
check("out/index.html ada", fs.existsSync(path.join(OUT, "index.html")));
check("out/docs/index.html ada", fs.existsSync(path.join(OUT, "docs", "index.html")));
check("out/_worker.js ada (API hidup di Pages)", fs.existsSync(path.join(OUT, "_worker.js")));
check("out/404.html ada", fs.existsSync(path.join(OUT, "404.html")));
check("out/og-image.png ada", fs.existsSync(path.join(OUT, "og-image.png")));
check(
  "og-image.png >= 10KB",
  fs.existsSync(path.join(OUT, "og-image.png")) &&
    fs.statSync(path.join(OUT, "og-image.png")).size >= 10240,
);

const html = fs.readFileSync(path.join(OUT, "index.html"), "utf8");
check("index.html berisi judul DezDownload", html.includes("DezDownload"));
check("index.html berisi link GitHub repo", html.includes("github.com/dezzorigin/dez-download"));
check("index.html berisi og:title", html.includes('property="og:title"'));
check("index.html berisi og:image absolut", html.includes("https://dez-download.pages.dev/og-image.png"));
check("index.html berisi twitter:card", html.includes('name="twitter:card"'));

const all = readAll(OUT);
check("hero dua kolom ada di bundle", all.includes("Tempel tautan"));
check("manifest contoh ada di bundle", all.includes("MANIFEST"));
check("fitur video kualitas ada di bundle", all.includes("Video kualitas tertinggi"));
check("cara kerja ada di bundle", all.includes("Worker bertanya ke Cobalt"));
check("tanpa sisa maintenance mode di bundle", !all.includes("MAINTENANCE_MODE"));
check("worker berisi rute /api/download", fs.readFileSync(path.join(OUT, "_worker.js"), "utf8").includes("/api/download"));
check("worker berisi rute /api/proxy", fs.readFileSync(path.join(OUT, "_worker.js"), "utf8").includes("/api/proxy"));

if (fail > 0) {
  console.log(`\nSMOKE GAGAL: ${fail} check gagal.`);
  process.exit(1);
}
console.log("\nSMOKE OK.");
