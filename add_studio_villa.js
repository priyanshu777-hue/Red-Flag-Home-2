const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf-8');

html = html.replace(
  /<h1 class="op-h1">No property\? No problem\.<\/h1>/,
  `
          <div style="font-family: 'Inter', sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--outpost-dust); margin-bottom: 32px; display: flex; gap: 16px;">
            <span>/ Studio</span>
            <span>/ Villa</span>
            <span>/ Estate</span>
          </div>
          <h1 class="op-h1">No property? No problem.</h1>
  `
);

fs.writeFileSync('franchise.html', html);
