const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

// Add stagger-child to elements in THE ECONOMICS
html = html.replace('<div class="op-eco-fig">', '<div class="op-eco-fig stagger-child">');
html = html.replace('<div class="op-eco-yield">', '<div class="op-eco-yield stagger-child">');
html = html.replace('<div class="op-eco-caveat">', '<div class="op-eco-caveat stagger-child">');
html = html.replace('<table class="op-workings">', '<table class="op-workings stagger-child">');

// Add stagger-child to elements in THE COMPARISON
html = html.replace('<h2 class="op-h2" style="margin-bottom: 40px;">', '<h2 class="op-h2 stagger-child" style="margin-bottom: 40px;">');
html = html.replace('<table class="op-workings" style="max-width: 800px;">', '<table class="op-workings stagger-child" style="max-width: 800px;">');

// Add stagger-child to elements in APPLY
html = html.replace('<h2 class="op-h2" style="margin-bottom: 16px;">', '<h2 class="op-h2 stagger-child" style="margin-bottom: 16px;">');
html = html.replace('<p class="op-body" style="margin-bottom: 40px; max-width: 600px;">', '<p class="op-body stagger-child" style="margin-bottom: 40px; max-width: 600px;">');
html = html.replace('<form id="apply-form">', '<form id="apply-form" class="stagger-child">');

// Add stagger-child to THE SYSTEM heading/desc
html = html.replace('<h2 class="op-h2" style="margin-bottom: 24px;">', '<h2 class="op-h2 stagger-child" style="margin-bottom: 24px;">');
html = html.replace('<p class="op-body" style="margin-bottom: 80px; max-width: 800px;">', '<p class="op-body stagger-child" style="margin-bottom: 80px; max-width: 800px;">');

// Ensure eyebrows also have stagger-child
html = html.replace(/<span class="op-eyebrow">/g, '<span class="op-eyebrow stagger-child">');

fs.writeFileSync('franchise.html', html);
console.log('Added stagger-child to elements');
