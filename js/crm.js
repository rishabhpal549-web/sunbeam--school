/**
 * Sunbeam English School, Bhagwanpur — Lead Management & Admissions CRM Engine
 * Built for Supabase Backend with Realtime Updates and Offline Resilience
 */

(function () {
  'use strict';

  // State
  let allLeads = [];
  let filteredLeads = [];
  let currentLead = null;
  let activeView = 'kanban';
  let selectedLeadIds = new Set();

  const filters = {
    search: '',
    status: 'all',
    leadType: 'all',
    grade: 'all',
    priority: 'all',
    counselor: 'all',
    todayOnly: false
  };

  // Pipeline stages configuration
  const STAGES = [
    { id: 'new', label: 'New Inquiries', icon: '📥', color: 'var(--status-new)' },
    { id: 'contacted', label: 'Contacted', icon: '📞', color: 'var(--status-contacted)' },
    { id: 'campus_visit', label: 'Campus Visit', icon: '🏫', color: 'var(--status-visit)' },
    { id: 'assessment', label: 'Assessment & Docs', icon: '📝', color: 'var(--status-assessment)' },
    { id: 'enrolled', label: 'Enrolled', icon: '🎓', color: 'var(--status-enrolled)' },
    { id: 'dropped', label: 'Dropped / Lost', icon: '❌', color: 'var(--status-dropped)' }
  ];

  // DOM Elements cache
  let dom = {};

  document.addEventListener('DOMContentLoaded', async () => {
    cacheDomElements();
    initEventListeners();
    initDragAndDrop();
    await checkBackendStatus();
    await loadLeads();
    setupRealtime();
  });

  function cacheDomElements() {
    dom = {
      // Header
      globalSearchInput: document.getElementById('globalSearchInput'),
      supabaseStatusBtn: document.getElementById('supabaseStatusBtn'),
      backendStatusDot: document.getElementById('backendStatusDot'),
      backendStatusText: document.getElementById('backendStatusText'),
      btnExportCsv: document.getElementById('btnExportCsv'),
      btnOpenNewLeadModal: document.getElementById('btnOpenNewLeadModal'),

      // KPI Elements
      kpiCards: document.querySelectorAll('.crm-kpi-card'),
      kpiTotalCount: document.getElementById('kpiTotalCount'),
      kpiNewCount: document.getElementById('kpiNewCount'),
      kpiContactedCount: document.getElementById('kpiContactedCount'),
      kpiVisitCount: document.getElementById('kpiVisitCount'),
      kpiEnrolledCount: document.getElementById('kpiEnrolledCount'),
      kpiConversionRate: document.getElementById('kpiConversionRate'),

      // Views
      tabKanbanBtn: document.getElementById('tabKanbanBtn'),
      tabTableBtn: document.getElementById('tabTableBtn'),
      tabAnalyticsBtn: document.getElementById('tabAnalyticsBtn'),
      kanbanView: document.getElementById('kanbanView'),
      tableView: document.getElementById('tableView'),
      analyticsView: document.getElementById('analyticsView'),

      // Filters
      filterLeadType: document.getElementById('filterLeadType'),
      filterGrade: document.getElementById('filterGrade'),
      filterPriority: document.getElementById('filterPriority'),
      filterCounselor: document.getElementById('filterCounselor'),
      filterTodayFollowup: document.getElementById('filterTodayFollowup'),
      btnResetFilters: document.getElementById('btnResetFilters'),

      // Table View Elements
      leadsTableBody: document.getElementById('leadsTableBody'),
      tableLeadCount: document.getElementById('tableLeadCount'),
      selectAllCheckbox: document.getElementById('selectAllCheckbox'),
      btnBulkStatusContacted: document.getElementById('btnBulkStatusContacted'),

      // Analytics View Elements
      funnelStepsContainer: document.getElementById('funnelStepsContainer'),
      gradeDistributionContainer: document.getElementById('gradeDistributionContainer'),
      sourceDistributionContainer: document.getElementById('sourceDistributionContainer'),

      // Lead Drawer Elements
      drawerOverlay: document.getElementById('drawerOverlay'),
      leadDrawer: document.getElementById('leadDrawer'),
      btnDrawerClose: document.getElementById('btnDrawerClose'),
      drawerLeadType: document.getElementById('drawerLeadType'),
      drawerStudentName: document.getElementById('drawerStudentName'),
      drawerParentSubtitle: document.getElementById('drawerParentSubtitle'),
      drawerBtnWhatsApp: document.getElementById('drawerBtnWhatsApp'),
      drawerBtnCall: document.getElementById('drawerBtnCall'),
      drawerBtnEmail: document.getElementById('drawerBtnEmail'),
      drawerStatusSelect: document.getElementById('drawerStatusSelect'),
      drawerPrioritySelect: document.getElementById('drawerPrioritySelect'),
      drawerCounselorSelect: document.getElementById('drawerCounselorSelect'),
      drawerFollowupInput: document.getElementById('drawerFollowupInput'),
      drawerClassApplying: document.getElementById('drawerClassApplying'),
      drawerPhone: document.getElementById('drawerPhone'),
      drawerEmail: document.getElementById('drawerEmail'),
      drawerSource: document.getElementById('drawerSource'),
      drawerCreatedAt: document.getElementById('drawerCreatedAt'),
      drawerMessage: document.getElementById('drawerMessage'),
      drawerTimeline: document.getElementById('drawerTimeline'),
      newActivityType: document.getElementById('newActivityType'),
      newActivityInput: document.getElementById('newActivityInput'),
      btnPostActivity: document.getElementById('btnPostActivity'),
      btnDeleteLead: document.getElementById('btnDeleteLead'),

      // New Lead Modal Elements
      newLeadModal: document.getElementById('newLeadModal'),
      btnCloseNewLeadModal: document.getElementById('btnCloseNewLeadModal'),
      btnCancelNewLead: document.getElementById('btnCancelNewLead'),
      newLeadForm: document.getElementById('newLeadForm'),

      // Supabase Modal Elements
      supabaseConfigModal: document.getElementById('supabaseConfigModal'),
      btnCloseSupabaseModal: document.getElementById('btnCloseSupabaseModal'),
      btnDoneSupabaseModal: document.getElementById('btnDoneSupabaseModal'),
      cfgSupabaseUrl: document.getElementById('cfgSupabaseUrl'),
      cfgSupabaseAnon: document.getElementById('cfgSupabaseAnon'),
      btnTestSupabase: document.getElementById('btnTestSupabase'),
      btnSyncLocalLeads: document.getElementById('btnSyncLocalLeads'),
      btnCopySqlSchema: document.getElementById('btnCopySqlSchema'),
      btnResetToDemo: document.getElementById('btnResetToDemo'),
      connectionStatusAlert: document.getElementById('connectionStatusAlert')
    };
  }

  function initEventListeners() {
    // Search
    if (dom.globalSearchInput) {
      dom.globalSearchInput.addEventListener('input', (e) => {
        filters.search = e.target.value.toLowerCase().trim();
        applyFilters();
      });
      // Shortcut Ctrl+/
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
          e.preventDefault();
          dom.globalSearchInput.focus();
        }
      });
    }

    // View Switching
    if (dom.tabKanbanBtn) dom.tabKanbanBtn.addEventListener('click', () => switchView('kanban'));
    if (dom.tabTableBtn) dom.tabTableBtn.addEventListener('click', () => switchView('table'));
    if (dom.tabAnalyticsBtn) dom.tabAnalyticsBtn.addEventListener('click', () => switchView('analytics'));

    // KPI Card Click Filtering
    dom.kpiCards.forEach(card => {
      card.addEventListener('click', () => {
        const status = card.getAttribute('data-filter-status');
        if (status) {
          dom.kpiCards.forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          filters.status = status;
          applyFilters();
        }
      });
    });

    // Filters
    if (dom.filterLeadType) {
      dom.filterLeadType.addEventListener('change', (e) => {
        filters.leadType = e.target.value;
        applyFilters();
      });
    }
    if (dom.filterGrade) {
      dom.filterGrade.addEventListener('change', (e) => {
        filters.grade = e.target.value;
        applyFilters();
      });
    }
    if (dom.filterPriority) {
      dom.filterPriority.addEventListener('change', (e) => {
        filters.priority = e.target.value;
        applyFilters();
      });
    }
    if (dom.filterCounselor) {
      dom.filterCounselor.addEventListener('change', (e) => {
        filters.counselor = e.target.value;
        applyFilters();
      });
    }
    if (dom.filterTodayFollowup) {
      dom.filterTodayFollowup.addEventListener('click', () => {
        filters.todayOnly = !filters.todayOnly;
        dom.filterTodayFollowup.classList.toggle('active', filters.todayOnly);
        applyFilters();
      });
    }
    if (dom.btnResetFilters) {
      dom.btnResetFilters.addEventListener('click', resetFilters);
    }

    // Drawer events
    if (dom.btnDrawerClose) dom.btnDrawerClose.addEventListener('click', closeDrawer);
    if (dom.drawerOverlay) dom.drawerOverlay.addEventListener('click', closeDrawer);

    if (dom.drawerStatusSelect) {
      dom.drawerStatusSelect.addEventListener('change', async (e) => {
        if (!currentLead) return;
        const newStatus = e.target.value;
        await updateLeadProperty(currentLead.id, { status: newStatus });
      });
    }
    if (dom.drawerPrioritySelect) {
      dom.drawerPrioritySelect.addEventListener('change', async (e) => {
        if (!currentLead) return;
        await updateLeadProperty(currentLead.id, { priority: e.target.value });
      });
    }
    if (dom.drawerCounselorSelect) {
      dom.drawerCounselorSelect.addEventListener('change', async (e) => {
        if (!currentLead) return;
        await updateLeadProperty(currentLead.id, { assigned_to: e.target.value });
      });
    }
    if (dom.drawerFollowupInput) {
      dom.drawerFollowupInput.addEventListener('change', async (e) => {
        if (!currentLead) return;
        await updateLeadProperty(currentLead.id, { follow_up_date: e.target.value });
      });
    }
    if (dom.btnPostActivity) dom.btnPostActivity.addEventListener('click', handlePostActivity);
    if (dom.btnDeleteLead) dom.btnDeleteLead.addEventListener('click', handleDeleteCurrentLead);

    // Export CSV
    if (dom.btnExportCsv) dom.btnExportCsv.addEventListener('click', exportToCsv);

    // New Lead Modal
    if (dom.btnOpenNewLeadModal) dom.btnOpenNewLeadModal.addEventListener('click', () => openModal(dom.newLeadModal));
    if (dom.btnCloseNewLeadModal) dom.btnCloseNewLeadModal.addEventListener('click', () => closeModal(dom.newLeadModal));
    if (dom.btnCancelNewLead) dom.btnCancelNewLead.addEventListener('click', () => closeModal(dom.newLeadModal));
    if (dom.newLeadForm) dom.newLeadForm.addEventListener('submit', handleNewLeadSubmit);

    // Supabase Settings Modal
    if (dom.supabaseStatusBtn) dom.supabaseStatusBtn.addEventListener('click', openSupabaseModal);
    if (dom.btnCloseSupabaseModal) dom.btnCloseSupabaseModal.addEventListener('click', () => closeModal(dom.supabaseConfigModal));
    if (dom.btnDoneSupabaseModal) dom.btnDoneSupabaseModal.addEventListener('click', () => closeModal(dom.supabaseConfigModal));
    if (dom.btnTestSupabase) dom.btnTestSupabase.addEventListener('click', handleTestSupabase);
    if (dom.btnSyncLocalLeads) dom.btnSyncLocalLeads.addEventListener('click', handleSyncLocalLeads);
    if (dom.btnCopySqlSchema) dom.btnCopySqlSchema.addEventListener('click', handleCopySqlSchema);
    if (dom.btnResetToDemo) dom.btnResetToDemo.addEventListener('click', handleLoadDemoData);

    // Email Alert Settings Modal Controls
    const emailAlertBtn = document.getElementById('emailAlertStatusBtn');
    const emailAlertModal = document.getElementById('emailAlertModal');
    const btnCloseEmailAlertModal = document.getElementById('btnCloseEmailAlertModal');
    const btnCloseAlertModalBottom = document.getElementById('btnCloseAlertModalBottom');
    const btnSaveAlertEmail = document.getElementById('btnSaveAlertEmail');
    const btnSendTestAlert = document.getElementById('btnSendTestAlert');
    const cfgAlertEmail = document.getElementById('cfgAlertEmail');
    const emailAlertStatusText = document.getElementById('emailAlertStatusText');

    function updateEmailAlertLabel() {
      if (window.SunbeamBackend && emailAlertStatusText) {
        const curEmail = window.SunbeamBackend.getAlertEmail();
        emailAlertStatusText.textContent = `Email: ${curEmail}`;
        if (cfgAlertEmail) cfgAlertEmail.value = curEmail;
      }
    }
    updateEmailAlertLabel();

    if (emailAlertBtn) emailAlertBtn.addEventListener('click', () => {
      updateEmailAlertLabel();
      openModal(emailAlertModal);
    });
    if (btnCloseEmailAlertModal) btnCloseEmailAlertModal.addEventListener('click', () => closeModal(emailAlertModal));
    if (btnCloseAlertModalBottom) btnCloseAlertModalBottom.addEventListener('click', () => closeModal(emailAlertModal));

    if (btnSaveAlertEmail) {
      btnSaveAlertEmail.addEventListener('click', () => {
        const emailVal = cfgAlertEmail.value.trim();
        if (!emailVal || !emailVal.includes('@')) {
          showCrmToast('Please enter a valid email address.', 'error');
          return;
        }
        window.SunbeamBackend.setAlertEmail(emailVal);
        updateEmailAlertLabel();
        showCrmToast(`✓ Alert email set to: ${emailVal}`, 'success');
        closeModal(emailAlertModal);
      });
    }

    if (btnSendTestAlert) {
      btnSendTestAlert.addEventListener('click', async () => {
        const emailVal = cfgAlertEmail.value.trim();
        if (!emailVal || !emailVal.includes('@')) {
          showCrmToast('Please enter a valid email address first.', 'error');
          return;
        }
        btnSendTestAlert.disabled = true;
        btnSendTestAlert.textContent = 'Sending Test...';
        showCrmToast('Dispatching test alert to your email...', 'info');

        try {
          const res = await window.SunbeamBackend.sendTestNotification(emailVal);
          if (res.success) {
            showCrmToast(`✓ Test alert sent to ${emailVal}! Check inbox to confirm.`, 'success');
          } else {
            showCrmToast('Notice: Sent via FormSubmit. Please check your inbox for activation email.', 'info');
          }
        } catch (e) {
          showCrmToast('Test sent! Please check your inbox.', 'info');
        } finally {
          btnSendTestAlert.disabled = false;
          btnSendTestAlert.textContent = '📨 Send Test Notification';
        }
      });
    }

    // Bulk selection in table view
    if (dom.selectAllCheckbox) {
      dom.selectAllCheckbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        document.querySelectorAll('.table-row-checkbox').forEach(cb => {
          cb.checked = isChecked;
          const leadId = cb.getAttribute('data-lead-id');
          if (isChecked) selectedLeadIds.add(leadId);
          else selectedLeadIds.delete(leadId);
        });
      });
    }
    if (dom.btnBulkStatusContacted) {
      dom.btnBulkStatusContacted.addEventListener('click', async () => {
        if (!selectedLeadIds.size) {
          showCrmToast('Please select at least one lead from the table first.', 'info');
          return;
        }
        for (const id of selectedLeadIds) {
          await window.SunbeamBackend.updateLead(id, { status: 'contacted' });
        }
        showCrmToast(`Updated ${selectedLeadIds.size} leads to "Contacted" stage!`, 'success');
        selectedLeadIds.clear();
        if (dom.selectAllCheckbox) dom.selectAllCheckbox.checked = false;
        await loadLeads();
      });
    }
  }

  // Check Backend Status
  async function checkBackendStatus() {
    if (!window.SunbeamBackend) return;
    const isConfigured = window.SunbeamBackend.isConfigured();
    const creds = window.SunbeamBackend.getCredentials();

    if (dom.cfgSupabaseUrl) dom.cfgSupabaseUrl.value = creds.url || '';
    if (dom.cfgSupabaseAnon) dom.cfgSupabaseAnon.value = creds.anonKey || '';

    if (isConfigured) {
      const res = await window.SunbeamBackend.testConnection(creds.url, creds.anonKey);
      if (res.success) {
        if (res.needsSchema) {
          setBackendStatusUI('supabase', 'Supabase Connected (Setup Schema)');
          if (dom.connectionStatusAlert) {
            dom.connectionStatusAlert.style.background = '#FEF3C7';
            dom.connectionStatusAlert.style.borderColor = '#FCD34D';
            dom.connectionStatusAlert.style.color = '#92400E';
            dom.connectionStatusAlert.innerHTML = '<strong>🟢 Connected to Supabase Project!</strong> Database is connected, but the <code>leads</code> table is not initialized yet. Copy the SQL script below and run it in the Supabase SQL Editor to finish setup.';
          }
        } else {
          setBackendStatusUI('supabase', 'Live Supabase Connected');
        }
      } else {
        setBackendStatusUI('local', 'Offline / Local Database');
      }
    } else {
      setBackendStatusUI('local', 'Offline Demo Mode (Click to Connect)');
    }
  }

  function setBackendStatusUI(type, text) {
    if (!dom.backendStatusDot || !dom.backendStatusText) return;
    dom.backendStatusText.textContent = text;
    if (type === 'supabase') {
      dom.backendStatusDot.className = 'crm-status-dot pulse';
      dom.backendStatusDot.style.background = '#10B981';
      if (dom.connectionStatusAlert) {
        dom.connectionStatusAlert.style.background = '#ECFDF5';
        dom.connectionStatusAlert.style.borderColor = '#A7F3D0';
        dom.connectionStatusAlert.style.color = '#065F46';
        dom.connectionStatusAlert.innerHTML = '<strong>🟢 Connected:</strong> Supabase PostgreSQL Database is live and syncing with realtime.';
      }
    } else {
      dom.backendStatusDot.className = 'crm-status-dot local';
      dom.backendStatusDot.style.background = '#F59E0B';
      if (dom.connectionStatusAlert) {
        dom.connectionStatusAlert.style.background = '#FFFBEB';
        dom.connectionStatusAlert.style.borderColor = '#FDE68A';
        dom.connectionStatusAlert.style.color = '#92400E';
        dom.connectionStatusAlert.innerHTML = '<strong>🟡 Local / Demo Mode:</strong> Inquiries are safely stored in browser storage. Enter Supabase URL &amp; Anon Key to switch to live PostgreSQL.';
      }
    }
  }

  // Load leads from backend
  async function loadLeads() {
    if (!window.SunbeamBackend) return;
    const res = await window.SunbeamBackend.getLeads();
    if (res && res.success && Array.isArray(res.data)) {
      allLeads = res.data;
      updateKpis();
      applyFilters();
    }
  }

  // Setup Realtime WebSocket Listener
  function setupRealtime() {
    if (!window.SunbeamBackend || typeof window.SunbeamBackend.subscribeToLeads !== 'function') return;
    window.SunbeamBackend.subscribeToLeads((newLead) => {
      showCrmToast(`🔔 New Lead Received: ${newLead.student_name || newLead.parent_name} (${newLead.class_applying || 'General'})`, 'success');
      // Add or update lead in list
      const idx = allLeads.findIndex(l => l.id === newLead.id);
      if (idx !== -1) {
        allLeads[idx] = newLead;
      } else {
        allLeads.unshift(newLead);
      }
      updateKpis();
      applyFilters();
    });
  }

  // Update KPI metric numbers
  function updateKpis() {
    const total = allLeads.length;
    const newCount = allLeads.filter(l => l.status === 'new').length;
    const contactedCount = allLeads.filter(l => l.status === 'contacted').length;
    const visitCount = allLeads.filter(l => l.status === 'campus_visit').length;
    const enrolledCount = allLeads.filter(l => l.status === 'enrolled').length;
    const conversion = total > 0 ? ((enrolledCount / total) * 100).toFixed(1) : 0;

    if (dom.kpiTotalCount) dom.kpiTotalCount.textContent = total;
    if (dom.kpiNewCount) dom.kpiNewCount.textContent = newCount;
    if (dom.kpiContactedCount) dom.kpiContactedCount.textContent = contactedCount;
    if (dom.kpiVisitCount) dom.kpiVisitCount.textContent = visitCount;
    if (dom.kpiEnrolledCount) dom.kpiEnrolledCount.textContent = enrolledCount;
    if (dom.kpiConversionRate) dom.kpiConversionRate.textContent = `${conversion}%`;
  }

  // Filter and Search logic
  function applyFilters() {
    const todayStr = new Date().toISOString().split('T')[0];

    filteredLeads = allLeads.filter(lead => {
      // Search
      if (filters.search) {
        const query = filters.search;
        const student = (lead.student_name || '').toLowerCase();
        const parent = (lead.parent_name || '').toLowerCase();
        const phone = (lead.phone || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        const grade = (lead.class_applying || '').toLowerCase();
        const msg = (lead.message || '').toLowerCase();

        if (!student.includes(query) && !parent.includes(query) && !phone.includes(query) && !email.includes(query) && !grade.includes(query) && !msg.includes(query)) {
          return false;
        }
      }

      // Status
      if (filters.status !== 'all' && lead.status !== filters.status) {
        return false;
      }

      // Lead Type
      if (filters.leadType !== 'all' && lead.lead_type !== filters.leadType) {
        return false;
      }

      // Grade
      if (filters.grade !== 'all') {
        const gradeStr = lead.class_applying || '';
        if (!gradeStr.includes(filters.grade)) return false;
      }

      // Priority
      if (filters.priority !== 'all' && lead.priority !== filters.priority) {
        return false;
      }

      // Counselor
      if (filters.counselor !== 'all' && lead.assigned_to !== filters.counselor) {
        return false;
      }

      // Today follow up
      if (filters.todayOnly) {
        if (!lead.follow_up_date || lead.follow_up_date !== todayStr) {
          return false;
        }
      }

      return true;
    });

    renderCurrentView();
  }

  function resetFilters() {
    filters.search = '';
    filters.status = 'all';
    filters.leadType = 'all';
    filters.grade = 'all';
    filters.priority = 'all';
    filters.counselor = 'all';
    filters.todayOnly = false;

    if (dom.globalSearchInput) dom.globalSearchInput.value = '';
    if (dom.filterLeadType) dom.filterLeadType.value = 'all';
    if (dom.filterGrade) dom.filterGrade.value = 'all';
    if (dom.filterPriority) dom.filterPriority.value = 'all';
    if (dom.filterCounselor) dom.filterCounselor.value = 'all';
    if (dom.filterTodayFollowup) dom.filterTodayFollowup.classList.remove('active');

    dom.kpiCards.forEach(c => c.classList.remove('active'));
    const totalCard = document.querySelector('.crm-kpi-card.kpi-total');
    if (totalCard) totalCard.classList.add('active');

    applyFilters();
  }

  function switchView(viewName) {
    activeView = viewName;

    // Buttons
    if (dom.tabKanbanBtn) dom.tabKanbanBtn.classList.toggle('active', viewName === 'kanban');
    if (dom.tabTableBtn) dom.tabTableBtn.classList.toggle('active', viewName === 'table');
    if (dom.tabAnalyticsBtn) dom.tabAnalyticsBtn.classList.toggle('active', viewName === 'analytics');

    // Containers
    if (dom.kanbanView) dom.kanbanView.style.display = viewName === 'kanban' ? 'grid' : 'none';
    if (dom.tableView) dom.tableView.style.display = viewName === 'table' ? 'block' : 'none';
    if (dom.analyticsView) dom.analyticsView.style.display = viewName === 'analytics' ? 'block' : 'none';

    renderCurrentView();
  }

  function renderCurrentView() {
    if (activeView === 'kanban') {
      renderKanban();
    } else if (activeView === 'table') {
      renderTable();
    } else if (activeView === 'analytics') {
      renderAnalytics();
    }
  }

  // =========================================================================
  // VIEW 1: KANBAN RENDERING
  // =========================================================================
  function renderKanban() {
    STAGES.forEach(stage => {
      const container = document.getElementById(`colCards-${stage.id}`);
      const countBadge = document.getElementById(`count-${stage.id}`);
      if (!container) return;

      const stageLeads = filteredLeads.filter(l => (l.status || 'new') === stage.id);
      if (countBadge) countBadge.textContent = stageLeads.length;

      container.innerHTML = '';

      if (stageLeads.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 2rem 1rem; color: var(--crm-text-light); font-size: 0.78rem;">
            No inquiries in this stage
          </div>
        `;
        return;
      }

      stageLeads.forEach(lead => {
        const card = createKanbanCard(lead);
        container.appendChild(card);
      });
    });
  }

  function createKanbanCard(lead) {
    const card = document.createElement('div');
    card.className = 'lead-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', lead.id);

    // Dates
    const timeAgo = formatTimeAgo(lead.created_at);
    const followupAlert = checkFollowupDate(lead.follow_up_date);

    // Display student or parent
    const primaryName = lead.student_name || lead.parent_name || 'Enquiry';
    const secondaryName = lead.student_name ? `Parent: ${lead.parent_name}` : `Phone: ${lead.phone}`;
    const priorityClass = `priority-${lead.priority || 'medium'}`;

    // WhatsApp prefilled message
    const waText = encodeURIComponent(
      `Dear ${lead.parent_name}, Greetings from Sunbeam English School, Bhagwanpur. We received your admission inquiry for ${lead.student_name || 'your child'} (${lead.class_applying || 'General'}). How may our admissions counseling desk assist you today?`
    );
    const waLink = `https://wa.me/91${lead.phone.replace(/\D/g, '')}?text=${waText}`;

    card.innerHTML = `
      <div class="lead-card-header">
        <span class="lead-type-tag ${lead.lead_type === 'contact' ? 'contact' : 'admission'}">
          ${lead.lead_type === 'contact' ? '✉️ Contact' : '🎓 Admission'}
        </span>
        <span class="priority-pill ${priorityClass}">${lead.priority || 'medium'}</span>
      </div>

      <div>
        <div class="lead-card-student">${escapeHtml(primaryName)}</div>
        <div class="lead-card-parent">${escapeHtml(secondaryName)}</div>
      </div>

      ${lead.class_applying ? `<div class="lead-card-class">📚 ${escapeHtml(lead.class_applying)}</div>` : ''}

      <div class="lead-card-meta">
        <span>🕒 ${timeAgo}</span>
        ${followupAlert}
      </div>

      <div class="lead-card-actions">
        <div class="quick-action-btns">
          <a href="${waLink}" target="_blank" rel="noopener" class="btn-card-action btn-wa" title="WhatsApp Parent">💬</a>
          <a href="tel:${lead.phone}" class="btn-card-action" title="Call Parent">📞</a>
          <button class="btn-card-action btn-view-lead" title="View Full Details">👁️</button>
        </div>
        <span style="font-size: 0.72rem; color: var(--crm-text-muted); font-weight: 500;">
          ${escapeHtml(lead.assigned_to || 'Desk')}
        </span>
      </div>
    `;

    // Click to open drawer
    card.querySelector('.btn-view-lead').addEventListener('click', (e) => {
      e.stopPropagation();
      openLeadDrawer(lead);
    });

    card.addEventListener('click', () => {
      openLeadDrawer(lead);
    });

    // Drag events
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', lead.id);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    return card;
  }

  // Drag and Drop between Kanban Columns
  function initDragAndDrop() {
    const columns = document.querySelectorAll('.kanban-col');
    columns.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.style.background = '#E2E8F0';
      });

      col.addEventListener('dragleave', () => {
        col.style.background = '';
      });

      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.style.background = '';
        const leadId = e.dataTransfer.getData('text/plain');
        const targetStatus = col.getAttribute('data-status');

        if (leadId && targetStatus) {
          const lead = allLeads.find(l => l.id === leadId);
          if (lead && lead.status !== targetStatus) {
            await updateLeadProperty(leadId, { status: targetStatus });
            showCrmToast(`Moved to ${targetStatus.replace('_', ' ').toUpperCase()}`, 'success');
          }
        }
      });
    });
  }

  // =========================================================================
  // VIEW 2: TABLE RENDERING
  // =========================================================================
  function renderTable() {
    if (!dom.leadsTableBody) return;
    dom.leadsTableBody.innerHTML = '';
    if (dom.tableLeadCount) dom.tableLeadCount.textContent = filteredLeads.length;

    if (filteredLeads.length === 0) {
      dom.leadsTableBody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align: center; padding: 2.5rem; color: var(--crm-text-muted);">
            No inquiries match your current filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    filteredLeads.forEach(lead => {
      const tr = document.createElement('tr');
      const waText = encodeURIComponent(
        `Dear ${lead.parent_name}, Greetings from Sunbeam English School, Bhagwanpur. Regarding your inquiry for ${lead.student_name || 'your child'}:`
      );
      const waLink = `https://wa.me/91${lead.phone.replace(/\D/g, '')}?text=${waText}`;

      tr.innerHTML = `
        <td>
          <input type="checkbox" class="table-row-checkbox" data-lead-id="${lead.id}" ${selectedLeadIds.has(lead.id) ? 'checked' : ''}>
        </td>
        <td>
          <div class="table-student-cell">
            <span class="table-student-name">${escapeHtml(lead.student_name || lead.parent_name)}</span>
            ${lead.student_name ? `<span class="table-parent-name">Parent: ${escapeHtml(lead.parent_name)}</span>` : ''}
          </div>
        </td>
        <td>
          <span style="font-weight: 500;">${escapeHtml(lead.class_applying || 'General')}</span>
        </td>
        <td>
          <div>📞 ${escapeHtml(lead.phone)}</div>
          ${lead.email ? `<div style="font-size: 0.74rem; color: var(--crm-text-muted);">✉️ ${escapeHtml(lead.email)}</div>` : ''}
        </td>
        <td>
          <select class="crm-select inline-status-select" data-id="${lead.id}" style="font-size: 0.76rem; padding: 0.25rem 0.5rem;">
            ${STAGES.map(s => `<option value="${s.id}" ${lead.status === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>
        </td>
        <td>
          <span class="priority-pill priority-${lead.priority || 'medium'}">${lead.priority || 'medium'}</span>
        </td>
        <td>
          ${lead.follow_up_date ? escapeHtml(lead.follow_up_date) : '<span style="color: var(--crm-text-light);">-</span>'}
        </td>
        <td>
          <span style="font-size: 0.8rem;">${escapeHtml(lead.assigned_to || 'Desk')}</span>
        </td>
        <td>
          <span style="font-size: 0.74rem; color: var(--crm-text-muted);">${escapeHtml(lead.source_page || 'Web')}</span>
        </td>
        <td>
          <span style="font-size: 0.74rem; color: var(--crm-text-muted);">${formatDate(lead.created_at)}</span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 0.35rem;">
            <a href="${waLink}" target="_blank" rel="noopener" class="btn-card-action btn-wa" title="WhatsApp">💬</a>
            <a href="tel:${lead.phone}" class="btn-card-action" title="Call">📞</a>
            <button class="btn-card-action btn-table-details" title="Details">👁️</button>
          </div>
        </td>
      `;

      // Checkbox
      const cb = tr.querySelector('.table-row-checkbox');
      cb.addEventListener('change', (e) => {
        if (e.target.checked) selectedLeadIds.add(lead.id);
        else selectedLeadIds.delete(lead.id);
      });

      // Inline status select
      const sel = tr.querySelector('.inline-status-select');
      sel.addEventListener('change', async (e) => {
        await updateLeadProperty(lead.id, { status: e.target.value });
      });

      // View details
      tr.querySelector('.btn-table-details').addEventListener('click', () => {
        openLeadDrawer(lead);
      });

      dom.leadsTableBody.appendChild(tr);
    });
  }

  // =========================================================================
  // VIEW 3: ANALYTICS & FUNNEL RENDERING
  // =========================================================================
  function renderAnalytics() {
    if (!dom.funnelStepsContainer) return;

    const total = allLeads.length || 1;
    const stagesData = [
      { label: 'Total Inquiries Received', count: allLeads.length, color: 'var(--status-new)' },
      { label: 'Contacted & In Review', count: allLeads.filter(l => l.status !== 'new' && l.status !== 'dropped').length, color: 'var(--status-contacted)' },
      { label: 'Campus Visits Scheduled', count: allLeads.filter(l => ['campus_visit', 'assessment', 'enrolled'].includes(l.status)).length, color: 'var(--status-visit)' },
      { label: 'Evaluations & Assessments', count: allLeads.filter(l => ['assessment', 'enrolled'].includes(l.status)).length, color: 'var(--status-assessment)' },
      { label: 'Admissions Finalized (Enrolled)', count: allLeads.filter(l => l.status === 'enrolled').length, color: 'var(--status-enrolled)' }
    ];

    dom.funnelStepsContainer.innerHTML = stagesData.map(step => {
      const pct = Math.round((step.count / total) * 100);
      return `
        <div class="funnel-step">
          <div class="funnel-step-header">
            <span>${step.label}</span>
            <span><strong>${step.count}</strong> (${pct}%)</span>
          </div>
          <div class="funnel-step-progress-bg">
            <div class="funnel-step-progress-fill" style="width: ${pct}%; background: ${step.color};"></div>
          </div>
        </div>
      `;
    }).join('');

    // Grade Distribution
    if (dom.gradeDistributionContainer) {
      const grades = {};
      allLeads.forEach(l => {
        const g = l.class_applying || 'General / Unspecified';
        grades[g] = (grades[g] || 0) + 1;
      });

      dom.gradeDistributionContainer.innerHTML = Object.entries(grades).map(([gName, count]) => {
        const pct = Math.round((count / total) * 100);
        return `
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.2rem;">
              <span>${escapeHtml(gName)}</span>
              <strong>${count} (${pct}%)</strong>
            </div>
            <div style="height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: ${pct}%; background: var(--crm-primary-light);"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Lead Sources
    if (dom.sourceDistributionContainer) {
      const sources = {};
      allLeads.forEach(l => {
        const s = l.source_page || 'Website';
        sources[s] = (sources[s] || 0) + 1;
      });

      dom.sourceDistributionContainer.innerHTML = Object.entries(sources).map(([sName, count]) => {
        const pct = Math.round((count / total) * 100);
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; padding: 0.35rem 0; border-bottom: 1px dashed var(--crm-border-subtle);">
            <span>🌐 ${escapeHtml(sName)}</span>
            <span style="font-weight: 700; color: var(--crm-primary);">${count} leads</span>
          </div>
        `;
      }).join('');
    }
  }

  // =========================================================================
  // LEAD DETAIL & ACTIVITY DRAWER
  // =========================================================================
  async function openLeadDrawer(lead) {
    currentLead = lead;
    if (!dom.leadDrawer || !dom.drawerOverlay) return;

    dom.drawerLeadType.textContent = lead.lead_type === 'contact' ? 'General Enquiry' : 'Admission Enquiry';
    dom.drawerStudentName.textContent = lead.student_name || lead.parent_name || 'Enquiry Details';
    dom.drawerParentSubtitle.textContent = lead.student_name ? `Parent / Guardian: ${lead.parent_name}` : `Contact: ${lead.parent_name}`;

    // Action Links
    const waText = encodeURIComponent(
      `Dear ${lead.parent_name}, Greetings from Sunbeam English School, Bhagwanpur. We are contacting you regarding the admission enquiry for ${lead.student_name || 'your child'}:`
    );
    dom.drawerBtnWhatsApp.href = `https://wa.me/91${lead.phone.replace(/\D/g, '')}?text=${waText}`;
    dom.drawerBtnCall.href = `tel:${lead.phone}`;
    dom.drawerBtnEmail.href = lead.email ? `mailto:${lead.email}?subject=Sunbeam%20English%20School%20Admissions` : '#';

    // Form fields
    dom.drawerStatusSelect.value = lead.status || 'new';
    dom.drawerPrioritySelect.value = lead.priority || 'medium';
    dom.drawerCounselorSelect.value = lead.assigned_to || 'Admissions Desk';
    dom.drawerFollowupInput.value = lead.follow_up_date || '';

    // Profile details
    dom.drawerClassApplying.textContent = lead.class_applying || 'Not Specified';
    dom.drawerPhone.textContent = lead.phone || '--';
    dom.drawerEmail.textContent = lead.email || 'None provided';
    dom.drawerSource.textContent = lead.source_page || 'Website';
    dom.drawerCreatedAt.textContent = formatDate(lead.created_at, true);
    dom.drawerMessage.textContent = lead.message || 'No specific queries or remarks submitted.';

    // Load activities
    await loadDrawerActivities(lead.id);

    dom.drawerOverlay.classList.add('active');
    dom.leadDrawer.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (dom.leadDrawer) dom.leadDrawer.classList.remove('active');
    if (dom.drawerOverlay) dom.drawerOverlay.classList.remove('active');
    document.body.style.overflow = '';
    currentLead = null;
  }

  async function loadDrawerActivities(leadId) {
    if (!dom.drawerTimeline || !window.SunbeamBackend) return;
    dom.drawerTimeline.innerHTML = '<div style="font-size: 0.78rem; color: var(--crm-text-light);">Loading activity logs...</div>';

    const res = await window.SunbeamBackend.getLeadActivities(leadId);
    if (!res || !res.success || !res.data.length) {
      dom.drawerTimeline.innerHTML = '<div style="font-size: 0.78rem; color: var(--crm-text-light);">No activity recorded yet. Post a note above to start the log.</div>';
      return;
    }

    const icons = {
      note: '📝',
      call: '📞',
      whatsapp: '💬',
      campus_visit: '🏫',
      status_change: '🔄',
      email: '✉️'
    };

    dom.drawerTimeline.innerHTML = res.data.map(act => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-time">
          ${icons[act.activity_type] || '📌'} ${escapeHtml(act.author || 'Counselor')} &bull; ${formatTimeAgo(act.created_at)}
        </div>
        <div class="timeline-content">
          ${escapeHtml(act.content)}
        </div>
      </div>
    `).join('');
  }

  async function handlePostActivity() {
    if (!currentLead || !dom.newActivityInput) return;
    const content = dom.newActivityInput.value.trim();
    if (!content) return;

    const activityType = dom.newActivityType ? dom.newActivityType.value : 'note';
    const counselor = dom.drawerCounselorSelect ? dom.drawerCounselorSelect.value : 'Admissions Counselor';

    dom.btnPostActivity.disabled = true;
    dom.btnPostActivity.textContent = 'Posting...';

    await window.SunbeamBackend.addLeadActivity(currentLead.id, {
      activity_type: activityType,
      author: counselor,
      content: content
    });

    dom.newActivityInput.value = '';
    dom.btnPostActivity.disabled = false;
    dom.btnPostActivity.textContent = 'Post Activity Log';

    await loadDrawerActivities(currentLead.id);
    showCrmToast('Activity logged successfully!', 'success');
  }

  async function updateLeadProperty(leadId, updates) {
    if (!window.SunbeamBackend) return;
    const res = await window.SunbeamBackend.updateLead(leadId, updates);
    if (res && res.success) {
      // Update in memory
      const idx = allLeads.findIndex(l => l.id === leadId);
      if (idx !== -1) {
        allLeads[idx] = { ...allLeads[idx], ...updates };
      }
      if (currentLead && currentLead.id === leadId) {
        currentLead = { ...currentLead, ...updates };
      }
      updateKpis();
      applyFilters();
    }
  }

  async function handleDeleteCurrentLead() {
    if (!currentLead) return;
    if (!confirm(`Are you sure you want to permanently delete lead for "${currentLead.student_name || currentLead.parent_name}"?`)) {
      return;
    }

    const id = currentLead.id;
    await window.SunbeamBackend.deleteLead(id);
    allLeads = allLeads.filter(l => l.id !== id);
    closeDrawer();
    updateKpis();
    applyFilters();
    showCrmToast('Lead record removed.', 'info');
  }

  // =========================================================================
  // NEW LEAD MODAL (MANUAL ENTRY)
  // =========================================================================
  async function handleNewLeadSubmit(e) {
    e.preventDefault();
    const parentName = document.getElementById('manualParentName').value.trim();
    const studentName = document.getElementById('manualStudentName').value.trim();
    const phone = document.getElementById('manualPhone').value.trim();
    const email = document.getElementById('manualEmail').value.trim();
    const classApplying = document.getElementById('manualClass').value;
    const source = document.getElementById('manualSource').value;
    const priority = document.getElementById('manualPriority').value;
    const counselor = document.getElementById('manualCounselor').value;
    const message = document.getElementById('manualMessage').value.trim();

    const payload = {
      lead_type: 'admission',
      parent_name: parentName,
      student_name: studentName,
      phone: phone,
      email: email,
      class_applying: classApplying,
      source_page: source,
      priority: priority,
      assigned_to: counselor,
      message: message,
      status: 'new'
    };

    const res = await window.SunbeamBackend.createLead(payload);
    if (res && res.success) {
      allLeads.unshift(res.data);
      updateKpis();
      applyFilters();
      closeModal(dom.newLeadModal);
      dom.newLeadForm.reset();
      showCrmToast(`✓ New Lead for ${studentName || parentName} added successfully!`, 'success');
    }
  }

  // =========================================================================
  // SUPABASE CONFIGURATION MODAL & SYNC
  // =========================================================================
  function openSupabaseModal() {
    const creds = window.SunbeamBackend.getCredentials();
    if (dom.cfgSupabaseUrl) dom.cfgSupabaseUrl.value = creds.url;
    if (dom.cfgSupabaseAnon) dom.cfgSupabaseAnon.value = creds.anonKey;
    openModal(dom.supabaseConfigModal);
  }

  async function handleTestSupabase() {
    const url = dom.cfgSupabaseUrl.value.trim();
    const key = dom.cfgSupabaseAnon.value.trim();

    if (!url || !key) {
      alert('Please enter both Supabase Project URL and Anon Public Key.');
      return;
    }

    dom.btnTestSupabase.disabled = true;
    dom.btnTestSupabase.textContent = 'Testing Connection...';

    const testRes = await window.SunbeamBackend.testConnection(url, key);
    dom.btnTestSupabase.disabled = false;
    dom.btnTestSupabase.textContent = 'Test & Save Supabase Connection';

    if (testRes.success) {
      await window.SunbeamBackend.saveCredentials(url, key);
      if (testRes.needsSchema) {
        setBackendStatusUI('supabase', 'Supabase Connected (Needs Schema)');
        if (dom.connectionStatusAlert) {
          dom.connectionStatusAlert.style.background = '#FEF3C7';
          dom.connectionStatusAlert.style.borderColor = '#FCD34D';
          dom.connectionStatusAlert.style.color = '#92400E';
          dom.connectionStatusAlert.innerHTML = '<strong>🟢 Connected to Supabase Project!</strong> Project credentials verified! The <code>leads</code> table needs to be created. Click <strong>Copy SQL Schema</strong> below and paste it into your Supabase SQL Editor.';
        }
        showCrmToast('Project Connected! Run schema.sql in Supabase SQL editor to create tables.', 'info');
      } else {
        setBackendStatusUI('supabase', 'Live Supabase Connected');
        showCrmToast('Connected successfully to Supabase PostgreSQL!', 'success');
      }
      await loadLeads();
    } else {
      alert(`Supabase Connection Failed:\n\n${testRes.message}\n\nPlease verify your URL and Anon Key and ensure supabase/schema.sql has been run in Supabase SQL editor.`);
    }
  }

  async function handleSyncLocalLeads() {
    dom.btnSyncLocalLeads.disabled = true;
    dom.btnSyncLocalLeads.textContent = 'Syncing...';

    const res = await window.SunbeamBackend.syncLocalToSupabase();
    dom.btnSyncLocalLeads.disabled = false;
    dom.btnSyncLocalLeads.textContent = '🔄 Sync Offline Inquiries to Supabase';

    if (res.success) {
      showCrmToast(res.message, 'success');
      await loadLeads();
    } else {
      alert(res.message);
    }
  }

  function handleCopySqlSchema() {
    // Read schema or provide copyable content
    const schemaSql = `-- Sunbeam English School, Bhagwanpur Schema
-- Check supabase/schema.sql in the project root for the full schema.
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  lead_type TEXT NOT NULL DEFAULT 'admission',
  parent_name TEXT NOT NULL,
  student_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  class_applying TEXT,
  subject TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to TEXT DEFAULT 'Admissions Desk',
  follow_up_date DATE,
  source_page TEXT DEFAULT 'Website'
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can submit enquiries" ON public.leads FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow select on leads" ON public.leads FOR SELECT TO public USING (true);
CREATE POLICY "Allow update on leads" ON public.leads FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on leads" ON public.leads FOR DELETE TO public USING (true);`;

    navigator.clipboard.writeText(schemaSql).then(() => {
      showCrmToast('SQL schema copied to clipboard! Paste into Supabase SQL Editor.', 'success');
    }).catch(() => {
      showCrmToast('Please copy from supabase/schema.sql in the project folder.', 'info');
    });
  }

  function handleLoadDemoData() {
    localStorage.removeItem('sunbeam_local_leads');
    localStorage.removeItem('sunbeam_local_activities');
    showCrmToast('Reset to demo Varanasi admission seed inquiries.', 'info');
    setTimeout(() => window.location.reload(), 600);
  }

  // =========================================================================
  // EXPORT CSV
  // =========================================================================
  function exportToCsv() {
    if (!filteredLeads.length) {
      showCrmToast('No leads available to export.', 'info');
      return;
    }

    const headers = ['Lead ID', 'Received Date', 'Type', 'Student Name', 'Parent Name', 'Phone', 'Email', 'Class Applying', 'Status', 'Priority', 'Counselor', 'Follow-up Date', 'Source Page', 'Message'];
    const rows = filteredLeads.map(l => [
      l.id,
      l.created_at,
      l.lead_type || 'admission',
      `"${(l.student_name || '').replace(/"/g, '""')}"`,
      `"${(l.parent_name || '').replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      l.email || '',
      `"${(l.class_applying || '').replace(/"/g, '""')}"`,
      l.status || 'new',
      l.priority || 'medium',
      `"${l.assigned_to || ''}"`,
      l.follow_up_date || '',
      `"${(l.source_page || '').replace(/"/g, '""')}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sunbeam_leads_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showCrmToast('CSV exported successfully!', 'success');
  }

  // =========================================================================
  // UTILITY HELPERS
  // =========================================================================
  function openModal(modal) {
    if (modal) modal.classList.add('active');
  }

  function closeModal(modal) {
    if (modal) modal.classList.remove('active');
  }

  function showCrmToast(message, type = 'success') {
    if (window.showToast) {
      window.showToast(message, type);
      return;
    }
    const container = document.getElementById('crmToastContainer') || document.body;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #063B66; color: #fff; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.2); z-index: 1000; font-size: 0.88rem;';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  function formatTimeAgo(isoString) {
    if (!isoString) return '--';
    const date = new Date(isoString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);

    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    if (diffSecs < 172800) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  function formatDate(isoString, includeTime = false) {
    if (!isoString) return '--';
    const d = new Date(isoString);
    if (includeTime) {
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function checkFollowupDate(dateStr) {
    if (!dateStr) return '';
    const today = new Date().toISOString().split('T')[0];
    if (dateStr < today) {
      return `<span class="lead-followup-alert" title="Follow-up Overdue">⚠️ Overdue</span>`;
    }
    if (dateStr === today) {
      return `<span class="lead-followup-alert today" title="Follow-up Due Today">⏰ Due Today</span>`;
    }
    return `<span style="font-size: 0.7rem; color: var(--crm-text-light);">📅 ${dateStr}</span>`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})();
