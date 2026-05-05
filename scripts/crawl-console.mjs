import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'colinbarrettfox@gmail.com';
const PASSWORD = 'Colinpass1!';

const PAGES = [
  '/',
  '/sections',
  '/units',
  '/profile',
  '/settings',
  '/leaderboard',
  '/guilds',
  '/skills',
  '/instructor/gamification',
  '/offline',
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const allMessages = {};

  // Collect console messages per page
  let currentPageMessages = [];
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      currentPageMessages.push({ type, text: msg.text() });
    }
  });
  page.on('pageerror', (err) => {
    currentPageMessages.push({ type: 'pageerror', text: err.message });
  });

  // Login
  console.log('Navigating to login page...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 120000 });
  
  await page.getByRole('textbox', { name: 'Email' }).fill(EMAIL);
  await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  
  // Wait for login to complete
  await page.waitForTimeout(5000);
  console.log('Logged in. Starting crawl...\n');

  // Clear messages from login
  currentPageMessages = [];

  for (const path of PAGES) {
    currentPageMessages = [];
    const url = `${BASE_URL}${path}`;
    console.log(`--- Navigating to ${path} ---`);
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(5000); // Wait for async effects
    } catch (e) {
      currentPageMessages.push({ type: 'navigation-error', text: e.message });
    }
    
    allMessages[path] = [...currentPageMessages];
    
    const errors = currentPageMessages.filter(m => m.type === 'error' || m.type === 'pageerror');
    const warnings = currentPageMessages.filter(m => m.type === 'warning');
    
    if (errors.length > 0 || warnings.length > 0) {
      console.log(`  Errors: ${errors.length}, Warnings: ${warnings.length}`);
      errors.forEach(e => console.log(`    [ERROR] ${e.text.substring(0, 200)}`));
      warnings.forEach(w => console.log(`    [WARN] ${w.text.substring(0, 200)}`));
    } else {
      console.log('  Clean ✓');
    }
  }

  console.log('\n\n=== SUMMARY ===');
  let totalErrors = 0;
  let totalWarnings = 0;
  for (const [path, msgs] of Object.entries(allMessages)) {
    const errors = msgs.filter(m => m.type === 'error' || m.type === 'pageerror' || m.type === 'navigation-error');
    const warnings = msgs.filter(m => m.type === 'warning');
    totalErrors += errors.length;
    totalWarnings += warnings.length;
    if (errors.length > 0 || warnings.length > 0) {
      console.log(`\n${path}:`);
      errors.forEach(e => console.log(`  [${e.type.toUpperCase()}] ${e.text}`));
      warnings.forEach(w => console.log(`  [WARNING] ${w.text}`));
    }
  }
  console.log(`\nTotal: ${totalErrors} errors, ${totalWarnings} warnings across ${PAGES.length} pages`);

  await browser.close();
}

main().catch((e) => {
  console.error('Script failed:', e.message);
  process.exit(1);
});
