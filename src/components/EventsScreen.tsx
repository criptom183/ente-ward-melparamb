import React, { useState } from 'react';
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Share2,
  Download,
  CalendarPlus,
  Users,
  Send,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { Language, EventItem, EventCategory, GramSabhaMeeting } from '../types/ward';
import { downloadEventIcs, getGoogleCalendarUrl } from '../utils/calendar';
import { ML_WEEKDAYS_SHORT, ML_MONTHS, getDaysRemaining } from '../utils/formatters';
import { getDriveDownloadUrl } from '../utils/driveLinks';

interface EventsScreenProps {
  lang: Language;
  events: EventItem[];
  gramSabhas: GramSabhaMeeting[];
  submitGramSabhaPoint: (input: { name?: string; phone?: string; subject: string }) => Promise<void>;
  onBack: () => void;
}

const EVENT_CATEGORIES: { value: 'All' | EventCategory; ml: string }[] = [
  { value: 'All', ml: 'എല്ലാം' },
  { value: 'ഉത്സവം', ml: 'ഉത്സവം' },
  { value: 'വാക്സിനേഷൻ', ml: 'വാക്സിനേഷൻ' },
  { value: 'രക്തദാന ക്യാമ്പ്', ml: 'രക്തദാന ക്യാമ്പ്' },
  { value: 'യോഗം', ml: 'യോഗം' },
  { value: 'മറ്റുള്ളവ', ml: 'മറ്റുള്ളവ' },
];

