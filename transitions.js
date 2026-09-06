(function() {
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Inject Styles
  const style = document.createElement('style');
  style.textContent = `
    .section-container, .prog-section {
      padding-top: 96px !important;
      padding-bottom: 96px !important;
      border-top: none !important;
      border-bottom: none !important;
    }
    @media (max-width: 768px) {
      .section-container, .prog-section {
        padding-top: 56px !important;
        padding-bottom: 56px !important;
      }
    }
    .media-fade-top, .media-fade-bottom {
      position: absolute;
      left: 0;
      width: 100%;
      height: 15%;
      z-index: 5;
      pointer-events: none;
    }
    .media-fade-top { top: 0; background: linear-gradient(to bottom, var(--background, var(--lk-asset, #080808)) 0%, transparent 100%); }
    .media-fade-bottom { bottom: 0; background: linear-gradient(to top, var(--background, var(--lk-asset, #080808)) 0%, transparent 100%); }

    .scroll-reveal { opacity: 0; transform: translateY(32px); will-change: opacity, transform; }
    .scroll-reveal.is-revealed { opacity: 1; transform: translateY(0); transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
    .stagger-child { transition-delay: calc(var(--i) * 80ms); }

    @media (prefers-reduced-motion: reduce) {
      .scroll-reveal { opacity: 1 !important; transform: translateY(0) !important; transition: none !important; will-change: auto !important; }
      .media-fade-top, .media-fade-bottom { display: none !important; }
    }
  `;
  document.head.appendChild(style);

  document.addEventListener('DOMContentLoaded', () => {
    // 2. Blend Boundaries
    const mediaBgSelectors = '#vid-base, #book-video, #b3-bg-img, #franchise-video, .lk-bg video';
    const mediaBgs = document.querySelectorAll(mediaBgSelectors);
    
    mediaBgs.forEach(media => {
      const container = media.closest('section') || media.closest('.lk-stage');
      if (!container) return;
      
      container.style.position = 'relative';

      const prev = container.previousElementSibling;
      const next = container.nextElementSibling;
      
      if (prev && prev.tagName !== 'SCRIPT' && prev.tagName !== 'STYLE' && prev.id !== 'vignette') {
        const topFade = document.createElement('div');
        topFade.className = 'media-fade-top';
        container.appendChild(topFade);
      }
      
      if (next && next.tagName !== 'SCRIPT' && next.tagName !== 'STYLE') {
        const bottomFade = document.createElement('div');
        bottomFade.className = 'media-fade-bottom';
        container.appendChild(bottomFade);
      }
    });

    // 3 & 4. Scroll Reveal & Stagger
    if (!isReduced) {
      const staggerGroups = [
        '.franchise-points',
        '.franchise-stats',
        '.ft-grid',
        '.bx-grid',
        '.math-table tbody',
        '.vs-table tbody',
        '.ac-grid',
        '.b4-panels',
        '.lk-brutal > div > header', // avoid all of them
        '.bx-nav'
      ];
      
      staggerGroups.forEach(sel => {
        document.querySelectorAll(sel).forEach(group => {
          let count = 0;
          Array.from(group.children).forEach((child) => {
            child.classList.add('scroll-reveal', 'stagger-child');
            child.style.setProperty('--i', count++);
          });
        });
      });

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            entry.target.addEventListener('transitionend', function handler(e) {
              if (e.target === entry.target && (e.propertyName === 'transform' || e.propertyName === 'opacity')) {
                entry.target.style.willChange = 'auto';
                entry.target.classList.remove('scroll-reveal', 'is-revealed', 'stagger-child');
                entry.target.removeEventListener('transitionend', handler);
              }
            });
            obs.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15,
        rootMargin: "0px 0px -10% 0px"
      });

      // Content containers to reveal
      const sections = document.querySelectorAll('.section-container, .prog-section, .lk-stage');
      sections.forEach(sec => {
         Array.from(sec.children).forEach(child => {
           if (child.tagName === 'VIDEO' || child.tagName === 'IMG' || 
               child.id === 'b3-bg-img' || child.id === 'franchise-overlay' || 
               child.id === 'hero-overlay' || child.id === 'b3-pin-container' ||
               child.id === 'vid-base' || child.id === 'hero-grain' || child.id === 'hero-veil' ||
               child.classList.contains('media-fade-top') || child.classList.contains('media-fade-bottom') ||
               child.classList.contains('lk-bg') || child.id === 'hero-ui-container') {
             
             if (child.id === 'b3-pin-container') {
               const b3c = child.querySelector('#b3-content');
               if (b3c) {
                 b3c.classList.add('scroll-reveal');
                 observer.observe(b3c);
               }
             } else if (child.id === 'hero-ui-container') {
               Array.from(child.children).forEach(c => {
                 c.classList.add('scroll-reveal');
                 observer.observe(c);
               });
             }
           } else if (!child.classList.contains('stagger-child') && !child.classList.contains('particle-container')) {
             child.classList.add('scroll-reveal');
             observer.observe(child);
           }
         });
      });
      
      document.querySelectorAll('.stagger-child').forEach(el => observer.observe(el));
      
      // 5. Subtle Parallax
      const isMobile = window.innerWidth < 768;
      const maxShift = isMobile ? 20 : 40;
      
      let ticking = false;
      function updateParallax() {
        mediaBgs.forEach(media => {
          const rect = media.getBoundingClientRect();
          const inView = rect.top < window.innerHeight && rect.bottom > 0;
          if (inView) {
            media.style.willChange = 'transform';
            const centerPos = rect.top + (rect.height / 2);
            const screenCenter = window.innerHeight / 2;
            const ratio = (centerPos - screenCenter) / (window.innerHeight + rect.height);
            const y = -ratio * maxShift * 2; 
            media.style.transform = `translateY(${y}px)`;
          } else {
             media.style.willChange = 'auto';
          }
        });
        ticking = false;
      }
      
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            updateParallax();
          });
          ticking = true;
        }
      });
      updateParallax();
    }
  });
})();
