const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix Handpicked Homes panel
html = html.replace('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80', 'https://cdn.jsdelivr.net/gh/priyanshu777-hue/Red-Flag-Home-@main/handpicked.jpeg');

// Fix articles array
html = html.replace('https://cdn.jsdelivr.net/gh/priyanshu777-hue/Red-Flag-Home-@main/cleaning.jpeg', 'https://cdn.jsdelivr.net/gh/priyanshu777-hue/Red-Flag-Home-@main/cleaning.JPEG');
html = html.replace('https://cdn.jsdelivr.net/gh/priyanshu777-hue/Red-Flag-Home-@main/guest.jpeg', 'https://cdn.jsdelivr.net/gh/priyanshu777-hue/Red-Flag-Home-@main/guest.JPEG');

fs.writeFileSync('index.html', html);
console.log('Fixed images');
