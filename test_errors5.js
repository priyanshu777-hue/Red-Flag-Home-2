const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:3000');
    await new Promise(r => setTimeout(r, 1000));
    const type = await page.evaluate(() => {
        return Object.getOwnPropertyDescriptor(window, 'articles') ? 'window.articles descriptor exists' : 'no descriptor';
    });
    console.log(type);
    
    const html = await page.content();
    console.log('Script block exists?', html.includes('const articles = ['));
    await browser.close();
})();
