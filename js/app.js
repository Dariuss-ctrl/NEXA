/* NEXA LOUNGE — storefront logic. Business details live in config.js, products in data/products.json. */
(function () {
  "use strict";
  const C = window.NEXA;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const kes = n => "KES " + Math.round(n).toLocaleString("en-KE");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- time, hours, status ---------- */
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hh = h => (h % 12 === 0 ? 12 : h % 12);
  const fmtH = h => hh(h) + ":00 " + (h < 12 ? "AM" : "PM");
  const fmtHshort = h => hh(h) + (h < 12 ? " AM" : " PM");

  function nowTZ() {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: C.timezone, weekday: "short", hour: "2-digit", hour12: false }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    return { day: SHORT.indexOf(get("weekday")), hour: parseInt(get("hour"), 10) % 24 };
  }
  function hoursRows() {
    const rows = [];
    [1, 2, 3, 4, 5, 6, 0].forEach(d => {
      const h = C.hours[d] || null, key = h ? h.join("-") : "closed", last = rows[rows.length - 1];
      if (last && last.key === key) last.to = d; else rows.push({ key, from: d, to: d, h });
    });
    return rows.map(r => ({
      label: r.from === r.to ? DAY_NAMES[r.from] : SHORT[r.from] + "–" + SHORT[r.to],
      value: r.h ? fmtH(r.h[0]) + " – " + fmtH(r.h[1]) : "Closed"
    }));
  }
  function statusInfo() {
    const n = nowTZ(), h = C.hours[n.day];
    if (h && n.hour >= h[0] && n.hour < h[1]) return { open: true, short: "Open", long: "Open now, until " + fmtHshort(h[1]) };
    if (h && n.hour < h[0]) return { open: false, short: "Closed", long: "Closed, opens " + fmtHshort(h[0]) };
    for (let i = 1; i <= 7; i++) {
      const d = (n.day + i) % 7, x = C.hours[d];
      if (x) return { open: false, short: "Closed", long: "Closed, opens " + (i === 1 ? "tomorrow " : SHORT[d] + " ") + fmtHshort(x[0]) };
    }
    return { open: false, short: "Closed", long: "Closed" };
  }
  const deliveryClosed = () => nowTZ().hour >= C.delivery.cutoffHour;

  /* ---------- config-driven text ---------- */
  function applyConfig() {
    const vals = {
      name: C.name, zone: C.delivery.zone, minAge: C.minAge, payment: C.payment,
      payShort: C.payment.replace(/ on delivery$/i, ""), feeLabel: kes(C.delivery.fee),
      cutoffLabel: fmtH(C.delivery.cutoffHour), year: new Date().getFullYear()
    };
    $$("[data-cfg]").forEach(el => { const v = vals[el.dataset.cfg]; if (v !== undefined) el.textContent = v; });
    $("#ask-wa").href = "https://wa.me/" + C.whatsapp;
    $("#info-phone").href = "tel:+" + C.whatsapp; $("#info-phone").textContent = C.phoneDisplay;
    $("#info-address").textContent = C.address.street + ", " + C.address.town;
    $("#map").src = C.mapsEmbedUrl;
    $("#info-list").innerHTML = hoursRows().map(r => "<li><span>" + esc(r.label) + "</span><span>" + esc(r.value) + "</span></li>").join("")
      + "<li><span>Delivery</span><span>Until " + fmtH(C.delivery.cutoffHour) + " daily</span></li>"
      + "<li><span>Delivery fee</span><span>" + kes(C.delivery.fee) + " in " + esc(C.delivery.zone) + "</span></li>"
      + "<li><span>Outside " + esc(C.delivery.zone) + "</span><span>Fee agreed on WhatsApp</span></li>"
      + "<li><span>Payment</span><span>" + esc(C.payment) + "</span></li>";
    const legal = [C.legalName && "Operated by " + C.legalName, C.licenceNo && "Licence no. " + C.licenceNo].filter(Boolean).join(" · ");
    if (legal) { $("#legal-line").textContent = legal; $("#legal-line").hidden = false; }
    // structured data from the same config
    const ld = {
      "@context": "https://schema.org", "@type": "LiquorStore", name: C.name, telephone: "+" + C.whatsapp, url: C.siteUrl,
      address: { "@type": "PostalAddress", streetAddress: C.address.street, addressLocality: C.address.locality, addressCountry: C.address.country },
      openingHoursSpecification: [1, 2, 3, 4, 5, 6, 0].filter(d => C.hours[d]).map(d => ({
        "@type": "OpeningHoursSpecification", dayOfWeek: DAY_NAMES[d],
        opens: String(C.hours[d][0]).padStart(2, "0") + ":00", closes: String(C.hours[d][1]).padStart(2, "0") + ":00"
      }))
    };
    const s = document.createElement("script"); s.type = "application/ld+json"; s.textContent = JSON.stringify(ld); document.head.appendChild(s);
  }
  function renderStatus() {
    const s = statusInfo();
    $("#status").innerHTML = '<span class="dot ' + (s.open ? "open" : "") + '"></span><span>' + s.short + "</span>";
    $("#status-long").textContent = s.long;
  }

  /* ---------- catalogue ---------- */
  let CATALOGUE = [], CATEGORIES = [], SAMPLE = false;
  const byId = id => CATALOGUE.find(p => p.id === id);
  const sizeOf = (p, label) => p.sizes.find(s => s.label === label);
  const minPrice = p => Math.min.apply(null, p.sizes.map(s => s.price));
  const allOut = p => p.sizes.every(s => s.stock <= 0);
  const UNTRACKED = 99;

  function normalise(raw) {
    const out = [];
    (Array.isArray(raw) ? raw : []).forEach(p => {
      try {
        if (!p || !p.id || !p.name || !p.cat || !Array.isArray(p.sizes) || !p.sizes.length) throw new Error("missing fields");
        const sizes = p.sizes.map(s => {
          if (!s || !s.label || !Number.isFinite(s.price) || s.price < 0) throw new Error("bad size");
          return { label: String(s.label), price: s.price, stock: Number.isFinite(s.stock) ? Math.max(0, Math.floor(s.stock)) : UNTRACKED };
        });
        out.push({ id: String(p.id), name: String(p.name), cat: String(p.cat), desc: String(p.desc || ""), pop: p.popular ? 1 : 0, image: p.image ? String(p.image) : "", sizes });
      } catch (e) { console.warn("Skipping product", p && p.id, e.message); }
    });
    return out;
  }
  async function loadCatalogue() {
    showSkeleton();
    try {
      const res = await fetch(C.catalogueUrl, { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      CATALOGUE = normalise(data.products);
      if (!CATALOGUE.length) throw new Error("empty catalogue");
      SAMPLE = data.sample === true;
      const cats = Array.isArray(data.categories) && data.categories.length ? data.categories : [];
      CATEGORIES = cats.concat(CATALOGUE.map(p => p.cat).filter((c, i, a) => a.indexOf(c) === i && cats.indexOf(c) < 0));
      $("#sample-banner").hidden = !SAMPLE;
      loadCart(); renderRail(); renderGrid(); renderCartUI();
    } catch (e) {
      console.error("Catalogue failed to load:", e);
      showCatalogueError();
    }
  }
  function showSkeleton() {
    $("#grid").setAttribute("aria-busy", "true");
    $("#grid").innerHTML = new Array(8).fill('<div class="skel" aria-hidden="true"></div>').join("");
  }
  function showCatalogueError() {
    $("#grid").setAttribute("aria-busy", "false");
    $("#rail").innerHTML = "";
    $("#grid-count").textContent = "";
    $("#grid").innerHTML = '<div class="empty" style="grid-column:1/-1"><strong>We couldn\'t load the drinks</strong>Check your connection and try again, or order straight on WhatsApp.'
      + '<div class="row"><button class="btn gold" data-act="retry" type="button">Try again</button><a class="btn" target="_blank" rel="noopener" href="https://wa.me/' + C.whatsapp + '">Order on WhatsApp</a></div></div>';
  }

  /* placeholder bottle so every card has the same canvas until real photos are added */
  const BOTTLE_COLORS = { Whisky: "#b9741f", Gin: "#7fb7c9", Vodka: "#c9d3da", Rum: "#8a4b22", Wine: "#7a1f3d", Beer: "#c58a1a" };
  function bottleSVG(p) {
    const c = BOTTLE_COLORS[p.cat] || "#8b8b94";
    const initials = p.name.split(/\s+/).filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join("");
    const nt = p.cat === "Wine" ? 26 : 40;
    return '<svg viewBox="0 0 200 250" role="img" aria-label="' + esc(p.name) + '" xmlns="http://www.w3.org/2000/svg">'
      + '<ellipse cx="100" cy="228" rx="52" ry="8" fill="#000" opacity=".35"/>'
      + '<rect x="86" y="' + nt + '" width="28" height="44" rx="5" fill="' + c + '" opacity=".9"/>'
      + '<rect x="90" y="' + (nt - 14) + '" width="20" height="16" rx="3" fill="#2b2b33"/>'
      + '<path d="M86 ' + (nt + 36) + " C60 " + (nt + 60) + " 58 " + (nt + 80) + " 58 " + (nt + 100) + " L58 214 Q58 224 68 224 L132 224 Q142 224 142 214 L142 " + (nt + 100) + " C142 " + (nt + 80) + " 140 " + (nt + 60) + " 114 " + (nt + 36) + ' Z" fill="' + c + '" opacity=".92"/>'
      + '<rect x="66" y="128" width="68" height="64" rx="6" fill="#f3f1ec" opacity=".92"/>'
      + '<text x="100" y="168" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="26" fill="#18181d">' + esc(initials) + "</text>"
      + '<path d="M72 ' + (nt + 70) + ' q-4 40 0 70" stroke="#fff" stroke-opacity=".25" stroke-width="4" fill="none" stroke-linecap="round"/></svg>';
  }
  function media(p, eager) {
    if (!p.image) return bottleSVG(p);
    return '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" width="600" height="750" decoding="async" ' + (eager ? "" : 'loading="lazy" ') + 'data-pid="' + esc(p.id) + '">';
  }
  // a photo that fails to load falls back to the placeholder bottle
  document.addEventListener("error", e => {
    const t = e.target;
    if (t && t.tagName === "IMG" && t.dataset.pid) {
      const p = byId(t.dataset.pid);
      if (p) { const holder = document.createElement("div"); holder.style.cssText = "width:100%;height:100%"; holder.innerHTML = bottleSVG(p); t.replaceWith(holder.firstChild); }
    }
  }, true);

  /* ---------- stock ---------- */
  function productStatus(p) {
    const avail = p.sizes.filter(s => s.stock > 0);
    if (!avail.length) return { state: "out", text: "Out of stock" };
    const max = Math.max.apply(null, avail.map(s => s.stock));
    if (max <= C.lowStockThreshold) return { state: "low", text: "Only " + max + " left" };
    return { state: "in", text: "In stock" };
  }
  function sizeStatus(s) {
    if (s.stock <= 0) return { state: "out", text: "Out of stock" };
    if (s.stock <= C.lowStockThreshold) return { state: "low", text: "Only " + s.stock + " left" };
    return { state: "in", text: "In stock" };
  }

  /* ---------- state ---------- */
  let cart = [], ref = null, delivery = "town", loc = "", custName = "";
  let category = "All", query = "", sort = "pop";

  function loadCart() {
    try {
      const raw = JSON.parse(store.get("nexa_cart_v1") || "{}");
      cart = (raw.items || []).filter(i => { const p = byId(i.id); return p && sizeOf(p, i.size) && sizeOf(p, i.size).stock > 0; })
        .map(i => ({ id: i.id, size: i.size, qty: Math.max(1, Math.min(i.qty | 0, sizeOf(byId(i.id), i.size).stock)) }));
      ref = cart.length ? (raw.ref || newRef()) : null;
      if (["town", "outside", "pickup"].indexOf(raw.delivery) >= 0) delivery = raw.delivery;
      loc = raw.location || ""; custName = raw.name || "";
    } catch (e) { cart = []; }
  }
  const saveCart = () => store.set("nexa_cart_v1", JSON.stringify({ items: cart, ref, delivery, location: loc, name: custName }));
  function newRef() {
    const d = new Date(), pad = n => String(n).padStart(2, "0");
    return "NX-" + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  /* ---------- cart logic ---------- */
  function addToCart(id, size, qty) {
    const p = byId(id), s = p && sizeOf(p, size);
    if (!s || s.stock <= 0) return false;
    const line = cart.find(i => i.id === id && i.size === size), have = line ? line.qty : 0;
    const next = Math.min(s.stock, have + qty);
    if (line) line.qty = next; else cart.push({ id, size, qty: next });
    if (!ref) ref = newRef();
    saveCart(); renderCartUI();
    return next === have + qty;
  }
  function setQty(id, size, qty) {
    const i = cart.findIndex(l => l.id === id && l.size === size);
    if (i < 0) return;
    const s = sizeOf(byId(id), size);
    if (qty <= 0) cart.splice(i, 1); else cart[i].qty = Math.min(qty, s.stock);
    if (!cart.length) ref = null;
    saveCart(); renderCartUI();
  }
  function totals() {
    const items = cart.reduce((n, l) => n + sizeOf(byId(l.id), l.size).price * l.qty, 0);
    const count = cart.reduce((n, l) => n + l.qty, 0);
    const fee = delivery === "town" ? C.delivery.fee : 0;
    return { items, count, fee, total: items + fee };
  }
  function buildMessage() {
    const t = totals();
    const lines = cart.map((l, i) => {
      const p = byId(l.id), s = sizeOf(p, l.size);
      return (i + 1) + ". " + p.name + " " + l.size + "\n   " + l.qty + " × " + kes(s.price) + " = " + kes(s.price * l.qty);
    });
    const dLine = delivery === "town" ? "Delivery (" + C.delivery.zone + "): " + kes(C.delivery.fee)
      : delivery === "outside" ? "Delivery: outside " + C.delivery.zone + ", please confirm the fee" : "Pickup from the shop (no delivery fee)";
    const total = delivery === "outside" ? "*Total: " + kes(t.items) + " + delivery*" : "*Total: " + kes(t.total) + "*";
    const who = [custName.trim() && "Name: " + custName.trim(), delivery !== "pickup" && "Delivery location: " + (loc.trim() || "(I will share my location)")].filter(Boolean);
    return "*" + C.name + " order* · " + ref + "\n\n" + lines.join("\n") + "\n\nItems: " + kes(t.items) + "\n" + dLine + "\n" + total
      + (who.length ? "\n\n" + who.join("\n") : "") + "\n\nPayment: " + C.payment + "\nI confirm I am " + C.minAge + " or older.";
  }

  /* ---------- toast ---------- */
  let toastTimer = null, toastFn = null;
  function toast(msg, action) {
    const el = $("#toast");
    el.innerHTML = "<span>" + esc(msg) + "</span>" + (action ? '<button type="button" data-act="toast-action">' + esc(action.label) + "</button>" : "");
    toastFn = action ? action.fn : null;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), action ? 5000 : 2200);
  }

  /* ---------- rendering: catalogue ---------- */
  function renderRail() {
    $("#rail").innerHTML = ["All"].concat(CATEGORIES).map(c => '<button class="chip" type="button" data-act="cat" data-cat="' + esc(c) + '" aria-pressed="' + (c === category) + '">' + esc(c) + "</button>").join("");
  }
  function visible() {
    const terms = norm(query).split(" ").filter(Boolean);
    const list = CATALOGUE.filter(p => {
      if (category !== "All" && p.cat !== category) return false;
      if (!terms.length) return true;
      const hay = norm(p.name + " " + p.cat + " " + p.sizes.map(s => s.label).join(" "));
      return terms.every(t => hay.indexOf(t) >= 0);
    });
    if (sort === "asc") list.sort((a, b) => minPrice(a) - minPrice(b));
    else if (sort === "desc") list.sort((a, b) => minPrice(b) - minPrice(a));
    else list.sort((a, b) => b.pop - a.pop || allOut(a) - allOut(b));
    return list;
  }
  function cardHTML(p, idx) {
    const st = productStatus(p), out = st.state === "out", multi = p.sizes.length > 1;
    const meta = multi ? p.sizes.map(s => s.label).join(" · ") : p.sizes[0].label;
    return '<article class="card' + (out ? " out" : "") + '">'
      + '<button class="media" type="button" data-act="open" data-id="' + esc(p.id) + '" aria-label="View ' + esc(p.name) + '">' + media(p, idx < 4) + "</button>"
      + '<div class="body"><h3>' + esc(p.name) + '</h3><p class="meta">' + esc(meta) + "</p>"
      + '<p class="price">' + (multi ? "From " : "") + kes(minPrice(p)) + "</p>"
      + '<span class="badge ' + st.state + '">' + st.text + "</span>"
      + '<button class="add" type="button" ' + (out ? "disabled" : "") + ' data-act="' + (multi ? "open" : "quick") + '" data-id="' + esc(p.id) + '">' + (out ? "Unavailable" : multi ? "Choose size" : "Add +") + "</button>"
      + "</div></article>";
  }
  function renderGrid() {
    const list = visible(), grid = $("#grid");
    const isDefault = category === "All" && !norm(query) && sort === "pop";
    $("#grid-title").textContent = norm(query) ? "Search results" : category !== "All" ? category : isDefault ? "Popular tonight" : "All drinks";
    $("#grid-count").textContent = list.length + (list.length === 1 ? " item" : " items");
    grid.setAttribute("aria-busy", "false");
    if (!list.length) {
      const filtered = norm(query) || category !== "All";
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><strong>No drinks found</strong>'
        + (norm(query) ? "Nothing matches “" + esc(query.trim()) + "”" + (category !== "All" ? " in " + esc(category) : "") + ". " : "")
        + "Try another word, or ask us. We may be able to get it.<div class=\"row\">"
        + (filtered ? '<button class="btn" type="button" data-act="clearfilters">Clear search and filters</button>' : "")
        + '<a class="btn gold" target="_blank" rel="noopener" href="https://wa.me/' + C.whatsapp + "?text=" + encodeURIComponent("Hello " + C.name + ", do you have " + (query.trim() || "this drink") + "?") + '">Ask on WhatsApp</a></div></div>';
      return;
    }
    const parts = [], firstOther = isDefault ? list.findIndex(p => !p.pop) : -1;
    list.forEach((p, i) => {
      if (i === firstOther && i > 0) parts.push('<h2 class="divider">More drinks</h2>');
      parts.push(cardHTML(p, i));
    });
    grid.innerHTML = parts.join("");
  }

  /* ---------- rendering: product modal ---------- */
  let pm = null; // { id, size, qty }
  function openProduct(id) {
    const p = byId(id); if (!p) return;
    const first = p.sizes.find(s => s.stock > 0) || p.sizes[0];
    pm = { id, size: first.label, qty: 1 };
    renderProduct(); openOverlay("pm");
  }
  // re-rendering replaces the buttons, so put keyboard focus back on the matching control
  function keepFocus(root, fn) {
    const a = document.activeElement, rootEl = $(root);
    let k = null;
    if (a && a !== document.body && rootEl.contains(a)) { const ds = a.dataset || {}; k = { act: ds.act, d: ds.d, id: ds.id, size: ds.size, elId: a.id, val: a.value, type: a.type }; }
    fn();
    if (!k) return;
    const m = $$(root + " button, " + root + " input").find(n => {
      const ds = n.dataset || {};
      return ds.act === k.act && ds.d === k.d && ds.id === k.id && ds.size === k.size && n.id === k.elId && (k.type !== "radio" || n.value === k.val);
    });
    if (m && !m.disabled) m.focus();
    else if (document.activeElement === document.body) { const x = $(root + " .x") || $(root + " .sheet button"); if (x) x.focus(); }
  }
  const renderProduct = () => keepFocus("#pm", renderProductInner);
  const renderCart = () => keepFocus("#cart", renderCartInner);
  function renderProductInner() {
    const p = byId(pm.id), s = sizeOf(p, pm.size), st = sizeStatus(s);
    const inCart = (cart.find(l => l.id === p.id && l.size === s.label) || { qty: 0 }).qty;
    const room = Math.max(0, s.stock - inCart);
    pm.qty = Math.max(1, Math.min(pm.qty, Math.max(room, 1)));
    $("#pm-title").textContent = p.name;
    $("#pm-body").innerHTML = '<div class="pm"><div class="media">' + media(p, true) + "</div><div>"
      + '<p class="meta">' + esc(p.cat) + '</p><p class="note" style="margin-top:6px">' + esc(p.desc) + "</p>"
      + '<p class="price" style="margin-top:8px;font-size:20px">' + kes(s.price) + "</p>"
      + '<span class="badge ' + st.state + '">' + st.text + "</span></div></div>"
      + (p.sizes.length > 1 ? '<div role="radiogroup" aria-label="Bottle size" class="sizes">'
        + p.sizes.map(z => '<button class="size" type="button" role="radio" aria-checked="' + (z.label === s.label) + '" data-act="size" data-size="' + esc(z.label) + '" ' + (z.stock <= 0 ? "disabled" : "") + ">"
          + esc(z.label) + "<small>" + (z.stock <= 0 ? "Out of stock" : kes(z.price)) + "</small></button>").join("") + "</div>"
        : '<p class="meta" style="margin:10px 0">Size: ' + esc(s.label) + "</p>")
      + (inCart ? '<p class="note">' + inCart + " of this size already in your cart" + (room <= 0 ? " (all we have in stock)" : "") + ".</p>" : "");
    $("#pm-foot").innerHTML = '<div style="display:flex;gap:12px;align-items:center">'
      + '<div class="qty"><button type="button" data-act="pmqty" data-d="-1" aria-label="Decrease quantity" ' + (pm.qty <= 1 ? "disabled" : "") + '>−</button><output aria-live="polite">' + pm.qty + '</output><button type="button" data-act="pmqty" data-d="1" aria-label="Increase quantity" ' + (pm.qty >= room ? "disabled" : "") + ">+</button></div>"
      + '<button class="add" type="button" style="flex:1;margin:0" data-act="pmadd" ' + (room <= 0 ? "disabled" : "") + ">" + (room <= 0 ? "No more available" : "Add to cart · " + kes(s.price * pm.qty)) + "</button></div>";
  }

  /* ---------- rendering: cart ---------- */
  function renderCartUI() {
    const t = totals();
    $("#cart-count").textContent = t.count;
    $("#bar").classList.toggle("show", t.count > 0 && !openId && !$("#gate").classList.contains("show"));
    $("#bar-count").textContent = t.count + (t.count === 1 ? " item" : " items") + " · View cart";
    $("#bar-total").textContent = kes(t.items);
    if ($("#cart").classList.contains("show")) renderCart();
  }
  function renderCartInner() {
    const t = totals();
    if (!cart.length) {
      $("#cart-body").innerHTML = '<div class="empty"><strong>Your cart is empty</strong>Add a drink to get started.<div class="row"><button class="btn gold" type="button" data-act="close" data-target="cart">Browse drinks</button></div></div>';
      $("#cart-foot").innerHTML = '<button class="wa" type="button" disabled>Order on WhatsApp</button>';
      return;
    }
    const lines = cart.map(l => {
      const p = byId(l.id), s = sizeOf(p, l.size), at = l.qty >= s.stock;
      return '<div class="line"><div><div class="nm">' + esc(p.name) + '</div><div class="sub">' + esc(l.size) + " · " + kes(s.price) + (at && s.stock < UNTRACKED ? " · max available" : "") + "</div></div>"
        + '<div class="tot">' + kes(s.price * l.qty) + "</div>"
        + '<div class="qty"><button type="button" data-act="cq" data-d="-1" data-id="' + esc(l.id) + '" data-size="' + esc(l.size) + '" aria-label="Decrease ' + esc(p.name) + '">−</button><output>' + l.qty + '</output><button type="button" data-act="cq" data-d="1" data-id="' + esc(l.id) + '" data-size="' + esc(l.size) + '" aria-label="Increase ' + esc(p.name) + '" ' + (at ? "disabled" : "") + ">+</button></div>"
        + '<button class="link" type="button" data-act="rm" data-id="' + esc(l.id) + '" data-size="' + esc(l.size) + '" style="justify-self:end" aria-label="Remove ' + esc(p.name) + '">Remove</button></div>';
    }).join("");
    const opt = (v, title, sub) => '<label class="opt"><input type="radio" name="dl" value="' + v + '" ' + (delivery === v ? "checked" : "") + "><span>" + title + "<small>" + sub + "</small></span></label>";
    $("#cart-body").innerHTML = lines
      + '<fieldset style="border:0;padding:0;margin:0"><legend class="sr">Delivery option</legend><div class="opts">'
      + opt("town", "Delivery in " + esc(C.delivery.zone) + " · " + kes(C.delivery.fee), "Until " + fmtH(C.delivery.cutoffHour) + " daily")
      + opt("outside", "Delivery outside " + esc(C.delivery.zone), "Fee agreed with you on WhatsApp")
      + opt("pickup", "Pick up from the shop · free", esc(C.address.street) + ", " + esc(C.address.town))
      + "</div></fieldset>"
      + '<label class="field"><span>Your name (optional)</span><input id="nm" value="' + esc(custName) + '" autocomplete="name" placeholder="So we know who to ask for"></label>'
      + (delivery !== "pickup" ? '<label class="field"><span>Delivery location (estate, building, landmark)</span><input id="loc" value="' + esc(loc) + '" placeholder="e.g. Kilimo Estate, near the church" autocomplete="street-address"></label>' : "")
      + (delivery !== "pickup" && deliveryClosed() ? '<div class="warn">Delivery for today has ended (until ' + fmtH(C.delivery.cutoffHour) + "). You can still send your order and we will confirm a time, or pick up before we close.</div>" : "");
    const dText = delivery === "town" ? kes(C.delivery.fee) : delivery === "pickup" ? "Free" : "To confirm";
    $("#cart-foot").innerHTML = '<div class="sum"><div><span>Items</span><span>' + kes(t.items) + "</span></div><div><span>Delivery</span><span>" + dText + "</span></div>"
      + '<div class="grand"><span>Total</span><span>' + (delivery === "outside" ? kes(t.items) + " + delivery" : kes(t.total)) + "</span></div></div>"
      + '<button class="wa" type="button" data-act="send">Order on WhatsApp</button>'
      + '<p class="note">Pay by ' + esc(C.payment) + " · " + C.minAge + "+ · ID may be requested on delivery</p>"
      + '<div class="foot-links"><button class="link" type="button" data-act="copy">Copy order text</button><button class="link" type="button" data-act="clear">Clear cart</button></div>'
      + '<p class="note" style="margin-top:0">Order ref: ' + esc(ref || "") + "</p>";
  }

  /* ---------- overlays, focus, inert ---------- */
  let lastFocus = null, openId = null;
  function setInert(on) {
    ["header.top", "main", "footer", "#bar", ".skip"].forEach(sel => { const el = $(sel); if (el) { if (on) el.setAttribute("inert", ""); else el.removeAttribute("inert"); } });
  }
  function openOverlay(id) {
    lastFocus = document.activeElement;
    $("#" + id).classList.add("show");
    document.body.classList.add("locked");
    setInert(true); openId = id; renderCartUI();
    const f = $("#" + id + " .sheet button:not([disabled]), #" + id + " .sheet input"); if (f) f.focus();
  }
  function closeOverlay(id) {
    $("#" + id).classList.remove("show");
    document.body.classList.remove("locked");
    setInert(false); openId = null; renderCartUI();
    if (lastFocus && document.contains(lastFocus) && lastFocus.focus) lastFocus.focus();
  }
  function openCartDrawer() { renderCart(); openOverlay("cart"); }
  document.addEventListener("keydown", e => {
    if (!openId) return;
    if (e.key === "Escape") { closeOverlay(openId); return; }
    if (e.key !== "Tab") return;
    const nodes = $$("#" + openId + " button:not([disabled]), #" + openId + " input, #" + openId + " a[href]").filter(n => n.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- actions ---------- */
  function flash(btn) {
    const old = btn.textContent; btn.textContent = "Added ✓"; btn.disabled = true;
    setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 900);
  }
  function sendOrder() {
    if (!cart.length) return;
    if (delivery !== "pickup" && !loc.trim()) toast("Tip: add your delivery location so we can confirm faster");
    const a = document.createElement("a");
    a.href = "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(buildMessage());
    a.target = "_blank"; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
  }
  async function copyOrder() {
    try { await navigator.clipboard.writeText(buildMessage()); toast("Order copied. Paste it into WhatsApp."); }
    catch (e) { toast("Couldn't copy. Please use the WhatsApp button."); }
  }
  function clearFilters() {
    category = "All"; query = ""; sort = "pop"; $("#q").value = ""; $("#sort").value = "pop"; renderRail(); renderGrid();
  }

  document.addEventListener("click", e => {
    const bd = e.target;
    if (bd.classList && bd.classList.contains("overlay") && (bd.id === "pm" || bd.id === "cart")) { closeOverlay(bd.id); return; }
    const t = e.target.closest("[data-act]"); if (!t) return;
    const d = t.dataset;
    switch (d.act) {
      case "cat":
        category = d.cat; renderRail(); renderGrid();
        { const on = $('.chip[aria-pressed="true"]'); if (on) on.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); }
        break;
      case "open": openProduct(d.id); break;
      case "quick": {
        const p = byId(d.id);
        if (addToCart(p.id, p.sizes[0].label, 1)) { flash(t); toast("Added to cart", { label: "View cart", fn: openCartDrawer }); }
        else toast("That's all we have in stock");
        break;
      }
      case "close": closeOverlay(d.target); break;
      case "size": pm.size = d.size; pm.qty = 1; renderProduct(); break;
      case "pmqty": pm.qty += parseInt(d.d, 10); renderProduct(); break;
      case "pmadd": {
        const p = byId(pm.id), ok = addToCart(pm.id, pm.size, pm.qty);
        closeOverlay("pm");
        toast(ok ? "Added to cart" : "Added the last " + p.name + " we have", { label: "View cart", fn: openCartDrawer });
        break;
      }
      case "opencart": openCartDrawer(); break;
      case "cq": { const l = cart.find(x => x.id === d.id && x.size === d.size); if (l) setQty(l.id, l.size, l.qty + parseInt(d.d, 10)); break; }
      case "rm": {
        const l = cart.find(x => x.id === d.id && x.size === d.size); if (!l) break;
        const removed = { id: l.id, size: l.size, qty: l.qty }, name = byId(l.id).name;
        setQty(d.id, d.size, 0);
        toast("Removed " + name, { label: "Undo", fn: () => { addToCart(removed.id, removed.size, removed.qty); } });
        break;
      }
      case "clear": {
        const backup = cart.slice();
        cart = []; ref = null; saveCart(); renderCartUI();
        toast("Cart cleared", { label: "Undo", fn: () => { cart = backup; ref = newRef(); saveCart(); renderCartUI(); } });
        break;
      }
      case "send": sendOrder(); break;
      case "copy": copyOrder(); break;
      case "retry": loadCatalogue(); break;
      case "clearfilters": clearFilters(); break;
      case "toast-action": { const fn = toastFn; $("#toast").classList.remove("show"); if (fn) fn(); break; }
    }
  });
  document.addEventListener("change", e => { if (e.target.name === "dl") { delivery = e.target.value; saveCart(); renderCart(); } });
  document.addEventListener("input", e => {
    if (e.target.id === "loc") { loc = e.target.value; saveCart(); }
    if (e.target.id === "nm") { custName = e.target.value; saveCart(); }
  });
  $("#q").addEventListener("input", e => { query = e.target.value; renderGrid(); });
  $("#sort").addEventListener("change", e => { sort = e.target.value; renderGrid(); });

  /* ---------- age gate ---------- */
  const GATE_DAYS = 30;
  function gateOk() {
    const v = parseInt(store.get("nexa_18") || "0", 10);
    return v && Date.now() - v < GATE_DAYS * 864e5;
  }
  function initGate() {
    if (gateOk()) return;
    $("#gate").classList.add("show"); document.body.classList.add("locked"); setInert(true);
    $("#gate-yes").focus();
    $("#gate-yes").onclick = () => {
      store.set("nexa_18", String(Date.now()));
      $("#gate").classList.remove("show"); document.body.classList.remove("locked"); setInert(false); renderCartUI();
    };
    $("#gate-no").onclick = () => {
      $("#gate-title").textContent = "Sorry, you can't enter";
      $("#gate-text").textContent = "This site is for adults aged " + C.minAge + " and over.";
      $("#gate-actions").style.display = "none";
    };
  }

  /* ---------- init ---------- */
  applyConfig(); renderStatus(); setInterval(renderStatus, 60000);
  initGate();
  loadCatalogue();
})();
