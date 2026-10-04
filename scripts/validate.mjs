#!/usr/bin/env node
// Checks data/products.json, js/config.js and the image folder.
//   node scripts/validate.mjs            normal checks (errors fail, warnings don't)
//   node scripts/validate.mjs --launch   also fails on anything that must not ship (sample data, placeholder domain, missing og image)
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const launch = process.argv.includes("--launch");
const errors = [], warnings = [];
const err = m => errors.push(m), warn = m => (launch ? errors : warnings).push(m);
const read = p => readFileSync(join(root, p), "utf8");

// ---- config ----
let C = {};
try {
  const win = {};
  new Function("window", read("js/config.js"))(win);
  C = win.NEXA || {};
  if (!C.whatsapp || !/^\d{10,15}$/.test(C.whatsapp)) err("config.whatsapp must be digits only in international format, e.g. 254722648792");
  if (!(C.delivery && Number.isFinite(C.delivery.fee))) err("config.delivery.fee must be a number");
  for (let d = 0; d < 7; d++) {
    const h = C.hours && C.hours[d];
    if (h !== null && !(Array.isArray(h) && h.length === 2 && h[0] >= 0 && h[1] <= 24 && h[0] < h[1])) err("config.hours[" + d + "] must be [open, close] in 24h time, or null");
  }
  if (!C.legalName) warn("config.legalName is empty (registered business name)");
  if (!C.licenceNo) warn("config.licenceNo is empty (county liquor licence number)");
} catch (e) { err("Could not read js/config.js: " + e.message); }

// ---- catalogue ----
let data = {};
try { data = JSON.parse(read("data/products.json")); } catch (e) { err("data/products.json is not valid JSON: " + e.message); }
const products = Array.isArray(data.products) ? data.products : [];
if (!products.length) err("data/products.json has no products");
if (data.sample === true) warn('products.json still has "sample": true (placeholder catalogue)');
const cats = new Set(data.categories || []);
const ids = new Set(), usedImages = new Set(), noImage = [];
for (const p of products) {
  const where = "product " + (p.id || p.name || "?");
  if (!p.id || !/^[a-z0-9-]+$/.test(p.id)) err(where + ": id must be lowercase letters, numbers and dashes");
  if (ids.has(p.id)) err(where + ": duplicate id");
  ids.add(p.id);
  if (!p.name) err(where + ": missing name");
  if (!p.cat) err(where + ": missing cat");
  else if (cats.size && !cats.has(p.cat)) err(where + ': category "' + p.cat + '" is not in the categories list');
  if (!p.desc) warn(where + ": missing desc");
  if (!Array.isArray(p.sizes) || !p.sizes.length) { err(where + ": needs at least one size"); continue; }
  const labels = new Set();
  for (const s of p.sizes) {
    if (!s.label) err(where + ": size without label");
    if (labels.has(s.label)) err(where + ": duplicate size " + s.label);
    labels.add(s.label);
    if (!Number.isInteger(s.price) || s.price < 0) err(where + " " + s.label + ": price must be a whole number of KES");
    if (s.stock !== undefined && s.stock !== null && (!Number.isInteger(s.stock) || s.stock < 0)) err(where + " " + s.label + ": stock must be a whole number >= 0");
  }
  if (p.image) {
    usedImages.add(p.image);
    if (!existsSync(join(root, p.image))) err(where + ": image file not found: " + p.image);
  } else noImage.push(p.id);
}
if (noImage.length) warn(noImage.length + " of " + products.length + " products have no image (placeholder bottle is shown): " + noImage.join(", "));
const imgDir = join(root, "images/products");
if (existsSync(imgDir)) {
  for (const f of readdirSync(imgDir)) if (f !== ".gitkeep" && !usedImages.has("images/products/" + f)) warnings.push("images/products/" + f + " is not used by any product");
}

// ---- launch-only checks ----
const PLACEHOLDER = "YOUR-DOMAIN.example";
for (const f of ["index.html", "robots.txt", "sitemap.xml", "js/config.js"]) {
  if (existsSync(join(root, f)) && read(f).includes(PLACEHOLDER)) warn(f + " still contains " + PLACEHOLDER + " (replace it with the real domain)");
}
if (!existsSync(join(root, "images/og.jpg"))) warn("images/og.jpg is missing (1200x630 share image)");

for (const w of warnings) console.log("warning:", w);
for (const e of errors) console.log("ERROR:  ", e);
console.log("\n" + products.length + " products checked" + (launch ? " (launch mode)" : "") + ": " + errors.length + " error(s), " + warnings.length + " warning(s)");
process.exit(errors.length ? 1 : 0);
