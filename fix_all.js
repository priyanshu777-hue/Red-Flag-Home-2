const fs = require('fs');

function fixHTML(filename) {
    if (!fs.existsSync(filename)) return;
    let html = fs.readFileSync(filename, 'utf8');

    // 1. Right Rail Labels - remove min-height that causes text overflow, add clear border gap
    html = html.replace('.rail-btn {\n        min-height: 2.5rem !important;', '.rail-btn {\n        min-height: max-content !important;\n        border-top: 1px solid rgba(255,255,255,0.4) !important;');
    
    // 2. Hero subtitle truncated
    html = html.replace(/white-space: nowrap;\s*overflow: hidden;\s*text-overflow: ellipsis;/g, '');

    // 3. "Book Direct & Save" font size on mobile
    const bookTitleFix = `
      #book-container .display.text-trim {
        font-size: clamp(2rem, 8vw, 3rem) !important;
      }
    `;
    if (!html.includes('#book-container .display.text-trim')) {
        html = html.replace('/* Right Rail Shrink & Move */', bookTitleFix + '\n      /* Right Rail Shrink & Move */');
    }

    // 4. Broken image in Handpicked Homes panel
    // We will just remove the image tag completely for that panel if it's broken, or for all panels on mobile
    // Actually the user said "Remove the broken image reference and reduce the panel's height so there is no empty space"
    // So let's change b4-panel height and remove the image.
    html = html.replace('<div class="b4-panel-img-wrap"><img src="https://cdn.jsdelivr.net/gh/priyanshu777-hue/Red-Flag-Home-@main/handpicked.jpeg" class="b4-panel-img" alt="Handpicked Homes"  /></div>', '');
    
    // Reduce height of b4-panel on mobile:
    html = html.replace('.b4-panel {\n        height: auto !important;', '.b4-panel {\n        height: auto !important;\n        padding: 2rem 1.5rem !important;');

    // 5. Polaroid images too large
    // In Explore section (journal)
    const journalImgFix = `
      .journal-img-wrap {
        aspect-ratio: 16/9 !important;
      }
    `;
    if (!html.includes('.journal-img-wrap {\\n        aspect-ratio: 16/9 !important;')) {
        html = html.replace('/* Right Rail Shrink & Move */', journalImgFix + '\n      /* Right Rail Shrink & Move */');
    }

    // 6. franchise.html headings and maths table
    const franchiseFix = `
      .prog-section {
        padding-left: 1.5rem !important;
        padding-right: 1.5rem !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }
      .prog-display {
        font-size: clamp(1.5rem, 8vw, 6rem) !important;
        word-break: break-word !important;
      }
      .vs-table-wrapper {
        width: 100% !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch;
      }
    `;
    if (!html.includes('.prog-section {\\n        padding-left: 1.5rem !important;')) {
        html = html.replace('/* Right Rail Shrink & Move */', franchiseFix + '\n      /* Right Rail Shrink & Move */');
    }

    fs.writeFileSync(filename, html);
}

fixHTML('index.html');
fixHTML('franchise.html');

console.log('Fixed requested issues.');
