import re

with open('index.html', 'r') as f:
    content = f.read()

b2_replacement = """  <div id="b2-header" class="display">A Look Inside</div>

  <div id="b2-scene-container" style="position: absolute; inset: 0;">
    <div class="polaroid-pos b2-card" data-id="iceland" data-z="7" style="left: calc(982.59 / 14.4 * 1cqw); top: calc(370.28 / 14.4 * 1cqw); width: calc(212.092 / 14.4 * 1cqw); z-index: 7;">
      <div class="polaroid-inner"><img src="https://storage.getlayers.ai/assets/wanderlust-555800a518/Block2/Iceland.png" alt="A polaroid of Iceland" class="polaroid-img" loading="lazy" /></div>
    </div>
    <div class="polaroid-pos b2-card" data-id="norway" data-z="11" style="left: calc(311.23 / 14.4 * 1cqw); top: calc(116.27 / 14.4 * 1cqw); width: calc(177.669 / 14.4 * 1cqw); z-index: 11;">
      <div class="polaroid-inner"><img src="https://storage.getlayers.ai/assets/wanderlust-555800a518/Block2/Norway.png" alt="A polaroid of Norway" class="polaroid-img" loading="lazy" /></div>
    </div>
    <div class="polaroid-pos b2-card" data-id="japan" data-z="15" style="left: calc(441.86 / 14.4 * 1cqw); top: calc(352.08 / 14.4 * 1cqw); width: calc(193.726 / 14.4 * 1cqw); z-index: 15;">
      <div class="polaroid-inner"><img src="https://storage.getlayers.ai/assets/wanderlust-555800a518/Block2/Japan.png" alt="A polaroid of Japan" class="polaroid-img" loading="lazy" /></div>
    </div>
    <div class="polaroid-pos b2-card" data-id="morocco" data-z="16" style="left: calc(381.73 / 14.4 * 1cqw); top: calc(551.64 / 14.4 * 1cqw); width: calc(191.631 / 14.4 * 1cqw); z-index: 16;">
      <div class="polaroid-inner"><img src="https://storage.getlayers.ai/assets/wanderlust-555800a518/Block2/Morocco.png" alt="A polaroid of Morocco" class="polaroid-img" loading="lazy" /></div>
    </div>
  </div>"""

pattern = re.compile(r'<div id="b2-header".*?</div>.*?<div id="b2-list-left">.*?</script>', re.DOTALL)
# wait, it's before section 3.
pattern = re.compile(r'<div id="b2-header".*?</div>\s*<div id="b2-list-left">.*?</section>', re.DOTALL)

if pattern.search(content):
    new_content = pattern.sub(b2_replacement + "\n</section>", content)
    with open('index.html', 'w') as f:
        f.write(new_content)
    print("Replaced successfully")
else:
    print("Pattern not found again")
