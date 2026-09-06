const fs = require('fs');

let html = fs.readFileSync('franchise.html', 'utf8');

// The new video URL
const NEW_URL = "https://cdn.jsdelivr.net/gh/priyanshu777-hue/Red-Flag-Home-@main/franchiseoutpost.mp4";

// Replace global-bg-video with scene-video and scene-canvas (with fixed positioning)
const videoElements = `
  <video id="scene-video" src="${NEW_URL}" muted playsinline preload="auto" style="position: fixed; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1; pointer-events: none;"></video>
  <canvas id="scene-canvas" width="1920" height="1080" style="position: fixed; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1; pointer-events: none; opacity: 0; transition: opacity 0.5s;"></canvas>
`;

html = html.replace(/<video id="global-bg-video"[^>]*><\/video>/, videoElements);

// Replace mobile CSS for global-bg-video with scene-video and scene-canvas
html = html.replace(/#global-bg-video \{ display: none !important; \}/, '#scene-video, #scene-canvas { display: none !important; }');

// We need to inject the script right before </body>
const scriptBlock = `
<script>
(function() {
  const container = document.getElementById('scene-outer');
  const video = document.getElementById('scene-video');
  const canvas = document.getElementById('scene-canvas');
  const nav = document.getElementById('scene-nav');
  const sec1 = document.getElementById('sec1');
  const sec2 = document.getElementById('sec2');
  const sec3 = document.getElementById('sec3');
  
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
  
  let p = 0;
  
  function updateScroll() {
    const rect = container.getBoundingClientRect();
    const totalScroll = container.offsetHeight - window.innerHeight;
    const currentScroll = -rect.top;
    p = Math.max(0, Math.min(1, currentScroll / totalScroll));
    
    // Original opacity curves
    if (nav) {
      if (p > 0.05) nav.classList.add('is-hidden');
      else nav.classList.remove('is-hidden');
    }
    
    if (sec1 && sec2 && sec3) {
      if (p < 0.25) {
        sec1.style.opacity = 1; sec1.style.pointerEvents = 'auto';
        sec2.style.opacity = 0; sec2.style.pointerEvents = 'none';
        sec3.style.opacity = 0; sec3.style.pointerEvents = 'none';
      } else if (p < 0.55) {
        sec1.style.opacity = 0; sec1.style.pointerEvents = 'none';
        sec2.style.opacity = 1; sec2.style.pointerEvents = 'auto';
        sec3.style.opacity = 0; sec3.style.pointerEvents = 'none';
      } else {
        sec1.style.opacity = 0; sec1.style.pointerEvents = 'none';
        sec2.style.opacity = 0; sec2.style.pointerEvents = 'none';
        sec3.style.opacity = 1; sec3.style.pointerEvents = 'auto';
      }
    }
  }
  
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', updateScroll);
  updateScroll();
  
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
          const ts = frame.timestamp; 
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
             ready = true;
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
            const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
            if (box.avcC) box.avcC.write(stream);
            else if (box.hvcC) box.hvcC.write(stream);
            else if (box.vpcC) box.vpcC.write(stream);
            else if (box.av1C) box.av1C.write(stream);
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
           if (decoder.state === 'closed') return;
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

// Insert before closing body tag if it doesn't already exist
if (!html.includes('id="scene-canvas"')) {
  html = html.replace('</body>', scriptBlock + '\n</body>');
  fs.writeFileSync('franchise.html', html);
  console.log('Injected scrub block and updated URLs.');
} else {
  // If scene-canvas is there, just replace the URL
  html = html.replace(/src="[^"]+"(.*?id="scene-video"| id="scene-video".*?src=")[^"]+"/, `src="${NEW_URL}"$1${NEW_URL}"`);
  console.log('Replaced URLs.');
}
