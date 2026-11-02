import React, { useState } from 'react';
import { ChevronLeft, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { Language, Scheme } from '../types/ward';

interface SchemesScreenProps {
  lang: Language;
  schemes: Scheme[];
  onBack: () => void;
}

export const SchemesScreen: React.FC<SchemesScreenProps> = ({
  schemes,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(
    schemes[0]?.id ?? null
  );

  const filteredSchemes = schemes.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.titleMl.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.eligibilityMl.toLowerCase().includes(q) ||
      s.documentsNeededMl.toLowerCase().includes(q)
    );
  });

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
          പദ്ധതികൾ
        </h1>
      </div>

      {/* Rounded Pill Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-[#637067] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="പദ്ധതികൾ തിരയുക"
          className="w-full min-h-[54px] pl-12 pr-5 py-3 bg-white border border-[#DED9CA] rounded-full text-base text-[#141E18] placeholder:text-[#637067] focus:outline-none focus:border-[#0E5135]"
        />
      </div>

      {/* Expandable Accordion Scheme Cards */}
      {filteredSchemes.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#E6E2D6]">
          <p className="text-lg font-bold text-[#141E18]">
            തിരച്ചിലിന് അനുയോജ്യമായ പദ്ധതികൾ കണ്ടെത്തിയില്ല
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredSchemes.map((scheme) => {
            const primaryTitle = scheme.titleMl || scheme.title;
            const elig = scheme.eligibilityMl || scheme.eligibility;
            const docs = scheme.documentsNeededMl || scheme.documentsNeeded;
            const apply = scheme.howToApplyMl || scheme.howToApply;
            const isExpanded = expandedId === scheme.id;

            return (
              <div
                key={scheme.id}
                className={`bg-white transition-all ${
                  isExpanded
                    ? 'rounded-3xl border-2 border-[#0E5135] p-5 sm:p-6 space-y-4'
                    : 'rounded-2xl border border-[#E6E2D6] p-5'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : scheme.id)
                  }
                  className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <h2
                    className={`${
                      isExpanded ? 'text-xl' : 'text-lg'
                    } font-bold text-[#141E18] leading-snug break-words`}
                  >
                    {primaryTitle}
                  </h2>
                  {isExpanded ? (
                    <ChevronUp className="w-6 h-6 text-[#141E18] shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-[#141E18] shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="space-y-4 pt-1">
                    <div>
                      <div className="text-sm font-bold text-[#7A5413]">
                        ആർക്ക് അപേക്ഷിക്കാം
                      </div>
                      <p className="text-base text-[#141E18] mt-1 leading-relaxed break-words">
                        {elig}
                      </p>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-[#7A5413]">
                        വേണ്ട രേഖകൾ
                      </div>
                      <p className="text-base text-[#141E18] mt-1 leading-relaxed break-words">
                        {docs}
                      </p>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-[#7A5413]">
                        എങ്ങനെ അപേക്ഷിക്കാം
                      </div>
                      <p className="text-base text-[#141E18] mt-1 leading-relaxed break-words">
                        {apply}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
