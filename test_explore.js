const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:3000');
    await new Promise(r => setTimeout(r, 1000));
    const count = await page.evaluate(() => {
        return document.querySelectorAll('.ac-card').length;
    });
    console.log("CARDS COUNT:", count);
    await browser.close();
})();
