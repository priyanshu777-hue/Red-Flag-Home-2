const fs = require('fs');
let code = fs.readFileSync('run_test.js', 'utf8');
// add waitUntil to goto
code = code.replace(/await page.goto\(([^)]+)\);/g, "await page.goto($1, {waitUntil: 'domcontentloaded', timeout: 60000});");
fs.writeFileSync('run_test.js', code);
