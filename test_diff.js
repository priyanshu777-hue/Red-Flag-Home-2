const fs = require('fs');
const f2 = fs.readFileSync('franchise2.html', 'utf8');
const f = fs.readFileSync('franchise.html', 'utf8');
console.log('f2 length:', f2.length);
console.log('f length:', f.length);
