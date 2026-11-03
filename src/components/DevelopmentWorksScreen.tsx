import React, { useState } from 'react';
import {
  ChevronLeft,
  Briefcase,
  Share2,
  Calendar,
  CheckCircle,
  Clock,
  IndianRupee,
  Activity,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { Language, DevelopmentWork, WorkStatus } from '../types/ward';
import { formatRupeesLakhs } from '../utils/formatters';

interface DevelopmentWorksScreenProps {
  lang: Language;
  works: DevelopmentWork[];
  onBack: () => void;
}

const STATUS_FILTERS: { value: 'All' | WorkStatus; label: string }[] = [
  { value: 'All', label: 'എല്ലാം' },
  { value: 'പുരോഗമിക്കുന്നു', label: 'പുരോഗമിക്കുന്നു' },
  { value: 'ആരംഭിച്ചു', label: 'ആരംഭിച്ചു' },
  { value: 'പൂർത്തിയായി', label: 'പൂർത്തിയായി' },
  { value: 'ടെൻഡർ ഘട്ടത്തിൽ', label: 'ടെൻഡർ ഘട്ടത്തിൽ' },
];

const STATUS_BADGE_STYLE: Record<
  WorkStatus,
  { bg: string; text: string; dot: string }
> = {
  'ടെൻഡർ ഘട്ടത്തിൽ': {
    bg: 'bg-stone-100',
    text: 'text-stone-800',
    dot: 'bg-stone-500',
  },
  ആരംഭിച്ചു: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  പുരോഗമിക്കുന്നു: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    dot: 'bg-blue-600',
  },
  പൂർത്തിയായി: {
    bg: 'bg-[#E5F3EB]',
    text: 'text-[#0E5135]',
    dot: 'bg-[#0E5135]',
  },
};

