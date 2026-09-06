const fs = require('fs');

let html = fs.readFileSync('franchise.html', 'utf8');

const css = `
  /* Newsletter Modal */
  .nl-modal { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; pointer-events: none; opacity: 0; transition: opacity 0.4s ease; }
  .nl-modal.is-open { pointer-events: auto; opacity: 1; }
  .nl-overlay { position: absolute; inset: 0; background: rgba(10, 5, 5, 0.8); backdrop-filter: blur(8px); }
  .nl-content { position: relative; background: #1A0A0C; border: 1px solid var(--foreground-accent-muted, rgba(242,228,225,0.4)); border-radius: 16px; padding: 3rem 2.5rem; max-width: 440px; width: 90%; transform: translateY(20px); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 24px 48px rgba(0,0,0,0.5); text-align: center; }
  .nl-modal.is-open .nl-content { transform: translateY(0); }
  .nl-close { position: absolute; top: 1rem; right: 1rem; background: transparent; border: none; color: var(--foreground-accent-muted, rgba(242,228,225,0.4)); cursor: pointer; transition: color 0.2s ease; padding: 0.5rem; display: flex; align-items: center; justify-content: center; }
  .nl-close:hover { color: #f2f2f2; }
  .nl-title { font-size: 2.5rem; color: #f2f2f2; margin-bottom: 0.5rem; line-height: 1.1; font-weight: 600; }
  .nl-desc { font-size: 0.95rem; color: var(--foreground-accent-muted, rgba(242,228,225,0.4)); margin-bottom: 2rem; line-height: 1.5; }
  .nl-form { display: flex; flex-direction: column; gap: 1rem; }
  .nl-input { width: 100%; text-align: center; background: transparent; border: 1px solid var(--foreground-accent-muted, rgba(242,228,225,0.4)); color: #f2f2f2; padding: 1rem; border-radius: 6px; outline: none; transition: border-color 0.2s ease; box-sizing: border-box; }
  .nl-input::placeholder { color: var(--foreground-accent-muted, rgba(242,228,225,0.4)); }
  .nl-success { margin-top: 1rem; color: #f2f2f2; font-size: 0.95rem; display: none; }
`;

const htmlSnippet = `
<!-- Newsletter Modal -->
<div id="newsletter-modal" class="nl-modal" aria-hidden="true">
  <div class="nl-overlay" id="nl-close-overlay"></div>
  <div class="nl-content">
    <button class="nl-close" id="nl-close-btn" aria-label="Close">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
    </button>
    <h2 class="nl-title">The Inner Circle</h2>
    <p class="nl-desc">Subscribe to receive exclusive access to unlisted properties and investment insights.</p>
    <form id="nl-form" class="nl-form">
      <input type="email" placeholder="Your email address" required class="nl-input" />
      <button type="submit" class="prog-btn interactive-btn nl-submit" style="width: 100%; border: none;">
        <span class="btn-dot"></span>
        <span class="btn-label-default">Subscribe</span>
        <span class="btn-label-hover">Subscribe →</span>
      </button>
    </form>
    <p id="nl-success" class="nl-success">Welcome to the network.</p>
  </div>
</div>
`;

const jsSnippet = `
// Newsletter Modal Logic
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('newsletter-modal');
  const closeBtn = document.getElementById('nl-close-btn');
  const overlay = document.getElementById('nl-close-overlay');
  const form = document.getElementById('nl-form');
  const success = document.getElementById('nl-success');
  
  if (!modal) return;
  
  let hasTriggered = sessionStorage.getItem('rf_newsletter_seen');
  
  const checkScroll = () => {
    if (hasTriggered) return;
    const scrollPos = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = scrollPos / docHeight;
    
    if (scrollPercent >= 0.75) {
      openModal();
    }
  };
  
  const openModal = () => {
    modal.classList.add('is-open');
    modal.removeAttribute('aria-hidden');
    hasTriggered = true;
    sessionStorage.setItem('rf_newsletter_seen', 'true');
    window.removeEventListener('scroll', checkScroll);
  };
  
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  };
  
  window.addEventListener('scroll', checkScroll, { passive: true });
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', closeModal);
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.style.display = 'none';
      success.style.display = 'block';
      setTimeout(closeModal, 2500);
    });
  }
});
`;

if (!html.includes('/* Newsletter Modal */')) {
  html = html.replace('</style>', css + '\n  </style>');
}

if (!html.includes('id="newsletter-modal"')) {
  if (html.includes('</main>')) {
    html = html.replace('</main>', htmlSnippet + '\n</main>');
  } else {
    html = html.replace('</body>', htmlSnippet + '\n</body>');
  }
}

if (!html.includes('rf_newsletter_seen')) {
  html = html.replace('</script>\n</body>', jsSnippet + '\n</script>\n</body>');
}

fs.writeFileSync('franchise.html', html);
console.log('Newsletter modal injected in franchise.html.');
