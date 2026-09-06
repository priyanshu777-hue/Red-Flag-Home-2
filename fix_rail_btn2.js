const fs = require('fs');

function fixHTML(filename) {
    if (!fs.existsSync(filename)) return;
    let html = fs.readFileSync(filename, 'utf8');

    html = html.replace('border-top: 1px solid rgba(255,255,255,0.4) !important;', 'border-bottom: 1px solid rgba(255,255,255,0.4) !important;\n        padding: 0.75rem 0 !important;\n        font-size: 0.55rem !important;');

    fs.writeFileSync(filename, html);
}

fixHTML('index.html');
fixHTML('franchise.html');
