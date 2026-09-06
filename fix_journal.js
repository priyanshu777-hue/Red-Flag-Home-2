const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');

let html = indexHtml;

// 1. Remove .journal-* css and #journal css
html = html.replace(/\/\* Journal Section \*\/[\s\S]*?\/\* Contact Section \*\//, '/* Article Card Section */\n    /* CONTACT SECTION CSS WILL FOLLOW */\n    /* Contact Section */');

// Remove journal media queries
html = html.replace(/#franchise, #contact, #book, #block4 \{ padding: 4rem 1.5rem !important; \}/, '#franchise, #contact, #book, #block4 { padding: 4rem 1.5rem !important; }');
html = html.replace(/#journal, #franchise, #contact, #book, #block4 \{ padding: 4rem 1.5rem !important; \}/, '#franchise, #contact, #book, #block4 { padding: 4rem 1.5rem !important; }');
html = html.replace(/#block3, #block4, #book, #franchise, #journal, \.journal-container \{/g, '#block3, #block4, #book, #franchise {');
html = html.replace(/\.journal-container \{ gap: 2rem !important; \}/g, '');
html = html.replace(/\.journal-img-wrap \{[\s\S]*?aspect-ratio: 16\/9 !important;[\s\S]*?\}/g, '');

// The css replacement (it will be injected in <style>)
const acCss = `
/* ── Section ─────────────────────────────────────────────────────── */
.ac-section {
  padding: 80px 30px;
  background: var(--background);
}

.ac-section-title {
  font-family: var(--typeface-display);
  font-size: clamp(28px, 5vw, 56px);
  line-height: 1.1;
  color: var(--foreground-accent);
  text-align: center;
  margin-bottom: 48px;
}

.ac-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.ac-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 384px;
  margin: 0 auto;
  overflow: hidden;
  padding: 12px;
  border-radius: 24px;
  border: 1px solid rgba(242, 228, 225, 0.1);
  background: var(--surface-gallery);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
  transition: transform 0.25s ease, border-color 0.25s ease;
}

.ac-card:hover {
  transform: translateY(-4px);
  border-color: rgba(242, 228, 225, 0.22);
}

.ac-card-header { padding: 0; }

.ac-cover {
  position: relative;
  width: 100%;
  height: 224px;
  border-radius: 16px;
  overflow: hidden;
}

.ac-cover img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ac-card-content {
  flex-grow: 1;
  padding: 12px;
}

.ac-meta {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--foreground-accent-muted);
}

.ac-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(242, 228, 225, 0.08);
  font-size: 14px;
  color: var(--foreground-accent-muted);
  transition: color 0.2s ease, background 0.2s ease;
}

.ac-card:hover .ac-badge {
  background: rgba(242, 228, 225, 0.16);
  color: var(--foreground-accent);
}

.ac-dot { margin: 0 8px; }

.ac-headline {
  margin-bottom: 8px;
  font-family: var(--typeface-display);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--foreground-accent);
}

.ac-excerpt {
  font-size: 15px;
  line-height: 1.5;
  color: var(--foreground-accent-muted);
}

.ac-excerpt[style*="--clamp"] {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--clamp);
  overflow: hidden;
  text-overflow: ellipsis;
}

.ac-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
}

.ac-published:only-child { margin-left: auto; text-align: right; }

.ac-label {
  font-size: 14px;
  color: var(--foreground-accent-muted);
}

.ac-value {
  font-weight: 600;
  color: var(--foreground-accent-muted);
}

.ac-published { text-align: right; }

@media (max-width: 1024px) {
  .ac-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
}

@media (max-width: 768px) {
  .ac-section { padding: 56px 20px; }
  .ac-section-title { margin-bottom: 32px; }
  .ac-grid { grid-template-columns: 1fr; gap: 20px; }
  .ac-cover { height: 180px; }
  .ac-headline { font-size: 20px; }
  .ac-excerpt { font-size: 14px; }
  .ac-meta, .ac-label, .ac-value { font-size: 13px; }
}

@media (max-width: 420px) {
  .ac-cover { height: 160px; }
  .ac-card-footer { gap: 12px; }
}

@media (prefers-reduced-motion: reduce) {
  .ac-card { transition: none; }
  .ac-card:hover { transform: none; }
}
`;

html = html.replace('/* Article Card Section */', '/* Article Card Section */\n' + acCss);

// 2. Replace HTML
const oldHtmlMatch = html.match(/<section id="journal">[\s\S]*?<\/section>/);
const newHtml = `
<section id="journal" class="ac-section">
  <h2 class="ac-section-title">Explore</h2>
  <div class="ac-grid" id="ac-grid">
    <!-- cards injected here -->
  </div>
</section>
`;

if (oldHtmlMatch) {
  html = html.replace(oldHtmlMatch[0], newHtml.trim());
}

// 3. Inject JS
const jsCode = `
const articles = [
  {
    headline: "Designing the Perfect Alpine Retreat",
    excerpt: "Discover how we blend local materials with modern minimalism.",
    cover: "https://cdn.jsdelivr.net/gh/priyanshu777-hue/Red-Flag-Home-@main/handpicked.jpeg",
    tag: "Design",
    readingTime: 420,
    writer: "Red Flag Homes",
    publishedAt: new Date("2026-10-12"),
    clampLines: 3,
  },
  {
    headline: "The Future of AI-Managed Hospitality",
    excerpt: "How automation is redefining the guest experience, from check-in to check-out.",
    cover: "https://cdn.jsdelivr.net/gh/priyanshu777-hue/Red-Flag-Home-@main/cleaning.jpeg",
    tag: "Operations",
    readingTime: 300,
    writer: "Red Flag Homes",
    publishedAt: new Date("2026-09-28"),
    clampLines: 3,
  },
  {
    headline: "What Makes a Home Worth Remembering",
    excerpt: "The small decisions that turn a place to sleep into somewhere guests talk about.",
    cover: "https://cdn.jsdelivr.net/gh/priyanshu777-hue/Red-Flag-Home-@main/guest.jpeg",
    tag: "Hosting",
    readingTime: 360,
    writer: "Red Flag Homes",
    publishedAt: new Date("2026-09-14"),
    clampLines: 3,
  },
];

function formatReadTime(seconds) {
  if (!seconds || seconds < 60) return "Less than 1 min read";
  const minutes = Math.ceil(seconds / 60);
  return \`\${minutes} min read\`;
}

function formatPostDate(date) {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderArticleCard(a) {
  const hasMeta = a.tag || a.readingTime;
  const hasFooter = a.writer || a.publishedAt;

  const card = document.createElement("article");
  card.className = "ac-card";

  if (a.cover) {
    const header = document.createElement("header");
    header.className = "ac-card-header";
    const wrap = document.createElement("div");
    wrap.className = "ac-cover";
    const img = document.createElement("img");
    img.src = a.cover;
    img.alt = a.headline;
    img.loading = "lazy";
    img.decoding = "async";
    wrap.appendChild(img);
    header.appendChild(wrap);
    card.appendChild(header);
  }

  const content = document.createElement("div");
  content.className = "ac-card-content";

  if (hasMeta) {
    const meta = document.createElement("div");
    meta.className = "ac-meta";

    if (a.tag) {
      const badge = document.createElement("span");
      badge.className = "ac-badge";
      badge.textContent = a.tag;
      meta.appendChild(badge);
    }

    if (a.tag && a.readingTime) {
      const dot = document.createElement("span");
      dot.className = "ac-dot";
      dot.textContent = "•";
      meta.appendChild(dot);
    }

    if (a.readingTime) {
      const rt = document.createElement("span");
      rt.className = "ac-readtime";
      rt.textContent = formatReadTime(a.readingTime);
      meta.appendChild(rt);
    }

    content.appendChild(meta);
  }

  const h = document.createElement("h3");
  h.className = "ac-headline";
  h.textContent = a.headline;
  content.appendChild(h);

  const p = document.createElement("p");
  p.className = "ac-excerpt";
  if (a.clampLines && a.clampLines > 0) {
    p.style.setProperty("--clamp", a.clampLines);
  }
  p.textContent = a.excerpt;
  content.appendChild(p);

  card.appendChild(content);

  if (hasFooter) {
    const footer = document.createElement("footer");
    footer.className = "ac-card-footer";

    if (a.writer) {
      const by = document.createElement("div");
      by.className = "ac-by";
      by.innerHTML = "";
      const l = document.createElement("p");
      l.className = "ac-label";
      l.textContent = "By";
      const v = document.createElement("p");
      v.className = "ac-value";
      v.textContent = a.writer;
      by.append(l, v);
      footer.appendChild(by);
    }

    if (a.publishedAt) {
      const pub = document.createElement("div");
      pub.className = "ac-published";
      const l = document.createElement("p");
      l.className = "ac-label";
      l.textContent = "Published";
      const v = document.createElement("p");
      v.className = "ac-value";
      v.textContent = formatPostDate(a.publishedAt);
      pub.append(l, v);
      footer.appendChild(pub);
    }

    card.appendChild(footer);
  }

  return card;
}

function renderExplore() {
  const grid = document.getElementById("ac-grid");
  if (!grid) return;
  grid.innerHTML = "";
  articles.forEach((a) => grid.appendChild(renderArticleCard(a)));
}

// Ensure this runs when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  renderExplore();
});
`;

html = html.replace('</script>', jsCode + '\n</script>');

fs.writeFileSync('index.html', html);
console.log('Done!');
