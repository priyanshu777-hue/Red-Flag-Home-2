const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace("wrapper.style.display = 'inline-flex';", "wrapper.style.display = 'inline-block'; wrapper.style.whiteSpace = 'nowrap';");

fs.writeFileSync('index.html', html);
console.log('Fixed wrapper display');
