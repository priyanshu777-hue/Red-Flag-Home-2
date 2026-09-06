const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    await page.goto('http://localhost:3000');
    await new Promise(r => setTimeout(r, 1000));
    const type = await page.evaluate(() => {
        try { 
            return { 
                toString: Object.prototype.toString.call(articles),
                length: articles.length,
                firstEl: articles[0] ? articles[0].outerHTML : null
            }; 
        } catch(e) { return e.message; }
    });
    console.log(type);
    await browser.close();
})();
