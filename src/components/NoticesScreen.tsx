import React, { useState } from 'react';
import { ChevronLeft, Share2, Megaphone, Phone, ExternalLink, Download, Clock, AlertCircle } from 'lucide-react';
import { Language, Notice, NoticeCategory } from '../types/ward';
import { getDriveDownloadUrl } from '../utils/driveLinks';
import { getDaysRemaining } from '../utils/formatters';

interface NoticesScreenProps {
  lang: Language;
  notices: Notice[];
  isLoading: boolean;
  onBack: () => void;
}

const CATEGORIES: { value: 'All' | NoticeCategory; ml: string }[] = [
  { value: 'All', ml: 'എല്ലാം' },
  { value: 'Meeting', ml: 'യോഗം' },
  { value: 'Camp', ml: 'ക്യാമ്പ്' },
  { value: 'Water/Power', ml: 'വെള്ളം / വൈദ്യുതി' },
  { value: 'General', ml: 'പൊതുവായത്' },
  { value: 'Job', ml: 'തൊഴിൽ / പരിശീലനം' },
];

const CATEGORY_BADGE_STYLE: Record<
  NoticeCategory,
  { label: string; bg: string; text: string }
> = {
  Meeting: {
    label: 'യോഗം',
    bg: 'bg-[#E3EEF8]',
    text: 'text-[#1E466E]',
  },
  Camp: {
    label: 'ക്യാമ്പ്',
    bg: 'bg-[#E5F3EB]',
    text: 'text-[#0E5135]',
  },
  'Water/Power': {
    label: 'വെള്ളം / വൈദ്യുതി',
    bg: 'bg-[#F7EFE0]',
    text: 'text-[#7A5413]',
  },
  General: {
    label: 'പൊതുവായത്',
    bg: 'bg-[#EEF1EE]',
    text: 'text-[#37473E]',
  },
  Job: {
    label: 'തൊഴിൽ / പരിശീലനം',
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#92400E]',
  },
};

