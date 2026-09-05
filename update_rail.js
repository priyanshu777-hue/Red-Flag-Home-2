const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update #right-rail HTML
html = html.replace(/<div id="right-rail" class="chrome hero-group" data-group="nav">\s*<button class="rail-btn" id="mobile-menu-btn">Menu<\/button>\s*<a href="#book" class="rail-btn" style="border-top: 1px solid rgba\(0,0,0,0\.1\);">Book Now<\/a>\s*<a href="#franchise" class="rail-btn" style="border-top: 1px solid rgba\(0,0,0,0\.1\);">Partner With Us<\/a>\s*<a href="#journal" class="rail-btn" style="border-top: 1px solid rgba\(0,0,0,0\.1\);">Journal<\/a>\s*<a href="#contact" class="rail-btn secondary" style="border-top: 1px solid rgba\(0,0,0,0\.1\);">Contact<\/a>\s*<\/div>/, `<div id="right-rail" class="chrome hero-group" data-group="nav">
      <button class="rail-btn" id="mobile-menu-btn">Menu</button>
      <a href="#book" class="rail-btn" style="border-top: 1px solid rgba(0,0,0,0.1);">Book Now</a>
      <a href="#franchise" class="rail-btn secondary" style="border-top: 1px solid rgba(0,0,0,0.1);">Partner With Us</a>
    </div>`);

// 2. Update .rail-btn CSS
html = html.replace(/\.rail-btn \{\s*background: var\(--raw-color-velvet-700\); color: var\(--foreground\);\s*writing-mode: vertical-rl; text-orientation: mixed; border: none; cursor: pointer;\s*padding: 2rem 1\.25rem; text-transform: uppercase; letter-spacing: 0\.1em;\s*font-size: 0\.8rem; font-weight: 500; text-decoration: none; display: flex; align-items: center; justify-content: center;\s*transition: background 0\.2s ease, color 0\.2s ease; pointer-events: auto; font-family: inherit;\s*min-width: 3\.5rem; min-height: 6rem; box-sizing: border-box;\s*\}/, `.rail-btn {
      background: var(--raw-color-velvet-700); color: var(--foreground);
      writing-mode: vertical-rl; text-orientation: mixed; border: none; cursor: pointer;
      padding: 1.5rem 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;
      font-size: 0.7rem; font-weight: 500; text-decoration: none; display: flex; align-items: center; justify-content: center;
      transition: background 0.2s ease, color 0.2s ease; pointer-events: auto; font-family: inherit;
      min-width: 2.5rem; min-height: 4rem; box-sizing: border-box; flex: 1;
    }`);

// Update #right-rail CSS to limit max height
html = html.replace(/#right-rail \{\s*position: fixed; right: 0; top: 0; z-index: 300; display: flex; flex-direction: column;\s*\}/, `#right-rail {
      position: fixed; right: 0; top: 0; z-index: 300; display: flex; flex-direction: column;
      max-height: 40vh; width: 2.5rem;
    }`);

// Fix @media rail-btn mobile sizing if exists
html = html.replace(/\.rail-btn \{ padding: 1\.5rem 1rem; font-size: 0\.75rem; min-width: 3rem; \}/, `.rail-btn { padding: 1rem 0.5rem; font-size: 0.65rem; min-width: 2rem; }`);

// 3. Update footer HTML (remove duplicate Red Flag Homes Network wordmark)
html = html.replace(/<div class="footer-col" style="grid-column: span 2;">\s*<div class="wordmark"><span class="italic">R<\/span>ed Flag Homes Network<\/div>\s*<\/div>/, '');

// Adjust footer grid CSS
html = html.replace(/\.footer-grid \{ display: grid; grid-template-columns: 1fr 1fr 1fr 2fr; gap: 2rem; max-width: 1440px; margin: 0 auto; \}/, `.footer-grid { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 2rem; max-width: 1440px; margin: 0 auto; }`);

// 4. Update the section right padding
html = html.replace(/@media \(max-width: 1024px\) \{\s*\/\* Fix mobile text overflow by adding right padding for the fixed rail \*\/\s*#titles, #block2, #b4-header, \.b4-panel-content, #b3-content, #book, #franchise, #journal, #contact, #footer \{\s*padding-right: 4\.5rem !important;\s*box-sizing: border-box !important;\s*\}\s*\}/, `@media (max-width: 1024px) {
      /* Fix mobile text overflow for the top-right fixed rail */
      #titles {
        padding-right: 2.5rem !important;
        box-sizing: border-box !important;
      }
    }`);

fs.writeFileSync('index.html', html);
console.log('rail updated');
