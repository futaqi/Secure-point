import { db, ref, get, set, update, onValue } from '../firebase.js';
import { push, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { initChat } from './chat.js';
import { authenticateBiometric, checkBiometricAvailability } from './biometrics.js';
import { connectDeviceToRadar } from './beacon.js';
import { authenticateWithGoogle } from './google-sso.js'; 

// ==========================================
// 1. SISTEM EFEK KEJUT (LOCKDOWN & VIBRASI)
// ==========================================
export function triggerLockdown(message) {
    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 1000, 200, 1500]); 
    const lockdownModal = document.getElementById('aegisLockdownModal');
    const lockdownMsg = document.getElementById('lockdownMessage');
    
    if (lockdownModal && lockdownMsg) {
        lockdownMsg.textContent = message;
        lockdownModal.classList.remove('hidden');
        lockdownModal.classList.add('flex');
    }
}

// ==========================================
// 2. BUKU RIWAYAT JEJAK (FOOTPRINT LEDGER)
// ==========================================
async function logFootprint(key, statusDetail) {
    const deviceId = localStorage.getItem('futaqi_device_uid') || 'UNKNOWN-DEVICE';
    const ua = navigator.userAgent;
    let browser = 'Browser', os = 'Desktop';
    
    if (/Android/i.test(ua)) os = 'Android'; else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
    if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) browser = 'Chrome'; else if (/Safari/i.test(ua)) browser = 'Safari';

    try {
        await push(ref(db, `device_history/${key}`), {
            deviceId: deviceId, deviceInfo: `${os} / ${browser}`, status: statusDetail, timestamp: serverTimestamp()
        });
    } catch (e) { console.warn("Perekaman jejak tertunda."); }
}

