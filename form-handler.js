/**
 * Red Flag Homes Network - Unified Form Handler
 * Connects website forms to Google Apps Script endpoint with WhatsApp fallback.
 */

(function () {
  'use strict';

  var APPS_SCRIPT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbws9G3Mo84mB3A-pGxnpeeqs-ONEmW7rhmWHP7KiLM8-u93mPVpsc5RKbPEcGruY6aHCg/exec';
  var WHATSAPP_PHONE = '918881306632';

  /**
   * One shared helper used by every form.
   * Sends a POST with JSON.stringify(data) as the body and sets NO Content-Type header
   * (to avoid CORS preflight options which Google Apps Script cannot answer).
   * Every form also sends `page` and the current `rf_market` value.
   * 10-second timeout.
   */
  async function submitToAppsScript(data) {
    var rfMarket = localStorage.getItem('rf_market') || 'IN';
    var page = window.location.pathname || '/';

    var payload = Object.assign({}, data, {
      page: page,
      rf_market: rfMarket
    });

    var controller = new AbortController();
    var timeoutId = setTimeout(function () {
      controller.abort();
    }, 10000);

    try {
      // NOTE: Do not set any Content-Type header to avoid CORS preflight
      var response = await fetch(APPS_SCRIPT_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return { ok: false, error: 'HTTP error ' + response.status };
      }

      var json = await response.json();
      if (json && json.ok === true) {
        return { ok: true, data: json };
      }
      return { ok: false, error: (json && json.error) || 'Response not ok' };
    } catch (err) {
      clearTimeout(timeoutId);
      var errorMsg = err.name === 'AbortError' ? 'Request timed out' : (err.message || 'Network error');
      return { ok: false, error: errorMsg };
    }
  }

  /**
   * Builds pre-filled WhatsApp text for the fallback
   */
  function buildWhatsAppText(data) {
    var text = 'Hi Red Flag,\n';
    if (data.formType === 'newsletter') {
      text += 'I would like to subscribe to the newsletter:\n' +
              '• Email: ' + (data.email || '') + '\n' +
              '• Source: ' + (data.source || 'website');
    } else if (data.formType === 'franchise') {
      text += 'I would like to submit my franchise allocation request:\n' +
              '• Full Name: ' + (data.name || '') + '\n' +
              '• Email: ' + (data.email || '') + '\n' +
              '• Contact Number: ' + (data.phone || '') + '\n' +
              '• Target City: ' + (data.city || '') + '\n' +
              '• Deployable Capital: ' + (data.capital || '') + '\n' +
              '• Property in Mind: ' + (data.property || '') + '\n' +
              '• Existing Client: ' + (data.existing || '');
    } else if (data.formType === 'contact') {
      text += 'I would like to submit an inquiry:\n' +
              '• Name: ' + (data.name || '') + '\n' +
              '• Email: ' + (data.email || '') + '\n' +
              '• Phone: ' + (data.phone || '') + '\n' +
              '• I want to: ' + (data.intent || '') + '\n' +
              '• Message: ' + (data.message || '');
    } else {
      text += 'Details:\n' + Object.keys(data)
        .filter(function (k) { return ['page', 'rf_market', 'company', 'formType'].indexOf(k) === -1; })
        .map(function (k) { return '• ' + k + ': ' + data[k]; })
        .join('\n');
    }
    return text.trim();
  }

  /**
   * Triggers the WhatsApp fallback when submission fails, times out, or reply is not ok: true
   */
  function handleWhatsAppFallback(data, statusEl, btnEl, originalBtnContent) {
    var fallbackMsg = "We couldn't submit that — continuing on WhatsApp";

    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.textContent = fallbackMsg;
      statusEl.style.color = '#ef4444';
    }

    if (typeof window.showToast === 'function') {
      window.showToast({
        title: 'Notice',
        message: fallbackMsg,
        type: 'warning',
        duration: 5000
      });
    }

    if (btnEl && originalBtnContent !== undefined) {
      btnEl.disabled = false;
      btnEl.innerHTML = originalBtnContent;
    }

    var waText = buildWhatsAppText(data);
    var waUrl = 'https://wa.me/' + WHATSAPP_PHONE + '?text=' + encodeURIComponent(waText);

    try {
      var opened = window.open(waUrl, '_blank');
      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        window.location.href = waUrl;
      }
    } catch (e) {
      window.location.href = waUrl;
    }
  }

  /**
   * Setup Footer Newsletter Form
   */
  function initFooterNewsletter() {
    var footerForm = document.getElementById('footer-newsletter-form');
    var footerSuccess = document.getElementById('ft-news-success');
    var submitBtn = document.getElementById('newsletter-btn') || (footerForm ? footerForm.querySelector('button[type="submit"]') : null);

    if (!footerForm || !submitBtn) return;

    footerForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var emailInput = footerForm.querySelector('input[type="email"]');
      var companyInput = footerForm.querySelector('input[name="company"]');
      var email = emailInput ? emailInput.value.trim() : '';
      var company = companyInput ? companyInput.value : '';

      if (!email) return;

      var originalBtnContent = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      if (footerSuccess) {
        footerSuccess.style.display = 'none';
        footerSuccess.textContent = '';
      }

      var payload = {
        formType: 'newsletter',
        email: email,
        source: 'footer',
        company: company
      };

      var result = await submitToAppsScript(payload);

      if (result.ok === true) {
        if (footerSuccess) {
          footerSuccess.textContent = "You're on the list — check your inbox.";
          footerSuccess.style.color = 'var(--raw-color-velvet-500, #A31621)';
          footerSuccess.style.display = 'block';
        }
        if (typeof window.showToast === 'function') {
          window.showToast({
            title: 'Subscribed',
            message: "You're on the list — check your inbox.",
            type: 'success',
            duration: 4000
          });
        }
        if (emailInput) emailInput.value = '';
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
      } else {
        handleWhatsAppFallback(payload, footerSuccess, submitBtn, originalBtnContent);
      }
    });
  }

  /**
   * Setup Inner Circle Pop-up Form
   */
  function initPopupNewsletter() {
    var modal = document.getElementById('newsletter-modal');
    var popupForm = document.getElementById('nl-form');
    var popupSuccess = document.getElementById('nl-success');
    var submitBtn = popupForm ? popupForm.querySelector('.nl-submit, button[type="submit"]') : null;

    if (!popupForm || !submitBtn) return;

    popupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var emailInput = popupForm.querySelector('input[type="email"]');
      var companyInput = popupForm.querySelector('input[name="company"]');
      var email = emailInput ? emailInput.value.trim() : '';
      var company = companyInput ? companyInput.value : '';

      if (!email) return;

      var originalBtnContent = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      if (popupSuccess) {
        popupSuccess.style.display = 'none';
        popupSuccess.textContent = '';
      }

      var payload = {
        formType: 'newsletter',
        email: email,
        source: 'popup',
        company: company
      };

      var result = await submitToAppsScript(payload);

      if (result.ok === true) {
        if (popupSuccess) {
          popupSuccess.textContent = "You're on the list — check your inbox.";
          popupSuccess.style.color = 'var(--foreground-accent, #fff)';
          popupSuccess.style.display = 'block';
        }
        if (typeof window.showToast === 'function') {
          window.showToast({
            title: 'Subscribed',
            message: "You're on the list — check your inbox.",
            type: 'success',
            duration: 4000
          });
        }
        if (emailInput) emailInput.value = '';
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;

        // Auto close popup after brief delay
        setTimeout(function () {
          if (modal) {
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
          }
        }, 2500);
      } else {
        handleWhatsAppFallback(payload, popupSuccess, submitBtn, originalBtnContent);
      }
    });
  }

  /**
   * Setup Contact Form
   */
  function initContactForm() {
    var contactForm = document.getElementById('contact-form');
    var submitBtn = document.getElementById('contact-submit-btn');
    var statusEl = document.getElementById('contact-status');

    if (!contactForm || !submitBtn) return;

    // Create status element if it doesn't already exist
    if (!statusEl) {
      statusEl = document.createElement('p');
      statusEl.id = 'contact-status';
      statusEl.style.display = 'none';
      statusEl.style.marginTop = '1rem';
      statusEl.style.fontSize = '0.95rem';
      statusEl.style.textAlign = 'center';
      statusEl.style.fontFamily = 'var(--typeface-ui, sans-serif)';
      contactForm.appendChild(statusEl);
    }

    async function handleContactSubmit() {
      var nameEl = document.getElementById('contact-name');
      var phoneEl = document.getElementById('contact-phone');
      var emailEl = document.getElementById('contact-email');
      var intentEl = document.getElementById('contact-intent');
      var messageEl = document.getElementById('contact-message');
      var companyEl = contactForm.querySelector('input[name="company"]');

      var name = nameEl ? nameEl.value.trim() : '';
      var phone = phoneEl ? phoneEl.value.trim() : '';
      var email = emailEl ? emailEl.value.trim() : '';
      var intent = intentEl ? intentEl.value : 'General Inquiry';
      var message = messageEl ? messageEl.value.trim() : '';
      var company = companyEl ? companyEl.value : '';

      if (!name && !email && !message && !phone) {
        if (typeof window.showToast === 'function') {
          window.showToast({
            title: 'Missing Details',
            message: 'Please provide your name, contact information, or a message.',
            type: 'warning',
            duration: 3000
          });
        }
        return;
      }

      var originalBtnContent = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      if (statusEl) {
        statusEl.style.display = 'none';
        statusEl.textContent = '';
      }

      var payload = {
        formType: 'contact',
        name: name,
        email: email,
        phone: phone,
        intent: intent,
        message: message,
        company: company
      };

      var result = await submitToAppsScript(payload);

      if (result.ok === true) {
        if (statusEl) {
          statusEl.textContent = 'Your inquiry has been received. Our team will contact you shortly.';
          statusEl.style.color = '#10b981';
          statusEl.style.display = 'block';
        }
        if (typeof window.showToast === 'function') {
          window.showToast({
            title: 'Inquiry Sent',
            message: 'Your inquiry has been received. Our team will contact you shortly.',
            type: 'success',
            duration: 4000
          });
        }
        contactForm.reset();
        submitBtn.textContent = 'Inquiry Sent ✓';
        setTimeout(function () {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnContent;
        }, 3000);
      } else {
        // Fallback: Never show success or false received messages!
        handleWhatsAppFallback(payload, statusEl, submitBtn, originalBtnContent);
      }
    }

    submitBtn.addEventListener('click', handleContactSubmit);
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      handleContactSubmit();
    });
  }

  /**
   * Setup Franchise Form (franchise.html)
   */
  function initFranchiseForm() {
    var formEl = document.getElementById('applyForm');
    if (!formEl) return;

    var submitBtn = formEl.querySelector('button[type="submit"]');
    var statusEl = document.getElementById('apply-status');

    if (!statusEl) {
      statusEl = document.createElement('p');
      statusEl.id = 'apply-status';
      statusEl.style.display = 'none';
      statusEl.style.marginTop = '1.25rem';
      statusEl.style.fontSize = '0.95rem';
      statusEl.style.lineHeight = '1.5';
      statusEl.style.fontFamily = 'var(--typeface-ui, sans-serif)';
      formEl.appendChild(statusEl);
    }

    formEl.addEventListener('submit', async function (e) {
      e.preventDefault();

      var nameInput = document.getElementById('f-name') || formEl.querySelector('[name="name"]');
      var emailInput = document.getElementById('f-email') || formEl.querySelector('[name="email"]');
      var phoneInput = document.getElementById('f-phone') || formEl.querySelector('[name="phone"]');
      var cityInput = document.getElementById('f-city') || formEl.querySelector('[name="city"]');
      var capSelect = document.getElementById('f-cap') || formEl.querySelector('[name="capital"]');
      var propSelect = document.getElementById('f-prop') || formEl.querySelector('[name="property"]');
      var clientSelect = document.getElementById('f-client') || formEl.querySelector('[name="client"]');
      var companyInput = formEl.querySelector('[name="company"]');

      var name = nameInput ? nameInput.value.trim() : '';
      var email = emailInput ? emailInput.value.trim() : '';
      var phone = phoneInput ? phoneInput.value.trim() : '';
      var city = cityInput ? cityInput.value.trim() : '';
      var capital = capSelect ? capSelect.value : '';
      var property = propSelect ? propSelect.value : '';
      var existing = clientSelect ? clientSelect.value : '';
      var company = companyInput ? companyInput.value : '';

      var originalBtnContent = submitBtn ? submitBtn.innerHTML : 'Request allocation';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      if (statusEl) {
        statusEl.style.display = 'none';
        statusEl.textContent = '';
      }

      var payload = {
        formType: 'franchise',
        name: name,
        email: email,
        phone: phone,
        city: city,
        capital: capital,
        property: property,
        existing: existing,
        company: company
      };

      var result = await submitToAppsScript(payload);

      if (result.ok === true) {
        var successMessage = 'Allocation request received! A confirmation email is on its way to your inbox.';
        if (statusEl) {
          statusEl.textContent = successMessage;
          statusEl.style.color = '#10b981';
          statusEl.style.display = 'block';
        }
        if (typeof window.showToast === 'function') {
          window.showToast({
            title: 'Allocation Request Received',
            message: 'Allocation request confirmed. A confirmation email is on its way.',
            type: 'success',
            duration: 5000
          });
        }
        formEl.reset();
        if (submitBtn) {
          submitBtn.textContent = 'Request Sent ✓';
          setTimeout(function () {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnContent;
          }, 3000);
        }
      } else {
        handleWhatsAppFallback(payload, statusEl, submitBtn, originalBtnContent);
      }
    });
  }

  // Initialize forms when DOM is ready
  function initAll() {
    initFooterNewsletter();
    initPopupNewsletter();
    initContactForm();
    initFranchiseForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Expose helpers globally
  window.submitToAppsScript = submitToAppsScript;
  window.handleWhatsAppFallback = handleWhatsAppFallback;
  window.rfForms = {
    submitToAppsScript: submitToAppsScript,
    handleWhatsAppFallback: handleWhatsAppFallback,
    buildWhatsAppText: buildWhatsAppText,
    ENDPOINT: APPS_SCRIPT_ENDPOINT,
    WHATSAPP_PHONE: WHATSAPP_PHONE
  };
})();
