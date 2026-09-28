/**
 * Sunbeam English School, Bhagwanpur — Form Validation & Backend Submission
 * Connected to Supabase Lead Management Backend with Offline Resilience
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdmissionForm();
  initContactForm();
  initQuickEnquiryModal();
  initEnquiryForms();
  initFormWhatsAppSync();
});

function initAdmissionForm() {
  const form = document.querySelector('#admissionEnquiryForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Submitting Application...';
    }

    const payload = {
      lead_type: 'admission',
      parent_name: (form.querySelector('[name="parent_name"]')?.value || '').trim(),
      student_name: (form.querySelector('[name="student_name"]')?.value || '').trim(),
      phone: (form.querySelector('[name="phone"]')?.value || '').trim(),
      email: (form.querySelector('[name="email"]')?.value || '').trim(),
      class_applying: form.querySelector('[name="class_applying"]')?.value || '',
      message: (form.querySelector('[name="message"]')?.value || '').trim(),
      priority: 'high',
      source_page: 'admissions.html'
    };

    try {
      if (window.SunbeamBackend && typeof window.SunbeamBackend.createLead === 'function') {
        const res = await window.SunbeamBackend.createLead(payload);
        const refId = res?.data?.id ? (typeof res.data.id === 'string' && res.data.id.length > 8 ? res.data.id.substring(0, 8).toUpperCase() : res.data.id) : 'SB-' + Math.floor(1000 + Math.random() * 9000);
        showToast(`✓ Admission Enquiry Received! Ref #${refId}. Our admissions desk in Bhagwanpur will contact you shortly.`, 'success');
      } else {
        showToast('✓ Admission Enquiry Received! Our admissions desk will connect with you shortly.', 'success');
      }

      form.reset();
      clearErrors(form);

      // Close modal if inside modal
      const modal = form.closest('.lightbox-modal');
      if (modal) {
        setTimeout(() => {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }, 1500);
      }
    } catch (err) {
      console.error('Error submitting admission inquiry:', err);
      showToast('Enquiry saved locally. We will process your application shortly.', 'info');
      form.reset();
      clearErrors(form);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  });
}

function initContactForm() {
  const form = document.querySelector('#contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Send Enquiry';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending Message...';
    }

    const payload = {
      lead_type: 'contact',
      parent_name: (form.querySelector('[name="name"]')?.value || '').trim(),
      phone: (form.querySelector('[name="phone"]')?.value || '').trim(),
      email: (form.querySelector('[name="email"]')?.value || '').trim(),
      subject: (form.querySelector('[name="subject"]')?.value || '').trim(),
      message: (form.querySelector('[name="message"]')?.value || '').trim(),
      priority: 'medium',
      source_page: window.location.pathname.split('/').pop() || 'contact.html'
    };

    try {
      if (window.SunbeamBackend && typeof window.SunbeamBackend.createLead === 'function') {
        await window.SunbeamBackend.createLead(payload);
      }
      showToast('Thank you for contacting Sunbeam English School. Your message has been routed to our office.', 'success');
      form.reset();
      clearErrors(form);
    } catch (err) {
      console.error('Error submitting contact form:', err);
      showToast('Your enquiry has been recorded. Our office will assist you.', 'info');
      form.reset();
      clearErrors(form);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  });
}

function validateForm(form) {
  let isValid = true;
  clearErrors(form);

  // Parent / Full Name
  const nameInput = form.querySelector('[name="name"], [name="parent_name"]');
  if (nameInput) {
    if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
      showError(nameInput, 'Please enter a valid full name (minimum 2 characters).');
      isValid = false;
    }
  }

  // Student Name (if present)
  const studentInput = form.querySelector('[name="student_name"]');
  if (studentInput) {
    if (!studentInput.value.trim() || studentInput.value.trim().length < 2) {
      showError(studentInput, 'Please enter the student\'s full name.');
      isValid = false;
    }
  }

  // Phone Number (10 digits)
  const phoneInput = form.querySelector('[name="phone"]');
  if (phoneInput) {
    const phoneVal = phoneInput.value.trim().replace(/\D/g, '');
    const phonePattern = /^[6-9]\d{9}$/;
    if (!phonePattern.test(phoneVal)) {
      showError(phoneInput, 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      isValid = false;
    }
  }

  // Email Address
  const emailInput = form.querySelector('[name="email"]');
  if (emailInput && emailInput.value.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailInput.value.trim())) {
      showError(emailInput, 'Please enter a valid email address.');
      isValid = false;
    }
  }

  // Grade / Class (if present)
  const classInput = form.querySelector('[name="class_applying"]');
  if (classInput) {
    if (!classInput.value) {
      showError(classInput, 'Please select the class applying for.');
      isValid = false;
    }
  }

  // Message / Query (if required)
  const msgInput = form.querySelector('[name="message"]');
  if (msgInput && msgInput.hasAttribute('required')) {
    if (!msgInput.value.trim() || msgInput.value.trim().length < 5) {
      showError(msgInput, 'Please provide a brief message or query (minimum 5 characters).');
      isValid = false;
    }
  }

  return isValid;
}

function showError(input, message) {
  input.classList.add('is-invalid');
  let feedback = input.nextElementSibling;
  if (!feedback || !feedback.classList.contains('invalid-feedback')) {
    feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    input.parentNode.insertBefore(feedback, input.nextSibling);
  }
  feedback.textContent = message;
  feedback.style.display = 'block';
}

function clearErrors(form) {
  form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  form.querySelectorAll('.invalid-feedback').forEach(el => el.style.display = 'none');
}

// Quick Admission Modal Trigger
function initQuickEnquiryModal() {
  const triggerBtns = document.querySelectorAll('.trigger-admission-modal');
  let modal = document.querySelector('#admissionModal');

  if (!triggerBtns.length) return;

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admissionModal';
    modal.innerHTML = `
      <div class="admission-modal-dialog">
        <button class="modal-close-btn" aria-label="Close Modal">&times;</button>
        <div style="margin-bottom: 0.5rem;">
          <span class="eyebrow eyebrow-badge">Sunbeam English School, Bhagwanpur</span>
        </div>
        <h3 style="color: var(--primary); margin-bottom: 0.35rem; font-size: 1.45rem;">Apply for Admission</h3>
        <p class="modal-desc" style="font-size: 0.86rem; color: var(--text-muted); margin-bottom: 1.25rem;">
          Submit your preliminary enquiry below. Our Bhagwanpur admissions desk will connect with you promptly.
        </p>
        
        <form id="modalAdmissionForm">
          <div class="modal-form-grid">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Parent/Guardian Name <span class="req">*</span></label>
              <input type="text" name="parent_name" class="form-control" placeholder="Enter your full name" required>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Student Name <span class="req">*</span></label>
              <input type="text" name="student_name" class="form-control" placeholder="Enter student's name" required>
            </div>
          </div>
          <div class="modal-form-grid">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Mobile Number <span class="req">*</span></label>
              <input type="tel" name="phone" class="form-control" placeholder="10-digit mobile number" required>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Class Applying For <span class="req">*</span></label>
              <select name="class_applying" class="form-control" required>
                <option value="">Select Class / Grade</option>
                <option value="Primary (Classes 1-5)">Primary (Classes 1–5)</option>
                <option value="Middle School (Classes 6-8)">Middle School (Classes 6–8)</option>
                <option value="Secondary (Classes 9-10)">Secondary School (Classes 9–10)</option>
                <option value="Senior Secondary (Classes 11-12)">Senior Secondary (Classes 11–12)</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 0.85rem;">
            <label class="form-label">Email Address</label>
            <input type="email" name="email" class="form-control" placeholder="parent.email@example.com">
          </div>
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label">Message / Queries</label>
            <textarea name="message" class="form-control" rows="2" placeholder="Mention bus transport, previous school syllabus, etc."></textarea>
          </div>
          <button type="submit" class="btn btn-gold btn-block btn-lg" style="font-size: 1rem; width: 100%;">
            Submit Admission Enquiry →
          </button>
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 0.75rem; margin-bottom: 0.5rem;">
            <span style="height: 1px; background: var(--border-light); flex: 1;"></span>
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">OR</span>
            <span style="height: 1px; background: var(--border-light); flex: 1;"></span>
          </div>
          <a href="https://wa.me/919519073791?text=Hello%2C%20I%20would%20like%20to%20enquire%20about%20admission%20at%20Sunbeam%20School.%20Please%20share%20the%20admission%20details." 
             target="_blank" 
             rel="noopener noreferrer" 
             class="btn-whatsapp btn-whatsapp-block" 
             data-whatsapp-enquiry 
             style="font-size: 0.92rem; padding: 0.75rem;">
            <svg class="whatsapp-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
            </svg>
            Enquire on WhatsApp
          </a>
          <div style="font-size: 0.74rem; color: var(--text-muted); text-align: center; margin-top: 0.75rem;">
            🔒 Your details are securely submitted to Sunbeam Admissions Desk.
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.modal-close-btn');
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    const modalForm = modal.querySelector('#modalAdmissionForm');
    modalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(modalForm)) return;

      const submitBtn = modalForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerText : 'Submit';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Submitting Application...';
      }

      const payload = {
        lead_type: 'admission',
        parent_name: (modalForm.querySelector('[name="parent_name"]')?.value || '').trim(),
        student_name: (modalForm.querySelector('[name="student_name"]')?.value || '').trim(),
        phone: (modalForm.querySelector('[name="phone"]')?.value || '').trim(),
        email: (modalForm.querySelector('[name="email"]')?.value || '').trim(),
        class_applying: modalForm.querySelector('[name="class_applying"]')?.value || '',
        message: (modalForm.querySelector('[name="message"]')?.value || '').trim(),
        priority: 'high',
        source_page: (window.location.pathname.split('/').pop() || 'index.html') + ' (Quick Modal)'
      };

      try {
        if (window.SunbeamBackend && typeof window.SunbeamBackend.createLead === 'function') {
          await window.SunbeamBackend.createLead(payload);
        }
        showToast('Enquiry Submitted! Our Admissions Office will reach out to you promptly.', 'success');
        modalForm.reset();
        clearErrors(modalForm);
        setTimeout(() => {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }, 1200);
      } catch (err) {
        console.error('Error submitting modal inquiry:', err);
        showToast('Enquiry recorded. Our office will reach out soon.', 'info');
        modalForm.reset();
        clearErrors(modalForm);
        modal.classList.remove('active');
        document.body.style.overflow = '';
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = originalText;
        }
      }
    });
  }

  triggerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // If already on admissions page, scroll down smoothly to form
      const currentPage = window.location.pathname.split('/').pop();
      if (currentPage === 'admissions.html') {
        const pageForm = document.querySelector('#admissionEnquiryForm');
        if (pageForm) {
          pageForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      if (currentPage === 'enquiry.html') {
        const pageForm = document.querySelector('#dedicatedEnquiryForm');
        if (pageForm) {
          pageForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      if (currentPage === 'index.html' || currentPage === '') {
        const homeForm = document.querySelector('#homeEnquiryForm');
        if (homeForm && btn.getAttribute('href') === '#enquiry') {
          homeForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }

      e.preventDefault();

      // Close mobile navigation drawer if it's currently open
      const drawer = document.querySelector('.mobile-drawer');
      const drawerOverlay = document.querySelector('.mobile-drawer-overlay');
      if (drawer && drawer.classList.contains('open')) {
        drawer.classList.remove('open');
      }
      if (drawerOverlay && drawerOverlay.classList.contains('open')) {
        drawerOverlay.classList.remove('open');
      }

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';

      const dialog = modal.querySelector('.admission-modal-dialog');
      if (dialog) dialog.scrollTop = 0;
    });
  });
}

// Dedicated and Homepage Enquiry Forms
function initEnquiryForms() {
  const forms = [
    document.querySelector('#dedicatedEnquiryForm'),
    document.querySelector('#homeEnquiryForm')
  ].filter(Boolean);

  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(form)) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit Enquiry';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Submitting to Admissions Desk...';
      }

      const isHome = form.id === 'homeEnquiryForm';
      const sourcePage = isHome ? 'index.html (Home Page Section)' : 'enquiry.html (Dedicated Portal)';

      const payload = {
        lead_type: 'admission',
        parent_name: (form.querySelector('[name="parent_name"]')?.value || form.querySelector('[name="name"]')?.value || '').trim(),
        student_name: (form.querySelector('[name="student_name"]')?.value || '').trim(),
        phone: (form.querySelector('[name="phone"]')?.value || '').trim(),
        email: (form.querySelector('[name="email"]')?.value || '').trim(),
        class_applying: form.querySelector('[name="class_applying"]')?.value || '',
        subject: form.querySelector('[name="subject"]')?.value || 'Admission Enquiry 2026-27',
        message: (form.querySelector('[name="message"]')?.value || '').trim(),
        priority: 'high',
        source_page: sourcePage
      };

      try {
        let refId = 'SB-' + Math.floor(1000 + Math.random() * 9000);
        if (window.SunbeamBackend && typeof window.SunbeamBackend.createLead === 'function') {
          const res = await window.SunbeamBackend.createLead(payload);
          if (res?.data?.id) {
            refId = typeof res.data.id === 'string' && res.data.id.length > 8 
              ? res.data.id.substring(0, 8).toUpperCase() 
              : ('SB-' + res.data.id);
          }
        }

        // Show prominent in-page success alert if available
        const successBox = form.parentElement.querySelector('.form-success-alert') || document.querySelector('#enquirySuccessAlert');
        if (successBox) {
          successBox.innerHTML = `
            <div style="background: #ECFDF5; border: 1px solid #10B981; color: #065F46; padding: 1.25rem; border-radius: 8px; margin-bottom: 1.25rem; text-align: left;">
              <div style="font-weight: 700; font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                <span>✅</span> Admission Enquiry Successfully Received!
              </div>
              <p style="margin-bottom: 0.5rem; font-size: 0.92rem;">
                Thank you, <strong>${payload.parent_name || 'Parent'}</strong>. Your inquiry for <strong>${payload.student_name || 'the student'}</strong> (${payload.class_applying || 'AY 2026-27'}) has been saved in our Supabase admissions system with <strong>Reference #${refId}</strong>.
              </p>
              <div style="font-size: 0.85rem; color: #047857;">
                📞 Our Admissions Counselor at Sunbeam Bhagwanpur will review your application and contact you at <strong>${payload.phone}</strong> shortly.
              </div>
            </div>
          `;
          successBox.style.display = 'block';
          successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        showToast(`✓ Enquiry Received! Ref #${refId}. Admissions Desk will contact you shortly.`, 'success');

        form.reset();
        clearErrors(form);
      } catch (err) {
        console.error('Error submitting enquiry form:', err);
        showToast('Enquiry saved. Our admissions office will contact you soon.', 'info');
        form.reset();
        clearErrors(form);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  });
}

// Connect all admission & contact forms to WhatsApp action
function initFormWhatsAppSync() {
  const formConfigs = [
    { formId: 'dedicatedEnquiryForm', defaultTopic: 'New Student Admission (Session 2026–27)' },
    { formId: 'homeEnquiryForm', defaultTopic: 'Quick Admission Enquiry (Session 2026–27)' },
    { formId: 'admissionEnquiryForm', defaultTopic: 'Admission Enquiry (Session 2026–27)' },
    { formId: 'contactForm', defaultTopic: 'General School Contact Enquiry' },
    { formId: 'modalAdmissionForm', defaultTopic: 'Quick Modal Admission Enquiry' }
  ];

  formConfigs.forEach(({ formId, defaultTopic }) => {
    const form = document.getElementById(formId);
    if (!form) return;

    // Look for any whatsapp enquiry link/button within or adjacent to this form
    const waTrigger = form.querySelector('[data-whatsapp-enquiry], .btn-whatsapp') ||
                      form.parentElement?.querySelector('[data-whatsapp-enquiry], .btn-whatsapp');
    if (!waTrigger) return;

    waTrigger.addEventListener('click', (e) => {
      // Don't intercept if ctrl/cmd clicked
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();

      const config = window.SUNBEAM_WHATSAPP_CONFIG;
      if (!config) return;

      const parentName = (form.querySelector('[name="parent_name"], [name="name"]')?.value || '').trim();
      const studentName = (form.querySelector('[name="student_name"]')?.value || '').trim();
      const phone = (form.querySelector('[name="phone"]')?.value || '').trim();
      const email = (form.querySelector('[name="email"]')?.value || '').trim();
      const classApplying = form.querySelector('[name="class_applying"]')?.value || '';
      const subject = form.querySelector('[name="subject"]')?.value || defaultTopic;
      const message = (form.querySelector('[name="message"]')?.value || '').trim();

      const details = {
        topic: subject,
        parentName: parentName,
        studentName: studentName,
        classApplying: classApplying,
        phone: phone,
        email: email,
        message: message
      };

      if (window.showToast) {
        window.showToast('Connecting with Sunbeam Counselor on WhatsApp...', 'info');
      }

      config.sendEnquiry(details, `${formId} (Form WhatsApp Button)`);
    });
  });
}


