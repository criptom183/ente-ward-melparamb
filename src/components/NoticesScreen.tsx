import React, { useState } from 'react';
import { ChevronLeft, Share2, Megaphone } from 'lucide-react';
import { Language, Notice, NoticeCategory } from '../types/ward';

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
};

export const NoticesScreen: React.FC<NoticesScreenProps> = ({
  notices,
  isLoading,
  onBack,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    'All' | NoticeCategory
  >('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredNotices = notices.filter((notice) =>
    selectedCategory === 'All' ? true : notice.category === selectedCategory
  );

  const handleShareWhatsApp = (notice: Notice) => {
    const title = notice.titleMl || notice.title;
    const desc = notice.descriptionMl || notice.description;
    const message = `*വാർഡ് 19 മേൽപ്പറമ്പ — അറിയിപ്പ്*\n*${title}*\nതീയതി: ${notice.date}\n\n${desc}`;

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
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#E6E2D6]">
          <Megaphone className="w-12 h-12 text-[#0E5135] mx-auto mb-3 opacity-80" />
          <h2 className="text-xl font-bold text-[#141E18]">
            ഈ വിഭാഗത്തിൽ അറിയിപ്പുകൾ ഇല്ല
          </h2>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice) => {
            const primaryTitle = notice.titleMl || notice.title;
            const primaryDesc = notice.descriptionMl || notice.description;
            const badge =
              CATEGORY_BADGE_STYLE[notice.category] ||
              CATEGORY_BADGE_STYLE.General;

            return (
              <article
                key={notice.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E2D6] shadow-2xs space-y-3"
              >
                {/* Category Pill */}
                <div>
                  <span
                    className={`inline-block px-3.5 py-1 rounded-full text-sm font-bold ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-[#141E18] leading-snug break-words">
                  {primaryTitle}
                </h2>

                {/* Description */}
                <p className="text-base text-[#4A554E] leading-relaxed whitespace-pre-line break-words">
                  {primaryDesc}
                </p>

                {/* Bottom Date & Outlined Share Pill Button */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
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
                      className="min-h-[42px] px-5 py-2 rounded-full border-2 border-[#0E5135] text-[#0E5135] hover:bg-[#E8F2EC] font-bold text-sm sm:text-base inline-flex items-center gap-2 transition-colors"
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
