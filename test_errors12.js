const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) });
    page.on('pageerror', error => errors.push(error.message));
    
    await page.goto('http://localhost:3000');
    await new Promise(r => setTimeout(r, 1500));
    console.log("INDEX ERRORS:", errors);
    
    // Test scrolling
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight * 0.8);
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    const isModalOpen = await page.evaluate(() => {
      const modal = document.querySelector('.nl-modal');
      return modal && modal.classList.contains('is-open');
    });
    console.log("Modal opened on scroll:", isModalOpen);
    
    // Check rotator
    const rotatedText = await page.evaluate(() => {
      const wrapper = document.querySelector('.rotating-text-wrapper');
      return wrapper ? wrapper.innerText : null;
    });
    console.log("Rotated text inner:", rotatedText);
    
    await new Promise(r => setTimeout(r, 3000));
    const rotatedText2 = await page.evaluate(() => {
      const wrapper = document.querySelector('.rotating-text-wrapper');
      return wrapper ? wrapper.innerText : null;
    });
    console.log("Rotated text after 3s:", rotatedText2);

    await browser.close();
})();
