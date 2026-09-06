const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Restore the image with a reliable unsplash image
const missingImgHTML = `      <div class="b4-panel-img-wrap"><img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80" class="b4-panel-img" alt="Handpicked Homes" /></div>
      <div class="b4-panel-scrim"></div>`;

html = html.replace('<div class="b4-panel active">\n      \n      <div class="b4-panel-scrim"></div>', '<div class="b4-panel active">\n' + missingImgHTML);
html = html.replace('<div class="b4-panel active">\n            <div class="b4-panel-scrim"></div>', '<div class="b4-panel active">\n' + missingImgHTML);

fs.writeFileSync('index.html', html);
console.log('Fixed panel image');
