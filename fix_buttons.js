const fs = require('fs');

const css = `
  /* Interactive Buttons */
  .interactive-btn {
    position: relative !important;
    overflow: hidden !important;
    border: 1px solid var(--foreground-accent-muted, rgba(242, 228, 225, 0.4)) !important;
    border-radius: 9999px !important;
    background: transparent !important;
    padding: 0.75rem 2rem !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    text-decoration: none !important;
    cursor: pointer !important;
    box-sizing: border-box !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    color: inherit;
  }
  .interactive-btn .btn-dot {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #A31621;
    transform-origin: center;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 0;
  }
  .interactive-btn .btn-label-default,
  .interactive-btn .btn-label-hover {
    position: relative;
    z-index: 1;
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    margin-left: 12px;
    display: flex;
    align-items: center;
  }
  .interactive-btn .btn-label-default {
    opacity: 1;
    transform: translateX(0);
  }
  .interactive-btn .btn-label-hover {
    position: absolute;
    opacity: 0;
    transform: translateX(6px);
    color: #fff;
    white-space: nowrap;
  }
  @media (hover: hover) {
    .interactive-btn:hover .btn-dot {
      transform: translateY(-50%) scale(56);
    }
    .interactive-btn:hover .btn-label-default {
      opacity: 0;
      transform: translateX(24px);
    }
    .interactive-btn:hover .btn-label-hover {
      opacity: 1;
      transform: translateX(0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .interactive-btn .btn-dot,
    .interactive-btn .btn-label-default,
    .interactive-btn .btn-label-hover {
      transition: none !important;
    }
  }
`;

function injectCSS(html) {
  if (html.includes('/* Interactive Buttons */')) return html;
  return html.replace('</style>', css + '\n  </style>');
}

// 1. index.html
let indexHTML = fs.readFileSync('index.html', 'utf8');
indexHTML = injectCSS(indexHTML);

// Book a Stay
indexHTML = indexHTML.replace(
  '<a href="#book" class="btn-pill btn-fill">Book a Stay</a>',
  '<a href="#book" class="btn-pill btn-fill interactive-btn"><span class="btn-dot"></span><span class="btn-label-default">Book a Stay</span><span class="btn-label-hover">Book a Stay →</span></a>'
);

// View The Blueprint
indexHTML = indexHTML.replace(
  '<a href="franchise.html" class="btn-pill btn-fill">View The Blueprint</a>',
  '<a href="franchise.html" class="btn-pill btn-fill interactive-btn"><span class="btn-dot"></span><span class="btn-label-default">View The Blueprint</span><span class="btn-label-hover">View The Blueprint →</span></a>'
);

// Check Availability
const svgRegex = /<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="margin-right: 8px;">[\s\S]*?<\/svg>/;
const matchSvg = indexHTML.match(svgRegex);
if (matchSvg) {
  const svg = matchSvg[0];
  const oldBtn = `<button type="button" id="book-submit-btn" class="book-submit-btn whatsapp-btn">\n          ${svg}\n          Check Availability\n        </button>`;
  const newBtn = `<button type="button" id="book-submit-btn" class="book-submit-btn whatsapp-btn interactive-btn" style="width: 100%; height: 52px; border: none;">\n          <span class="btn-dot"></span><span class="btn-label-default">${svg} Check Availability</span><span class="btn-label-hover">${svg} Check Availability →</span>\n        </button>`;
  indexHTML = indexHTML.replace(oldBtn, newBtn);
  
  // Try fallback replacing if the spacing differs
  if (indexHTML.includes(oldBtn) === false) {
    // If not found, let's do a more generic replace
    const blockStart = indexHTML.indexOf('<button type="button" id="book-submit-btn" class="book-submit-btn whatsapp-btn">');
    const blockEnd = indexHTML.indexOf('</button>', blockStart) + 9;
    if (blockStart !== -1) {
      indexHTML = indexHTML.substring(0, blockStart) + newBtn + indexHTML.substring(blockEnd);
    }
  }
}
fs.writeFileSync('index.html', indexHTML);


// 2. franchise.html
let franHTML = fs.readFileSync('franchise.html', 'utf8');
franHTML = injectCSS(franHTML);

franHTML = franHTML.replace(
  '<a class="bx-book" href="#apply">Apply for Allocation</a>',
  '<a class="bx-book interactive-btn" href="#apply"><span class="btn-dot"></span><span class="btn-label-default">Apply for Allocation</span><span class="btn-label-hover">Apply for Allocation →</span></a>'
);

franHTML = franHTML.replace(
  '<button type="submit" class="prog-btn" style="width: 100%; border: none; margin-top: 20px;">Apply for Allocation</button>',
  '<button type="submit" class="prog-btn interactive-btn" style="width: 100%; margin-top: 20px;"><span class="btn-dot"></span><span class="btn-label-default">Apply for Allocation</span><span class="btn-label-hover">Apply for Allocation →</span></button>'
);

franHTML = franHTML.replace(
  '<a href="#apply" class="prog-btn">Apply for Allocation</a>',
  '<a href="#apply" class="prog-btn interactive-btn"><span class="btn-dot"></span><span class="btn-label-default">Apply for Allocation</span><span class="btn-label-hover">Apply for Allocation →</span></a>'
);

fs.writeFileSync('franchise.html', franHTML);
console.log('Buttons restyled!');
