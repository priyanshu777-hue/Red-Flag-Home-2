const fs = require('fs');

let html = fs.readFileSync('franchise.html', 'utf8');

const targetStr = '<h2 class="op-h2 op-display" style="margin-bottom: 24px; font-size: 20px; font-family: \'Inter\', sans-serif; text-transform: uppercase; letter-spacing: 0.1em; color: var(--outpost-dust);">THE INVESTMENT PLAYBOOK</h2>';

const newLabel = `    <div class="aurora-headline-wrapper">
      <div class="aurora aurora-headline">RED FLAG OUTPOST</div>
      <div class="aurora-rule"></div>
    </div>`;

if (html.includes(targetStr)) {
  html = html.replace(targetStr, newLabel);
  fs.writeFileSync('franchise.html', html);
  console.log('Replaced successfully');
} else {
  console.log('Target string not found in franchise.html. Looking for parts of it...');
  if (html.includes('THE INVESTMENT PLAYBOOK')) {
    console.log('Found THE INVESTMENT PLAYBOOK');
  }
}
