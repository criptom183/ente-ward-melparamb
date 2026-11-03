export type Language = 'en' | 'ml';

export type NoticeCategory = 'Meeting' | 'Camp' | 'Water/Power' | 'General';

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
  | 'admin';
