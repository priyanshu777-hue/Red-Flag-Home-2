const fs = require('fs');

let html = fs.readFileSync('franchise.html', 'utf8');

const headEndIdx = html.indexOf('</head>');
const bodyEndIdx = html.indexOf('</body>');

// I need to find the start of the sections that stay.
// The prompt says "the ticker, the pitch line, the Execution Map... stays exactly as it is."
// And we also want to keep the stat bar (since it has figures like ₹75,000 -> ₹1,48,500).
const startOfRest = html.indexOf('<!-- STAT BAR -->');
if (startOfRest === -1) {
    console.error("Could not find <!-- STAT BAR -->");
    process.exit(1);
}

// 1. Get the existing <head> up to just before </head>
let newHtml = html.slice(0, headEndIdx) + `
  <link href="https://db.onlinewebfonts.com/c/95cecf452d3208890088a5b4c19c7ecf?family=Helvetica+Neue+ME" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/mp4box@0.5.2/dist/mp4box.all.min.js"></script>
  <style>
    html { scroll-behavior: smooth; }
    body { overflow-x: hidden; }
    
    #scene-outer {
      position: relative;
      height: 500vh;
      width: 100%;
      background: #000;
    }
    #scene-inner {
      position: sticky;
      top: 0;
      width: 100%;
      height: 100vh;
      overflow: hidden;
      font-family: 'Helvetica Neue ME', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }
    #scene-video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
    }
    #scene-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 300ms;
      pointer-events: none;
    }
    #scene-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    
    /* NAV */
    #scene-nav {
      position: absolute;
      top: 0;
      width: 100%;
      z-index: 50;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 32px 24px 24px 24px;
      color: #1D3045;
      transition: color 500ms;
    }
    @media (min-width: 640px) {
      #scene-nav { padding: 48px 32px 24px 32px; }
    }
    @media (min-width: 768px) {
      #scene-nav { padding: 48px 48px 24px 48px; }
    }
    
    .nav-left {
      display: none;
    }
    @media (min-width: 1024px) {
      .nav-left {
        display: flex;
        gap: 32px;
      }
    }
    @media (min-width: 1280px) {
      .nav-left { gap: 40px; }
    }
    .nav-link {
      font-size: 12px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      font-weight: 500;
      color: inherit;
      text-decoration: none;
      transition: opacity 0.2s, border-color 0.2s;
      position: relative;
      opacity: 0;
      transform: translateY(-12px);
    }
    .nav-link:hover { opacity: 0.7; }
    .nav-link.active {
      border-bottom: 2px solid currentColor;
      padding-bottom: 2px;
      margin-bottom: -4px;
    }
    
    .nav-right {
      display: none;
    }
    @media (min-width: 640px) {
      .nav-right {
        display: flex;
        align-items: center;
        gap: 24px;
        opacity: 0;
        transform: translateY(-12px);
      }
    }
    .nav-alloc {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      font-weight: 500;
      color: inherit;
      text-decoration: none;
    }
    .nav-alloc-circle {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: currentColor;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-alloc-icon {
      color: white; /* Inverted from currentColor - handled by JS or CSS */
    }
    
    .hamburger {
      display: flex;
      flex-direction: column;
      gap: 5px;
      cursor: pointer;
      background: none;
      border: none;
      padding: 8px;
    }
    @media (min-width: 1024px) {
      .hamburger { display: none; }
    }
    .hamburger-bar {
      height: 2px;
      background: currentColor;
      transition: background 500ms;
    }
    .hamburger-bar:nth-child(1) { width: 24px; }
    .hamburger-bar:nth-child(2) { width: 24px; }
    .hamburger-bar:nth-child(3) { width: 16px; }

    /* MENU OVERLAY */
    #mobile-menu-overlay {
      position: fixed;
      inset: 0;
      z-index: 100;
      background: #1D3045;
      opacity: 0;
      pointer-events: none;
      transition: opacity 500ms cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
    }
    #mobile-menu-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }
    #mobile-menu-inner {
      transform: translateY(-32px);
      transition: transform 500ms cubic-bezier(0.4, 0, 0.2, 1);
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    #mobile-menu-overlay.open #mobile-menu-inner {
      transform: translateY(0);
    }
    
    .menu-close {
      position: absolute;
      top: 32px;
      right: 24px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      color: white;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    @media (min-width: 640px) {
      .menu-close { top: 48px; right: 32px; }
    }
    .menu-close:hover { border-color: white; }
    
    .menu-links {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0 32px;
    }
    @media (min-width: 640px) {
      .menu-links { padding: 0 48px; }
    }
    .menu-link {
      font-size: 24px;
      font-weight: 300;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.6);
      text-decoration: none;
      padding: 12px 0;
      transition: color 0.2s;
      opacity: 0;
      transform: translateY(20px);
    }
    @media (min-width: 640px) {
      .menu-link { font-size: 30px; }
    }
    .menu-link:hover { color: white; }
    .menu-link.active { color: white; }
    
    .menu-footer {
      display: flex;
      gap: 32px;
      padding: 0 32px 40px 32px;
      font-size: 12px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.6);
    }
    @media (min-width: 640px) {
      .menu-footer { padding: 0 48px 40px 48px; }
    }
    .menu-footer a { color: inherit; text-decoration: none; transition: color 0.2s; opacity: 0; transform: translateY(20px); }
    .menu-footer a:hover { color: white; }

    /* SECTIONS */
    .scene-section {
      position: absolute;
      inset: 0;
      opacity: 0;
      transition: opacity 0.1s ease-out;
      pointer-events: none;
    }
    
    .stagger-child {
      opacity: 0;
      transform: translateY(24px);
      transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
    }
    .scene-section.visible .stagger-child {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    
    /* Section 1 */
    #sec1 {
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
    }
    @media (min-width: 640px) { #sec1 { padding: 32px; } }
    @media (min-width: 768px) { #sec1 { padding: 80px; } }
    @media (min-width: 1024px) { #sec1 { padding: 128px; } }
    
    .s1-h1 {
      font-size: clamp(2rem, 5vw, 5rem);
      font-weight: 300;
      text-transform: uppercase;
      line-height: 1.2;
      color: #1D3045;
      max-width: 800px;
    }
    .s1-sub {
      margin-top: 24px;
      font-size: 14px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: #1D304590;
      max-width: 600px;
      line-height: 1.6;
    }
    .s1-btn {
      position: absolute;
      bottom: 48px;
      right: 24px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 1px solid rgba(29, 48, 69, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1D3045;
      transition: opacity 0.2s;
    }
    @media (min-width: 640px) { .s1-btn { right: 32px; } }
    @media (min-width: 768px) { .s1-btn { right: 48px; } }
    .s1-btn:hover { opacity: 0.7; }
    
    /* Section 2 */
    #sec2 {
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    @media (min-width: 640px) { #sec2 { padding: 32px; } }
    
    .s2-h2 {
      max-width: 900px;
      font-size: clamp(1.5rem, 4.5vw, 4.5rem);
      font-weight: 200;
      letter-spacing: 0.05em;
      line-height: 1.3;
      text-align: center;
      text-transform: uppercase;
      color: #1D3045;
    }
    .s2-right {
      position: absolute;
      bottom: 64px;
      right: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    @media (min-width: 640px) { .s2-right { right: 32px; } }
    @media (min-width: 768px) { .s2-right { right: 48px; } }
    
    .s2-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 1px solid rgba(29, 48, 69, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1D3045;
    }
    .s2-circle-small {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid rgba(29, 48, 69, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(29, 48, 69, 0.8);
      margin-top: 8px;
    }
    .s2-dots {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
      align-items: center;
    }
    .s2-dot-1 { width: 8px; height: 8px; border-radius: 50%; background: #1D3045; }
    .s2-dot-2 { width: 6px; height: 6px; border-radius: 50%; background: rgba(29, 48, 69, 0.4); }
    
    /* Section 3 */
    #sec3 {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 24px;
    }
    @media (min-width: 640px) { #sec3 { padding: 32px; } }
    @media (min-width: 768px) { #sec3 { padding: 80px; } }
    @media (min-width: 1024px) { #sec3 { padding: 128px; } }
    
    .s3-content {
      max-width: 42rem;
      text-align: left;
    }
    .s3-eye {
      color: rgba(255,255,255,0.6);
      font-size: 18px;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    .s3-h2 {
      font-size: clamp(2rem, 4vw, 4rem);
      font-weight: 300;
      color: white;
      line-height: 1.2;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 32px;
    }
    .s3-cta {
      display: flex;
      align-items: center;
      gap: 16px;
      text-decoration: none;
    }
    .s3-cta-text {
      font-size: 14px;
      letter-spacing: 0.3em;
      color: rgba(255,255,255,0.8);
      text-transform: uppercase;
    }
    .s3-cta-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: white;
      color: #1f2937; /* gray-800 */
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s;
    }
    .s3-cta:hover .s3-cta-circle {
      transform: scale(1.1);
    }
    
    /* Icons SVG paths (lucide) */
    .icon { width: 1em; height: 1em; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; fill: none; }
  </style>
</head>
<body id="top">
  
  <!-- SCROLL SCENE -->
  <div id="scene-outer">
    <div id="scene-inner">
      <video id="scene-video" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260821_114821_a8ca298f-be2c-4613-a4dd-51b69e16bbde.mp4" muted playsinline preload="auto"></video>
      <canvas id="scene-canvas" width="1920" height="1080"></canvas>
      
      <div id="scene-overlay">
        
        <!-- NAVBAR -->
        <div id="scene-nav">
          <div class="nav-left" id="nav-left-links">
            <a href="#top" class="nav-link active">RED FLAG OUTPOST</a>
            <a href="index.html#book" class="nav-link">BOOK A STAY</a>
            <a href="index.html#journal" class="nav-link">EXPLORE</a>
            <a href="#math" class="nav-link">THE MATH</a>
            <a href="#apply" class="nav-link">APPLY</a>
          </div>
          
          <button class="hamburger" id="nav-hamburger">
            <div class="hamburger-bar"></div>
            <div class="hamburger-bar"></div>
            <div class="hamburger-bar"></div>
          </button>
          
          <div class="nav-right" id="nav-right-links">
            <a href="#apply" class="nav-alloc">
              ALLOCATION
              <div class="nav-alloc-circle" id="nav-alloc-circle">
                <svg class="icon nav-alloc-icon" viewBox="0 0 24 24" style="width: 10px; height: 10px; color: #E8E4DF"><path d="M12 16v-4"/><path d="M12 8h.01"/><circle cx="12" cy="12" r="10"/></svg>
              </div>
            </a>
            <div style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500; cursor: pointer;" id="nav-menu-btn">MENU</div>
          </div>
        </div>
        
        <!-- SECTION 1 -->
        <div class="scene-section" id="sec1">
          <h1 class="s1-h1 stagger-child" style="transition-delay: 0ms">No property?<br>No problem.</h1>
          <div class="s1-sub stagger-child" style="transition-delay: 150ms">You bring the capital and the location. We bring the blueprint, the brand, and the AI system that runs it.</div>
          <a href="#apply" class="s1-btn stagger-child" style="transition-delay: 300ms">
            <svg class="icon" viewBox="0 0 24 24" style="width: 18px; height: 18px;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
        </div>
        
        <!-- SECTION 2 -->
        <div class="scene-section" id="sec2">
          <h2 class="s2-h2 stagger-child" style="transition-delay: 0ms">
            Most franchises hand you a business <span style="color: rgba(29, 48, 69, 0.8)">and leave you to run it</span> <span style="color: rgba(29, 48, 69, 0.5)">we hand you an asset and run it for you</span>
          </h2>
          <div class="s2-right stagger-child" style="transition-delay: 200ms">
            <div class="s2-circle">
              <svg class="icon" viewBox="0 0 24 24" style="width: 18px; height: 18px;"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
            </div>
            <div class="s2-dots" style="transition-delay: 350ms">
              <div class="s2-dot-1"></div>
              <div class="s2-dot-2"></div>
              <div class="s2-dot-2"></div>
            </div>
            <div class="s2-circle-small stagger-child" style="transition-delay: 500ms">
              <svg class="icon" viewBox="0 0 24 24" style="width: 16px; height: 16px;"><path d="m18 15-6-6-6 6"/></svg>
            </div>
          </div>
        </div>
        
        <!-- SECTION 3 -->
        <div class="scene-section" id="sec3">
          <div class="s3-content">
            <div class="s3-eye stagger-child" style="transition-delay: 0ms">Red Flag Homes Network</div>
            <h2 class="s3-h2 stagger-child" style="transition-delay: 150ms">Be part of<br>the revolution.</h2>
            <a href="#apply" class="s3-cta stagger-child" style="transition-delay: 300ms">
              <span class="s3-cta-text">Apply for Allocation</span>
              <div class="s3-cta-circle">
                <svg class="icon" viewBox="0 0 24 24" style="width: 16px; height: 16px;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
            </a>
          </div>
        </div>
        
      </div>
    </div>
  </div>
  
  <!-- MOBILE MENU -->
  <div id="mobile-menu-overlay">
    <div id="mobile-menu-inner">
      <button class="menu-close" id="menu-close">
        <svg class="icon" viewBox="0 0 24 24" style="width: 18px; height: 18px;"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
      <div class="menu-links">
        <a href="#top" class="menu-link active stagger-link">Red Flag Outpost</a>
        <a href="index.html#book" class="menu-link stagger-link">Book a Stay</a>
        <a href="index.html#journal" class="menu-link stagger-link">Explore</a>
        <a href="#math" class="menu-link stagger-link">The Math</a>
      </div>
      <div class="menu-footer">
        <a href="#apply" class="stagger-link">Allocation</a>
        <a href="#apply" class="stagger-link">Contact</a>
      </div>
    </div>
  </div>

  <div class="op-layout op-parallax-fg" style="background: var(--outpost-void); position: relative; z-index: 10;">
    <div class="op-content-col" style="padding-top: 80px;">
`;

