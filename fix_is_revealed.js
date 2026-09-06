const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

html = html.replace('.op-section.is-revealed {', '.op-section.is-revealed, .stagger-child.is-revealed {');

fs.writeFileSync('franchise.html', html);
console.log('Fixed is-revealed CSS');
