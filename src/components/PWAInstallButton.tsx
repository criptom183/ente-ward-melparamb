import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  X,
  CheckCircle,
  MoreVertical,
  HelpCircle,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already installed and opened as standalone PWA, hide the button
  if (isInstalled && !justInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 4000);
      }
    } else {
      // Show guided instructions for iOS or Android browsers without direct prompt trigger
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {/* Prominent Save / Install Card on Home Screen */}
      <div className="w-full bg-linear-to-r from-[#0E5135] to-[#186846] rounded-2xl p-3.5 sm:p-4 text-white border border-[#D6A13C]/40 shadow-xs relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div
          aria-hidden="true"
          className="w-24 h-24 rounded-full bg-[#D6A13C]/15 absolute -right-6 -bottom-6 blur-md pointer-events-none"
        />

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#D6A13C] text-[#0E5135] flex items-center justify-center shrink-0 shadow-xs">
              {justInstalled ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Smartphone className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-bold text-white truncate">
                {justInstalled
                  ? 'ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്തു!'
                  : 'ഫോണിൽ ഇൻസ്റ്റാൾ ചെയ്യാം'}
              </div>
              <div className="text-xs text-emerald-100/90 truncate">
                ഹോം സ്ക്രീനിൽ ആപ്പായി സേവ് ചെയ്യുക
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            className="shrink-0 px-3.5 py-2 rounded-xl bg-[#D6A13C] hover:bg-[#C5902E] active:scale-95 text-[#0E5135] font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>ഇൻസ്റ്റാൾ</span>
          </button>
        </div>
      </div>

      {/* Guided Installation Modal for iOS and Browsers */}
      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#FAF8F2] p-5 sm:p-6 shadow-2xl border border-[#E6E2D6] text-[#141E18] space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0E5135] text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#141E18]">
                  {isIOS ? 'iPhone-ൽ ഇൻസ്റ്റാൾ ചെയ്യാൻ' : 'ഫോണിൽ സേവ് ചെയ്യാൻ'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-[#E8F2EC] text-[#0E5135] flex items-center justify-center hover:bg-[#d8e8de] transition-colors cursor-pointer"
                aria-label="ക്ലോസ് ചെയ്യുക"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              // iOS Instructions
              <div className="space-y-3 text-sm text-[#404D44] bg-white rounded-2xl p-4 border border-[#E6E2D6]">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0E5135] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1 leading-snug">
                    Safari ബ്രൗസറിന്റെ അടിയിലുള്ള{' '}
                    <span className="inline-flex items-center gap-1 font-bold text-[#0E5135]">
                      <Share2 className="w-4 h-4 inline" /> Share
                    </span>{' '}
                    ബട്ടൺ അമർത്തുക.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0E5135] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1 leading-snug">
                    താഴേക്ക് സ്ക്രോൾ ചെയ്ത്{' '}
                    <span className="inline-flex items-center gap-1 font-bold text-[#0E5135]">
                      <PlusSquare className="w-4 h-4 inline" /> Add to Home
                      Screen
                    </span>{' '}
                    തിരഞ്ഞെടുക്കുക.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0E5135] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1 leading-snug">
                    മുകളിൽ വലതുവശത്തുള്ള{' '}
                    <strong className="text-[#0E5135]">Add (ചേർക്കുക)</strong>{' '}
                    അമർത്തുക. ആപ്പ് നിങ്ങളുടെ ഹോം സ്ക്രീനിൽ ലഭ്യമാകും!
                  </div>
                </div>
              </div>
            ) : (
              // Android / Other Browser Instructions
              <div className="space-y-3 text-sm text-[#404D44] bg-white rounded-2xl p-4 border border-[#E6E2D6]">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0E5135] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1 leading-snug">
                    Chrome അല്ലെങ്കിൽ ബ്രൗസറിന്റെ മുകളിലെ{' '}
                    <span className="inline-flex items-center gap-1 font-bold text-[#0E5135]">
                      <MoreVertical className="w-4 h-4 inline" /> മൂന്ന് ഡോട്ടുകൾ
                    </span>{' '}
                    അമർത്തുക.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0E5135] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1 leading-snug">
                    <strong className="text-[#0E5135]">
                      Install app (ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക)
                    </strong>{' '}
                    അല്ലെങ്കിൽ{' '}
                    <strong className="text-[#0E5135]">
                      Add to Home screen
                    </strong>{' '}
                    തിരഞ്ഞെടുക്കുക.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0E5135] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1 leading-snug">
                    ഉടൻ തന്നെ നിങ്ങളുടെ ഫോൺ ഹോം സ്ക്രീനിൽ{' '}
                    <strong className="text-[#0E5135]">വാർഡ് 19</strong> ആപ്പ്
                    ഐക്കൺ രൂപപ്പെടും.
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-3 rounded-2xl bg-[#0E5135] text-white font-bold text-sm hover:bg-[#093a26] transition-colors cursor-pointer text-center"
            >
              ശരി, മനസ്സിലായി
            </button>
          </div>
        </div>
      )}
    </>
  );
};
