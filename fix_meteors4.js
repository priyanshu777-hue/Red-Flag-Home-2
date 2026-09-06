const fs = require('fs');

const css = `
  /* Meteor Effect */
  :root {
    --foreground-accent-muted: rgba(242, 228, 225, 0.4);
  }
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

let html = fs.readFileSync('franchise.html', 'utf8');

// replace the old CSS
html = html.replace(/\/\* Meteor Effect \*\/[\s\S]*?<\/style>/, css.trim() + '\n  </style>');
fs.writeFileSync('franchise.html', html);
