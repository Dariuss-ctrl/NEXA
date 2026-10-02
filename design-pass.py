#!/usr/bin/env python3
"""Design pass for the liquor store page.
Run from your project folder:   python3 design-pass.py index.html
Makes index.backup.html first, then edits index.html in place.
Prints anything it could not find so you can tell me and I will fix it."""
import sys, shutil

path = sys.argv[1] if len(sys.argv) > 1 else "index.html"
shutil.copy(path, "index.backup.html")
s = open(path, encoding="utf-8").read()
miss = []

def rep(a, b, n=1):
    global s
    if s.count(a) != n:
        miss.append(a[:70]); return
    s = s.replace(a, b)

def block(a, b, new):
    global s
    try:
        i = s.index(a); j = s.index(b)
    except ValueError:
        miss.append(a[:70]); return
    s = s[:i] + new + s[j:]

# ---- fonts, body, theme colour
rep('family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Great+Vibes&display=swap',
    'family=Bricolage+Grotesque:wght@600;800&family=Public+Sans:wght@400;500;600&display=swap')
rep('<body class="font-serif">', '<body class="font-sans">')
rep('content="#0a0a0a"', 'content="#171a18"')

# ---- palette: one action colour (bottle green); prices in plain text colour
block('/* ---------- Theme tokens ---------- */', 'body { background:var(--bg); color:var(--text); }', '''/* ---------- Theme tokens ---------- */
  :root, :root[data-theme="dark"] {
    --bg:#171a18; --bg-blur:rgba(23,26,24,.94); --surface:#1f2321; --surface2:#2a2f2c;
    --text:#eeeee8; --muted:#a0a59f; --accent:#6fd49a; --accent-bg:#1f7a4c; --accent-on:#fff;
    --line:rgba(238,238,232,.1); --line-strong:rgba(238,238,232,.22);
    --input:#1f2321; --input-line:#3a403c; --glow:transparent; --wa-text:#6fd49a;
    --shadow:none; color-scheme:dark;
  }
  :root[data-theme="light"] {
    --bg:#f4f5f2; --bg-blur:rgba(244,245,242,.94); --surface:#ffffff; --surface2:#e9ebe6;
    --text:#161814; --muted:#5d625b; --accent:#17663d; --accent-bg:#17663d; --accent-on:#fff;
    --line:rgba(22,24,20,.12); --line-strong:rgba(22,24,20,.3);
    --input:#ffffff; --input-line:#c9cdc5; --glow:transparent; --wa-text:#17663d;
    --shadow:none; color-scheme:light;
  }
  ''')
rep('transform:translateY(-3px); }', ' }')
rep('</style>', '''  body, body .font-sans { font-family:"Public Sans",system-ui,sans-serif; }
  body .font-serif { font-family:"Bricolage Grotesque","Public Sans",system-ui,sans-serif; letter-spacing:-.01em; }
  .tab-active, .tab-active:hover, .menu-active, .menu-active:hover { color:var(--accent-on); }
  .hero-overlay { background:linear-gradient(to bottom,color-mix(in srgb,var(--bg) 80%,transparent),var(--bg)); }
</style>''')

# ---- age gate
block('<!-- ============ AGE GATE ============ -->', '<!-- ============ HEADER + CATEGORY BAR (sticky) ============ -->', '''<!-- ============ AGE GATE ============ -->
<div id="ageGate" class="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="ageTitle">
  <div class="max-w-sm w-full bg-surface b-strong rounded-xl p-8">
    <p class="font-serif text-5xl font-extrabold t-main mb-4">18+</p>
    <h2 id="ageTitle" class="font-serif text-2xl font-bold mb-2 t-main">Are you 18 or older?</h2>
    <p class="t-muted text-sm mb-6 font-sans">We sell alcohol, so you must be of legal drinking age to enter.</p>
    <div class="flex gap-3 font-sans">
      <button onclick="enterSite(true)" class="flex-1 btn-gold font-semibold py-3 rounded-lg transition">Yes, I'm 18 or older</button>
      <button onclick="enterSite(false)" class="flex-1 bg-surface2 t-muted py-3 rounded-lg transition">No</button>
    </div>
  </div>
</div>

''')

# ---- header wordmark (no emoji logo)
rep('<span class="text-2xl">🥃</span>', '')
rep('<span class="text-lg font-bold tracking-widest hidden md:block t-main">',
    '<span class="font-serif text-xl font-extrabold hidden sm:block t-main">')

# ---- hero: what, where, when, how, and the next step, with products right below
block('<!-- ============ HERO (All view only) ============ -->', '<!-- ============ SHOP ============ -->', '''<!-- ============ HERO (All view only) ============ -->
<section id="hero" class="relative overflow-hidden">
  <div class="absolute inset-0 bg-cover bg-center" style="background-image:url('images/hero.webp')"></div>
  <div class="absolute inset-0 hero-overlay"></div>
  <div class="relative max-w-6xl mx-auto px-4 py-8 md:py-14">
    <p class="openPill inline-flex items-center gap-2 text-sm font-sans mb-3 t-muted"></p>
    <h1 class="font-serif text-4xl md:text-6xl font-extrabold leading-[1.05] max-w-xl t-main">Cold drinks delivered in [TOWN NAME] until 6 PM</h1>
    <p class="t-muted max-w-md mt-3 font-sans">Pick your bottles, send the order on WhatsApp, and pay when it arrives.</p>
    <div class="flex flex-wrap gap-3 mt-6 font-sans">
      <a id="browseBtn" href="#all" class="btn-gold font-semibold px-6 py-3 rounded-lg transition">Shop drinks</a>
      <a class="wa-link btn-outline-wa font-semibold px-6 py-3 rounded-lg transition" target="_blank" rel="noopener">Ask on WhatsApp</a>
    </div>
    <p class="mt-5 text-sm t-muted font-sans">Same-day delivery. Cash or M-Pesa. 18+ only.</p>
  </div>
</section>

''')

