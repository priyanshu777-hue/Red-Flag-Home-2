// PWA Registration, Offline Connectivity & Install Prompt System
(function () {
  'use strict';

  // 1. Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(function (reg) {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);

          reg.addEventListener('updatefound', function () {
            var installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', function () {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New content available; please refresh.');
                }
              });
            }
          });
        })
        .catch(function (err) {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  // 2. Connectivity Offline Indicator
  var offlineToast = null;
  function updateOnlineStatus() {
    var isOnline = navigator.onLine;
    if (!isOnline) {
      if (!offlineToast) {
        offlineToast = document.createElement('div');
        offlineToast.id = 'pwa-offline-indicator';
        offlineToast.setAttribute('role', 'status');
        offlineToast.setAttribute('aria-live', 'polite');
        offlineToast.innerHTML =
          '<span class="pwa-dot"></span><span>Offline Mode &mdash; Core assets cached</span>';
        document.body.appendChild(offlineToast);
      }
      offlineToast.classList.add('visible');
    } else if (offlineToast) {
      offlineToast.classList.remove('visible');
    }
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  if (!navigator.onLine) {
    setTimeout(updateOnlineStatus, 1000);
  }

  // 3. In-App Install Prompt Flow
  var deferredPrompt = null;
  var isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone) {
    return; // Already running installed
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButtons();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    hideInstallButtons();
    console.log('[PWA] Application successfully installed.');
  });

  function showInstallButtons() {
    document.querySelectorAll('.pwa-install-trigger').forEach(function (btn) {
      btn.style.display = 'inline-flex';
    });
  }

  function hideInstallButtons() {
    document.querySelectorAll('.pwa-install-trigger').forEach(function (btn) {
      btn.style.display = 'none';
    });
  }

  // Global trigger handler for any install button in the DOM
  document.addEventListener('click', function (e) {
    var target = e.target.closest('.pwa-install-trigger');
    if (!target) return;

    e.preventDefault();

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (choiceResult) {
        if (choiceResult.outcome === 'accepted') {
          hideInstallButtons();
        }
        deferredPrompt = null;
      });
    } else {
      // Fallback guide for iOS or browsers without native prompt
      var isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
      showInstallGuide(isIOS);
    }
  });

  function showInstallGuide(isIOS) {
    var existingModal = document.getElementById('pwa-guide-modal');
    if (existingModal) existingModal.remove();

    var modal = document.createElement('div');
    modal.id = 'pwa-guide-modal';
    modal.innerHTML =
      '<div class="pwa-guide-backdrop"></div>' +
      '<div class="pwa-guide-box" role="dialog" aria-modal="true" aria-labelledby="pwa-guide-title">' +
        '<div class="pwa-guide-header">' +
          '<h3 id="pwa-guide-title">Install Red Flag Homes</h3>' +
          '<button type="button" class="pwa-guide-close" aria-label="Close dialog">&times;</button>' +
        '</div>' +
        '<div class="pwa-guide-body">' +
          (isIOS
            ? '<p>To install on iPhone or iPad:</p><ol><li>Tap the <strong>Share</strong> button in Safari’s toolbar.</li><li>Scroll down and tap <strong>Add to Home Screen</strong>.</li><li>Confirm with <strong>Add</strong> in the top right.</li></ol>'
            : '<p>To install Red Flag Homes:</p><ol><li>Tap your browser menu (<strong>&vellip;</strong>).</li><li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li></ol>') +
        '</div>' +
        '<button type="button" class="pwa-guide-btn">Got it</button>' +
      '</div>';

    document.body.appendChild(modal);

    function closeModal() {
      modal.remove();
    }

    modal.querySelector('.pwa-guide-close').addEventListener('click', closeModal);
    modal.querySelector('.pwa-guide-btn').addEventListener('click', closeModal);
    modal.querySelector('.pwa-guide-backdrop').addEventListener('click', closeModal);
  }
})();
