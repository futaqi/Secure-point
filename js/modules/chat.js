import { db, ref, push, onChildAdded, onChildRemoved, serverTimestamp, update } from '../firebase.js';

export function initChat(vipKey, userName) {
    const chatStream = document.getElementById('chatStream');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const btnSend = chatForm ? chatForm.querySelector('button[type="submit"]') : null; 
    const btnStaticLocation = document.getElementById('btnStaticLocation');
    
    // ==============================================================
    // SECURE LIGHTBOX BINDING (ANTI-DOWNLOAD & AUTO CLOSE ON SCROLL)
    // ==============================================================
    const secureLightbox = document.getElementById('secureLightbox');
    const btnCloseLightbox = document.getElementById('btnCloseLightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const btnLightboxMenu = document.getElementById('btnLightboxMenu');
    const lightboxDropdown = document.getElementById('lightboxDropdown');
    const btnLightboxZoom = document.getElementById('btnLightboxZoom');

    function closeLightboxFunc() {
        if (!secureLightbox) return;
        secureLightbox.classList.add('opacity-0');
        if(lightboxDropdown) lightboxDropdown.classList.add('hidden');
        setTimeout(() => secureLightbox.classList.add('hidden'), 300);
    }

    if (btnCloseLightbox && secureLightbox) {
        btnCloseLightbox.addEventListener('click', closeLightboxFunc);
    }

    // SENSOR TUTUP OTOMATIS SAAT DI-SCROLL / DISENTUH
    window.addEventListener('wheel', (e) => {
        if (secureLightbox && !secureLightbox.classList.contains('hidden')) closeLightboxFunc();
    }, { passive: true });
    
    window.addEventListener('touchmove', (e) => {
        if (secureLightbox && !secureLightbox.classList.contains('hidden')) closeLightboxFunc();
    }, { passive: true });

    // MENU DROPDOWN LIGHTBOX
    if (btnLightboxMenu && lightboxDropdown) {
        btnLightboxMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            lightboxDropdown.classList.toggle('hidden');
        });
    }
    
    // FITUR ZOOM LIGHTBOX
    if (btnLightboxZoom && lightboxImage) {
        btnLightboxZoom.addEventListener('click', () => {
            if (lightboxImage.classList.contains('object-contain')) {
                lightboxImage.classList.replace('object-contain', 'object-cover');
                btnLightboxZoom.innerHTML = '<i class="fa-solid fa-compress text-[var(--neon-gold)]"></i> Mode Pas';
            } else {
                lightboxImage.classList.replace('object-cover', 'object-contain');
                btnLightboxZoom.innerHTML = '<i class="fa-solid fa-expand text-[var(--neon-gold)]"></i> Mode Penuh';
            }
            if(lightboxDropdown) lightboxDropdown.classList.add('hidden');
        });
    }

    // FUNGSI PEMANGGIL POP-UP HOLOGRAFIK GLOBAL
    function callPopup(title, msg, type) {
        if (window.showSystemModal) window.showSystemModal(title, msg, type);
        else alert(msg); // Fallback darurat
    }

    // ==============================================================
    // MESIN CHAT & LACI CERDAS
    // ==============================================================
    const cameraInput = document.getElementById('cameraInput');
    const galleryInput = document.getElementById('galleryInput');
    const btnRecordAudio = document.getElementById('btnRecordAudio');
    const micIcon = document.getElementById('micIcon');
    let mediaRecorder, audioChunks = [], isRecording = false;

    const CLOUD_NAME = 'wuw7hvjo';
    const UPLOAD_PRESET = 'MyDriver';

    if (chatStream) chatStream.innerHTML = '';
    const chatRef = ref(db, `chats/${vipKey}`);

    onChildAdded(chatRef, (snapshot) => {
        const data = snapshot.val();
        renderMessage(snapshot.key, data, data.sender === 'client');
        scrollToBottom();
    });

    onChildRemoved(chatRef, (snapshot) => {
        const msgElement = document.getElementById(`msg-${snapshot.key}`);
        if (msgElement) {
            msgElement.style.transition = 'all 0.3s ease-out';
            msgElement.style.opacity = '0';
            msgElement.style.transform = 'scale(0.9)';
            setTimeout(() => msgElement.remove(), 300);
        }
    });

    const sendMessage = async () => {
        if (!chatInput) return;
        const text = chatInput.value.trim();
        if (!text) return; 
        
        chatInput.value = '';
        chatInput.style.height = '44px'; // Reset ukuran input
        
        const originalIcon = btnSend ? btnSend.innerHTML : '';
        if (btnSend) { btnSend.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; btnSend.disabled = true; }
        
        try { await push(chatRef, { type: 'text', text: text, sender: 'client', name: userName, timestamp: serverTimestamp() }); } 
        catch (error) { callPopup('TRANSMISI GAGAL', 'Koneksi E2EE terputus. Pesan gagal terkirim.', 'error'); } 
        finally { if (btnSend) { btnSend.innerHTML = originalIcon; btnSend.disabled = false; } }
    };

    if (chatForm) chatForm.addEventListener('submit', (e) => { e.preventDefault(); sendMessage(); });
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
    }

    if (btnStaticLocation) {
        btnStaticLocation.addEventListener('click', () => {
            if (!navigator.geolocation) return callPopup('SENSOR GAGAL', 'GPS tidak didukung oleh perangkat ini.', 'error');
            const prevPlaceholder = chatInput ? chatInput.placeholder : '';
            if (chatInput) { chatInput.placeholder = "Memindai koordinat presisi..."; chatInput.disabled = true; }

            navigator.geolocation.getCurrentPosition(async (position) => {
                try { await push(chatRef, { type: 'location', lat: position.coords.latitude, lng: position.coords.longitude, sender: 'client', name: userName, timestamp: serverTimestamp() }); } 
                finally { if (chatInput) { chatInput.placeholder = prevPlaceholder; chatInput.disabled = false; } }
            }, () => {
                if (chatInput) { chatInput.placeholder = prevPlaceholder; chatInput.disabled = false; }
                callPopup('AKURASI RENDAH', 'Gagal menangkap lokasi. Pastikan izin GPS perangkat aktif.', 'error');
            }, { enableHighAccuracy: true, timeout: 10000 });
        });
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const prevPlaceholder = chatInput ? chatInput.placeholder : '';
        if (chatInput) { chatInput.placeholder = "Mengunggah media terenkripsi..."; chatInput.disabled = true; }
        if (btnSend) btnSend.disabled = true;

        try {
            const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', UPLOAD_PRESET);
            const resourceType = file.type.startsWith('video') ? 'video' : 'image';
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, { method: 'POST', body: formData });
            const data = await response.json();
            if (data.secure_url) await push(chatRef, { type: resourceType, url: data.secure_url, sender: 'client', name: userName, timestamp: serverTimestamp() });
        } catch (error) { callPopup('ENKRIPSI GAGAL', 'Gagal mengirim media ke server pelindung.', 'error'); } 
        finally { 
            if (chatInput) { chatInput.placeholder = prevPlaceholder; chatInput.disabled = false; }
            if (btnSend) btnSend.disabled = false;
            e.target.value = ''; 
        }
    };

    if (cameraInput) cameraInput.addEventListener('change', handleFileUpload);
    if (galleryInput) galleryInput.addEventListener('change', handleFileUpload);

    if (btnRecordAudio) {
        btnRecordAudio.addEventListener('click', async () => {
            if (!isRecording) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream); audioChunks = [];
                    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
                    mediaRecorder.onstop = async () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        stream.getTracks().forEach(track => track.stop());
                        const prevPlaceholder = chatInput ? chatInput.placeholder : '';
                        if (chatInput) { chatInput.placeholder = "Mengirim transmisi suara..."; chatInput.disabled = true; }
                        await uploadAudioToCloudinary(audioBlob);
                        if (chatInput) { chatInput.placeholder = prevPlaceholder; chatInput.disabled = false; }
                    };
                    mediaRecorder.start(); isRecording = true;
                    if(micIcon) { micIcon.classList.replace('fa-microphone', 'fa-circle-stop'); micIcon.classList.add('text-[var(--danger)]', 'animate-pulse'); }
                } catch (err) { callPopup('AKSES DITOLAK', 'Izinkan akses Mikrofon pada browser Anda untuk mengirim pesan suara.', 'error'); }
            } else {
                mediaRecorder.stop(); isRecording = false;
                if(micIcon) { micIcon.classList.replace('fa-circle-stop', 'fa-circle-notch'); micIcon.classList.replace('text-[var(--danger)]', 'text-[var(--neon-gold)]'); micIcon.classList.replace('animate-pulse', 'fa-spin'); }
            }
        });
    }

    async function uploadAudioToCloudinary(audioBlob) {
        try {
            const formData = new FormData(); formData.append('file', audioBlob, 'voicenote.webm'); formData.append('upload_preset', UPLOAD_PRESET);
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, { method: 'POST', body: formData });
            const data = await response.json();
            if (data.secure_url) await push(chatRef, { type: 'audio', url: data.secure_url, sender: 'client', name: userName, timestamp: serverTimestamp() });
        } catch (error) { callPopup('TRANSMISI GAGAL', 'Pesan suara gagal dienkripsi.', 'error'); } 
        finally { if(micIcon) { micIcon.className = 'fa-solid fa-microphone'; } }
    }

    function renderMessage(msgId, data, isSelf) {
        if (!chatStream) return;
        const wrap = document.createElement('div');
        wrap.id = `msg-${msgId}`; 
        wrap.className = `flex w-full ${isSelf ? 'justify-end' : 'justify-start'} relative z-0`;
        const bubble = document.createElement('div');
        bubble.className = `max-w-[85%] sm:max-w-[70%] p-3 sm:p-4 rounded-[1.2rem] ${isSelf ? 'bubble-self' : 'bubble-other'}`;
        const timeString = new Date(data.timestamp || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        if (data.type === 'text') {
            bubble.innerHTML = `<p class="text-[0.95rem] leading-relaxed whitespace-pre-wrap break-words">${escapeHtml(data.text)}</p><p class="text-[0.65rem] text-right mt-1.5 opacity-70 font-tech">${timeString}</p>`;
            wrap.appendChild(bubble); chatStream.appendChild(wrap);
        } 
        else if (data.type === 'location') {
            const mapId = 'map-' + Math.random().toString(36).substr(2, 9);
            bubble.innerHTML = `
                <p class="text-xs mb-2 font-semibold flex items-center gap-1.5 opacity-90 text-[var(--neon-gold)]"><i class="fa-solid fa-map-location-dot"></i> Lokasi Terkini</p>
                <div class="w-full h-40 sm:h-48 rounded-xl overflow-hidden shadow-inner bg-[var(--bg-card)] z-0 relative border border-[var(--border-cyber)]" id="${mapId}"></div>
                <div class="mt-3 flex flex-col gap-2">
                    <p class="text-[0.65rem] font-tech font-semibold text-center border border-[var(--border-active)] rounded-md p-1 bg-[var(--bg-panel-solid)] text-[var(--text-main)]">Lat: ${data.lat.toFixed(5)}, Lng: ${data.lng.toFixed(5)}</p>
                    <a href="https://www.google.com/maps?q=${data.lat},${data.lng}" target="_blank" class="w-full py-2 flex justify-center items-center gap-2 text-xs font-semibold rounded-lg bg-[var(--neon-gold)] text-[var(--bg-base)] hover:scale-[0.98] transition-transform shadow-lg cursor-pointer"><i class="fa-solid fa-location-arrow text-sm"></i> Buka Maps</a>
                </div>
                <p class="text-[0.65rem] text-right mt-2 opacity-70 font-tech">${timeString}</p>`;
            wrap.appendChild(bubble); chatStream.appendChild(wrap);
            setTimeout(() => {
                const map = L.map(mapId, { zoomControl: false, attributionControl: false }).setView([data.lat, data.lng], 16);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
                const customIcon = L.divIcon({ className: 'custom-pin', html: '<div class="text-3xl text-[var(--danger)] -ml-3 -mt-6 drop-shadow-md"><i class="fa-solid fa-location-dot"></i></div>' });
                L.marker([data.lat, data.lng], {icon: customIcon}).addTo(map);
            }, 100);
        } 
        else if (data.type === 'image') {
            // KEAMANAN MUTLAK: event click dibungkus parent agar tidak terhalang shield anti-download
            bubble.innerHTML = `<div class="rounded-xl overflow-hidden mb-1 shadow-sm border border-[var(--border-cyber)] bg-[var(--bg-card)] relative cursor-pointer group" id="wrap-${msgId}">
                <div class="absolute inset-0 z-10 secure-shield group-active:bg-[rgba(255,255,255,0.1)] transition-colors" oncontextmenu="return false;"></div>
                <img src="${escapeHtml(data.url)}" alt="Secure Media" class="w-full h-auto object-cover rounded-xl min-h-[100px]" id="img-${msgId}" oncontextmenu="return false;" draggable="false">
            </div><p class="text-[0.65rem] text-right mt-1 opacity-70 font-tech">${timeString}</p>`;
            
            wrap.appendChild(bubble); chatStream.appendChild(wrap);
            
            const wrapEl = document.getElementById(`wrap-${msgId}`);
            if(wrapEl && secureLightbox && lightboxImage) {
                wrapEl.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    lightboxImage.src = data.url;
                    lightboxImage.className = "max-w-full max-h-full object-contain pointer-events-none select-none transition-transform duration-300"; 
                    if(btnLightboxZoom) btnLightboxZoom.innerHTML = '<i class="fa-solid fa-expand text-[var(--neon-gold)]"></i> Mode Penuh';
                    secureLightbox.classList.remove('hidden');
                    setTimeout(() => secureLightbox.classList.remove('opacity-0'), 10);
                });
            }
        } 
        else if (data.type === 'video') {
            bubble.innerHTML = `<div class="rounded-xl overflow-hidden mb-1 shadow-sm border border-[var(--border-cyber)] bg-[var(--bg-card)]">
                <video controls controlsList="nodownload noplaybackrate" oncontextmenu="return false;" disablePictureInPicture class="w-full h-auto rounded-xl max-h-60"><source src="${escapeHtml(data.url)}"></video>
            </div><p class="text-[0.65rem] text-right mt-1 opacity-70 font-tech">${timeString}</p>`;
            wrap.appendChild(bubble); chatStream.appendChild(wrap);
        } 
        else if (data.type === 'audio') {
            bubble.innerHTML = `<div class="mb-1 flex items-center gap-3 bg-[var(--bg-panel-solid)] p-2 rounded-2xl border border-[var(--border-cyber)]"><div class="w-10 h-10 rounded-full bg-[var(--neon-gold)] flex items-center justify-center text-[var(--bg-base)] shrink-0 shadow-md"><i class="fa-solid fa-microphone-lines text-lg"></i></div>
            <audio controls controlsList="nodownload noplaybackrate" oncontextmenu="return false;" class="w-40 sm:w-56 h-10"><source src="${escapeHtml(data.url)}" type="audio/webm"><source src="${escapeHtml(data.url)}" type="audio/mp4"></audio></div><p class="text-[0.65rem] text-right mt-1 opacity-70 font-tech">${timeString}</p>`;
            wrap.appendChild(bubble); chatStream.appendChild(wrap);
        }
    }

    function scrollToBottom() { if(chatStream) setTimeout(() => { chatStream.scrollTo({ top: chatStream.scrollHeight, behavior: 'smooth' }); }, 150); }
    function escapeHtml(text) { if(!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
}
