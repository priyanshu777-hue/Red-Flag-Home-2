const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

const oldEndSection = `<section class="op-section op-end">
        <h1 class="op-h1">Be part of the revolution.</h1>
        <p class="op-body">Founding Partner allocation is limited.</p>
        <a href="#apply" class="op-btn">Apply for Allocation</a>
      
      </section>`;

const newEndSection = `<section class="op-section op-end" style="display: flex; justify-content: center; padding: 40px 0;">
        <a href="#apply" class="op-btn">Apply for Allocation</a>
      </section>`;

if (html.includes('<h1 class="op-h1">Be part of the revolution.</h1>')) {
  // We'll replace it using regex just in case spacing is off
  html = html.replace(/<section class="op-section op-end">[\s\S]*?<a href="#apply" class="op-btn">Apply for Allocation<\/a>[\s\S]*?<\/section>/, newEndSection);
  fs.writeFileSync('franchise.html', html);
  console.log('Fixed footer end section.');
} else {
  console.log('Footer end section not found.');
}
