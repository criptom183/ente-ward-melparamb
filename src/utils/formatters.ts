/**
 * Malayalam date, currency, and Indian number formatting utilities.
 */

export const ML_WEEKDAYS_SHORT = ['ഞായർ', 'തിങ്കൾ', 'ചൊവ്വ', 'ബുധൻ', 'വ്യാഴം', 'വെള്ളി', 'ശനി'];
export const ML_WEEKDAYS_FULL = [
  'ഞായറാഴ്ച',
  'തിങ്കളാഴ്ച',
  'ചൊവ്വാഴ്ച',
  'ബുധനാഴ്ച',
  'വ്യാഴാഴ്ച',
  'വെള്ളിയാഴ്ച',
  'ശനിയാഴ്ച',
];

export const ML_MONTHS = [
  'ജനുവരി',
  'ഫെബ്രുവരി',
  'മാർച്ച്',
  'ഏപ്രിൽ',
  'മെയ്',
  'ജൂൺ',
  'ജൂലൈ',
  'ആഗസ്റ്റ്',
  'സെപ്റ്റംബർ',
  'ഒക്ടോബർ',
  'നവംബർ',
  'ഡിസംബർ',
];

/**
 * Format amount into Indian Rupee Lakhs format.
 * E.g., 1800000 => "₹18.00 ലക്ഷം"
 */
export function formatRupeesLakhs(amount: number): string {
  if (!amount || isNaN(amount)) return '₹0 ലക്ഷം';
  const lakhs = amount / 100000;
  if (lakhs >= 1) {
    return `₹${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(2)} ലക്ഷം`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Format number into standard Indian comma grouping (e.g. 18,00,000)
 */
export function formatIndianNumber(num: number): string {
  if (!num || isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
}

/**
 * Calculates remaining days from today until target date (YYYY-MM-DD).
 */
export function getDaysRemaining(targetDateStr: string): number {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}
