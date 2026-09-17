import { db, ref, onValue } from '../firebase.js';

export function initPromos() {
  const promoSection = document.getElementById('promoSection');
  const promoContainer = document.getElementById('promoContainer');

  onValue(ref(db, 'promos'), (snapshot) => {
    const data = snapshot.val();
    promoContainer.innerHTML = '';

    if (!data || Object.keys(data).length === 0) {
      promoSection.classList.add('hidden');
      return;
    }

    promoSection.classList.remove('hidden');

    Object.keys(data).forEach((key) => {
      const item = data[key];
      const card = document.createElement('div');
      
      // Menggunakan palet Glassmorphism Executive
      card.className = 'bg-[var(--bg-panel-solid)] p-4 rounded-xl border border-[var(--border-cyber)] hover:border-[var(--neon-gold)] transition-all flex flex-col justify-between shadow-sm';

      card.innerHTML = `
        <div class="space-y-1.5">
          <div class="text-[0.75rem] font-bold text-[var(--neon-gold)] font-tech uppercase tracking-wide">
              <i class="fa-solid fa-bolt text-[var(--neon-gold)] mr-1"></i> ${escapeHtml(item.title || '')}
          </div>
          <p class="text-[0.7rem] text-[var(--text-main)] opacity-80 line-clamp-3 leading-relaxed">${escapeHtml(item.desc || '')}</p>
        </div>
        ${item.link ? `
          <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex items-center gap-2 text-[0.7rem] font-tech text-[var(--success)] hover:text-[var(--neon-gold)] font-semibold transition-colors w-max">
            <span>Lihat Detail</span>
            <i class="fa-solid fa-arrow-right-long"></i>
          </a>
        ` : ''}
      `;

      promoContainer.appendChild(card);
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
