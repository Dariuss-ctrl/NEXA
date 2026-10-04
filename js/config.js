/* ==========================================================================
   NEXA LOUNGE — central configuration
   Everything about the business that appears on the site lives here.
   Change a value here and the info panel, policies, cart, WhatsApp message,
   open/closed badge and SEO data all follow.
   ========================================================================== */
window.NEXA = {
  // --- Identity (VERIFY before launch) ---------------------------------
  name: "NEXA LOUNGE",
  tagline: "Drinks delivered in Embu Town",
  legalName: "",          // registered business name, shown in the footer when set
  licenceNo: "",          // county liquor licence number, shown in the footer when set

  // --- Contact (VERIFY before launch) ----------------------------------
  whatsapp: "254722648792",           // international format, digits only
  phoneDisplay: "+254 722 648 792",
  address: { street: "Mama Ngina St", town: "Embu Town", locality: "Embu", country: "KE" },
  // The Google listing is still under the shop's previous name; update the listing, then re-copy the embed.
  mapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m16!1m11!1m3!1d3!2d37.4548038!3d-0.5331786!2m2!1f0!2f90!3m2!1i1024!2i768!4f80.41127388401475!3m3!1m2!1s0x18262df3e2b1dc0d%3A0xe6b2d9c33738a3dd!2sCOMRADE%20LIQUOR%20STORE!4v1790852374870",

  // --- Hours (VERIFY before launch) ------------------------------------
  // Opening and closing hour in 24h time, per weekday. null = closed all day.
  timezone: "Africa/Nairobi",
  hours: { 0: [10, 18], 1: [9, 20], 2: [9, 20], 3: [9, 20], 4: [9, 20], 5: [9, 20], 6: [9, 20] }, // 0 = Sunday

  // --- Delivery and payment (VERIFY before launch) ---------------------
  delivery: { fee: 50, zone: "Embu Town", cutoffHour: 18 },
  payment: "M-Pesa or cash on delivery",
  minAge: 18,
  lowStockThreshold: 3,   // "Only N left" is shown at or below this number

  // --- Site ------------------------------------------------------------
  catalogueUrl: "data/products.json",
  siteUrl: "https://YOUR-DOMAIN.example"   // replace everywhere before launch (see README)
};
