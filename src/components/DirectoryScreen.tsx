import React, { useState } from 'react';
import { ChevronLeft, Phone } from 'lucide-react';
import { DirectoryCategory, DirectoryEntry, Language } from '../types/ward';

interface DirectoryScreenProps {
  lang: Language;
  directory: DirectoryEntry[];
  onBack: () => void;
}

const DIRECTORY_CATEGORIES: {
  value: 'All' | DirectoryCategory;
  ml: string;
}[] = [
  { value: 'All', ml: 'എല്ലാം' },
  { value: 'Doctors', ml: 'ഡോക്ടർമാർ' },
  { value: 'Shops', ml: 'സേവനങ്ങൾ / കടകൾ' },
  { value: 'Schools', ml: 'സ്കൂളുകൾ' },
  { value: 'Autos', ml: 'ഓട്ടോ' },
  { value: 'Ration Shop', ml: 'റേഷൻ കട' },
];

const CATEGORY_LABEL_ML: Record<DirectoryCategory, string> = {
  Doctors: 'ഡോക്ടർ',
  Shops: 'കട',
  Electricians: 'ഇലക്ട്രീഷ്യൻ',
  Plumbers: 'പ്ലംബർ',
  Autos: 'ഓട്ടോ',
  'Ration Shop': 'റേഷൻ കട',
  Anganwadi: 'അങ്കണവാടി',
  Schools: 'സ്കൂൾ',
};

export const DirectoryScreen: React.FC<DirectoryScreenProps> = ({
  directory,
  onBack,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    'All' | DirectoryCategory
  >('All');

  const filteredEntries = directory.filter((entry) =>
    selectedCategory === 'All' ? true : entry.category === selectedCategory
  );

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
          പ്രാദേശിക ഡയറക്ടറി
        </h1>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {DIRECTORY_CATEGORIES.map((cat) => {
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

      {/* Directory List Cards */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#E6E2D6] space-y-1.5">
          <p className="text-lg font-bold text-[#141E18]">
            {selectedCategory === 'Autos'
              ? 'ഓട്ടോ ഡ്രൈവർമാരുടെ നമ്പറുകൾ ഉടൻ ചേർക്കുന്നതാണ്'
              : 'ഈ വിഭാഗത്തിൽ വിവരങ്ങൾ ലഭ്യമല്ല'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((item) => {
            const primaryName = item.nameMl || item.name;
            const primaryPlace = item.placeMl || item.place;
            const catLabel =
              CATEGORY_LABEL_ML[item.category] || item.category;
            const subtitleDetail = item.timings || primaryPlace;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6E2D6] flex items-center justify-between gap-4 shadow-2xs"
              >
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[#141E18] leading-snug break-words">
                    {primaryName}
                  </h2>
                  <p className="text-sm sm:text-base text-[#637067] mt-0.5 break-words">
                    {catLabel} · {subtitleDetail}
                  </p>
                  <p className="text-sm font-semibold text-[#0E5135] mt-1 tabular-nums">
                    {item.phone}
                  </p>
                </div>

                <a
                  href={`tel:${item.phone}`}
                  aria-label={`വിളിക്കുക ${primaryName}`}
                  className="w-12 h-12 rounded-full bg-[#E8F2EC] hover:bg-[#D5E9DD] text-[#0E5135] flex items-center justify-center shrink-0 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
