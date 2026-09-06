const fs = require('fs');

function fixFile(file) {
  let html = fs.readFileSync(file, 'utf8');
  
  // Find the aurora-headline class definition
  const target = '.aurora-headline {';
  if (html.includes(target)) {
    // Add line-height and padding
    html = html.replace(
      /.aurora-headline {([\s\S]*?)}/,
      (match, content) => {
        // If it already has padding, maybe just replace it, or add it if it doesn't.
        if (!content.includes('padding: 0.1em 0;')) {
           return `.aurora-headline {${content}      line-height: 1.4;\n      padding: 0.1em 0;\n    }`;
        }
        return match;
      }
    );
    fs.writeFileSync(file, html);
    console.log(`Updated ${file}`);
  } else {
    console.log(`Target not found in ${file}`);
  }
}

fixFile('index.html');
fixFile('franchise.html');
