import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Bell,
  Phone,
  Lock,
  AlertTriangle,
  Check,
  FileText,
  BookOpen,
  ChevronLeft,
  UserPlus,
  Calendar,
  Trash,
  Briefcase,
  Heart,
  ExternalLink,
  Download,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  Complaint,
  ComplaintCategory,
  ComplaintPublicStatus,
  ComplaintStatus,
  Contact,
  ContactCategory,
  DirectoryCategory,
  DirectoryEntry,
  Language,
  Notice,
  NoticeCategory,
  Scheme,
  SchemeCategory,
  WardInfo,
  FormItem,
  EventItem,
  EventCategory,
  GramSabhaMeeting,
  GramSabhaPoint,
  WasteScheduleItem,
  WasteInfo,
  DevelopmentWork,
  WorkStatus,
  WorkCategory,
  BloodDonor,
  BloodGroup,
} from '../types/ward';
import { isValidDriveUrl } from '../utils/driveLinks';
import { formatRupeesLakhs } from '../utils/formatters';

interface AdminDashboardScreenProps {
  lang: Language;
  currentUser: User | null;
  isAdmin: boolean;
  wardInfo: WardInfo;
  notices: Notice[];
  contacts: Contact[];
  schemes: Scheme[];
  directory: DirectoryEntry[];
  adminComplaints: Complaint[];
  publicStatuses: ComplaintPublicStatus[];
  forms: FormItem[];
  events: EventItem[];
  gramSabhas: GramSabhaMeeting[];
  gramSabhaPoints: GramSabhaPoint[];
  wasteSchedule: WasteScheduleItem[];
  wasteInfo: WasteInfo;
  works: DevelopmentWork[];
  donors: BloodDonor[];
  signInAdminWithEmail: (email: string, pass: string) => Promise<void>;
  registerAdminWithEmail: (email: string, pass: string) => Promise<User>;
  signInAdminWithGoogle: () => Promise<void>;
  signOutAdmin: () => Promise<void>;
  saveNotice: (notice: Omit<Notice, 'id' | 'createdAt'>, existingId?: string) => Promise<void>;
  deleteNotice: (id: string) => Promise<void>;
  saveContact: (contact: Omit<Contact, 'id' | 'createdAt'>, existingId?: string) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  saveScheme: (scheme: Omit<Scheme, 'id' | 'createdAt'>, existingId?: string) => Promise<void>;
  deleteScheme: (id: string) => Promise<void>;
  saveForm: (form: Omit<FormItem, 'id' | 'createdAt'>, existingId?: string) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
  saveEvent: (event: Omit<EventItem, 'id' | 'createdAt'>, existingId?: string) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  saveGramSabha: (meeting: Omit<GramSabhaMeeting, 'id' | 'createdAt'>, existingId?: string) => Promise<void>;
  deleteGramSabha: (id: string) => Promise<void>;
  deleteGramSabhaPoint: (id: string) => Promise<void>;
  saveWasteSchedule: (item: Omit<WasteScheduleItem, 'id' | 'createdAt'>, existingId?: string) => Promise<void>;
  deleteWasteSchedule: (id: string) => Promise<void>;
  saveWasteInfo: (info: Omit<WasteInfo, 'id' | 'updatedAt'>) => Promise<void>;
  broadcastWasteReminder: (wasteType: string, dateInfo: string) => void;
  saveWork: (work: Omit<DevelopmentWork, 'id' | 'createdAt'>, existingId?: string) => Promise<void>;
  deleteWork: (id: string) => Promise<void>;
  approveDonor: (donorId: string, approved: boolean) => Promise<void>;
  toggleDonorAvailability: (donorId: string, available: boolean) => Promise<void>;
  deleteDonor: (donorId: string) => Promise<void>;
  saveDirectoryEntry: (entry: Omit<DirectoryEntry, 'id' | 'createdAt'>, existingId?: string) => Promise<void>;
  deleteDirectoryEntry: (id: string) => Promise<void>;
  saveWardInfo: (updated: Omit<WardInfo, 'id' | 'updatedAt'>) => Promise<void>;
  updateComplaintStatusAndRemark: (
    referenceNumber: string,
    status: ComplaintStatus,
    adminRemark: string
  ) => Promise<void>;
  deleteSpamComplaint: (referenceNumber: string) => Promise<void>;
  addAdminByUid: (uid: string, email: string, name: string) => Promise<void>;
  onBack: () => void;
}

const COMPLAINT_CATEGORY_ML: Record<ComplaintCategory, string> = {
  Streetlight: 'തെരുവുവിളക്ക്',
  Road: 'റോഡ്',
  Waste: 'മാലിന്യം',
  Drainage: 'ഓട',
  Water: 'വെള്ളം',
  Other: 'മറ്റുള്ളവ',
};

const STATUS_BADGE: Record<
  ComplaintStatus,
  { label: string; bg: string; text: string }
> = {
  Received: { label: 'ലഭിച്ചു', bg: 'bg-[#E3EEF8]', text: 'text-[#1E466E]' },
  'In Progress': { label: 'നടപടിയിൽ', bg: 'bg-[#F7EFE0]', text: 'text-[#7A5413]' },
  Resolved: { label: 'പരിഹരിച്ചു', bg: 'bg-[#E5F3EB]', text: 'text-[#0E5135]' },
};

