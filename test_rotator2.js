const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const js = `
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
  // Apply the same typography classes/styles to measurer
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

  // Inject the first word
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
      
      // Preset enter states
      newChars.forEach(char => {
        char.style.opacity = '0';
        char.style.transform = 'translateY(8px)';
      });
      
      wrapper.appendChild(newFrag);

      // Force layout calculation
      void wrapper.offsetHeight;

      // Enter transition
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

// Replace HTML
html = html.replace('<div><span class="italic">S</span>tay <span class="italic">S</span>omewhere</div>\n        <div><span class="italic">W</span>orth <span class="rotating-text-wrapper"><span class="italic">R</span>emembering</span></div>',
'<div>Stay Somewhere</div>\n        <div>Worth <span class="rotating-text-wrapper">Remembering</span></div>');

// Replace old JS with new JS
html = html.replace(/\/\/ Rotating Text Reveal[\s\S]*?\}\);/m, js.trim());

fs.writeFileSync('index.html', html);
