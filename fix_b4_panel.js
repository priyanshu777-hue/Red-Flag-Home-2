const fs = require('fs');

function fixHTML(filename) {
    if (!fs.existsSync(filename)) return;
    let html = fs.readFileSync(filename, 'utf8');

    const panelFix = `
      #b4-panels, .b4-panel {
        height: auto !important;
        min-height: auto !important;
      }
      .b4-panel {
        padding: 4rem 1.5rem !important;
      }
      .b4-panel-content {
        position: relative !important;
        inset: auto !important;
        height: auto !important;
        opacity: 1 !important;
        transform: none !important;
      }
    `;

    if (!html.includes('.b4-panel-content {\\n        position: relative !important;')) {
        html = html.replace('/* Right Rail Shrink & Move */', panelFix + '\n      /* Right Rail Shrink & Move */');
    }

    // Also double check table wrapper in franchise.html
    html = html.replace('<table class="vs-table"', '<div class="vs-table-wrapper"><table class="vs-table"');
    html = html.replace('</table>', '</table></div>');
    
    fs.writeFileSync(filename, html);
}

fixHTML('index.html');
fixHTML('franchise.html');

console.log('Fixed b4-panel and table.');
