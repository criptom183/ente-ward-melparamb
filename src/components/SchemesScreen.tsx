import React, { useState } from 'react';
import { ChevronLeft, Search, ChevronUp, ChevronDown, FileText, Download, ExternalLink, ArrowRight } from 'lucide-react';
import { Language, Scheme, FormItem } from '../types/ward';
import { getDriveDownloadUrl } from '../utils/driveLinks';

interface SchemesScreenProps {
  lang: Language;
  schemes: Scheme[];
  forms: FormItem[];
  onBack: () => void;
}

const FORM_CATEGORIES = [
  'എല്ലാം',
  'സർട്ടിഫിക്കറ്റുകൾ',
  'പെൻഷൻ',
  'റേഷൻ കാർഡ്',
  'ഭവനം',
  'ആരോഗ്യം',
  'മറ്റുള്ളവ',
];

export const SchemesScreen: React.FC<SchemesScreenProps> = ({
  schemes,
  forms,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'schemes' | 'forms'>('schemes');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(
    schemes[0]?.id ?? null
  );
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);
  const [selectedFormCategory, setSelectedFormCategory] = useState<string>('എല്ലാം');

  // Filter schemes
  const filteredSchemes = schemes.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.titleMl || '').toLowerCase().includes(q) ||
      (s.title || '').toLowerCase().includes(q) ||
      (s.eligibilityMl || '').toLowerCase().includes(q) ||
      (s.documentsNeededMl || '').toLowerCase().includes(q)
    );
  });

  // Filter forms
  const filteredForms = forms.filter((f) => {
    const matchesCategory =
      selectedFormCategory === 'എല്ലാം' ? true : f.category === selectedFormCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      f.title.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.officeToSubmit.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleOpenLinkedForm = (formId: string) => {
    setActiveTab('forms');
    setExpandedFormId(formId);
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
        <h1 className="text-2xl sm:text-3xl font-bold text-[#141E18] break-words">
          {activeTab === 'schemes' ? 'പദ്ധതികൾ' : 'ഫോമുകൾ'}
        </h1>
      </div>

      {/* Main Tabs (പദ്ധതികൾ / ഫോമുകൾ) */}
      <div className="flex bg-[#EAE6DA] p-1 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab('schemes');
            setSearchQuery('');
          }}
          className={`flex-1 min-h-[48px] py-2 px-4 rounded-xl font-bold text-base transition-all cursor-pointer ${
            activeTab === 'schemes'
              ? 'bg-white text-[#0E5135] shadow-xs'
              : 'text-[#637067] hover:text-[#141E18]'
          }`}
        >
          പദ്ധതികൾ
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('forms');
            setSearchQuery('');
          }}
          className={`flex-1 min-h-[48px] py-2 px-4 rounded-xl font-bold text-base transition-all cursor-pointer ${
            activeTab === 'forms'
              ? 'bg-white text-[#0E5135] shadow-xs'
              : 'text-[#637067] hover:text-[#141E18]'
          }`}
        >
          ഫോമുകൾ
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-[#637067] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'schemes' ? 'പദ്ധതികൾ തിരയുക' : 'ഫോമുകൾ തിരയുക'}
          className="w-full min-h-[54px] pl-12 pr-5 py-3 bg-white border border-[#DED9CA] rounded-full text-base text-[#141E18] placeholder:text-[#637067] focus:outline-none focus:border-[#0E5135]"
        />
      </div>

      {/* TAB 1: SCHEMES (Unchanged content + optional linked form button) */}
      {activeTab === 'schemes' && (
        <div className="space-y-3.5">
          {filteredSchemes.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#E6E2D6]">
              <p className="text-lg font-bold text-[#141E18]">
                തിരച്ചിലിന് അനുയോജ്യമായ പദ്ധതികൾ കണ്ടെത്തിയില്ല
              </p>
            </div>
          ) : (
            filteredSchemes.map((scheme) => {
              const primaryTitle = scheme.titleMl || scheme.title;
              const elig = scheme.eligibilityMl || scheme.eligibility;
              const docs = scheme.documentsNeededMl || scheme.documentsNeeded;
              const apply = scheme.howToApplyMl || scheme.howToApply;
              const isExpanded = expandedSchemeId === scheme.id;

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
                    onClick={() => setExpandedSchemeId(isExpanded ? null : scheme.id)}
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

                      {/* Optional linked form button */}
                      {scheme.formId && (
                        <div className="pt-2 border-t border-[#F0ECE1]">
                          <button
                            type="button"
                            onClick={() => handleOpenLinkedForm(scheme.formId!)}
                            className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#E8F2EC] hover:bg-[#D5E9DE] text-[#0E5135] font-bold text-base inline-flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4 shrink-0" />
                            <span>അപേക്ഷാ ഫോം കാണുക</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: FORMS (New tab for downloadable forms) */}
      {activeTab === 'forms' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div
            role="tablist"
            aria-label="ഫോം വിഭാഗങ്ങൾ"
            className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
          >
            {FORM_CATEGORIES.map((cat) => {
              const active = selectedFormCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedFormCategory(cat)}
                  className={`min-h-[44px] px-4 py-2 rounded-full text-sm sm:text-base font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    active
                      ? 'bg-[#0E5135] text-white'
                      : 'bg-white border border-[#DED9CA] text-[#141E18] hover:bg-[#F3F0E6]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {filteredForms.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#E6E2D6] space-y-2">
              <FileText className="w-12 h-12 text-[#0E5135] mx-auto mb-3 opacity-70" />
              <h2 className="text-xl font-bold text-[#141E18]">
                {searchQuery || selectedFormCategory !== 'എല്ലാം'
                  ? 'തിരച്ചിലിന് അനുയോജ്യമായ ഫോമുകൾ കണ്ടെത്തിയില്ല'
                  : 'ഔദ്യോഗിക അപേക്ഷാ ഫോമുകൾ ഉടൻ ലഭ്യമാക്കും'}
              </h2>
              <p className="text-sm text-[#637067] max-w-md mx-auto">
                വാർഡ് തല അപേക്ഷാ ഫോമുകൾ അഡ്മിൻ പാനൽ വഴി ഉടൻ ലഭ്യമാക്കുന്നതാണ്. സർട്ടിഫിക്കറ്റുകൾക്കും പെൻഷൻ സേവനങ്ങൾക്കുമായി മേൽപ്പറമ്പ അക്ഷയ കേന്ദ്രവുമായോ (9544543875) കെ-സ്മാർട്ട് പോർട്ടൽ വഴിയോ നേരിട്ട് അപേക്ഷിക്കാവുന്നതാണ്.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredForms.map((form) => {
                const isExpanded = expandedFormId === form.id;
                const downloadUrl = getDriveDownloadUrl(form.driveUrl);

                return (
                  <div
                    key={form.id}
                    className={`bg-white transition-all ${
                      isExpanded
                        ? 'rounded-3xl border-2 border-[#0E5135] p-5 sm:p-6 space-y-4'
                        : 'rounded-2xl border border-[#E6E2D6] p-5'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFormId(isExpanded ? null : form.id)}
                      className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
                    >
                      <div>
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-[#E8F2EC] text-[#0E5135] mb-1.5">
                          {form.category}
                        </span>
                        <h2 className="text-lg sm:text-xl font-bold text-[#141E18] leading-snug break-words">
                          {form.title}
                        </h2>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-[#141E18] shrink-0" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-[#141E18] shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="space-y-4 pt-1 border-t border-[#F0ECE1]">
                        {form.description && (
                          <p className="text-base text-[#4A554E] leading-relaxed break-words">
                            {form.description}
                          </p>
                        )}

                        {/* Documents Needed */}
                        {form.documentsNeeded && form.documentsNeeded.length > 0 && (
                          <div>
                            <div className="text-sm font-bold text-[#7A5413]">
                              ആവശ്യമായ രേഖകൾ
                            </div>
                            <ul className="mt-1.5 space-y-1 list-disc list-inside text-base text-[#141E18]">
                              {form.documentsNeeded.map((docItem, idx) => (
                                <li key={idx} className="break-words">
                                  {docItem}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Steps */}
                        {form.steps && form.steps.length > 0 && (
                          <div>
                            <div className="text-sm font-bold text-[#7A5413]">
                              നടപടിക്രമങ്ങൾ
                            </div>
                            <ol className="mt-1.5 space-y-1.5 list-decimal list-inside text-base text-[#141E18]">
                              {form.steps.map((stepItem, idx) => (
                                <li key={idx} className="break-words">
                                  {stepItem}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Fee and Office Info */}
                        <div className="bg-[#FAF8F2] rounded-2xl p-4 border border-[#EAE6DA] space-y-2 text-sm sm:text-base">
                          {form.fee && (
                            <div>
                              <span className="font-bold text-[#7A5413]">ഫീസ്: </span>
                              <span className="text-[#141E18]">{form.fee}</span>
                            </div>
                          )}
                          {form.officeToSubmit && (
                            <div>
                              <span className="font-bold text-[#7A5413]">എവിടെ സമർപ്പിക്കണം: </span>
                              <span className="text-[#141E18]">{form.officeToSubmit}</span>
                            </div>
                          )}
                        </div>

                        {/* Drive Action Buttons */}
                        {form.driveUrl && (
                          <div className="flex flex-wrap items-center gap-3 pt-2">
                            <a
                              href={form.driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[46px] px-5 py-2.5 rounded-full bg-[#0E5135] hover:bg-[#146643] text-white font-bold text-sm sm:text-base inline-flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-4 h-4 shrink-0" />
                              <span>ഫോം കാണുക</span>
                            </a>

                            <a
                              href={downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[46px] px-5 py-2.5 rounded-full border-2 border-[#D6A13C] text-[#7A5413] hover:bg-[#FDF9EE] font-bold text-sm sm:text-base inline-flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Download className="w-4 h-4 shrink-0" />
                              <span>ഡൗൺലോഡ് ചെയ്യുക</span>
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
