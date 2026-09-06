const fs = require('fs');

function fixHTML(filename) {
    if (!fs.existsSync(filename)) return;
    let html = fs.readFileSync(filename, 'utf8');

    html = html.replace(/border-top: 1px solid rgba\(255,255,255,0.4\) !important;[\s\S]*?border-top: 1px solid rgba\(255,255,255,0.2\) !important;/g, 'border-top: 1px solid rgba(255,255,255,0.4) !important;');
    
    // Also, if writing-mode is vertical-rl, then border-top is physically the right side in some browsers. 
    // It's safer to just set physical margins or borders. Let's add margin-bottom to separate them.
    html = html.replace('min-height: max-content !important;', 'min-height: max-content !important;\n        margin-bottom: 2px !important;');
    fs.writeFileSync(filename, html);
}

fixHTML('index.html');
fixHTML('franchise.html');

console.log('Fixed rail btn CSS.');
