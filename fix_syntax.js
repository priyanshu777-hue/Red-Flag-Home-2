const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

const ioScript = `    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sections = document.querySelectorAll('.stagger-section');
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!isReducedMotion) {
            entry.target.classList.add('is-revealed');
            const children = entry.target.querySelectorAll('.stagger-child');
            children.forEach((child, index) => {
              child.style.transitionDelay = \`\${index * 80}ms\`;
              child.classList.add('is-revealed');
            });
          }
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    sections.forEach(sec => {
      observer.observe(sec);
      const children = sec.querySelectorAll('.stagger-child');
      children.forEach(child => {
        child.style.opacity = '0';
        child.style.transform = 'translateY(24px)';
        child.style.transition = 'opacity 700ms ease-out, transform 700ms ease-out';
      });
    });`;

// Remove the duplicate block
html = html.replace(/const isReducedMotion = window\.matchMedia[\s\S]*?observer\.observe\(s\);\s*\}\s*\}\);/m, ioScript);

fs.writeFileSync('franchise.html', html);
