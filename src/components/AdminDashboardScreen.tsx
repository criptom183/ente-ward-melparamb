import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Bell,
  Phone,
  MapPin,
  Lock,
  AlertTriangle,
  Check,
  FileText,
  BookOpen,
  ChevronLeft,
  UserPlus,
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
} from '../types/ward';

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
  signInAdminWithEmail: (email: string, pass: string) => Promise<void>;
  registerAdminWithEmail: (email: string, pass: string) => Promise<User>;
  signInAdminWithGoogle: () => Promise<void>;
  signOutAdmin: () => Promise<void>;
  saveNotice: (
    notice: Omit<Notice, 'id' | 'createdAt'>,
    existingId?: string
  ) => Promise<void>;
  deleteNotice: (id: string) => Promise<void>;
  saveContact: (
    contact: Omit<Contact, 'id' | 'createdAt'>,
    existingId?: string
  ) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  saveScheme: (
    scheme: Omit<Scheme, 'id' | 'createdAt'>,
    existingId?: string
  ) => Promise<void>;
  deleteScheme: (id: string) => Promise<void>;
  saveDirectoryEntry: (
    entry: Omit<DirectoryEntry, 'id' | 'createdAt'>,
    existingId?: string
  ) => Promise<void>;
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
  Received: {
    label: 'ലഭിച്ചു',
    bg: 'bg-[#E3EEF8]',
    text: 'text-[#1E466E]',
  },
  'In Progress': {
    label: 'നടപടിയിൽ',
    bg: 'bg-[#F7EFE0]',
    text: 'text-[#7A5413]',
  },
  Resolved: {
    label: 'പരിഹരിച്ചു',
    bg: 'bg-[#E5F3EB]',
    text: 'text-[#0E5135]',
  },
};

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
  signInAdminWithEmail,
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
  onBack,
}) => {
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Active section in Admin
  const [activeSection, setActiveSection] = useState<
    'overview' | 'notices' | 'contacts' | 'schemes' | 'directory' | 'ward'
  >('overview');
  const [expandedComplaintRef, setExpandedComplaintRef] = useState<
    string | null
  >(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Notice Editor State
  const [editingNoticeId, setEditingNoticeId] = useState<string | undefined>(
    undefined
  );
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeDate, setNoticeDate] = useState('06 നവംബർ 2026');
  const [noticeCategory, setNoticeCategory] =
    useState<NoticeCategory>('Meeting');
  const [noticeDesc, setNoticeDesc] = useState('');
  const [noticeImageUrl, setNoticeImageUrl] = useState('');
  const [noticeSendPush, setNoticeSendPush] = useState(true);

  // Contact Editor State
  const [editingContactId, setEditingContactId] = useState<string | undefined>(
    undefined
  );
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactCategory, setContactCategory] =
    useState<ContactCategory>('Panchayat');
  const [contactHours, setContactHours] = useState(
    'രാവിലെ 9:30 – വൈകിട്ട് 5:00'
  );

  // Scheme Editor State
  const [editingSchemeId, setEditingSchemeId] = useState<string | undefined>(
    undefined
  );
  const [schemeTitle, setSchemeTitle] = useState('');
  const [schemeCategory, setSchemeCategory] =
    useState<SchemeCategory>('Pension');
  const [schemeElig, setSchemeElig] = useState('');
  const [schemeDocs, setSchemeDocs] = useState('');
  const [schemeApply, setSchemeApply] = useState('');

  // Directory Editor State
  const [editingDirId, setEditingDirId] = useState<string | undefined>(
    undefined
  );
  const [dirName, setDirName] = useState('');
  const [dirCategory, setDirCategory] = useState<DirectoryCategory>('Doctors');
  const [dirPhone, setDirPhone] = useState('');
  const [dirPlace, setDirPlace] = useState('മേൽപ്പറമ്പ');
  const [dirTimings, setDirTimings] = useState('രാവിലെ 9:00 – രാത്രി 7:00');

  // Ward Member Info Editor State
  const [memberName, setMemberName] = useState(
    wardInfo.memberNameMl || wardInfo.memberName
  );
  const [memberPhone, setMemberPhone] = useState(wardInfo.phone);
  const [memberHours, setMemberHours] = useState(
    wardInfo.officeHoursMl || wardInfo.officeHours
  );
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  // Complaint Remark & Status Drafts
  const [remarkDrafts, setRemarkDrafts] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<
    Record<string, ComplaintStatus>
  >({});

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
      setAuthError(
        err instanceof Error ? err.message : 'ലോഗിൻ പരാജയപ്പെട്ടു.'
      );
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

  const newComplaintsCount = combinedComplaints.filter(
    (c) => c.status === 'Received'
  ).length;

  // IF NOT SIGNED IN AS ADMIN -> SHOW ADMIN LOGIN SCREEN
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="മടങ്ങുക"
            className="w-12 h-12 rounded-full bg-white border border-[#E6E2D6] flex items-center justify-center text-[#141E18] hover:bg-[#F3F0E6] transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#141E18]">
            അഡ്മിൻ ലോഗിൻ
          </h1>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E6E2D6] shadow-2xs space-y-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#E8F2EC] text-[#0E5135] flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#141E18]">
                അഡ്മിൻ പ്രവേശനം
              </h2>
              <p className="text-sm text-[#637067]">
                അധികാരപ്പെടുത്തിയ അഡ്മിൻമാർക്ക് മാത്രം
              </p>
            </div>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-300 rounded-2xl p-4 text-sm text-red-900 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
              <div>{authError}</div>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#141E18] mb-1.5">
                ഇമെയിൽ
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full min-h-[50px] px-4 py-3 bg-white border border-[#DED9CA] rounded-2xl text-base text-[#141E18]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#141E18] mb-1.5">
                പാസ്‌വേഡ്
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[50px] px-4 py-3 bg-white border border-[#DED9CA] rounded-2xl text-base text-[#141E18]"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full min-h-[54px] px-5 py-3.5 rounded-full bg-[#0E5135] hover:bg-[#0A3E28] text-white font-bold text-base cursor-pointer"
            >
              {authLoading ? 'ലോഗിൻ ചെയ്യുന്നു...' : 'ലോഗിൻ ചെയ്യുക'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#E6E2D6]">
            <button
              type="button"
              onClick={async () => {
                setAuthError(null);
                try {
                  await signInAdminWithGoogle();
                } catch (err) {
                  setAuthError(
                    err instanceof Error ? err.message : 'ലോഗിൻ പരാജയപ്പെട്ടു'
                  );
                }
              }}
              className="w-full min-h-[52px] px-5 py-3 rounded-full bg-[#E8F2EC] hover:bg-[#D5E9DD] text-[#0E5135] font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Google അക്കൗണ്ട് വഴി ലോഗിൻ ചെയ്യുക</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 9: VERIFIED ADMIN DASHBOARD ("അഡ്മിൻ")
  return (
    <div className="space-y-6">
      {/* Dark Green Admin Header Card */}
      <section className="bg-[#0E5135] rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden space-y-3">
        <div
          aria-hidden="true"
          className="w-40 h-40 rounded-full border border-white/10 absolute -top-12 -right-12 pointer-events-none"
        />
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="ഹോം"
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              അഡ്മിൻ
            </h1>
          </div>

          <button
            type="button"
            onClick={signOutAdmin}
            className="min-h-[42px] px-5 py-2 rounded-full border border-white/35 bg-[#24664A]/60 hover:bg-[#24664A] text-white font-bold text-sm sm:text-base transition-colors cursor-pointer"
          >
            സൈൻ ഔട്ട്
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 relative z-10 pt-1">
          <div className="flex items-center gap-2.5 text-sm sm:text-base text-emerald-100 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D6A13C] shrink-0" />
            <span className="truncate">
              വാർഡ് 19 · {currentUser?.email || 'അഡ്മിൻ'}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setActiveSection(activeSection === 'ward' ? 'overview' : 'ward')
            }
            className="text-xs text-emerald-100 underline shrink-0 cursor-pointer"
          >
            വാർഡ് ക്രമീകരണം
          </button>
        </div>
      </section>

      {statusMessage && (
        <div className="bg-[#0E5135] text-white rounded-2xl p-4 font-bold text-base flex items-center gap-2.5">
          <Check className="w-5 h-5 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Post Notice Card with Gold Button & Push Checkbox */}
      <section className="bg-white rounded-3xl p-5 border border-[#E6E2D6] shadow-2xs space-y-4">
        <button
          type="button"
          onClick={() =>
            setActiveSection(
              activeSection === 'notices' ? 'overview' : 'notices'
            )
          }
          className="w-full min-h-[58px] py-4 px-5 rounded-full bg-[#D6A13C] hover:bg-[#C5902E] text-[#141E18] font-bold text-lg flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
        >
          <Plus className="w-6 h-6 stroke-[2.5] shrink-0" />
          <span>അറിയിപ്പ് പോസ്റ്റ് ചെയ്യുക</span>
        </button>

        <label className="flex items-start sm:items-center gap-3 cursor-pointer select-none px-1">
          <button
            type="button"
            role="checkbox"
            aria-checked={noticeSendPush}
            onClick={() => setNoticeSendPush(!noticeSendPush)}
            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 transition-colors cursor-pointer ${
              noticeSendPush
                ? 'bg-[#0E5135] text-white'
                : 'border-2 border-[#DED9CA] bg-white'
            }`}
          >
            {noticeSendPush && <Check className="w-4 h-4 stroke-[3]" />}
          </button>
          <span className="text-base text-[#141E18] leading-snug">
            താമസക്കാർക്ക് പുഷ് അറിയിപ്പും അയയ്ക്കുക
          </span>
        </label>
      </section>

      {/* Manage Content 2x2 Grid ("ഉള്ളടക്കം നിയന്ത്രിക്കുക") */}
      <section className="space-y-3.5">
        <h2 className="text-xl font-bold text-[#141E18]">
          ഉള്ളടക്കം നിയന്ത്രിക്കുക
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              setActiveSection(
                activeSection === 'notices' ? 'overview' : 'notices'
              )
            }
            className={`min-h-[68px] p-4 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-base sm:text-lg transition-colors cursor-pointer ${
              activeSection === 'notices'
                ? 'bg-[#E8F2EC] border-[#0E5135] text-[#0E5135]'
                : 'bg-white border-[#E6E2D6] text-[#141E18] hover:bg-[#F3F0E6]'
            }`}
          >
            <Bell className="w-5 h-5 text-[#0E5135] shrink-0" />
            <span>അറിയിപ്പുകൾ</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveSection(
                activeSection === 'contacts' ? 'overview' : 'contacts'
              )
            }
            className={`min-h-[68px] p-4 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-base sm:text-lg transition-colors cursor-pointer ${
              activeSection === 'contacts'
                ? 'bg-[#E8F2EC] border-[#0E5135] text-[#0E5135]'
                : 'bg-white border-[#E6E2D6] text-[#141E18] hover:bg-[#F3F0E6]'
            }`}
          >
            <Phone className="w-5 h-5 text-[#0E5135] shrink-0" />
            <span className="leading-tight">ഫോൺ നമ്പറുകൾ</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveSection(
                activeSection === 'schemes' ? 'overview' : 'schemes'
              )
            }
            className={`min-h-[68px] p-4 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-base sm:text-lg transition-colors cursor-pointer ${
              activeSection === 'schemes'
                ? 'bg-[#E8F2EC] border-[#0E5135] text-[#0E5135]'
                : 'bg-white border-[#E6E2D6] text-[#141E18] hover:bg-[#F3F0E6]'
            }`}
          >
            <FileText className="w-5 h-5 text-[#0E5135] shrink-0" />
            <span>പദ്ധതികൾ</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveSection(
                activeSection === 'directory' ? 'overview' : 'directory'
              )
            }
            className={`min-h-[68px] p-4 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-base sm:text-lg transition-colors cursor-pointer ${
              activeSection === 'directory'
                ? 'bg-[#E8F2EC] border-[#0E5135] text-[#0E5135]'
                : 'bg-white border-[#E6E2D6] text-[#141E18] hover:bg-[#F3F0E6]'
            }`}
          >
            <BookOpen className="w-5 h-5 text-[#0E5135] shrink-0" />
            <span>ഡയറക്ടറി</span>
          </button>
        </div>
      </section>

      {/* EXPANDED CONTENT EDITORS WHEN SELECTED */}
      {activeSection === 'notices' && (
        <section className="bg-white rounded-3xl p-5 border-2 border-[#0E5135] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#141E18]">
              {editingNoticeId
                ? 'അറിയിപ്പ് തിരുത്തുക'
                : 'പുതിയ അറിയിപ്പ് ചേർക്കുക'}
            </h3>
            <button
              type="button"
              onClick={() => setActiveSection('overview')}
              className="text-sm font-bold text-[#0E5135] underline cursor-pointer"
            >
              അടയ്ക്കുക
            </button>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await saveNotice(
                {
                  title: noticeTitle,
                  titleMl: noticeTitle,
                  date: noticeDate,
                  category: noticeCategory,
                  description: noticeDesc,
                  descriptionMl: noticeDesc,
                  ...(noticeImageUrl ? { imageUrl: noticeImageUrl } : {}),
                  sendPush: noticeSendPush,
                },
                editingNoticeId
              );
              flashMessage(
                editingNoticeId
                  ? 'അറിയിപ്പ് പുതുക്കി!'
                  : 'അറിയിപ്പ് പോസ്റ്റ് ചെയ്തു!'
              );
              setEditingNoticeId(undefined);
              setNoticeTitle('');
              setNoticeDesc('');
              setNoticeImageUrl('');
            }}
            className="space-y-3"
          >
            <input
              type="text"
              required
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              placeholder="അറിയിപ്പിന്റെ തലക്കെട്ട് *"
              className="w-full min-h-[48px] px-4 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={noticeCategory}
                onChange={(e) =>
                  setNoticeCategory(e.target.value as NoticeCategory)
                }
                className="min-h-[48px] px-3 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base font-bold"
              >
                <option value="Meeting">യോഗം</option>
                <option value="Camp">ക്യാമ്പ്</option>
                <option value="Water/Power">വെള്ളം / വൈദ്യുതി</option>
                <option value="General">പൊതുവായത്</option>
              </select>
              <input
                type="text"
                required
                value={noticeDate}
                onChange={(e) => setNoticeDate(e.target.value)}
                placeholder="തീയതി *"
                className="min-h-[48px] px-3 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base"
              />
            </div>
            <textarea
              rows={3}
              required
              value={noticeDesc}
              onChange={(e) => setNoticeDesc(e.target.value)}
              placeholder="വിവരണം *"
              className="w-full p-3.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base"
            />
            <button
              type="submit"
              className="w-full min-h-[50px] py-3 rounded-full bg-[#0E5135] text-white font-bold text-base cursor-pointer"
            >
              {editingNoticeId ? 'സേവ് ചെയ്യുക' : 'പോസ്റ്റ് ചെയ്യുക'}
            </button>
          </form>

          <div className="space-y-2.5 pt-3 border-t border-[#E6E2D6]">
            {notices.map((n) => (
              <div
                key={n.id}
                className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#E6E2D6] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold text-base text-[#141E18] truncate">
                    {n.titleMl || n.title}
                  </div>
                  <div className="text-xs text-[#637067]">{n.date}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNoticeId(n.id);
                      setNoticeTitle(n.titleMl || n.title);
                      setNoticeDate(n.date);
                      setNoticeCategory(n.category);
                      setNoticeDesc(n.descriptionMl || n.description);
                    }}
                    className="p-2 rounded-full bg-white border border-[#DED9CA] text-[#0E5135] cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNotice(n.id)}
                    className="p-2 rounded-full bg-red-50 text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeSection === 'contacts' && (
        <section className="bg-white rounded-3xl p-5 border-2 border-[#0E5135] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#141E18]">
              {editingContactId ? 'നമ്പർ തിരുത്തുക' : 'ഫോൺ നമ്പർ ചേർക്കുക'}
            </h3>
            <button
              type="button"
              onClick={() => setActiveSection('overview')}
              className="text-sm font-bold text-[#0E5135] underline cursor-pointer"
            >
              അടയ്ക്കുക
            </button>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await saveContact(
                {
                  name: contactName,
                  nameMl: contactName,
                  role: contactRole || contactName,
                  roleMl: contactRole || contactName,
                  phone: contactPhone,
                  category: contactCategory,
                  officeHours: contactHours,
                  priority: 5,
                },
                editingContactId
              );
              flashMessage('ഫോൺ നമ്പർ സേവ് ചെയ്തു!');
              setEditingContactId(undefined);
              setContactName('');
              setContactRole('');
              setContactPhone('');
            }}
            className="space-y-3"
          >
            <input
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="ഓഫീസ് / സേവനത്തിന്റെ പേര് *"
              className="w-full min-h-[48px] px-4 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base"
            />
            <input
              type="tel"
              required
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="ഫോൺ നമ്പർ *"
              className="w-full min-h-[48px] px-4 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base tabular-nums"
            />
            <button
              type="submit"
              className="w-full min-h-[50px] py-3 rounded-full bg-[#0E5135] text-white font-bold text-base cursor-pointer"
            >
              സേവ് ചെയ്യുക
            </button>
          </form>

          <div className="space-y-2.5 pt-3 border-t border-[#E6E2D6]">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#E6E2D6] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold text-base text-[#141E18] truncate">
                    {c.nameMl || c.name}
                  </div>
                  <div className="text-xs text-[#637067] tabular-nums">
                    {c.phone}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingContactId(c.id);
                      setContactName(c.nameMl || c.name);
                      setContactRole(c.roleMl || c.role);
                      setContactPhone(c.phone);
                      setContactCategory(c.category);
                    }}
                    className="p-2 rounded-full bg-white border border-[#DED9CA] text-[#0E5135] cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteContact(c.id)}
                    className="p-2 rounded-full bg-red-50 text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeSection === 'schemes' && (
        <section className="bg-white rounded-3xl p-5 border-2 border-[#0E5135] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#141E18]">
              {editingSchemeId ? 'പദ്ധതി തിരുത്തുക' : 'പുതിയ പദ്ധതി ചേർക്കുക'}
            </h3>
            <button
              type="button"
              onClick={() => setActiveSection('overview')}
              className="text-sm font-bold text-[#0E5135] underline cursor-pointer"
            >
              അടയ്ക്കുക
            </button>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await saveScheme(
                {
                  title: schemeTitle,
                  titleMl: schemeTitle,
                  category: schemeCategory,
                  eligibility: schemeElig,
                  eligibilityMl: schemeElig,
                  documentsNeeded: schemeDocs,
                  documentsNeededMl: schemeDocs,
                  howToApply: schemeApply,
                  howToApplyMl: schemeApply,
                },
                editingSchemeId
              );
              flashMessage('പദ്ധതി സേവ് ചെയ്തു!');
              setEditingSchemeId(undefined);
              setSchemeTitle('');
              setSchemeElig('');
              setSchemeDocs('');
              setSchemeApply('');
            }}
            className="space-y-3"
          >
            <input
              type="text"
              required
              value={schemeTitle}
              onChange={(e) => setSchemeTitle(e.target.value)}
              placeholder="പദ്ധതിയുടെ പേര് *"
              className="w-full min-h-[48px] px-4 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base"
            />
            <textarea
              rows={2}
              required
              value={schemeElig}
              onChange={(e) => setSchemeElig(e.target.value)}
              placeholder="ആർക്ക് അപേക്ഷിക്കാം *"
              className="w-full p-3 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base"
            />
            <textarea
              rows={2}
              required
              value={schemeDocs}
              onChange={(e) => setSchemeDocs(e.target.value)}
              placeholder="വേണ്ട രേഖകൾ *"
              className="w-full p-3 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base"
            />
            <textarea
              rows={2}
              required
              value={schemeApply}
              onChange={(e) => setSchemeApply(e.target.value)}
              placeholder="എങ്ങനെ അപേക്ഷിക്കാം *"
              className="w-full p-3 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base"
            />
            <button
              type="submit"
              className="w-full min-h-[50px] py-3 rounded-full bg-[#0E5135] text-white font-bold text-base cursor-pointer"
            >
              സേവ് ചെയ്യുക
            </button>
          </form>

          <div className="space-y-2.5 pt-3 border-t border-[#E6E2D6]">
            {schemes.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#E6E2D6] flex items-center justify-between gap-2"
              >
                <div className="font-bold text-base text-[#141E18] truncate">
                  {s.titleMl || s.title}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSchemeId(s.id);
                      setSchemeTitle(s.titleMl || s.title);
                      setSchemeCategory(s.category);
                      setSchemeElig(s.eligibilityMl || s.eligibility);
                      setSchemeDocs(s.documentsNeededMl || s.documentsNeeded);
                      setSchemeApply(s.howToApplyMl || s.howToApply);
                    }}
                    className="p-2 rounded-full bg-white border border-[#DED9CA] text-[#0E5135] cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteScheme(s.id)}
                    className="p-2 rounded-full bg-red-50 text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeSection === 'directory' && (
        <section className="bg-white rounded-3xl p-5 border-2 border-[#0E5135] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#141E18]">
              {editingDirId ? 'ഡയറക്ടറി തിരുത്തുക' : 'ഡയറക്ടറിയിൽ ചേർക്കുക'}
            </h3>
            <button
              type="button"
              onClick={() => setActiveSection('overview')}
              className="text-sm font-bold text-[#0E5135] underline cursor-pointer"
            >
              അടയ്ക്കുക
            </button>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await saveDirectoryEntry(
                {
                  name: dirName,
                  nameMl: dirName,
                  category: dirCategory,
                  phone: dirPhone,
                  place: dirPlace,
                  placeMl: dirPlace,
                  timings: dirTimings,
                },
                editingDirId
              );
              flashMessage('ഡയറക്ടറി സേവ് ചെയ്തു!');
              setEditingDirId(undefined);
              setDirName('');
              setDirPhone('');
            }}
            className="space-y-3"
          >
            <input
              type="text"
              required
              value={dirName}
              onChange={(e) => setDirName(e.target.value)}
              placeholder="പേര് / സ്ഥാപനം *"
              className="w-full min-h-[48px] px-4 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={dirCategory}
                onChange={(e) =>
                  setDirCategory(e.target.value as DirectoryCategory)
                }
                className="min-h-[48px] px-3 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base font-bold"
              >
                <option value="Doctors">ഡോക്ടർമാർ</option>
                <option value="Shops">കടകൾ</option>
                <option value="Electricians">ഇലക്ട്രീഷ്യൻ</option>
                <option value="Plumbers">പ്ലംബർ</option>
                <option value="Autos">ഓട്ടോ</option>
                <option value="Ration Shop">റേഷൻ കട</option>
                <option value="Anganwadi">അങ്കണവാടി</option>
                <option value="Schools">സ്കൂളുകൾ</option>
              </select>
              <input
                type="tel"
                required
                value={dirPhone}
                onChange={(e) => setDirPhone(e.target.value)}
                placeholder="ഫോൺ നമ്പർ *"
                className="min-h-[48px] px-3 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base tabular-nums"
              />
            </div>
            <input
              type="text"
              value={dirTimings}
              onChange={(e) => setDirTimings(e.target.value)}
              placeholder="സമയം / സ്ഥലം"
              className="w-full min-h-[48px] px-4 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base"
            />
            <button
              type="submit"
              className="w-full min-h-[50px] py-3 rounded-full bg-[#0E5135] text-white font-bold text-base cursor-pointer"
            >
              സേവ് ചെയ്യുക
            </button>
          </form>

          <div className="space-y-2.5 pt-3 border-t border-[#E6E2D6]">
            {directory.map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#E6E2D6] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold text-base text-[#141E18] truncate">
                    {d.nameMl || d.name}
                  </div>
                  <div className="text-xs text-[#637067] tabular-nums">
                    {d.phone}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDirId(d.id);
                      setDirName(d.nameMl || d.name);
                      setDirCategory(d.category);
                      setDirPhone(d.phone);
                      setDirTimings(d.timings);
                    }}
                    className="p-2 rounded-full bg-white border border-[#DED9CA] text-[#0E5135] cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteDirectoryEntry(d.id)}
                    className="p-2 rounded-full bg-red-50 text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeSection === 'ward' && (
        <section className="bg-white rounded-3xl p-5 border-2 border-[#0E5135] space-y-5">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await saveWardInfo({
                ...wardInfo,
                memberName,
                memberNameMl: memberName,
                phone: memberPhone,
                officeHours: memberHours,
                officeHoursMl: memberHours,
              });
              flashMessage('വാർഡ് മെമ്പർ വിവരങ്ങൾ പുതുക്കി!');
            }}
            className="space-y-3"
          >
            <h3 className="text-lg font-bold text-[#141E18]">
              വാർഡ് മെമ്പർ വിവരങ്ങൾ
            </h3>
            <input
              type="text"
              required
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="വാർഡ് മെമ്പറുടെ പേര്"
              className="w-full min-h-[48px] px-4 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base"
            />
            <input
              type="tel"
              required
              value={memberPhone}
              onChange={(e) => setMemberPhone(e.target.value)}
              placeholder="ഫോൺ നമ്പർ"
              className="w-full min-h-[48px] px-4 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base tabular-nums"
            />
            <input
              type="text"
              required
              value={memberHours}
              onChange={(e) => setMemberHours(e.target.value)}
              placeholder="ഓഫീസ് സമയം"
              className="w-full min-h-[48px] px-4 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base"
            />
            <button
              type="submit"
              className="w-full min-h-[50px] py-3 rounded-full bg-[#0E5135] text-white font-bold text-base cursor-pointer"
            >
              സേവ് ചെയ്യുക
            </button>
          </form>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await addAdminByUid(newAdminUid, newAdminEmail, newAdminName);
              flashMessage('പുതിയ അഡ്മിനെ ചേർത്തു!');
              setNewAdminUid('');
              setNewAdminEmail('');
              setNewAdminName('');
            }}
            className="space-y-3 pt-4 border-t border-[#E6E2D6]"
          >
            <h3 className="text-lg font-bold text-[#141E18] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#0E5135]" />
              <span>പുതിയ അഡ്മിനെ ചേർക്കുക</span>
            </h3>
            <input
              type="text"
              required
              value={newAdminUid}
              onChange={(e) => setNewAdminUid(e.target.value)}
              placeholder="Firebase User UID *"
              className="w-full min-h-[48px] px-4 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-sm font-mono"
            />
            <input
              type="email"
              required
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="അഡ്മിൻ ഇമെയിൽ *"
              className="w-full min-h-[48px] px-4 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base"
            />
            <input
              type="text"
              required
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              placeholder="അഡ്മിൻ പേര് *"
              className="w-full min-h-[48px] px-4 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base"
            />
            <button
              type="submit"
              className="w-full min-h-[50px] py-3 rounded-full bg-[#0E5135] text-white font-bold text-base cursor-pointer"
            >
              അഡ്മിനെ ചേർക്കുക
            </button>
          </form>
        </section>
      )}

      {/* COMPLAINTS SECTION ("പരാതികൾ") */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[#141E18]">പരാതികൾ</h2>
          <span className="px-3.5 py-1 rounded-full bg-[#E3EEF8] text-[#1E466E] text-sm font-bold tabular-nums">
            {newComplaintsCount} പുതിയത്
          </span>
        </div>

        <div className="space-y-3">
          {combinedComplaints.map((comp) => {
            const currentStatus =
              statusDrafts[comp.referenceNumber] ?? comp.status;
            const currentRemark =
              remarkDrafts[comp.referenceNumber] ?? comp.adminRemark;
            const badge =
              STATUS_BADGE[comp.status] || STATUS_BADGE.Received;
            const isExpanded = expandedComplaintRef === comp.referenceNumber;

            return (
              <div
                key={comp.referenceNumber}
                className="bg-white rounded-3xl p-5 border border-[#E6E2D6] shadow-2xs space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-bold text-[#141E18] tabular-nums">
                      {comp.referenceNumber}
                    </div>
                    <div className="text-sm sm:text-base text-[#637067] mt-0.5">
                      {COMPLAINT_CATEGORY_ML[comp.category] || comp.category} ·{' '}
                      {comp.date}
                    </div>
                    <div className="mt-2">
                      <span
                        className={`inline-block px-3 py-0.5 rounded-full text-xs sm:text-sm font-bold ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedComplaintRef(
                        isExpanded ? null : comp.referenceNumber
                      )
                    }
                    className="min-h-[44px] px-5 py-2 rounded-full border-2 border-[#0E5135] text-[#0E5135] hover:bg-[#E8F2EC] font-bold text-sm sm:text-base shrink-0 transition-colors cursor-pointer"
                  >
                    പുതുക്കുക
                  </button>
                </div>

                {isExpanded && (
                  <div className="pt-4 border-t border-[#E6E2D6] space-y-3.5">
                    <div className="bg-[#FAF8F2] rounded-2xl p-3.5 space-y-1.5 text-sm">
                      <div>
                        <span className="text-[#637067]">പേര്: </span>
                        <strong className="text-[#141E18]">{comp.name}</strong>
                      </div>
                      <div>
                        <span className="text-[#637067]">ഫോൺ: </span>
                        <a
                          href={`tel:${comp.phone}`}
                          className="font-bold text-[#0E5135] underline tabular-nums"
                        >
                          {comp.phone}
                        </a>
                      </div>
                      <div>
                        <span className="text-[#637067]">വിവരണം: </span>
                        <span className="text-[#141E18]">
                          {comp.description}
                        </span>
                      </div>
                      {typeof comp.latitude === 'number' &&
                        typeof comp.longitude === 'number' && (
                          <div>
                            <a
                              href={`https://www.google.com/maps?q=${comp.latitude},${comp.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0E5135] font-bold underline inline-flex items-center gap-1"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              ലൊക്കേഷൻ മാപ്പിൽ കാണുക
                            </a>
                          </div>
                        )}
                    </div>

                    {comp.photoUrl && (
                      <img
                        src={comp.photoUrl}
                        alt="പരാതി ഫോട്ടോ"
                        className="w-full max-h-48 object-cover rounded-2xl border border-[#E6E2D6]"
                      />
                    )}

                    <div className="space-y-2.5">
                      <select
                        value={currentStatus}
                        onChange={(e) =>
                          setStatusDrafts((prev) => ({
                            ...prev,
                            [comp.referenceNumber]: e.target
                              .value as ComplaintStatus,
                          }))
                        }
                        className="w-full min-h-[48px] px-4 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl font-bold text-base text-[#141E18]"
                      >
                        <option value="Received">ലഭിച്ചു</option>
                        <option value="In Progress">നടപടിയിൽ</option>
                        <option value="Resolved">പരിഹരിച്ചു</option>
                      </select>

                      <input
                        type="text"
                        value={currentRemark}
                        onChange={(e) =>
                          setRemarkDrafts((prev) => ({
                            ...prev,
                            [comp.referenceNumber]: e.target.value,
                          }))
                        }
                        placeholder="വാർഡ് മെമ്പറുടെ കുറിപ്പ് ചേർക്കുക..."
                        className="w-full min-h-[48px] px-4 py-2.5 bg-[#FAF8F2] border border-[#DED9CA] rounded-2xl text-base text-[#141E18]"
                      />

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={async () => {
                            await updateComplaintStatusAndRemark(
                              comp.referenceNumber,
                              currentStatus,
                              currentRemark
                            );
                            setExpandedComplaintRef(null);
                            flashMessage(
                              `${comp.referenceNumber} പുതുക്കി!`
                            );
                          }}
                          className="flex-1 min-h-[48px] py-2.5 px-4 rounded-full bg-[#0E5135] text-white font-bold text-base cursor-pointer"
                        >
                          സേവ് ചെയ്യുക
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            await deleteSpamComplaint(comp.referenceNumber);
                            setExpandedComplaintRef(null);
                            flashMessage(
                              `${comp.referenceNumber} ഒഴിവാക്കി.`
                            );
                          }}
                          className="min-h-[48px] px-4 py-2.5 rounded-full bg-red-50 text-red-700 font-bold text-sm inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>ഒഴിവാക്കുക</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
