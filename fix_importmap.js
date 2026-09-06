const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const badBlock = `  { "imports": {
      "lenis": "https://unpkg.com/lenis@1.3.19/dist/lenis.mjs"
  } }

    // Performance: Video Lazy Loading & Play/Pause
  document.addEventListener('DOMContentLoaded', () => {
    const isMobile = window.innerWidth < 768;
    
  });`;

if (html.includes(badBlock)) {
    html = html.replace(badBlock, '  { "imports": {\n      "lenis": "https://unpkg.com/lenis@1.3.19/dist/lenis.mjs"\n  } }');
    fs.writeFileSync('index.html', html);
    console.log('Fixed importmap.');
} else {
    console.log('Block not found, trying regex.');
    html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/, '<script type="importmap">\n  { "imports": { "lenis": "https://unpkg.com/lenis@1.3.19/dist/lenis.mjs" } }\n</script>');
    fs.writeFileSync('index.html', html);
}
