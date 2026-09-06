const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

html = html.replace('.math-table-wrap {\n      overflow-x: auto;', '.math-table-wrap {\n      overflow-x: auto;\n      -webkit-overflow-scrolling: touch;');

fs.writeFileSync('franchise.html', html);
