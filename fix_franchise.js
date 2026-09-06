const fs = require('fs');

const css = `
    :root {
      --outpost-void: #06080B;
      --outpost-deep: #0C1117;
      --outpost-fog: #1A2129;
      --outpost-bone: #E8E4DF;
      --outpost-dust: #8A8F96;
      --outpost-flare: #A31621;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: var(--outpost-void);
      color: var(--outpost-bone);
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      line-height: 1.6;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* Typography Scale */
    .op-display { font-family: 'Instrument Serif', serif; font-weight: 400; font-size: 96px; line-height: 1.1; }
    .op-h1 { font-family: 'Instrument Serif', serif; font-weight: 400; font-size: 56px; line-height: 1.1; }
    .op-h2 { font-family: 'Instrument Serif', serif; font-weight: 400; font-size: 32px; line-height: 1.2; }
    .op-h3 { font-family: 'Instrument Serif', serif; font-weight: 400; font-size: 20px; line-height: 1.3; }
    .op-body { font-size: 16px; max-width: 68ch; }
    .op-small { font-size: 13px; max-width: 68ch; }
    
    @media (max-width: 767px) {
      .op-display { font-size: 40px; }
      .op-h1 { font-size: 28px; }
      .op-h2 { font-size: 22px; }
      .op-h3 { font-size: 17px; }
      .op-body { font-size: 15px; }
      .op-small { font-size: 12px; }
    }

    /* Layout */
    .op-layout {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 4vw;
      display: flex;
    }
    .op-content-col {
      width: 62%;
      padding-bottom: 120px;
    }
    @media (max-width: 1024px) {
      .op-content-col {
        width: 100%;
      }
    }

    /* Atmospheric Background Layer */
    #op-bg {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
    }
    #op-bg-video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      will-change: transform;
    }
    #op-bg-fog {
      position: absolute;
      inset: -50px;
      background: radial-gradient(circle at 40% 50%, rgba(26,33,41,0.35) 0%, transparent 60%);
      will-change: transform;
    }
    .op-dust {
      position: absolute;
      background: #FFF;
      border-radius: 50%;
      pointer-events: none;
    }

    /* Section defaults */
    .op-section {
      margin-top: 120px;
      opacity: 0;
      transition: opacity 0.4s ease-out;
      will-change: transform, opacity;
    }
    .op-section.is-revealed {
      opacity: 1;
    }
    @media (max-width: 767px) {
      .op-section {
        margin-top: 60px;
      }
    }

    /* Hero */
    .op-hero {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      opacity: 1; 
      margin-top: 0;
    }
    .op-hero-name {
      font-family: 'Michroma', sans-serif;
      font-size: 24px;
      letter-spacing: 0.15em;
      color: var(--outpost-flare);
      text-transform: uppercase;
      text-align: center;
      position: relative;
      margin-bottom: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }
    @media (max-width: 767px) {
      .op-hero-name { font-size: 16px; margin-bottom: 60px; }
    }
    
    .op-hero-name-chars {
      display: flex;
      position: relative;
      z-index: 2;
    }
    .op-hero-name-char {
      opacity: 0;
      transform: scale(1.6);
      filter: blur(12px);
    }
    
    .op-hero-line {
      position: absolute;
      left: 50%;
      top: 50%;
      height: 1px;
      background: var(--outpost-flare);
      width: 0;
      transform: translate(-50%, -50%);
      z-index: 1;
    }
    .op-hero-shockwave {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 0;
      height: 0;
      border: 1px solid rgba(163,22,33,0.5);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      opacity: 0;
      z-index: 0;
      pointer-events: none;
    }
    
    .op-hero-content {
      opacity: 0;
      transform: translateY(20px);
    }
    .op-hero-content.is-ready {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.8s ease-out, transform 0.8s ease-out;
    }
    
    .op-hero .op-h1 { margin-bottom: 24px; }
    .op-hero .op-body { color: var(--outpost-dust); margin-bottom: 40px; }

    /* Button CTA */
    .op-btn {
      display: inline-flex;
      align-items: center;
      background: transparent;
      color: var(--outpost-flare);
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      text-decoration: none;
      border: 1px solid var(--outpost-flare);
      padding: 12px 24px;
      cursor: pointer;
      transition: background 0.3s, color 0.3s;
    }
    .op-btn:hover {
      background: var(--outpost-flare);
      color: var(--outpost-void);
    }

    /* Stat Bar */
    .op-stat-bar {
      margin-top: 120px;
    }
    .op-stat-figures {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .op-stat-arrow {
      color: var(--outpost-dust);
      position: relative;
      overflow: hidden;
      display: inline-block;
      width: 24px;
    }
    .op-stat-arrow span {
      display: inline-block;
      transform: translateX(-100%);
    }
    .is-revealed .op-stat-arrow span {
      transform: translateX(0);
      transition: transform 1.1s ease-out;
    }
    .op-stat-val {
      color: var(--outpost-bone);
    }
    .op-stat-yield {
      color: var(--outpost-bone);
      margin-bottom: 8px;
    }
    .op-stat-caveat {
      color: var(--outpost-dust);
    }

    /* Ticker */
    .op-ticker {
      border-top: 1px solid var(--outpost-fog);
      border-bottom: 1px solid var(--outpost-fog);
      padding: 16px 0;
      overflow: hidden;
      white-space: nowrap;
      display: flex;
    }
    .op-ticker-track {
      display: flex;
      animation: opTicker 40s linear infinite;
    }
    .op-ticker:hover .op-ticker-track {
      animation-play-state: paused;
    }
    .op-ticker-item {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--outpost-dust);
      padding: 0 24px;
    }
    @keyframes opTicker {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    /* Intro */
    .op-intro {
      color: var(--outpost-dust);
    }
    .op-intro strong {
      color: var(--outpost-bone);
      font-weight: 500;
    }

    /* Execution Map */
    .op-map {
      position: relative;
      padding-left: 40px;
    }
    .op-map-line {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 1px;
      background: transparent;
    }
    .op-map-line-fill {
      position: absolute;
      left: 0;
      top: 0;
      width: 1px;
      background: var(--outpost-flare);
      height: 0;
      transition: height 0.6s ease-out;
    }
    .op-phase {
      position: relative;
      margin-bottom: 64px;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.4s ease-out, transform 0.4s ease-out;
    }
    .op-phase.is-revealed {
      opacity: 1;
      transform: translateY(0);
    }
    .op-phase-num {
      position: absolute;
      left: -40px;
      top: 0;
      width: 24px;
      height: 24px;
      background: var(--outpost-flare);
      color: var(--outpost-bone);
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translateX(-50%);
      opacity: 0;
      transition: opacity 0.4s ease-out 0.2s;
    }
    .op-phase.is-revealed .op-phase-num {
      opacity: 1;
    }
    .op-phase-title {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--outpost-flare);
      margin-bottom: 16px;
    }
    .op-phase-desc {
      color: var(--outpost-bone);
      margin-bottom: 16px;
    }
    .op-phase-bullets {
      list-style: none;
      color: var(--outpost-dust);
    }
    .op-phase-bullets li {
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
    }
    .op-phase-bullets li::before {
      content: '→';
      position: absolute;
      left: 0;
      top: 0;
      color: var(--outpost-flare);
    }

    /* Setup Flex */
    .op-flex-strike {
      position: relative;
      display: inline-block;
      color: var(--outpost-dust);
    }
    .op-flex-strike::after {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 0;
      height: 2px;
      background: var(--outpost-flare);
      transition: width 0.4s ease-out;
    }
    .is-revealed .op-flex-strike::after {
      width: 100%;
    }

    /* The Math */
    .op-math {
      background: var(--outpost-deep);
      padding: 40px;
    }
    .op-math-scroll {
      overflow-x: auto;
      margin: 32px 0;
      position: relative;
    }
    .op-math-scroll::-webkit-scrollbar { height: 4px; }
    .op-math-scroll::-webkit-scrollbar-thumb { background: var(--outpost-fog); }
    
    .op-table {
      width: 100%;
      min-width: 600px;
      border-collapse: collapse;
      text-align: left;
    }
    .op-table th, .op-table td {
      padding: 16px;
      border-bottom: 1px solid var(--outpost-fog);
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      color: var(--outpost-bone);
    }
    .op-table th {
      color: var(--outpost-dust);
      font-weight: 500;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .op-table .highlight-col {
      border-left: 1px solid var(--outpost-flare);
      border-right: 1px solid var(--outpost-flare);
      background: rgba(255,255,255,0.02);
    }
    
    .op-math-caveats {
      margin-top: 32px;
    }
    .op-math-caveats p {
      margin-bottom: 16px;
      color: var(--outpost-bone);
    }

    /* Comparison */
    .op-compare-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .op-compare-table th, .op-compare-table td {
      padding: 16px 0;
      border-bottom: 1px solid var(--outpost-fog);
      font-size: 16px;
    }
    .op-compare-table th {
      color: var(--outpost-dust);
      font-weight: 500;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      width: 33%;
    }
    .op-compare-table td:nth-child(2) {
      color: var(--outpost-dust);
      width: 33%;
    }
    .op-compare-table td:nth-child(3) {
      color: var(--outpost-bone);
    }

    /* Form */
    .op-form {
      margin-top: 40px;
    }
    .op-field {
      margin-bottom: 32px;
      position: relative;
    }
    .op-field label {
      display: block;
      font-size: 13px;
      color: var(--outpost-dust);
      margin-bottom: 8px;
    }
    .op-field.op-field-heavy label {
      color: var(--outpost-bone);
      font-weight: 500;
    }
    .op-input, .op-select {
      width: 100%;
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--outpost-fog);
      color: var(--outpost-bone);
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      padding: 8px 0;
      min-height: 44px;
      outline: none;
      transition: border-color 0.3s;
    }
    .op-input:focus, .op-select:focus {
      border-bottom-color: var(--outpost-flare);
    }
    .op-select {
      appearance: none;
      border-radius: 0;
    }
    .op-select option {
      background: var(--outpost-deep);
      color: var(--outpost-bone);
    }
    
    /* End CTA */
    .op-end {
      min-height: 50vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      margin-bottom: 0;
    }
    .op-end .op-h1 { margin-bottom: 16px; }
    .op-end .op-body { color: var(--outpost-dust); margin-bottom: 40px; }

    /* Parallax container for text content */
    .op-parallax-fg {
      will-change: transform;
    }
`;

