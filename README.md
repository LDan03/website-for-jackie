# The Old Printworks — Kirkwall, Orkney

Direct-booking website. Static site — deployable on GitHub Pages, Cloudflare Pages, Netlify or Vercel for free.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Landing page + booking widget (date picker, live quote) |
| `gallery.html` | Photo gallery (placeholder slots ready for real photos) |
| `terms.html` | Booking terms / cancellation policy (**DRAFT — confirm every policy**) |
| `confirmation.html` | "Booking confirmed" page — Stripe will redirect here after payment |
| `booking.js` | Pricing config + quote calculator |
| `styles.css` | Shared styles |
| `images/` | Photos |

## Deploy on GitHub Pages (5 minutes)

1. Create a new repo (e.g. `oldprintworks`) and push these files to the root of the `main` branch
2. Repo → **Settings → Pages**
3. Source: **Deploy from a branch** → Branch: `main` / `/ (root)` → Save
4. Site goes live at `https://YOUR-USERNAME.github.io/oldprintworks/` within a minute or two
5. When you buy `theoldprintworksorkney.com`, add it under Settings → Pages → Custom domain

## Before going live — checklist

- [ ] `booking.js` — set the real `NIGHTLY_RATE`, `CLEANING_FEE`, discounts and `MIN_NIGHTS` (top of file)
- [ ] Replace `CONTACT_EMAIL_HERE` everywhere (search all files) with a real email address
- [ ] `terms.html` — confirm cancellation policy, check-in/out times, house rules; delete the yellow ⚠ notes
- [ ] `gallery.html` — drop real photos into `images/` and swap out the placeholder tiles
- [ ] `index.html` FAQ — confirm check-in/check-out times
- [ ] Connect Stripe (see below)

## Still to build (needs her Stripe account + iCal link)

1. **Stripe Checkout** — a small serverless function (Cloudflare Workers / Vercel — both free) that creates a Checkout session from the chosen dates and redirects to payment; success URL → `confirmation.html`
2. **Availability sync** — read her Airbnb/Booking.com iCal feed to grey out booked dates in the picker, and record direct bookings so they block dates too
3. **Booking notification emails** — to her and the guest

Note: GitHub Pages only serves static files, so when we add the Stripe function the easiest move is deploying this same repo to **Cloudflare Pages** instead (identical workflow, supports functions). GitHub Pages is perfect for now.
