import React, { useState } from 'react';
import {
  ChevronLeft,
  Trash2,
  Calendar,
  Phone,
  MessageCircle,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Info,
} from 'lucide-react';
import { Language, WasteScheduleItem, WasteInfo } from '../types/ward';
import {
  getWasteReminderPreferences,
  saveWasteReminderPreferences,
  requestNotificationPermission,
} from '../utils/notifications';

interface WasteScreenProps {
  lang: Language;
  schedule: WasteScheduleItem[];
  wasteInfo: WasteInfo;
  onBack: () => void;
}

const WEEKDAYS = [
  { day: 1, ml: 'തിങ്കൾ', full: 'തിങ്കളാഴ്ച' },
  { day: 2, ml: 'ചൊവ്വ', full: 'ചൊവ്വാഴ്ച' },
  { day: 3, ml: 'ബുധൻ', full: 'ബുധനാഴ്ച' },
  { day: 4, ml: 'വ്യാഴം', full: 'വ്യാഴാഴ്ച' },
  { day: 5, ml: 'വെള്ളി', full: 'വെള്ളിയാഴ്ച' },
  { day: 6, ml: 'ശനി', full: 'ശനിയാഴ്ച' },
  { day: 7, ml: 'ഞായർ', full: 'ഞായറാഴ്ച' },
];