export function initAuthEngine() {
    const authForm = document.getElementById('authForm');
    const accessKeyInput = document.getElementById('accessKeyInput');
    const authMessage = document.getElementById('authMessage');
    const gerbangOtorisasi = document.getElementById('gerbangOtorisasi'); 
    const dashboardArea = document.getElementById('dashboardArea');
    const btnBiometricLogin = document.getElementById('btnBiometricLogin');
    const btnGoogleLogin = document.getElementById('btnGoogleLogin'); 
    
    let currentSessionWatcher = null;
    let failedAttempts = 0;
    let isLockedOut = false;

    const savedKey = localStorage.getItem('vip_key');
    const savedSessionId = localStorage.getItem('vip_session_id');
    if (savedKey && savedSessionId) verifyAndEnter(savedKey, savedSessionId, true);

    // ==========================================
    // LOGIN GOOGLE
    // ==========================================
    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', async () => {
            showMsg('MEMINTA OTORISASI GOOGLE...', 'var(--neon-gold)');
            const response = await authenticateWithGoogle();
            
            if (response && response.success) {
                // SIMPAN NAMA GOOGLE KE MEMORI
                if (response.googleName) localStorage.setItem('futaqi_google_name', response.googleName);
                
                const vipKey = response.vipKey;
                showMsg('AKUN DIKENALI. MENGHUBUNGKAN...', 'var(--success)');
                const newSessionId = 'SESI-' + Math.random().toString(36).substr(2, 9).toUpperCase();
                await set(ref(db, `vip_keys/${vipKey}/current_session`), newSessionId);
                localStorage.setItem('vip_key', vipKey);
                localStorage.setItem('vip_session_id', newSessionId);
                verifyAndEnter(vipKey, newSessionId, false);
            } 
            else if (response && response.email) {
                const intruderEmail = response.email;
                logFootprint('UNKNOWN-INTRUDER', `DITOLAK - GOOGLE ILEGAL: ${intruderEmail}`);
                triggerLockdown(`AKSES DITOLAK: Akun Google (${intruderEmail}) belum terikat dengan Kunci VIP manapun. Dugaan Infiltrasi Dicatat.`);
            } else { showMsg('OTORISASI GOOGLE GAGAL ATAU DIBATALKAN.', 'var(--danger)'); }
        });
    }

    // ==========================================
    // LOGIN BIOMETRIK 
    // ==========================================
    if (checkBiometricAvailability() && btnBiometricLogin) {
        btnBiometricLogin.classList.remove('hidden');
        btnBiometricLogin.addEventListener('click', async () => {
            showMsg('MEMINTA OTORISASI SENSOR...', 'var(--neon-gold)');
            localStorage.removeItem('futaqi_google_name'); // Hapus sisa nama Google
            const vipKey = await authenticateBiometric();
            
            if (vipKey) {
                showMsg('BIOMETRIK DITERIMA. MENGHUBUNGKAN...', 'var(--success)');
                const newSessionId = 'SESI-' + Math.random().toString(36).substr(2, 9).toUpperCase();
                await set(ref(db, `vip_keys/${vipKey}/current_session`), newSessionId);
                localStorage.setItem('vip_key', vipKey);
                localStorage.setItem('vip_session_id', newSessionId);
                verifyAndEnter(vipKey, newSessionId, false);
            } else { showMsg('OTORISASI BIOMETRIK GAGAL/DIBATALKAN.', 'var(--danger)'); }
        });
    }

    // ==========================================
    // LOGIN MANUAL (KUNCI VIP)
    // ==========================================
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (isLockedOut) { showMsg('SISTEM TERKUNCI. TUNGGU 60 DETIK.', 'var(--danger)'); return; }

            const inputKey = accessKeyInput.value.trim().toLowerCase();
            if (!inputKey) return;
            showMsg('MEMVERIFIKASI PROTOKOL E2EE...', 'var(--neon-gold)');
            accessKeyInput.disabled = true;

            try {
                localStorage.removeItem('futaqi_google_name'); // Hapus sisa nama Google
                const keyRef = ref(db, `vip_keys/${inputKey}`);
                const snapshot = await get(keyRef);

                if (snapshot.exists()) {
                    const data = snapshot.val();
                    if (data.active === true) {
                        failedAttempts = 0; 
                        const newSessionId = 'SESI-' + Math.random().toString(36).substr(2, 9).toUpperCase();
                        await set(ref(db, `vip_keys/${inputKey}/current_session`), newSessionId);
                        localStorage.setItem('vip_key', inputKey);
                        localStorage.setItem('vip_session_id', newSessionId);
                        verifyAndEnter(inputKey, newSessionId, false);
                    } else { handleFailedLogin('AKSES DITOLAK: OTORITAS DICABUT OLEH ADMIN.'); }
                } else { handleFailedLogin('AKSES DITOLAK: KODE VIP TIDAK DIKENAL.'); }
            } catch (error) { handleFailedLogin('GAGAL TERHUBUNG KE SERVER MARKAS.'); } 
            finally { accessKeyInput.disabled = false; }
        });
    }

    function handleFailedLogin(message) {
        failedAttempts++;
        const kotakKunci = document.querySelector('.kotak-kunci');
        if (kotakKunci) kotakKunci.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(0)' }], { duration: 400, easing: 'ease-in-out' });
        if (failedAttempts >= 3) {
            isLockedOut = true; showMsg('AKSES DIBLOKIR SEMENTARA (BRUTE FORCE TERDETEKSI)', 'var(--danger)');
            setTimeout(() => { isLockedOut = false; failedAttempts = 0; showMsg('SISTEM KEMBALI DIBUKA.', 'var(--neon-gold)'); }, 60000); 
        } else { showMsg(message, 'var(--danger)'); }
    }

    // ==========================================
    // 3. MASTER DEVICE VALIDATOR
    // ==========================================
    async function verifyAndEnter(key, sessionId, isAutoLogin) {
        const deviceId = localStorage.getItem('futaqi_device_uid');
        try {
            const masterRef = ref(db, `master_devices/${key}`);
            const masterSnap = await get(masterRef);
            
            if (!masterSnap.exists()) {
                await set(masterRef, { deviceId: deviceId, lockedAt: Date.now() });
                logFootprint(key, "SUKSES MASUK (MASTER DEVICE PERDANA DIKUNCI)");
            } else {
                const masterData = masterSnap.val();
                if (masterData.deviceId !== deviceId) {
                    logFootprint(key, "DITOLAK - UPAYA LOGIN DARI PERANGKAT ILEGAL");
                    triggerLockdown('AKSES DITOLAK: Kunci VIP ini telah terikat secara permanen pada perangkat utama Anda. Menggunakan dua perangkat secara bersamaan adalah pelanggaran protokol.');
                    kickOut('PERANGKAT ILEGAL DIBLOKIR.');
                    return; 
                } else { logFootprint(key, "SUKSES MASUK (MASTER DEVICE TERVERIFIKASI)"); }
            }
        } catch (e) { console.warn("Gagal memvalidasi Master Device:", e); }

        const keyRef = ref(db, `vip_keys/${key}`);
        currentSessionWatcher = onValue(keyRef, (snapshot) => {
            const data = snapshot.val();
            if (!data || data.active !== true) { kickOut('KONEKSI DIPUTUS OLEH ADMINISTRATOR.'); return; }
            if (data.current_session !== sessionId) { kickOut('SESI ILEGAL: KUNCI DIGUNAKAN DI PERANGKAT LAIN.'); return; }

            // SIMPAN NAMA DARI ADMIN KE MEMORI LOKAL
            if (data.name) localStorage.setItem('futaqi_admin_given_name', data.name);

            if (deviceId) connectDeviceToRadar(key, data.name || 'VIP Client');

            if (gerbangOtorisasi && gerbangOtorisasi.style.display !== 'none') {
                if(isAutoLogin) showMsg('MEMULIHKAN SESI TERENKRIPSI...', 'var(--neon-gold)');
                setTimeout(() => {
                    gerbangOtorisasi.style.opacity = '0';
                    setTimeout(() => {
                        gerbangOtorisasi.style.display = 'none';
                        if (dashboardArea) {
                            dashboardArea.style.display = 'flex';
                            setTimeout(() => {
                                dashboardArea.style.opacity = '1';
                                initChat(key, data.name || 'Klien VIP');
                            }, 50);
                        }
                    }, 700);
                }, 800);
            }
        });
    }

    function kickOut(reasonMessage) {
        localStorage.removeItem('vip_key');
        localStorage.removeItem('vip_session_id');
        localStorage.removeItem('futaqi_google_name');
        localStorage.removeItem('futaqi_admin_given_name');
        if (currentSessionWatcher) currentSessionWatcher();
        
        if (dashboardArea) dashboardArea.style.opacity = '0';
        setTimeout(() => {
            if (dashboardArea) dashboardArea.style.display = 'none';
            if (gerbangOtorisasi) {
                gerbangOtorisasi.style.display = 'flex';
                setTimeout(() => {
                    gerbangOtorisasi.style.opacity = '1';
                    if (accessKeyInput) accessKeyInput.value = '';
                    showMsg(reasonMessage, 'var(--danger)');
                }, 50);
            }
        }, 700);
    }

    function showMsg(text, color) {
        if (!authMessage) return; authMessage.style.color = color; authMessage.textContent = text; authMessage.style.opacity = '1';
        if(color === 'var(--danger)') setTimeout(() => authMessage.style.opacity = '0', 4000);
    }
                  }
                        