export const DevelopmentWorksScreen: React.FC<DevelopmentWorksScreenProps> = ({
  works,
  onBack,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<'All' | WorkStatus>('All');
  const [expandedWorkId, setExpandedWorkId] = useState<string | null>(works[0]?.id ?? null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Summary Metrics
  const totalWorks = works.length;
  const ongoingWorks = works.filter(
    (w) => w.status === 'പുരോഗമിക്കുന്നു' || w.status === 'ആരംഭിച്ചു'
  ).length;
  const completedWorks = works.filter((w) => w.status === 'പൂർത്തിയായി').length;
  const totalSanctioned = works.reduce((sum, w) => sum + (w.sanctionedAmount || 0), 0);

  // Filtered List
  const filteredWorks = works.filter((w) =>
    selectedStatus === 'All' ? true : w.status === selectedStatus
  );

  const handleShareWork = (work: DevelopmentWork) => {
    const text = `*വാർഡ് 19 വികസന പ്രവർത്തനം: ${work.title}*\nസ്ഥിതി: ${work.status} (${work.progressPercent}% പുരോഗതി)\nഅനുവദിച്ച തുക: ${formatRupeesLakhs(work.sanctionedAmount)}\nഫണ്ട്: ${work.fundSource}\n\n${work.description}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setCopiedId(work.id);
    setTimeout(() => setCopiedId(null), 3500);
  };

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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#141E18] break-words">
            വികസന പ്രവർത്തനങ്ങൾ
          </h1>
          <p className="text-sm font-semibold text-[#637067]">
            വാർഡ് 19 പദ്ധതികളും പുരോഗതിയും
          </p>
        </div>
      </div>

      {/* Top Summary Metrics Strip */}
      <section className="bg-white rounded-3xl p-5 border border-[#E6E2D6] shadow-2xs space-y-3">
        <div className="text-xs font-bold text-[#7A5413] uppercase tracking-wider">
          പദ്ധതി സംഗ്രഹം
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-[#FAF8F2] p-3 rounded-2xl border border-[#EAE6DA]">
            <div className="text-2xl font-black text-[#141E18]">{totalWorks}</div>
            <div className="text-xs font-semibold text-[#637067] mt-0.5">ആകെ പ്രവൃത്തികൾ</div>
          </div>
          <div className="bg-[#FAF8F2] p-3 rounded-2xl border border-[#EAE6DA]">
            <div className="text-2xl font-black text-blue-700">{ongoingWorks}</div>
            <div className="text-xs font-semibold text-[#637067] mt-0.5">പുരോഗമിക്കുന്നവ</div>
          </div>
          <div className="bg-[#FAF8F2] p-3 rounded-2xl border border-[#EAE6DA]">
            <div className="text-2xl font-black text-[#0E5135]">{completedWorks}</div>
            <div className="text-xs font-semibold text-[#637067] mt-0.5">പൂർത്തിയായവ</div>
          </div>
          <div className="bg-[#FAF8F2] p-3 rounded-2xl border border-[#EAE6DA]">
            <div className="text-xl sm:text-2xl font-black text-[#7A5413] truncate">
              {formatRupeesLakhs(totalSanctioned)}
            </div>
            <div className="text-xs font-semibold text-[#637067] mt-0.5">ആകെ തുക</div>
          </div>
        </div>
      </section>

      {/* Filter Chips by Status */}
      <div
        role="tablist"
        aria-label="വികസന പ്രവർത്തന വിഭാഗങ്ങൾ"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
      >
        {STATUS_FILTERS.map((filter) => {
          const active = selectedStatus === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setSelectedStatus(filter.value)}
              className={`min-h-[44px] px-4 py-2 rounded-full text-sm sm:text-base font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                active
                  ? 'bg-[#0E5135] text-white'
                  : 'bg-white border border-[#DED9CA] text-[#141E18] hover:bg-[#F3F0E6]'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Works List */}
      {filteredWorks.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#E6E2D6] space-y-2">
          <Briefcase className="w-12 h-12 text-[#0E5135] mx-auto mb-3 opacity-70" />
          <h2 className="text-xl font-bold text-[#141E18]">
            {selectedStatus === 'All'
              ? 'വികസന പദ്ധതി വിവരങ്ങൾ ഉടൻ ലഭ്യമാക്കും'
              : 'ഈ വിഭാഗത്തിൽ പ്രവൃത്തികൾ കണ്ടെത്തിയില്ല'}
          </h2>
          <p className="text-sm text-[#637067] max-w-md mx-auto">
            വാർഡ് 19-ലെ റോഡുകൾ, കുടിവെള്ള പദ്ധതികൾ, തെരുവ് വിളക്കുകൾ എന്നിവയുടെ കൃത്യമായ ഭരണാനുമതി ലഭിച്ച പദ്ധതികളും പുരോഗതിയും പഞ്ചായത്ത് അംഗീകരിക്കുന്ന മുറയ്ക്ക് ഇവിടെ പ്രസിദ്ധീകരിക്കുന്നതാണ്.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorks.map((work) => {
            const isExpanded = expandedWorkId === work.id;
            const badge = STATUS_BADGE_STYLE[work.status] || STATUS_BADGE_STYLE['പുരോഗമിക്കുന്നു'];

            return (
              <article
                key={work.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E2D6] shadow-2xs space-y-4"
              >
                {/* Header: Category, Status Badge & Title */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-[#E8F2EC] text-[#0E5135]">
                      {work.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                      <span>{work.status}</span>
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-[#141E18] leading-snug break-words">
                    {work.title}
                  </h2>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#637067]">പദ്ധതി പുരോഗതി</span>
                    <span className="text-[#0E5135]">{work.progressPercent}%</span>
                  </div>
                  <div className="w-full h-3 bg-[#EAE6DA] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0E5135] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, work.progressPercent))}%` }}
                    />
                  </div>
                </div>

                {/* Financials & Fund Source Grid */}
                <div className="grid grid-cols-2 gap-3 bg-[#FAF8F2] p-4 rounded-2xl border border-[#EAE6DA] text-sm sm:text-base">
                  <div>
                    <div className="text-xs font-bold text-[#7A5413]">അനുവദിച്ച തുക</div>
                    <div className="font-extrabold text-[#141E18] text-base sm:text-lg">
                      {formatRupeesLakhs(work.sanctionedAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#7A5413]">ചെലവഴിച്ചത്</div>
                    <div className="font-extrabold text-[#0E5135] text-base sm:text-lg">
                      {formatRupeesLakhs(work.spentAmount)}
                    </div>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-[#EAE6DA]/80">
                    <span className="text-xs font-bold text-[#7A5413]">ഫണ്ട് ഉറവിടം: </span>
                    <span className="text-xs sm:text-sm font-semibold text-[#141E18]">{work.fundSource}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-base text-[#4A554E] leading-relaxed break-words">
                  {work.description}
                </p>

                {/* Timeline & Updates */}
                {work.updates && work.updates.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#F0ECE1]">
                    <div className="text-xs font-bold text-[#7A5413] uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>പുരോഗതി നാൾവഴി</span>
                    </div>
                    <div className="space-y-2 pl-2 border-l-2 border-[#0E5135]">
                      {work.updates.map((upd, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-bold text-[#0E5135] text-xs">
                            {upd.date} —{' '}
                          </span>
                          <span className="text-[#141E18]">{upd.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo Gallery if Available */}
                {work.photoUrls && work.photoUrls.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold text-[#7A5413] flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" />
                      <span>സൈറ്റ് ചിത്രങ്ങൾ</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {work.photoUrls.map((photo, i) => (
                        <img
                          key={i}
                          src={photo}
                          alt={`${work.title} ചിത്രം ${i + 1}`}
                          className="w-32 h-24 object-cover rounded-xl border border-[#DED9CA] shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Action Strip: WhatsApp Share */}
                <div className="flex items-center justify-between pt-2 border-t border-[#F0ECE1]">
                  <div className="text-xs text-[#637067] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>പൂർത്തിയാകേണ്ട തീയതി: {work.expectedEndDate}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleShareWork(work)}
                    className="min-h-[42px] px-4 py-2 rounded-full border-2 border-[#0E5135] text-[#0E5135] hover:bg-[#E8F2EC] font-bold text-sm inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 shrink-0" />
                    <span>{copiedId === work.id ? 'പകർത്തി!' : 'പങ്കിടുക'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
