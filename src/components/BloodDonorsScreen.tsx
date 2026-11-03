import React, { useState } from 'react';
import {
  ChevronLeft,
  Heart,
  Phone,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { Language, BloodDonor, BloodGroup } from '../types/ward';

interface BloodDonorsScreenProps {
  lang: Language;
  donors: BloodDonor[];
  submitDonorRegistration: (input: {
    name: string;
    bloodGroup: BloodGroup;
    phone: string;
    area: string;
    lastDonationDate?: string;
    consentGiven: boolean;
  }) => Promise<void>;
  onBack: () => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const BloodDonorsScreen: React.FC<BloodDonorsScreenProps> = ({
  donors,
  submitDonorRegistration,
  onBack,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | 'All'>('All');
  const [showRegModal, setShowRegModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter approved & available donors
  const approvedDonors = donors.filter((d) => d.approved);
  const filteredDonors = approvedDonors.filter((d) =>
    selectedGroup === 'All' ? true : d.bloodGroup === selectedGroup
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGiven) {
      setFormError('തുടരുന്നതിന് സമ്മതപത്രം അംഗീകരിക്കേണ്ടതാണ്.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await submitDonorRegistration({
        name,
        bloodGroup,
        phone,
        area,
        lastDonationDate,
        consentGiven,
      });
      setFormSuccess(true);
      setName('');
      setPhone('');
      setArea('');
      setLastDonationDate('');
      setConsentGiven(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'രജിസ്ട്രേഷൻ പരാജയപ്പെട്ടു');
    } finally {
      setIsSubmitting(false);
    }
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
            രക്തദാതാക്കൾ
          </h1>
          <p className="text-sm font-semibold text-[#637067]">
            വാർഡ് 19 സന്നദ്ധ രക്തദാന ഡയറക്ടറി
          </p>
        </div>
      </div>

      {/* Hero Strip with Register Button */}
      <section className="bg-gradient-to-r from-red-800 to-rose-900 text-white rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden space-y-3">
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">
              <Heart className="w-3.5 h-3.5 fill-current text-rose-300" />
              <span>രക്തദാനം മഹാദാനം</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
              രക്തം ആവശ്യമുണ്ടോ?
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowRegModal(true);
              setFormSuccess(false);
              setFormError(null);
            }}
            className="min-h-[46px] px-4 py-2 rounded-full bg-white text-red-900 hover:bg-rose-50 font-extrabold text-sm sm:text-base flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>ദാതാവാകൂ</span>
          </button>
        </div>
        <p className="text-xs sm:text-sm text-rose-100/90 relative z-10 leading-relaxed">
          അടിയന്തര ഘട്ടങ്ങളിൽ വാർഡിലെ രക്തദാതാക്കളെ നേരിട്ട് ഫോണിൽ വിളിക്കാവുന്നതാണ്.
        </p>
      </section>

      {/* 8 Large Blood Group Buttons Grid */}
      <section className="bg-white rounded-3xl p-5 border border-[#E6E2D6] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-[#7A5413]">
            ബ്ലഡ് ഗ്രൂപ്പ് തിരഞ്ഞെടുക്കുക
          </div>
          {selectedGroup !== 'All' && (
            <button
              type="button"
              onClick={() => setSelectedGroup('All')}
              className="text-xs font-bold text-[#0E5135] underline cursor-pointer"
            >
              എല്ലാം കാണുക
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {BLOOD_GROUPS.map((bg) => {
            const isSelected = selectedGroup === bg;
            const count = approvedDonors.filter((d) => d.bloodGroup === bg).length;

            return (
              <button
                key={bg}
                type="button"
                onClick={() => setSelectedGroup(isSelected ? 'All' : bg)}
                className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#0E5135] text-white border-[#0E5135] shadow-xs scale-[1.02]'
                    : 'bg-[#FAF8F2] hover:bg-[#F3EFE3] text-[#141E18] border-[#EAE6DA]'
                }`}
              >
                <span className="text-lg sm:text-xl font-black">{bg}</span>
                <span
                  className={`text-xs mt-0.5 font-bold ${
                    isSelected ? 'text-emerald-200' : 'text-[#637067]'
                  }`}
                >
                  {count} പേർ
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Donors List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-[#141E18]">
            {selectedGroup === 'All' ? 'എല്ലാ ദാതാക്കളും' : `${selectedGroup} രക്തദാതാക്കൾ`} ({filteredDonors.length})
          </h2>
        </div>

        {filteredDonors.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-[#E6E2D6] space-y-2">
            <Heart className="w-12 h-12 text-rose-500 mx-auto mb-2 opacity-60" />
            <h3 className="text-lg font-bold text-[#141E18]">
              {selectedGroup === 'All'
                ? 'രക്തദാതാക്കളുടെ രജിസ്ട്രേഷൻ ആരംഭിച്ചു'
                : `${selectedGroup} ഗ്രൂപ്പിൽ അംഗീകൃത ദാതാക്കൾ നിലവിലില്ല`}
            </h3>
            <p className="text-sm text-[#637067] max-w-md mx-auto">
              വാർഡ് 19-ൽ അടിയന്തര സാഹചര്യങ്ങളിൽ ജീവൻ രക്ഷിക്കാൻ സന്നദ്ധരായ ആളുകൾക്ക് മുകളിലുള്ള &apos;ദാതാവാകൂ&apos; ബട്ടൺ വഴി സ്വന്തം പേര് രജിസ്റ്റർ ചെയ്യാവുന്നതാണ്.
            </p>
          </div>
        ) : (
          filteredDonors.map((donor) => (
            <article
              key={donor.id}
              className="bg-white rounded-3xl p-5 border border-[#E6E2D6] shadow-2xs flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Large Blood Group Badge */}
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xl font-black leading-none">{donor.bloodGroup}</span>
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-[#141E18] leading-tight truncate">
                    {donor.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#637067] mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#0E5135]" />
                    <span className="truncate">{donor.area}</span>
                  </div>
                  {donor.lastDonationDate && (
                    <div className="text-xs text-[#7A5413] mt-0.5">
                      അവസാന ദാനം: {donor.lastDonationDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Call Button */}
              <a
                href={`tel:${donor.phone}`}
                className="min-h-[46px] px-4 py-2 rounded-full bg-[#0E5135] hover:bg-[#146643] text-white font-bold text-sm inline-flex items-center gap-2 transition-colors shrink-0 shadow-xs"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>വിളിക്കുക</span>
              </a>
            </article>
          ))
        )}
      </div>

      {/* Mandatory Warning Note */}
      <footer className="bg-[#FAF8F2] rounded-2xl p-4 border border-[#EAE6DA] text-xs sm:text-sm text-[#7A5413] flex items-start gap-2.5">
        <Info className="w-5 h-5 shrink-0 text-[#7A5413] mt-0.5" />
        <p className="leading-relaxed">
          നിങ്ങളുടെ പേര് ദാതാക്കളുടെ പട്ടികയിൽ ചേർക്കാനോ ഒഴിവാക്കാനോ അല്ലെങ്കിൽ ലഭ്യത മാറ്റാനോ വാർഡ് മെമ്പറെ നേരിട്ട് ബന്ധപ്പെടുക.
        </p>
      </footer>

      {/* REGISTRATION MODAL WITH REQUIRED CONSENT CHECKBOX */}
      {showRegModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E6E2D6] my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#141E18]">
                രക്തദാതാവായി രജിസ്റ്റർ ചെയ്യുക
              </h2>
              <button
                type="button"
                onClick={() => setShowRegModal(false)}
                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-[#141E18] flex items-center justify-center font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formSuccess ? (
              <div className="space-y-4 py-4 text-center">
                <CheckCircle2 className="w-16 h-16 text-[#0E5135] mx-auto" />
                <h3 className="text-xl font-bold text-[#141E18]">
                  രജിസ്ട്രേഷൻ വിജയകരമായി സമർപ്പിച്ചു
                </h3>
                <p className="text-sm text-[#4A554E] leading-relaxed">
                  വാർഡ് മെമ്പറുടെ പരിശോധനയ്ക്ക് ശേഷം താങ്കളുടെ പേര് ദാതാക്കളുടെ പട്ടികയിൽ ഉൾപ്പെടുത്തും. മനുഷ്യ ജീവനുകൾ രക്ഷിക്കാനുള്ള താങ്കളുടെ സന്മനസ്സിന് നന്ദി.
                </p>
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="w-full min-h-[48px] rounded-full bg-[#0E5135] text-white font-bold text-base cursor-pointer"
                >
                  ശരി, മനസ്സിലായി
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {formError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-[#141E18] mb-1">
                    മുഴുവൻ പേര് *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="പേര് നൽകുക"
                    className="w-full min-h-[48px] px-4 bg-white border border-[#DED9CA] rounded-2xl text-base text-[#141E18] focus:outline-none focus:border-[#0E5135]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-[#141E18] mb-1">
                      ബ്ലഡ് ഗ്രൂപ്പ് *
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                      className="w-full min-h-[48px] px-4 bg-white border border-[#DED9CA] rounded-2xl text-base text-[#141E18] font-bold focus:outline-none focus:border-[#0E5135]"
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#141E18] mb-1">
                      മൊബൈൽ നമ്പർ *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10 അക്ക നമ്പർ"
                      className="w-full min-h-[48px] px-4 bg-white border border-[#DED9CA] rounded-2xl text-base text-[#141E18] focus:outline-none focus:border-[#0E5135]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#141E18] mb-1">
                    സ്ഥലം / ലാൻഡ്മാർക്ക് (വാർഡ് 19) *
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="ഉദാ: മേൽപ്പറമ്പ ജംഗ്ഷൻ, കടാങ്കോട്"
                    className="w-full min-h-[48px] px-4 bg-white border border-[#DED9CA] rounded-2xl text-base text-[#141E18] focus:outline-none focus:border-[#0E5135]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#141E18] mb-1">
                    അവസാനം രക്തം നൽകിയ തീയതി (ഐച്ഛികം)
                  </label>
                  <input
                    type="date"
                    value={lastDonationDate}
                    onChange={(e) => setLastDonationDate(e.target.value)}
                    className="w-full min-h-[48px] px-4 bg-white border border-[#DED9CA] rounded-2xl text-base text-[#141E18] focus:outline-none focus:border-[#0E5135]"
                  />
                </div>

                {/* REQUIRED CONSENT CHECKBOX */}
                <div className="bg-[#FAF8F2] p-4 rounded-2xl border border-[#EAE6DA] space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      required
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded text-[#0E5135] focus:ring-[#0E5135] shrink-0"
                    />
                    <span className="text-xs sm:text-sm font-bold text-[#141E18] leading-snug">
                      എന്റെ ഫോൺ നമ്പർ രക്തദാന ആവശ്യങ്ങൾക്കായി വാർഡിലെ ആളുകൾക്ക് കാണാൻ ഞാൻ സമ്മതിക്കുന്നു. *
                    </span>
                  </label>
                  <p className="text-xs text-[#637067] pl-8">
                    സമ്മതം നൽകാതെ രക്തദാതാവായി രജിസ്റ്റർ ചെയ്യുവാൻ സാധിക്കില്ല.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !consentGiven}
                  className="w-full min-h-[52px] py-3 px-6 rounded-full bg-[#0E5135] hover:bg-[#146643] disabled:opacity-50 text-white font-bold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{isSubmitting ? 'സമർപ്പിക്കുന്നു...' : 'രജിസ്ട്രേഷൻ സമർപ്പിക്കുക'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