export const WasteScreen: React.FC<WasteScreenProps> = ({
  schedule,
  wasteInfo,
  onBack,
}) => {
  const [selectedType, setSelectedType] = useState<string>('എല്ലാം');
  const [reminderPrefs, setReminderPrefs] = useState(getWasteReminderPreferences);
  const [permissionStatus, setPermissionStatus] = useState<string>(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Waste categories list
  const uniqueTypes = ['എല്ലാം', ...Array.from(new Set(schedule.map((s) => s.wasteType)))];

  const filteredSchedule = schedule.filter((item) =>
    selectedType === 'എല്ലാം' ? true : item.wasteType === selectedType
  );

  // Find nearest upcoming collection for hero card
  const nextScheduled = schedule.find((s) => s.nextDate && s.nextDate !== 'സ്ഥിരം മാർഗ്ഗം') || schedule[0];

  const handleToggleReminder = async (type: string) => {
    let currentEnabled = reminderPrefs.enabled;

    if (!currentEnabled || permissionStatus !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setToastMsg('ബ്രൗസർ നോട്ടിഫിക്കേഷൻ അനുമതി നൽകിയിട്ടില്ല');
        setTimeout(() => setToastMsg(null), 3500);
        return;
      }
      currentEnabled = true;
      setPermissionStatus('granted');
    }

    const currentList = new Set(reminderPrefs.subscribedTypes);
    if (currentList.has(type)) {
      currentList.delete(type);
    } else {
      currentList.add(type);
    }

    const updated = {
      enabled: currentEnabled,
      subscribedTypes: Array.from(currentList),
    };
    setReminderPrefs(updated);
    saveWasteReminderPreferences(updated);

    setToastMsg(
      updated.subscribedTypes.includes(type)
        ? `"${type}" ശേഖരണ ഓർമ്മപ്പെടുത്തൽ ഓൺ ചെയ്തു`
        : `"${type}" ഓർമ്മപ്പെടുത്തൽ ഓഫ് ചെയ്തു`
    );
    setTimeout(() => setToastMsg(null), 3000);
  };

  const phoneNum = wasteInfo.phone || '9446700800';
  const whatsappNum = wasteInfo.whatsapp || '9446700800';

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
            മാലിന്യ ശേഖരണം
          </h1>
          <p className="text-sm font-semibold text-[#637067]">
            ഹരിത കർമ്മ സേന കലണ്ടർ &amp; സേവനങ്ങൾ
          </p>
        </div>
      </div>

      {/* Notification Toast Feedback */}
      {toastMsg && (
        <div className="bg-[#0E5135] text-white px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Hero Card */}
      {nextScheduled ? (
        <section
          aria-label="അടുത്ത ശേഖരണം"
          className="bg-[#0E5135] text-white rounded-3xl p-5 sm:p-6 relative overflow-hidden space-y-3 shadow-xs"
        >
          <div
            aria-hidden="true"
            className="w-40 h-40 rounded-full border border-white/10 absolute -top-12 -right-12 pointer-events-none"
          />
          <div className="flex items-center justify-between gap-3 relative z-10">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#D6A13C] text-[#141E18]">
              അടുത്ത ശേഖരണം
            </span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>{nextScheduled.nextDate || 'ഈ ആഴ്ച'}</span>
            </div>
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl font-extrabold text-white">
              {nextScheduled.wasteType}
            </h2>
            <p className="text-base text-emerald-100/90 mt-1 leading-snug">
              {nextScheduled.pattern} · {nextScheduled.area}
            </p>
          </div>

          <div className="text-xs sm:text-sm text-emerald-200 bg-white/10 rounded-2xl p-3 relative z-10">
            {nextScheduled.notes}
          </div>
        </section>
      ) : (
        <section
          aria-label="ഹരിത കർമ്മ സേന"
          className="bg-[#0E5135] text-white rounded-3xl p-5 sm:p-6 relative overflow-hidden space-y-3 shadow-xs"
        >
          <div
            aria-hidden="true"
            className="w-40 h-40 rounded-full border border-white/10 absolute -top-12 -right-12 pointer-events-none"
          />
          <div className="flex items-center justify-between gap-3 relative z-10">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#D6A13C] text-[#141E18]">
              ശുചിത്വ മിഷൻ · വാർഡ് 19
            </span>
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl font-extrabold text-white">
              ഹരിത കർമ്മ സേന മാലിന്യ ശേഖരണം
            </h2>
            <p className="text-base text-emerald-100/90 mt-1 leading-snug">
              വീടുകളിൽ നിന്നും സ്ഥാപനങ്ങളിൽ നിന്നും അജൈവ മാലിന്യങ്ങൾ ശേഖരിക്കുന്നു.
            </p>
          </div>

          <div className="text-xs sm:text-sm text-emerald-200 bg-white/10 rounded-2xl p-3 relative z-10">
            പ്ലാസ്റ്റിക് കവറുകൾ, കുപ്പികൾ എന്നിവ കഴുകി ഉണക്കി സൂക്ഷിക്കുക. ശേഖരണ തീയതി വാർഡ് മെമ്പർ / ഹരിതകർമ്മസേന അറിയിക്കുന്നതാണ്.
          </div>
        </section>
      )}

      {/* Weekly Schedule Overview Table (shown when schedule exists) */}
      {schedule.length > 0 && (
        <section className="bg-white rounded-3xl p-5 border border-[#E6E2D6] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#141E18] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0E5135]" />
              <span>ആഴ്ചതോറുമുള്ള ക്രമം</span>
            </h2>
            <span className="text-xs font-semibold text-[#637067]">വാർഡ് 19</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center pt-1">
            {WEEKDAYS.map((wd) => {
              const matches = schedule.filter((s) => s.dayOfWeek === wd.day);
              const hasCollection = matches.length > 0;

              return (
                <div
                  key={wd.day}
                  className={`py-2 px-1 rounded-2xl border transition-all ${
                    hasCollection
                      ? 'border-[#0E5135] bg-[#E8F2EC] text-[#0E5135]'
                      : 'border-[#F0ECE1] bg-[#FAF8F2] text-[#8C9790]'
                  }`}
                >
                  <div className="text-xs font-bold">{wd.ml}</div>
                  <div className="mt-1">
                    {hasCollection ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-[#0E5135]" />
                    ) : (
                      <span className="inline-block w-2 h-2 rounded-full bg-stone-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Filter Chips by Waste Type (shown when categories exist) */}
      {schedule.length > 0 && uniqueTypes.length > 1 && (
        <div
          role="tablist"
          aria-label="മാലിന്യ വിഭാഗങ്ങൾ"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
        >
          {uniqueTypes.map((type) => {
            const active = selectedType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`min-h-[44px] px-4 py-2 rounded-full text-sm sm:text-base font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  active
                    ? 'bg-[#0E5135] text-white'
                    : 'bg-white border border-[#DED9CA] text-[#141E18] hover:bg-[#F3F0E6]'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      )}

      {/* Detailed Collection Cards or Informative Empty State */}
      <div className="space-y-3.5">
        {filteredSchedule.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-[#E6E2D6] space-y-2">
            <Trash2 className="w-12 h-12 text-[#0E5135] mx-auto mb-2 opacity-60" />
            <h3 className="text-xl font-bold text-[#141E18]">
              ശേഖരണ കലണ്ടർ ഉടൻ അപ്ഡേറ്റ് ചെയ്യും
            </h3>
            <p className="text-sm text-[#637067] max-w-md mx-auto leading-relaxed">
              വാർഡ് 19-ലെ അജൈവ മാലിന്യ ശേഖരണത്തിന്റെ അടുത്ത തീയതികൾ ഉടൻ അറിയിക്കും. മാലിന്യ നിക്ഷേപം സംബന്ധിച്ച പരാതികൾക്കും വിവരങ്ങൾക്കുമായി താഴെ നൽകിയിട്ടുള്ള ഹരിതകർമ്മസേന ഹെൽപ്പ്‌ലൈനിൽ ബന്ധപ്പെടാം.
            </p>
          </div>
        ) : (
          filteredSchedule.map((item) => {
            const isSubscribed = reminderPrefs.subscribedTypes.includes(item.wasteType);

            return (
              <article
                key={item.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E2D6] shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-[#E8F2EC] text-[#0E5135] mb-1">
                      {item.area}
                    </span>
                    <h3 className="text-xl font-bold text-[#141E18]">
                      {item.wasteType}
                    </h3>
                  </div>

                  {/* Push Notification Reminder Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleReminder(item.wasteType)}
                    aria-label={`${item.wasteType} ഓർമ്മപ്പെടുത്തൽ`}
                    className={`min-h-[42px] px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      isSubscribed
                        ? 'bg-[#E8F2EC] border-[#0E5135] text-[#0E5135]'
                        : 'bg-white border-[#DED9CA] text-[#637067] hover:bg-[#FAF8F2]'
                    }`}
                  >
                    {isSubscribed ? (
                      <>
                        <Bell className="w-4 h-4 text-[#0E5135] fill-[#0E5135]" />
                        <span>ഓർമ്മപ്പെടുത്തൽ ഓൺ</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-4 h-4 text-[#637067]" />
                        <span>ഓർമ്മപ്പെടുത്തുക</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-[#FAF8F2] rounded-2xl p-4 border border-[#EAE6DA] space-y-2 text-sm sm:text-base">
                  <div>
                    <span className="font-bold text-[#7A5413]">ശേഖരണ ക്രമം: </span>
                    <span className="text-[#141E18] font-semibold">{item.pattern}</span>
                  </div>
                  {item.nextDate && (
                    <div>
                      <span className="font-bold text-[#7A5413]">അടുത്ത തീയതി: </span>
                      <span className="text-[#0E5135] font-bold">{item.nextDate}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-[#7A5413]">നിർദ്ദേശങ്ങൾ: </span>
                    <span className="text-[#4A554E]">{item.notes}</span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Haritha Karma Sena Contact Card */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E2D6] shadow-2xs space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#141E18]">
            ഹരിത കർമ്മ സേനയുമായി ബന്ധപ്പെടുക
          </h2>
          <p className="text-sm text-[#637067] mt-0.5">
            {wasteInfo.contactName || 'ഹരിത കർമ്മ സേന കോർഡിനേറ്റർ'} · വാർഡ് 19 മേൽപ്പറമ്പ
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Call Phone Button */}
          <a
            href={`tel:${phoneNum}`}
            className="min-h-[50px] py-3 px-4 rounded-full bg-[#0E5135] hover:bg-[#146643] text-white font-bold text-base flex items-center justify-center gap-2 transition-colors text-center"
          >
            <Phone className="w-4 h-4 shrink-0" />
            <span>വിളിക്കുക</span>
          </a>

          {/* WhatsApp Button */}
          <a
            href={`https://wa.me/91${whatsappNum}?text=${encodeURIComponent(
              'നമസ്കാരം, വാർഡ് 19 മേൽപ്പറമ്പ ഹരിത കർമ്മ സേന മാലിന്യ ശേഖരണവുമായി ബന്ധപ്പെട്ട് വിവരങ്ങൾ അറിയാൻ ആഗ്രഹിക്കുന്നു.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[50px] py-3 px-4 rounded-full bg-[#25D366] hover:bg-[#20BE5A] text-white font-bold text-base flex items-center justify-center gap-2 transition-colors text-center"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>വാട്സ്ആപ്പ്</span>
          </a>
        </div>

        <p className="text-xs text-[#7A5413] flex items-center gap-1.5 pt-1">
          <Info className="w-4 h-4 shrink-0" />
          <span>മാലിന്യം പൊതുസ്ഥലങ്ങളിൽ വലിച്ചെറിയുന്നതും കത്തിക്കുന്നതും ശിക്ഷാർഹമാണ്.</span>
        </p>
      </section>
    </div>
  );
};
