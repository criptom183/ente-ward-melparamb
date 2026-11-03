/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bell,
  Phone,
  FileText,
  BookOpen,
  AlertTriangle,
  ChevronRight,
  User,
  WifiOff,
} from 'lucide-react';
import { useWardViewModel } from './viewmodels/useWardViewModel';
import { AppScreen } from './types/ward';
import { NoticesScreen } from './components/NoticesScreen';
import { ContactsScreen } from './components/ContactsScreen';
import { ReportProblemScreen } from './components/ReportProblemScreen';
import { SchemesScreen } from './components/SchemesScreen';
import { DirectoryScreen } from './components/DirectoryScreen';
import { AboutAndRulesScreen } from './components/AboutAndRulesScreen';
import { AdminDashboardScreen } from './components/AdminDashboardScreen';

export default function App() {
  const vm = useWardViewModel();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');

  const {
    lang,
    wardInfo,
    notices,
    contacts,
    schemes,
    directory,
    publicStatuses,
  } = vm;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#FAF8F2] text-[#141E18]">
      {/* Offline Cache Notification Banner */}
      {vm.isOffline && (
        <div className="bg-amber-900 text-white px-4 py-2.5 text-center text-sm font-semibold flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span className="break-words">
            ഇന്റർനെറ്റ് ഇല്ല — ഓഫ്‌ലൈൻ വിവരങ്ങൾ കാണിക്കുന്നു
          </span>
        </div>
      )}

      {/* Push Notification Broadcast Toast */}
      {vm.pushBanner && (
        <div className="bg-[#0E5135] text-white px-4 py-3 text-center text-sm font-bold flex items-center justify-center gap-2">
          <Bell className="w-4 h-4 shrink-0" />
          <span className="break-words">{vm.pushBanner}</span>
        </div>
      )}

      {/* Centered Mobile-First Container Matching Uploaded UI */}
      <main className="max-w-md w-full mx-auto px-5 py-6 sm:py-8 min-w-0">
        {/* SCREEN 1: HOME SCREEN */}
        {currentScreen === 'home' && (
          <div className="space-y-4">
            {/* Ward Subtitle & Greeting */}
            <header className="pt-1 pb-1">
              <div className="text-sm sm:text-base font-medium text-[#637067] break-words">
                വാർഡ് {wardInfo.wardNumber || 19} ·{' '}
                {wardInfo.panchayatMl || 'ചെമ്മനാട് ഗ്രാമപഞ്ചായത്ത്'}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#141E18] mt-1 tracking-tight">
                നമസ്കാരം
              </h1>
            </header>

            {/* Dark Green Ward Member Hero Card */}
            <section
              aria-label="വാർഡ് മെമ്പർ"
              className="bg-[#0E5135] rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden space-y-5 shadow-xs"
            >
              {/* Subtle Decorative Concentric Circles on Top Right */}
              <div
                aria-hidden="true"
                className="w-44 h-44 rounded-full border border-white/12 absolute -top-16 -right-16 pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="w-64 h-64 rounded-full border border-white/10 absolute -top-24 -right-24 pointer-events-none"
              />

              <div className="flex items-center gap-4 relative z-10 min-w-0">
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
  </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-white leading-snug break-words">
                    {wardInfo.memberNameMl || wardInfo.memberName}
                  </h2>
                  <p className="text-sm sm:text-base text-emerald-100/90 mt-0.5 break-words">
                    {wardInfo.memberRoleMl ||
                      wardInfo.memberRole ||
                      'ഗ്രാമപഞ്ചായത്ത് പ്രസിഡന്റ് · വാർഡ് മെമ്പർ'}
                  </p>
                </div>
              </div>

              <a
                href={`tel:${wardInfo.phone}`}
                className="w-full min-h-[52px] py-3.5 px-4 rounded-full bg-[#24664A]/85 hover:bg-[#24664A] border border-white/25 text-white font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition-colors relative z-10 text-center"
              >
                <Phone className="w-5 h-5 shrink-0" />
                <span className="tabular-nums">
                  വിളിക്കുക · {wardInfo.phone}
                </span>
              </a>
            </section>

            {/* Latest Notice Pill Bar */}
            {notices.length > 0 && (
              <button
                type="button"
                onClick={() => setCurrentScreen('notices')}
                className="w-full bg-white hover:bg-[#F3F0E6] rounded-2xl p-4 sm:p-5 border border-[#E6E2D6] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D6A13C] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#7A5413]">
                      പുതിയ അറിയിപ്പ്
                    </div>
                    <div className="text-base sm:text-lg font-bold text-[#141E18] mt-0.5 truncate">
                      {notices[0].titleMl || notices[0].title}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#141E18] shrink-0" />
              </button>
            )}

            {/* 2x2 Service Cards Grid */}
            <section
              aria-label="സേവനങ്ങൾ"
              className="grid grid-cols-2 gap-3.5 pt-0.5"
            >
              {/* 1. Notices */}
              <button
                type="button"
                onClick={() => setCurrentScreen('notices')}
                className="bg-white hover:bg-[#F3F0E6] active:scale-[0.99] rounded-3xl p-5 border border-[#E6E2D6] flex flex-col justify-between min-h-[156px] text-left transition-all cursor-pointer shadow-2xs"
              >
                <div className="w-12 h-12 rounded-full bg-[#E8F2EC] text-[#0E5135] flex items-center justify-center shrink-0">
                  <Bell className="w-6 h-6" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-[#141E18] leading-snug break-words mt-6">
                  അറിയിപ്പുകൾ
                </div>
              </button>

              {/* 2. Contacts */}
              <button
                type="button"
                onClick={() => setCurrentScreen('contacts')}
                className="bg-white hover:bg-[#F3F0E6] active:scale-[0.99] rounded-3xl p-5 border border-[#E6E2D6] flex flex-col justify-between min-h-[156px] text-left transition-all cursor-pointer shadow-2xs"
              >
                <div className="w-12 h-12 rounded-full bg-[#E8F2EC] text-[#0E5135] flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-[#141E18] leading-snug break-words mt-6">
                  ഫോൺ നമ്പറുകൾ
                </div>
              </button>

              {/* 3. Schemes */}
              <button
                type="button"
                onClick={() => setCurrentScreen('schemes')}
                className="bg-white hover:bg-[#F3F0E6] active:scale-[0.99] rounded-3xl p-5 border border-[#E6E2D6] flex flex-col justify-between min-h-[156px] text-left transition-all cursor-pointer shadow-2xs"
              >
                <div className="w-12 h-12 rounded-full bg-[#E8F2EC] text-[#0E5135] flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-[#141E18] leading-snug break-words mt-6">
                  പദ്ധതികൾ
                </div>
              </button>

              {/* 4. Local Directory */}
              <button
                type="button"
                onClick={() => setCurrentScreen('directory')}
                className="bg-white hover:bg-[#F3F0E6] active:scale-[0.99] rounded-3xl p-5 border border-[#E6E2D6] flex flex-col justify-between min-h-[156px] text-left transition-all cursor-pointer shadow-2xs"
              >
                <div className="w-12 h-12 rounded-full bg-[#E8F2EC] text-[#0E5135] flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-[#141E18] leading-snug break-words mt-6">
                  പ്രാദേശിക ഡയറക്ടറി
                </div>
              </button>
            </section>

            {/* 5. Full-Width Warm Gold Button: Report a Problem ("പരാതി അറിയിക്കുക") */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setCurrentScreen('report')}
                className="w-full min-h-[64px] py-4 px-5 sm:px-6 rounded-3xl bg-[#D6A13C] hover:bg-[#C5902E] active:scale-[0.99] text-[#141E18] font-bold text-lg sm:text-xl flex items-center justify-between gap-3 transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AlertTriangle className="w-6 h-6 text-[#141E18] shrink-0" />
                  <span className="break-words">പരാതി അറിയിക്കുക</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#141E18] shrink-0" />
              </button>
            </div>

            {/* Check Complaint Status Link ("പരാതിയുടെ സ്ഥിതി അറിയാം") */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('status')}
                className="text-[#0E5135] font-bold text-base sm:text-lg underline underline-offset-4 cursor-pointer"
              >
                പരാതിയുടെ സ്ഥിതി അറിയാം
              </button>
            </div>

            {/* Footer: About link */}
            <footer className="text-center pt-4 pb-2 text-sm text-[#637067]">
              <button
                type="button"
                onClick={() => setCurrentScreen('about')}
                className="hover:text-[#141E18] cursor-pointer"
              >
                ആപ്പിനെക്കുറിച്ച്
              </button>
            </footer>
          </div>
        )}

        {/* INNER SCREENS */}
        {currentScreen === 'notices' && (
          <NoticesScreen
            lang={lang}
            notices={notices}
            isLoading={vm.isLoading}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'contacts' && (
          <ContactsScreen
            lang={lang}
            wardInfo={wardInfo}
            contacts={contacts}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {(currentScreen === 'report' || currentScreen === 'status') && (
          <ReportProblemScreen
            lang={lang}
            initialMode={currentScreen === 'status' ? 'status' : 'form'}
            publicStatuses={publicStatuses}
            hasSubmittedToday={vm.hasSubmittedToday}
            resetDailyLimitForTesting={vm.resetDailyLimitForTesting}
            submitComplaint={vm.submitComplaint}
            lookupComplaintStatus={vm.lookupComplaintStatus}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'schemes' && (
          <SchemesScreen
            lang={lang}
            schemes={schemes}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'directory' && (
          <DirectoryScreen
            lang={lang}
            directory={directory}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'about' && (
          <AboutAndRulesScreen
            lang={lang}
            wardInfo={wardInfo}
            onUnlockAdminPortal={() => setCurrentScreen('admin')}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'admin' && (
          <AdminDashboardScreen
            lang={lang}
            currentUser={vm.currentUser}
            isAdmin={vm.isAdmin}
            wardInfo={wardInfo}
            notices={notices}
            contacts={contacts}
            schemes={schemes}
            directory={directory}
            adminComplaints={vm.adminComplaints}
            publicStatuses={publicStatuses}
            signInAdminWithEmail={vm.signInAdminWithEmail}
            registerAdminWithEmail={vm.registerAdminWithEmail}
            signInAdminWithGoogle={vm.signInAdminWithGoogle}
            signOutAdmin={vm.signOutAdmin}
            saveNotice={vm.saveNotice}
            deleteNotice={vm.deleteNotice}
            saveContact={vm.saveContact}
            deleteContact={vm.deleteContact}
            saveScheme={vm.saveScheme}
            deleteScheme={vm.deleteScheme}
            saveDirectoryEntry={vm.saveDirectoryEntry}
            deleteDirectoryEntry={vm.deleteDirectoryEntry}
            saveWardInfo={vm.saveWardInfo}
            updateComplaintStatusAndRemark={vm.updateComplaintStatusAndRemark}
            deleteSpamComplaint={vm.deleteSpamComplaint}
            addAdminByUid={vm.addAdminByUid}
            onBack={() => setCurrentScreen('home')}
          />
        )}
      </main>
    </div>
  );
}
