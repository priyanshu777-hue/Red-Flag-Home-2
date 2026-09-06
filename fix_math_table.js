const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

if (!html.includes('<div class="vs-table-wrapper"><table class="math-table"')) {
    html = html.replace('<table class="math-table">', '<div class="vs-table-wrapper"><table class="math-table">');
    // Replace the *first* </table> after math-table.
    let tableStart = html.indexOf('<div class="vs-table-wrapper"><table class="math-table">');
    let tableEnd = html.indexOf('</table>', tableStart);
    html = html.substring(0, tableEnd) + '</table></div>' + html.substring(tableEnd + 8);
}
fs.writeFileSync('franchise.html', html);
