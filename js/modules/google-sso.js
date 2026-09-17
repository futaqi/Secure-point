import { db, ref, get, set, auth, googleProvider, signInWithPopup } from '../firebase.js';

// Fungsi Pemanggil Pop-Up Holografik (Fallback Aman)
function callPopup(title, msg, type) {
    if (window.showSystemModal) window.showSystemModal(title, msg, type);
    else alert(msg);
}

// FUNGSI 1: MENGIKAT AKUN GOOGLE (Dipanggil di dalam portal)
export async function bindGoogleAccount(currentVipKey) {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        await set(ref(db, `google_bindings/${user.uid}`), {
            vipKey: currentVipKey,
            email: user.email,
            displayName: user.displayName,
            boundAt: Date.now()
        });

        callPopup('TAUTAN BERHASIL', `Akun Google (${user.email}) berhasil ditautkan secara permanen ke Kunci VIP Anda.`, 'success');
        return true;
    } catch (error) {
        console.warn("Binding Google Gagal:", error);
        callPopup('TAUTAN GAGAL', 'Gagal menautkan akun Google. Pastikan koneksi internet stabil.', 'error');
        return false;
    }
}

// FUNGSI 2: OTENTIKASI GOOGLE (Scanner Kredensial)
export async function authenticateWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        const snapshot = await get(ref(db, `google_bindings/${user.uid}`));
        
        if (snapshot.exists()) {
            // SAH: Kembalikan Kunci VIP DAN Nama Google Klien
            return { success: true, vipKey: snapshot.val().vipKey, googleName: user.displayName }; 
        } else {
            // ILEGAL: Kembalikan data email penyusup untuk dihakimi oleh auth.js
            return { success: false, email: user.email };
        }
    } catch (error) {
        console.warn("Login Google Dibatalkan/Gagal:", error);
        return { success: false, error: true };
    }
}
