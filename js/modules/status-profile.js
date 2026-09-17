import { db, ref, onValue } from '../firebase.js';

export function initStatusAndProfile() {
  // ELEMEN DASHBOARD
  const dashNameEl = document.getElementById('adminNameDash');
  const dashTaglineEl = document.getElementById('adminTaglineDash');
  const dashPhotoEl = document.getElementById('adminPhotoDash');
  const dashInitialsEl = document.getElementById('adminInitialsDash');
  const btnMapsEl = document.getElementById('btnMaps'); // Berada di Dashboard Matrix
  
  // ELEMEN CHAT HEADER
  const chatNameEl = document.getElementById('adminNameChat');
  const chatPhotoEl = document.getElementById('adminPhotoChat');
  const chatInitialsEl = document.getElementById('adminInitialsChat');
  const btnContactEl = document.getElementById('btnContactChat');
  
  // INDIKATOR STATUS (Dashboard Panel)
  const dashStatusText = document.getElementById('adminStatusTextDash');
  const dashStatusPing = document.getElementById('statusPingDash');

  // Sync Profil & Link
  onValue(ref(db, 'config'), (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    if (data.name) {
        dashNameEl.textContent = data.name;
        chatNameEl.textContent = data.name;
    }
    if (data.tagline) dashTaglineEl.textContent = data.tagline;

    // Foto Profil atau Inisial (Dipecah 2 arah: Dash & Chat)
    if (data.photoUrl && data.photoUrl.trim() !== '') {
        dashPhotoEl.src = data.photoUrl; chatPhotoEl.src = data.photoUrl;
        dashPhotoEl.classList.remove('hidden'); chatPhotoEl.classList.remove('hidden');
        dashInitialsEl.classList.add('hidden'); chatInitialsEl.classList.add('hidden');
    } else {
        dashPhotoEl.classList.add('hidden'); chatPhotoEl.classList.add('hidden');
        dashInitialsEl.classList.remove('hidden'); chatInitialsEl.classList.remove('hidden');
    }

    // Tautan Matriks Dashboard
    if (data.mapsUrl) {
      btnMapsEl.href = data.mapsUrl;
      btnMapsEl.classList.remove('opacity-50', 'pointer-events-none');
    } else {
      btnMapsEl.classList.add('opacity-50', 'pointer-events-none');
    }

    // Tautan Header Chat
    if (data.contactUrl) {
      btnContactEl.href = data.contactUrl;
      btnContactEl.classList.remove('opacity-50', 'pointer-events-none');
    } else {
      btnContactEl.classList.add('opacity-50', 'pointer-events-none');
    }
  });

  // Sync Status Realtime 
  onValue(ref(db, 'status'), (snapshot) => {
    const status = snapshot.val() || 'ONLINE';

    if (status === 'ONLINE') {
      dashStatusText.textContent = 'ONLINE - STANDBY';
      dashStatusText.style.color = 'var(--success)';
      dashStatusPing.style.backgroundColor = 'var(--success)';
      dashStatusPing.classList.add('animate-pulse');
    } else if (status === 'ON_TRIP') {
      dashStatusText.textContent = 'SEDANG SIBUK';
      dashStatusText.style.color = 'var(--neon-gold)';
      dashStatusPing.style.backgroundColor = 'var(--neon-gold)';
      dashStatusPing.classList.add('animate-pulse');
    } else {
      dashStatusText.textContent = 'OFFLINE';
      dashStatusText.style.color = 'var(--text-dark)';
      dashStatusPing.style.backgroundColor = 'var(--text-dark)';
      dashStatusPing.classList.remove('animate-pulse');
    }
  });
}