const htmlBody = `
  <!-- Background Layer (Fixed) -->
  <div id="op-bg">
    <video id="op-bg-video" src="https://cdn.jsdelivr.net/gh/priyanshu777-hue/Red-Flag-Home-@main/franchise.mp4" autoplay muted loop playsinline></video>
    <div id="op-bg-fog"></div>
    <div id="op-dust-container"></div>
  </div>

  <div class="op-layout">
    <div class="op-content-col op-parallax-fg">
      
      <!-- HERO -->
      <section class="op-hero">
        <div class="op-hero-name" id="hero-name">
          <div class="op-hero-shockwave" id="hero-shockwave"></div>
          <div class="op-hero-line" id="hero-line"></div>
          <div class="op-hero-name-chars" id="hero-chars"></div>
        </div>
        
        <div class="op-hero-content" id="hero-content">
          <h2 class="op-h2 op-display" style="margin-bottom: 24px; font-size: 20px; font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 0.1em; color: var(--outpost-dust);">THE INVESTMENT PLAYBOOK</h2>
          <h1 class="op-h1">No property? No problem.</h1>
          <p class="op-body">You bring the capital and the location. We bring the blueprint, the brand, the creators, and the AI system that runs it.</p>
          <a href="#apply" class="op-btn">Apply for Allocation</a>
        </div>
      </section>

      <!-- STAT BAR -->
      <section class="op-section op-stat-bar">
        <div class="op-stat-figures">
          <div class="op-h1 op-stat-val">₹75,000</div>
          <div class="op-stat-arrow op-h1"><span>→</span></div>
          <div class="op-h1 op-stat-val" id="stat-target">₹1,48,500</div>
          <div class="op-h1 op-stat-val" style="color: var(--outpost-dust); font-size: 32px; align-self: flex-end; margin-bottom: 6px;">/mo</div>
        </div>
        <div class="op-stat-yield op-h3">≈ 2x yield spread</div>
        <div class="op-stat-caveat op-small">Illustrative, 3-key Villa at 55% occupancy. Full workings below.</div>
      </section>

      <!-- TICKER -->
      <section class="op-section" style="margin-top: 80px; padding: 0;">
        <div class="op-ticker">
          <div class="op-ticker-track">
            <!-- Repeated items to ensure smooth infinite scroll -->
            <div class="op-ticker-item">ASSET LIGHT · ZERO STAFF · CREATOR-LED MARKETING · AI-RUN OPERATIONS · LIFETIME SUPPORT · </div>
            <div class="op-ticker-item">ASSET LIGHT · ZERO STAFF · CREATOR-LED MARKETING · AI-RUN OPERATIONS · LIFETIME SUPPORT · </div>
            <div class="op-ticker-item">ASSET LIGHT · ZERO STAFF · CREATOR-LED MARKETING · AI-RUN OPERATIONS · LIFETIME SUPPORT · </div>
            <div class="op-ticker-item">ASSET LIGHT · ZERO STAFF · CREATOR-LED MARKETING · AI-RUN OPERATIONS · LIFETIME SUPPORT · </div>
          </div>
        </div>
      </section>

      <!-- INTRO -->
      <section class="op-section op-intro">
        <h2 class="op-h2" style="margin-bottom: 24px; color: var(--outpost-bone);">Most franchises hand you a business and leave you to run it. We hand you an asset and run it for you.</h2>
        <p class="op-body">No staff to hire. No hospitality experience needed. No ops to learn. This is not a guessing game. It's a system. Here is exactly how your capital becomes a high-yield asset.</p>
      </section>

      <!-- EXECUTION MAP -->
      <section class="op-section op-map" id="exec-map">
        <div class="op-map-line"></div>
        <div class="op-map-line-fill" id="map-line-fill"></div>
        
        <div class="op-phase phase-item">
          <div class="op-phase-num">01</div>
          <div class="op-phase-title">THE HUNT</div>
          <p class="op-phase-desc op-body">We don't let you sign a bad lease. Using demand data from our managed portfolio, we assess your property — or help you find one in a high-demand, low-supply pocket.</p>
          <ul class="op-phase-bullets op-body">
            <li>Demand & occupancy-potential assessment</li>
            <li>Lease negotiation support</li>
            <li>Legal and risk review before you commit</li>
          </ul>
        </div>

        <div class="op-phase phase-item">
          <div class="op-phase-num">02</div>
          <div class="op-phase-title">THE FLIP</div>
          <p class="op-phase-desc op-body">Keys secured, our build team moves in. Ordinary spaces become premium, photograph-ready properties in under 45 days.</p>
          <ul class="op-phase-bullets op-body">
            <li>Signature interior transformation — Pinterest-forward, Greek-architecture accents</li>
            <li>Furnishing, styling and decor procurement</li>
            <li>Smart locks, keyless entry, high-speed WiFi</li>
          </ul>
        </div>

        <div class="op-phase phase-item">
          <div class="op-phase-num">03</div>
          <div class="op-phase-title">THE DROP</div>
          <p class="op-phase-desc op-body">We don't quietly list you and hope. Every property launches through content creators — building demand and a permanent content library from week one.</p>
          <ul class="op-phase-bullets op-body">
            <li>Creator stay campaign</li>
            <li>Professional editorial shoot</li>
            <li>Listing across Airbnb, Booking.com and direct</li>
            <li>Direct booking setup — revenue that pays no platform commission</li>
          </ul>
        </div>

        <div class="op-phase phase-item">
          <div class="op-phase-num">04</div>
          <div class="op-phase-title">THE YIELD</div>
          <p class="op-phase-desc op-body">You step back. The system runs.</p>
          <ul class="op-phase-bullets op-body">
            <li>AI dynamic pricing, adjusting daily</li>
            <li>24/7 automated guest messaging</li>
            <li>Review and reputation management</li>
            <li>Payouts twice monthly, 1st and 16th</li>
          </ul>
        </div>
      </section>

      <!-- SETUP FLEX -->
      <section class="op-section">
        <h2 class="op-h2" style="margin-bottom: 24px; color: var(--outpost-bone);">SETUP FLEX</h2>
        <p class="op-body" style="margin-bottom: 32px; color: var(--outpost-dust);">You don't need it all on day one. Pay 50% of setup upfront. The balance comes out of your booking payouts across the first nine months.</p>
        <div class="op-h1" style="margin-bottom: 8px;">
          <span style="font-size: 24px; color: var(--outpost-dust); font-family: 'Inter', sans-serif;">Villa day-one cash:</span> 
          <span class="op-flex-strike">₹1,99,999</span> → ₹1,24,999
        </div>
        <p class="op-small" style="color: var(--outpost-dust);">10% convenience charge. Subject to availability and approval.</p>
      </section>

      <!-- THE MATH -->
      <section class="op-section op-math" id="the-math">
        <h2 class="op-h2" style="margin-bottom: 16px;">THE MATH</h2>
        <p class="op-body" style="margin-bottom: 24px; color: var(--outpost-bone);">A realistic projection. 3-key Villa, whole-property lets.<br>
        <span style="color: var(--outpost-dust);">Capital deployed: deposit ₹4,50,000 + franchise ₹49,999 + setup ₹1,50,000 = ₹6,49,999<br>
        Assumptions: ADR ₹9,000 · rent ₹75,000/mo · operating costs ₹30,000/mo</span></p>

        <div class="op-math-scroll">
          <table class="op-table">
            <thead>
              <tr>
                <th>Occupancy</th>
                <th>45%</th>
                <th class="highlight-col" style="color: var(--outpost-bone);">55%</th>
                <th>65%</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Monthly gross revenue</td>
                <td>₹1,21,500</td>
                <td class="highlight-col">₹1,48,500</td>
                <td>₹1,75,500</td>
              </tr>
              <tr>
                <td>Less Red Flag 13.5%</td>
                <td>₹16,403</td>
                <td class="highlight-col">₹20,048</td>
                <td>₹23,693</td>
              </tr>
              <tr>
                <td>Less rent</td>
                <td>₹75,000</td>
                <td class="highlight-col">₹75,000</td>
                <td>₹75,000</td>
              </tr>
              <tr>
                <td>Less operating</td>
                <td>₹30,000</td>
                <td class="highlight-col">₹30,000</td>
                <td>₹30,000</td>
              </tr>
              <tr>
                <td style="color: var(--outpost-bone); font-weight: 500;">Net monthly to you</td>
                <td style="color: var(--outpost-bone); font-weight: 500;">₹97</td>
                <td class="highlight-col" style="color: var(--outpost-bone); font-weight: 500;">₹23,452</td>
                <td style="color: var(--outpost-bone); font-weight: 500;">₹46,807</td>
              </tr>
              <tr>
                <td style="color: var(--outpost-dust);">Return on capital</td>
                <td style="color: var(--outpost-dust);">Breakeven</td>
                <td class="highlight-col" style="color: var(--outpost-dust);">43%</td>
                <td style="color: var(--outpost-dust);">86%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="op-math-caveats">
          <p class="op-body">Read this properly — we'd rather you understood it now than later:</p>
          <p class="op-body">Breakeven is around 45% occupancy. Below that you're cash-negative against rent.</p>
          <p class="op-body">A ten-point occupancy swing roughly doubles or halves your profit. That sensitivity is exactly why professional management matters — and why our commission is tied to your revenue.</p>
          <p class="op-body">Illustrative figures. You get a property-specific projection during assessment, before you commit.</p>
          <p class="op-body">No minimum guarantees. Performance-linked. We only earn when you earn.</p>
        </div>
      </section>

      <!-- COMPARISON -->
      <section class="op-section">
        <h2 class="op-h2" style="margin-bottom: 40px;">WHY NOT A TRADITIONAL BNB</h2>
        <table class="op-compare-table">
          <thead>
            <tr>
              <th>Example</th>
              <th>Traditional</th>
              <th>RED FLAG OUTPOST</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Entry cost</td>
              <td>₹2L – ₹50L</td>
              <td>From ₹1,28,999</td>
            </tr>
            <tr>
              <td>Staff to hire</td>
              <td>10–15 people</td>
              <td>Zero</td>
            </tr>
            <tr>
              <td>Ops experience</td>
              <td>Essential</td>
              <td>None</td>
            </tr>
            <tr>
              <td>Onboarding fee</td>
              <td>Standard</td>
              <td>Zero</td>
            </tr>
            <tr>
              <td>Ongoing commission</td>
              <td>17–20% typical</td>
              <td>13.5–15%</td>
            </tr>
            <tr>
              <td>Design</td>
              <td>Template</td>
              <td>Bespoke, brand-led</td>
            </tr>
            <tr>
              <td>Marketing</td>
              <td>Your problem</td>
              <td>Creator-led, ours</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- FORM -->
      <section class="op-section op-form" id="apply">
        <h2 class="op-h2" style="margin-bottom: 16px;">Deploy Your Capital</h2>
        <p class="op-body" style="color: var(--outpost-dust); margin-bottom: 40px;">Ready to build a hospitality portfolio? Request an allocation spot with our expansion team.</p>
        
        <form id="apply-form">
          <div class="op-field">
            <label for="app-name">Full Name</label>
            <input type="text" id="app-name" class="op-input" required>
          </div>
          <div class="op-field">
            <label for="app-email">Email Address</label>
            <input type="email" id="app-email" class="op-input" required>
          </div>
          <div class="op-field">
            <label for="app-tel">Contact Number</label>
            <input type="tel" id="app-tel" class="op-input" required>
          </div>
          <div class="op-field">
            <label for="app-city">Target City</label>
            <input type="text" id="app-city" class="op-input" required>
          </div>
          <div class="op-field">
            <label for="app-property">Do you already have a property in mind?</label>
            <select id="app-property" class="op-select" required>
              <option value="" disabled selected>Select an option...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Looking">Looking</option>
            </select>
          </div>
          <div class="op-field op-field-heavy">
            <label for="app-capital">Deployable Capital</label>
            <select id="app-capital" class="op-select" required>
              <option value="" disabled selected>Select an option...</option>
              <option value="1.5-3L">₹1.5 Lakh – ₹3 Lakh (→ Studio)</option>
              <option value="3-8L">₹3 Lakh – ₹8 Lakh (→ Villa)</option>
              <option value="8L+">₹8 Lakh+ (→ Villa multi-property / Estate track)</option>
            </select>
          </div>
          <button type="submit" class="op-btn" style="margin-top: 16px;">Apply for Allocation</button>
        </form>
      </section>

      <!-- END CTA -->
      <section class="op-section op-end">
        <h1 class="op-h1">Be part of the revolution.</h1>
        <p class="op-body">Founding Partner allocation is limited.</p>
        <a href="#apply" class="op-btn">Apply for Allocation</a>
      </section>

    </div>
  </div>
`;

