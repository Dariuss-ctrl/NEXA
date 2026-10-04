# Changelog

## 0.2.0 — 2026-10-03

- Split the single `index.html` into HTML, CSS, JS, config and a JSON catalogue.
- Catalogue now loads from `data/products.json`, with loading skeleton, error state and retry.
- All business details centralised in `js/config.js` (info panel, policies, cart, message, status badge and structured data read from it).
- Stock display fixed: card shows the right state for multi-size products, product view shows stock per size, quantities capped.
- Product view: keeps you browsing after adding, live total on the button.
- Cart: undo for remove and clear, optional name, copy order text, delivery-after-cutoff warning.
- WhatsApp message reformatted (bold header, one block per item, optional name, clearer total).
- Search ignores punctuation and matches sizes; empty state offers clear filters and ask-on-WhatsApp.
- Accessibility: skip link, inert page behind dialogs, focus kept on re-render, live regions.
- Age wording clarified; age confirmation expires after 30 days.
- Added 404 page, favicon, `robots.txt`, `sitemap.xml`, `vercel.json` headers and caching.
- Added `scripts/validate.mjs`, GitHub Action, `.gitignore`, README and ROADMAP.
- Sample catalogue now shows a visible banner so placeholder prices cannot go live unnoticed.

## 0.1.0 — 2026-10-03

- First storefront: product cards, category rail, product modal with sizes, cart with delivery options, WhatsApp order message, age gate, hours and map.
