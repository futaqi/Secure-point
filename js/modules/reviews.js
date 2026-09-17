import { db, ref, onValue, push } from '../firebase.js';

export function initReviews() {
  const openReviewBtn = document.getElementById('btnOpenReviewMatrix');
  const closeReviewBtn = document.getElementById('btnCloseReview');
  const reviewForm = document.getElementById('reviewForm');
  const starSelector = document.getElementById('starRatingSelector');
  const ratingValueInput = document.getElementById('ratingValue');
  const reviewsStream = document.getElementById('reviewsStream');
  const starVisual = document.getElementById('starVisual');
  const ratingAvgEl = document.getElementById('ratingAverage');
  const ratingCountEl = document.getElementById('ratingCount');
  
  const reviewerNameInput = document.getElementById('reviewerName');

  if (!reviewForm) return; // Proteksi Mutlak Agar Tidak Crash

  if (reviewerNameInput) {
      reviewerNameInput.readOnly = true;
      reviewerNameInput.style.pointerEvents = 'none';
      reviewerNameInput.style.opacity = '0.7';
  }

  // Integrasi Buka Modal dari Dashboard Matrix
  if (openReviewBtn) {
      openReviewBtn.addEventListener('click', () => {
          reviewForm.classList.remove('hidden');
          const fab = document.getElementById('draggableFab');
          if (fab) fab.style.display = 'none';

          if (reviewerNameInput) {
              const googleName = localStorage.getItem('futaqi_google_name');
              const adminName = localStorage.getItem('futaqi_admin_given_name');
              reviewerNameInput.value = googleName || adminName || 'Klien VIP';
          }
      });
  }

  // Integrasi Tutup Modal
  if (closeReviewBtn) {
      closeReviewBtn.addEventListener('click', () => {
          reviewForm.classList.add('hidden');
          const fab = document.getElementById('draggableFab');
          if (fab) fab.style.display = 'block';
      });
  }

  if (starSelector) {
      const starSpans = starSelector.querySelectorAll('span');
      starSpans.forEach((star) => {
        star.addEventListener('click', () => {
          const val = parseInt(star.getAttribute('data-star'), 10);
          if(ratingValueInput) ratingValueInput.value = val;
          starSpans.forEach((s) => {
            const idx = parseInt(s.getAttribute('data-star'), 10);
            s.className = idx <= val 
                ? 'text-[var(--neon-gold)] transition-colors hover:scale-110' 
                : 'text-[var(--text-muted)] transition-colors hover:scale-110';
          });
        });
      });
  }

  onValue(ref(db, 'reviews'), (snapshot) => {
    const data = snapshot.val();
    if (!reviewsStream) return;
    reviewsStream.innerHTML = '';

    if (!data) {
      reviewsStream.innerHTML = '<div class="text-center text-[var(--text-muted)] text-xs py-8 font-tech">Belum ada ulasan masuk. Jadilah yang pertama!</div>';
      if(ratingAvgEl) ratingAvgEl.textContent = '5.0';
      if(ratingCountEl) ratingCountEl.textContent = '(0 ulasan)';
      if(starVisual) starVisual.innerHTML = '<i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>';
      return;
    }

    const keys = Object.keys(data).reverse();
    let totalScore = 0;

    keys.forEach((key) => {
      const r = data[key];
      const rating = Number(r.rating) || 5;
      totalScore += rating;

      const card = document.createElement('div');
      card.className = 'bg-[var(--bg-panel-solid)] border border-[var(--border-cyber)] rounded-xl p-4 flex flex-col gap-2 shadow-sm';
      
      let starsHtml = '';
      for(let i=0; i<5; i++) {
          starsHtml += i < rating ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star opacity-50"></i>';
      }

      const dateString = r.timestamp ? new Date(r.timestamp).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
      }) : '';

      card.innerHTML = `
        <div class="flex justify-between items-center">
          <span class="font-bold text-[0.8rem] text-[var(--text-main)] font-tech tracking-wide">${escapeHtml(r.name || 'VIP Client')}</span>
          <span class="text-[var(--neon-gold)] text-[0.7rem] space-x-1">${starsHtml}</span>
        </div>
        <p class="text-[0.8rem] text-[var(--text-main)] opacity-90 leading-relaxed">${escapeHtml(r.comment || '')}</p>
        <div class="text-[0.65rem] text-[var(--text-muted)] text-right font-tech mt-1">${dateString}</div>
      `;

      reviewsStream.appendChild(card);
    });

    const avg = (totalScore / keys.length).toFixed(1);
    if(ratingAvgEl) ratingAvgEl.textContent = avg;
    if(ratingCountEl) ratingCountEl.textContent = `(${keys.length} ulasan)`;
    
    let headerStars = '';
    const roundedAvg = Math.round(avg);
    for(let i=0; i<5; i++) {
        headerStars += i < roundedAvg ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star opacity-50"></i>';
    }
    if(starVisual) starVisual.innerHTML = headerStars;
  });

  const reviewSubmitForm = document.getElementById('formReviewSubmit');
  if (reviewSubmitForm) {
      reviewSubmitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = reviewerNameInput ? reviewerNameInput.value.trim() : 'Klien VIP';
        const rating = ratingValueInput ? parseInt(ratingValueInput.value, 10) : 5;
        const commentInput = document.getElementById('reviewComment');
        const comment = commentInput ? commentInput.value.trim() : '';

        if (!comment) return;
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnContent = submitBtn ? submitBtn.innerHTML : '';
        if(submitBtn) { submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> MENGIRIM...'; submitBtn.disabled = true; }

        push(ref(db, 'reviews'), {
          name: name, rating: rating, comment: comment, timestamp: Date.now()
        }).then(() => {
          reviewSubmitForm.reset();
          if(ratingValueInput) ratingValueInput.value = 5;
          reviewForm.classList.add('hidden');
          const fab = document.getElementById('draggableFab');
          if (fab) fab.style.display = 'block';
          
          if (window.showSystemModal) {
              window.showSystemModal('ULASAN TERKIRIM', 'Ulasan Eksekutif Anda berhasil diterbitkan. Terima kasih!', 'success');
          } else {
              alert('Ulasan Eksekutif Anda berhasil diterbitkan. Terima kasih!');
          }
        }).catch((err) => {
          if (window.showSystemModal) {
              window.showSystemModal('PENGIRIMAN GAGAL', 'Gagal mengirim ulasan: ' + err.message, 'error');
          } else {
              alert('Gagal mengirim ulasan: ' + err.message);
          }
        }).finally(() => {
          if(submitBtn) { submitBtn.innerHTML = originalBtnContent; submitBtn.disabled = false; }
        });
      });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
