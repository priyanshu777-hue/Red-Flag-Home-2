const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(msg.text()));
  
  await page.goto('data:text/html,' + encodeURIComponent(`
    <script src="https://cdn.jsdelivr.net/npm/mp4box@0.5.2/dist/mp4box.all.min.js"></script>
    <script>
      window.onload = () => {
        console.log('MP4Box:', !!window.MP4Box);
        console.log('DataStream:', !!window.DataStream);
        if (window.MP4Box) {
          console.log('MP4Box.DataStream:', !!window.MP4Box.DataStream);
        }
        if (window.DataStream) {
          console.log('DataStream.BIG_ENDIAN:', window.DataStream.BIG_ENDIAN !== undefined);
        }
      };
    </script>
  `), { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
