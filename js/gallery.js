/**
 * Sunbeam English School, Bhagwanpur — Gallery & Lightbox Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initGalleryFiltering();
  initLightbox();
});

function initGalleryFiltering() {
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  if (!filterBtns.length || !galleryItems.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      galleryItems.forEach(item => {
        const category = item.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          item.style.display = 'block';
          item.style.animation = 'fadeIn 0.3s ease';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

function initLightbox() {
  const modal = document.querySelector('.lightbox-modal');
  if (!modal) return;

  const modalImg = modal.querySelector('.lightbox-img');
  const modalCaption = modal.querySelector('.lightbox-caption');
  const closeBtn = modal.querySelector('.lightbox-close');
  const prevBtn = modal.querySelector('.lightbox-prev');
  const nextBtn = modal.querySelector('.lightbox-next');

  let currentItems = [];
  let currentIndex = 0;

  function updateVisibleItems() {
    currentItems = Array.from(document.querySelectorAll('.gallery-item')).filter(
      item => item.style.display !== 'none'
    );
  }

  function openLightbox(index) {
    updateVisibleItems();
    if (!currentItems.length || index < 0 || index >= currentItems.length) return;

    currentIndex = index;
    const item = currentItems[currentIndex];
    const img = item.querySelector('img');
    const title = item.querySelector('h4') ? item.querySelector('h4').textContent : '';
    const subtitle = item.querySelector('span') ? item.querySelector('span').textContent : '';

    modalImg.src = img.src;
    modalImg.alt = img.alt || title;
    modalCaption.innerHTML = `<strong>${title}</strong> — <span>${subtitle}</span>`;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function showNext() {
    updateVisibleItems();
    if (!currentItems.length) return;
    currentIndex = (currentIndex + 1) % currentItems.length;
    openLightbox(currentIndex);
  }

  function showPrev() {
    updateVisibleItems();
    if (!currentItems.length) return;
    currentIndex = (currentIndex - 1 + currentItems.length) % currentItems.length;
    openLightbox(currentIndex);
  }

  // Bind clicks on gallery items
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      updateVisibleItems();
      const idx = currentItems.indexOf(item);
      if (idx !== -1) openLightbox(idx);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (nextBtn) nextBtn.addEventListener('click', showNext);
  if (prevBtn) prevBtn.addEventListener('click', showPrev);

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
  });

  // Mobile Touch Swipe Support
  let touchStartX = 0;
  let touchEndX = 0;

  modal.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  modal.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
      showNext(); // Swiped left
    }
    if (touchEndX > touchStartX + swipeThreshold) {
      showPrev(); // Swiped right
    }
  }
}
