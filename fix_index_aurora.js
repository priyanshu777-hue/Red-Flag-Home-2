const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
const search = '    <div class="aurora-headline-wrapper">\n      <div class="aurora aurora-headline">RED FLAG HOMES</div>\n      <div class="aurora-rule"></div>\n    </div>';

if (html.includes(search)) {
  console.log('RED FLAG HOMES updated correctly');
} else {
  console.log('RED FLAG HOMES missing in index.html');
}
