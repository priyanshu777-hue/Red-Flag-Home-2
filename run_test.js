const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  console.log('Testing franchise.html...');
  await page.goto('http://localhost:3000/franchise.html', {waitUntil: 'domcontentloaded', timeout: 60000});
  await new Promise(r => setTimeout(r, 1000));

  console.log('Testing index.html...');
  await page.goto('http://localhost:3000/index.html', {waitUntil: 'domcontentloaded', timeout: 60000});
  await new Promise(r => setTimeout(r, 1000));

  await browser.close();
  process.exit(0);
})();
