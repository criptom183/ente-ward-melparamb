import React from 'react';
import { ChevronLeft, Phone, User } from 'lucide-react';
import { Contact, Language, WardInfo } from '../types/ward';

interface ContactsScreenProps {
  lang: Language;
  wardInfo: WardInfo;
  contacts: Contact[];
  onBack: () => void;
}

const EMERGENCY_GRID = [
  { number: '100', label: 'പോലീസ്' },
  { number: '108', label: 'ആംബുലൻസ്' },
  { number: '101', label: 'ഫയർഫോഴ്സ്' },
  { number: '112', label: 'അടിയന്തര സഹായം' },
];

export const ContactsScreen: React.FC<ContactsScreenProps> = ({
  wardInfo,
  contacts,
  onBack,
}) => {
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
          ഫോൺ നമ്പറുകൾ
        </h1>
      </div>

      {/* Ward Member Card */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E2D6] shadow-2xs space-y-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-16 h-16 rounded-full border-2 border-[#D6A13C] bg-[#24664A] flex items-center justify-center shrink-0 overflow-hidden relative">
  <img
    src="https://api.ksmart.lsgkerala.gov.in/meeting-management-services/auth/pdf/fetch-member-photo/f024cdf5-0c4f-4c26-ae63-632ae934aa24.jpg/10132101192"
    alt={wardInfo.memberNameMl || wardInfo.memberName}
    className="w-full h-full object-cover"
    onError={(e) => {
      const imgEl = e.currentTarget;
      if (!imgEl.src.includes('ward-member.jpg')) {
        imgEl.src = `${import.meta.env.BASE_URL}assets/ward-member.jpg`;
      } else {
        imgEl.style.display = 'none';
      }
    }}
  />
  <User className="w-8 h-8 text-white stroke-[2] absolute pointer-events-none opacity-20" />
</div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-[#141E18] break-words">
              {wardInfo.memberNameMl || wardInfo.memberName}
            </h2>
            <p className="text-base text-[#637067] mt-0.5 break-words">
              {wardInfo.memberRoleMl ||
                wardInfo.memberRole ||
                'ഗ്രാമപഞ്ചായത്ത് പ്രസിഡന്റ് · വാർഡ് മെമ്പർ'}
            </p>
            <p className="text-sm text-[#637067] mt-0.5 break-words">
              വിലാസം:{' '}
              {wardInfo.officeAddressMl ||
                wardInfo.officeAddress ||
                '17 / 367, കട്ടക്കൽ ഹൗസ്, കടാങ്കോട്, കളനാട് പി.ഒ, കാസർഗോഡ് - 671317'}
            </p>
          </div>
        </div>

        <a
          href={`tel:${wardInfo.phone}`}
          className="w-full min-h-[54px] px-5 py-3.5 rounded-full bg-[#0E5135] hover:bg-[#0A3E28] text-white font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition-colors text-center"
        >
          <Phone className="w-5 h-5 shrink-0" />
          <span className="tabular-nums">വിളിക്കുക · {wardInfo.phone}</span>
        </a>
      </section>

      {/* Emergency Numbers 2x2 Grid */}
      <section className="space-y-3.5">
        <h2 className="text-xl font-bold text-[#141E18]">അടിയന്തര നമ്പറുകൾ</h2>
        <div className="grid grid-cols-2 gap-3.5">
          {EMERGENCY_GRID.map((item) => (
            <a
              key={item.number}
              href={`tel:${item.number}`}
              className="bg-[#F9EDED] hover:bg-[#F4DFDF] border border-[#F0D5D5] rounded-2xl p-4 sm:p-5 flex flex-col justify-center transition-colors"
            >
              <div className="text-2xl sm:text-3xl font-extrabold text-[#7D1D1D] tabular-nums">
                {item.number}
              </div>
              <div className="text-base font-bold text-[#431414] mt-1 break-words">
                {item.label}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Offices & Services List */}
      <section className="space-y-3.5">
        <h2 className="text-xl font-bold text-[#141E18]">
          ഓഫീസുകളും സേവനങ്ങളും
        </h2>
        <div className="space-y-3">
          {contacts.map((contact) => {
            const primaryName = contact.nameMl || contact.name;
            const roleText = contact.roleMl || contact.role;
            return (
              <div
                key={contact.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6E2D6] flex items-center justify-between gap-4 shadow-2xs"
              >
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-[#141E18] leading-snug break-words">
                    {primaryName}
                  </h3>
                  {roleText && (
                    <p className="text-xs sm:text-sm text-[#637067] mt-0.5 break-words">
                      {roleText}
                    </p>
                  )}
                  <p className="text-sm sm:text-base font-semibold text-[#0E5135] mt-1 tabular-nums">
                    {contact.phone}
                  </p>
                </div>

                <a
                  href={`tel:${contact.phone}`}
                  aria-label={`വിളിക്കുക ${primaryName}`}
                  className="w-12 h-12 rounded-full bg-[#E8F2EC] hover:bg-[#D5E9DD] text-[#0E5135] flex items-center justify-center shrink-0 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
