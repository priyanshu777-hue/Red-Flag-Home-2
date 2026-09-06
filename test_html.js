const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const tags = ['div', 'section', 'article', 'script', 'style'];
for (const tag of tags) {
    const open = (html.match(new RegExp(`<${tag}[>\\s]`, 'g')) || []).length;
    const close = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (open !== close) {
        console.log(`Mismatch for ${tag}: open=${open}, close=${close}`);
    }
}
