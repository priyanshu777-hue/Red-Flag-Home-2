const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/franchise.html', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 500));
    
    const res = await page.evaluate(() => {
        const mathH2 = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('THE MATH'));
        const bnbH2 = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('WHY NOT'));
        const r1 = mathH2.getBoundingClientRect();
        const r2 = bnbH2.getBoundingClientRect();
        return {
            math: { left: r1.left, right: r1.right, width: r1.width, text: mathH2.textContent, fontSize: getComputedStyle(mathH2).fontSize },
            bnb: { left: r2.left, right: r2.right, width: r2.width, text: bnbH2.textContent, fontSize: getComputedStyle(bnbH2).fontSize }
        };
    });
    console.log(res);
    await browser.close();
})();