# ---- shop heading: left-aligned, plain sentence case
rep('<div id="shopHead" class="text-center mb-8"></div>', '<div id="shopHead" class="mb-5"></div>')
rep('class="flex justify-center gap-2 mb-6 font-sans text-sm"', 'class="flex gap-2 mb-4 font-sans text-sm"')
rep('<section id="shop" class="max-w-6xl mx-auto px-4 pt-10 pb-16">', '<section id="shop" class="max-w-6xl mx-auto px-4 pt-8 pb-16">')
rep('<p class="font-script text-3xl t-accent">Browse our</p><h2 class="text-4xl font-black t-main">PRODUCTS</h2>',
    '<h2 class="font-serif text-3xl font-extrabold t-main">All drinks</h2>')
rep('<p class="font-script text-3xl t-accent">Our collection of</p><h2 class="text-4xl font-black t-main">${info.emoji} ${c.toUpperCase()}</h2>${info.blurb ? `<p class="t-muted font-sans text-sm mt-3 max-w-md mx-auto">${info.blurb}</p>` : ""}',
    '<h2 class="font-serif text-3xl font-extrabold t-main">${c}</h2>${info.blurb ? `<p class="t-muted text-sm mt-2 max-w-md">${info.blurb}</p>` : ""}')

# ---- category tabs and menu: text only
rep('${r.emoji} ${r.label}', '${r.label}', 2)

# ---- how it works: a real sequence, plain numerals, no cards
block('<!-- ============ HOW IT WORKS (All view only) ============ -->', '<!-- ============ INFO ============ -->', '''<!-- ============ HOW IT WORKS (All view only) ============ -->
<section id="how" class="bt-soft">
  <div class="max-w-6xl mx-auto px-4 py-12">
    <h2 class="font-serif text-3xl font-extrabold mb-8 t-main">How ordering works</h2>
    <ol class="grid md:grid-cols-3 gap-8 font-sans">
      <li><p class="font-serif text-4xl font-extrabold t-accent">1</p><h3 class="font-semibold mt-2 t-main">Pick your drinks</h3><p class="text-sm t-muted mt-1">Browse the catalogue and tap Add on anything you like.</p></li>
      <li><p class="font-serif text-4xl font-extrabold t-accent">2</p><h3 class="font-semibold mt-2 t-main">Send on WhatsApp</h3><p class="text-sm t-muted mt-1">Open your cart and send the order. We confirm the price and delivery time in the chat.</p></li>
      <li><p class="font-serif text-4xl font-extrabold t-accent">3</p><h3 class="font-semibold mt-2 t-main">Pay on delivery</h3><p class="text-sm t-muted mt-1">We bring it to your door. Pay cash or M-Pesa when it arrives.</p></li>
    </ol>
  </div>
</section>

''')

# ---- info + footer: drop emoji
rep('🕐 Store Hours &amp; Delivery', 'Store hours and delivery')
rep('📍 Find Us', 'Find us')
rep(' 🔞 Strictly 18+.', ' Strictly 18+.')

# ---- product cards: name, then price (largest), one clear Add button, quieter badges
rep('text-[10px] font-sans font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2',
    'text-[11px] font-sans font-semibold px-2 py-0.5 rounded mb-2', 2)
rep('{ "Bestseller":"btn-gold", "New":"bg-green-700 text-white", "Premium":"bg-purple-800 text-white" }',
    '{ "Bestseller":"btn-gold", "New":"b-strong t-main", "Premium":"b-strong t-main" }')
rep('class="bg-green-700 hover:bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-full transition">Add</button>',
    'class="btn-gold text-sm font-semibold px-4 py-2 rounded-lg transition">Add</button>')
rep('card.className = "card rounded-2xl p-4 flex flex-col"', 'card.className = "card rounded-lg p-3 flex flex-col"')
rep('''      <p class="text-xs t-accent uppercase tracking-wide font-sans">${p.cat}</p>
      <h3 class="dim font-semibold mt-1 t-main">${p.name}</h3>''',
    '''      <h3 class="dim font-serif font-semibold leading-snug t-main">${p.name}</h3>''')
rep('<span class="dim font-bold t-accent">${fmt(p.price)}</span>',
    '<span class="dim font-serif text-lg font-extrabold t-main">${fmt(p.price)}</span>')
rep('<p class="text-xs t-accent uppercase tracking-wide">${p.cat} · ${p.size}</p>', '<p class="text-sm t-muted">${p.cat}, ${p.size}</p>')
rep('<p class="text-xl font-bold t-accent mt-3">${fmt(p.price)}</p>', '<p class="font-serif text-2xl font-extrabold t-main mt-3">${fmt(p.price)}</p>')

open(path, "w", encoding="utf-8").write(s)
print("Done. Backup saved as index.backup.html")
print("Not found (tell me these):", miss if miss else "none")
