/**
 * Push Notification & Waste Collection Reminder helper.
 */

const REMINDERS_KEY = 'ward19_waste_reminder_subscriptions';

export interface WasteNotificationPreferences {
  enabled: boolean;
  subscribedTypes: string[];
}

export function getWasteReminderPreferences(): WasteNotificationPreferences {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    if (!raw) return { enabled: false, subscribedTypes: ['പ്ലാസ്റ്റിക് / അജൈവം', 'ഗ്ലാസ്'] };
    return JSON.parse(raw);
  } catch {
    return { enabled: false, subscribedTypes: ['പ്ലാസ്റ്റിക് / അജൈവം', 'ഗ്ലാസ്'] };
  }
}

export function saveWasteReminderPreferences(prefs: WasteNotificationPreferences): void {
  try {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

/**
 * Requests Notification permission from browser.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

/**
 * Show a local reminder notification if permitted.
 */
export function triggerLocalWasteNotification(wasteType: string, dateInfo: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  try {
    new Notification('ഹരിത കർമ്മ സേന — മാലിന്യ ശേഖരണ ഓർമ്മപ്പെടുത്തൽ', {
      body: `വാർഡ് 19: ${wasteType} ശേഖരണം ${dateInfo}. മാലിന്യങ്ങൾ മുൻകൂട്ടി വേർതിരിച്ചു വെയ്ക്കുക.`,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
    });
  } catch (err) {
    console.warn('Could not trigger notification', err);
  }
}

/**
 * Firebase Cloud Function snippet for automated daily/weekly waste reminder push broadcast.
 */
export const CLOUD_FUNCTION_DOCUMENTATION = `
// ==============================================================================
// Firebase Cloud Function for Scheduled Waste Reminders (Blaze Plan)
// Deploy: firebase deploy --only functions
// ==============================================================================
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Runs every morning at 7:00 AM IST to notify subscribers
exports.scheduledWasteReminder = functions.pubsub
  .schedule('0 7 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const db = admin.firestore();
    const today = new Date().toISOString().slice(0, 10);
    
    // Find schedules matching today
    const snapshot = await db.collection('wasteSchedule')
      .where('nextDate', '==', today)
      .get();
      
    if (snapshot.empty) return null;

    const messages = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      messages.push({
        notification: {
          title: 'ഹരിത കർമ്മ സേന — മാലിന്യ ശേഖരണം',
          body: \`ഇന്ന് വാർഡ് 19-ൽ \${data.wasteType} ശേഖരണ ദിവസമാണ്. മാലിന്യങ്ങൾ തരംതിരിച്ചു വെയ്ക്കുക.\`,
        },
        topic: 'waste_reminders',
      });
    });

    for (const msg of messages) {
      await admin.messaging().send(msg);
    }
    return null;
  });
`;
