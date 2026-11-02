/**
 * Security Rules Verification Suite — Dirty Dozen Adversarial Payloads
 * Ward 19 Melparamba Citizen Portal
 */

export interface DirtyDozenScenario {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  authUid: string | null;
  authEmail?: string;
  emailVerified?: boolean;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
  blockingGate: string;
}

export const DIRTY_DOZEN_TESTS: DirtyDozenScenario[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Complaint Creation',
    collectionPath: '/complaints/W19-2026-0001',
    operation: 'create',
    authUid: 'anon_1',
    payload: {
      referenceNumber: 'W19-2026-0001',
      name: 'Rajan K',
      phone: '9876543210',
      category: 'Streetlight',
      place: 'Melparamba Junction',
      description: 'Light post #14 not working',
      status: 'Received',
      adminRemark: '',
      authorUid: 'anon_2', // Spoofed UID
      date: '2026-11-02',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'incoming().authorUid == request.auth.uid',
  },
  {
    id: 2,
    name: 'Status Shortcutting on Complaint Creation',
    collectionPath: '/complaints/W19-2026-0002',
    operation: 'create',
    authUid: 'anon_1',
    payload: {
      referenceNumber: 'W19-2026-0002',
      name: 'Rajan K',
      phone: '9876543210',
      category: 'Road',
      place: 'Chemnad Road',
      description: 'Pothole repair',
      status: 'Resolved', // Shortcutting initial state
      adminRemark: 'Auto resolved',
      authorUid: 'anon_1',
      date: '2026-11-02',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: "incoming().status == 'Received' && incoming().adminRemark == ''",
  },
  {
    id: 3,
    name: 'PII Lateral Read / Scraping by Another Resident',
    collectionPath: '/complaints/W19-2026-0001',
    operation: 'get',
    authUid: 'anon_2',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'existing().authorUid == request.auth.uid || isAdmin()',
  },
  {
    id: 4,
    name: 'Shadow Field Injection on Complaint',
    collectionPath: '/complaints/W19-2026-0003',
    operation: 'create',
    authUid: 'anon_1',
    payload: {
      referenceNumber: 'W19-2026-0003',
      name: 'Rajan K',
      phone: '9876543210',
      category: 'Water',
      place: 'Kallangai Road',
      description: 'Pipe leak',
      status: 'Received',
      adminRemark: '',
      authorUid: 'anon_1',
      date: '2026-11-02',
      isVerified: true, // Ghost field
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'data.keys().hasOnly(...) in isValidComplaint()',
  },
  {
    id: 5,
    name: 'Invalid Phone Number Format',
    collectionPath: '/complaints/W19-2026-0004',
    operation: 'create',
    authUid: 'anon_1',
    payload: {
      referenceNumber: 'W19-2026-0004',
      name: 'Rajan K',
      phone: '12345', // Not 10 digits
      category: 'Waste',
      place: 'Market Road',
      description: 'Bins full',
      status: 'Received',
      adminRemark: '',
      authorUid: 'anon_1',
      date: '2026-11-02',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: "data.phone.size() == 10 && data.phone.matches('^[0-9]{10}$')",
  },
  {
    id: 6,
    name: 'Orphaned Write without Public Status Sync',
    collectionPath: '/complaints/W19-2026-0005',
    operation: 'create',
    authUid: 'anon_1',
    payload: {
      referenceNumber: 'W19-2026-0005',
      name: 'Rajan K',
      phone: '9876543210',
      category: 'Drainage',
      place: 'School Road',
      description: 'Blocked drain',
      status: 'Received',
      adminRemark: '',
      authorUid: 'anon_1',
      date: '2026-11-02',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'existsAfter(/databases/$(database)/documents/complaint_status/$(referenceId))',
  },
  {
    id: 7,
    name: 'Resident Self-Update of Complaint',
    collectionPath: '/complaints/W19-2026-0001',
    operation: 'update',
    authUid: 'anon_1',
    payload: {
      status: 'Resolved',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'isAdmin() required on update',
  },
  {
    id: 8,
    name: 'Unverified Admin Email Spoof',
    collectionPath: '/notices/notice_1',
    operation: 'create',
    authUid: 'spoof_admin',
    authEmail: 'muhdRiyu@gmail.com',
    emailVerified: false,
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'request.auth.token.email_verified == true in isAdmin()',
  },
  {
    id: 9,
    name: 'Unauthorized Privilege Escalation in /admins',
    collectionPath: '/admins/user_99',
    operation: 'create',
    authUid: 'user_99',
    payload: {
      email: 'attacker@example.com',
      name: 'Attacker',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'isAdmin() required to create /admins documents',
  },
  {
    id: 10,
    name: 'Resource Poisoning / Oversized String',
    collectionPath: '/complaints/W19-2026-0006',
    operation: 'create',
    authUid: 'anon_1',
    payload: {
      description: 'X'.repeat(5000), // Exceeds 1500 char cap
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'data.description.size() <= 1500',
  },
  {
    id: 11,
    name: 'Timestamp Forgery',
    collectionPath: '/complaints/W19-2026-0007',
    operation: 'create',
    authUid: 'anon_1',
    payload: {
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'incoming().createdAt == request.time',
  },
  {
    id: 12,
    name: 'PII Injection into Public /complaint_status',
    collectionPath: '/complaint_status/W19-2026-0008',
    operation: 'create',
    authUid: 'anon_1',
    payload: {
      referenceNumber: 'W19-2026-0008',
      category: 'Road',
      place: 'Melparamba',
      status: 'Received',
      adminRemark: '',
      date: '2026-11-02',
      authorUid: 'anon_1',
      phone: '9876543210', // Disallowed PII key in public collection
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'data.keys().hasOnly(...) in isValidComplaintPublicStatus()',
  },
];