// Append the rest of the file starting from <!-- STAT BAR -->
const restOfHtml = html.slice(startOfRest);

// Now we need to append the new scripts. We should put them just before </body>
const newScripts = `
<script>
(function() {
  const container = document.getElementById('scene-outer');
  const video = document.getElementById('scene-video');
  const canvas = document.getElementById('scene-canvas');
  const nav = document.getElementById('scene-nav');
  const sec1 = document.getElementById('sec1');
  const sec2 = document.getElementById('sec2');
  const sec3 = document.getElementById('sec3');
  const DARK = '#1D3045';
  
  let p = 0;
  
  function updateScroll() {
    const rect = container.getBoundingClientRect();
    const totalScroll = container.offsetHeight - window.innerHeight;
    const currentScroll = -rect.top;
    p = Math.max(0, Math.min(1, currentScroll / totalScroll));
    
    // update sections opacity
    let s1 = p < 0.20 ? 1 : Math.max(0, 1 - (p - 0.20) / 0.08);
    let s2 = p < 0.32 ? 0 : p < 0.40 ? (p - 0.32) / 0.08 : p < 0.55 ? 1 : Math.max(0, 1 - (p - 0.55) / 0.08);
    let s3 = p < 0.67 ? 0 : p < 0.75 ? (p - 0.67) / 0.08 : 1;
    
    sec1.style.opacity = s1;
    sec2.style.opacity = s2;
    sec3.style.opacity = s3;
    
    sec1.classList.toggle('visible', s1 > 0.3);
    sec2.classList.toggle('visible', s2 > 0.3);
    sec3.classList.toggle('visible', s3 > 0.3);
    
    // flip nav color
    const isLight = p > 0.55;
    nav.style.color = isLight ? 'white' : DARK;
    
    const icon = document.querySelector('.nav-alloc-icon');
    if (icon) {
      icon.style.color = isLight ? DARK : 'white';
    }
  }
  
  window.addEventListener('scroll', updateScroll, {passive: true});
  window.addEventListener('resize', updateScroll);
  updateScroll();
  
  // NAV ENTRANCE
  setTimeout(() => {
    document.querySelectorAll('#nav-left-links .nav-link').forEach((el, i) => {
      el.style.transition = 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)';
      el.style.transitionDelay = (i * 80 + 100) + 'ms';
      el.style.opacity = 1;
      el.style.transform = 'translateY(0)';
    });
    
    const rightNav = document.getElementById('nav-right-links');
    if (rightNav) {
      rightNav.style.transition = 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)';
      rightNav.style.transitionDelay = '500ms';
      rightNav.style.opacity = 1;
      rightNav.style.transform = 'translateY(0)';
    }
  }, 200);

  // MOBILE MENU
  const overlay = document.getElementById('mobile-menu-overlay');
  const btnMenu = document.getElementById('nav-menu-btn');
  const btnHam = document.getElementById('nav-hamburger');
  const btnClose = document.getElementById('menu-close');
  const staggerLinks = document.querySelectorAll('.stagger-link');
  
  function openMenu() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    staggerLinks.forEach((el, i) => {
      el.style.transition = 'opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1), color 0.2s';
      el.style.transitionDelay = (i * 60 + 200) + 'ms';
      el.style.opacity = 1;
      el.style.transform = 'translateY(0)';
    });
  }
  
  function closeMenu() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    staggerLinks.forEach(el => {
      el.style.transitionDelay = '0ms';
      el.style.opacity = 0;
      el.style.transform = 'translateY(20px)';
    });
  }
  
  if (btnMenu) btnMenu.addEventListener('click', openMenu);
  if (btnHam) btnHam.addEventListener('click', openMenu);
  if (btnClose) btnClose.addEventListener('click', closeMenu);
  document.querySelectorAll('.menu-link').forEach(el => el.addEventListener('click', closeMenu));
  
  // VIDEO SCRUB
  const videoSrc = video.src;
  
  const LERP_TAU = 8;
  const SNAP = 0.002;
  const LRU_MAX = 24;
  const LEAD = 24;
  const WATCHDOG = 60000;
  
  let bank = [];
  let lru = new Map();
  let current = 0;
  let target = 0;
  let ready = false;
  let reverted = false;
  let painted = false;
  let building = false;
  let dur = 0;
  
  let lastTime = performance.now();
  
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  function rAF(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    
    if (dur > 0 && !reverted) {
      target = p * dur;
      if (isReduced) {
        current = target;
      } else {
        current += (target - current) * (1 - Math.exp(-dt * LERP_TAU));
        if (Math.abs(target - current) < SNAP) current = target;
      }
      
      if (ready && bank.length > 0) {
        drawFrame();
      } else {
        // fallback
        if (Math.abs(video.currentTime - current) > 0.01) {
          video.currentTime = current;
        }
      }
    } else if (reverted && dur > 0) {
        target = p * dur;
        current += (target - current) * (1 - Math.exp(-dt * LERP_TAU));
        if (Math.abs(video.currentTime - current) > 0.01) {
          video.currentTime = current;
        }
    }
    
    requestAnimationFrame(rAF);
  }
  requestAnimationFrame(rAF);
  
  video.addEventListener('loadedmetadata', () => {
    dur = video.duration || 0;
    if (!isReduced && window.VideoDecoder && window.MP4Box) {
      buildBank();
    }
  });
  // fallback if metadata not firing
  setTimeout(() => {
    if (dur === 0 && video.duration) {
      dur = video.duration;
      if (!isReduced && window.VideoDecoder && window.MP4Box) {
        buildBank();
      }
    }
  }, 1000);
  
  let watchdogTimer;
  
  async function buildBank() {
    if (building) return;
    building = true;
    
    watchdogTimer = setTimeout(() => {
      revertToFallback();
    }, WATCHDOG);
    
    try {
      const response = await fetch(videoSrc);
      const buffer = await response.arrayBuffer();
      buffer.fileStart = 0;
      
      const mp4boxfile = MP4Box.createFile();
      let videoTrack = null;
      let decoder = null;
      let offscreen = null;
      if (typeof OffscreenCanvas !== 'undefined') {
        offscreen = new OffscreenCanvas(1920, 1080);
      } else {
        offscreen = document.createElement('canvas');
        offscreen.width = 1920;
        offscreen.height = 1080;
      }
      const ctx = offscreen.getContext('2d', { alpha: false });
      
      let samplesCount = 0;
      let samplesProcessed = 0;
      
      decoder = new VideoDecoder({
        output: async (frame) => {
          ctx.drawImage(frame, 0, 0, 1920, 1080);
          const ts = frame.timestamp; // microseconds
          frame.close();
          
          let blob;
          if (offscreen.convertToBlob) {
             blob = await offscreen.convertToBlob({ type: 'image/webp', quality: 0.82 });
          } else {
             blob = await new Promise(resolve => offscreen.toBlob(resolve, 'image/webp', 0.82));
          }
          
          bank.push({ ts, blob });
          bank.sort((a, b) => a.ts - b.ts);
          
          samplesProcessed++;
          if (samplesProcessed === samplesCount) {
             ready = true;
             clearTimeout(watchdogTimer);
          } else if (samplesProcessed > 10) {
             ready = true; // start rendering early
          }
        },
        error: (e) => {
          console.error("VideoDecoder error", e);
          revertToFallback();
        }
      });
      
      mp4boxfile.onReady = (info) => {
        videoTrack = info.videoTracks[0];
        if (!videoTrack) return revertToFallback();
        
        let codec = videoTrack.codec;
        if (codec.startsWith('vp08')) codec = 'vp8';
        
        let description = null;
        for (const box of mp4boxfile.moov.traks[0].mdia.minf.stbl.stsd.entries) {
          if (box.avcC || box.hvcC || box.vpcC || box.av1C) {
            const stream = new MP4Box.DataStream(undefined, 0, MP4Box.DataStream.BIG_ENDIAN);
            box.write(stream);
            description = new Uint8Array(stream.buffer, 8); 
            break;
          }
        }
        
        decoder.configure({
          codec: codec,
          codedWidth: videoTrack.video.width,
          codedHeight: videoTrack.video.height,
          description: description,
          hardwareAcceleration: 'prefer-hardware'
        });
        
        mp4boxfile.setExtractionOptions(videoTrack.id, null, { nbSamples: 1000 });
        mp4boxfile.start();
      };
      
      mp4boxfile.onSamples = (id, user, samples) => {
        samplesCount = samples.length;
        let i = 0;
        
        function pushNext() {
           if (i >= samples.length) return;
           if (decoder.decodeQueueSize > LEAD) {
              setTimeout(pushNext, 10);
              return;
           }
           const s = samples[i];
           const chunk = new EncodedVideoChunk({
             type: s.is_sync ? 'key' : 'delta',
             timestamp: s.cts * 1000000 / s.timescale,
             duration: s.duration * 1000000 / s.timescale,
             data: s.data
           });
           decoder.decode(chunk);
           i++;
           pushNext();
        }
        pushNext();
      };
      
      mp4boxfile.appendBuffer(buffer);
      mp4boxfile.flush();
      
    } catch (err) {
      console.error(err);
      revertToFallback();
    }
  }
  
  function revertToFallback() {
    reverted = true;
    ready = false;
    canvas.style.opacity = 0;
  }
  
  let drawBusy = false;
  async function drawFrame() {
    if (drawBusy || bank.length === 0) return;
    drawBusy = true;
    
    const t = current * 1e6;
    let idx = 0;
    for (let i = 0; i < bank.length; i++) {
       if (bank[i].ts > t) {
          idx = Math.max(0, i - 1);
          break;
       }
       idx = i;
    }
    
    let bitmap = lru.get(idx);
    if (!bitmap) {
       bitmap = await createImageBitmap(bank[idx].blob);
       lru.set(idx, bitmap);
       if (lru.size > LRU_MAX) {
          const firstKey = lru.keys().next().value;
          const old = lru.get(firstKey);
          if (old) old.close();
          lru.delete(firstKey);
       }
    }
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    
    if (!painted) {
       painted = true;
       canvas.style.opacity = 1;
    }
    
    drawBusy = false;
  }
})();
</script>
`;

const finalHtml = newHtml + restOfHtml.replace('</body>', newScripts + '\n</body>');

fs.writeFileSync('franchise2.html', finalHtml);
console.log('Done generating franchise2.html');
