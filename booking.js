/* =====================================================================
   THE OLD PRINTWORKS — BOOKING CONFIG
   EDIT THIS BLOCK with the real numbers. Everything else can stay.
   ===================================================================== */
const CONFIG = {
  NIGHTLY_RATE: 65,      // £ per room per night        (PLACEHOLDER — confirm!)
  CLEANING_FEE: 0,       // £ one-off per booking       (PLACEHOLDER — set if she charges one)
  WEEKLY_DISC: 0.10,     // 10% off stays of 7+ nights  (PLACEHOLDER)
  MONTHLY_DISC: 0.20,    // 20% off stays of 28+ nights (PLACEHOLDER)
  MIN_NIGHTS: 1,         // minimum stay                (PLACEHOLDER)
};
/* ===================================================================== */

const ci = document.getElementById('checkin');
const co = document.getElementById('checkout');
const qty = document.getElementById('roomqty');
const quote = document.getElementById('quote');
const paybtn = document.getElementById('paybtn');

const iso = d => d.toISOString().split('T')[0];
ci.min = iso(new Date());

const gbp = n => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nightsBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

function updateQuote() {
  if (ci.value) {
    const next = new Date(ci.value);
    next.setDate(next.getDate() + CONFIG.MIN_NIGHTS);
    co.min = iso(next);
    if (co.value && co.value < co.min) co.value = '';
  }
  if (!ci.value || !co.value) {
    quote.innerHTML = '<div class="quote-empty">Choose your dates to see a price.</div>';
    return;
  }

  const nights = nightsBetween(ci.value, co.value);
  const rooms = parseInt(qty.value, 10);
  const subtotal = nights * rooms * CONFIG.NIGHTLY_RATE;

  let discRate = 0, discLabel = '';
  if (nights >= 28) { discRate = CONFIG.MONTHLY_DISC; discLabel = 'Monthly-stay discount (' + (CONFIG.MONTHLY_DISC * 100) + '%)'; }
  else if (nights >= 7) { discRate = CONFIG.WEEKLY_DISC; discLabel = 'Weekly-stay discount (' + (CONFIG.WEEKLY_DISC * 100) + '%)'; }

  const discount = subtotal * discRate;
  const total = subtotal - discount + CONFIG.CLEANING_FEE;

  let html =
    '<div class="quote-row"><span>' + rooms + ' room' + (rooms > 1 ? 's' : '') + ' × ' + nights +
    ' night' + (nights > 1 ? 's' : '') + ' × ' + gbp(CONFIG.NIGHTLY_RATE) + '</span><span>' + gbp(subtotal) + '</span></div>';
  if (discount > 0) {
    html += '<div class="quote-row discount"><span>' + discLabel + '</span><span>−' + gbp(discount) + '</span></div>';
  }
  if (CONFIG.CLEANING_FEE > 0) {
    html += '<div class="quote-row"><span>Cleaning fee</span><span>' + gbp(CONFIG.CLEANING_FEE) + '</span></div>';
  }
  html += '<div class="quote-row total"><span>Total</span><span class="amt">' + gbp(total) + '</span></div>';
  quote.innerHTML = html;
}

['change', 'input'].forEach(ev => {
  ci.addEventListener(ev, updateQuote);
  co.addEventListener(ev, updateQuote);
  qty.addEventListener(ev, updateQuote);
});

paybtn.addEventListener('click', () => {
  if (!ci.value || !co.value) {
    quote.innerHTML = '<div class="quote-empty">Please choose your check-in and check-out dates first.</div>';
    ci.focus();
    return;
  }
  /* =====================================================================
     NEXT STEP — STRIPE:
     Once the Stripe account exists, this handler will call a small
     serverless function that creates a Stripe Checkout session and
     redirects the guest to pay. On success, Stripe sends them to
     confirmation.html. For now it's a demo:
     ===================================================================== */
  alert('Demo: this button will redirect to Stripe Checkout once payments are connected.\n\n' +
        'Booking: ' + qty.value + ' room(s), ' + ci.value + ' → ' + co.value);
});
