import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, get, set, update, onDisconnect, serverTimestamp, push, onChildAdded, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Konfigurasi Database Utama Anda
const firebaseConfig = {
    apiKey: "AIzaSyBbG-pk2n3cJ09-egduIDhmVTS04yhX0jM",
    authDomain: "futaqi-ali.firebaseapp.com",
    databaseURL: "https://futaqi-ali-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "futaqi-ali",
    storageBucket: "futaqi-ali.firebasestorage.app",
    messagingSenderId: "77087108301",
    appId: "1:77087108301:web:682924ffc170f789870d84"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messaging = getMessaging(app);

// Inisialisasi Google Auth Provider
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Ekspor Mesin Utuh (Termasuk onChildRemoved untuk fitur Ghosting Hapus Chat)
export { db, ref, onValue, get, set, update, onDisconnect, serverTimestamp, push, onChildAdded, onChildRemoved, messaging, getToken, onMessage, auth, googleProvider, signInWithPopup };
