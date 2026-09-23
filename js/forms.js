/**
 * Sunbeam English School, Bhagwanpur — Form Validation & Interaction
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdmissionForm();
  initContactForm();
  initQuickEnquiryModal();
});

function initAdmissionForm() {
  const form = document.querySelector('#admissionEnquiryForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateForm(form)) {
      showToast('Thank you! Your Admission Enquiry has been received. Our admissions desk will connect with you shortly.', 'success');
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
    }
  });
}

function initContactForm() {
  const form = document.querySelector('#contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateForm(form)) {
      showToast('Thank you for contacting Sunbeam English School. We will get back to you soon.', 'success');
      form.reset();
      clearErrors(form);
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
      showError(msgInput, 'Please provide a brief message or query.');
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
    modal.className = 'lightbox-modal';
    modal.innerHTML = `
      <div class="lightbox-container" style="background: var(--white); color: var(--text-main); padding: 2.5rem; border-radius: var(--radius-lg); max-width: 600px; width: 92%; position: relative;">
        <button class="modal-close-btn" style="position: absolute; top: 1.25rem; right: 1.25rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        <span class="eyebrow eyebrow-badge">Sunbeam English School, Bhagwanpur</span>
        <h3 style="color: var(--primary); margin-bottom: 0.5rem; font-size: 1.5rem;">Apply for Admission</h3>
        <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1.5rem;">Submit this preliminary enquiry form to receive official admission guidelines and assistance from our admissions office.</p>
        
        <form id="modalAdmissionForm">
          <div class="grid-2" style="gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Parent/Guardian Name <span class="req">*</span></label>
              <input type="text" name="parent_name" class="form-control" placeholder="Enter your full name" required>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Student Name <span class="req">*</span></label>
              <input type="text" name="student_name" class="form-control" placeholder="Enter student's name" required>
            </div>
          </div>
          <div class="grid-2" style="gap: 1rem; margin-bottom: 1rem;">
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
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Email Address</label>
            <input type="email" name="email" class="form-control" placeholder="example@email.com">
          </div>
          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label class="form-label">Message / Any Questions</label>
            <textarea name="message" class="form-control" rows="3" placeholder="Please mention any specific queries..."></textarea>
          </div>
          <button type="submit" class="btn btn-gold btn-block" style="font-size: 1rem;">Submit Admission Enquiry →</button>
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

    const modalForm = modal.querySelector('#modalAdmissionForm');
    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateForm(modalForm)) {
        showToast('Enquiry Submitted! Our Admissions Office will reach out to you promptly.', 'success');
        modalForm.reset();
        clearErrors(modalForm);
        setTimeout(() => {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }, 1200);
      }
    });
  }

  triggerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });
}
