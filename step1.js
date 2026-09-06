const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

const headEnd = html.indexOf('</head>');
const bodyStart = html.indexOf('<body>') + 6;

// I'll define the new cinematic scene HTML to insert at the top of body.