export const NoticesScreen: React.FC<NoticesScreenProps> = ({
  notices,
  isLoading,
  onBack,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | NoticeCategory>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter notices
  const filteredNotices = notices.filter((notice) =>
    selectedCategory === 'All' ? true : notice.category === selectedCategory
  );

  // Sort notices: Active ones first, expired notices moved to bottom
  const sortedNotices = [...filteredNotices].sort((a, b) => {
    const isAExpired = a.lastDate ? getDaysRemaining(a.lastDate) < 0 : false;
    const isBExpired = b.lastDate ? getDaysRemaining(b.lastDate) < 0 : false;
    if (isAExpired && !isBExpired) return 1;
    if (!isAExpired && isBExpired) return -1;
    return 0;
  });

  const handleShareWhatsApp = (notice: Notice) => {
    const title = notice.titleMl || notice.title;
    const desc = notice.descriptionMl || notice.description;
    const extra = notice.lastDate ? `\nഅവസാന തീയതി: ${notice.lastDate}` : '';
    const message = `*വാർഡ് 19 മേൽപ്പറമ്പ — അറിയിപ്പ്*\n*${title}*\nതീയതി: ${notice.date}${extra}\n\n${desc}`;

    if (navigator.share) {
      navigator
        .share({
          title,
          text: message,
        })
        .catch(() => {});
    }
    navigator.clipboard?.writeText(message);
    setCopiedId(notice.id);
    setTimeout(() => setCopiedId(null), 3500);
  };

  return (
    <div className="space-y-6">
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
          അറിയിപ്പുകൾ
        </h1>
      </div>

      {/* Category Filter Pills */}
      <div
        role="tablist"
        aria-label="അറിയിപ്പ് വിഭാഗങ്ങൾ"
        className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1"
      >
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={`min-h-[46px] px-5 py-2.5 rounded-full text-base font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
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

      {/* Notices List */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#E6E2D6]">
          <p className="text-lg font-bold text-[#0E5135]">
            അറിയിപ്പുകൾ ലോഡ് ചെയ്യുന്നു...
          </p>
        </div>
      ) : sortedNotices.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#E6E2D6] space-y-2">
          <Megaphone className="w-12 h-12 text-[#0E5135] mx-auto mb-3 opacity-80" />
          <h2 className="text-xl font-bold text-[#141E18]">
            {selectedCategory === 'Job'
              ? 'തൊഴിൽ / പരിശീലന അറിയിപ്പുകൾ നിലവിലില്ല'
              : 'ഈ വിഭാഗത്തിൽ പുതിയ അറിയിപ്പുകൾ ഇല്ല'}
          </h2>
          <p className="text-sm text-[#637067] max-w-md mx-auto">
            {selectedCategory === 'Job'
              ? 'തൊഴിലുറപ്പ്, നൈപുണ്യ പരിശീലനം, പ്രാദേശിക തൊഴിൽ ഒഴിവുകൾ എന്നിവ സംബന്ധിച്ച ഔദ്യോഗിക അറിയിപ്പുകൾ പഞ്ചായത്ത് ലഭ്യമാക്കുമ്പോൾ ഇവിടെ പ്രസിദ്ധീകരിക്കുന്നതാണ്.'
              : 'പുതിയ അറിയിപ്പുകൾ പഞ്ചായത്ത് പുറത്തിറക്കുമ്പോൾ ഇവിടെ ലഭ്യമാകും.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedNotices.map((notice) => {
            const primaryTitle = notice.titleMl || notice.title;
            const primaryDesc = notice.descriptionMl || notice.description;
            const badge =
              CATEGORY_BADGE_STYLE[notice.category] ||
              CATEGORY_BADGE_STYLE.General;

            const daysLeft = notice.lastDate ? getDaysRemaining(notice.lastDate) : null;
            const isExpired = daysLeft !== null && daysLeft < 0;
            const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;

            return (
              <article
                key={notice.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all ${
                  isExpired
                    ? 'border-[#E2DFD8] bg-[#F9F8F6] opacity-75'
                    : 'border-[#E6E2D6] shadow-2xs'
                } space-y-3.5`}
              >
                {/* Category & Status Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-block px-3.5 py-1 rounded-full text-sm font-bold ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>

                  {notice.jobType && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#E8F2EC] text-[#0E5135]">
                      {notice.jobType}
                    </span>
                  )}

                  {isExpiringSoon && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>ഉടൻ അവസാനിക്കും ({daysLeft === 0 ? 'ഇന്ന്' : `${daysLeft} ദിവസം ബാക്കി`})</span>
                    </span>
                  )}

                  {isExpired && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-stone-200 text-stone-700">
                      അവസാനിച്ചു
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className={`text-xl font-bold leading-snug break-words ${isExpired ? 'text-[#5A635E]' : 'text-[#141E18]'}`}>
                  {primaryTitle}
                </h2>

                {/* Description */}
                <p className="text-base text-[#4A554E] leading-relaxed whitespace-pre-line break-words">
                  {primaryDesc}
                </p>

                {/* Extra Job/Training Details Box */}
                {(notice.eligibility || notice.lastDate || notice.howToApply) && (
                  <div className="bg-[#FAF8F2] rounded-2xl p-4 border border-[#EAE6DA] space-y-2 text-sm sm:text-base">
                    {notice.eligibility && (
                      <div>
                        <span className="font-bold text-[#7A5413]">യോഗ്യത: </span>
                        <span className="text-[#141E18]">{notice.eligibility}</span>
                      </div>
                    )}
                    {notice.howToApply && (
                      <div>
                        <span className="font-bold text-[#7A5413]">അപേക്ഷിക്കേണ്ട വിധം: </span>
                        <span className="text-[#141E18]">{notice.howToApply}</span>
                      </div>
                    )}
                    {notice.lastDate && (
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold">
                        <Clock className="w-4 h-4 text-[#7A5413] shrink-0" />
                        <span className="text-[#7A5413]">അവസാന തീയതി:</span>
                        <span className={`font-bold ${isExpiringSoon ? 'text-red-700' : 'text-[#141E18]'}`}>
                          {notice.lastDate}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons: Call Phone & Drive Link (if provided) */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {notice.contactPhone && (
                    <a
                      href={`tel:${notice.contactPhone}`}
                      className="min-h-[42px] px-4 py-2 rounded-full bg-[#0E5135] text-white font-bold text-sm sm:text-base inline-flex items-center gap-2 hover:bg-[#146643] transition-colors"
                    >
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>വിളിക്കുക · {notice.contactPhone}</span>
                    </a>
                  )}

                  {notice.driveUrl && (
                    <>
                      <a
                        href={notice.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[42px] px-4 py-2 rounded-full border border-[#0E5135] text-[#0E5135] hover:bg-[#E8F2EC] font-bold text-sm sm:text-base inline-flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 shrink-0" />
                        <span>കാണുക</span>
                      </a>
                      <a
                        href={getDriveDownloadUrl(notice.driveUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[42px] px-4 py-2 rounded-full border border-[#D6A13C] text-[#7A5413] hover:bg-[#FDF9EE] font-bold text-sm sm:text-base inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-4 h-4 shrink-0" />
                        <span>ഡൗൺലോഡ്</span>
                      </a>
                    </>
                  )}
                </div>

                {/* Bottom Date & Outlined Share Pill Button */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0ECE1]">
                  <span className="text-sm sm:text-base text-[#637067] tabular-nums">
                    {notice.date}
                  </span>

                  <div className="flex items-center gap-2">
                    {copiedId === notice.id && (
                      <span className="text-xs font-bold text-[#0E5135]">
                        പകർത്തി!
                      </span>
                    )}
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `*വാർഡ് 19 മേൽപ്പറമ്പ അറിയിപ്പ്*\n*${primaryTitle}*\nതീയതി: ${notice.date}\n\n${primaryDesc}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleShareWhatsApp(notice)}
                      className="min-h-[42px] px-5 py-2 rounded-full border-2 border-[#0E5135] text-[#0E5135] hover:bg-[#E8F2EC] font-bold text-sm sm:text-base inline-flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 shrink-0" />
                      <span>പങ്കിടുക</span>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
