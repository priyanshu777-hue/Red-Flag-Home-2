const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/franchise.html', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));
    
    const info = await page.evaluate(() => {
        const mathH2 = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('THE MATH'));
        const bnbH2 = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('WHY NOT'));
        const mathRect = mathH2 ? mathH2.getBoundingClientRect() : null;
        const bnbRect = bnbH2 ? bnbH2.getBoundingClientRect() : null;
        const mathSec = mathH2 ? mathH2.closest('section') : null;
        const mathSecRect = mathSec ? mathSec.getBoundingClientRect() : null;
        const bodyScrollWidth = document.body.scrollWidth;
        const windowInnerWidth = window.innerWidth;
        
        // Find elements with scrollWidth > clientWidth or left < 0
        const overflowing = [];
        document.querySelectorAll('*').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.left < 0 || r.right > window.innerWidth + 5) {
                overflowing.push({ tag: el.tagName, class: el.className, left: r.left, right: r.right, width: r.width });
            }
        });

        return {
            mathRect,
            bnbRect,
            mathSecRect,
            bodyScrollWidth,
            windowInnerWidth,
            overflowing: overflowing.slice(0, 15)
        };
    });
    
    console.log(JSON.stringify(info, null, 2));
    await browser.close();
})();
