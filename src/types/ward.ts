export type Language = 'en' | 'ml';

export type NoticeCategory =
  | 'Meeting'
  | 'Camp'
  | 'Water/Power'
  | 'General'
  | 'Job';

export type ContactCategory =
  | 'Ward Member'
  | 'Panchayat'
  | 'Hospital'
  | 'Police'
  | 'Fire'
  | 'Electricity'
  | 'Water'
  | 'Ambulance';

export type ComplaintCategory =
  | 'Streetlight'
  | 'Road'
  | 'Waste'
  | 'Drainage'
  | 'Water'
  | 'Other';

export type ComplaintStatus = 'Received' | 'In Progress' | 'Resolved';

export type SchemeCategory =
  | 'Pension'
  | 'Housing'
  | 'Ration'
  | 'Health'
  | 'Education'
  | 'Agriculture'
  | 'Other';

export type DirectoryCategory =
  | 'Shops'
  | 'Doctors'
  | 'Electricians'
  | 'Plumbers'
  | 'Autos'
  | 'Anganwadi'
  | 'Schools'
  | 'Ration Shop';

export interface WardInfo {
  id: string;
  wardNumber: number;
  wardName: string;
  wardNameMl: string;
  panchayat: string;
  panchayatMl: string;
  memberName: string;
  memberNameMl: string;
  memberRole?: string;
  memberRoleMl?: string;
  phone: string;
  whatsapp?: string;
  officeHours: string;
  officeHoursMl: string;
  officeAddress?: string;
  officeAddressMl?: string;
  photoUrl?: string;
  updatedAt?: unknown;
}

export interface Notice {
  id: string;
  title: string;
  titleMl: string;
  date: string;
  category: NoticeCategory;
  description: string;
  descriptionMl: string;
  imageUrl?: string;
  sendPush: boolean;
  createdAt?: unknown;
  // Extra fields for Job / Training
  jobType?: 'തൊഴിലുറപ്പ്' | 'നൈപുണ്യ പരിശീലനം' | 'പ്രാദേശിക ഒഴിവ്' | 'അപ്രന്റീസ്ഷിപ്പ്' | string;
  eligibility?: string;
  lastDate?: string;
  howToApply?: string;
  contactPhone?: string;
  driveUrl?: string;
}

export interface Contact {
  id: string;
  name: string;
  nameMl: string;
  role: string;
  roleMl: string;
  phone: string;
  category: ContactCategory;
  officeHours: string;
  priority: number;
  createdAt?: unknown;
}

export interface Complaint {
  id: string;
  referenceNumber: string;
  name: string;
  phone: string;
  category: ComplaintCategory;
  place: string;
  description: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  status: ComplaintStatus;
  adminRemark: string;
  authorUid: string;
  date: string;
  createdAt?: unknown;
}

export interface ComplaintPublicStatus {
  id: string;
  referenceNumber: string;
  category: ComplaintCategory;
  place: string;
  status: ComplaintStatus;
  adminRemark: string;
  date: string;
  authorUid: string;
  createdAt?: unknown;
}

export interface Scheme {
  id: string;
  title: string;
  titleMl: string;
  category: SchemeCategory;
  eligibility: string;
  eligibilityMl: string;
  documentsNeeded: string;
  documentsNeededMl: string;
  howToApply: string;
  howToApplyMl: string;
  formId?: string;
  createdAt?: unknown;
}

export interface FormItem {
  id: string;
  title: string;
  category: 'സർട്ടിഫിക്കറ്റുകൾ' | 'പെൻഷൻ' | 'റേഷൻ കാർഡ്' | 'ഭവനം' | 'ആരോഗ്യം' | 'മറ്റുള്ളവ' | string;
  description: string;
  documentsNeeded: string[];
  steps: string[];
  fee: string;
  officeToSubmit: string;
  driveUrl: string;
  createdAt?: unknown;
}

export interface DirectoryEntry {
  id: string;
  name: string;
  nameMl: string;
  category: DirectoryCategory;
  phone: string;
  place: string;
  placeMl: string;
  timings: string;
  createdAt?: unknown;
}

export type EventCategory =
  | 'ഉത്സവം'
  | 'വാക്സിനേഷൻ'
  | 'രക്തദാന ക്യാമ്പ്'
  | 'യോഗം'
  | 'മറ്റുള്ളവ';

export interface EventItem {
  id: string;
  title: string;
  category: EventCategory;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  venue: string;
  mapsUrl?: string;
  description: string;
  createdAt?: unknown;
}

export interface GramSabhaMeeting {
  id: string;
  date: string;
  time: string;
  venue: string;
  agenda: string[];
  status: 'വരാനിരിക്കുന്നത്' | 'കഴിഞ്ഞത്';
  minutesDriveUrl?: string;
  attendanceCount?: number;
  decisions?: string;
  createdAt?: unknown;
}

export interface GramSabhaPoint {
  id: string;
  name?: string;
  phone?: string;
  subject: string;
  authorUid?: string;
  date?: string;
  createdAt?: unknown;
}

export type WasteType =
  | 'ജൈവ'
  | 'പ്ലാസ്റ്റിക് / അജൈവം'
  | 'ഗ്ലാസ്'
  | 'ഇ-മാലിന്യം'
  | string;

export interface WasteScheduleItem {
  id: string;
  wasteType: WasteType;
  pattern: string;
  dayOfWeek?: number; // 1=Mon, ..., 7=Sun
  area: string;
  notes: string;
  nextDate?: string;
  createdAt?: unknown;
}

export interface WasteInfo {
  id: string;
  contactName: string;
  phone: string;
  whatsapp: string;
  updatedAt?: unknown;
}

export type WorkStatus =
  | 'ടെൻഡർ ഘട്ടത്തിൽ'
  | 'ആരംഭിച്ചു'
  | 'പുരോഗമിക്കുന്നു'
  | 'പൂർത്തിയായി';

export type WorkCategory =
  | 'റോഡുകൾ'
  | 'കുടിവെള്ളം'
  | 'തെരുവ് വിളക്കുകൾ'
  | 'കെട്ടിടങ്ങൾ'
  | 'ശുചിത്വം'
  | 'മറ്റുള്ളവ';

export type WorkFundSource =
  | 'ഗ്രാമപഞ്ചായത്ത് ഫണ്ട്'
  | 'MLA ഫണ്ട്'
  | 'MP ഫണ്ട്'
  | 'തൊഴിലുറപ്പ്'
  | 'മറ്റു ഫണ്ടുകൾ'
  | string;

export interface WorkUpdate {
  date: string;
  note: string;
}

export interface DevelopmentWork {
  id: string;
  title: string;
  description: string;
  category: WorkCategory;
  status: WorkStatus;
  startDate: string;
  expectedEndDate: string;
  sanctionedAmount: number; // in Rupees
  spentAmount: number; // in Rupees
  fundSource: WorkFundSource;
  progressPercent: number; // 0-100
  photoUrls: string[];
  updates: WorkUpdate[];
  createdAt?: unknown;
}

export type BloodGroup =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'O+'
  | 'O-'
  | 'AB+'
  | 'AB-';

export interface BloodDonor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  phone: string;
  area: string;
  lastDonationDate?: string;
  available: boolean;
  approved: boolean;
  consentGiven: boolean;
  authorUid?: string;
  createdAt?: unknown;
}

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  createdAt?: unknown;
}

export type AppScreen =
  | 'home'
  | 'notices'
  | 'contacts'
  | 'report'
  | 'status'
  | 'schemes'
  | 'directory'
  | 'about'
  | 'admin'
  | 'events'
  | 'waste'
  | 'works'
  | 'donors';
