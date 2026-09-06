const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

const regexes = [
  /<!-- SECTION — THE PITCH IN ONE LINE -->\s*<section class="/,
  /<!-- SECTION — THE EXECUTION MAP -->\s*<section class="/,
  /<!-- SECTION — SETUP FLEX -->\s*<section class="/,
  /<!-- SECTION — THE MATH -->\s*<section class="/,
  /<!-- SECTION — WHY NOT A TRADITIONAL BNB -->\s*<section class="/,
  /<!-- FINAL CTA -->\s*<section class="/
];

let replacedCount = 0;
regexes.forEach((regex, i) => {
  html = html.replace(regex, match => {
    replacedCount++;
    return match + 'meteor-target ';
  });
});

fs.writeFileSync('franchise.html', html);
console.log('Replaced count:', replacedCount);
