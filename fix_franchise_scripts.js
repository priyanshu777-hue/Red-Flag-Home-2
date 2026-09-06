const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

// I need to strip from `const heroLine = document.getElementById('hero-line');`
// all the way down to the end of `const runHeroSequence = () => { ... };`
// and also remove `const heroCharsContainer` ...

const startStr = "const heroLine = document.getElementById('hero-line');";
const endStr = "  <script>\n(function() {"; // or something close to it, wait where is this code?

// Let's use regex or just substring
