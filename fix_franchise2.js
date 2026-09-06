const fs = require('fs');
let html = fs.readFileSync('franchise2.html', 'utf8');

// I need to strip out `runHeroSequence()` and `generateDust()` calls from the script block.
html = html.replace(/runHeroSequence\(\);/g, '// runHeroSequence();');
html = html.replace(/generateDust\(\);/g, '// generateDust();');

// Also remove the old fog drift and parallax logic which refers to #op-bg-fog and #op-bg-video,
// as they are no longer in the HTML (they were before the cut).
html = html.replace(/const fog = document\.getElementById\('op-bg-fog'\);/, 'const fog = null;');
html = html.replace(/const bgVid = document\.getElementById\('op-bg-video'\);/, 'const bgVid = null;');
html = html.replace(/const fgParallax = document\.querySelector\('\.op-parallax-fg'\);/, 'const fgParallax = null;');

html = html.replace(/fog\.style\.transform =/g, 'if (fog) fog.style.transform =');
html = html.replace(/bgVid\.style\.transform =/g, 'if (bgVid) bgVid.style.transform =');

fs.writeFileSync('franchise.html', html);
console.log('Fixed scripts in franchise.html');
