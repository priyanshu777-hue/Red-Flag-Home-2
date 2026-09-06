const fs = require('fs');

const nlJs = `
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
      if (success) success.style.display = 'block';
      setTimeout(closeModal, 2500);
    });
  }
});
`;

const rotatorJs = `
// Rotating Text Reveal
document.addEventListener('DOMContentLoaded', () => {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReducedMotion) return;

  const wrapper = document.querySelector('.rotating-text-wrapper');
  if (!wrapper) return;

  const words = ["Remembering", "Returning To", "Talking About"];
  let wordIndex = 0;

  // Clear out static text and setup
  wrapper.innerHTML = '';
  wrapper.style.display = 'inline-flex';
  
  // Calculate max width dynamically based on font context
  const measurer = document.createElement('span');
  measurer.style.visibility = 'hidden';
  measurer.style.position = 'absolute';
  measurer.style.whiteSpace = 'nowrap';
  document.body.appendChild(measurer);
  
  let maxWidth = 0;
  measurer.className = wrapper.parentElement.className;
  measurer.style.fontFamily = getComputedStyle(wrapper).fontFamily;
  measurer.style.fontSize = getComputedStyle(wrapper).fontSize;
  measurer.style.fontWeight = getComputedStyle(wrapper).fontWeight;
  measurer.style.letterSpacing = getComputedStyle(wrapper).letterSpacing;
  
  words.forEach(w => {
    measurer.textContent = w;
    const wWidth = measurer.getBoundingClientRect().width;
    if (wWidth > maxWidth) maxWidth = wWidth;
  });
  document.body.removeChild(measurer);
  wrapper.style.minWidth = Math.ceil(maxWidth + 5) + 'px';

  function splitWord(word) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\\u00A0' : char; // Non-breaking space for layout
      span.style.display = 'inline-block';
      span.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      frag.appendChild(span);
    }
    return frag;
  }

  const initialFrag = splitWord(words[0]);
  wrapper.appendChild(initialFrag);

  function cycleWords() {
    const currentChars = Array.from(wrapper.children);
    
    // 1. Exit transition
    currentChars.forEach((char, i) => {
      setTimeout(() => {
        char.style.opacity = '0';
        char.style.transform = 'translateY(-8px)';
      }, i * 25);
    });

    const exitDuration = (currentChars.length * 25) + 400;

    // 2. Wait for exit, swap and enter
    setTimeout(() => {
      wordIndex = (wordIndex + 1) % words.length;
      const nextWord = words[wordIndex];
      wrapper.innerHTML = '';
      
      const newFrag = splitWord(nextWord);
      const newChars = Array.from(newFrag.children);
      
      newChars.forEach(char => {
        char.style.opacity = '0';
        char.style.transform = 'translateY(8px)';
      });
      
      wrapper.appendChild(newFrag);

      void wrapper.offsetHeight;

      newChars.forEach((char, i) => {
        setTimeout(() => {
          char.style.opacity = '1';
          char.style.transform = 'translateY(0)';
        }, i * 25);
      });

      const enterDuration = (newChars.length * 25) + 400;

      // 3. Hold for 1.2s before next cycle
      setTimeout(cycleWords, enterDuration + 1200);

    }, exitDuration);
  }

  // Start the first hold phase
  setTimeout(cycleWords, 1200);
});
`;

let indexHtml = fs.readFileSync('index.html', 'utf8');

// If we already added a script tag for these, let's remove it to be clean, but we probably didn't.
// Let's just append the script tag before </body>
if (!indexHtml.includes('rf_newsletter_seen')) {
  indexHtml = indexHtml.replace('</body>', '<script>\n' + nlJs + '\n' + rotatorJs + '\n</script>\n</body>');
}

fs.writeFileSync('index.html', indexHtml);

let franHtml = fs.readFileSync('franchise.html', 'utf8');
if (!franHtml.includes('rf_newsletter_seen')) {
  franHtml = franHtml.replace('</body>', '<script>\n' + nlJs + '\n</script>\n</body>');
}
fs.writeFileSync('franchise.html', franHtml);

console.log('Scripts injected securely.');
