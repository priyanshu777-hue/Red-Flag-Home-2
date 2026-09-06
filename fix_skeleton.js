const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const skeletonCSS = `
  /* Skeleton Loading State */
  .skeleton {
    background: linear-gradient(90deg, rgba(242, 228, 225, 0.05) 25%, rgba(242, 228, 225, 0.12) 50%, rgba(242, 228, 225, 0.05) 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite linear;
  }
  @keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .skeleton {
      animation: none;
      background: rgba(242, 228, 225, 0.08);
    }
  }
  .ac-skeleton-card {
    pointer-events: none;
  }
`;

if (!html.includes('/* Skeleton Loading State */')) {
  html = html.replace('</style>', skeletonCSS + '\n  </style>');
}

const skeletonHTML = `
    <!-- Skeleton cards -->
    <article class="ac-card ac-skeleton-card">
      <header class="ac-card-header">
        <div class="ac-cover skeleton"></div>
      </header>
      <div class="ac-card-content">
        <div class="ac-meta">
          <span class="skeleton" style="width: 60px; height: 24px; border-radius: 999px;"></span>
          <span class="ac-dot" style="opacity: 0;">•</span>
          <span class="skeleton" style="width: 80px; height: 16px; border-radius: 4px;"></span>
        </div>
        <div class="skeleton" style="width: 90%; height: 28px; margin-bottom: 12px; border-radius: 4px;"></div>
        <div class="skeleton" style="width: 100%; height: 16px; margin-bottom: 8px; border-radius: 4px;"></div>
        <div class="skeleton" style="width: 100%; height: 16px; margin-bottom: 8px; border-radius: 4px;"></div>
        <div class="skeleton" style="width: 70%; height: 16px; border-radius: 4px;"></div>
      </div>
      <footer class="ac-card-footer">
        <div class="ac-by">
          <div class="skeleton" style="width: 40px; height: 14px; margin-bottom: 6px; border-radius: 4px;"></div>
          <div class="skeleton" style="width: 100px; height: 16px; border-radius: 4px;"></div>
        </div>
        <div class="ac-published">
          <div class="skeleton" style="width: 60px; height: 14px; margin-bottom: 6px; margin-left: auto; border-radius: 4px;"></div>
          <div class="skeleton" style="width: 80px; height: 16px; margin-left: auto; border-radius: 4px;"></div>
        </div>
      </footer>
    </article>
`;

// we need 3 skeletons
const threeSkeletons = skeletonHTML + skeletonHTML + skeletonHTML;

html = html.replace(
  '<div class="ac-grid" id="ac-grid">\n    <!-- cards injected here -->\n  </div>',
  '<div class="ac-grid" id="ac-grid">\n' + threeSkeletons + '\n  </div>'
);

// Delay renderExplore to window.onload instead of DOMContentLoaded
html = html.replace(
  /document\.addEventListener\("DOMContentLoaded", \(\) => {\s*renderExplore\(\);\s*}\);/,
  'window.addEventListener("load", () => { setTimeout(renderExplore, 400); });'
);

fs.writeFileSync('index.html', html);
console.log('Skeleton injected.');
