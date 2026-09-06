const fs = require('fs');

let html = fs.readFileSync('franchise.html', 'utf8');

// The exact HTML comments preceding the target sections:
const targets = [
  '<!-- SECTION — THE PITCH IN ONE LINE -->\n  <section class="prog-section">',
  '<!-- SECTION — THE EXECUTION MAP -->\n  <section class="prog-section">',
  '<!-- SECTION — SETUP FLEX -->\n  <section class="prog-section">',
  '<!-- SECTION — THE MATH -->\n  <section class="prog-section">',
  '<!-- SECTION — WHY NOT A TRADITIONAL BNB -->\n  <section class="prog-section">',
  '<!-- FINAL CTA -->\n  <section class="cta-section">'
];

targets.forEach(target => {
  const replacement = target.replace('class="', 'class="meteor-target ');
  html = html.replace(target, replacement);
});

// If the comment has different whitespace, let's use regex.
