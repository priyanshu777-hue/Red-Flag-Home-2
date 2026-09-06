const fs = require('fs');

function fixHTML(filename) {
    if (!fs.existsSync(filename)) return;
    let html = fs.readFileSync(filename, 'utf8');
    
    // Fix Type Scale
    html = html.replace(/--raw-text-display:\s*clamp\([^)]+\);/g, '--raw-text-display: clamp(1.75rem, 5vw + 1rem, 5.625rem);');
    html = html.replace(/--raw-text-wordmark:\s*clamp\([^)]+\);/g, '--raw-text-wordmark: clamp(1.375rem, 2vw + 1rem, 1.5rem);');
    html = html.replace(/--raw-text-body:\s*clamp\([^)]+\);/g, '--raw-text-body: clamp(0.9375rem, 1vw + 0.5rem, 1rem);');

    // Remove lazy loading from images that are breaking
    html = html.replace(/loading="lazy" decoding="async"/g, '');
    html = html.replace(/loading="lazy"/g, '');

    // Replace the complicated video observer script with native autoplay/preload behavior
    // Just remove the script completely.
    html = html.replace(/const lazyVideos = document\.querySelectorAll\('\.lazy-video'\);[\s\S]*?lazyVideos\.forEach\(v => videoObserver\.observe\(v\)\);/g, '');
    
    // Remove the `lazy-video` class and ensure playsinline autoplay muted loop on background videos
    html = html.replace(/<video preload="none" class="lazy-video"([^>]+)>/g, '<video autoplay muted loop playsinline $1>');
    
    // Mobile Overrides for padding/heights and Right Rail
    const mobileCSS = `
    @media (max-width: 768px) {
      /* Reset massive heights and padding */
      #block3, #block4, #hero, #book, #franchise, #journal, .journal-container {
        height: auto !important;
        min-height: auto !important;
        margin-top: 0 !important;
      }
      #b3-pin-container { position: relative !important; height: auto !important; }
      #journal, #franchise, #contact, #book, #block4 { padding: 4rem 1.5rem !important; }
      .journal-container { gap: 2rem !important; }
      
      /* Right Rail Shrink & Move */
      #right-rail {
        top: 4.5rem !important;
        width: 2rem !important;
      }
      .rail-btn {
        min-height: 2.5rem !important;
        padding: 0.75rem 0 !important;
        font-size: 0.55rem !important;
      }
    }
    `;
    if (!html.includes('/* Reset massive heights')) {
        html = html.replace('</style>', mobileCSS + '\n</style>');
    }
    
    fs.writeFileSync(filename, html);
}

fixHTML('index.html');
fixHTML('franchise.html');

// Now, for index.html specifically, we must move .book-benefits
let indexHtml = fs.readFileSync('index.html', 'utf8');

// The exact block of book-benefits:
let startIdx = indexHtml.indexOf('<div class="book-benefits">');
if (startIdx !== -1) {
    let endStr = '      </div>\n    </div>\n'; // end of book-benefits
    let endIdx = indexHtml.indexOf(endStr, startIdx);
    if (endIdx !== -1) {
        endIdx += endStr.length;
        let benefitsHTML = indexHtml.substring(startIdx, endIdx);
        // Remove from original
        indexHtml = indexHtml.substring(0, startIdx) + indexHtml.substring(endIdx);
        
        // Find insert point in #book-container
        let insertPoint = indexHtml.indexOf('</form>');
        if (insertPoint !== -1) {
            insertPoint += '</form>'.length;
            indexHtml = indexHtml.substring(0, insertPoint) + '\n    ' + benefitsHTML + indexHtml.substring(insertPoint);
        }
    }
}
fs.writeFileSync('index.html', indexHtml);

console.log('Done fixing layout issues');
