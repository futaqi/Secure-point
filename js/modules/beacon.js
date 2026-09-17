import { db, ref, onValue, set, update, onDisconnect, serverTimestamp, messaging, getToken, onMessage } from '../firebase.js';

let deviceId = localStorage.getItem('futaqi_device_uid');
if (!deviceId) {
  deviceId = 'DEV-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
  localStorage.setItem('futaqi_device_uid', deviceId);
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let os = 'Desktop', browser = 'Browser';
  if (/Android/i.test(ua)) os = 'Android'; else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS'; else if (/Windows/i.test(ua)) os = 'Windows'; else if (/Mac/i.test(ua)) os = 'MacOS';
  if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) browser = 'Chrome'; else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  return `${os} / ${browser}`;
}

export function connectDeviceToRadar(vipKey, clientName) {
  const deviceRef = ref(db, `devices/${deviceId}`);
  const connectedRef = ref(db, '.info/connected');

  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      onDisconnect(deviceRef).update({ isOnline: false, lastActive: serverTimestamp() });
      update(deviceRef, { deviceId: deviceId, deviceInfo: getDeviceInfo(), vipKey: vipKey, clientName: clientName, isOnline: true, lastActive: Date.now() });
    }
  });
}

export function initArrivalBeacon() {
  const alarmModal = document.getElementById('alarmModal');
  const btnAcknowledgeAlarm = document.getElementById('btnAcknowledgeAlarm');
  
  // PENAMBALAN ID BARU UNTUK DASHBOARD EKSEKUTIF
  const notifIndicatorDash = document.getElementById('notifIndicatorDashboard');
  const btnActivateNotif = document.getElementById('btnActivateNotif');

  function checkNotificationStatus() {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'granted') {
          if (notifIndicatorDash) {
              notifIndicatorDash.style.background = 'var(--success)';
              notifIndicatorDash.style.boxShadow = '0 0 10px var(--success)';
              notifIndicatorDash.classList.remove('animate-pulse');
          }
          if (btnActivateNotif) btnActivateNotif.style.display = 'none'; 
      } else {
          if (notifIndicatorDash) {
              notifIndicatorDash.style.background = 'var(--danger)';
              notifIndicatorDash.style.boxShadow = '0 0 10px var(--danger)';
              notifIndicatorDash.classList.add('animate-pulse');
          }
          if (btnActivateNotif) btnActivateNotif.style.display = 'flex';
      }
  }
  checkNotificationStatus(); 

  let isAlarmActiveLocally = false;
  const alarmAudio = new Audio('https://res.cloudinary.com/wuw7hvjo/video/upload/v1789604959/lz4rtzjsnfrzssured53.mp3');
  alarmAudio.loop = true; 

  function unlockAudioEngine() {
      alarmAudio.play().then(() => { alarmAudio.pause(); alarmAudio.currentTime = 0; }).catch(err => console.warn(err));
  }

  function startAlarmSequence() {
    if (isAlarmActiveLocally) return;
    isAlarmActiveLocally = true;
    alarmAudio.play().catch(e => console.warn('Browser memblokir Autoplay:', e));
  }

  function stopAlarmSequence() {
    isAlarmActiveLocally = false;
    alarmAudio.pause();
    alarmAudio.currentTime = 0; 
  }

  async function requestPushPermission() {
      try {
          const permission = await Notification.requestPermission();
          checkNotificationStatus(); 
          if (permission === 'granted') {
              const token = await getToken(messaging, { vapidKey: "BH2GR97ZX7Xatwq9nZSfTKp02EhJX6kA2yHvLUXqwgLmN8LCmF7Ur412KynXYBqdl14PrVOMVGMQ4otNiejAiUY" });
              if (token) update(ref(db, `devices/${deviceId}`), { fcmToken: token });
          }
      } catch (error) { console.warn("Modul PWA Push diblokir:", error); }
  }

  if (btnActivateNotif) {
      btnActivateNotif.addEventListener('click', () => {
        unlockAudioEngine(); 
        requestPushPermission();
      });
  }

  onMessage(messaging, (payload) => {
      startAlarmSequence();
      if(alarmModal) alarmModal.classList.remove('hidden');
  });

  onValue(ref(db, `devices/${deviceId}/alarm`), (snapshot) => {
    const isAlarmTriggered = snapshot.val() === true;
    if (isAlarmTriggered) {
      startAlarmSequence();
      if(alarmModal) alarmModal.classList.remove('hidden');
    } else {
      stopAlarmSequence();
      if(alarmModal) alarmModal.classList.add('hidden');
    }
  });

  if (btnAcknowledgeAlarm) {
      btnAcknowledgeAlarm.addEventListener('click', (e) => {
        e.stopPropagation();
        stopAlarmSequence();
        alarmModal.classList.add('hidden');
        set(ref(db, `devices/${deviceId}/alarm`), false);
      });
  }
}
