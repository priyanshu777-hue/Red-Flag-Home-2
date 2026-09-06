const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
  /opacity: 0; pointer-events: none; transition: opacity 0\.3s ease;\s*\}\s*#mobile-menu\.active \{ opacity: 1; pointer-events: auto; \}/,
  `opacity: 0; pointer-events: none; transform: translateX(100%); transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);\n    }\n    #mobile-menu.active { opacity: 1; pointer-events: auto; transform: translateX(0); }`
);

fs.writeFileSync('index.html', html);
console.log('Replaced');
