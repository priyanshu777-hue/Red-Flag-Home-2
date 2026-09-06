const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

// 1. Remove background, margins, border-radius from .op-section, make it full-bleed
html = html.replace(/\.op-section \{[^}]*\}/, 
  `.op-section {
      width: 100%;
      background: rgba(10, 12, 18, 0.94);
      padding: 120px 4vw;
      margin: 0;
      border-radius: 0;
      box-sizing: border-box;
      opacity: 0;
      transition: opacity 0.4s ease-out;
      will-change: transform, opacity;
    }`);

// Also fix mobile padding for .op-section
html = html.replace(/\.op-section \{ padding: 32px 24px; border-radius: 12px; \}/, 
  `.op-section { padding: 80px 24px; border-radius: 0; margin: 0; width: 100%; }`);

// Make op-content-col 100% wide with 0 padding so op-section touches edges
html = html.replace(/\.op-content-col \{[^}]*\}/, 
  `.op-content-col {
      width: 100%;
      max-width: 100%;
      padding: 0;
    }`);
html = html.replace(/\.op-layout \{[\s\S]*?flex-direction: column;\s*\}/, 
  `.op-layout {
      position: relative;
      z-index: 10;
      width: 100%;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
    }`);

// 2. Remove the empty apply block
html = html.replace(/<!-- END CTA -->[\s\S]*?<section class="op-section op-end" style="display: flex; justify-content: center; padding: 40px 0;">[\s\S]*?<a href="#apply" class="op-btn">Apply for Allocation<\/a>[\s\S]*?<\/section>/, '<!-- END CTA -->');

// 3. Typography cleanup
// Add CSS block before </style> to override typography globally
const typoCSS = `
    /* GLOBAL TYPOGRAPHY ENFORCEMENT */
    h1, h2, h3, h4, h5, h6, .op-h1, .op-h2, .op-h3, .s1-h1, .s2-h2, .s3-h2, .op-stat-val {
      font-family: 'Instrument Serif', serif !important;
      font-weight: 400 !important;
      color: rgba(255, 255, 255, 0.95) !important;
    }
    body, p, li, td, th, span, div, a, input, select, button, label, .op-body, .op-small, .s1-eye, .s2-eye, .s3-eye, .op-btn, .op-input, .op-select, .op-label, .op-ticker-item {
      font-family: 'Inter', sans-serif;
    }
    
    /* Body & Secondary Text */
    .op-body, p, li, th, td, .op-input, .op-select, .op-phase-desc, .op-phase-bullets {
      font-size: 17px !important;
      line-height: 1.6 !important;
      color: rgba(255, 255, 255, 0.72) !important;
    }
    
    /* Hero Headings */
    .s1-h1, .s2-h2, .s3-h2 {
      font-size: 56px !important;
      line-height: 1.1 !important;
      text-transform: none !important;
    }
    
    /* Section Headings */
    .op-h2 {
      font-size: 40px !important;
      line-height: 1.2 !important;
      text-transform: none !important;
    }
    
    /* Sub-headings */
    .op-h3 {
      font-size: 24px !important;
      line-height: 1.3 !important;
      text-transform: none !important;
    }
    
    /* Small Labels */
    .op-small, .s1-eye, .s2-eye, .s3-eye, .op-label, .op-phase-num, label {
      font-size: 13px !important;
      letter-spacing: 0.12em !important;
      text-transform: uppercase !important;
      color: rgba(255, 255, 255, 0.72) !important;
    }

    /* Form Cleanup */
    #apply-form {
      max-width: 560px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }
    .op-field {
      margin-bottom: 0 !important;
    }
    .op-input, .op-select {
      height: 44px !important;
      border: none !important;
      border-bottom: 1px solid rgba(255,255,255,0.25) !important;
      background: transparent !important;
      border-radius: 0 !important;
      padding: 0 8px !important;
      transition: border-color 0.2s, background 0.2s;
    }
    .op-input:focus, .op-select:focus {
      outline: none !important;
      border-bottom: 1px solid #fff !important;
    }
    
    #apply-form button[type="submit"] {
      height: 48px;
      background: #fff;
      color: #000;
      border: none;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 8px !important;
      width: auto;
      align-self: flex-start;
      padding: 0 32px;
      font-size: 14px;
    }
    #apply-form button[type="submit"]:hover {
      background: rgba(255,255,255,0.8);
    }
`;

html = html.replace('</style>', typoCSS + '\n  </style>');

// Fix footer inline styles for Inner Circle so it picks up .op-h3 and .op-small
html = html.replace(/<h3 class="op-h3"[^>]*>The Inner Circle<\/h3>/, '<h3 class="op-h3" style="margin-bottom: 8px;">The Inner Circle</h3>');

// Give footer padding so it doesn't touch the edge of the screen now that op-content-col has no padding
html = html.replace(/<footer style="([^"]*)">/, '<footer style="$1 padding-left: 4vw; padding-right: 4vw; padding-bottom: 120px; box-sizing: border-box;">');


fs.writeFileSync('franchise.html', html);
console.log('Applied fixes');
