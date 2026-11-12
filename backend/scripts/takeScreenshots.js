const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, '../../screenshots');
const BASE_URL = 'http://127.0.0.1:5173';

async function capture() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();

  try {
    // 1. Home / Hotel Search Page
    console.log('Capturing: 01-hotel-search-home.png');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-hotel-search-home.png'), fullPage: false });

    // 2. Hotel Filtered Search (e.g. Goa)
    console.log('Capturing: 02-hotel-search-filtered.png');
    await page.type('#search-location', 'Goa');
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-hotel-search-filtered.png'), fullPage: false });

    // 3. Hotel Details Page
    console.log('Capturing: 03-hotel-details.png');
    await page.goto(`${BASE_URL}/hotels/1?checkIn=2026-11-20&checkOut=2026-11-23`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-hotel-details.png'), fullPage: false });

    // 4. Booking Page with Price Summary
    console.log('Capturing: 04-booking-form-pricing.png');
    await page.goto(`${BASE_URL}/book/1?checkIn=2026-11-20&checkOut=2026-11-23`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 800));
    await page.type('#guestName', 'Aman Sharma');
    await page.type('#guestEmail', 'aman.sharma@example.com');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-booking-form-pricing.png'), fullPage: false });

    // 5. Booking Confirmation Page
    console.log('Capturing: 05-booking-confirmation.png');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-booking-confirmation.png'), fullPage: false });

    // Read the generated booking reference from the confirmation page
    const bookingRef = await page.$eval('.ref-code', (el) => el.innerText.trim());
    console.log(`Generated Booking Reference: ${bookingRef}`);

    // 6. Manage Booking Page (Retrieve with Reference + Email)
    console.log('Capturing: 06-manage-booking-retrieval.png');
    await page.goto(`${BASE_URL}/manage-booking?reference=${encodeURIComponent(bookingRef)}&email=aman.sharma@example.com`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-manage-booking-retrieval.png'), fullPage: false });

    // 7. Booking Cancellation
    console.log('Capturing: 07-booking-cancellation.png');
    await page.click('button.btn-danger'); // Open cancel modal
    await new Promise((r) => setTimeout(r, 500));
    // Click confirm in modal
    const buttons = await page.$$('button.btn-danger');
    if (buttons.length > 1) {
      await buttons[1].click(); // The modal confirm button
    }
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-booking-cancellation.png'), fullPage: false });

    // 8. Surprise Feature: Sold out stay showing Flexible Date Suggestions
    console.log('Capturing: 08-surprise-feature-flexible-dates.png');
    // First, let's book up the capacity of Hotel 5 (Manali, capacity 4) for a specific date window via backend API
    const bookingData = {
      hotelId: 5,
      guestName: 'Full House Guest',
      guestEmail: 'fullhouse@example.com',
      checkIn: '2026-11-28',
      checkOut: '2026-11-30',
    };
    for (let i = 0; i < 4; i++) {
      try {
        await fetch('http://localhost:5000/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...bookingData, guestEmail: `fullhouse${i}@example.com` }),
        });
      } catch (e) {}
    }

    // Now visit hotel 5 for those dates
    await page.goto(`${BASE_URL}/hotels/5?checkIn=2026-11-28&checkOut=2026-11-30`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-surprise-feature-flexible-dates.png'), fullPage: false });

    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('Screenshot error:', err);
  } finally {
    await browser.close();
  }
}

capture();

