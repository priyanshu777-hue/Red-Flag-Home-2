const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf-8');

const navHTML = `
  <header class="bx-nav" style="position: absolute; top: 0; left: 0; width: 100%; z-index: 50; padding: 24px 4vw; display: flex; justify-content: space-between; align-items: flex-start; opacity: 0; transform: translateY(-20px); transition: opacity 0.8s ease-out 1.2s, transform 0.8s ease-out 1.2s;" id="op-header">
      <div style="display: flex; gap: 24px; align-items: center;">
        <a href="index.html" style="display: block; width: 40px;">
          <img src="https://cdn.jsdelivr.net/gh/priyanshu777-hue/Red-Flag-Home-@main/logobg.png" alt="Red Flag Homes Network" style="width: 100%; height: auto;" />
        </a>
        <a href="index.html" style="color: var(--outpost-dust); text-decoration: none; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; transition: color 0.3s;" onmouseover="this.style.color='var(--outpost-bone)'" onmouseout="this.style.color='var(--outpost-dust)'">Home</a>
        <a href="index.html#book" style="color: var(--outpost-dust); text-decoration: none; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; transition: color 0.3s;" onmouseover="this.style.color='var(--outpost-bone)'" onmouseout="this.style.color='var(--outpost-dust)'">Book a Stay</a>
        <a href="index.html#journal" style="color: var(--outpost-dust); text-decoration: none; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; transition: color 0.3s;" onmouseover="this.style.color='var(--outpost-bone)'" onmouseout="this.style.color='var(--outpost-dust)'">Explore</a>
        <a href="#apply" style="color: var(--outpost-dust); text-decoration: none; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; transition: color 0.3s;" onmouseover="this.style.color='var(--outpost-bone)'" onmouseout="this.style.color='var(--outpost-dust)'">Contact</a>
      </div>
      <a href="#apply" style="color: var(--outpost-flare); text-decoration: none; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 8px;">
        Founding Partner allocation — 40% off franchise fee
      </a>
  </header>
`;

html = html.replace(/<div id="op-bg">/, navHTML + '\n  <div id="op-bg">');

// Make the header fade in alongside the hero content
html = html.replace(/heroContent\.classList\.add\('is-ready'\);/g, "heroContent.classList.add('is-ready');\n        document.getElementById('op-header').style.opacity = '1';\n        document.getElementById('op-header').style.transform = 'translateY(0)';");

fs.writeFileSync('franchise.html', html);
