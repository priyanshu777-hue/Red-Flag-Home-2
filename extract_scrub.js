const fs = require('fs');
const f2 = fs.readFileSync('franchise2.html', 'utf8');

const canvasRegex = /<canvas id="scene-canvas"[^>]*><\/canvas>/;
const canvasMatch = f2.match(canvasRegex);

const scriptStart = f2.indexOf('// VIDEO SCRUB');
const scriptEnd = f2.indexOf('})();\n</script>', scriptStart) + 14;
const scriptStr = f2.substring(scriptStart, scriptEnd);

fs.writeFileSync('scrub.json', JSON.stringify({
  canvas: canvasMatch ? canvasMatch[0] : '',
  script: scriptStr
}));
console.log('Extracted scrub block.');
