const fs = require('fs');

let html = fs.readFileSync('franchise.html', 'utf8');

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
      font-family: "Michroma", 'Inter', sans-serif;
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

if (!html.includes('.aurora-headline-wrapper')) {
  html = html.replace('</style>', auroraCSS + '\n  </style>');
}

const oldLabel = '<h2 class="op-h2 op-display" style="margin-bottom: 24px; font-size: 20px; font-family: \\\'Inter\\\', sans-serif; text-transform: uppercase; letter-spacing: 0.1em; color: var(--outpost-dust);">THE INVESTMENT PLAYBOOK</h2>';
const newLabel = `    <div class="aurora-headline-wrapper">
      <div class="aurora aurora-headline">RED FLAG OUTPOST</div>
      <div class="aurora-rule"></div>
    </div>`;

html = html.replace(oldLabel, newLabel);
fs.writeFileSync('franchise.html', html);
