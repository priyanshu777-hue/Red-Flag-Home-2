const fs = require('fs');

const css = `
  /* Meteor Effect */
  .meteor-shower {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
  }
  .meteor-target {
    position: relative;
  }
  .meteor-target > :not(.meteor-shower) {
    position: relative;
    z-index: 1;
  }
  .meteor {
    position: absolute;
    width: 1px;
    height: 2px;
    border-radius: 9999px;
    background: var(--foreground-accent-muted);
    box-shadow: 0 0 0 1px rgba(242,228,225,0.1);
    opacity: 0;
  }
  .meteor::before {
    content: "";
    position: absolute;
    width: 50px;
    height: 1px;
    top: 50%;
    transform: translateY(-50%);
    background: linear-gradient(90deg, var(--foreground-accent-muted), transparent);
  }
  @keyframes meteor {
    from { transform: rotate(215deg) translateX(0); opacity: 1; }
    to { transform: rotate(215deg) translateX(-500px); opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .meteor-shower { display: none !important; }
  }
`;

const js = `
  // Meteor initialization
  document.addEventListener("DOMContentLoaded", () => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) return;
    const targets = document.querySelectorAll('.meteor-target');
    targets.forEach(section => {
      const container = document.createElement('div');
      container.className = 'meteor-shower';
      for (let i = 0; i < 30; i++) {
        const m = document.createElement('span');
        m.className = 'meteor';
        const left = Math.random() * 100;
        const top = (Math.random() * 20) - 10;
        const delay = Math.random() * 5;
        const duration = 4 + (Math.random() * 6);
        m.style.left = left + '%';
        m.style.top = top + '%';
        m.style.animation = \`meteor \${duration}s linear \${delay}s infinite\`;
        container.appendChild(m);
      }
      section.appendChild(container);
    });
  });
`;

let html = fs.readFileSync('franchise.html', 'utf8');

// Inject CSS before </style> or at end of head
if (html.includes('</style>')) {
  html = html.replace('</style>', css + '\n  </style>');
} else {
  html = html.replace('</head>', '<style>' + css + '</style>\n</head>');
}

// Inject JS before </body> or at end
html = html.replace('</body>', '<script>' + js + '</script>\n</body>');

fs.writeFileSync('franchise.html', html);
console.log('Injected CSS and JS successfully.');
