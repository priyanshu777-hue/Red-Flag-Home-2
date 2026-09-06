const fs = require('fs');

let html = fs.readFileSync('franchise.html', 'utf-8');

// We need to move op-hero out of op-content-col?
// Actually, wait, it says "The only centred element on the page is the programme name in the hero."
// Let's just make the .op-hero-name break out of the 62% constraint by giving it a fixed width of 100vw,
// or we can structure the layout differently.

// Let's replace the .op-layout and .op-content-col structure.
html = html.replace(/<div class="op-layout">\s*<div class="op-content-col op-parallax-fg">/, 
`
  <div class="op-layout op-parallax-fg">
    <!-- HERO Name is full width -->
    <section class="op-hero-name-section">
        <div class="op-hero-name" id="hero-name">
          <div class="op-hero-shockwave" id="hero-shockwave"></div>
          <div class="op-hero-line" id="hero-line"></div>
          <div class="op-hero-name-chars" id="hero-chars"></div>
        </div>
    </section>

    <div class="op-content-col">
`);

// Add closing div for op-content-col at the end.
html = html.replace(/<\/section>\s*<\/div>\s*<\/div>/,
`
      </section>
    </div> <!-- op-content-col -->
  </div> <!-- op-layout -->
`);

// Change CSS layout:
html = html.replace(/\.op-layout \{([\s\S]*?)\}/,
`.op-layout {
      position: relative;
      z-index: 10;
      width: 100%;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
    }`);

html = html.replace(/\.op-content-col \{([\s\S]*?)\}/,
`.op-content-col {
      width: 62%;
      max-width: 1400px;
      padding: 0 4vw 120px 4vw;
    }`);

html = html.replace(/\.op-hero \{([\s\S]*?)\}/,
`.op-hero-name-section {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 0; left: 0;
      pointer-events: none;
    }
    .op-hero {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      opacity: 1; 
      margin-top: 0;
      pointer-events: auto;
    }`);

html = html.replace(/<div class="op-hero-name" id="hero-name">[\s\S]*?<\/div>\s*<div class="op-hero-content" id="hero-content">/,
`
        <div class="op-hero-content" id="hero-content">`);

fs.writeFileSync('franchise.html', html);
