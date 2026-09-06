const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
  'window.addEventListener("load", () => { setTimeout(renderExplore, 400); });',
  'let exploreRendered = false;\nfunction safeRenderExplore() {\n  if(exploreRendered) return;\n  exploreRendered = true;\n  renderExplore();\n}\nwindow.addEventListener("load", () => { setTimeout(safeRenderExplore, 400); });\nsetTimeout(safeRenderExplore, 2000);'
);

fs.writeFileSync('index.html', html);
