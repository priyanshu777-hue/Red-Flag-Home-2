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
  let isAnimating = false;

  // Initial setup: clear out "Remembering" and wrap letters
  wrapper.innerHTML = '';
  wrapper.style.position = 'relative';
  wrapper.style.display = 'inline-flex';
  
  // Create a hidden measurer to find max width to prevent layout shift
  const measurer = document.createElement('span');
  measurer.style.visibility = 'hidden';
  measurer.style.position = 'absolute';
  measurer.style.whiteSpace = 'nowrap';
  document.body.appendChild(measurer);
  let maxWidth = 0;
  words.forEach(w => {
    measurer.textContent = w;
    // ensure same font styles
    measurer.style.fontFamily = getComputedStyle(wrapper).fontFamily;
    measurer.style.fontSize = getComputedStyle(wrapper).fontSize;
    const wWidth = measurer.getBoundingClientRect().width;
    if (wWidth > maxWidth) maxWidth = wWidth;
  });
  document.body.removeChild(measurer);
  // Add a little buffer
  wrapper.style.minWidth = (maxWidth + 5) + 'px';

  function splitWord(word) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\\u00A0' : char; // preserve space
      span.className = 'rot-char';
      span.style.display = 'inline-block';
      span.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      frag.appendChild(span);
    }
    return frag;
  }

  // initial word
  wrapper.appendChild(splitWord(words[0]));

  setInterval(() => {
    if (isAnimating) return;
    isAnimating = true;
    
    const currentChars = Array.from(wrapper.children);
    // Exit animation
    currentChars.forEach((char, i) => {
      setTimeout(() => {
        char.style.opacity = '0';
        char.style.transform = 'translateY(-8px)';
      }, i * 25);
    });

    const exitDuration = (currentChars.length * 25) + 400;

    setTimeout(() => {
      wordIndex = (wordIndex + 1) % words.length;
      const nextWord = words[wordIndex];
      wrapper.innerHTML = '';
      const newCharsFrag = splitWord(nextWord);
      
      const newChars = Array.from(newCharsFrag.children);
      newChars.forEach(char => {
        char.style.opacity = '0';
        char.style.transform = 'translateY(8px)';
      });
      wrapper.appendChild(newCharsFrag);

      // Enter animation
      // force reflow
      void wrapper.offsetHeight;

      newChars.forEach((char, i) => {
        setTimeout(() => {
          char.style.opacity = '1';
          char.style.transform = 'translateY(0)';
        }, i * 25);
      });

      const enterDuration = (newChars.length * 25) + 400;
      setTimeout(() => {
        isAnimating = false;
      }, enterDuration);

    }, exitDuration);

  }, 2500); // 1200ms hold + transitons roughly
});
`;

html = html.replace('<div><span class="italic">W</span>orth <span class="italic">R</span>emembering</div>',
'<div><span class="italic">W</span>orth <span class="rotating-text-wrapper"><span class="italic">R</span>emembering</span></div>');

// Inject JS
html = html.replace('</script>\n</body>', js + '\n</script>\n</body>');

fs.writeFileSync('index.html', html);
console.log('Test logic injected.');
