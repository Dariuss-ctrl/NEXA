# Roadmap

Legend: [x] done in the code, [ ] still to do. Items marked **needs you** can only be completed with information or photos from the shop.

## 1. Content and trust (before launch)

- [ ] **Verify business identity** (needs you): registered business name goes in `legalName`. Confirm the trading name is NEXA LOUNGE everywhere.
- [ ] **Verify county liquor licence** (needs you): put the licence number in `licenceNo`; it then shows in the footer. Check the licence is current with the county.
- [ ] **Verify phone/WhatsApp** (needs you): confirm the number in `config.js` receives WhatsApp messages. Send a test order end to end.
- [ ] **Verify address and Google Maps** (needs you): the Google listing is still under the previous name ("COMRADE LIQUOR STORE"). Update the listing, then copy a fresh embed link into `mapsEmbedUrl`.
- [ ] **Verify opening and delivery hours** (needs you): check `hours` and `delivery.cutoffHour` in `config.js`.
- [ ] **Verify delivery fee and zone** (needs you): KES 50 within Embu Town is configured. Confirm what counts as "Embu Town".
- [ ] **Replace the sample catalogue** (needs you): edit `data/products.json`, then set `"sample": false`.
- [ ] **Verify prices** (needs you): every price in `products.json`, per size.
- [ ] **Add real product photography** (needs you): see "Product photos" in the README.
- [x] Fix stock display: per-size stock in the product view, "Only N left" at or below the threshold, out-of-stock items cannot be added, quantities stop at available stock.
- [x] Polish product modal: size picker with prices, quantity stepper, live total on the button, keeps you browsing after adding.
- [x] Polish cart: line items, quantity steppers, undo on remove and clear, delivery options, optional name, location field.
- [x] Polish WhatsApp order format: reference, one block per item, items, delivery, total, name, location, payment, age confirmation. "Copy order text" as a fallback.
- [x] Fix age wording: entry prompt says what you confirm; policies say ID may be checked on delivery or collection; the age check expires after 30 days.
- [ ] **Finish privacy/terms/delivery information** (needs you): policies are written and driven by `config.js` but are drafts. Have them reviewed and adjust to how the shop really works (refund policy, ID checks, complaints contact).

## 2. UX polish

- [x] Mobile polish: safe-area padding, 44px tap targets, bottom-sheet product view.
- [x] Search polish: ignores punctuation ("daniels" finds "Jack Daniel's"), matches sizes, empty state with "Clear filters" and "Ask on WhatsApp".
- [x] Category UX: chips scroll the active one into view; default view is "Popular tonight" then "More drinks".
- [x] Empty and error states: catalogue load failure with retry and WhatsApp link, empty cart, no results, no-JavaScript message, 404 page.
- [x] Button feedback: "Added" state, toasts with View cart and Undo, pressed states.
- [x] Typography and spacing: tabular numbers for prices, balanced headings, consistent spacing scale.
- [x] Product cards: identical canvas, stock badge, price, size summary.
- [x] Sticky cart bar with item count and total.
- [x] Loading and performance: skeleton cards while loading, lazy images with fixed dimensions, preload of the catalogue, cached static assets, no external fonts or libraries.
- [x] Accessibility: skip link, labelled controls, dialogs hide the page behind them, focus kept in dialogs and restored on close, live regions, reduced-motion support.
- [ ] Run Lighthouse on the live URL and fix anything it flags once real photos are in.
- [ ] Check with a screen reader on a real phone.

## 3. Structure and operations

- [x] Split HTML, CSS and JS.
- [x] Move the catalogue to `data/products.json`.
- [x] Centralise configuration in `js/config.js`.
- [x] Organise product images in `images/products/`.
- [x] README, CHANGELOG, validation script.
- [x] Deployment workflow: GitHub to Vercel with preview URLs, plus a GitHub Action that validates the catalogue.
- [x] SEO files: `robots.txt`, `sitemap.xml`, canonical and Open Graph tags, LiquorStore structured data.
- [ ] **GitHub cleanup** (needs you): create the repository, push, delete old experiments and unused files.
- [ ] **Domain** (needs you): buy and connect a branded domain, then replace `YOUR-DOMAIN.example` (README has the command).
- [ ] Add `images/og.jpg` and submit the sitemap in Search Console.
- [ ] Run `npm run check-launch` and make it pass.

## Later (only if the business needs it)

- Product structured data and per-product pages for search.
- Analytics (with a privacy notice update) and order-click tracking.
- A simple admin for stock and prices (a Google Sheet exported to JSON, or a small CMS) so the shop can update stock without editing files.
- Content Security Policy headers.
- Promotions, new arrivals and related bottles.
