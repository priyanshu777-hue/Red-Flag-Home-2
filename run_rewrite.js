const fs = require('fs');

let html = fs.readFileSync('franchise.html', 'utf8');
const newSections = fs.readFileSync('new_sections.html', 'utf8');

// Replace everything between <!-- STAT BAR --> and <!-- END CTA -->
const startMarker = '<!-- STAT BAR -->';
const endMarker = '<!-- END CTA -->';
const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker) + endMarker.length;

if (startIdx !== -1 && endIdx !== -1) {
  html = html.substring(0, startIdx) + newSections + html.substring(endIdx);
  console.log("Replaced HTML content");
} else {
  console.log("Could not find markers", startIdx, endIdx);
}

// Ensure the form CSS is clean
const cssToAdd = `
/* ADDITIONAL CSS FOR REDESIGN */
.op-section {
  width: 100%;
  background: rgba(10, 12, 18, 0.94);
  padding: 160px 0;
  margin: 0;
  border-radius: 0;
  box-sizing: border-box;
  opacity: 0;
  transform: translateY(24px);
  will-change: transform, opacity;
}
.op-section.is-revealed {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 700ms ease-out, transform 700ms ease-out;
}
@media (max-width: 767px) {
  .op-section {
    padding: 96px 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .op-section, .stagger-child {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
.op-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 4vw;
  box-sizing: border-box;
}

/* Eyebrows */
.op-eyebrow {
  font-family: 'Inter', sans-serif !important;
  font-size: 12px !important;
  letter-spacing: 0.18em !important;
  color: #a31621 !important; /* brand red */
  text-transform: uppercase !important;
  margin-bottom: 24px;
  display: block;
}

/* Typography Scales */
.op-h2 {
  font-family: 'Instrument Serif', serif !important;
  font-size: 40px !important;
  line-height: 1.2 !important;
  color: rgba(255, 255, 255, 0.95) !important;
  font-weight: 400 !important;
  text-transform: none !important;
}
.op-h3 {
  font-family: 'Instrument Serif', serif !important;
  font-size: 24px !important;
  line-height: 1.3 !important;
  color: rgba(255, 255, 255, 0.95) !important;
  font-weight: 400 !important;
  text-transform: none !important;
}
.op-body, p, li {
  font-family: 'Inter', sans-serif !important;
  font-size: 17px !important;
  line-height: 1.6 !important;
  color: rgba(255, 255, 255, 0.72) !important;
}
.op-small {
  font-family: 'Inter', sans-serif !important;
  font-size: 13px !important;
  letter-spacing: 0.12em !important;
  text-transform: uppercase !important;
  color: rgba(255, 255, 255, 0.72) !important;
}

/* Economics Figure */
.op-eco-fig {
  font-family: 'Instrument Serif', serif !important;
  font-size: 96px !important;
  line-height: 1.1 !important;
  color: rgba(255, 255, 255, 0.95) !important;
  text-align: center;
  font-weight: 400 !important;
}
@media (max-width: 767px) {
  .op-eco-fig { font-size: 48px !important; }
}
.op-eco-yield {
  font-family: 'Inter', sans-serif !important;
  font-size: 20px !important;
  color: #a31621 !important;
  text-align: center;
  margin-top: 16px;
}
.op-eco-caveat {
  font-family: 'Inter', sans-serif !important;
  font-size: 13px !important;
  color: rgba(255,255,255,0.4) !important;
  text-align: center;
  margin-top: 48px;
  margin-bottom: 80px;
}

/* Workings Table */
.op-workings {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  border-collapse: collapse;
}
.op-workings td, .op-workings th {
  padding: 16px 0 !important;
  border-bottom: 1px solid rgba(255,255,255,0.2) !important;
}
.op-workings tr:last-child td {
  border-bottom: none !important;
}
.op-workings td:last-child, .op-workings th:last-child {
  text-align: right;
  color: rgba(255, 255, 255, 0.95) !important;
}

/* System Steps */
.op-step {
  display: flex;
  position: relative;
  margin-bottom: 80px;
  align-items: center;
}
.op-step:last-child { margin-bottom: 0; }
.op-step-num {
  font-family: 'Instrument Serif', serif !important;
  font-size: 120px !important;
  color: rgba(255, 255, 255, 0.08) !important;
  width: 50%;
  text-align: center;
  line-height: 1;
}
.op-step-content {
  width: 50%;
  padding: 0 4vw;
}
.op-step:nth-child(even) {
  flex-direction: row-reverse;
}
.op-step-connector {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: -80px;
  width: 1px;
  background: #a31621;
}
.op-step:last-child .op-step-connector {
  bottom: 0;
}
@media (max-width: 767px) {
  .op-step { flex-direction: column !important; text-align: center; margin-bottom: 64px; }
  .op-step-num { width: 100%; font-size: 80px !important; margin-bottom: 16px; }
  .op-step-content { width: 100%; padding: 0; }
  .op-step-connector { display: none; }
}

/* Form Styles Override */
#apply-form {
  max-width: 560px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.op-field {
  margin-bottom: 0 !important;
}
.op-field label {
  display: block !important;
  font-size: 13px !important;
  font-family: 'Inter', sans-serif !important;
  letter-spacing: 0.12em !important;
  text-transform: uppercase !important;
  color: rgba(255, 255, 255, 0.72) !important;
  margin-bottom: 8px !important;
}
.op-input, .op-select {
  width: 100% !important;
  height: 44px !important;
  background: transparent !important;
  border: none !important;
  border-bottom: 1px solid rgba(255,255,255,0.25) !important;
  color: rgba(255, 255, 255, 0.95) !important;
  font-family: 'Inter', sans-serif !important;
  font-size: 17px !important;
  padding: 0 8px !important;
  border-radius: 0 !important;
  transition: border-color 0.2s !important;
  box-sizing: border-box !important;
}
.op-input:focus, .op-select:focus {
  outline: none !important;
  border-bottom: 1px solid #fff !important;
}
.op-submit {
  height: 44px;
  background: #fff;
  color: #000;
  border: none;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 13px;
  cursor: pointer;
  padding: 0 32px;
  align-self: flex-start;
  margin-top: 8px;
  border-radius: 4px;
}
.op-submit:hover {
  background: rgba(255,255,255,0.8);
}
`;

html = html.replace('</style>', cssToAdd + '\n  </style>');

// Also update Intersection Observer logic
// Fade from opacity 0 / translateY 24px over 700ms. Stagger children 80ms.
const ioScript = `
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      // add stagger child initial state
      const children = sec.querySelectorAll('.stagger-child');
      children.forEach(child => {
        child.style.opacity = '0';
        child.style.transform = 'translateY(24px)';
        child.style.transition = 'opacity 700ms ease-out, transform 700ms ease-out';
      });
    });
`;

html = html.replace(/const sections = document\.querySelectorAll\('\.op-section, \.op-phase'\);[\s\S]*?\}\);[\s\S]*?\}\);/m, ioScript);

fs.writeFileSync('franchise.html', html);
console.log("Done rewriting franchise.html");
