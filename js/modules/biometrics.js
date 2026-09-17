import { db, ref, get, set } from '../firebase.js';

// Fungsi Helper (Mengubah Array Buffer Kriptografi ke Base64)
function bufferToBase64url(buffer) {
    const byteArr = new Uint8Array(buffer);
    let str = '';
    for (let byte of byteArr) str += String.fromCharCode(byte);
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlToBuffer(base64url) {
    const padding = '='.repeat((4 - base64url.length % 4) % 4);
    const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const buffer = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) buffer[i] = rawData.charCodeAt(i);
    return buffer.buffer;
}

// Fungsi Pemanggil Pop-Up Holografik (Fallback Aman)
function callPopup(title, msg, type) {
    if (window.showSystemModal) window.showSystemModal(title, msg, type);
    else alert(msg);
}

// FUNGSI 1: MENDAFTARKAN SIDIK JARI / WAJAH BARU
export async function registerBiometric(vipKey) {
    if (!window.PublicKeyCredential) {
        callPopup('TIDAK DIDUKUNG', 'Perangkat/Browser ini tidak mendukung Sensor Biometrik (WebAuthn).', 'error');
        return false;
    }

    try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const userId = crypto.getRandomValues(new Uint8Array(16));

        // Memanggil Sensor Sistem Operasi HP
        const credential = await navigator.credentials.create({
            publicKey: {
                challenge: challenge,
                rp: { name: "VIP Portal Executive" },
                user: { id: userId, name: `VIP-${vipKey}`, displayName: "Klien VIP" },
                pubKeyCredParams: [
                    { type: 'public-key', alg: -7 },  // ES256
                    { type: 'public-key', alg: -257 } // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform", // Wajib sensor bawaan HP
                    userVerification: "required"
                },
                timeout: 60000
            }
        });

        if (credential) {
            const credentialId = bufferToBase64url(credential.rawId);
            
            // Simpan ID Kredensial di memori browser Klien
            localStorage.setItem('futaqi_bio_id', credentialId);
            
            // Simpan Relasi Kredensial -> VIP Key di Firebase sebagai brankas
            await set(ref(db, `biometric_credentials/${credentialId}`), {
                vipKey: vipKey,
                registeredAt: Date.now(),
                userAgent: navigator.userAgent
            });

            callPopup('REGISTRASI BERHASIL', 'Otorisasi Biometrik Berhasil Didaftarkan! Sesi selanjutnya Anda dapat masuk secara instan menggunakan FaceID / TouchID.', 'success');
            return true;
        }
    } catch (error) {
        console.warn('Registrasi Biometrik Dibatalkan:', error);
        callPopup('REGISTRASI GAGAL', 'Gagal mendaftarkan biometrik. Pastikan perangkat Anda memiliki kunci layar/sidik jari aktif.', 'error');
        return false;
    }
}

// FUNGSI 2: MEMBUKA KUNCI DENGAN SIDIK JARI / WAJAH
export async function authenticateBiometric() {
    const credentialIdBase64 = localStorage.getItem('futaqi_bio_id');
    if (!credentialIdBase64) return null;

    try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const credentialIdBuffer = base64urlToBuffer(credentialIdBase64);

        // Meminta otentikasi wajah/jari
        const assertion = await navigator.credentials.get({
            publicKey: {
                challenge: challenge,
                allowCredentials: [{
                    type: 'public-key',
                    id: credentialIdBuffer,
                    transports: ['internal']
                }],
                userVerification: "required",
                timeout: 60000
            }
        });

        if (assertion) {
            // Jika berhasil diverifikasi oleh HP, ambil Kunci VIP di brankas Firebase
            const snapshot = await get(ref(db, `biometric_credentials/${credentialIdBase64}`));
            if (snapshot.exists()) {
                return snapshot.val().vipKey; // Mengembalikan kunci 'andi-1780'
            } else {
                callPopup('OTENTIKASI GAGAL', 'Kredensial tidak valid di server. Silakan masuk menggunakan Kode VIP.', 'error');
                return null;
            }
        }
    } catch (error) {
        console.warn('Otentikasi Biometrik Batal/Gagal:', error);
        return null;
    }
}

// FUNGSI 3: DETEKSI KETERSEDIAAN
export function checkBiometricAvailability() {
    return !!localStorage.getItem('futaqi_bio_id') && !!window.PublicKeyCredential;
}