const jsScript = `
    // Reduced motion flag
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Elements
    const heroName = document.getElementById('hero-name');
    const heroCharsContainer = document.getElementById('hero-chars');
    const heroLine = document.getElementById('hero-line');
    const heroShockwave = document.getElementById('hero-shockwave');
    const heroContent = document.getElementById('hero-content');
    const bgVideo = document.getElementById('op-bg-video');
    
    const text = 'RED FLAG OUTPOST';
    const midIdx = Math.floor(text.length / 2);
    
    // Create char spans
    text.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\\u00A0' : char;
      span.className = 'op-hero-name-char';
      if (char !== ' ') {
        span.dataset.dist = Math.abs(i - midIdx);
      }
      heroCharsContainer.appendChild(span);
    });

    // Hero Animation Sequence
    const runHeroSequence = () => {
      const chars = document.querySelectorAll('.op-hero-name-char[data-dist]');
      
      if (isReduced || sessionStorage.getItem('rf_outpost_seen')) {
        // Static
        heroLine.style.width = '100%';
        heroLine.style.background = 'var(--outpost-bone)';
        heroLine.style.display = 'none'; // text over it anyway
        chars.forEach(c => {
          c.style.opacity = '1';
          c.style.transform = 'scale(1)';
          c.style.filter = 'blur(0px)';
        });
        bgVideo.style.opacity = '1';
        heroContent.classList.add('is-ready');
        sessionStorage.setItem('rf_outpost_seen', 'true');
        return;
      }

      sessionStorage.setItem('rf_outpost_seen', 'true');
      
      // Sequence
      setTimeout(() => {
        heroLine.style.transition = 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1)';
        heroLine.style.width = '100%';
      }, 150);

      setTimeout(() => {
        heroLine.style.background = 'var(--outpost-bone)';
        setTimeout(() => heroLine.style.opacity = '0', 60);
        
        chars.forEach(c => {
          const dist = parseInt(c.dataset.dist, 10);
          setTimeout(() => {
            c.style.transition = 'opacity 0.5s, transform 0.5s, filter 0.5s';
            c.style.opacity = '1';
            c.style.transform = 'scale(1)';
            c.style.filter = 'blur(0px)';
          }, dist * 30);
        });
      }, 450);

      setTimeout(() => {
        heroShockwave.style.transition = 'width 0.9s, height 0.9s, opacity 0.9s, border-color 0.9s';
        heroShockwave.style.width = '140vw';
        heroShockwave.style.height = '140vw';
        heroShockwave.style.opacity = '1';
        heroShockwave.style.borderColor = 'transparent';
      }, 500);

      setTimeout(() => {
        bgVideo.style.transition = 'opacity 1.1s ease-out';
        bgVideo.style.opacity = '1';
      }, 700);

      setTimeout(() => {
        heroContent.classList.add('is-ready');
      }, 1200);
    };

    // Dust particles
    const generateDust = () => {
      if (isReduced) return;
      const count = window.innerWidth < 768 ? 14 : 30;
      const container = document.getElementById('op-dust-container');
      for(let i = 0; i < count; i++) {
        const d = document.createElement('div');
        d.className = 'op-dust';
        d.style.left = (Math.random() * 100) + 'vw';
        d.style.top = (Math.random() * 100) + 'vh';
        const size = (Math.random() * 1 + 1);
        d.style.width = size + 'px';
        d.style.height = size + 'px';
        d.style.opacity = Math.random() * 0.12 + 0.06;
        
        // CSS Animation for drift
        const dx = (Math.random() - 0.5) * 50;
        d.animate([
          { transform: 'translate3d(0, 0, 0)' },
          { transform: 'translate3d(' + dx + 'px, 150px, 0)' }
        ], {
          duration: 20000 + Math.random() * 20000,
          iterations: Infinity,
          direction: 'alternate',
          easing: 'ease-in-out'
        });
        
        container.appendChild(d);
      }
    };

    // Stat Counter
    const runStatCounter = () => {
      const el = document.getElementById('stat-target');
      if (!el || isReduced) return;
      
      const target = 148500;
      const start = 75000;
      const duration = 1100;
      const startTime = performance.now();
      
      const formatCurrency = (val) => '₹' + Math.round(val).toLocaleString('en-IN');
      
      const easeOut = t => t * (2 - t);
      
      const update = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = start + (target - start) * easeOut(progress);
        el.textContent = formatCurrency(current);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = formatCurrency(target);
      };
      requestAnimationFrame(update);
    };

    // Single intersection observer
    const sections = document.querySelectorAll('.op-section, .op-phase');
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          
          if (entry.target.classList.contains('op-stat-bar')) {
            runStatCounter();
          }
          if (entry.target.id === 'exec-map') {
            const phases = entry.target.querySelectorAll('.op-phase');
            phases.forEach((p, i) => {
              setTimeout(() => {
                p.classList.add('is-revealed');
                const fill = document.getElementById('map-line-fill');
                if (fill) {
                   const h = ((i + 1) / phases.length) * 100;
                   fill.style.height = h + '%';
                }
              }, 120 * i);
            });
          }
          
          entry.target.addEventListener('transitionend', () => {
            entry.target.style.willChange = 'auto';
          });
          
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -12% 0px" });

    sections.forEach(s => {
      // Map phases are handled via parent
      if (!s.classList.contains('op-phase')) {
        observer.observe(s);
      }
    });
    
    // Fog and Parallax rAF loop
    let lastScroll = window.scrollY;
    let ticking = false;
    let idleTimeout = null;
    let time = 0;
    
    const fog = document.getElementById('op-bg-fog');
    const bgVid = document.getElementById('op-bg-video');
    const fgParallax = document.querySelector('.op-parallax-fg');
    
    const isMobile = window.innerWidth < 768;

    const rAFLoop = () => {
      time += 0.016; // rough 60fps delta
      
      // Fog drift (sine wave) - disabled on mobile
      if (!isMobile && !isReduced) {
        const driftX = Math.sin(time * 0.15) * 30; // 40s loop roughly
        const driftY = Math.cos(time * 0.15) * 30;
        fog.style.transform = 'translate3d(' + driftX + 'px, ' + driftY + 'px, 0)';
      }

      // Parallax
      if (!isReduced) {
        const s = window.scrollY;
        // background translates at 0.85x scroll speed, so offset is scroll * 0.15
        const offset = s * 0.15;
        bgVid.style.transform = 'translate3d(0, ' + offset + 'px, 0)';
        // foreground is 1.0x so no offset needed here, native scroll does it
      }

      if (ticking) {
        requestAnimationFrame(rAFLoop);
      }
    };

    window.addEventListener('scroll', () => {
      if (!ticking && document.visibilityState === 'visible') {
        ticking = true;
        requestAnimationFrame(rAFLoop);
      }
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        ticking = false;
      }, 150);
    }, { passive: true });
    
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        ticking = false;
      }
    });

    // Form Submit
    document.getElementById('apply-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('app-name').value;
      const email = document.getElementById('app-email').value;
      const tel = document.getElementById('app-tel').value;
      const city = document.getElementById('app-city').value;
      const capital = document.getElementById('app-capital').value;
      const prop = document.getElementById('app-property').value;
      const msg = "NEW FRANCHISE APPLICATION:\\nName: " + name + "\\nEmail: " + email + "\\nContact: " + tel + "\\nTarget City: " + city + "\\nDeployable Capital: " + capital + "\\nProperty in mind: " + prop;
      const whatsappUrl = 'https://wa.me/918881306632?text=' + encodeURIComponent(msg);
      window.open(whatsappUrl, '_blank');
    });

    // Init
    runHeroSequence();
    generateDust();
    
    // Initial start of rAF if needed for fog drift
    if (!isReduced && !isMobile) {
      ticking = true;
      requestAnimationFrame(rAFLoop);
    }
`;

const finalHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Red Flag Outpost</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Michroma&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
${css}
  </style>
</head>
<body>
${htmlBody}
  <script>
${jsScript}
  </script>
</body>
</html>`;

fs.writeFileSync('franchise.html', finalHTML);
