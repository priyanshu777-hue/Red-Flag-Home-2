const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const videoScript = `
  <script>
  // Performance: Video Lazy Loading & Play/Pause
  document.addEventListener('DOMContentLoaded', () => {
    const isMobile = window.innerWidth < 768;
    
  });
  </script>
`;

if (!html.includes('Performance: Video Lazy Loading')) {
    html = html.replace('</title>', '</title>\n' + videoScript);
    fs.writeFileSync('index.html', html);
    console.log('Restored video lazy loading block');
} else {
    console.log('Video lazy loading block already exists');
}
