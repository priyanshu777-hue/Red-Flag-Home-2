const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

html = html.replace('.op-section.is-revealed, .stagger-child.is-revealed {', '.op-section.is-revealed, .stagger-child.is-revealed {');
html = html.replace('opacity: 1;', 'opacity: 1 !important;');
html = html.replace('transform: translateY(0);', 'transform: translateY(0) !important;');

fs.writeFileSync('franchise.html', html);
console.log('Fixed is-revealed CSS important');
