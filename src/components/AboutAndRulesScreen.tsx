import React, { useState } from 'react';
import { ChevronLeft, MapPin, Clock, Phone, Building2 } from 'lucide-react';
import { Language, WardInfo } from '../types/ward';

interface AboutAndRulesScreenProps {
  lang: Language;
  wardInfo: WardInfo;
  onUnlockAdminPortal: () => void;
  onBack: () => void;
}

export const AboutAndRulesScreen: React.FC<AboutAndRulesScreenProps> = ({
  wardInfo,
  onUnlockAdminPortal,
  onBack,
}) => {
  const [, setVersionTapCount] = useState(0);

  // Silent 5-tap trigger on App Version text
  const handleVersionTap = () => {
    setVersionTapCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        onUnlockAdminPortal();
        return 0;
      }
      return next;
    });
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
          ആപ്പിനെക്കുറിച്ച്
        </h1>
      </div>

      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E2D6] shadow-2xs space-y-5">
        <div>
          <h2 className="text-xl font-bold text-[#141E18] break-words">
            വാർഡ് 19 — മേൽപ്പറമ്പ
          </h2>
          <p className="text-base text-[#4A554E] mt-1 break-words">
            ചെമ്മനാട് ഗ്രാമപഞ്ചായത്ത്, കാസർഗോഡ് ജില്ല, കേരളം
          </p>
        </div>

        <div className="space-y-3.5 pt-2 border-t border-[#E6E2D6]">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-[#0E5135] shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-[#637067]">
                ഗ്രാമപഞ്ചായത്ത്
              </div>
              <div className="text-base font-bold text-[#141E18]">
                {wardInfo.panchayatMl || 'ചെമ്മനാട് ഗ്രാമപഞ്ചായത്ത്'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-[#0E5135] shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-[#637067]">
                വാർഡ് മെമ്പർ
              </div>
              <div className="text-base font-bold text-[#141E18]">
                {wardInfo.memberNameMl || wardInfo.memberName} ·{' '}
                <span className="tabular-nums">{wardInfo.phone}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#0E5135] shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-[#637067]">മേൽവിലാസം</div>
              <div className="text-base text-[#141E18]">
                {wardInfo.officeAddressMl || wardInfo.officeAddress}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#0E5135] shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-[#637067]">
                ഓഫീസ് സമയം
              </div>
              <div className="text-base text-[#141E18]">
                {wardInfo.officeHoursMl || wardInfo.officeHours}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E6E2D6] text-center">
          <span
            onClick={handleVersionTap}
            className="text-sm text-[#637067] select-none cursor-default py-1 inline-block"
          >
            പതിപ്പ് 1.0
          </span>
        </div>
      </section>
    </div>
  );
};
