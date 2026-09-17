import { initAuthEngine } from './modules/auth.js';
import { initStatusAndProfile } from './modules/status-profile.js';
import { initArrivalBeacon } from './modules/beacon.js';
import { initReviews } from './modules/reviews.js';
import { initPromos } from './modules/promos.js';
import { registerBiometric } from './modules/biometrics.js'; 
import { bindGoogleAccount } from './modules/google-sso.js'; 

// ==============================================================
// SISTEM POP-UP HOLOGRAFIK GLOBAL (PENGGANTI ALERT BAWAAN)
// ==============================================================
window.showSystemModal = function(title, text, type = 'info') {
    const modal = document.getElementById('systemModal');
    const titleEl = document.getElementById('sysModalTitle');
    const textEl = document.getElementById('sysModalText');
    const iconEl = document.getElementById('sysModalIcon');
    const btnClose = document.getElementById('btnSysModalClose');

    if (!modal) { alert(title + '\n' + text); return; } // Fallback darurat

    titleEl.textContent = title;
    textEl.textContent = text;
    
    // Tema Dinamis (Sukses / Error / Info)
    if (type === 'error' || type === 'danger') {
        iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        iconEl.className = 'w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 border border-[var(--danger)] text-[var(--danger)] bg-[rgba(239,68,68,0.1)] shadow-[0_0_15px_rgba(239,68,68,0.2)]';
        btnClose.className = 'btn-cyber font-tech w-full border-[var(--danger)] text-[var(--danger)] hover:bg-[rgba(239,68,68,0.1)] transition-colors';
    } else if (type === 'success') {
        iconEl.innerHTML = '<i class="fa-solid fa-check-double"></i>';
        iconEl.className = 'w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 border border-[var(--success)] text-[var(--success)] bg-[rgba(16,185,129,0.1)] shadow-[0_0_15px_rgba(16,185,129,0.2)]';
        btnClose.className = 'btn-cyber font-tech w-full border-[var(--success)] text-[var(--success)] hover:bg-[rgba(16,185,129,0.1)] transition-colors';
    } else {
        iconEl.innerHTML = '<i class="fa-solid fa-info"></i>';
        iconEl.className = 'w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 border border-[var(--neon-gold)] text-[var(--neon-gold)] bg-[rgba(197,168,128,0.1)] shadow-[0_0_15px_rgba(197,168,128,0.2)]';
        btnClose.className = 'btn-cyber font-tech w-full';
    }

    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);

    btnClose.onclick = () => {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };
};

document.addEventListener('DOMContentLoaded', () => {
    initAuthEngine();
    initStatusAndProfile();
    initArrivalBeacon();
    initReviews();
    initPromos();
    initUIEngine(); 
});

