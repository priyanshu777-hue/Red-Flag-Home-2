const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf-8');

html = html.replace(/<section class="op-hero-name-section">\s*<div class="op-hero-content" id="hero-content">/,
`    <section class="op-hero-name-section">
        <div class="op-hero-name" id="hero-name">
          <div class="op-hero-shockwave" id="hero-shockwave"></div>
          <div class="op-hero-line" id="hero-line"></div>
          <div class="op-hero-name-chars" id="hero-chars"></div>
        </div>
    </section>

    <div class="op-content-col">
      <section class="op-hero">
        <div class="op-hero-content" id="hero-content">`
);

fs.writeFileSync('franchise.html', html);
