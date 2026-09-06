const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

html = html.replace(/new MP4Box\.DataStream\(undefined, 0, MP4Box\.DataStream\.BIG_ENDIAN\)/g, 
  'new DataStream(undefined, 0, DataStream.BIG_ENDIAN)');

fs.writeFileSync('franchise.html', html);
console.log('Fixed DataStream reference.');
