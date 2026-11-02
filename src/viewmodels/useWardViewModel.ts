import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
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
} from '../types/ward';
import {
  INITIAL_WARD_INFO,
  INITIAL_NOTICES,
  INITIAL_CONTACTS,
  INITIAL_SCHEMES,
  INITIAL_DIRECTORY,
  INITIAL_RESOLVED_PUBLIC_STATUS,
} from '../data/seedData';

const CACHE_KEYS = {
  LANG: 'ward19_lang_pref',
  WARD_INFO: 'ward19_cache_ward_info_v2',
  NOTICES: 'ward19_cache_notices_v2',
  CONTACTS: 'ward19_cache_contacts_v3',
  SCHEMES: 'ward19_cache_schemes_v2',
  DIRECTORY: 'ward19_cache_directory_v4',
  PUBLIC_STATUS: 'ward19_cache_public_status_v2',
  LAST_COMPLAINT_DATE: 'ward19_last_complaint_date',
  LAST_COMPLAINT_REF: 'ward19_last_complaint_ref',
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
  const [directory, setDirectory] = useState<DirectoryEntry[]>(() =>
    readCache<DirectoryEntry[]>(CACHE_KEYS.DIRECTORY, INITIAL_DIRECTORY)
  );
  const [publicStatuses, setPublicStatuses] = useState<ComplaintPublicStatus[]>(
    () =>
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
      // Silently sign in resident in background if not signed in
      await ensureResidentSilentAuth();

      try {
        // Check if Ward Info exists in Firestore; if not, seed official Ward 19 dataset
        const mainWardSnap = await getDoc(doc(db, 'ward_info', 'seed_main_v2'));
        if (!mainWardSnap.exists()) {
          await setDoc(doc(db, 'ward_info', 'seed_main_v2'), {
            ...INITIAL_WARD_INFO,
            updatedAt: serverTimestamp(),
          });
        }

        const v2NoticeSnap = await getDoc(
          doc(db, 'notices', 'seed_v2_notice_1')
        );
        if (!v2NoticeSnap.exists()) {
          for (const n of INITIAL_NOTICES) {
            const { id, ...rest } = n;
            await setDoc(doc(db, 'notices', id), {
              ...rest,
              createdAt: serverTimestamp(),
            });
          }
        }

        const v3ContactSnap = await getDoc(
          doc(db, 'contacts', 'seed_v3_contact_1')
        );
        if (!v3ContactSnap.exists()) {
          for (const c of INITIAL_CONTACTS) {
            const { id, ...rest } = c;
            await setDoc(doc(db, 'contacts', id), {
              ...rest,
              createdAt: serverTimestamp(),
            });
          }
        }

        const v2SchemeSnap = await getDoc(
          doc(db, 'schemes', 'seed_v2_scheme_1')
        );
        if (!v2SchemeSnap.exists()) {
          for (const s of INITIAL_SCHEMES) {
            const { id, ...rest } = s;
            await setDoc(doc(db, 'schemes', id), {
              ...rest,
              createdAt: serverTimestamp(),
            });
          }
        }

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
        // When offline or already seeded, continue cleanly with cached/live listeners
        console.warn('Initial seed check skipped or already populated:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    initFirestoreData();
    return () => {
      mounted = false;
    };
  }, []);

  // Subscribe to Auth State and verify whether user is in `/admins` collection
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
          // Ensure bootstrapped admin has a record in /admins
          if (isBootstrappedEmail && !adminDoc.exists()) {
            try {
              await setDoc(doc(db, 'admins', user.uid), {
                email: user.email || 'muhdRiyu@gmail.com',
                name: user.displayName || 'Ward 19 Admin',
                createdAt: serverTimestamp(),
              });
            } catch {
              // Ignore if already exists
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

  // Real-time Firestore Listeners with local offline cache persistence
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
      (err) => {
        console.warn('Ward info listener error (using offline cache):', err);
      }
    );

    const unsubNotices = onSnapshot(
      collection(db, 'notices'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs
            .filter((d) => !d.id.startsWith('seed_notice_'))
            .map((d) => ({
              id: d.id,
              ...(d.data() as Omit<Notice, 'id'>),
            }));
          if (list.length > 0) {
            setNotices(list);
            writeCache(CACHE_KEYS.NOTICES, list);
          }
        }
        setIsLoading(false);
      },
      (err) => {
        console.warn('Notices listener error (using offline cache):', err);
        setIsLoading(false);
      }
    );

    const unsubContacts = onSnapshot(
      collection(db, 'contacts'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs
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
        }
      },
      (err) => {
        console.warn('Contacts listener error (using offline cache):', err);
      }
    );

    const unsubSchemes = onSnapshot(
      collection(db, 'schemes'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs
            .filter((d) => !d.id.startsWith('seed_scheme_'))
            .map((d) => ({
              id: d.id,
              ...(d.data() as Omit<Scheme, 'id'>),
            }));
          if (list.length > 0) {
            setSchemes(list);
            writeCache(CACHE_KEYS.SCHEMES, list);
          }
        }
      },
      (err) => {
        console.warn('Schemes listener error (using offline cache):', err);
      }
    );

    const unsubDirectory = onSnapshot(
      collection(db, 'directory'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs
            .filter(
              (d) =>
                !d.id.startsWith('seed_dir_') &&
                !d.id.startsWith('seed_v2_dir_') &&
                !d.id.startsWith('seed_v3_dir_')
            )
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
      (err) => {
        console.warn('Directory listener error (using offline cache):', err);
      }
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
      (err) => {
        console.warn('Public status listener error:', err);
      }
    );

    return () => {
      unsubWard();
      unsubNotices();
      unsubContacts();
      unsubSchemes();
      unsubDirectory();
      unsubPublicStatuses();
    };
  }, []);

  // Admin-only listener for full private `/complaints` collection
  useEffect(() => {
    if (!isAdmin) {
      setAdminComplaints([]);
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
      (err) => {
        console.warn('Admin complaints listener error:', err);
      }
    );
    return () => unsubComplaints();
  }, [isAdmin]);

  // Check if device already submitted a complaint today (1 complaint per day limit)
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

  // Submit a new Citizen Complaint with atomic batch write to `/complaints/{ref}` and `/complaint_status/{ref}`
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
          lang === 'ml'
            ? `ഒരു ഫോണിൽ നിന്ന് ദിവസം ഒരു പരാതി മാത്രമേ അയക്കാൻ സാധിക്കൂ. (അവസാന റഫറൻസ് നമ്പർ: ${todayCheck.lastRef || ''})`
            : `Each device is limited to 1 complaint per day. Your reference number for today is ${todayCheck.lastRef || ''}.`
        );
      }

      const cleanPhone = input.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        throw new Error(
          lang === 'ml'
            ? 'ദയവായി 10 അക്ക ഫോൺ നമ്പർ നൽകുക.'
            : 'Please enter a valid 10-digit mobile number.'
        );
      }

      const authorUid = await ensureResidentSilentAuth();
      const year = new Date().getFullYear();
      // Compute next sequential number based on existing publicStatuses + random collision guard
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

      // Check if referenceId already exists in Firestore
      const existingCheck = await getDoc(
        doc(db, 'complaint_status', referenceNumber)
      );
      if (existingCheck.exists()) {
        const randFour = String(
          Math.floor(1000 + Math.random() * 8999)
        ).padStart(4, '0');
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
      if (input.photoUrl) {
        privatePayload.photoUrl = input.photoUrl.slice(0, 600000);
      }
      if (typeof input.latitude === 'number') {
        privatePayload.latitude = input.latitude;
      }
      if (typeof input.longitude === 'number') {
        privatePayload.longitude = input.longitude;
      }

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

      const path = `complaints/${referenceNumber}`;
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'complaints', referenceNumber), privatePayload);
        batch.set(
          doc(db, 'complaint_status', referenceNumber),
          publicStatusPayload
        );
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem(CACHE_KEYS.LAST_COMPLAINT_DATE, todayStr);
      localStorage.setItem(CACHE_KEYS.LAST_COMPLAINT_REF, referenceNumber);

      return referenceNumber;
    },
    [hasSubmittedToday, lang, publicStatuses]
  );

  // Check status of a complaint by reference number
  const lookupComplaintStatus = useCallback(
    async (refInput: string): Promise<ComplaintPublicStatus | null> => {
      const normalized = refInput.trim().toUpperCase();
      if (!/^W19-\d{4}-\d{4}$/.test(normalized)) {
        return null;
      }
      // First check live state/cache
      const localFound = publicStatuses.find(
        (s) => s.referenceNumber.toUpperCase() === normalized
      );
      if (localFound) return localFound;

      try {
        const snap = await getDoc(doc(db, 'complaint_status', normalized));
        if (snap.exists()) {
          const data = snap.data() as Omit<ComplaintPublicStatus, 'id'>;
          if (data.authorUid?.startsWith('anon_seed_resident')) {
            return null;
          }
          return {
            id: snap.id,
            ...data,
          };
        }
        return null;
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.GET,
          `complaint_status/${normalized}`
        );
      }
    },
    [publicStatuses]
  );

  // Admin Authentication Actions
  const signInAdminWithEmail = useCallback(
    async (email: string, pass: string) => {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const adminDoc = await getDoc(doc(db, 'admins', cred.user.uid));
      const isBootstrap =
        cred.user.email?.toLowerCase() === 'muhdriyu@gmail.com' &&
        cred.user.emailVerified;
      if (!adminDoc.exists() && !isBootstrap) {
        setIsAdmin(false);
        throw new Error(
          `Signed in as ${cred.user.email}, but UID "${cred.user.uid}" is not listed in the Firestore "admins" collection. Account is read-only.`
        );
      }
      setIsAdmin(true);
    },
    []
  );

  const registerAdminWithEmail = useCallback(
    async (email: string, pass: string) => {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        pass
      );
      return cred.user;
    },
    []
  );

  const signInAdminWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const adminDoc = await getDoc(doc(db, 'admins', cred.user.uid));
    const isBootstrap =
      cred.user.email?.toLowerCase() === 'muhdriyu@gmail.com' &&
      cred.user.emailVerified;
    if (!adminDoc.exists() && !isBootstrap) {
      setIsAdmin(false);
      throw new Error(
        `Signed in as ${cred.user.email}, but UID "${cred.user.uid}" is not listed in the Firestore "admins" collection. Account is read-only.`
      );
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
    async (
      notice: Omit<Notice, 'id' | 'createdAt'>,
      existingId?: string
    ): Promise<void> => {
      const id = existingId || `notice_${Date.now()}`;
      const path = `notices/${id}`;
      try {
        if (existingId) {
          const existingSnap = await getDoc(doc(db, 'notices', existingId));
          const createdAt = existingSnap.exists()
            ? existingSnap.data().createdAt
            : serverTimestamp();
          await setDoc(doc(db, 'notices', existingId), {
            ...notice,
            createdAt,
          });
        } else {
          await setDoc(doc(db, 'notices', id), {
            ...notice,
            createdAt: serverTimestamp(),
          });
        }
        if (notice.sendPush) {
          setPushBanner(
            `FCM Push Notification dispatched to topic "ward_19_notices": "${notice.title}"`
          );
          setTimeout(() => setPushBanner(null), 6000);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
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
    async (
      contact: Omit<Contact, 'id' | 'createdAt'>,
      existingId?: string
    ): Promise<void> => {
      const id = existingId || `contact_${Date.now()}`;
      try {
        if (existingId) {
          const snap = await getDoc(doc(db, 'contacts', existingId));
          const createdAt = snap.exists()
            ? snap.data().createdAt
            : serverTimestamp();
          await setDoc(doc(db, 'contacts', existingId), {
            ...contact,
            createdAt,
          });
        } else {
          await setDoc(doc(db, 'contacts', id), {
            ...contact,
            createdAt: serverTimestamp(),
          });
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
    async (
      scheme: Omit<Scheme, 'id' | 'createdAt'>,
      existingId?: string
    ): Promise<void> => {
      const id = existingId || `scheme_${Date.now()}`;
      try {
        if (existingId) {
          const snap = await getDoc(doc(db, 'schemes', existingId));
          const createdAt = snap.exists()
            ? snap.data().createdAt
            : serverTimestamp();
          await setDoc(doc(db, 'schemes', existingId), {
            ...scheme,
            createdAt,
          });
        } else {
          await setDoc(doc(db, 'schemes', id), {
            ...scheme,
            createdAt: serverTimestamp(),
          });
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
    async (
      entry: Omit<DirectoryEntry, 'id' | 'createdAt'>,
      existingId?: string
    ): Promise<void> => {
      const id = existingId || `dir_${Date.now()}`;
      try {
        if (existingId) {
          const snap = await getDoc(doc(db, 'directory', existingId));
          const createdAt = snap.exists()
            ? snap.data().createdAt
            : serverTimestamp();
          await setDoc(doc(db, 'directory', existingId), {
            ...entry,
            createdAt,
          });
        } else {
          await setDoc(doc(db, 'directory', id), {
            ...entry,
            createdAt: serverTimestamp(),
          });
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

  // Admin CRUD: Update Ward Member Profile
  const saveWardInfo = useCallback(
    async (updated: Omit<WardInfo, 'id' | 'updatedAt'>) => {
      try {
        await setDoc(doc(db, 'ward_info', 'seed_main_v2'), {
          ...updated,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.UPDATE,
          'ward_info/seed_main_v2'
        );
      }
    },
    []
  );

  // Admin CRUD: Update Complaint Status & Remark
  const updateComplaintStatusAndRemark = useCallback(
    async (
      referenceNumber: string,
      status: ComplaintStatus,
      adminRemark: string
    ) => {
      try {
        // Update public status document
        await updateDoc(doc(db, 'complaint_status', referenceNumber), {
          status,
          adminRemark: adminRemark.trim().slice(0, 1000),
        });
        // Update private complaint document if it exists
        const privSnap = await getDoc(doc(db, 'complaints', referenceNumber));
        if (privSnap.exists()) {
          await updateDoc(doc(db, 'complaints', referenceNumber), {
            status,
            adminRemark: adminRemark.trim().slice(0, 1000),
          });
        }
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.UPDATE,
          `complaint_status/${referenceNumber}`
        );
      }
    },
    []
  );

  // Admin CRUD: Delete Spam Complaint
  const deleteSpamComplaint = useCallback(async (referenceNumber: string) => {
    try {
      await deleteDoc(doc(db, 'complaint_status', referenceNumber));
      const privSnap = await getDoc(doc(db, 'complaints', referenceNumber));
      if (privSnap.exists()) {
        await deleteDoc(doc(db, 'complaints', referenceNumber));
      }
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `complaints/${referenceNumber}`
      );
    }
  }, []);

  // Admin CRUD: Add another Admin UID to `/admins/{uid}`
  const addAdminByUid = useCallback(
    async (uid: string, email: string, name: string) => {
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
    },
    []
  );

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
