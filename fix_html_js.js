const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

// Inject global background
html = html.replace(/<body id="top">\s*<!-- SCROLL SCENE -->/, 
  `<body id="top">
  
  <video id="global-bg-video" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260821_114821_a8ca298f-be2c-4613-a4dd-51b69e16bbde.mp4" autoplay muted loop playsinline></video>
  <div id="global-bg-poster"></div>
  
  <!-- SCROLL SCENE -->`);

// Remove old video and canvas from scene-inner
html = html.replace(/<video id="scene-video".*?><\/video>\s*<canvas id="scene-canvas".*?><\/canvas>/, '');

// Strip the video scrub logic from JS
const startMarker = "// VIDEO SCRUB";
const endMarker = "})();\n</script>";

const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  html = html.slice(0, startIdx) + html.slice(endIdx);
  fs.writeFileSync('franchise.html', html);
  console.log('Removed scrub logic.');
} else {
  console.log('Could not find video scrub logic block.');
}
