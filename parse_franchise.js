const fs = require('fs');
const html = fs.readFileSync('franchise.html', 'utf8');
const lines = html.split('\n');
console.log("Lines 590-640:");
console.log(lines.slice(590, 640).join('\n'));
