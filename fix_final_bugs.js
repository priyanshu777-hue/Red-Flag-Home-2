const fs = require('fs');

function fixHTML(filename) {
    if (!fs.existsSync(filename)) return;
    let html = fs.readFileSync(filename, 'utf8');

    // 1. Fix missing Hero by removing it from the auto height override
    html = html.replace('#block3, #block4, #hero, #book, #franchise, #journal, .journal-container {', '#block3, #block4, #book, #franchise, #journal, .journal-container {');

    // 2. Fix the Right Rail buttons (ensure they have borders/spacing)
    // We already added some padding and height, let's also ensure border and flex styling on mobile
    const railBtnFix = `
      .rail-btn {
        min-height: 2.5rem !important;
        padding: 0.75rem 0 !important;
        font-size: 0.55rem !important;
        border-top: 1px solid rgba(255,255,255,0.2) !important;
      }
      #right-rail {
        display: flex !important;
        flex-direction: column !important;
      }
    `;
    html = html.replace('.rail-btn {\n        min-height: 2.5rem !important;\n        padding: 0.75rem 0 !important;\n        font-size: 0.55rem !important;\n      }', railBtnFix);

    // 3. Hide Wordmark on mobile to prevent overlapping logo
    const wordmarkFix = `
      #wordmark-top {
        display: none !important;
      }
    `;
    if (!html.includes('#wordmark-top { display: none !important; }')) {
        html = html.replace('/* Right Rail Shrink & Move */', wordmarkFix + '\n      /* Right Rail Shrink & Move */');
    }

    // 4. Reduce Footer Bento Video Opacity and darken
    // Changing .ft-asset > video opacity from 0.55 to 0.3
    html = html.replace('opacity: 0.55;', 'opacity: 0.3;');
    
    // Also set a dark background on ft-card--union to ensure the overlay reads as dark
    html = html.replace('background-image: var(--grad);', 'background-color: #000;\n  background-image: var(--grad);');

    fs.writeFileSync(filename, html);
}

fixHTML('index.html');
fixHTML('franchise.html');

console.log('Final bugs fixed.');
