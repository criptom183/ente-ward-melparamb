import React, { useState, useEffect } from 'react';
import {
  Camera,
  MapPin,
  Check,
  Share2,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import {
  ComplaintCategory,
  ComplaintPublicStatus,
  Language,
} from '../types/ward';

interface ReportProblemScreenProps {
  lang: Language;
  initialMode?: 'form' | 'status';
  publicStatuses: ComplaintPublicStatus[];
  hasSubmittedToday: () => { limited: boolean; lastRef: string | null };
  resetDailyLimitForTesting: () => void;
  submitComplaint: (input: {
    name: string;
    phone: string;
    category: ComplaintCategory;
    place: string;
    description: string;
    photoUrl?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<string>;
  lookupComplaintStatus: (
    refNumber: string
  ) => Promise<ComplaintPublicStatus | null>;
  onBack: () => void;
}

const PROBLEM_CATEGORIES: {
  value: ComplaintCategory;
  ml: string;
}[] = [
  { value: 'Streetlight', ml: 'തെരുവുവിളക്ക്' },
  { value: 'Road', ml: 'റോഡ്' },
  { value: 'Waste', ml: 'മാലിന്യം' },
  { value: 'Drainage', ml: 'ഓട' },
  { value: 'Water', ml: 'വെള്ളം' },
  { value: 'Other', ml: 'മറ്റുള്ളവ' },
];

const PROBLEM_CATEGORY_ML: Record<ComplaintCategory, string> = {
  Streetlight: 'തെരുവുവിളക്ക്',
  Road: 'റോഡ്',
  Waste: 'മാലിന്യം',
  Drainage: 'ഓട',
  Water: 'വെള്ളം',
  Other: 'മറ്റുള്ളവ',
};

const STATUS_BADGE: Record<
  ComplaintPublicStatus['status'],
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

export const ReportProblemScreen: React.FC<ReportProblemScreenProps> = ({
  initialMode = 'form',
  publicStatuses,
  hasSubmittedToday,
  submitComplaint,
  lookupComplaintStatus,
  onBack,
}) => {
  const [viewMode, setViewMode] = useState<'form' | 'submitted' | 'status'>(
    initialMode
  );

  useEffect(() => {
    setViewMode(initialMode);
  }, [initialMode]);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Streetlight');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Check Status states (start clean without dummy pre-populated result)
  const [refQuery, setRefQuery] = useState('');
  const [lookupResult, setLookupResult] =
    useState<ComplaintPublicStatus | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [notFoundMsg, setNotFoundMsg] = useState<string | null>(null);

  const dailyCheck = hasSubmittedToday();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 640;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.72);
        setPhotoUrl(compressed);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCaptureGps = () => {
    setGpsStatus('ലൊക്കേഷൻ എടുക്കുന്നു...');
    if (!navigator.geolocation) {
      setLatitude(12.4638);
      setLongitude(75.0131);
      setGpsStatus('മേൽപ്പറമ്പ ലൊക്കേഷൻ ചേർത്തു');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        setLatitude(lat);
        setLongitude(lng);
        setGpsStatus(`ലൊക്കേഷൻ ചേർത്തു (${lat}, ${lng})`);
      },
      () => {
        setLatitude(12.4638);
        setLongitude(75.0131);
        setGpsStatus('മേൽപ്പറമ്പ ലൊക്കേഷൻ ചേർത്തു');
      },
      { timeout: 6000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const digitsOnly = phone.replace(/\D/g, '');
    if (!name.trim()) {
      setFormError('ദയവായി നിങ്ങളുടെ പേര് നൽകുക.');
      return;
    }
    if (digitsOnly.length !== 10) {
      setFormError('ദയവായി 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക.');
      return;
    }
    if (!description.trim()) {
      setFormError('പ്രശ്നവും സ്ഥലവും വിവരിക്കുക.');
      return;
    }

    // Extract first phrase or default Melparamba place from description
    const derivedPlace =
      description.trim().split(/[.,\n]/)[0].slice(0, 60) || 'മേൽപ്പറമ്പ';

    setSubmitting(true);
    try {
      const refNum = await submitComplaint({
        name,
        phone: digitsOnly,
        category,
        place: derivedPlace,
        description,
        photoUrl,
        latitude,
        longitude,
      });
      setSubmittedRef(refNum);
      setRefQuery(refNum);
      setViewMode('submitted');
      setName('');
      setPhone('');
      setDescription('');
      setPhotoUrl(undefined);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'പരാതി സമർപ്പിക്കാൻ സാധിച്ചില്ല.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = async (e?: React.FormEvent, customRef?: string) => {
    if (e) e.preventDefault();
    const targetRef = (customRef ?? refQuery).trim().toUpperCase();
    if (!targetRef) return;
    setLookupLoading(true);
    setNotFoundMsg(null);
    try {
      const res = await lookupComplaintStatus(targetRef);
      setLookupResult(res);
      if (!res) {
        setNotFoundMsg(`"${targetRef}" എന്ന നമ്പറിൽ പരാതി കണ്ടെത്തിയില്ല.`);
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const handleShareReference = (refNum: string) => {
    const text = `വാർഡ് 19 മേൽപ്പറമ്പ — എന്റെ പരാതി റഫറൻസ് നമ്പർ: ${refNum}`;
    if (navigator.share) {
      navigator.share({ title: refNum, text }).catch(() => {});
    }
    navigator.clipboard?.writeText(refNum);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };


  // SCREEN 5: COMPLAINT SUBMITTED ("പരാതി ലഭിച്ചു")
  if (viewMode === 'submitted' && submittedRef) {
    return (
      <div className="space-y-6">
        {/* Top Header */}
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
            പരാതി ലഭിച്ചു
          </h1>
        </div>

        <div className="pt-4 space-y-6 text-center">
          {/* Large Checkmark Circle */}
          <div className="w-28 h-28 rounded-full bg-[#E8F2EC] border-8 border-[#EFECE4] text-[#0E5135] flex items-center justify-center mx-auto">
            <Check className="w-12 h-12 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#141E18] leading-snug">
              നന്ദി. നിങ്ങളുടെ പരാതി ലഭിച്ചു.
            </h2>
            <p className="text-base text-[#4A554E]">
              നിങ്ങളുടെ പരാതി വാർഡ് മെമ്പറിന് forward ചെയ്യുന്നതാണ്.
            </p>
          </div>

          {/* Dashed Reference Number Box */}
          <div className="bg-white border-2 border-dashed border-[#0E5135] rounded-3xl p-6 space-y-1.5">
            <div className="text-sm sm:text-base text-[#4A554E]">
              നിങ്ങളുടെ റഫറൻസ് നമ്പർ
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0E5135] tracking-tight tabular-nums">
              {submittedRef}
            </div>
          </div>

          <p className="text-sm sm:text-base text-[#4A554E] leading-relaxed px-2">
            ഈ നമ്പർ സൂക്ഷിക്കുക. പരാതിയുടെ സ്ഥിതി അറിയാൻ ഇത് ഉപയോഗിക്കാം.
          </p>

          <div className="space-y-3.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setRefQuery(submittedRef);
                setViewMode('status');
                handleCheckStatus(undefined, submittedRef);
              }}
              className="w-full min-h-[56px] py-4 px-6 rounded-full bg-[#0E5135] hover:bg-[#0A3E28] text-white font-bold text-lg transition-colors cursor-pointer"
            >
              സ്ഥിതി അറിയുക
            </button>

            <button
              type="button"
              onClick={() => handleShareReference(submittedRef)}
              className="w-full min-h-[54px] py-3.5 px-6 rounded-full bg-white border-2 border-[#0E5135] text-[#0E5135] hover:bg-[#E8F2EC] font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-5 h-5 shrink-0" />
              <span>നമ്പർ എനിക്ക് അയയ്ക്കുക</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onBack}
              className="text-[#0E5135] font-bold text-base sm:text-lg underline underline-offset-4 cursor-pointer"
            >
              ഹോമിലേക്ക് മടങ്ങുക
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 6: CHECK STATUS & RECENTLY RESOLVED ("പരാതിയുടെ സ്ഥിതി")
  if (viewMode === 'status') {
    const activeBadge = lookupResult
      ? STATUS_BADGE[lookupResult.status]
      : STATUS_BADGE.Received;

    const isReceivedDone = Boolean(lookupResult);
    const isInProgressActive = lookupResult?.status === 'In Progress';
    const isInProgressDone = lookupResult?.status === 'Resolved';
    const isResolvedDone = lookupResult?.status === 'Resolved';

    return (
      <div className="space-y-6">
        {/* Top Header */}
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
            പരാതിയുടെ സ്ഥിതി
          </h1>
        </div>

        {/* Reference Number Input Row */}
        <form onSubmit={(e) => handleCheckStatus(e)} className="space-y-2">
          <label className="block text-base font-bold text-[#141E18]">
            റഫറൻസ് നമ്പർ
          </label>
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              value={refQuery}
              onChange={(e) => setRefQuery(e.target.value.toUpperCase())}
              placeholder="W19-2026-0001"
              className="flex-1 min-w-0 min-h-[54px] px-4 py-3 bg-white border border-[#DED9CA] rounded-2xl text-base sm:text-lg font-medium text-[#141E18] uppercase focus:outline-none focus:border-[#0E5135]"
            />
            <button
              type="submit"
              disabled={lookupLoading}
              className="min-h-[54px] px-6 sm:px-7 py-3 rounded-full bg-[#0E5135] hover:bg-[#0A3E28] text-white font-bold text-base sm:text-lg shrink-0 transition-colors cursor-pointer"
            >
              നോക്കുക
            </button>
          </div>
        </form>

        {notFoundMsg && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-950 font-semibold text-base">
            {notFoundMsg}
          </div>
        )}

        {/* Status Card with 3-Step Vertical Stepper */}
        {lookupResult && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E2D6] shadow-2xs space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#141E18]">
                  {PROBLEM_CATEGORY_ML[lookupResult.category] ||
                    lookupResult.category}
                </h2>
                <p className="text-sm sm:text-base text-[#637067] mt-0.5 tabular-nums">
                  സമർപ്പിച്ചത്: {lookupResult.date}
                </p>
              </div>

              <span
                className={`px-3.5 py-1 rounded-full text-sm font-bold shrink-0 ${activeBadge.bg} ${activeBadge.text}`}
              >
                {activeBadge.label}
              </span>
            </div>

            {/* Vertical 3-Step Timeline */}
            <div className="pl-1 space-y-0">
              {/* Step 1: ലഭിച്ചു */}
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isReceivedDone
                      ? 'bg-[#0E5135] text-white'
                      : 'border-2 border-[#DED9CA] bg-white'
                  }`}
                >
                  {isReceivedDone && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
                <span className="text-base sm:text-lg font-bold text-[#141E18]">
                  ലഭിച്ചു
                </span>
              </div>

              <div className="w-0.5 h-5 bg-[#0E5135] ml-4" />

              {/* Step 2: നടപടിയിൽ */}
              <div className="flex items-center gap-3.5">
                {isInProgressDone ? (
                  <div className="w-8 h-8 rounded-full bg-[#0E5135] text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : isInProgressActive ? (
                  <div className="w-8 h-8 rounded-full bg-[#D6A13C] border-2 border-[#7A5413] shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-[#DED9CA] bg-white shrink-0" />
                )}
                <span
                  className={`text-base sm:text-lg ${
                    isInProgressActive || isInProgressDone
                      ? 'font-bold text-[#141E18]'
                      : 'font-medium text-[#637067]'
                  }`}
                >
                  നടപടിയിൽ
                </span>
              </div>

              <div className="w-0.5 h-5 bg-[#DED9CA] ml-4" />

              {/* Step 3: പരിഹരിച്ചു */}
              <div className="flex items-center gap-3.5">
                {isResolvedDone ? (
                  <div className="w-8 h-8 rounded-full bg-[#0E5135] text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-[#DED9CA] bg-white shrink-0" />
                )}
                <span
                  className={`text-base sm:text-lg ${
                    isResolvedDone
                      ? 'font-bold text-[#141E18]'
                      : 'font-medium text-[#637067]'
                  }`}
                >
                  പരിഹരിച്ചു
                </span>
              </div>
            </div>

            {/* Ward Member's Note Box (shown when admin adds a remark) */}
            {lookupResult.adminRemark && (
              <div className="bg-[#F6F4EC] rounded-2xl p-4 space-y-1">
                <div className="text-sm font-bold text-[#4A554E]">
                  വാർഡ് മെമ്പറുടെ കുറിപ്പ്
                </div>
                <p className="text-base text-[#141E18] leading-relaxed break-words">
                  {lookupResult.adminRemark}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // SCREEN 4: REPORT A PROBLEM FORM ("പരാതി അറിയിക്കുക")
  return (
    <div className="space-y-5">
      {/* Top Header with Circular Back Button */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="മടങ്ങുക"
          className="w-12 h-12 rounded-full bg-white border border-[#E6E2D6] flex items-center justify-center text-[#141E18] hover:bg-[#F3F0E6] transition-colors shrink-0 cursor-pointer shadow-2xs"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#141E18] break-words">
          പരാതി അറിയിക്കുക
        </h1>
      </div>

      <p className="text-base text-[#4A554E] leading-relaxed">
        എന്താണ് പ്രശ്നം എന്ന് അറിയിക്കുക. ലോഗിൻ ആവശ്യമില്ല.
      </p>

      {dailyCheck.limited && (
        <div className="bg-[#F7EFE0] border border-[#D6A13C] rounded-2xl p-4 text-sm sm:text-base text-[#7A5413] flex items-center justify-between gap-3">
          <span>ഇന്നത്തെ റഫറൻസ് നമ്പർ: {dailyCheck.lastRef}</span>
          <button
            type="button"
            onClick={() => {
              if (dailyCheck.lastRef) setRefQuery(dailyCheck.lastRef);
              setViewMode('status');
            }}
            className="font-bold underline shrink-0 cursor-pointer"
          >
            സ്ഥിതി അറിയുക
          </button>
        </div>
      )}

      {formError && (
        <div className="bg-red-50 border border-red-300 rounded-2xl p-4 flex items-start gap-3 text-red-900">
          <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          <p className="text-base font-medium">{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Resident Name */}
        <div className="space-y-2">
          <label className="block text-base font-bold text-[#141E18]">
            നിങ്ങളുടെ പേര്
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="പേര്"
            className="w-full min-h-[54px] px-4 py-3.5 bg-white border border-[#DED9CA] rounded-2xl text-base text-[#141E18] placeholder:text-[#637067] focus:outline-none focus:border-[#0E5135]"
          />
        </div>

        {/* 10-Digit Phone */}
        <div className="space-y-2">
          <label className="block text-base font-bold text-[#141E18]">
            ഫോൺ നമ്പർ (10 അക്കം)
          </label>
          <input
            type="tel"
            required
            maxLength={10}
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
            }
            placeholder="10 അക്ക മൊബൈൽ നമ്പർ"
            className="w-full min-h-[54px] px-4 py-3.5 bg-white border border-[#DED9CA] rounded-2xl text-base text-[#141E18] placeholder:text-[#637067] tabular-nums focus:outline-none focus:border-[#0E5135]"
          />
        </div>

        {/* Category Pills */}
        <div className="space-y-2.5">
          <label className="block text-base font-bold text-[#141E18]">
            വിഭാഗം
          </label>
          <div className="flex flex-wrap gap-2.5">
            {PROBLEM_CATEGORIES.map((cat) => {
              const active = category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`min-h-[46px] px-5 py-2.5 rounded-full text-base font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0E5135] text-white'
                      : 'bg-white border border-[#DED9CA] text-[#141E18] hover:bg-[#F3F0E6]'
                  }`}
                >
                  {cat.ml}
                </button>
              );
            })}
          </div>
        </div>

        {/* Problem & Place Description */}
        <div className="space-y-2">
          <label className="block text-base font-bold text-[#141E18]">
            പ്രശ്നം എന്താണ്?
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="പ്രശ്നവും സ്ഥലവും വിവരിക്കുക"
            className="w-full p-4 bg-white border border-[#DED9CA] rounded-2xl text-base text-[#141E18] placeholder:text-[#637067] focus:outline-none focus:border-[#0E5135]"
          />
        </div>

        {/* Optional Photo & Location Pill Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <label className="min-h-[52px] px-4 py-3 rounded-full bg-white border-2 border-[#0E5135] text-[#0E5135] hover:bg-[#E8F2EC] font-bold text-base flex items-center justify-center gap-2 cursor-pointer transition-colors">
            <Camera className="w-5 h-5 shrink-0" />
            <span>ഫോട്ടോ</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleCaptureGps}
            className="min-h-[52px] px-4 py-3 rounded-full bg-white border-2 border-[#0E5135] text-[#0E5135] hover:bg-[#E8F2EC] font-bold text-base flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <MapPin className="w-5 h-5 shrink-0" />
            <span>ലൊക്കേഷൻ</span>
          </button>
        </div>

        {(photoUrl || gpsStatus) && (
          <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-[#0E5135]">
            {photoUrl && <span>✓ ഫോട്ടോ ചേർത്തു</span>}
            {gpsStatus && <span>✓ {gpsStatus}</span>}
          </div>
        )}

        {/* Submit Pill Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[58px] py-4 px-6 rounded-full bg-[#0E5135] hover:bg-[#0A3E28] disabled:opacity-60 text-white font-bold text-lg transition-colors cursor-pointer"
        >
          {submitting ? 'സമർപ്പിക്കുന്നു...' : 'പരാതി സമർപ്പിക്കുക'}
        </button>

        <p className="text-center text-sm text-[#637067]">
          ഒരു ഫോണിൽ നിന്ന് ദിവസം 1 പരാതി വരെ.
        </p>
      </form>
    </div>
  );
};
