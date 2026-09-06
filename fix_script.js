const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The injected block starts with `const articles = [`
// and ends right before `</script>\n  <link rel="preconnect"`
const startStr = 'const articles = [';
const endStr = '});\n</script>\n  <link';

const startIdx = html.indexOf(startStr);
const endIdx = html.indexOf('</script>\n  <link');

if (startIdx !== -1 && endIdx !== -1) {
    const jsToMove = html.substring(startIdx, endIdx);
    
    // Remove it from importmap
    html = html.substring(0, startIdx) + html.substring(endIdx);
    
    // Inject right before </body>
    html = html.replace('</body>', '<script>\n' + jsToMove + '\n</script>\n</body>');
    
    fs.writeFileSync('index.html', html);
    console.log('Fixed script injection.');
} else {
    console.log('Could not find script block.');
}
