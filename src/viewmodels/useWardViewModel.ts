import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  db,
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  fbSignOut,
  ensureResidentSilentAuth,
  handleFirestoreError,
  OperationType,
  testConnection,
} from '../firebase';
import {
  Language,
  WardInfo,
  Notice,
  Contact,
  Complaint,
  ComplaintPublicStatus,
  Scheme,
  DirectoryEntry,
  ComplaintStatus,
  FormItem,
  EventItem,
  GramSabhaMeeting,
  GramSabhaPoint,
  WasteScheduleItem,
  WasteInfo,
  DevelopmentWork,
  BloodDonor,
} from '../types/ward';
import {
  INITIAL_WARD_INFO,
  INITIAL_NOTICES,
  INITIAL_CONTACTS,
  INITIAL_SCHEMES,
  INITIAL_DIRECTORY,
  INITIAL_RESOLVED_PUBLIC_STATUS,
  INITIAL_FORMS,
  INITIAL_EVENTS,
  INITIAL_GRAM_SABHAS,
  INITIAL_WASTE_SCHEDULE,
  INITIAL_WASTE_INFO,
  INITIAL_WORKS,
  INITIAL_DONORS,
} from '../data/seedData';
import { triggerLocalWasteNotification } from '../utils/notifications';

const CACHE_KEYS = {
  LANG: 'ward19_lang_pref',
  WARD_INFO: 'ward19_cache_ward_info_v2',
  NOTICES: 'ward19_cache_notices_v4',
  CONTACTS: 'ward19_cache_contacts_v3',
  SCHEMES: 'ward19_cache_schemes_v2',
  DIRECTORY: 'ward19_cache_directory_v4',
  PUBLIC_STATUS: 'ward19_cache_public_status_v2',
  FORMS: 'ward19_cache_forms_v2',
  EVENTS: 'ward19_cache_events_v2',
  GRAM_SABHAS: 'ward19_cache_gram_sabhas_v2',
  WASTE_SCHEDULE: 'ward19_cache_waste_schedule_v2',
  WASTE_INFO: 'ward19_cache_waste_info_v2',
  WORKS: 'ward19_cache_works_v2',
  DONORS: 'ward19_cache_donors_v2',
  LAST_COMPLAINT_DATE: 'ward19_last_complaint_date',
  LAST_COMPLAINT_REF: 'ward19_last_complaint_ref',
  LAST_GS_POINT_DATE: 'ward19_last_gs_point_date',
  LAST_GS_POINT_COUNT: 'ward19_last_gs_point_count',
  LAST_DONOR_REG_DATE: 'ward19_last_donor_reg_date',
};

function readCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota warnings
  }
}

