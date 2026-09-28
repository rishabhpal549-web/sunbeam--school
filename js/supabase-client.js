/**
 * Sunbeam English School, Bhagwanpur — Supabase Client & Backend Integration Layer
 * 
 * Provides unified data access for:
 * 1. Live Supabase PostgreSQL database (when configured)
 * 2. Realtime WebSocket subscription for live lead notifications
 * 3. Graceful LocalStorage fallback for offline testing & resilience
 */

(function () {
  'use strict';

  // Storage keys
  const STORAGE_KEY_URL = 'sunbeam_supabase_url';
  const STORAGE_KEY_ANON = 'sunbeam_supabase_anon_key';
  const STORAGE_KEY_LOCAL_LEADS = 'sunbeam_local_leads';
  const STORAGE_KEY_LOCAL_ACTIVITIES = 'sunbeam_local_activities';
  const STORAGE_KEY_ALERT_EMAIL = 'sunbeam_alert_email';
  const DEFAULT_ALERT_EMAIL = 'rishabhpal549@gmail.com';

  // Default credentials for user's Supabase project
  const DEFAULT_CONFIG = {
    url: window.SUNBEAM_SUPABASE_URL || localStorage.getItem(STORAGE_KEY_URL) || 'https://udplvxyasfzjnoumlnnv.supabase.co',
    anonKey: window.SUNBEAM_SUPABASE_ANON || localStorage.getItem(STORAGE_KEY_ANON) || 'sb_publishable_56G0X0USEsML4MUzw8J0-A_OGNwZNg4'
  };

  // Dispatch instant email alert to school administrator
  async function sendEmailNotification(lead) {
    const alertEmail = localStorage.getItem(STORAGE_KEY_ALERT_EMAIL) || DEFAULT_ALERT_EMAIL;
    if (!alertEmail) return { success: false, message: 'No alert email configured' };

    try {
      const studentLabel = lead.student_name ? ` (Student: ${lead.student_name})` : '';
      const subject = `🎓 New Sunbeam School Enquiry: ${lead.parent_name || 'Prospective Parent'}${studentLabel}`;
      
      const payload = {
        _subject: subject,
        _template: 'table',
        _captcha: 'false',
        'Lead Type': (lead.lead_type || 'admission').toUpperCase(),
        'Parent / Guardian Name': lead.parent_name || 'N/A',
        'Student Name': lead.student_name || 'N/A',
        'Mobile Phone': lead.phone || 'N/A',
        'Email Address': lead.email || 'N/A',
        'Class Applying For': lead.class_applying || 'N/A',
        'Subject / Title': lead.subject || 'Admission Enquiry',
        'Parent Message / Requirements': lead.message || 'N/A',
        'Source Page': lead.source_page || 'Website',
        'Priority': (lead.priority || 'medium').toUpperCase(),
        'Timestamp (IST)': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      };

      const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(alertEmail.trim())}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => ({}));
      return { success: res.ok, data: json };
    } catch (err) {
      console.warn('Email notification dispatch skipped or failed:', err);
      return { success: false, error: err };
    }
  }

  let supabaseInstance = null;
  let isSupabaseReady = false;

  // Initial Sample Leads for local demonstration fallback
  const SEED_LEADS = [
    {
      id: 'seed-lead-1',
      created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      lead_type: 'admission',
      parent_name: 'Rajesh Kumar Sharma',
      student_name: 'Aarav Sharma',
      phone: '9839012345',
      email: 'rajesh.sharma@example.com',
      class_applying: 'Middle School (Classes 6-8)',
      subject: 'Admission Inquiry for Class 6',
      message: 'Seeking CBSE admission for academic year 2026-27. We are relocating near BHU Lanka and require school bus facility.',
      status: 'new',
      priority: 'high',
      assigned_to: 'Admissions Desk',
      source_page: 'admissions.html',
      follow_up_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0],
      academic_year: '2026-2027',
      tags: ['CBSE', 'Bus Route', 'BHU Lanka']
    },
    {
      id: 'seed-lead-2',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      lead_type: 'admission',
      parent_name: 'Dr. Sunita Pathak',
      student_name: 'Ananya Pathak',
      phone: '9415023456',
      email: 'dr.sunita@example.com',
      class_applying: 'Senior Secondary (Classes 11-12)',
      subject: 'Class 11 Science Stream PCB',
      message: 'Student scored 94% in Class 10 Pre-Boards. Interested in Medical/NEET integrated coaching with CBSE curriculum.',
      status: 'contacted',
      priority: 'urgent',
      assigned_to: 'Counselor Anjali',
      source_page: 'admissions.html',
      follow_up_date: new Date().toISOString().split('T')[0],
      academic_year: '2026-2027',
      tags: ['Science PCB', 'NEET Track']
    },
    {
      id: 'seed-lead-3',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      lead_type: 'admission',
      parent_name: 'Virendra Singh',
      student_name: 'Kabir Singh',
      phone: '9792034567',
      email: 'virendra.singh@example.com',
      class_applying: 'Primary (Classes 1-5)',
      subject: 'Class 2 Transfer Enquiry',
      message: 'Would like to schedule an in-person school campus tour this Saturday morning.',
      status: 'campus_visit',
      priority: 'medium',
      assigned_to: 'Counselor Manish',
      source_page: 'index.html (Quick Modal)',
      follow_up_date: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString().split('T')[0],
      academic_year: '2026-2027',
      tags: ['Primary', 'Campus Tour']
    },
    {
      id: 'seed-lead-4',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      lead_type: 'admission',
      parent_name: 'Meenakshi Jaiswal',
      student_name: 'Devansh Jaiswal',
      phone: '9838045678',
      email: 'meenakshi.j@example.com',
      class_applying: 'Secondary (Classes 9-10)',
      subject: 'Class 9 Admission and Aptitude Test',
      message: 'Enquired regarding syllabus for entrance evaluation and transfer certificate documentation.',
      status: 'assessment',
      priority: 'medium',
      assigned_to: 'Counselor Manish',
      source_page: 'admissions.html',
      follow_up_date: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString().split('T')[0],
      academic_year: '2026-2027',
      tags: ['Aptitude Test', 'Class 9']
    },
    {
      id: 'seed-lead-5',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      lead_type: 'admission',
      parent_name: 'Alok Srivastava',
      student_name: 'Riya Srivastava',
      phone: '9450056789',
      email: 'alok.sri@example.com',
      class_applying: 'Primary (Classes 1-5)',
      subject: 'Admission Confirmed - Fee Paid',
      message: 'Admission finalized for Class 3. Transport route Bhagwanpur to Sigra mapped.',
      status: 'enrolled',
      priority: 'low',
      assigned_to: 'Counselor Anjali',
      source_page: 'admissions.html',
      follow_up_date: null,
      academic_year: '2026-2027',
      tags: ['Enrolled', 'Fee Paid']
    },
    {
      id: 'seed-lead-6',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
      lead_type: 'contact',
      parent_name: 'Prof. Anand Vardhan',
      student_name: '',
      phone: '9935067890',
      email: 'anand.vardhan@example.com',
      class_applying: '',
      subject: 'Annual Inter-School Debate Collaboration',
      message: 'Would like to connect with the literary society coordinator regarding the upcoming Banaras Youth Festival debate.',
      status: 'contacted',
      priority: 'low',
      assigned_to: 'General Desk',
      source_page: 'contact.html',
      follow_up_date: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString().split('T')[0],
      academic_year: '2026-2027',
      tags: ['General Contact', 'Youth Festival']
    }
  ];

  const SEED_ACTIVITIES = [
    {
      id: 'seed-act-1',
      lead_id: 'seed-lead-2',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      activity_type: 'note',
      author: 'Counselor Anjali',
      content: 'Spoke to mother. She was very impressed with CBSE 2025 board results. Sent syllabus brochure over WhatsApp.'
    },
    {
      id: 'seed-act-2',
      lead_id: 'seed-lead-3',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      activity_type: 'campus_visit',
      author: 'Counselor Manish',
      content: 'Campus tour scheduled for Saturday at 11:30 AM. Visited ATL Robotics lab & sports complex.'
    }
  ];

  // Helper: Load Supabase JS dynamically if missing
  function loadSupabaseScript() {
    return new Promise((resolve, reject) => {
      if (window.supabase) {
        resolve(window.supabase);
        return;
      }
      const existingScript = document.querySelector('script[src*="supabase-js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.supabase));
        existingScript.addEventListener('error', reject);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.onload = () => resolve(window.supabase);
      script.onerror = () => {
        console.warn('Could not load Supabase JS CDN script. Falling back to local offline mode.');
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }

  // Initialize client
  async function initClient(url, anonKey) {
    const sbUrl = url || localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_CONFIG.url;
    const sbAnon = anonKey || localStorage.getItem(STORAGE_KEY_ANON) || DEFAULT_CONFIG.anonKey;

    if (!sbUrl || !sbAnon) {
      isSupabaseReady = false;
      return null;
    }

    try {
      await loadSupabaseScript();
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseInstance = window.supabase.createClient(sbUrl, sbAnon);
        isSupabaseReady = true;
        return supabaseInstance;
      }
    } catch (err) {
      console.warn('Supabase initialization failed:', err);
    }
    isSupabaseReady = false;
    return null;
  }

  // Local Storage Helpers
  function getLocalLeads() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOCAL_LEADS);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_LOCAL_LEADS, JSON.stringify(SEED_LEADS));
        return [...SEED_LEADS];
      }
      return JSON.parse(stored);
    } catch (e) {
      return [...SEED_LEADS];
    }
  }

  function saveLocalLeads(leads) {
    try {
      localStorage.setItem(STORAGE_KEY_LOCAL_LEADS, JSON.stringify(leads));
    } catch (e) {
      console.error('Error saving to local storage:', e);
    }
  }

  function getLocalActivities() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOCAL_ACTIVITIES);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_LOCAL_ACTIVITIES, JSON.stringify(SEED_ACTIVITIES));
        return [...SEED_ACTIVITIES];
      }
      return JSON.parse(stored);
    } catch (e) {
      return [...SEED_ACTIVITIES];
    }
  }

  function saveLocalActivities(activities) {
    try {
      localStorage.setItem(STORAGE_KEY_LOCAL_ACTIVITIES, JSON.stringify(activities));
    } catch (e) {
      console.error('Error saving activities to local storage:', e);
    }
  }

  // Unified API
  const SunbeamBackend = {
    // Check configuration status
    isConfigured: function () {
      const url = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_CONFIG.url;
      const key = localStorage.getItem(STORAGE_KEY_ANON) || DEFAULT_CONFIG.anonKey;
      return Boolean(url && key);
    },

    getCredentials: function () {
      return {
        url: localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_CONFIG.url || '',
        anonKey: localStorage.getItem(STORAGE_KEY_ANON) || DEFAULT_CONFIG.anonKey || ''
      };
    },

    saveCredentials: async function (url, anonKey) {
      if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
      if (anonKey) localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
      return await initClient(url, anonKey);
    },

    clearCredentials: function () {
      localStorage.removeItem(STORAGE_KEY_URL);
      localStorage.removeItem(STORAGE_KEY_ANON);
      supabaseInstance = null;
      isSupabaseReady = false;
    },

    testConnection: async function (url, anonKey) {
      try {
        await loadSupabaseScript();
        if (!window.supabase) {
          return { success: false, message: 'Supabase JS library could not be loaded.' };
        }
        const testClient = window.supabase.createClient(url.trim(), anonKey.trim());
        const { data, error } = await testClient.from('leads').select('id').limit(1);
        if (error) {
          // Check if enquiries table exists
          const enqTest = await testClient.from('enquiries').select('id').limit(1);
          if (!enqTest.error) {
            return {
              success: true,
              table: 'enquiries',
              message: 'Connected successfully to Supabase database (using enquiries table)!'
            };
          }

          if (error.code === 'PGRST205' || (error.message && error.message.toLowerCase().includes('schema cache'))) {
            return {
              success: true,
              needsSchema: true,
              message: "Connected to Supabase! However, the 'leads' table has not been created yet. Please execute supabase/schema.sql in your Supabase SQL Editor."
            };
          }
          return { success: false, message: error.message || 'Failed to query Supabase leads table. Ensure schema.sql has been executed.' };
        }
        return { success: true, message: 'Connected successfully to Supabase database!' };
      } catch (err) {
        return { success: false, message: err.message || 'Unknown network error occurred.' };
      }
    },

    // Fetch all leads
    getLeads: async function () {
      const client = await initClient();
      if (client && isSupabaseReady) {
        try {
          const { data, error } = await client
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && Array.isArray(data)) {
            return { success: true, data, source: 'supabase' };
          }

          // Transparent fallback to 'enquiries' table if present
          const enqRes = await client.from('enquiries').select('*').order('created_at', { ascending: false });
          if (!enqRes.error && Array.isArray(enqRes.data)) {
            const mapped = enqRes.data.map(e => ({
              ...e,
              parent_name: e.Parent_name || e.parent_name || 'Parent',
              status: e.status || 'new',
              priority: e.priority || 'medium',
              assigned_to: e.assigned_to || 'Admissions Desk',
              lead_type: e.lead_type || 'admission'
            }));
            return { success: true, data: mapped, source: 'supabase' };
          }

          console.warn('Supabase fetch failed, falling back to local storage:', error || enqRes.error);
        } catch (e) {
          console.warn('Supabase error:', e);
        }
      }

      // Local fallback
      const localLeads = getLocalLeads();
      return { success: true, data: localLeads, source: 'local' };
    },

    // Create a new lead (used by public forms and CRM manual entry)
    createLead: async function (leadData) {
      const client = await initClient();
      const sanitized = {
        lead_type: leadData.lead_type || 'admission',
        parent_name: (leadData.parent_name || leadData.name || '').trim(),
        student_name: (leadData.student_name || '').trim(),
        phone: (leadData.phone || '').trim().replace(/\D/g, ''),
        email: (leadData.email || '').trim(),
        class_applying: leadData.class_applying || leadData.grade || '',
        subject: (leadData.subject || '').trim(),
        message: (leadData.message || '').trim(),
        status: leadData.status || 'new',
        priority: leadData.priority || 'medium',
        assigned_to: leadData.assigned_to || 'Admissions Desk',
        source_page: leadData.source_page || window.location.pathname.split('/').pop() || 'Website',
        academic_year: leadData.academic_year || '2026-2027',
        tags: leadData.tags || [],
        follow_up_date: leadData.follow_up_date || null
      };

      if (client && isSupabaseReady) {
        let enqSavedRecord = null;
        let leadsSavedRecord = null;
        let anySuccess = false;

        // 1. Primary: Save directly to existing 'enquiries' table (preserving original schema)
        try {
          const enqPayload = {
            Parent_name: sanitized.parent_name,
            student_name: sanitized.student_name,
            phone: sanitized.phone,
            email: sanitized.email,
            class_applying: sanitized.class_applying,
            message: sanitized.message
          };
          const enqRes = await client.from('enquiries').insert([enqPayload]).select();
          if (!enqRes.error && enqRes.data && enqRes.data.length > 0) {
            enqSavedRecord = enqRes.data[0];
            anySuccess = true;
          } else if (enqRes.error) {
            console.warn('Enquiries table insert note:', enqRes.error.message);
          }
        } catch (enqErr) {
          console.warn('Enquiries table insert exception:', enqErr);
        }

        // 2. Secondary: Also save to 'leads' table for CRM and pipeline sync
        try {
          const { data, error } = await client
            .from('leads')
            .insert([sanitized])
            .select();
          if (!error && data && data.length > 0) {
            leadsSavedRecord = data[0];
            anySuccess = true;
          }
        } catch (leadErr) {
          console.warn('Leads table insert exception:', leadErr);
        }

        if (anySuccess) {
          // Trigger instant email notification to school admin
          sendEmailNotification(sanitized).catch(() => {});
          const resultData = leadsSavedRecord || {
            ...sanitized,
            ...enqSavedRecord,
            parent_name: enqSavedRecord?.Parent_name || sanitized.parent_name
          };
          return { success: true, data: resultData, source: 'supabase' };
        }

        console.warn('Supabase insert did not succeed on both tables, falling back to local storage.');
      }

      // Local fallback
      const newLead = {
        ...sanitized,
        id: 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const leads = getLocalLeads();
      leads.unshift(newLead);
      saveLocalLeads(leads);

      // Trigger instant email notification to school admin
      sendEmailNotification(sanitized).catch(() => {});

      return { success: true, data: newLead, source: 'local' };
    },

    // Update lead
    updateLead: async function (id, updates) {
      const client = await initClient();
      const payload = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (client && isSupabaseReady && !id.startsWith('local-') && !id.startsWith('seed-')) {
        try {
          const { data, error } = await client
            .from('leads')
            .update(payload)
            .eq('id', id)
            .select();

          if (!error && data && data.length > 0) {
            return { success: true, data: data[0], source: 'supabase' };
          }
        } catch (err) {
          console.warn('Supabase update error:', err);
        }
      }

      // Local fallback
      const leads = getLocalLeads();
      const index = leads.findIndex(l => l.id === id);
      if (index !== -1) {
        leads[index] = { ...leads[index], ...payload };
        saveLocalLeads(leads);

        // Record status change activity if status changed
        if (updates.status && updates.status !== leads[index].status) {
          await this.addLeadActivity(id, {
            activity_type: 'status_change',
            author: updates.assigned_to || 'Counselor',
            content: `Status updated to "${updates.status}"`
          });
        }

        return { success: true, data: leads[index], source: 'local' };
      }

      return { success: false, message: 'Lead not found' };
    },

    // Delete lead
    deleteLead: async function (id) {
      const client = await initClient();
      if (client && isSupabaseReady && !id.startsWith('local-') && !id.startsWith('seed-')) {
        try {
          const { error } = await client.from('leads').delete().eq('id', id);
          if (!error) return { success: true, source: 'supabase' };
        } catch (err) {
          console.warn('Supabase delete error:', err);
        }
      }

      // Local fallback
      const leads = getLocalLeads();
      const filtered = leads.filter(l => l.id !== id);
      saveLocalLeads(filtered);
      return { success: true, source: 'local' };
    },

    // Fetch activities / notes for a specific lead
    getLeadActivities: async function (leadId) {
      const client = await initClient();
      if (client && isSupabaseReady && !leadId.startsWith('local-') && !leadId.startsWith('seed-')) {
        try {
          const { data, error } = await client
            .from('lead_activities')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });

          if (!error && Array.isArray(data)) {
            return { success: true, data, source: 'supabase' };
          }
        } catch (e) {
          console.warn('Error fetching activities:', e);
        }
      }

      // Local fallback
      const acts = getLocalActivities().filter(a => a.lead_id === leadId);
      acts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { success: true, data: acts, source: 'local' };
    },

    // Add activity / note
    addLeadActivity: async function (leadId, activity) {
      const client = await initClient();
      const payload = {
        lead_id: leadId,
        activity_type: activity.activity_type || 'note',
        author: activity.author || 'Admissions Counselor',
        content: activity.content || '',
        metadata: activity.metadata || {}
      };

      if (client && isSupabaseReady && !leadId.startsWith('local-') && !leadId.startsWith('seed-')) {
        try {
          const { data, error } = await client
            .from('lead_activities')
            .insert([payload])
            .select();

          if (!error && data && data.length > 0) {
            return { success: true, data: data[0], source: 'supabase' };
          }
        } catch (err) {
          console.warn('Supabase insert activity error:', err);
        }
      }

      // Local fallback
      const newAct = {
        ...payload,
        id: 'act-' + Date.now(),
        created_at: new Date().toISOString()
      };
      const acts = getLocalActivities();
      acts.unshift(newAct);
      saveLocalActivities(acts);
      return { success: true, data: newAct, source: 'local' };
    },

    // Sync all local leads to Supabase
    syncLocalToSupabase: async function () {
      const client = await initClient();
      if (!client || !isSupabaseReady) {
        return { success: false, message: 'Cannot sync: Supabase is not connected.' };
      }

      const localLeads = getLocalLeads();
      if (!localLeads.length) {
        return { success: true, message: 'No local leads to sync.' };
      }

      let syncedCount = 0;
      for (const lead of localLeads) {
        // Strip out local IDs
        const payload = {
          parent_name: lead.parent_name,
          student_name: lead.student_name,
          phone: lead.phone,
          email: lead.email,
          class_applying: lead.class_applying,
          lead_type: lead.lead_type || 'admission',
          subject: lead.subject,
          message: lead.message,
          status: lead.status || 'new',
          priority: lead.priority || 'medium',
          assigned_to: lead.assigned_to || 'Admissions Desk',
          source_page: lead.source_page || 'Website Sync',
          follow_up_date: lead.follow_up_date || null,
          academic_year: lead.academic_year || '2026-2027',
          tags: lead.tags || []
        };

        const { error } = await client.from('leads').insert([payload]);
        if (!error) syncedCount++;
      }

      return {
        success: true,
        message: `Successfully synchronized ${syncedCount} of ${localLeads.length} leads to Supabase!`
      };
    },

    // Realtime subscription (calls onNewLead when any new lead is inserted)
    subscribeToLeads: async function (callback) {
      const client = await initClient();
      if (!client || !isSupabaseReady) return null;

      try {
        const channel = client
          .channel('public:leads')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, payload => {
            if (typeof callback === 'function') callback(payload.new);
          })
          .subscribe();

        return channel;
      } catch (err) {
        console.warn('Realtime subscription failed:', err);
        return null;
      }
    },

    // Alert Email configuration
    getAlertEmail: function () {
      return localStorage.getItem(STORAGE_KEY_ALERT_EMAIL) || DEFAULT_ALERT_EMAIL;
    },

    setAlertEmail: function (email) {
      if (email && email.trim()) {
        localStorage.setItem(STORAGE_KEY_ALERT_EMAIL, email.trim());
      }
    },

    sendTestNotification: async function (targetEmail) {
      const email = targetEmail || this.getAlertEmail();
      return await sendEmailNotification({
        lead_type: 'System Test Alert',
        parent_name: 'Admissions Desk (Verification)',
        student_name: 'Sample Student Aarav',
        phone: '9839012345',
        email: email,
        class_applying: 'Middle School (Classes 6-8)',
        subject: 'Sunbeam School Email Notification Verification',
        message: 'This is a test notification confirming that instant enquiry alerts are operational and delivering to your email address!',
        source_page: 'Admissions CRM Settings',
        priority: 'high'
      });
    }
  };

  // Expose to window for global access
  window.SunbeamBackend = SunbeamBackend;

  // Initialize immediately on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    initClient();
  });
})();
