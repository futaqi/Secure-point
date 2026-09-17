importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyBbG-pk2n3cJ09-egduIDhmVTS04yhX0jM",
    authDomain: "futaqi-ali.firebaseapp.com",
    databaseURL: "https://futaqi-ali-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "futaqi-ali",
    storageBucket: "futaqi-ali.firebasestorage.app",
    messagingSenderId: "77087108301",
    appId: "1:77087108301:web:682924ffc170f789870d84"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Mencegat Sinyal Alarm saat Browser HP Ditutup
messaging.onBackgroundMessage((payload) => {
    console.log('[Service Worker] Sinyal Radar Diterima di Latar Belakang.');
    
    const notificationTitle = '🚨 SUDAH TIBA';
    const notificationOptions = {
        body: 'Sistem Radar mengonfirmasi kendaraan telah tiba di titik koordinat Anda.',
        icon: 'https://cdn-icons-png.flaticon.com/512/6592/6592963.png',
        vibrate: [250, 80, 250, 80, 250, 80, 500], // Getaran paksa sistem
        requireInteraction: true
    };
    
    self.registration.showNotification(notificationTitle, notificationOptions);
});
