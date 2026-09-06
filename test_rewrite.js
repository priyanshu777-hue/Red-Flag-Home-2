const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

// Find the start of the sections
const startIdx = html.indexOf('<!-- STAT BAR -->');
const endIdx = html.indexOf('<!-- END CTA -->');

console.log("Start:", startIdx, "End:", endIdx);