type AdminSection =
  | 'overview'
  | 'notices'
  | 'events'
  | 'forms'
  | 'waste'
  | 'works'
  | 'donors'
  | 'contacts'
  | 'schemes'
  | 'directory'
  | 'ward';

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  currentUser,
  isAdmin,
  wardInfo,
  notices,
  contacts,
  schemes,
  directory,
  adminComplaints,
  publicStatuses,
  forms,
  events,
  gramSabhas,
  gramSabhaPoints,
  wasteSchedule,
  wasteInfo,
  works,
  donors,
  signInAdminWithEmail,
  signInAdminWithGoogle,
  signOutAdmin,
  saveNotice,
  deleteNotice,
  saveContact,
  deleteContact,
  saveScheme,
  deleteScheme,
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
  approveDonor,
  toggleDonorAvailability,
  deleteDonor,
  saveDirectoryEntry,
  deleteDirectoryEntry,
  saveWardInfo,
  updateComplaintStatusAndRemark,
  deleteSpamComplaint,
  addAdminByUid,
  onBack,
}) => {
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Active section
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [expandedComplaintRef, setExpandedComplaintRef] = useState<string | null>(null);

  // 1. Notice Editor State (with Job/Training extra fields)
  const [editingNoticeId, setEditingNoticeId] = useState<string | undefined>(undefined);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeDate, setNoticeDate] = useState('06 നവംബർ 2026');
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>('General');
  const [noticeDesc, setNoticeDesc] = useState('');
  const [noticeJobType, setNoticeJobType] = useState('തൊഴിലുറപ്പ്');
  const [noticeEligibility, setNoticeEligibility] = useState('');
  const [noticeLastDate, setNoticeLastDate] = useState('');
  const [noticeHowToApply, setNoticeHowToApply] = useState('');
  const [noticeContactPhone, setNoticeContactPhone] = useState('');
  const [noticeDriveUrl, setNoticeDriveUrl] = useState('');
  const [noticeSendPush, setNoticeSendPush] = useState(false);

  // 2. Form Editor State
  const [editingFormId, setEditingFormId] = useState<string | undefined>(undefined);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('സർട്ടിഫിക്കറ്റുകൾ');
  const [formDesc, setFormDesc] = useState('');
  const [formDocsRaw, setFormDocsRaw] = useState('');
  const [formStepsRaw, setFormStepsRaw] = useState('');
  const [formFee, setFormFee] = useState('സൗജന്യം');
  const [formOffice, setFormOffice] = useState('ചെമ്മനാട് പഞ്ചായത്ത് ഓഫീസ്');
  const [formDriveUrl, setFormDriveUrl] = useState('');

  // 3. Event & Gram Sabha Editor State
  const [editingEventId, setEditingEventId] = useState<string | undefined>(undefined);
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState<EventCategory>('യോഗം');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('10:00 AM');
  const [eventEndTime, setEventEndTime] = useState('12:00 PM');
  const [eventVenue, setEventVenue] = useState('മേൽപ്പറമ്പ');
  const [eventMapsUrl, setEventMapsUrl] = useState('');
  const [eventDesc, setEventDesc] = useState('');

  const [editingGsId, setEditingGsId] = useState<string | undefined>(undefined);
  const [gsDate, setGsDate] = useState('');
  const [gsTime, setGsTime] = useState('രാവിലെ 10:00 മണിക്ക്');
  const [gsVenue, setGsVenue] = useState('മേൽപ്പറമ്പ ഗവ. എൽ.പി. സ്കൂൾ');
  const [gsAgendaRaw, setGsAgendaRaw] = useState('');
  const [gsStatus, setGsStatus] = useState<'വരാനിരിക്കുന്നത്' | 'കഴിഞ്ഞത്'>('വരാനിരിക്കുന്നത്');
  const [gsMinutesDriveUrl, setGsMinutesDriveUrl] = useState('');
  const [gsAttendance, setGsAttendance] = useState(0);
  const [gsDecisions, setGsDecisions] = useState('');

  // 4. Waste Editor State
  const [editingWasteId, setEditingWasteId] = useState<string | undefined>(undefined);
  const [wasteType, setWasteType] = useState('പ്ലാസ്റ്റിക് / അജൈവം');
  const [wastePattern, setWastePattern] = useState('');
  const [wasteDayOfWeek, setWasteDayOfWeek] = useState(1);
  const [wasteArea, setWasteArea] = useState('വാർഡ് 19 മുഴുവൻ');
  const [wasteNotes, setWasteNotes] = useState('');
  const [wasteNextDate, setWasteNextDate] = useState('');
  const [wasteCoordName, setWasteCoordName] = useState(wasteInfo.contactName || '');
  const [wasteCoordPhone, setWasteCoordPhone] = useState(wasteInfo.phone || '9446700800');
  const [wasteCoordWhatsapp, setWasteCoordWhatsapp] = useState(wasteInfo.whatsapp || '9446700800');

  // 5. Work Editor State
  const [editingWorkId, setEditingWorkId] = useState<string | undefined>(undefined);
  const [workTitle, setWorkTitle] = useState('');
  const [workCategory, setWorkCategory] = useState<WorkCategory>('റോഡുകൾ');
  const [workStatus, setWorkStatus] = useState<WorkStatus>('പുരോഗമിക്കുന്നു');
  const [workStart, setWorkStart] = useState('');
  const [workEnd, setWorkEnd] = useState('');
  const [workSanctioned, setWorkSanctioned] = useState(500000);
  const [workSpent, setWorkSpent] = useState(0);
  const [workFund, setWorkFund] = useState('ഗ്രാമപഞ്ചായത്ത് ഫണ്ട്');
  const [workProgress, setWorkProgress] = useState(50);
  const [workDesc, setWorkDesc] = useState('');
  const [newUpdateNote, setNewUpdateNote] = useState('');

  // 6. Contact, Scheme, Directory, Ward Editors
  const [editingContactId, setEditingContactId] = useState<string | undefined>(undefined);
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactCategory, setContactCategory] = useState<ContactCategory>('Panchayat');

  const [editingSchemeId, setEditingSchemeId] = useState<string | undefined>(undefined);
  const [schemeTitle, setSchemeTitle] = useState('');
  const [schemeCategory, setSchemeCategory] = useState<SchemeCategory>('Pension');
  const [schemeElig, setSchemeElig] = useState('');
  const [schemeDocs, setSchemeDocs] = useState('');
  const [schemeApply, setSchemeApply] = useState('');
  const [schemeFormId, setSchemeFormId] = useState('');

  const [editingDirId, setEditingDirId] = useState<string | undefined>(undefined);
  const [dirName, setDirName] = useState('');
  const [dirCategory, setDirCategory] = useState<DirectoryCategory>('Doctors');
  const [dirPhone, setDirPhone] = useState('');
  const [dirPlace, setDirPlace] = useState('മേൽപ്പറമ്പ');
  const [dirTimings, setDirTimings] = useState('രാവിലെ 9:00 – രാത്രി 7:00');

  const [memberName, setMemberName] = useState(wardInfo.memberNameMl || wardInfo.memberName);
  const [memberPhone, setMemberPhone] = useState(wardInfo.phone);
  const [memberHours, setMemberHours] = useState(wardInfo.officeHoursMl || wardInfo.officeHours);

  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  // Complaint Remark & Status Drafts
  const [remarkDrafts, setRemarkDrafts] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, ComplaintStatus>>({});

  const flashMessage = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInAdminWithEmail(email, password);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'ലോഗിൻ പരാജയപ്പെട്ടു.');
    } finally {
      setAuthLoading(false);
    }
  };

  const combinedComplaints: Complaint[] =
    adminComplaints.length > 0
      ? adminComplaints
      : publicStatuses.map((ps) => ({
          id: ps.id,
          referenceNumber: ps.referenceNumber,
          name: 'വാർഡ് നിവാസി',
          phone: '9447000019',
          category: ps.category,
          place: ps.place,
          description: `${ps.place} — ${ps.category}`,
          status: ps.status,
          adminRemark: ps.adminRemark,
          authorUid: ps.authorUid,
          date: ps.date,
        }));

  // Not Logged In View
  if (!currentUser || !isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="w-12 h-12 rounded-full bg-white border border-[#E6E2D6] flex items-center justify-center text-[#141E18] hover:bg-[#F3F0E6] shrink-0 cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#141E18]">അഡ്മിൻ പ്രവേശനം</h1>
            <p className="text-sm text-[#637067]">വാർഡ് 19 ഭരണസമിതിക്ക് മാത്രം</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E2D6] shadow-2xs space-y-5">
          <div className="w-14 h-14 rounded-full bg-[#E8F2EC] text-[#0E5135] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <p className="text-sm text-center text-[#4A554E] leading-relaxed">
            പൊതുജനങ്ങൾക്ക് ഇവിടെ ലോഗിൻ ആവശ്യമില്ല. പഞ്ചായത്ത് പ്രസിഡന്റ് / വാർഡ് മെമ്പർക്ക് മാത്രമേ അഡ്മിൻ അധികാരമുള്ളൂ.
          </p>

          {authError && (
            <div className="bg-red-50 text-red-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#141E18] mb-1">
                ഇമെയിൽ വിലാസം
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@melparamba.in"
                className="w-full min-h-[48px] px-4 bg-white border border-[#DED9CA] rounded-2xl text-base text-[#141E18] focus:outline-none focus:border-[#0E5135]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#141E18] mb-1">
                പാസ്‌വേഡ്
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[48px] px-4 bg-white border border-[#DED9CA] rounded-2xl text-base text-[#141E18] focus:outline-none focus:border-[#0E5135]"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full min-h-[50px] py-3 rounded-full bg-[#0E5135] hover:bg-[#146643] text-white font-bold text-base transition-colors cursor-pointer"
            >
              {authLoading ? 'ലോഗിൻ ചെയ്യുന്നു...' : 'ലോഗിൻ ചെയ്യുക'}
            </button>
          </form>

          <div className="pt-2 border-t border-[#F0ECE1]">
            <button
              type="button"
              onClick={signInAdminWithGoogle}
              className="w-full min-h-[50px] py-3 rounded-full bg-white border border-[#DED9CA] hover:bg-[#FAF8F2] text-[#141E18] font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>ഗൂഗിൾ അക്കൗണ്ട് വഴി പ്രവേശിക്കുക</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in Admin Dashboard View
  return (
    <div className="space-y-5">
      {/* Top Header with Sign Out */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-11 h-11 rounded-full bg-white border border-[#E6E2D6] flex items-center justify-center text-[#141E18] hover:bg-[#F3F0E6] shrink-0 cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[#141E18] truncate">അഡ്മിൻ പാനൽ</h1>
            <p className="text-xs text-[#0E5135] font-semibold truncate">
              {currentUser?.email || 'വാർഡ് 19 അഡ്മിൻ'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={signOutAdmin}
          className="min-h-[40px] px-4 py-1.5 rounded-full bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs shrink-0 cursor-pointer transition-colors"
        >
          പുറത്തുകടക്കുക
        </button>
      </div>

      {statusMessage && (
        <div className="bg-[#E5F3EB] text-[#0E5135] p-3 rounded-2xl text-sm font-bold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Admin Section Tabs */}
      <div
        role="tablist"
        aria-label="അഡ്മിൻ വിഭാഗങ്ങൾ"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1"
      >
        {[
          { id: 'overview', label: 'പരാതികൾ' },
          { id: 'notices', label: 'അറിയിപ്പുകൾ & ജോലി' },
          { id: 'events', label: 'പരിപാടികൾ & ഗ്രാമസഭ' },
          { id: 'forms', label: 'ഫോമുകൾ' },
          { id: 'waste', label: 'മാലിന്യം' },
          { id: 'works', label: 'വികസനം' },
          { id: 'donors', label: 'രക്തദാതാക്കൾ' },
          { id: 'contacts', label: 'ഫോൺ' },
          { id: 'schemes', label: 'പദ്ധതികൾ' },
          { id: 'directory', label: 'ഡയറക്ടറി' },
          { id: 'ward', label: 'വാർഡ് വിവരങ്ങൾ' },
        ].map((tab) => {
          const active = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as AdminSection)}
              className={`min-h-[42px] px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                active
                  ? 'bg-[#0E5135] text-white shadow-2xs'
                  : 'bg-white border border-[#DED9CA] text-[#141E18] hover:bg-[#F3F0E6]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: COMPLAINTS OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#141E18]">
              ലഭിച്ച പരാതികൾ ({combinedComplaints.length})
            </h2>
          </div>

          {combinedComplaints.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-[#E6E2D6]">
              <p className="text-sm font-semibold text-[#637067]">പരാതികൾ ഒന്നും ലഭിച്ചിട്ടില്ല</p>
            </div>
          ) : (
            combinedComplaints.map((c) => {
              const isExpanded = expandedComplaintRef === c.referenceNumber;
              const badge = STATUS_BADGE[c.status] || STATUS_BADGE.Received;
              const draftStatus = statusDrafts[c.referenceNumber] || c.status;
              const draftRemark =
                remarkDrafts[c.referenceNumber] !== undefined
                  ? remarkDrafts[c.referenceNumber]
                  : c.adminRemark || '';

              return (
                <div
                  key={c.referenceNumber}
                  className="bg-white rounded-3xl p-5 border border-[#E6E2D6] shadow-2xs space-y-3"
                >
                  <div
                    onClick={() =>
                      setExpandedComplaintRef(isExpanded ? null : c.referenceNumber)
                    }
                    className="flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#7A5413]">
                        {c.referenceNumber} · {c.date}
                      </div>
                      <h3 className="text-base font-bold text-[#141E18] mt-0.5">
                        {COMPLAINT_CATEGORY_ML[c.category] || c.category} — {c.place}
                      </h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="pt-2 border-t border-[#F0ECE1] space-y-3">
                      <div className="text-sm text-[#4A554E] leading-relaxed">
                        <span className="font-bold text-[#141E18]">വിവരണം: </span>
                        {c.description}
                      </div>

                      <div className="bg-[#FAF8F2] p-3 rounded-2xl border border-[#EAE6DA] text-xs space-y-1">
                        <div>
                          <span className="font-bold text-[#7A5413]">പരാതിക്കാരൻ: </span>
                          <span className="text-[#141E18] font-semibold">{c.name}</span>
                        </div>
                        <div>
                          <span className="font-bold text-[#7A5413]">ഫോൺ: </span>
                          <a href={`tel:${c.phone}`} className="text-[#0E5135] font-bold underline">
                            {c.phone}
                          </a>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <label className="block text-xs font-bold text-[#141E18]">
                          സ്ഥിതി മാറ്റുക &amp; മറുപടി നൽകുക
                        </label>
                        <select
                          value={draftStatus}
                          onChange={(e) =>
                            setStatusDrafts((prev) => ({
                              ...prev,
                              [c.referenceNumber]: e.target.value as ComplaintStatus,
                            }))
                          }
                          className="w-full min-h-[44px] px-3 bg-white border border-[#DED9CA] rounded-xl text-sm font-bold text-[#141E18]"
                        >
                          <option value="Received">ലഭിച്ചു (Received)</option>
                          <option value="In Progress">നടപടിയിൽ (In Progress)</option>
                          <option value="Resolved">പരിഹരിച്ചു (Resolved)</option>
                        </select>

                        <textarea
                          rows={2}
                          value={draftRemark}
                          onChange={(e) =>
                            setRemarkDrafts((prev) => ({
                              ...prev,
                              [c.referenceNumber]: e.target.value,
                            }))
                          }
                          placeholder="മറുപടി / നടപടി വിവരങ്ങൾ രേഖപ്പെടുത്തുക..."
                          className="w-full p-3 bg-white border border-[#DED9CA] rounded-xl text-sm text-[#141E18]"
                        />

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={async () => {
                              await updateComplaintStatusAndRemark(
                                c.referenceNumber,
                                draftStatus,
                                draftRemark
                              );
                              flashMessage(`${c.referenceNumber} അപ്ഡേറ്റ് ചെയ്തു`);
                            }}
                            className="min-h-[42px] px-4 py-2 rounded-full bg-[#0E5135] text-white font-bold text-xs hover:bg-[#146643] cursor-pointer"
                          >
                            സംരക്ഷിക്കുക
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`ഈ പരാതി ഒഴിവാക്കണോ? (${c.referenceNumber})`)) {
                                await deleteSpamComplaint(c.referenceNumber);
                                flashMessage(`${c.referenceNumber} ഒഴിവാക്കി`);
                              }
                            }}
                            className="min-h-[42px] px-3.5 py-1.5 rounded-full text-red-700 hover:bg-red-50 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ഡിലീറ്റ്</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SECTION 2: NOTICES & JOBS/TRAINING */}
      {activeSection === 'notices' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-[#E6E2D6] shadow-2xs space-y-3.5">
            <h2 className="text-lg font-bold text-[#141E18]">
              {editingNoticeId ? 'അറിയിപ്പ് തിരുത്തുക' : 'പുതിയ അറിയിപ്പ് നൽകുക'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#141E18] mb-1">തലക്കെട്ട് *</label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="അറിയിപ്പ് തലക്കെട്ട്"
                  className="w-full min-h-[46px] px-3.5 bg-white border border-[#DED9CA] rounded-xl text-sm text-[#141E18]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#141E18] mb-1">വിഭാഗം</label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value as NoticeCategory)}
                    className="w-full min-h-[46px] px-3 bg-white border border-[#DED9CA] rounded-xl text-sm font-bold"
                  >
                    <option value="General">പൊതുവായത്</option>
                    <option value="Job">തൊഴിൽ / പരിശീലനം</option>
                    <option value="Meeting">യോഗം</option>
                    <option value="Camp">ക്യാമ്പ്</option>
                    <option value="Water/Power">വെള്ളം / വൈദ്യുതി</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#141E18] mb-1">തീയതി</label>
                  <input
                    type="text"
                    value={noticeDate}
                    onChange={(e) => setNoticeDate(e.target.value)}
                    placeholder="ഉദാ: 06 നവംബർ 2026"
                    className="w-full min-h-[46px] px-3.5 bg-white border border-[#DED9CA] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141E18] mb-1">വിവരണം *</label>
                <textarea
                  rows={3}
                  required
                  value={noticeDesc}
                  onChange={(e) => setNoticeDesc(e.target.value)}
                  placeholder="വിശദമായ വിവരണം..."
                  className="w-full p-3 bg-white border border-[#DED9CA] rounded-xl text-sm text-[#141E18]"
                />
              </div>

              {/* Extra Job/Training Fields */}
              {noticeCategory === 'Job' && (
                <div className="bg-[#FAF8F2] p-4 rounded-2xl border border-[#EAE6DA] space-y-3">
                  <div className="text-xs font-bold text-[#7A5413] uppercase">
                    തൊഴിൽ / പരിശീലന വിവരങ്ങൾ
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-[#141E18] mb-1">തരം</label>
                      <select
                        value={noticeJobType}
                        onChange={(e) => setNoticeJobType(e.target.value)}
                        className="w-full min-h-[44px] px-2.5 bg-white border border-[#DED9CA] rounded-xl text-xs font-bold"
                      >
                        <option value="തൊഴിലുറപ്പ്">തൊഴിലുറപ്പ്</option>
                        <option value="നൈപുണ്യ പരിശീലനം">നൈപുണ്യ പരിശീലനം</option>
                        <option value="പ്രാദേശിക ഒഴിവ്">പ്രാദേശിക ഒഴിവ്</option>
                        <option value="അപ്രന്റീസ്ഷിപ്പ്">അപ്രന്റീസ്ഷിപ്പ്</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#141E18] mb-1">അവസാന തീയതി</label>
                      <input
                        type="date"
                        value={noticeLastDate}
                        onChange={(e) => setNoticeLastDate(e.target.value)}
                        className="w-full min-h-[44px] px-2.5 bg-white border border-[#DED9CA] rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#141E18] mb-1">യോഗ്യത</label>
                    <input
                      type="text"
                      value={noticeEligibility}
                      onChange={(e) => setNoticeEligibility(e.target.value)}
                      placeholder="ഉദാ: 10-ാം ക്ലാസ് പാസ്, വാർഡ് 19 സ്ഥിരതാമസം"
                      className="w-full min-h-[44px] px-3 bg-white border border-[#DED9CA] rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#141E18] mb-1">അപേക്ഷിക്കേണ്ട വിധം</label>
                    <input
                      type="text"
                      value={noticeHowToApply}
                      onChange={(e) => setNoticeHowToApply(e.target.value)}
                      placeholder="അക്ഷയ വഴി / പഞ്ചായത്ത് ഓഫീസിൽ"
                      className="w-full min-h-[44px] px-3 bg-white border border-[#DED9CA] rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-[#141E18] mb-1">ബന്ധപ്പെടേണ്ട ഫോൺ</label>
                      <input
                        type="tel"
                        value={noticeContactPhone}
                        onChange={(e) => setNoticeContactPhone(e.target.value)}
                        placeholder="ഫോൺ നമ്പർ"
                        className="w-full min-h-[44px] px-3 bg-white border border-[#DED9CA] rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#141E18] mb-1">ഗൂഗിൾ ഡ്രൈവ് ലിങ്ക്</label>
                      <input
                        type="url"
                        value={noticeDriveUrl}
                        onChange={(e) => setNoticeDriveUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full min-h-[44px] px-3 bg-white border border-[#DED9CA] rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    if (!noticeTitle.trim()) return alert('തലക്കെട്ട് നൽകുക');
                    if (noticeDriveUrl && !isValidDriveUrl(noticeDriveUrl)) {
                      return alert('ഗൂഗിൾ ഡ്രൈവ് ലിങ്ക് https:// ൽ ആരംഭിക്കണം');
                    }
                    await saveNotice(
                      {
                        title: noticeTitle,
                        titleMl: noticeTitle,
                        date: noticeDate,
                        category: noticeCategory,
                        description: noticeDesc,
                        descriptionMl: noticeDesc,
                        sendPush: noticeSendPush,
                        jobType: noticeCategory === 'Job' ? noticeJobType : undefined,
                        eligibility: noticeEligibility || undefined,
                        lastDate: noticeLastDate || undefined,
                        howToApply: noticeHowToApply || undefined,
                        contactPhone: noticeContactPhone || undefined,
                        driveUrl: noticeDriveUrl || undefined,
                      },
                      editingNoticeId
                    );
                    setEditingNoticeId(undefined);
                    setNoticeTitle('');
                    setNoticeDesc('');
                    flashMessage('അറിയിപ്പ് സംരക്ഷിച്ചു');
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-full bg-[#0E5135] hover:bg-[#146643] text-white font-bold text-sm cursor-pointer"
                >
                  {editingNoticeId ? 'അപ്ഡേറ്റ് ചെയ്യുക' : 'പ്രസിദ്ധീകരിക്കുക'}
                </button>

                {editingNoticeId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNoticeId(undefined);
                      setNoticeTitle('');
                      setNoticeDesc('');
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-full border border-[#DED9CA] text-[#141E18] font-bold text-sm"
                  >
                    റദ്ദാക്കുക
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notices List */}
          <div className="space-y-2">
            {notices.map((n) => (
              <div
                key={n.id}
                className="bg-white p-4 rounded-2xl border border-[#E6E2D6] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs text-[#7A5413] font-bold">{n.category} · {n.date}</div>
                  <div className="text-sm font-bold text-[#141E18] truncate">{n.titleMl || n.title}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNoticeId(n.id);
                      setNoticeTitle(n.titleMl || n.title);
                      setNoticeDate(n.date);
                      setNoticeCategory(n.category);
                      setNoticeDesc(n.descriptionMl || n.description);
                      setNoticeJobType(n.jobType || 'തൊഴിലുറപ്പ്');
                      setNoticeEligibility(n.eligibility || '');
                      setNoticeLastDate(n.lastDate || '');
                      setNoticeHowToApply(n.howToApply || '');
                      setNoticeContactPhone(n.contactPhone || '');
                      setNoticeDriveUrl(n.driveUrl || '');
                    }}
                    className="p-2 text-[#0E5135] hover:bg-[#E8F2EC] rounded-lg cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('ഈ അറിയിപ്പ് ഒഴിവാക്കണോ?')) {
                        await deleteNotice(n.id);
                        flashMessage('അറിയിപ്പ് ഒഴിവാക്കി');
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: FORMS */}
      {activeSection === 'forms' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-[#E6E2D6] shadow-2xs space-y-3.5">
            <h2 className="text-lg font-bold text-[#141E18]">
              {editingFormId ? 'ഫോം വിവരങ്ങൾ തിരുത്തുക' : 'പുതിയ അപേക്ഷാ ഫോം ചേർക്കുക'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#141E18] mb-1">ഫോം തലക്കെട്ട് *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="ഉദാ: വാർദ്ധക്യകാല പെൻഷൻ അപേക്ഷ"
                  className="w-full min-h-[46px] px-3.5 bg-white border border-[#DED9CA] rounded-xl text-sm text-[#141E18]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#141E18] mb-1">വിഭാഗം</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full min-h-[46px] px-3 bg-white border border-[#DED9CA] rounded-xl text-sm font-bold"
                  >
                    <option value="സർട്ടിഫിക്കറ്റുകൾ">സർട്ടിഫിക്കറ്റുകൾ</option>
                    <option value="പെൻഷൻ">പെൻഷൻ</option>
                    <option value="റേഷൻ കാർഡ്">റേഷൻ കാർഡ്</option>
                    <option value="ഭവനം">ഭവനം</option>
                    <option value="ആരോഗ്യം">ആരോഗ്യം</option>
                    <option value="മറ്റുള്ളവ">മറ്റുള്ളവ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#141E18] mb-1">ഫീസ്</label>
                  <input
                    type="text"
                    value={formFee}
                    onChange={(e) => setFormFee(e.target.value)}
                    placeholder="സൗജന്യം / ₹10"
                    className="w-full min-h-[46px] px-3.5 bg-white border border-[#DED9CA] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141E18] mb-1">വിവരണം</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="പദ്ധതിയെയും ഫോമിനെയും കുറിച്ചുള്ള വിവരണം..."
                  className="w-full p-3 bg-white border border-[#DED9CA] rounded-xl text-sm text-[#141E18]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141E18] mb-1">
                  ആവശ്യമായ രേഖകൾ (ഓരോ വരിയിലും ഓരോന്ന്)
                </label>
                <textarea
                  rows={3}
                  value={formDocsRaw}
                  onChange={(e) => setFormDocsRaw(e.target.value)}
                  placeholder="ആധാർ കാർഡ്&#10;റേഷൻ കാർഡ്&#10;വരുമാന സർട്ടിഫിക്കറ്റ്"
                  className="w-full p-3 bg-white border border-[#DED9CA] rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141E18] mb-1">
                  നടപടിക്രമങ്ങൾ (ഓരോ വരിയിലും ഓരോന്ന്)
                </label>
                <textarea
                  rows={3}
                  value={formStepsRaw}
                  onChange={(e) => setFormStepsRaw(e.target.value)}
                  placeholder="ഫോം പൂരിപ്പിക്കുക&#10;പഞ്ചായത്ത് ഓഫീസിൽ സമർപ്പിക്കുക"
                  className="w-full p-3 bg-white border border-[#DED9CA] rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#141E18] mb-1">എവിടെ സമർപ്പിക്കണം</label>
                  <input
                    type="text"
                    value={formOffice}
                    onChange={(e) => setFormOffice(e.target.value)}
                    placeholder="പഞ്ചായത്ത് ഓഫീസ് / അക്ഷയ"
                    className="w-full min-h-[46px] px-3 bg-white border border-[#DED9CA] rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#141E18] mb-1">ഗൂഗിൾ ഡ്രൈവ് ലിങ്ക് *</label>
                  <input
                    type="url"
                    required
                    value={formDriveUrl}
                    onChange={(e) => setFormDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full min-h-[46px] px-3 bg-white border border-[#DED9CA] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    if (!formTitle.trim()) return alert('തലക്കെട്ട് നൽകുക');
                    if (!formDriveUrl || !isValidDriveUrl(formDriveUrl)) {
                      return alert('ഗൂഗിൾ ഡ്രൈവ് ലിങ്ക് https:// ൽ ആരംഭിക്കണം');
                    }
                    const docsList = formDocsRaw.split('\n').map((s) => s.trim()).filter(Boolean);
                    const stepsList = formStepsRaw.split('\n').map((s) => s.trim()).filter(Boolean);
                    await saveForm(
                      {
                        title: formTitle,
                        category: formCategory,
                        description: formDesc,
                        documentsNeeded: docsList,
                        steps: stepsList,
                        fee: formFee,
                        officeToSubmit: formOffice,
                        driveUrl: formDriveUrl,
                      },
                      editingFormId
                    );
                    setEditingFormId(undefined);
                    setFormTitle('');
                    setFormDesc('');
                    setFormDriveUrl('');
                    flashMessage('ഫോം വിവരങ്ങൾ സംരക്ഷിച്ചു');
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-full bg-[#0E5135] text-white font-bold text-sm cursor-pointer"
                >
                  {editingFormId ? 'അപ്ഡേറ്റ് ചെയ്യുക' : 'ഫോം ചേർക്കുക'}
                </button>
              </div>
            </div>
          </div>

          {/* Forms List */}
          <div className="space-y-2">
            {forms.map((f) => (
              <div
                key={f.id}
                className="bg-white p-4 rounded-2xl border border-[#E6E2D6] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs text-[#7A5413] font-bold">{f.category}</div>
                  <div className="text-sm font-bold text-[#141E18] truncate">{f.title}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFormId(f.id);
                      setFormTitle(f.title);
                      setFormCategory(f.category);
                      setFormDesc(f.description);
                      setFormDocsRaw(f.documentsNeeded ? f.documentsNeeded.join('\n') : '');
                      setFormStepsRaw(f.steps ? f.steps.join('\n') : '');
                      setFormFee(f.fee);
                      setFormOffice(f.officeToSubmit);
                      setFormDriveUrl(f.driveUrl);
                    }}
                    className="p-2 text-[#0E5135] hover:bg-[#E8F2EC] rounded-lg cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('ഈ ഫോം ഒഴിവാക്കണോ?')) {
                        await deleteForm(f.id);
                        flashMessage('ഫോം ഒഴിവാക്കി');
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: EVENTS & GRAM SABHA */}
      {activeSection === 'events' && (
        <div className="space-y-5">
          {/* Events Management */}
          <div className="bg-white rounded-3xl p-5 border border-[#E6E2D6] shadow-2xs space-y-3.5">
            <h2 className="text-lg font-bold text-[#141E18]">
              {editingEventId ? 'പരിപാടി തിരുത്തുക' : 'പുതിയ പരിപാടി ചേർക്കുക'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#141E18] mb-1">പരിപാടിയുടെ പേര് *</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="ഉദാ: സൗജന്യ മെഡിക്കൽ ക്യാമ്പ്"
                  className="w-full min-h-[46px] px-3.5 bg-white border border-[#DED9CA] rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#141E18] mb-1">വിഭാഗം</label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as EventCategory)}
                    className="w-full min-h-[46px] px-3 bg-white border border-[#DED9CA] rounded-xl text-sm font-bold"
                  >
                    <option value="യോഗം">യോഗം</option>
                    <option value="ക്യാമ്പ്">ക്യാമ്പ്</option>
                    <option value="വാക്സിനേഷൻ">വാക്സിനേഷൻ</option>
                    <option value="രക്തദാന ക്യാമ്പ്">രക്തദാന ക്യാമ്പ്</option>
                    <option value="ഉത്സവം">ഉത്സവം</option>
                    <option value="മറ്റുള്ളവ">മറ്റുള്ളവ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#141E18] mb-1">തീയതി *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full min-h-[46px] px-3 bg-white border border-[#DED9CA] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#141E18] mb-1">ആരംഭ സമയം</label>
                  <input
                    type="text"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full min-h-[46px] px-3 bg-white border border-[#DED9CA] rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#141E18] mb-1">സമാപന സമയം</label>
                  <input
                    type="text"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    placeholder="12:30 PM"
                    className="w-full min-h-[46px] px-3 bg-white border border-[#DED9CA] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141E18] mb-1">സ്ഥലം *</label>
                <input
                  type="text"
                  required
                  value={eventVenue}
                  onChange={(e) => setEventVenue(e.target.value)}
                  placeholder="മേൽപ്പറമ്പ കമ്മ്യൂണിറ്റി ഹാൾ"
                  className="w-full min-h-[46px] px-3.5 bg-white border border-[#DED9CA] rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141E18] mb-1">വിവരണം</label>
                <textarea
                  rows={2}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="പരിപാടിയെ കുറിച്ചുള്ള വിവരങ്ങൾ..."
                  className="w-full p-3 bg-white border border-[#DED9CA] rounded-xl text-sm"
                />
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!eventTitle.trim() || !eventDate) return alert('പേരും തീയതിയും നൽകുക');
                  await saveEvent(
                    {
                      title: eventTitle,
                      category: eventCategory,
                      date: eventDate,
                      startTime: eventStartTime,
                      endTime: eventEndTime,
                      venue: eventVenue,
                      mapsUrl: eventMapsUrl || undefined,
                      description: eventDesc,
                    },
                    editingEventId
                  );
                  setEditingEventId(undefined);
                  setEventTitle('');
                  flashMessage('പരിപാടി സംരക്ഷിച്ചു');
                }}
                className="min-h-[44px] px-5 py-2 rounded-full bg-[#0E5135] text-white font-bold text-sm cursor-pointer"
              >
                {editingEventId ? 'അപ്ഡേറ്റ് ചെയ്യുക' : 'പരിപാടി ചേർക്കുക'}
              </button>
            </div>
          </div>

          {/* Citizen Submitted Gram Sabha Points Queue */}
          <div className="bg-white rounded-3xl p-5 border border-[#E6E2D6] shadow-2xs space-y-3">
            <h2 className="text-lg font-bold text-[#141E18]">
              പൊതുജനങ്ങൾ ഉന്നയിച്ച ഗ്രാമസഭാ വിഷയങ്ങൾ ({gramSabhaPoints.length})
            </h2>

            {gramSabhaPoints.length === 0 ? (
              <p className="text-sm text-[#637067]">പുതിയ വിഷയങ്ങൾ ഒന്നും ലഭിച്ചിട്ടില്ല</p>
            ) : (
              <div className="space-y-3">
                {gramSabhaPoints.map((pt) => (
                  <div
                    key={pt.id}
                    className="bg-[#FAF8F2] p-4 rounded-2xl border border-[#EAE6DA] space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-[#7A5413]">
                      <span>{pt.date || 'തീയതി രേഖപ്പെടുത്തിയിട്ടില്ല'}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm('ഈ വിഷയം ഒഴിവാക്കണോ?')) {
                            await deleteGramSabhaPoint(pt.id);
                            flashMessage('വിഷയം ഒഴിവാക്കി');
                          }
                        }}
                        className="text-red-700 font-bold hover:underline cursor-pointer"
                      >
                        ഡിലീറ്റ്
                      </button>
                    </div>
                    <p className="text-sm font-bold text-[#141E18] whitespace-pre-line">
                      {pt.subject}
                    </p>
                    {(pt.name || pt.phone) && (
                      <div className="text-xs text-[#637067]">
                        {pt.name && <span>ഉന്നയിച്ചയാൾ: {pt.name} </span>}
                        {pt.phone && <span>· ഫോൺ: {pt.phone}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: WASTE MANAGEMENT & BROADCAST */}
      {activeSection === 'waste' && (
        <div className="space-y-5">
          {/* Quick Push Reminder Broadcast */}
          <div className="bg-[#0E5135] text-white rounded-3xl p-5 space-y-3">
            <div className="text-xs font-bold text-amber-200 uppercase">
              തത്സമയ ഓർമ്മപ്പെടുത്തൽ അയയ്ക്കുക
            </div>
            <h2 className="text-lg font-bold">ഹരിത കർമ്മ സേന നോട്ടിഫിക്കേഷൻ</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => broadcastWasteReminder('പ്ലാസ്റ്റിക് / അജൈവം', 'നാളെ രാവിലെ')}
                className="py-2.5 px-3 bg-white text-[#0E5135] font-bold text-xs rounded-xl hover:bg-emerald-50 cursor-pointer"
              >
                പ്ലാസ്റ്റിക് ശേഖരണ നോട്ടിഫിക്കേഷൻ
              </button>
              <button
                type="button"
                onClick={() => broadcastWasteReminder('ഗ്ലാസ് കുപ്പികൾ', 'ഈ ശനിയാഴ്ച')}
                className="py-2.5 px-3 bg-white text-[#0E5135] font-bold text-xs rounded-xl hover:bg-emerald-50 cursor-pointer"
              >
                ഗ്ലാസ് ശേഖരണ നോട്ടിഫിക്കേഷൻ
              </button>
            </div>
          </div>

          {/* Waste Contact Coordinates */}
          <div className="bg-white rounded-3xl p-5 border border-[#E6E2D6] shadow-2xs space-y-3">
            <h2 className="text-base font-bold text-[#141E18]">
              ഹരിത കർമ്മ സേന കോൺടാക്റ്റ് വിവരങ്ങൾ
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#141E18] mb-1">കോർഡിനേറ്റർ പേര്</label>
                <input
                  type="text"
                  value={wasteCoordName}
                  onChange={(e) => setWasteCoordName(e.target.value)}
                  className="w-full min-h-[44px] px-3 bg-white border border-[#DED9CA] rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#141E18] mb-1">വാട്സ്ആപ്പ് / ഫോൺ</label>
                <input
                  type="tel"
                  value={wasteCoordPhone}
                  onChange={(e) => setWasteCoordPhone(e.target.value)}
                  className="w-full min-h-[44px] px-3 bg-white border border-[#DED9CA] rounded-xl text-xs font-bold"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                await saveWasteInfo({
                  contactName: wasteCoordName,
                  phone: wasteCoordPhone,
                  whatsapp: wasteCoordPhone,
                });
                flashMessage('ഹരിത കർമ്മ സേന വിവരങ്ങൾ അപ്ഡേറ്റ് ചെയ്തു');
              }}
              className="min-h-[42px] px-4 py-2 rounded-full bg-[#0E5135] text-white font-bold text-xs cursor-pointer"
            >
              അപ്ഡേറ്റ് ചെയ്യുക
            </button>
          </div>
        </div>
      )}

      {/* SECTION 6: DEVELOPMENT WORKS */}
      {activeSection === 'works' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-[#E6E2D6] shadow-2xs space-y-3.5">
            <h2 className="text-lg font-bold text-[#141E18]">
              {editingWorkId ? 'പ്രവൃത്തി തിരുത്തുക' : 'പുതിയ വികസന പ്രവൃത്തി ചേർക്കുക'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#141E18] mb-1">പദ്ധതി പേര് *</label>
                <input
                  type="text"
                  required
                  value={workTitle}
                  onChange={(e) => setWorkTitle(e.target.value)}
                  placeholder="ഉദാ: മേൽപ്പറമ്പ റോഡ് ബിറ്റുമിൻ ടാറിംഗ്"
                  className="w-full min-h-[46px] px-3.5 bg-white border border-[#DED9CA] rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#141E18] mb-1">വിഭാഗം</label>
                  <select
                    value={workCategory}
                    onChange={(e) => setWorkCategory(e.target.value as WorkCategory)}
                    className="w-full min-h-[46px] px-3 bg-white border border-[#DED9CA] rounded-xl text-sm font-bold"
                  >
                    <option value="റോഡുകൾ">റോഡുകൾ</option>
                    <option value="കുടിവെള്ളം">കുടിവെള്ളം</option>
                    <option value="തെരുവ് വിളക്കുകൾ">തെരുവ് വിളക്കുകൾ</option>
                    <option value="കെട്ടിടങ്ങൾ">കെട്ടിടങ്ങൾ</option>
                    <option value="ശുചിത്വം">ശുചിത്വം</option>
                    <option value="മറ്റുള്ളവ">മറ്റുള്ളവ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#141E18] mb-1">നിലവിലെ സ്ഥിതി</label>
                  <select
                    value={workStatus}
                    onChange={(e) => setWorkStatus(e.target.value as WorkStatus)}
                    className="w-full min-h-[46px] px-3 bg-white border border-[#DED9CA] rounded-xl text-sm font-bold"
                  >
                    <option value="ടെൻഡർ ഘട്ടത്തിൽ">ടെൻഡർ ഘട്ടത്തിൽ</option>
                    <option value="ആരംഭിച്ചു">ആരംഭിച്ചു</option>
                    <option value="പുരോഗമിക്കുന്നു">പുരോഗമിക്കുന്നു</option>
                    <option value="പൂർത്തിയായി">പൂർത്തിയായി</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#141E18] mb-1">അനുവദിച്ച തുക (₹)</label>
                  <input
                    type="number"
                    value={workSanctioned}
                    onChange={(e) => setWorkSanctioned(Number(e.target.value))}
                    className="w-full min-h-[46px] px-3 bg-white border border-[#DED9CA] rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#141E18] mb-1">ചെലവഴിച്ച തുക (₹)</label>
                  <input
                    type="number"
                    value={workSpent}
                    onChange={(e) => setWorkSpent(Number(e.target.value))}
                    className="w-full min-h-[46px] px-3 bg-white border border-[#DED9CA] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#141E18] mb-1">പുരോഗതി (%): {workProgress}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={workProgress}
                    onChange={(e) => setWorkProgress(Number(e.target.value))}
                    className="w-full h-8"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#141E18] mb-1">ഫണ്ട് ഉറവിടം</label>
                  <input
                    type="text"
                    value={workFund}
                    onChange={(e) => setWorkFund(e.target.value)}
                    placeholder="പഞ്ചായത്ത് ഫണ്ട് / MLA ഫണ്ട്"
                    className="w-full min-h-[46px] px-3 bg-white border border-[#DED9CA] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141E18] mb-1">വിവരണം</label>
                <textarea
                  rows={2}
                  value={workDesc}
                  onChange={(e) => setWorkDesc(e.target.value)}
                  placeholder="പ്രവൃത്തിയെ കുറിച്ചുള്ള വിശദാംശങ്ങൾ..."
                  className="w-full p-3 bg-white border border-[#DED9CA] rounded-xl text-sm"
                />
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!workTitle.trim()) return alert('പദ്ധതി പേര് നൽകുക');
                  await saveWork(
                    {
                      title: workTitle,
                      description: workDesc,
                      category: workCategory,
                      status: workStatus,
                      startDate: workStart || '2026-11-01',
                      expectedEndDate: workEnd || '2027-01-31',
                      sanctionedAmount: workSanctioned,
                      spentAmount: workSpent,
                      fundSource: workFund,
                      progressPercent: workProgress,
                      photoUrls: [],
                      updates: [
                        { date: new Date().toISOString().slice(0, 10), note: 'വിവരങ്ങൾ അപ്ഡേറ്റ് ചെയ്തു' },
                      ],
                    },
                    editingWorkId
                  );
                  setEditingWorkId(undefined);
                  setWorkTitle('');
                  flashMessage('വികസന പ്രവൃത്തി സംരക്ഷിച്ചു');
                }}
                className="min-h-[44px] px-5 py-2 rounded-full bg-[#0E5135] text-white font-bold text-sm cursor-pointer"
              >
                {editingWorkId ? 'അപ്ഡേറ്റ് ചെയ്യുക' : 'പ്രവൃത്തി ചേർക്കുക'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: BLOOD DONORS APPROVAL QUEUE */}
      {activeSection === 'donors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#141E18]">
              രക്തദാതാക്കൾ ({donors.length})
            </h2>
            <span className="text-xs font-bold text-amber-700">
              അംഗീകാരം കാക്കുന്നവർ: {donors.filter((d) => !d.approved).length}
            </span>
          </div>

          <div className="space-y-3">
            {donors.map((d) => (
              <div
                key={d.id}
                className="bg-white p-4 rounded-2xl border border-[#E6E2D6] flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-extrabold">
                      {d.bloodGroup}
                    </span>
                    <span className="text-sm font-bold text-[#141E18] truncate">{d.name}</span>
                    {!d.approved && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-2xs font-bold">
                        പരിശോധനയിൽ
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#637067] mt-1">
                    {d.area} · ഫോൺ: {d.phone}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!d.approved ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await approveDonor(d.id, true);
                        flashMessage(`${d.name} അംഗീകരിച്ചു`);
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#0E5135] text-white font-bold text-xs cursor-pointer"
                    >
                      അംഗീകരിക്കുക
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        await toggleDonorAvailability(d.id, !d.available);
                        flashMessage(`ലഭ്യത മാറ്റി`);
                      }}
                      className={`px-3 py-1.5 rounded-full font-bold text-xs cursor-pointer ${
                        d.available ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {d.available ? 'ലഭ്യമാണ്' : 'ലഭ്യമല്ല'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`${d.name}-നെ ഒഴിവാക്കണോ?`)) {
                        await deleteDonor(d.id);
                        flashMessage('ഒഴിവാക്കി');
                      }
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 8: CONTACTS, SCHEMES, DIRECTORY, WARD */}
      {activeSection === 'ward' && (
        <div className="bg-white rounded-3xl p-5 border border-[#E6E2D6] shadow-2xs space-y-4">
          <h2 className="text-lg font-bold text-[#141E18]">വാർഡ് മെമ്പർ പ്രൊഫൈൽ</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#141E18] mb-1">മെമ്പറുടെ പേര്</label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="w-full min-h-[46px] px-3.5 bg-white border border-[#DED9CA] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#141E18] mb-1">ഫോൺ നമ്പർ</label>
              <input
                type="tel"
                value={memberPhone}
                onChange={(e) => setMemberPhone(e.target.value)}
                className="w-full min-h-[46px] px-3.5 bg-white border border-[#DED9CA] rounded-xl text-sm"
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                await saveWardInfo({
                  ...wardInfo,
                  memberNameMl: memberName,
                  memberName: memberName,
                  phone: memberPhone,
                  whatsapp: memberPhone,
                });
                flashMessage('വാർഡ് വിവരങ്ങൾ അപ്ഡേറ്റ് ചെയ്തു');
              }}
              className="min-h-[44px] px-5 py-2 rounded-full bg-[#0E5135] text-white font-bold text-sm cursor-pointer"
            >
              പ്രൊഫൈൽ സംരക്ഷിക്കുക
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
