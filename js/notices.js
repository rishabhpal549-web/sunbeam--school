/**
 * Sunbeam English School, Bhagwanpur — Notice Board Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initNoticeTabs();
  initNoticeModal();
});

function initNoticeTabs() {
  const tabs = document.querySelectorAll('.notice-tab-btn');
  const items = document.querySelectorAll('.notice-item');

  if (!tabs.length || !items.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filterCategory = tab.getAttribute('data-category');

      items.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        if (filterCategory === 'all' || itemCategory === filterCategory) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

function initNoticeModal() {
  let modal = document.querySelector('.notice-modal');
  
  // Create modal structure if not already present in DOM
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'notice-modal lightbox-modal';
    modal.innerHTML = `
      <div class="lightbox-container" style="background: var(--white); color: var(--text-main); padding: 2.5rem; border-radius: var(--radius-lg); max-width: 650px; width: 90%; position: relative;">
        <button class="notice-modal-close" style="position: absolute; top: 1.25rem; right: 1.25rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        <div class="notice-modal-badge eyebrow eyebrow-badge" style="margin-bottom: 0.75rem;"></div>
        <h3 class="notice-modal-title" style="color: var(--primary); margin-bottom: 0.5rem;"></h3>
        <div class="notice-modal-date" style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;"></div>
        <div class="notice-modal-body" style="font-size: 0.95rem; line-height: 1.7; color: var(--text-main); margin-bottom: 1.75rem;"></div>
        <div style="border-top: 1px solid var(--border-light); padding-top: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <span class="placeholder-tag">[Add Official Notice Circular / PDF]</span>
          <button class="btn btn-primary btn-sm notice-modal-ok">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const titleEl = modal.querySelector('.notice-modal-title');
  const badgeEl = modal.querySelector('.notice-modal-badge');
  const dateEl = modal.querySelector('.notice-modal-date');
  const bodyEl = modal.querySelector('.notice-modal-body');
  const closeBtn = modal.querySelector('.notice-modal-close');
  const okBtn = modal.querySelector('.notice-modal-ok');

  function openNoticeModal(item) {
    const title = item.querySelector('.notice-title') ? item.querySelector('.notice-title').textContent : 'School Notice';
    const category = item.getAttribute('data-category') || 'Notice';
    const dateDay = item.querySelector('.notice-date-day') ? item.querySelector('.notice-date-day').textContent : '';
    const dateMonth = item.querySelector('.notice-date-month') ? item.querySelector('.notice-date-month').textContent : '';
    const desc = item.querySelector('.notice-desc') ? item.querySelector('.notice-desc').innerHTML : '';

    titleEl.textContent = title;
    badgeEl.textContent = category.toUpperCase();
    dateEl.innerHTML = `📅 Date: <strong>${dateDay} ${dateMonth}</strong> • Sunbeam English School Notice Board`;
    bodyEl.innerHTML = desc;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeNoticeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeNoticeModal);
  if (okBtn) okBtn.addEventListener('click', closeNoticeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeNoticeModal();
  });

  document.querySelectorAll('.notice-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // Allow clicking either view link or item
      openNoticeModal(item);
    });
  });
}
