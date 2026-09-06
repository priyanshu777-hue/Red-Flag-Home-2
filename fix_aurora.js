const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const auroraCSS = `
    @keyframes aurora-cycle {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .aurora {
      background: linear-gradient(135deg, #A31621, #D93B4A, #E8E4DF, #5C1220, #A31621);
      background-size: 300% 300%;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: aurora-cycle 8s ease-in-out infinite;
      display: inline-block;
    }
    @media (prefers-reduced-motion: reduce) {
      .aurora {
        animation: none;
        background-position: 50% 50%;
      }
    }
    .aurora-headline {
      font-family: "Michroma", var(--typeface-ui), sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      font-size: 28px;
    }
    .aurora-headline-wrapper {
      display: inline-flex;
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 2rem;
    }
    .aurora-rule {
      width: 80px;
      height: 1px;
      background: rgba(163,22,33,0.35);
      margin-top: 32px;
    }
    @media (max-width: 768px) {
      .aurora-headline { font-size: 18px; }
    }
`;

// Insert CSS before </style>
if (!html.includes('.aurora-headline-wrapper')) {
  html = html.replace('</style>', auroraCSS + '\n  </style>');
}

// Remove old franchise-label styles
html = html.replace(/@keyframes sweep-gradient {[\s\S]*?}[\s\S]*?\.franchise-label::before,[\s\S]*?\.franchise-label::after {[\s\S]*?}[\s\S]*?\.franchise-label span {[\s\S]*?sweep-gradient[\s\S]*?}[\s\S]*?@media \(prefers-reduced-motion: reduce\) {[\s\S]*?\.franchise-label span {[\s\S]*?}[\s\S]*?}/, '/* removed sweep-gradient */');

// Remove old franchise-label styles in mobile media query
html = html.replace(/\.franchise-label span {[\s\S]*?}/, '');
html = html.replace(/\.franchise-label::before,[\s\S]*?\.franchise-label::after {[\s\S]*?}/, '');

const oldBookLabel = '<div class="book-label" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--raw-color-velvet-500); margin-bottom: 1rem; font-family: var(--typeface-ui); font-weight: 600;">RED FLAG HOMES</div>';
const newBookLabel = `    <div class="aurora-headline-wrapper">
      <div class="aurora aurora-headline">RED FLAG HOMES</div>
      <div class="aurora-rule"></div>
    </div>`;

html = html.replace(oldBookLabel, newBookLabel);

const oldFranchiseLabel = '<div class="franchise-label"><span>RED FLAG OUTPOST</span></div>';
const newFranchiseLabel = `    <div class="aurora-headline-wrapper">
      <div class="aurora aurora-headline">RED FLAG OUTPOST</div>
      <div class="aurora-rule"></div>
    </div>`;
    
html = html.replace(oldFranchiseLabel, newFranchiseLabel);

fs.writeFileSync('index.html', html);
console.log('index.html updated');
