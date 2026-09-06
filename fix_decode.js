const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

const target = `        function pushNext() {
           if (i >= samples.length) return;
           if (decoder.decodeQueueSize > LEAD) {`;
           
const replacement = `        function pushNext() {
           if (i >= samples.length) return;
           if (decoder.state === 'closed') return;
           if (decoder.decodeQueueSize > LEAD) {`;

if (html.includes(target)) {
    html = html.replace(target, replacement);
    fs.writeFileSync('franchise.html', html);
    console.log('Fixed decode state check.');
} else {
    console.log('Target not found for decode state check.');
}
