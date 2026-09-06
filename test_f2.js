const fs = require('fs');
let html = fs.readFileSync('franchise2.html', 'utf8');
if (html.includes('VIDEO SCRUB')) {
  console.log('franchise2.html has the VIDEO SCRUB block.');
} else {
  console.log('NO VIDEO SCRUB in franchise2.html');
}