export const EventsScreen: React.FC<EventsScreenProps> = ({
  events,
  gramSabhas,
  submitGramSabhaPoint,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'gramSabha'>('calendar');
  const [selectedCategory, setSelectedCategory] = useState<'All' | EventCategory>('All');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayDateStr, setSelectedDayDateStr] = useState<string | null>(null);

  // Form State for "വിഷയം ഉന്നയിക്കുക"
  const [pointName, setPointName] = useState('');
  const [pointPhone, setPointPhone] = useState('');
  const [pointSubject, setPointSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pointSubmittedSuccess, setPointSubmittedSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);

  // Calendar month computations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayWeekday = new Date(year, month, 1).getDay(); // 0=Sunday

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayDateStr(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayDateStr(null);
  };

  // Filter events by category
  const filteredEvents = events.filter((e) =>
    selectedCategory === 'All' ? true : e.category === selectedCategory
  );

  // Events on selected day
  const selectedDayEvents = selectedDayDateStr
    ? filteredEvents.filter((e) => e.date === selectedDayDateStr)
    : [];

  // Upcoming events
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingEvents = filteredEvents.filter((e) => e.date >= todayStr);

  // Gram Sabha separation
  const upcomingGramSabha = gramSabhas.find((gs) => gs.status === 'വരാനിരിക്കുന്നത്') || gramSabhas[0];
  const pastGramSabhas = gramSabhas.filter((gs) => gs.status === 'കഴിഞ്ഞത്');

  // Days remaining for next Gram Sabha
  const gramSabhaDaysLeft = upcomingGramSabha ? getDaysRemaining(upcomingGramSabha.date) : null;

  const handleShareEventWhatsApp = (event: EventItem) => {
    const text = `*വാർഡ് 19 പരിപാടി: ${event.title}*\nതീയതി: ${event.date}\nസമയം: ${event.startTime} - ${event.endTime}\nസ്ഥലം: ${event.venue}\n\n${event.description}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setCopiedEventId(event.id);
    setTimeout(() => setCopiedEventId(null), 3500);
  };

  const handleSubmitPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitGramSabhaPoint({
        name: pointName,
        phone: pointPhone,
        subject: pointSubject,
      });
      setPointSubmittedSuccess(true);
      setPointSubject('');
      setPointName('');
      setPointPhone('');
      setTimeout(() => setPointSubmittedSuccess(false), 5000);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'വിഷയം സമർപ്പിക്കാൻ സാധിച്ചില്ല');
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
            പരിപാടികൾ
          </h1>
          <p className="text-sm font-semibold text-[#637067]">
            കലണ്ടർ &amp; ഗ്രാമസഭ
          </p>
        </div>
      </div>

      {/* Main Tabs (കലണ്ടർ / ഗ്രാമസഭ) */}
      <div className="flex bg-[#EAE6DA] p-1 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 min-h-[48px] py-2 px-4 rounded-xl font-bold text-base transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-white text-[#0E5135] shadow-xs'
              : 'text-[#637067] hover:text-[#141E18]'
          }`}
        >
          കലണ്ടർ
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gramSabha')}
          className={`flex-1 min-h-[48px] py-2 px-4 rounded-xl font-bold text-base transition-all cursor-pointer ${
            activeTab === 'gramSabha'
              ? 'bg-white text-[#0E5135] shadow-xs'
              : 'text-[#637067] hover:text-[#141E18]'
          }`}
        >
          ഗ്രാമസഭ
        </button>
      </div>

      {/* TAB 1: CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <div className="space-y-5">
          {/* Category Chips */}
          <div
            role="tablist"
            aria-label="പരിപാടി വിഭാഗങ്ങൾ"
            className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
          >
            {EVENT_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`min-h-[44px] px-4 py-2 rounded-full text-sm sm:text-base font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
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

          {/* Month Grid Card (Sunday Start, Malayalam Month & Day Names) */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E2D6] shadow-2xs space-y-4">
            {/* Month Header with Navigation */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#141E18]">
                {ML_MONTHS[month]} {year}
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="മുൻ മാസം"
                  className="w-10 h-10 rounded-full border border-[#DED9CA] flex items-center justify-center hover:bg-[#F3F0E6] cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5 text-[#141E18]" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="അടുത്ത മാസം"
                  className="w-10 h-10 rounded-full border border-[#DED9CA] flex items-center justify-center hover:bg-[#F3F0E6] cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 text-[#141E18]" />
                </button>
              </div>
            </div>

            {/* Weekday Names Header (Sunday Start) */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs sm:text-sm text-[#7A5413]">
              {ML_WEEKDAYS_SHORT.map((wd, i) => (
                <div key={i} className="py-1">
                  {wd}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Empty leading cells */}
              {Array.from({ length: firstDayWeekday }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10 sm:h-12" />
              ))}

              {/* Month Day Cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const paddedMonth = String(month + 1).padStart(2, '0');
                const paddedDay = String(dayNum).padStart(2, '0');
                const dateKey = `${year}-${paddedMonth}-${paddedDay}`;
                const hasEvent = events.some((e) => e.date === dateKey);
                const isSelected = selectedDayDateStr === dateKey;
                const isToday = todayStr === dateKey;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() =>
                      setSelectedDayDateStr(isSelected ? null : dateKey)
                    }
                    className={`h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center text-sm font-bold relative transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0E5135] text-white shadow-xs'
                        : isToday
                        ? 'border-2 border-[#D6A13C] text-[#141E18] bg-[#FDF9EE]'
                        : 'hover:bg-[#FAF8F2] text-[#141E18]'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {hasEvent && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          isSelected ? 'bg-[#D6A13C]' : 'bg-[#0E5135]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Hint */}
            <p className="text-xs text-[#637067] text-center pt-1">
              തീയതിയിൽ അമർത്തിയാൽ ആ ദിവസത്തെ പരിപാടികൾ കാണാം (പച്ച ബിന്ദു: പരിപാടിയുണ്ട്)
            </p>
          </section>

          {/* Events on Selected Day */}
          {selectedDayDateStr && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-[#141E18]">
                {selectedDayDateStr}-ലെ പരിപാടികൾ
              </h2>
              {selectedDayEvents.length === 0 ? (
                <div className="bg-white rounded-3xl p-6 text-center border border-[#E6E2D6]">
                  <p className="text-base text-[#637067]">
                    ഈ തീയതിയിൽ പരിപാടികൾ രേഖപ്പെടുത്തിയിട്ടില്ല
                  </p>
                </div>
              ) : (
                selectedDayEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onShare={() => handleShareEventWhatsApp(event)}
                    copied={copiedEventId === event.id}
                  />
                ))
              )}
            </div>
          )}

          {/* Upcoming Events List ("വരാനിരിക്കുന്നവ") */}
          <div className="space-y-3.5">
            <h2 className="text-xl font-bold text-[#141E18] flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#0E5135]" />
              <span>വരാനിരിക്കുന്ന പരിപാടികൾ</span>
            </h2>

            {upcomingEvents.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-[#E6E2D6] space-y-1">
                <CalendarIcon className="w-10 h-10 text-[#0E5135] mx-auto mb-2 opacity-60" />
                <p className="text-base font-bold text-[#141E18]">
                  നിലവിൽ പുതിയ പരിപാടികൾ നിശ്ചയിച്ചിട്ടില്ല
                </p>
                <p className="text-xs text-[#637067]">
                  ക്യാമ്പുകൾ, യോഗങ്ങൾ, വാർഡ്തല പരിപാടികൾ എന്നിവ നിശ്ചയിക്കുമ്പോൾ കലണ്ടറിൽ ലഭ്യമാകും.
                </p>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onShare={() => handleShareEventWhatsApp(event)}
                  copied={copiedEventId === event.id}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GRAM SABHA VIEW */}
      {activeTab === 'gramSabha' && (
        <div className="space-y-5">
          {/* Next Gram Sabha Card */}
          {upcomingGramSabha ? (
            <section
              aria-label="അടുത്ത ഗ്രാമസഭ"
              className="bg-[#0E5135] text-white rounded-3xl p-5 sm:p-6 relative overflow-hidden space-y-4 shadow-xs"
            >
              <div
                aria-hidden="true"
                className="w-44 h-44 rounded-full border border-white/10 absolute -top-14 -right-14 pointer-events-none"
              />

              <div className="flex items-center justify-between gap-3 relative z-10">
                <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#D6A13C] text-[#141E18]">
                  അടുത്ത ഗ്രാമസഭ
                </span>
                {gramSabhaDaysLeft !== null && gramSabhaDaysLeft >= 0 && (
                  <span className="text-xs sm:text-sm font-bold text-amber-200">
                    {gramSabhaDaysLeft === 0 ? 'ഇന്ന്!' : `${gramSabhaDaysLeft} ദിവസങ്ങൾ ബാക്കി`}
                  </span>
                )}
              </div>

              <div className="relative z-10 space-y-1">
                <h2 className="text-2xl font-extrabold text-white">
                  വാർഡ് 19 ഗ്രാമസഭാ യോഗം
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-emerald-100 pt-1">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 shrink-0" />
                    <span>{upcomingGramSabha.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>{upcomingGramSabha.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-emerald-100">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{upcomingGramSabha.venue}</span>
                </div>
              </div>

              {/* Agenda List */}
              {upcomingGramSabha.agenda && upcomingGramSabha.agenda.length > 0 && (
                <div className="bg-white/10 rounded-2xl p-4 relative z-10 space-y-2">
                  <div className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                    അജണ്ട
                  </div>
                  <ul className="space-y-1.5 text-sm text-white list-disc list-inside">
                    {upcomingGramSabha.agenda.map((agItem, idx) => (
                      <li key={idx} className="break-words">
                        {agItem}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ) : (
            <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E2D6] shadow-2xs space-y-2">
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#FAF8F2] border border-[#EAE6DA] text-[#7A5413]">
                ഗ്രാമസഭാ യോഗം
              </span>
              <h2 className="text-xl font-bold text-[#141E18]">
                അടുത്ത ഗ്രാമസഭാ തീയതി ഉടൻ അറിയിക്കും
              </h2>
              <p className="text-sm text-[#637067] leading-relaxed">
                വാർഡ് 19-ലെ അടുത്ത ഗ്രാമസഭയുടെ തീയതിയും വേദിയും പഞ്ചായത്ത് തീരുമാനിക്കുന്ന മുറയ്ക്ക് ഇവിടെ പ്രസിദ്ധീകരിക്കുന്നതാണ്. വാർഡിലെ വികസന വിഷയങ്ങൾ താഴെ നൽകിയിട്ടുള്ള ഫോം വഴി ഇപ്പോൾ തന്നെ വാർഡ് മെമ്പറെ നേരിട്ട് അറിയിക്കാവുന്നതാണ്.
              </p>
            </section>
          )}

          {/* Form: "വിഷയം ഉന്നയിക്കുക" (Limit 3 per device/day) */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E2D6] shadow-2xs space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[#141E18]">
                ഗ്രാമസഭയിൽ വിഷയം ഉന്നയിക്കുക
              </h2>
              <p className="text-sm text-[#637067] mt-0.5">
                വാർഡ് വികസനവുമായി ബന്ധപ്പെട്ട് ഗ്രാമസഭയിൽ ചർച്ച ചെയ്യേണ്ട വിഷയങ്ങൾ വാർഡ് മെമ്പറെ നേരിട്ട് അറിയിക്കാം (പരമാവധി 3 വിഷയങ്ങൾ).
              </p>
            </div>

            {pointSubmittedSuccess && (
              <div className="bg-[#E5F3EB] text-[#0E5135] p-4 rounded-2xl text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>നിങ്ങളുടെ വിഷയം വിജയകരമായി സമർപ്പിച്ചു. വാർഡ് മെമ്പർ പരിശോധിക്കുന്നതാണ്.</span>
              </div>
            )}

            {submitError && (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPoint} className="space-y-3.5">
              <div>
                <label className="block text-sm font-bold text-[#141E18] mb-1">
                  നിങ്ങളുടെ പേര് (ഐച്ഛികം)
                </label>
                <input
                  type="text"
                  value={pointName}
                  onChange={(e) => setPointName(e.target.value)}
                  placeholder="പേര് നൽകാം"
                  className="w-full min-h-[48px] px-4 py-2.5 bg-white border border-[#DED9CA] rounded-2xl text-base text-[#141E18] focus:outline-none focus:border-[#0E5135]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#141E18] mb-1">
                  ഫോൺ നമ്പർ (ഐച്ഛികം)
                </label>
                <input
                  type="tel"
                  value={pointPhone}
                  onChange={(e) => setPointPhone(e.target.value)}
                  placeholder="10 അക്ക മൊബൈൽ നമ്പർ"
                  className="w-full min-h-[48px] px-4 py-2.5 bg-white border border-[#DED9CA] rounded-2xl text-base text-[#141E18] focus:outline-none focus:border-[#0E5135]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-bold text-[#141E18]">
                    ചർച്ച ചെയ്യേണ്ട വിഷയം *
                  </label>
                  <span className="text-xs text-[#637067]">
                    {pointSubject.length}/500
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={500}
                  required
                  value={pointSubject}
                  onChange={(e) => setPointSubject(e.target.value)}
                  placeholder="വാർഡിലെ റോഡ്, കുടിവെള്ളം, ശുചിത്വം മുതലായ നിർദ്ദേശങ്ങൾ ഇവിടെ രേഖപ്പെടുത്തുക..."
                  className="w-full p-4 bg-white border border-[#DED9CA] rounded-2xl text-base text-[#141E18] focus:outline-none focus:border-[#0E5135]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !pointSubject.trim()}
                className="w-full min-h-[52px] py-3 px-6 rounded-full bg-[#0E5135] hover:bg-[#146643] disabled:opacity-50 text-white font-bold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4 shrink-0" />
                <span>{isSubmitting ? 'സമർപ്പിക്കുന്നു...' : 'വിഷയം സമർപ്പിക്കുക'}</span>
              </button>
            </form>
          </section>

          {/* Past Gram Sabhas List with Decisions & Minutes */}
          <div className="space-y-3.5">
            <h2 className="text-xl font-bold text-[#141E18] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0E5135]" />
              <span>കഴിഞ്ഞ ഗ്രാമസഭകളും തീരുമാനങ്ങളും</span>
            </h2>

            {pastGramSabhas.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-[#E6E2D6]">
                <p className="text-base text-[#637067]">
                  മുൻ ഗ്രാമസഭാ വിവരങ്ങൾ രേഖപ്പെടുത്തിയിട്ടില്ല
                </p>
              </div>
            ) : (
              pastGramSabhas.map((gs) => {
                const downloadMinutesUrl = gs.minutesDriveUrl
                  ? getDriveDownloadUrl(gs.minutesDriveUrl)
                  : '';

                return (
                  <article
                    key={gs.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E2D6] shadow-2xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-bold text-[#7A5413]">
                        {gs.date} · {gs.time}
                      </div>
                      {typeof gs.attendanceCount === 'number' && gs.attendanceCount > 0 && (
                        <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#E8F2EC] text-[#0E5135]">
                          പങ്കെടുത്തവർ: {gs.attendanceCount} പേർ
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-[#637067] flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>{gs.venue}</span>
                    </div>

                    {gs.decisions && (
                      <div className="bg-[#FAF8F2] rounded-2xl p-4 border border-[#EAE6DA] space-y-1">
                        <div className="text-xs font-bold text-[#7A5413] uppercase">
                          തീരുമാനങ്ങൾ
                        </div>
                        <p className="text-base text-[#141E18] leading-relaxed break-words whitespace-pre-line">
                          {gs.decisions}
                        </p>
                      </div>
                    )}

                    {/* Minutes Google Drive Download Button */}
                    {gs.minutesDriveUrl && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <a
                          href={gs.minutesDriveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[42px] px-4 py-2 rounded-full border border-[#0E5135] text-[#0E5135] hover:bg-[#E8F2EC] font-bold text-sm inline-flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 shrink-0" />
                          <span>മിനിറ്റ്സ് കാണുക</span>
                        </a>

                        <a
                          href={downloadMinutesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[42px] px-4 py-2 rounded-full border border-[#D6A13C] text-[#7A5413] hover:bg-[#FDF9EE] font-bold text-sm inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-4 h-4 shrink-0" />
                          <span>ഡൗൺലോഡ്</span>
                        </a>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for individual Event card
function EventCard({
  event,
  onShare,
  copied,
}: {
  event: EventItem;
  onShare: () => void;
  copied: boolean;
}) {
  const googleCalUrl = getGoogleCalendarUrl(event);

  return (
    <article className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E2D6] shadow-2xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#E8F2EC] text-[#0E5135]">
          {event.category}
        </span>
        <span className="text-sm font-bold text-[#7A5413]">
          {event.date}
        </span>
      </div>

      <h3 className="text-xl font-bold text-[#141E18] leading-snug break-words">
        {event.title}
      </h3>

      <div className="space-y-1 text-sm text-[#637067]">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#7A5413] shrink-0" />
          <span>{event.startTime} – {event.endTime}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#7A5413] shrink-0" />
          <span>{event.venue}</span>
        </div>
      </div>

      <p className="text-base text-[#4A554E] leading-relaxed break-words whitespace-pre-line">
        {event.description}
      </p>

      {/* Action Buttons: Add to Calendar (.ics & Google Cal), Share WhatsApp, View Maps */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F0ECE1]">
        {/* .ICS Download Button */}
        <button
          type="button"
          onClick={() => downloadEventIcs(event)}
          className="min-h-[42px] px-3.5 py-1.5 rounded-full bg-[#0E5135] text-white font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 hover:bg-[#146643] transition-colors cursor-pointer"
        >
          <CalendarPlus className="w-4 h-4 shrink-0" />
          <span>ഫോൺ കലണ്ടറിൽ ചേർക്കുക</span>
        </button>

        {/* Google Calendar Link */}
        <a
          href={googleCalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[42px] px-3.5 py-1.5 rounded-full border border-[#D6A13C] text-[#7A5413] hover:bg-[#FDF9EE] font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-colors"
        >
          <CalendarIcon className="w-4 h-4 shrink-0" />
          <span>ഗൂഗിൾ കലണ്ടർ</span>
        </a>

        {/* Maps Link */}
        {event.mapsUrl && (
          <a
            href={event.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[42px] px-3.5 py-1.5 rounded-full border border-[#DED9CA] text-[#141E18] hover:bg-[#FAF8F2] font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-colors"
          >
            <MapPin className="w-4 h-4 shrink-0 text-[#0E5135]" />
            <span>സ്ഥലം കാണുക</span>
          </a>
        )}

        {/* WhatsApp Share */}
        <button
          type="button"
          onClick={onShare}
          className="min-h-[42px] px-3.5 py-1.5 rounded-full border border-[#0E5135] text-[#0E5135] hover:bg-[#E8F2EC] font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
        >
          <Share2 className="w-4 h-4 shrink-0" />
          <span>{copied ? 'പകർത്തി!' : 'പങ്കിടുക'}</span>
        </button>
      </div>
    </article>
  );
}
