/**
 * Sunbeam English School, Bhagwanpur — Core Navigation & Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileDrawer();
  initActiveNav();
  initFAQAccordion();
  initWhatsAppIntegration();
});

// Sticky Header elevation effect on scroll
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

// Mobile Drawer Navigation
function initMobileDrawer() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const overlay = document.querySelector('.mobile-drawer-overlay');
  const closeBtn = document.querySelector('.drawer-close');

  if (!toggleBtn || !drawer || !overlay) return;

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    toggleBtn.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  // Close drawer when clicking navigation links inside drawer
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

// Active link highlighting
function initActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link, .drawer-nav a');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// FAQ Accordion
function initFAQAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    const body = item.querySelector('.faq-body');

    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all other FAQ items for a clean accordion
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
        const otherBody = otherItem.querySelector('.faq-body');
        if (otherBody) otherBody.style.maxHeight = null;
        otherItem.querySelector('.faq-header').setAttribute('aria-expanded', 'false');
      });

      if (!isActive) {
        item.classList.add('active');
        body.style.maxHeight = body.scrollHeight + 'px';
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// Global Toast Notification Helper
window.showToast = function(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size: 1.25rem;">${type === 'success' ? '✓' : 'ℹ'}</span>
    <div>${message}</div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Global Helper to copy Primary Website Link
window.copyPrimaryUrl = function() {
  const url = 'https://sunbeam-school.vercel.app/';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      window.showToast('✓ Primary link copied: ' + url, 'success');
    }).catch(() => fallbackCopy(url));
  } else {
    fallbackCopy(url);
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      window.showToast('✓ Primary link copied: ' + text, 'success');
    } catch (e) {
      window.showToast('Link: ' + text, 'info');
    }
    document.body.removeChild(ta);
  }
};

// ==========================================================================
// ==========================================================================
// Sunbeam WhatsApp Integration
// Handles interactive WhatsApp chat widget, floating button, and header CTAs
// ==========================================================================
function initWhatsAppIntegration() {
  // Ensure central config is available (fallback if whatsapp-config.js isn't loaded)
  if (!window.SUNBEAM_WHATSAPP_CONFIG) {
    window.SUNBEAM_WHATSAPP_CONFIG = {
      phoneNumber: '919519073791',
      displayPhone: '+91 9519073791',
      defaultMessage: 'Hello, I would like to enquire about admission at Sunbeam School. Please share the admission details.',
      getBaseUrl: function() {
        return 'https://wa.me/' + this.phoneNumber;
      },
      getWhatsAppUrl: function(customMessage) {
        const message = (customMessage !== undefined && customMessage !== null && customMessage !== '')
          ? customMessage
          : this.defaultMessage;
        return 'https://wa.me/' + this.phoneNumber + '?text=' + encodeURIComponent(message);
      },
      formatEnquiryMessage: function(details) {
        details = details || {};
        const lines = [
          '🎓 *Sunbeam English School, Bhagwanpur*',
          '━━━━━━━━━━━━━━━━━━━━━━━━'
        ];
        if (details.topic) {
          lines.push('📌 *Enquiry Topic:* ' + details.topic);
        } else {
          lines.push('📌 *Admission Enquiry (Session 2026–27)*');
        }
        if (details.parentName) lines.push('👤 *Parent / Guardian:* ' + details.parentName);
        if (details.studentName) lines.push('🧒 *Student Name:* ' + details.studentName);
        if (details.classApplying) lines.push('📚 *Class Applying:* ' + details.classApplying);
        if (details.phone) lines.push('📱 *Contact Mobile:* ' + details.phone);
        if (details.email) lines.push('✉️ *Email:* ' + details.email);
        if (details.message) lines.push('💬 *Query / Notes:* ' + details.message);
        lines.push('━━━━━━━━━━━━━━━━━━━━━━━━');
        lines.push('📍 *Campus:* Bhagwanpur, Varanasi (CBSE Affiliated)');
        lines.push('🌐 *Website:* https://sunbeam-school.vercel.app');
        return lines.join('\n');
      },
      sendEnquiry: function(details, sourcePage) {
        details = details || {};
        const messageText = this.formatEnquiryMessage(details);
        const waUrl = 'https://wa.me/' + this.phoneNumber + '?text=' + encodeURIComponent(messageText);
        try {
          if (window.SunbeamBackend && typeof window.SunbeamBackend.createLead === 'function') {
            window.SunbeamBackend.createLead({
              lead_type: 'whatsapp_enquiry',
              parent_name: details.parentName || 'Prospective Parent',
              student_name: details.studentName || '',
              phone: details.phone || '',
              email: details.email || '',
              class_applying: details.classApplying || '',
              subject: details.topic || 'WhatsApp Admission Enquiry',
              message: details.message || 'Direct WhatsApp Enquiry initiated',
              priority: 'high',
              source_page: sourcePage || (window.location.pathname.split('/').pop() || 'index.html') + ' (WhatsApp Widget)'
            }).catch(function(err) {
              console.warn('[WhatsApp] Auto-lead error:', err);
            });
          }
        } catch (e) {
          console.warn('[WhatsApp] Auto-lead catch:', e);
        }
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        return waUrl;
      }
    };
  }

  const config = window.SUNBEAM_WHATSAPP_CONFIG;
  const officialWaUrl = config.getWhatsAppUrl();

  // 1. Create or ensure WhatsApp Enquiry Chat Widget exists
  let widget = document.getElementById('whatsappEnquiryWidget');
  if (!widget) {
    widget = document.createElement('div');
    widget.id = 'whatsappEnquiryWidget';
    widget.className = 'whatsapp-enquiry-widget';
    widget.setAttribute('aria-hidden', 'true');
    widget.innerHTML = `
      <div class="wa-widget-header">
        <div class="wa-widget-brand">
          <div class="wa-widget-avatar">
            <img src="assets/images/school_crest.svg" alt="Sunbeam School Crest" width="34" height="34">
            <span class="wa-status-indicator" title="Counselor Online"></span>
          </div>
          <div class="wa-widget-titles">
            <span class="wa-widget-name">Sunbeam Admissions Desk</span>
            <span class="wa-widget-status">🟢 Online • Replies in 15 mins</span>
          </div>
        </div>
        <button class="wa-widget-close" aria-label="Close WhatsApp chat popup" id="waWidgetClose">&times;</button>
      </div>

      <div class="wa-widget-body">
        <div class="wa-chat-bubble">
          <div class="wa-bubble-sender">Admissions Counselor</div>
          <p class="wa-bubble-text">
            Namaste! 🙏 Welcome to Sunbeam English School, Bhagwanpur.
            How can we assist you with admissions for Session 2026–27?
          </p>
          <span class="wa-bubble-time">Verified School Helpline</span>
        </div>

        <div class="wa-quick-topics">
          <span class="wa-topics-label">Select quick enquiry topic:</span>
          <div class="wa-chips-row">
            <button type="button" class="wa-chip active" data-topic="New Student Admission (2026-27)">🎓 Admission 2026–27</button>
            <button type="button" class="wa-chip" data-topic="Fee Structure & Transport Routes">💰 Fees &amp; Bus Routes</button>
            <button type="button" class="wa-chip" data-topic="Campus Tour & Visit Request">🏫 Campus Visit</button>
            <button type="button" class="wa-chip" data-topic="Prospectus & Syllabus Details">📋 Prospectus</button>
          </div>
        </div>

        <form id="waQuickForm" class="wa-quick-form" novalidate>
          <div class="wa-form-row">
            <input type="text" id="waStudentName" class="wa-form-input" placeholder="Student Full Name *" required>
          </div>
          <div class="wa-form-row wa-form-cols">
            <select id="waClass" class="wa-form-input" required>
              <option value="">Class Applying *</option>
              <option value="Pre-Primary (Nursery, LKG, UKG)">Nursery / KG</option>
              <option value="Primary (Classes 1-5)">Class 1 to 5</option>
              <option value="Middle School (Classes 6-8)">Class 6 to 8</option>
              <option value="Secondary (Classes 9-10)">Class 9 / 10</option>
              <option value="Class 11/12 Science">Class 11 Science</option>
              <option value="Class 11/12 Commerce">Class 11 Commerce</option>
              <option value="Class 11/12 Humanities">Class 11 Arts</option>
            </select>
            <input type="tel" id="waPhone" class="wa-form-input" placeholder="Parent Mobile (10-digit)" maxlength="10">
          </div>
          <div class="wa-form-row">
            <textarea id="waMessage" class="wa-form-input wa-textarea" rows="2" placeholder="Parent name or query (e.g. Lanka route bus, fee details)..."></textarea>
          </div>

          <button type="submit" class="wa-btn-submit">
            <svg class="whatsapp-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18" height="18" fill="currentColor">
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
            </svg>
            <span>Send Enquiry on WhatsApp</span>
          </button>

          <div class="wa-widget-or">
            <span>OR</span>
          </div>

          <a href="${officialWaUrl}" 
             target="_blank" 
             rel="noopener noreferrer" 
             class="wa-btn-direct"
             id="waDirectLink">
            💬 Direct Chat (+91 9519073791)
          </a>
        </form>
      </div>

      <div class="wa-widget-footer">
        <span>🔒 Official Admissions Helpline • Sunbeam School Bhagwanpur</span>
      </div>
    `;
    document.body.appendChild(widget);
  }

  // 2. Widget open / close helpers
  function openWidget() {
    widget.classList.add('active');
    widget.setAttribute('aria-hidden', 'false');
    const firstInput = widget.querySelector('#waStudentName');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 200);
    }
  }

  function closeWidget() {
    widget.classList.remove('active');
    widget.setAttribute('aria-hidden', 'true');
  }

  function toggleWidget() {
    if (widget.classList.contains('active')) {
      closeWidget();
    } else {
      openWidget();
    }
  }

  // Expose toggleWidget globally
  window.openSunbeamWhatsAppWidget = openWidget;
  window.closeSunbeamWhatsAppWidget = closeWidget;
  window.toggleSunbeamWhatsAppWidget = toggleWidget;

  // Widget close button
  const closeBtn = widget.querySelector('#waWidgetClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeWidget();
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && widget.classList.contains('active')) {
      closeWidget();
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (widget.classList.contains('active')) {
      if (!widget.contains(e.target) && !e.target.closest('#whatsappFloat') && !e.target.closest('[data-whatsapp-widget-trigger]')) {
        closeWidget();
      }
    }
  });

  // Topic chips handler
  let selectedTopic = 'New Student Admission (2026-27)';
  const chips = widget.querySelectorAll('.wa-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedTopic = chip.getAttribute('data-topic') || chip.innerText.trim();
    });
  });

  // Quick form submit
  const quickForm = widget.querySelector('#waQuickForm');
  if (quickForm) {
    quickForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const studentName = (widget.querySelector('#waStudentName')?.value || '').trim();
      const classApplying = widget.querySelector('#waClass')?.value || '';
      const phone = (widget.querySelector('#waPhone')?.value || '').trim();
      const message = (widget.querySelector('#waMessage')?.value || '').trim();

      if (!studentName) {
        window.showToast('Please enter the student\'s name to enquire.', 'error');
        widget.querySelector('#waStudentName')?.focus();
        return;
      }

      const payload = {
        topic: selectedTopic,
        studentName: studentName,
        classApplying: classApplying,
        phone: phone,
        message: message
      };

      if (window.showToast) {
        window.showToast('Opening WhatsApp with your enquiry...', 'success');
      }

      config.sendEnquiry(payload, 'WhatsApp Quick Chat Widget');

      setTimeout(() => {
        closeWidget();
        quickForm.reset();
        chips.forEach((c, idx) => c.classList.toggle('active', idx === 0));
        selectedTopic = 'New Student Admission (2026-27)';
      }, 700);
    });
  }

  // 3. Ensure floating WhatsApp button exists on page and connects to widget
  let floatBtn = document.getElementById('whatsappFloat');
  if (!floatBtn) {
    floatBtn = document.createElement('a');
    floatBtn.id = 'whatsappFloat';
    floatBtn.className = 'whatsapp-float';
    floatBtn.href = officialWaUrl;
    floatBtn.setAttribute('aria-label', 'Enquire about admission on WhatsApp');
    floatBtn.setAttribute('title', 'WhatsApp Admissions Helpline (' + config.displayPhone + ')');
    floatBtn.innerHTML = `
      <span class="whatsapp-float-tooltip">
        <span class="whatsapp-tooltip-dot"></span>
        <span>WhatsApp Enquiry</span>
      </span>
      <svg class="whatsapp-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="32" height="32" fill="currentColor" aria-hidden="true">
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
      </svg>
    `;
    document.body.appendChild(floatBtn);
  }

  // Clicking float button toggles the widget popup
  floatBtn.addEventListener('click', (e) => {
    // If Shift/Ctrl key held or middle click, allow default link opening
    if (e.shiftKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    toggleWidget();
  });

  // 4. Inject Header WhatsApp CTA button if not present in site-header
  const headerActions = document.querySelector('.header-actions');
  if (headerActions && !headerActions.querySelector('.btn-whatsapp-header')) {
    const headerWaBtn = document.createElement('button');
    headerWaBtn.type = 'button';
    headerWaBtn.className = 'btn-whatsapp-header';
    headerWaBtn.setAttribute('data-whatsapp-widget-trigger', 'true');
    headerWaBtn.setAttribute('title', 'WhatsApp Admissions Enquiry (' + config.displayPhone + ')');
    headerWaBtn.innerHTML = `
      <svg class="whatsapp-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="15" height="15" fill="currentColor">
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
      </svg>
      <span>WhatsApp Enquiry</span>
    `;
    headerActions.insertBefore(headerWaBtn, headerActions.firstChild);
  }

  // 5. Inject Mobile Drawer WhatsApp button if not present
  const drawerCta = document.querySelector('.drawer-cta');
  if (drawerCta && !drawerCta.querySelector('.btn-whatsapp')) {
    const drawerWaBtn = document.createElement('button');
    drawerWaBtn.type = 'button';
    drawerWaBtn.className = 'btn btn-whatsapp btn-block';
    drawerWaBtn.setAttribute('data-whatsapp-widget-trigger', 'true');
    drawerWaBtn.style.marginTop = '0.65rem';
    drawerWaBtn.innerHTML = `
      <svg class="whatsapp-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16" height="16" fill="currentColor">
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
      </svg>
      <span>Enquire on WhatsApp</span>
    `;
    drawerCta.appendChild(drawerWaBtn);
  }

  // 6. Connect all trigger buttons with [data-whatsapp-widget-trigger]
  document.querySelectorAll('[data-whatsapp-widget-trigger]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // If mobile drawer is open, close it
      const drawer = document.querySelector('.mobile-drawer');
      const drawerOverlay = document.querySelector('.mobile-drawer-overlay');
      if (drawer && drawer.classList.contains('open')) {
        drawer.classList.remove('open');
      }
      if (drawerOverlay && drawerOverlay.classList.contains('open')) {
        drawerOverlay.classList.remove('open');
      }
      openWidget();
    });
  });

  // 7. Synchronize any remaining static WhatsApp enquiry CTAs across the page
  const enquiryLinks = document.querySelectorAll('[data-whatsapp-enquiry], .btn-whatsapp-cta');
  enquiryLinks.forEach(link => {
    const customMsg = link.getAttribute('data-whatsapp-message');
    link.href = config.getWhatsAppUrl(customMsg);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
}


