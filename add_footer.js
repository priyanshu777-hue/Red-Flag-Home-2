const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf-8');

const footerHTML = `
      <footer style="margin-top: 120px; border-top: 1px solid var(--outpost-fog); padding-top: 40px; display: flex; flex-direction: column; gap: 40px; color: var(--outpost-dust);">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 40px;">
          
          <div style="flex: 1; min-width: 280px;">
            <p style="margin-bottom: 8px;">
              <a href="mailto:partners@redflagworld.co.uk" style="color: var(--outpost-bone); text-decoration: none; transition: color 0.3s;" onmouseover="this.style.color='var(--outpost-flare)'" onmouseout="this.style.color='var(--outpost-bone)'">partners@redflagworld.co.uk</a>
            </p>
            <p class="op-small">Red Flag Homes Network · a Red Flag World Holdings Ltd company</p>
          </div>
          
          <div style="flex: 1; min-width: 280px; max-width: 400px;">
            <h3 class="op-h3" style="color: var(--outpost-bone); margin-bottom: 8px; font-family: 'Inter', sans-serif; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">The Inner Circle</h3>
            <p class="op-small" style="margin-bottom: 16px;">Subscribe to receive exclusive access to unlisted properties and investment insights.</p>
            
            <form id="footer-newsletter" style="display: flex; gap: 8px; position: relative;">
              <input type="email" class="op-input" id="footer-newsletter-email" placeholder="Email address" required style="flex: 1; min-height: 40px;">
              <button type="submit" class="op-btn" style="min-height: 40px; padding: 0 16px;">Subscribe &rarr;</button>
            </form>
            <p id="footer-newsletter-success" class="op-small" style="color: var(--outpost-flare); margin-top: 12px; display: none;">Welcome to the network.</p>
          </div>

        </div>
      </footer>
`;

html = html.replace(/<\/section>\s*<\/div> <!-- op-content-col -->/, "</section>\n" + footerHTML + "\n    </div> <!-- op-content-col -->");

html = html.replace(/<\/script>/, `
    document.getElementById('footer-newsletter').addEventListener('submit', function(e) {
      e.preventDefault();
      document.getElementById('footer-newsletter-email').value = '';
      document.getElementById('footer-newsletter-success').style.display = 'block';
    });
  </script>
`);

fs.writeFileSync('franchise.html', html);