function initUIEngine() {
    // 1. TEMA VISUAL & LOGOUT
    const btnThemeToggle = document.getElementById('btnThemeToggle');
    const iconTheme = document.getElementById('iconTheme');
    const savedTheme = localStorage.getItem('vip_theme') || 'dark';
    if (savedTheme === 'light') { document.body.classList.add('theme-light'); if(iconTheme) iconTheme.classList.replace('fa-moon', 'fa-sun'); }

    if(btnThemeToggle) {
        btnThemeToggle.addEventListener('click', () => {
            document.body.classList.toggle('theme-light');
            const isLight = document.body.classList.contains('theme-light');
            localStorage.setItem('vip_theme', isLight ? 'light' : 'dark');
            if(iconTheme) {
                iconTheme.classList.replace('fa-moon', 'fa-sun');
                if (!isLight) iconTheme.classList.replace('fa-sun', 'fa-moon');
            }
        });
    }

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            window.showSystemModal('KONFIRMASI KUNCI', 'Sistem terkunci. Sesi E2EE telah diakhiri.', 'success');
            setTimeout(() => {
                localStorage.removeItem('vip_key'); localStorage.removeItem('vip_session_id'); window.location.reload();
            }, 1500);
        });
    }

    // 2. BIOMETRIK & GOOGLE BINDING
    if (document.getElementById('btnRegisterBiometric')) {
        document.getElementById('btnRegisterBiometric').addEventListener('click', async () => {
            const k = localStorage.getItem('vip_key'); if(k) await registerBiometric(k);
        });
    }
    if (document.getElementById('btnBindGoogle')) {
        document.getElementById('btnBindGoogle').addEventListener('click', async () => {
            const k = localStorage.getItem('vip_key'); if(k) await bindGoogleAccount(k);
        });
    }

    // 3. EXECUTIVE NAVIGATION (Dashboard <-> Chat Transisi Mulus)
    const viewDashboard = document.getElementById('viewDashboard');
    const viewChat = document.getElementById('viewChat');
    const btnOpenChat = document.getElementById('btnOpenChat');
    const btnCloseChat = document.getElementById('btnCloseChat');

    if (btnOpenChat && viewChat) {
        btnOpenChat.addEventListener('click', () => {
            viewChat.classList.remove('hidden');
            viewChat.classList.add('flex'); // [FIX MUTLAK]: Membangkitkan mesin Flexbox
            setTimeout(() => { viewChat.classList.remove('translate-x-full'); viewChat.classList.add('translate-x-0'); }, 10);
        });
    }

    if (btnCloseChat && viewChat) {
        btnCloseChat.addEventListener('click', () => {
            viewChat.classList.remove('translate-x-0'); viewChat.classList.add('translate-x-full');
            setTimeout(() => { 
                viewChat.classList.add('hidden'); 
                viewChat.classList.remove('flex'); // [FIX MUTLAK]: Mereset mesin Flexbox
            }, 300); 
        });
    }

    // 4. PORTOFOLIO MODAL LOGIC
    const btnOpenPortofolio = document.getElementById('btnOpenPortofolio');
    const portofolioModal = document.getElementById('portofolioModal');
    const btnClosePortofolio = document.getElementById('btnClosePortofolio');
    
    if (btnOpenPortofolio && portofolioModal) btnOpenPortofolio.addEventListener('click', () => { portofolioModal.classList.remove('hidden'); });
    if (btnClosePortofolio && portofolioModal) btnClosePortofolio.addEventListener('click', () => { portofolioModal.classList.add('hidden'); });

    // 5. THE SMART CHAT DRAWER & AUTO-EXPAND INPUT
    const btnToggleDrawer = document.getElementById('btnToggleDrawer');
    const mediaDrawer = document.getElementById('mediaDrawer');
    const drawerIcon = document.getElementById('drawerIcon');
    const chatInput = document.getElementById('chatInput');
    const chatStream = document.getElementById('chatStream');

    function closeDrawer() {
        if(mediaDrawer) mediaDrawer.classList.remove('drawer-open');
        if(drawerIcon) drawerIcon.style.transform = 'rotate(0deg)';
    }

    if (btnToggleDrawer && mediaDrawer) {
        btnToggleDrawer.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mediaDrawer.classList.contains('drawer-open')) { closeDrawer(); } 
            else { mediaDrawer.classList.add('drawer-open'); if(drawerIcon) drawerIcon.style.transform = 'rotate(45deg)'; }
        });
    }

    if (chatInput) {
        chatInput.addEventListener('focus', closeDrawer);
        chatInput.addEventListener('input', closeDrawer);
        chatInput.addEventListener('input', function() {
            this.style.height = '44px'; 
            const newHeight = Math.min(this.scrollHeight, 120); 
            this.style.height = newHeight + 'px';
        });
    }
    if (chatStream) chatStream.addEventListener('click', closeDrawer);

    // ==============================================================
    // 6. HUD DIAGNOSTIC TELEMETRY (RADAR, PING, RAM, BATERAI)
    // ==============================================================
    const telemetryNet = document.getElementById('telemetryNet');
    const waveContainer = document.getElementById('waveContainer');
    const telemetryPing = document.getElementById('telemetryPing');
    const vuSegments = document.querySelectorAll('.vu-segment');
    const telemetryRam = document.getElementById('telemetryRam');
    const telemetryBat = document.getElementById('telemetryBat');
    const iconBat = document.getElementById('iconBat');
    const telemetryDev = document.getElementById('telemetryDev');
    
    const devIdRaw = localStorage.getItem('futaqi_device_uid');
    if (devIdRaw && telemetryDev) { telemetryDev.textContent = devIdRaw.substring(0, 10); }

    function updateNetwork() {
        if (navigator.connection && telemetryNet) {
            const netType = navigator.connection.effectiveType ? navigator.connection.effectiveType.toUpperCase() : '4G';
            const speed = navigator.connection.downlink ? navigator.connection.downlink + ' Mbps' : 'STABIL';
            telemetryNet.innerHTML = `${netType}<br><span class="text-[0.5rem] text-[#94a3b8] font-normal tracking-wide">${speed}</span>`;
            if (waveContainer) waveContainer.classList.add('hud-active');
        } else if (telemetryNet) {
            telemetryNet.textContent = 'SECURE';
            if (waveContainer) waveContainer.classList.add('hud-active');
        }
    }
    updateNetwork();
    if (navigator.connection) navigator.connection.addEventListener('change', updateNetwork);

    setInterval(() => {
        if(telemetryPing && vuSegments.length > 0) {
            const mockPing = Math.floor(Math.random() * (45 - 15 + 1)) + 15; 
            telemetryPing.textContent = mockPing + ' ms';
            
            vuSegments.forEach(seg => {
                seg.className = 'vu-segment'; 
                if (mockPing <= 30) seg.classList.add('safe');
                else if (mockPing <= 40) seg.classList.add('warn');
                else seg.classList.add('danger');
            });
            
            if (mockPing > 40) telemetryPing.style.color = '#eab308'; 
            else telemetryPing.style.color = 'var(--success)';
        }
    }, 2500);

    if (telemetryRam) {
        if (navigator.deviceMemory) {
            telemetryRam.innerHTML = `${navigator.deviceMemory}GB<br><span class="text-[0.5rem] text-[#94a3b8] font-normal tracking-wide">MEMORI</span>`;
        } else {
            telemetryRam.innerHTML = `OPTIMAL<br><span class="text-[0.5rem] text-[#94a3b8] font-normal tracking-wide">MEMORI</span>`;
        }
    }

    if (telemetryBat && navigator.getBattery) {
        navigator.getBattery().then(battery => {
            function updateBattery() {
                const level = Math.round(battery.level * 100);
                telemetryBat.textContent = level + '%';
                if (iconBat) {
                    iconBat.className = battery.charging ? 'fa-solid fa-bolt text-[var(--success)] text-[0.7rem]' : 
                                       (level > 50 ? 'fa-solid fa-battery-full text-[var(--success)] text-[0.7rem]' : 
                                       (level > 20 ? 'fa-solid fa-battery-half text-[#eab308] text-[0.7rem]' : 'fa-solid fa-battery-quarter text-[var(--danger)] text-[0.7rem]'));
                }
            }
            updateBattery();
            battery.addEventListener('levelchange', updateBattery);
            battery.addEventListener('chargingchange', updateBattery);
        });
    } else if (telemetryBat) {
        telemetryBat.textContent = 'PWR OK';
    }

    // ==============================================================
    // 7. MESIN DRAG & DROP SPEED DIAL
    // ==============================================================
    const fabContainer = document.getElementById('draggableFab');
    const btnSpeedDial = document.getElementById('btnSpeedDial');
    const dialMenu = document.getElementById('dialMenu');
    let isDragging = false, hasDragged = false, startX, startY, xOffset = 0, yOffset = 0;

    if (fabContainer) {
        fabContainer.addEventListener('touchstart', dragStart, { passive: false });
        document.addEventListener('touchend', dragEnd, { passive: false });
        document.addEventListener('touchmove', drag, { passive: false });
    }

    function dragStart(e) {
        if (!e.target.closest('#btnSpeedDial')) return;
        if (e.type === 'touchstart') { startX = e.touches[0].clientX - xOffset; startY = e.touches[0].clientY - yOffset; } 
        else { startX = e.clientX - xOffset; startY = e.clientY - yOffset; }
        isDragging = true; hasDragged = false; fabContainer.style.transition = 'none';
    }

    function drag(e) {
        if (!isDragging) return; e.preventDefault(); 
        let currentX, currentY;
        if (e.type === 'touchmove') { currentX = e.touches[0].clientX - startX; currentY = e.touches[0].clientY - startY; } 
        else { currentX = e.clientX - startX; currentY = e.clientY - startY; }
        if (Math.abs(currentX - xOffset) > 5 || Math.abs(currentY - yOffset) > 5) { hasDragged = true; if(dialMenu) dialMenu.classList.remove('active'); }
        xOffset = currentX; yOffset = currentY; fabContainer.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }

    function dragEnd(e) {
        if (!isDragging) return; isDragging = false;
        if(fabContainer) fabContainer.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }

    if (btnSpeedDial && dialMenu) {
        btnSpeedDial.addEventListener('click', (e) => {
            if (hasDragged) { e.preventDefault(); return; }
            dialMenu.classList.toggle('active');
            const icon = btnSpeedDial.querySelector('i');
            if (icon) icon.className = dialMenu.classList.contains('active') ? 'fa-solid fa-xmark' : 'fa-solid fa-layer-group';
        });
    }
              }
              
