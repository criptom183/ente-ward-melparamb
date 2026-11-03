import React, { useEffect, useState } from 'react';
import {
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  X,
  CheckCircle,
  MoreVertical,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  QrCode,
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall';

const PRODUCTION_URL = 'https://criptom183.github.io/ente-ward-melparamb/';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isInIframe, isChecking, install } =
    usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [modalReason, setModalReason] = useState<
    'iframe' | 'ios' | 'incognito' | 'manual'
  >('manual');

  // Generate QR code for instant mobile scanning
  useEffect(() => {
    const targetUrl =
      typeof window !== 'undefined' &&
      window.location.hostname.includes('github.io')
        ? window.location.href
        : PRODUCTION_URL;

    QRCode.toDataURL(targetUrl, {
      width: 220,
      margin: 1,
      color: {
        dark: '#0E5135',
        light: '#FAF8F2',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, []);

  // If already running inside standalone app mode on the phone, hide the banner
  if (isInstalled && !justInstalled) {
    return null;
  }

  const handleCopyLink = async () => {
    const targetUrl =
      typeof window !== 'undefined' &&
      window.location.hostname.includes('github.io')
        ? window.location.href
        : PRODUCTION_URL;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(targetUrl);
      } else {
        const input = document.createElement('input');
        input.value = targetUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleInstallClick = async () => {
    // If inside an iframe (like AI Studio preview), native install is strictly blocked by Chromium
    if (isInIframe) {
      setModalReason('iframe');
      setShowGuideModal(true);
      return;
    }

    // iOS Safari does not support beforeinstallprompt; show 2-step Apple guide
    if (isIOS) {
      setModalReason('ios');
      setShowGuideModal(true);
      return;
    }

    setLoading(true);
    const { success, nativeTriggered, reason } = await install();
    setLoading(false);

    if (success) {
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 6000);
      return;
    }

    // If native prompt could not be triggered (e.g. Incognito or prompt already dismissed)
    if (!nativeTriggered) {
      if (reason === 'iframe') {
        setModalReason('iframe');
      } else {
        setModalReason('incognito');
      }
      setShowGuideModal(true);
    }
  };

  const targetLiveUrl =
    typeof window !== 'undefined' &&
    window.location.hostname.includes('github.io')
      ? window.location.href
      : PRODUCTION_URL;

  return (
    <>
      {/* Prominent Save / Install Card on Home Screen */}
      <div className="w-full bg-linear-to-r from-[#0E5135] to-[#186846] rounded-2xl p-3.5 sm:p-4 text-white border border-[#D6A13C]/40 shadow-xs relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div
          aria-hidden="true"
          className="w-28 h-28 rounded-full bg-[#D6A13C]/15 absolute -right-6 -bottom-6 blur-md pointer-events-none"
        />

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#D6A13C] text-[#0E5135] flex items-center justify-center shrink-0 shadow-xs">
              {justInstalled ? (
                <CheckCircle className="w-5 h-5 text-[#0E5135]" />
              ) : (
                <Smartphone className="w-5 h-5 text-[#0E5135]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-bold text-white truncate">
                {justInstalled
                  ? 'ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്തു!'
                  : 'ഫോണിൽ ഇൻസ്റ്റാൾ ചെയ്യാം'}
              </div>
              <div className="text-xs text-emerald-100/90 truncate">
                {isInIframe
                  ? 'മൊബൈലിൽ ആപ്പായി സേവ് ചെയ്യുക'
                  : isInstallable
                    ? 'ഒറ്റ ക്ലിക്കിൽ ഫോണിലേക്ക് ചേർക്കുക'
                    : 'ഹോം സ്ക്രീനിൽ ആപ്പായി സേവ് ചെയ്യുക'}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={loading || isChecking}
            onClick={handleInstallClick}
            className="shrink-0 px-3.5 py-2 rounded-xl bg-[#D6A13C] hover:bg-[#C5902E] active:scale-95 text-[#0E5135] font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-75"
          >
            {loading || isChecking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : justInstalled ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>
              {loading || isChecking
                ? 'തയ്യാറാകുന്നു...'
                : justInstalled
                  ? 'വിജയിച്ചു'
                  : 'ഇൻസ്റ്റാൾ'}
            </span>
          </button>
        </div>
      </div>

      {/* Guided Installation / QR / Live Open Modal */}
      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#FAF8F2] p-5 sm:p-6 shadow-2xl border border-[#E6E2D6] text-[#141E18] space-y-4 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0E5135] text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#141E18]">
                  {modalReason === 'iframe'
                    ? 'മൊബൈലിൽ ഇൻസ്റ്റാൾ ചെയ്യാൻ'
                    : modalReason === 'ios'
                      ? 'iPhone-ൽ ഇൻസ്റ്റാൾ ചെയ്യാൻ'
                      : 'ഹോം സ്ക്രീനിലേക്ക് ചേർക്കാൻ'}
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

            {/* IFRAME / PREVIEW MODE FLOW */}
            {modalReason === 'iframe' && (
              <div className="space-y-3.5">
                {/* Clear explanation of why iframe blocks native OS prompt */}
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>AI Studio പ്രിവ്യൂ മോഡ്</span>
                  </div>
                  <p>
                    ബ്രൗസറുകളുടെ സുരക്ഷാ നിയമം കാരണം എഡിറ്റർ പ്രിവ്യൂവിനുള്ളിൽ
                    (iframe) നിന്ന് നേരിട്ട് ഇൻസ്റ്റാൾ ചെയ്യാനാകില്ല.
                  </p>
                  <p className="font-medium text-amber-950">
                    നിങ്ങളുടെ ഫോണിലെ Chrome-ൽ ഈ ലിങ്ക് തുറന്നാൽ ഒറ്റ ക്ലിക്കിൽ
                    നേരിട്ട് ഇൻസ്റ്റാൾ ചെയ്യാം!
                  </p>
                </div>

                {/* QR Code for phone camera scanning */}
                {qrDataUrl && (
                  <div className="bg-white rounded-2xl p-4 border border-[#E6E2D6] text-center space-y-2">
                    <div className="text-xs font-bold text-[#0E5135] flex items-center justify-center gap-1.5">
                      <QrCode className="w-4 h-4" />
                      <span>മൊബൈൽ ക്യാമറ ഉപയോഗിച്ച് സ്കാൻ ചെയ്യുക:</span>
                    </div>
                    <div className="flex justify-center py-1">
                      <img
                        src={qrDataUrl}
                        alt="മൊബൈൽ ഇൻസ്റ്റാളേഷൻ ക്യുആർ കോഡ്"
                        className="w-40 h-40 rounded-xl border border-gray-100 shadow-2xs"
                      />
                    </div>
                    <div className="text-[11px] text-[#637067]">
                      ക്യാമറ കാണിച്ചാൽ ഫോണിൽ തുറന്ന് ഇൻസ്റ്റാൾ ചെയ്യാം
                    </div>
                  </div>
                )}

                {/* Action Buttons: Open in Tab & Copy Link */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={targetLiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-[#0E5135] text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#0a3f29] transition-colors text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>ടാബിൽ തുറക്കുക</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="py-2.5 px-3 rounded-xl bg-[#D6A13C] text-[#0E5135] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-[#c5902e] transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? 'കോപ്പി ചെയ്തു!' : 'ലിങ്ക് കോപ്പി'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* IOS SAFARI FLOW */}
            {modalReason === 'ios' && (
              <div className="space-y-3 text-sm text-[#404D44] bg-white rounded-2xl p-4 border border-[#E6E2D6]">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0E5135] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1 leading-snug">
                    Safari ബ്രൗസറിന്റെ താഴെയുള്ള{' '}
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
                    <strong className="text-[#0E5135]">Add</strong> അമർത്തുക.
                    ആപ്പ് ഹോം സ്ക്രീനിൽ റെഡിയാകും!
                  </div>
                </div>
              </div>
            )}

            {/* INCOGNITO OR STANDARD BROWSER FALLBACK */}
            {modalReason === 'incognito' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Incognito (പ്രൈവറ്റ്) മോഡിലാണോ?</span>
                  </div>
                  <p>
                    Google Chrome പ്രൈവറ്റ് മോഡിൽ ആപ്പുകൾ ഹോം സ്ക്രീനിലേക്ക്
                    ഇൻസ്റ്റാൾ ചെയ്യുന്നത് തടയാറുണ്ട്.
                  </p>
                  <p className="font-semibold text-amber-950">
                    സാധാരണ Chrome ടാബിൽ തുറന്നാൽ നേരിട്ട് ഒറ്റ ക്ലിക്കിൽ
                    ഇൻസ്റ്റാൾ ചെയ്യാം.
                  </p>
                </div>

                <div className="space-y-3 text-sm text-[#404D44] bg-white rounded-2xl p-4 border border-[#E6E2D6]">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#0E5135] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="flex-1 leading-snug">
                      Chrome മെനു{' '}
                      <span className="inline-flex items-center gap-1 font-bold text-[#0E5135]">
                        <MoreVertical className="w-4 h-4 inline" /> (3 ഡോട്ടുകൾ)
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
                      തിരഞ്ഞെടുക്കുക.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#D6A13C] text-[#0E5135] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-[#c5902e] transition-colors cursor-pointer"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>
                    {copied
                      ? 'ലിങ്ക് കോപ്പി ചെയ്തു! സാധാരണ ടാബിൽ പേസ്റ്റ് ചെയ്യുക'
                      : 'ലിങ്ക് കോപ്പി ചെയ്യുക'}
                  </span>
                </button>
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
