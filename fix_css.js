const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

// 1. Remove background: var(--outpost-void) from op-layout
html = html.replace(/<div class="op-layout op-parallax-fg" style="background: var\(--outpost-void\); position: relative; z-index: 10;">/, 
  '<div class="op-layout op-parallax-fg" style="background: transparent; position: relative; z-index: 10;">');

// 2. Change #scene-outer background
html = html.replace(/#scene-outer \{\s*position: relative;\s*height: 500vh;\s*width: 100%;\s*background: #000;\s*\}/, 
  `#scene-outer {
      position: relative;
      height: 500vh;
      width: 100%;
      background: transparent;
    }`);

// 3. Add background to op-section
html = html.replace(/\.op-section \{/, 
  `.op-section {
      background: rgba(10, 12, 18, 0.94);
      padding: 48px 32px;
      border-radius: 16px;`);

// 4. Mobile static poster CSS
html = html.replace(/<\/style>/, 
  `
    #global-bg-video {
      position: fixed; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1;
    }
    #global-bg-poster {
      position: fixed; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1;
      background: url('https://images.unsplash.com/photo-1542224566-6e85f2e6772f?q=80&w=1920') center/cover no-repeat;
      display: none;
    }
    @media (max-width: 767px) {
      #global-bg-video { display: none !important; }
      #global-bg-poster { display: block !important; }
      .op-section { padding: 32px 24px; border-radius: 12px; }
    }
  </style>`);

fs.writeFileSync('franchise.html', html);
console.log('Fixed CSS.');