export function useWardViewModel() {
  // Language locked to Malayalam ('ml')
  const [lang] = useState<Language>('ml');
  const setLang = useCallback((_next: Language) => {
    // Malayalam-only mode
  }, []);

  // Offline / connection state
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [pushBanner, setPushBanner] = useState<string | null>(null);

  // Domain Data States (initialized from local offline cache first, then updated live from Firestore)
  const [wardInfo, setWardInfo] = useState<WardInfo>(() =>
    readCache<WardInfo>(CACHE_KEYS.WARD_INFO, {
      id: 'seed_main_v2',
      ...INITIAL_WARD_INFO,
    })
  );
  const [notices, setNotices] = useState<Notice[]>(() =>
    readCache<Notice[]>(CACHE_KEYS.NOTICES, INITIAL_NOTICES)
  );
  const [contacts, setContacts] = useState<Contact[]>(() =>
    readCache<Contact[]>(CACHE_KEYS.CONTACTS, INITIAL_CONTACTS)
  );
  const [schemes, setSchemes] = useState<Scheme[]>(() =>
    readCache<Scheme[]>(CACHE_KEYS.SCHEMES, INITIAL_SCHEMES)
  );
  const [forms, setForms] = useState<FormItem[]>(() =>
    readCache<FormItem[]>(CACHE_KEYS.FORMS, INITIAL_FORMS)
  );
  const [events, setEvents] = useState<EventItem[]>(() =>
    readCache<EventItem[]>(CACHE_KEYS.EVENTS, INITIAL_EVENTS)
  );
  const [gramSabhas, setGramSabhas] = useState<GramSabhaMeeting[]>(() =>
    readCache<GramSabhaMeeting[]>(CACHE_KEYS.GRAM_SABHAS, INITIAL_GRAM_SABHAS)
  );
  const [gramSabhaPoints, setGramSabhaPoints] = useState<GramSabhaPoint[]>([]);
  const [wasteSchedule, setWasteSchedule] = useState<WasteScheduleItem[]>(() =>
    readCache<WasteScheduleItem[]>(CACHE_KEYS.WASTE_SCHEDULE, INITIAL_WASTE_SCHEDULE)
  );
  const [wasteInfo, setWasteInfo] = useState<WasteInfo>(() =>
    readCache<WasteInfo>(CACHE_KEYS.WASTE_INFO, {
      id: 'seed_waste_info_main',
      ...INITIAL_WASTE_INFO,
    })
  );
  const [works, setWorks] = useState<DevelopmentWork[]>(() =>
    readCache<DevelopmentWork[]>(CACHE_KEYS.WORKS, INITIAL_WORKS)
  );
  const [donors, setDonors] = useState<BloodDonor[]>(() =>
    readCache<BloodDonor[]>(CACHE_KEYS.DONORS, INITIAL_DONORS)
  );
  const [directory, setDirectory] = useState<DirectoryEntry[]>(() =>
    readCache<DirectoryEntry[]>(CACHE_KEYS.DIRECTORY, INITIAL_DIRECTORY)
  );
  const [publicStatuses, setPublicStatuses] = useState<ComplaintPublicStatus[]>(() =>
    readCache<ComplaintPublicStatus[]>(
      CACHE_KEYS.PUBLIC_STATUS,
      INITIAL_RESOLVED_PUBLIC_STATUS
    )
  );
  const [adminComplaints, setAdminComplaints] = useState<Complaint[]>([]);

  // Auth & Admin Role State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState<boolean>(false);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Boot connection check + initial Firestore seeding so all content lives in Firestore
  useEffect(() => {
    let mounted = true;
    async function initFirestoreData() {
      await testConnection();
      await ensureResidentSilentAuth();

      try {
        // 1. Ward Info
        const mainWardSnap = await getDoc(doc(db, 'ward_info', 'seed_main_v2'));
        if (!mainWardSnap.exists()) {
          await setDoc(doc(db, 'ward_info', 'seed_main_v2'), {
            ...INITIAL_WARD_INFO,
            updatedAt: serverTimestamp(),
          });
        }

        // 2. Verified Notices
        const v2NoticeSnap = await getDoc(doc(db, 'notices', 'seed_v2_notice_1'));
        if (!v2NoticeSnap.exists()) {
          for (const n of INITIAL_NOTICES) {
            const { id, ...rest } = n;
            await setDoc(doc(db, 'notices', id), {
              ...rest,
              createdAt: serverTimestamp(),
            });
          }
        }

        // 3. Contacts
        const v3ContactSnap = await getDoc(doc(db, 'contacts', 'seed_v3_contact_1'));
        if (!v3ContactSnap.exists()) {
          for (const c of INITIAL_CONTACTS) {
            const { id, ...rest } = c;
            await setDoc(doc(db, 'contacts', id), {
              ...rest,
              createdAt: serverTimestamp(),
            });
          }
        }

        // 4. Schemes
        const v2SchemeSnap = await getDoc(doc(db, 'schemes', 'seed_v2_scheme_1'));
        if (!v2SchemeSnap.exists()) {
          for (const s of INITIAL_SCHEMES) {
            const { id, ...rest } = s;
            await setDoc(doc(db, 'schemes', id), {
              ...rest,
              createdAt: serverTimestamp(),
            });
          }
        }

        // 5. Waste Info (Verified Helpline 9446700800)
        const wasteInfoSnap = await getDoc(doc(db, 'wasteInfo', 'seed_waste_info_main'));
        if (!wasteInfoSnap.exists()) {
          await setDoc(doc(db, 'wasteInfo', 'seed_waste_info_main'), {
            ...INITIAL_WASTE_INFO,
            updatedAt: serverTimestamp(),
          });
        }

        // 6. Purge any dummy seed documents if present
        const dummyDocRefs = [
          doc(db, 'notices', 'seed_v2_notice_job_1'),
          doc(db, 'notices', 'seed_v2_notice_job_2'),
          doc(db, 'notices', 'seed_v2_notice_job_3'),
          doc(db, 'forms', 'seed_form_1'),
          doc(db, 'forms', 'seed_form_2'),
          doc(db, 'forms', 'seed_form_3'),
          doc(db, 'forms', 'seed_form_4'),
          doc(db, 'forms', 'seed_form_5'),
          doc(db, 'events', 'seed_event_1'),
          doc(db, 'events', 'seed_event_2'),
          doc(db, 'events', 'seed_event_3'),
          doc(db, 'events', 'seed_event_4'),
          doc(db, 'gramSabhas', 'seed_gs_1'),
          doc(db, 'gramSabhas', 'seed_gs_2'),
          doc(db, 'wasteSchedule', 'seed_waste_1'),
          doc(db, 'wasteSchedule', 'seed_waste_2'),
          doc(db, 'wasteSchedule', 'seed_waste_3'),
          doc(db, 'wasteSchedule', 'seed_waste_4'),
          doc(db, 'works', 'seed_work_1'),
          doc(db, 'works', 'seed_work_2'),
          doc(db, 'works', 'seed_work_3'),
          doc(db, 'works', 'seed_work_4'),
          doc(db, 'donors', 'seed_donor_1'),
          doc(db, 'donors', 'seed_donor_2'),
          doc(db, 'donors', 'seed_donor_3'),
          doc(db, 'donors', 'seed_donor_4'),
          doc(db, 'donors', 'seed_donor_5'),
          doc(db, 'donors', 'seed_donor_6'),
          doc(db, 'donors', 'seed_donor_7'),
          doc(db, 'donors', 'seed_donor_8'),
        ];
        for (const ref of dummyDocRefs) {
          try {
            await deleteDoc(ref);
          } catch {
            // Non-admin will skip, snapshot listener filter will handle
          }
        }

        // 11. Directory
        const v4DirSnap = await getDoc(doc(db, 'directory', 'seed_v4_dir_1'));
        if (!v4DirSnap.exists()) {
          for (const d of INITIAL_DIRECTORY) {
            const { id, ...rest } = d;
            await setDoc(doc(db, 'directory', id), {
              ...rest,
              createdAt: serverTimestamp(),
            });
          }
        }
      } catch (err) {
        console.warn('Initial seed check skipped or offline:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    initFirestoreData();
    return () => {
      mounted = false;
    };
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user || user.isAnonymous) {
        setIsAdmin(false);
        setAdminCheckComplete(true);
        return;
      }

      try {
        const isBootstrappedEmail =
          user.email?.toLowerCase() === 'muhdriyu@gmail.com' &&
          user.emailVerified;
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists() || isBootstrappedEmail) {
          setIsAdmin(true);
          if (isBootstrappedEmail && !adminDoc.exists()) {
            try {
              await setDoc(doc(db, 'admins', user.uid), {
                email: user.email || 'muhdRiyu@gmail.com',
                name: user.displayName || 'Ward 19 Admin',
                createdAt: serverTimestamp(),
              });
            } catch {
              // Ignore
            }
          }
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setAdminCheckComplete(true);
      }
    });
    return () => unsub();
  }, []);

  // Real-time Firestore Listeners
  useEffect(() => {
    const unsubWard = onSnapshot(
      doc(db, 'ward_info', 'seed_main_v2'),
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...(snap.data() as Omit<WardInfo, 'id'>) };
          setWardInfo(data);
          writeCache(CACHE_KEYS.WARD_INFO, data);
        }
      },
      (err) => console.warn('Ward info error:', err)
    );

    const unsubNotices = onSnapshot(
      collection(db, 'notices'),
      (snap) => {
        const list = snap.empty
          ? []
          : snap.docs
              .filter(
                (d) =>
                  !d.id.startsWith('seed_notice_') &&
                  !d.id.startsWith('seed_v2_notice_job_')
              )
              .map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Notice, 'id'>),
              }));
        setNotices(list);
        writeCache(CACHE_KEYS.NOTICES, list);
        setIsLoading(false);
      },
      (err) => {
        console.warn('Notices error:', err);
        setIsLoading(false);
      }
    );

    const unsubContacts = onSnapshot(
      collection(db, 'contacts'),
      (snap) => {
        const list = snap.empty
          ? []
          : snap.docs
              .filter(
                (d) =>
                  !d.id.startsWith('seed_contact_') &&
                  !d.id.startsWith('seed_v2_contact_')
              )
              .map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Contact, 'id'>),
              }))
              .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
        if (list.length > 0) {
          setContacts(list);
          writeCache(CACHE_KEYS.CONTACTS, list);
        }
      },
      (err) => console.warn('Contacts error:', err)
    );

    const unsubSchemes = onSnapshot(
      collection(db, 'schemes'),
      (snap) => {
        const list = snap.empty
          ? []
          : snap.docs
              .filter((d) => !d.id.startsWith('seed_scheme_'))
              .map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Scheme, 'id'>),
              }));
        if (list.length > 0) {
          setSchemes(list);
          writeCache(CACHE_KEYS.SCHEMES, list);
        }
      },
      (err) => console.warn('Schemes error:', err)
    );

    const unsubForms = onSnapshot(
      collection(db, 'forms'),
      (snap) => {
        const list = snap.empty
          ? []
          : snap.docs
              .filter((d) => !d.id.startsWith('seed_form_'))
              .map((d) => ({
                id: d.id,
                ...(d.data() as Omit<FormItem, 'id'>),
              }));
        setForms(list);
        writeCache(CACHE_KEYS.FORMS, list);
      },
      (err) => console.warn('Forms error:', err)
    );

    const unsubEvents = onSnapshot(
      collection(db, 'events'),
      (snap) => {
        const list = snap.empty
          ? []
          : snap.docs
              .filter((d) => !d.id.startsWith('seed_event_'))
              .map((d) => ({
                id: d.id,
                ...(d.data() as Omit<EventItem, 'id'>),
              }))
              .sort((a, b) => a.date.localeCompare(b.date));
        setEvents(list);
        writeCache(CACHE_KEYS.EVENTS, list);
      },
      (err) => console.warn('Events error:', err)
    );

    const unsubGramSabhas = onSnapshot(
      collection(db, 'gramSabhas'),
      (snap) => {
        const list = snap.empty
          ? []
          : snap.docs
              .filter((d) => !d.id.startsWith('seed_gs_'))
              .map((d) => ({
                id: d.id,
                ...(d.data() as Omit<GramSabhaMeeting, 'id'>),
              }));
        setGramSabhas(list);
        writeCache(CACHE_KEYS.GRAM_SABHAS, list);
      },
      (err) => console.warn('Gram sabhas error:', err)
    );

    const unsubWasteSchedule = onSnapshot(
      collection(db, 'wasteSchedule'),
      (snap) => {
        const list = snap.empty
          ? []
          : snap.docs
              .filter((d) => !d.id.startsWith('seed_waste_'))
              .map((d) => ({
                id: d.id,
                ...(d.data() as Omit<WasteScheduleItem, 'id'>),
              }));
        setWasteSchedule(list);
        writeCache(CACHE_KEYS.WASTE_SCHEDULE, list);
      },
      (err) => console.warn('Waste schedule error:', err)
    );

    const unsubWasteInfo = onSnapshot(
      doc(db, 'wasteInfo', 'seed_waste_info_main'),
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...(snap.data() as Omit<WasteInfo, 'id'>) };
          setWasteInfo(data);
          writeCache(CACHE_KEYS.WASTE_INFO, data);
        }
      },
      (err) => console.warn('Waste info error:', err)
    );

    const unsubWorks = onSnapshot(
      collection(db, 'works'),
      (snap) => {
        const list = snap.empty
          ? []
          : snap.docs
              .filter((d) => !d.id.startsWith('seed_work_'))
              .map((d) => ({
                id: d.id,
                ...(d.data() as Omit<DevelopmentWork, 'id'>),
              }));
        setWorks(list);
        writeCache(CACHE_KEYS.WORKS, list);
      },
      (err) => console.warn('Works error:', err)
    );

    const unsubDonors = onSnapshot(
      collection(db, 'donors'),
      (snap) => {
        const list = snap.empty
          ? []
          : snap.docs
              .filter((d) => !d.id.startsWith('seed_donor_'))
              .map((d) => ({
                id: d.id,
                ...(d.data() as Omit<BloodDonor, 'id'>),
              }));
        setDonors(list);
        writeCache(CACHE_KEYS.DONORS, list);
      },
      (err) => console.warn('Donors error:', err)
    );

    const unsubDirectory = onSnapshot(
      collection(db, 'directory'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs
            .filter((d) => !d.id.startsWith('seed_dir_') && !d.id.startsWith('seed_v2_dir_') && !d.id.startsWith('seed_v3_dir_'))
            .map((d) => ({
              id: d.id,
              ...(d.data() as Omit<DirectoryEntry, 'id'>),
            }));
          if (list.length > 0) {
            setDirectory(list);
            writeCache(CACHE_KEYS.DIRECTORY, list);
          }
        }
      },
      (err) => console.warn('Directory error:', err)
    );

    const unsubPublicStatuses = onSnapshot(
      collection(db, 'complaint_status'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ComplaintPublicStatus, 'id'>),
          }))
          .filter((item) => !item.authorUid?.startsWith('anon_seed_resident'))
          .sort((a, b) => b.referenceNumber.localeCompare(a.referenceNumber));
        setPublicStatuses(list);
        writeCache(CACHE_KEYS.PUBLIC_STATUS, list);
      },
      (err) => console.warn('Public status error:', err)
    );

    return () => {
      unsubWard();
      unsubNotices();
      unsubContacts();
      unsubSchemes();
      unsubForms();
      unsubEvents();
      unsubGramSabhas();
      unsubWasteSchedule();
      unsubWasteInfo();
      unsubWorks();
      unsubDonors();
      unsubDirectory();
      unsubPublicStatuses();
    };
  }, []);

  // Admin-only listeners (Complaints and Gram Sabha Points)
  useEffect(() => {
    if (!isAdmin) {
      setAdminComplaints([]);
      setGramSabhaPoints([]);
      return;
    }
    const unsubComplaints = onSnapshot(
      collection(db, 'complaints'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Complaint, 'id'>),
          }))
          .filter((item) => !item.authorUid?.startsWith('anon_seed_resident'))
          .sort((a, b) => b.referenceNumber.localeCompare(a.referenceNumber));
        setAdminComplaints(list);
      },
      (err) => console.warn('Admin complaints error:', err)
    );

    const unsubPoints = onSnapshot(
      collection(db, 'gramSabhaPoints'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<GramSabhaPoint, 'id'>),
        }));
        setGramSabhaPoints(list);
      },
      (err) => console.warn('Gram sabha points error:', err)
    );

    return () => {
      unsubComplaints();
      unsubPoints();
    };
  }, [isAdmin]);

  // Daily rate limiting for complaints (1 per device/day)
  const hasSubmittedToday = useCallback((): {
    limited: boolean;
    lastRef: string | null;
  } => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastDate = localStorage.getItem(CACHE_KEYS.LAST_COMPLAINT_DATE);
    const lastRef = localStorage.getItem(CACHE_KEYS.LAST_COMPLAINT_REF);
    return {
      limited: lastDate === todayStr,
      lastRef,
    };
  }, []);

  const resetDailyLimitForTesting = useCallback(() => {
    localStorage.removeItem(CACHE_KEYS.LAST_COMPLAINT_DATE);
  }, []);

  // Submit Complaint
  const submitComplaint = useCallback(
    async (input: {
      name: string;
      phone: string;
      category: Complaint['category'];
      place: string;
      description: string;
      photoUrl?: string;
      latitude?: number;
      longitude?: number;
    }): Promise<string> => {
      const todayCheck = hasSubmittedToday();
      if (todayCheck.limited) {
        throw new Error(
          `ഒരു ഫോണിൽ നിന്ന് ദിവസം ഒരു പരാതി മാത്രമേ അയക്കാൻ സാധിക്കൂ. (അവസാന റഫറൻസ് നമ്പർ: ${todayCheck.lastRef || ''})`
        );
      }

      const cleanPhone = input.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        throw new Error('ദയവായി 10 അക്ക ഫോൺ നമ്പർ നൽകുക.');
      }

      const authorUid = await ensureResidentSilentAuth();
      const year = new Date().getFullYear();
      const existingNums = publicStatuses
        .map((s) => {
          const match = s.referenceNumber.match(/^W19-\d{4}-(\d{4})$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
      const maxSeq = existingNums.length > 0 ? Math.max(...existingNums) : 0;
      const nextSeq = maxSeq + 1;
      const paddedSeq = String(nextSeq).padStart(4, '0');
      let referenceNumber = `W19-${year}-${paddedSeq}`;

      const existingCheck = await getDoc(doc(db, 'complaint_status', referenceNumber));
      if (existingCheck.exists()) {
        const randFour = String(Math.floor(1000 + Math.random() * 8999)).padStart(4, '0');
        referenceNumber = `W19-${year}-${randFour}`;
      }

      const formattedDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const privatePayload: Record<string, unknown> = {
        referenceNumber,
        name: input.name.trim().slice(0, 120),
        phone: cleanPhone,
        category: input.category,
        place: input.place.trim().slice(0, 150),
        description: input.description.trim().slice(0, 1500),
        status: 'Received',
        adminRemark: '',
        authorUid,
        date: formattedDate,
        createdAt: serverTimestamp(),
      };
      if (input.photoUrl) privatePayload.photoUrl = input.photoUrl.slice(0, 600000);
      if (typeof input.latitude === 'number') privatePayload.latitude = input.latitude;
      if (typeof input.longitude === 'number') privatePayload.longitude = input.longitude;

      const publicStatusPayload = {
        referenceNumber,
        category: input.category,
        place: input.place.trim().slice(0, 150),
        status: 'Received' as const,
        adminRemark: '',
        date: formattedDate,
        authorUid,
        createdAt: serverTimestamp(),
      };

      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'complaints', referenceNumber), privatePayload);
        batch.set(doc(db, 'complaint_status', referenceNumber), publicStatusPayload);
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `complaints/${referenceNumber}`);
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem(CACHE_KEYS.LAST_COMPLAINT_DATE, todayStr);
      localStorage.setItem(CACHE_KEYS.LAST_COMPLAINT_REF, referenceNumber);

      return referenceNumber;
    },
    [hasSubmittedToday, publicStatuses]
  );

  // Status lookup
  const lookupComplaintStatus = useCallback(
    async (refInput: string): Promise<ComplaintPublicStatus | null> => {
      const normalized = refInput.trim().toUpperCase();
      if (!/^W19-\d{4}-\d{4}$/.test(normalized)) return null;

      const localFound = publicStatuses.find((s) => s.referenceNumber.toUpperCase() === normalized);
      if (localFound) return localFound;

      try {
        const snap = await getDoc(doc(db, 'complaint_status', normalized));
        if (snap.exists()) {
          const data = snap.data() as Omit<ComplaintPublicStatus, 'id'>;
          if (data.authorUid?.startsWith('anon_seed_resident')) return null;
          return { id: snap.id, ...data };
        }
        return null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `complaint_status/${normalized}`);
      }
    },
    [publicStatuses]
  );

  // Rate-limiting for Gram Sabha Points (Limit: 3 submissions per device per day)
  const submitGramSabhaPoint = useCallback(
    async (input: { name?: string; phone?: string; subject: string }): Promise<void> => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const lastDate = localStorage.getItem(CACHE_KEYS.LAST_GS_POINT_DATE);
      const count = lastDate === todayStr ? parseInt(localStorage.getItem(CACHE_KEYS.LAST_GS_POINT_COUNT) || '0', 10) : 0;

      if (count >= 3) {
        throw new Error('ഒരു ദിവസം പരമാവധി 3 വിഷയങ്ങൾ മാത്രമേ സമർപ്പിക്കാൻ സാധിക്കൂ.');
      }

      const trimmedSubject = input.subject.trim();
      if (!trimmedSubject) {
        throw new Error('ദയവായി വിഷയം രേഖപ്പെടുത്തുക.');
      }
      if (trimmedSubject.length > 500) {
        throw new Error('വിഷയം പരമാവധി 500 അക്ഷരങ്ങളിൽ ചുരുക്കുക.');
      }

      const authorUid = await ensureResidentSilentAuth();
      const pointId = `point_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const formattedDate = new Date().toLocaleDateString('en-GB');

      try {
        await setDoc(doc(db, 'gramSabhaPoints', pointId), {
          name: (input.name || '').trim().slice(0, 120),
          phone: (input.phone || '').trim().slice(0, 25),
          subject: trimmedSubject,
          authorUid,
          date: formattedDate,
          createdAt: serverTimestamp(),
        });

        localStorage.setItem(CACHE_KEYS.LAST_GS_POINT_DATE, todayStr);
        localStorage.setItem(CACHE_KEYS.LAST_GS_POINT_COUNT, String(count + 1));
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `gramSabhaPoints/${pointId}`);
      }
    },
    []
  );

  // Rate-limiting for Blood Donor Registration (1 per device per day)
  const submitDonorRegistration = useCallback(
    async (input: {
      name: string;
      bloodGroup: BloodDonor['bloodGroup'];
      phone: string;
      area: string;
      lastDonationDate?: string;
      consentGiven: boolean;
    }): Promise<void> => {
      if (!input.consentGiven) {
        throw new Error('തുടരുന്നതിന് ഫോൺ നമ്പർ പ്രദർശിപ്പിക്കുന്നതിനുള്ള സമ്മതപത്രം അംഗീകരിക്കേണ്ടതാണ്.');
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const lastRegDate = localStorage.getItem(CACHE_KEYS.LAST_DONOR_REG_DATE);
      if (lastRegDate === todayStr) {
        throw new Error('ഒരു ഫോണിൽ നിന്ന് ഒരു ദിവസം ഒരു രജിസ്ട്രേഷൻ മാത്രമേ സാധിക്കൂ.');
      }

      const cleanPhone = input.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        throw new Error('ദയവായി കൃത്യമായ ഫോൺ നമ്പർ നൽകുക.');
      }

      const authorUid = await ensureResidentSilentAuth();
      const donorId = `donor_${Date.now()}`;

      try {
        await setDoc(doc(db, 'donors', donorId), {
          name: input.name.trim().slice(0, 120),
          bloodGroup: input.bloodGroup,
          phone: cleanPhone,
          area: input.area.trim().slice(0, 150),
          lastDonationDate: (input.lastDonationDate || '').trim(),
          available: true,
          approved: false, // Requires admin verification
          consentGiven: true,
          authorUid,
          createdAt: serverTimestamp(),
        });

        localStorage.setItem(CACHE_KEYS.LAST_DONOR_REG_DATE, todayStr);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `donors/${donorId}`);
      }
    },
    []
  );

  // Admin Blood Donor Actions
  const approveDonor = useCallback(async (donorId: string, approved: boolean) => {
    try {
      await updateDoc(doc(db, 'donors', donorId), { approved });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `donors/${donorId}`);
    }
  }, []);

  const toggleDonorAvailability = useCallback(async (donorId: string, available: boolean) => {
    try {
      await updateDoc(doc(db, 'donors', donorId), { available });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `donors/${donorId}`);
    }
  }, []);

  const deleteDonor = useCallback(async (donorId: string) => {
    try {
      await deleteDoc(doc(db, 'donors', donorId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `donors/${donorId}`);
    }
  }, []);

  // Admin CRUD: Forms
  const saveForm = useCallback(
    async (form: Omit<FormItem, 'id' | 'createdAt'>, existingId?: string): Promise<void> => {
      const id = existingId || `form_${Date.now()}`;
      try {
        if (existingId) {
          const snap = await getDoc(doc(db, 'forms', existingId));
          const createdAt = snap.exists() ? snap.data().createdAt : serverTimestamp();
          await setDoc(doc(db, 'forms', existingId), { ...form, createdAt });
        } else {
          await setDoc(doc(db, 'forms', id), { ...form, createdAt: serverTimestamp() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `forms/${id}`);
      }
    },
    []
  );

  const deleteForm = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'forms', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `forms/${id}`);
    }
  }, []);

  // Admin CRUD: Events
  const saveEvent = useCallback(
    async (event: Omit<EventItem, 'id' | 'createdAt'>, existingId?: string): Promise<void> => {
      const id = existingId || `event_${Date.now()}`;
      try {
        if (existingId) {
          const snap = await getDoc(doc(db, 'events', existingId));
          const createdAt = snap.exists() ? snap.data().createdAt : serverTimestamp();
          await setDoc(doc(db, 'events', existingId), { ...event, createdAt });
        } else {
          await setDoc(doc(db, 'events', id), { ...event, createdAt: serverTimestamp() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `events/${id}`);
      }
    },
    []
  );

  const deleteEvent = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
    }
  }, []);

  // Admin CRUD: Gram Sabhas
  const saveGramSabha = useCallback(
    async (meeting: Omit<GramSabhaMeeting, 'id' | 'createdAt'>, existingId?: string): Promise<void> => {
      const id = existingId || `gs_${Date.now()}`;
      try {
        if (existingId) {
          const snap = await getDoc(doc(db, 'gramSabhas', existingId));
          const createdAt = snap.exists() ? snap.data().createdAt : serverTimestamp();
          await setDoc(doc(db, 'gramSabhas', existingId), { ...meeting, createdAt });
        } else {
          await setDoc(doc(db, 'gramSabhas', id), { ...meeting, createdAt: serverTimestamp() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `gramSabhas/${id}`);
      }
    },
    []
  );

  const deleteGramSabha = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'gramSabhas', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `gramSabhas/${id}`);
    }
  }, []);

  const deleteGramSabhaPoint = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'gramSabhaPoints', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `gramSabhaPoints/${id}`);
    }
  }, []);

  // Admin CRUD: Waste Management
  const saveWasteSchedule = useCallback(
    async (item: Omit<WasteScheduleItem, 'id' | 'createdAt'>, existingId?: string): Promise<void> => {
      const id = existingId || `waste_${Date.now()}`;
      try {
        if (existingId) {
          const snap = await getDoc(doc(db, 'wasteSchedule', existingId));
          const createdAt = snap.exists() ? snap.data().createdAt : serverTimestamp();
          await setDoc(doc(db, 'wasteSchedule', existingId), { ...item, createdAt });
        } else {
          await setDoc(doc(db, 'wasteSchedule', id), { ...item, createdAt: serverTimestamp() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `wasteSchedule/${id}`);
      }
    },
    []
  );

  const deleteWasteSchedule = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'wasteSchedule', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `wasteSchedule/${id}`);
    }
  }, []);

  const saveWasteInfo = useCallback(async (info: Omit<WasteInfo, 'id' | 'updatedAt'>): Promise<void> => {
    try {
      await setDoc(doc(db, 'wasteInfo', 'seed_waste_info_main'), {
        ...info,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'wasteInfo/seed_waste_info_main');
    }
  }, []);

  // Admin broadcast waste reminder
  const broadcastWasteReminder = useCallback((wasteType: string, dateInfo: string) => {
    triggerLocalWasteNotification(wasteType, dateInfo);
    setPushBanner(`ഹരിത കർമ്മ സേന ഓർമ്മപ്പെടുത്തൽ അയച്ചു: ${wasteType} — ${dateInfo}`);
    setTimeout(() => setPushBanner(null), 5000);
  }, []);

  // Admin CRUD: Development Works
  const saveWork = useCallback(
    async (work: Omit<DevelopmentWork, 'id' | 'createdAt'>, existingId?: string): Promise<void> => {
      const id = existingId || `work_${Date.now()}`;
      try {
        if (existingId) {
          const snap = await getDoc(doc(db, 'works', existingId));
          const createdAt = snap.exists() ? snap.data().createdAt : serverTimestamp();
          await setDoc(doc(db, 'works', existingId), { ...work, createdAt });
        } else {
          await setDoc(doc(db, 'works', id), { ...work, createdAt: serverTimestamp() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `works/${id}`);
      }
    },
    []
  );

  const deleteWork = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'works', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `works/${id}`);
    }
  }, []);

  // Admin Auth Actions
  const signInAdminWithEmail = useCallback(async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const adminDoc = await getDoc(doc(db, 'admins', cred.user.uid));
    const isBootstrap =
      cred.user.email?.toLowerCase() === 'muhdriyu@gmail.com' &&
      cred.user.emailVerified;
    if (!adminDoc.exists() && !isBootstrap) {
      setIsAdmin(false);
      throw new Error(`Admin privileges not assigned to UID "${cred.user.uid}". Account is read-only.`);
    }
    setIsAdmin(true);
  }, []);

  const registerAdminWithEmail = useCallback(async (email: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    return cred.user;
  }, []);

  const signInAdminWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const adminDoc = await getDoc(doc(db, 'admins', cred.user.uid));
    const isBootstrap =
      cred.user.email?.toLowerCase() === 'muhdriyu@gmail.com' &&
      cred.user.emailVerified;
    if (!adminDoc.exists() && !isBootstrap) {
      setIsAdmin(false);
      throw new Error(`Admin privileges not assigned to UID "${cred.user.uid}". Account is read-only.`);
    }
    setIsAdmin(true);
  }, []);

  const signOutAdmin = useCallback(async () => {
    await fbSignOut(auth);
    setIsAdmin(false);
    await ensureResidentSilentAuth();
  }, []);

  // Admin CRUD: Notices
  const saveNotice = useCallback(
    async (notice: Omit<Notice, 'id' | 'createdAt'>, existingId?: string): Promise<void> => {
      const id = existingId || `notice_${Date.now()}`;
      try {
        if (existingId) {
          const existingSnap = await getDoc(doc(db, 'notices', existingId));
          const createdAt = existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp();
          await setDoc(doc(db, 'notices', existingId), { ...notice, createdAt });
        } else {
          await setDoc(doc(db, 'notices', id), { ...notice, createdAt: serverTimestamp() });
        }
        if (notice.sendPush) {
          setPushBanner(`FCM Push Notification dispatched: "${notice.titleMl || notice.title}"`);
          setTimeout(() => setPushBanner(null), 6000);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `notices/${id}`);
      }
    },
    []
  );

  const deleteNotice = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notices', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notices/${id}`);
    }
  }, []);

  // Admin CRUD: Contacts
  const saveContact = useCallback(
    async (contact: Omit<Contact, 'id' | 'createdAt'>, existingId?: string): Promise<void> => {
      const id = existingId || `contact_${Date.now()}`;
      try {
        if (existingId) {
          const snap = await getDoc(doc(db, 'contacts', existingId));
          const createdAt = snap.exists() ? snap.data().createdAt : serverTimestamp();
          await setDoc(doc(db, 'contacts', existingId), { ...contact, createdAt });
        } else {
          await setDoc(doc(db, 'contacts', id), { ...contact, createdAt: serverTimestamp() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `contacts/${id}`);
      }
    },
    []
  );

  const deleteContact = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contacts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `contacts/${id}`);
    }
  }, []);

  // Admin CRUD: Schemes
  const saveScheme = useCallback(
    async (scheme: Omit<Scheme, 'id' | 'createdAt'>, existingId?: string): Promise<void> => {
      const id = existingId || `scheme_${Date.now()}`;
      try {
        if (existingId) {
          const snap = await getDoc(doc(db, 'schemes', existingId));
          const createdAt = snap.exists() ? snap.data().createdAt : serverTimestamp();
          await setDoc(doc(db, 'schemes', existingId), { ...scheme, createdAt });
        } else {
          await setDoc(doc(db, 'schemes', id), { ...scheme, createdAt: serverTimestamp() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `schemes/${id}`);
      }
    },
    []
  );

  const deleteScheme = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'schemes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `schemes/${id}`);
    }
  }, []);

  // Admin CRUD: Directory
  const saveDirectoryEntry = useCallback(
    async (entry: Omit<DirectoryEntry, 'id' | 'createdAt'>, existingId?: string): Promise<void> => {
      const id = existingId || `dir_${Date.now()}`;
      try {
        if (existingId) {
          const snap = await getDoc(doc(db, 'directory', existingId));
          const createdAt = snap.exists() ? snap.data().createdAt : serverTimestamp();
          await setDoc(doc(db, 'directory', existingId), { ...entry, createdAt });
        } else {
          await setDoc(doc(db, 'directory', id), { ...entry, createdAt: serverTimestamp() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `directory/${id}`);
      }
    },
    []
  );

  const deleteDirectoryEntry = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'directory', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `directory/${id}`);
    }
  }, []);

  // Admin CRUD: Ward Info
  const saveWardInfo = useCallback(async (updated: Omit<WardInfo, 'id' | 'updatedAt'>) => {
    try {
      await setDoc(doc(db, 'ward_info', 'seed_main_v2'), {
        ...updated,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'ward_info/seed_main_v2');
    }
  }, []);

  // Admin CRUD: Complaints
  const updateComplaintStatusAndRemark = useCallback(
    async (referenceNumber: string, status: ComplaintStatus, adminRemark: string) => {
      try {
        await updateDoc(doc(db, 'complaint_status', referenceNumber), {
          status,
          adminRemark: adminRemark.trim().slice(0, 1000),
        });
        const privSnap = await getDoc(doc(db, 'complaints', referenceNumber));
        if (privSnap.exists()) {
          await updateDoc(doc(db, 'complaints', referenceNumber), {
            status,
            adminRemark: adminRemark.trim().slice(0, 1000),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `complaint_status/${referenceNumber}`);
      }
    },
    []
  );

  const deleteSpamComplaint = useCallback(async (referenceNumber: string) => {
    try {
      await deleteDoc(doc(db, 'complaint_status', referenceNumber));
      const privSnap = await getDoc(doc(db, 'complaints', referenceNumber));
      if (privSnap.exists()) {
        await deleteDoc(doc(db, 'complaints', referenceNumber));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `complaints/${referenceNumber}`);
    }
  }, []);

  const addAdminByUid = useCallback(async (uid: string, email: string, name: string) => {
    const cleanUid = uid.trim();
    try {
      await setDoc(doc(db, 'admins', cleanUid), {
        email: email.trim(),
        name: name.trim(),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `admins/${cleanUid}`);
    }
  }, []);

  return {
    lang,
    setLang,
    isOffline,
    isLoading,
    errorBanner,
    setErrorBanner,
    pushBanner,
    setPushBanner,
    wardInfo,
    notices,
    contacts,
    schemes,
    forms,
    events,
    gramSabhas,
    gramSabhaPoints,
    wasteSchedule,
    wasteInfo,
    works,
    donors,
    directory,
    publicStatuses,
    adminComplaints,
    currentUser,
    isAdmin,
    adminCheckComplete,
    hasSubmittedToday,
    resetDailyLimitForTesting,
    submitComplaint,
    lookupComplaintStatus,
    submitGramSabhaPoint,
    submitDonorRegistration,
    approveDonor,
    toggleDonorAvailability,
    deleteDonor,
    saveForm,
    deleteForm,
    saveEvent,
    deleteEvent,
    saveGramSabha,
    deleteGramSabha,
    deleteGramSabhaPoint,
    saveWasteSchedule,
    deleteWasteSchedule,
    saveWasteInfo,
    broadcastWasteReminder,
    saveWork,
    deleteWork,
    signInAdminWithEmail,
    registerAdminWithEmail,
    signInAdminWithGoogle,
    signOutAdmin,
    saveNotice,
    deleteNotice,
    saveContact,
    deleteContact,
    saveScheme,
    deleteScheme,
    saveDirectoryEntry,
    deleteDirectoryEntry,
    saveWardInfo,
    updateComplaintStatusAndRemark,
    deleteSpamComplaint,
    addAdminByUid,
  };
}
