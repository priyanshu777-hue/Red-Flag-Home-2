const fs = require('fs');

function fixFile(file) {
  let html = fs.readFileSync(file, 'utf8');
  
  const target = '@media (max-width: 768px) {\n      .aurora-headline { font-size: 18px; }\n    }';
  const replacement = `@media (max-width: 768px) {
      .aurora-headline { font-size: 18px; }
      .aurora-headline-wrapper { width: 100%; box-sizing: border-box; }
    }`;

  if (html.includes(target)) {
    html = html.replace(target, replacement);
    fs.writeFileSync(file, html);
    console.log(`Updated ${file}`);
  } else {
    console.log(`Target not found in ${file}. Searching with regex...`);
    // Fallback regex if spacing differs
    const regex = /@media\s*\(max-width:\s*768px\)\s*\{\s*\.aurora-headline\s*\{\s*font-size:\s*18px;\s*\}\s*\}/g;
    if (regex.test(html)) {
        html = html.replace(regex, replacement);
        fs.writeFileSync(file, html);
        console.log(`Updated ${file} (via regex)`);
    } else {
        console.log(`Still not found in ${file}.`);
    }
  }
}

fixFile('index.html');
fixFile('franchise.html');
