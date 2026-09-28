/**
 * ==============================================================================
 * Sunbeam English School, Bhagwanpur — Central WhatsApp Configuration
 * ==============================================================================
 * 
 * Edit this central configuration file to update the school's WhatsApp contact
 * number or pre-filled message in one place.
 * 
 * All floating buttons, enquiry CTAs, and WhatsApp actions across the website
 * derive their destination from this single source of truth.
 */

(function (window) {
  'use strict';

  const SUNBEAM_WHATSAPP_CONFIG = {
    // Official WhatsApp phone number (country code + mobile number, digits only)
    phoneNumber: '919519073791',

    // Formatted display phone number for UI display
    displayPhone: '+91 9519073791',

    // Official pre-filled message for admission enquiries
    defaultMessage: 'Hello, I would like to enquire about admission at Sunbeam School. Please share the admission details.',

    // Format structured WhatsApp message from enquiry details
    formatEnquiryMessage: function (details) {
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

    // Get the base wa.me link without message
    getBaseUrl: function () {
      return 'https://wa.me/' + this.phoneNumber;
    },

    // Get the complete wa.me link with encoded pre-filled message
    getWhatsAppUrl: function (customMessage) {
      const message = (customMessage !== undefined && customMessage !== null && customMessage !== '')
        ? customMessage
        : this.defaultMessage;
      return 'https://wa.me/' + this.phoneNumber + '?text=' + encodeURIComponent(message);
    },

    // Send formatted enquiry and log to CRM/backend
    sendEnquiry: function (details, sourcePage) {
      details = details || {};
      const messageText = this.formatEnquiryMessage(details);
      const waUrl = 'https://wa.me/' + this.phoneNumber + '?text=' + encodeURIComponent(messageText);

      // Async lead capture in Supabase / Local CRM
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
          }).catch(function (err) {
            console.warn('[WhatsApp] Lead auto-save notice:', err);
          });
        }
      } catch (e) {
        console.warn('[WhatsApp] Lead auto-save error:', e);
      }

      window.open(waUrl, '_blank', 'noopener,noreferrer');
      return waUrl;
    }
  };

  // Expose globally
  window.SUNBEAM_WHATSAPP_CONFIG = SUNBEAM_WHATSAPP_CONFIG;
})(window);
