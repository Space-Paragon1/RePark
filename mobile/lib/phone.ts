// Phone numbers for sign-in. Same as web/lib/phone.ts.

export type Country = { code: string; name: string; dial: string };

/** Countries for the country button. `dial` without the plus. */
export const COUNTRIES: Country[] = [
  { code: 'AR', name: 'Argentina', dial: '54' },
  { code: 'AU', name: 'Australia', dial: '61' },
  { code: 'AT', name: 'Austria', dial: '43' },
  { code: 'BD', name: 'Bangladesh', dial: '880' },
  { code: 'BE', name: 'Belgium', dial: '32' },
  { code: 'BR', name: 'Brazil', dial: '55' },
  { code: 'CM', name: 'Cameroon', dial: '237' },
  { code: 'CA', name: 'Canada', dial: '1' },
  { code: 'CL', name: 'Chile', dial: '56' },
  { code: 'CN', name: 'China', dial: '86' },
  { code: 'CO', name: 'Colombia', dial: '57' },
  { code: 'CI', name: "Côte d'Ivoire", dial: '225' },
  { code: 'CZ', name: 'Czechia', dial: '420' },
  { code: 'DK', name: 'Denmark', dial: '45' },
  { code: 'EG', name: 'Egypt', dial: '20' },
  { code: 'ET', name: 'Ethiopia', dial: '251' },
  { code: 'FI', name: 'Finland', dial: '358' },
  { code: 'FR', name: 'France', dial: '33' },
  { code: 'DE', name: 'Germany', dial: '49' },
  { code: 'GH', name: 'Ghana', dial: '233' },
  { code: 'GR', name: 'Greece', dial: '30' },
  { code: 'HK', name: 'Hong Kong', dial: '852' },
  { code: 'HU', name: 'Hungary', dial: '36' },
  { code: 'IN', name: 'India', dial: '91' },
  { code: 'ID', name: 'Indonesia', dial: '62' },
  { code: 'IE', name: 'Ireland', dial: '353' },
  { code: 'IL', name: 'Israel', dial: '972' },
  { code: 'IT', name: 'Italy', dial: '39' },
  { code: 'JM', name: 'Jamaica', dial: '1' },
  { code: 'JP', name: 'Japan', dial: '81' },
  { code: 'KE', name: 'Kenya', dial: '254' },
  { code: 'MY', name: 'Malaysia', dial: '60' },
  { code: 'MX', name: 'Mexico', dial: '52' },
  { code: 'MA', name: 'Morocco', dial: '212' },
  { code: 'NL', name: 'Netherlands', dial: '31' },
  { code: 'NZ', name: 'New Zealand', dial: '64' },
  { code: 'NG', name: 'Nigeria', dial: '234' },
  { code: 'NO', name: 'Norway', dial: '47' },
  { code: 'PK', name: 'Pakistan', dial: '92' },
  { code: 'PE', name: 'Peru', dial: '51' },
  { code: 'PH', name: 'Philippines', dial: '63' },
  { code: 'PL', name: 'Poland', dial: '48' },
  { code: 'PT', name: 'Portugal', dial: '351' },
  { code: 'QA', name: 'Qatar', dial: '974' },
  { code: 'RO', name: 'Romania', dial: '40' },
  { code: 'RW', name: 'Rwanda', dial: '250' },
  { code: 'SA', name: 'Saudi Arabia', dial: '966' },
  { code: 'SN', name: 'Senegal', dial: '221' },
  { code: 'SG', name: 'Singapore', dial: '65' },
  { code: 'ZA', name: 'South Africa', dial: '27' },
  { code: 'KR', name: 'South Korea', dial: '82' },
  { code: 'ES', name: 'Spain', dial: '34' },
  { code: 'LK', name: 'Sri Lanka', dial: '94' },
  { code: 'SE', name: 'Sweden', dial: '46' },
  { code: 'CH', name: 'Switzerland', dial: '41' },
  { code: 'TZ', name: 'Tanzania', dial: '255' },
  { code: 'TH', name: 'Thailand', dial: '66' },
  { code: 'TT', name: 'Trinidad and Tobago', dial: '1' },
  { code: 'TR', name: 'Türkiye', dial: '90' },
  { code: 'UG', name: 'Uganda', dial: '256' },
  { code: 'UA', name: 'Ukraine', dial: '380' },
  { code: 'AE', name: 'United Arab Emirates', dial: '971' },
  { code: 'GB', name: 'United Kingdom', dial: '44' },
  { code: 'US', name: 'United States', dial: '1' },
  { code: 'VN', name: 'Vietnam', dial: '84' },
  { code: 'ZW', name: 'Zimbabwe', dial: '263' },
];

const US = COUNTRIES.find(c => c.code === 'US')!;

/** The country for a locale such as "en-GB", or the US. */
export function defaultCountry(locale?: string): Country {
  const region = locale?.split(/[-_]/)[1]?.toUpperCase();
  return COUNTRIES.find(c => c.code === region) ?? US;
}

/** Digits of the national number, without a leading trunk 0 outside +1 countries. */
function nationalDigits(input: string, dial: string): string {
  const digits = input.replace(/\D/g, '');
  return dial === '1' ? digits : digits.replace(/^0/, '');
}

/** "415 555 0123" for +1; groups of three, then up to four, elsewhere. */
export function formatNational(input: string, dial: string): string {
  const raw = input.replace(/\D/g, '').slice(0, 15);
  if (dial === '1') {
    const d = raw.slice(0, 10);
    return [d.slice(0, 3), d.slice(3, 6), d.slice(6)].filter(Boolean).join(' ');
  }
  const groups: string[] = [];
  let rest = raw;
  while (rest.length > 4) {
    groups.push(rest.slice(0, 3));
    rest = rest.slice(3);
  }
  if (rest) groups.push(rest);
  return groups.join(' ');
}

/** "+14155550123", or null while the number is too short or too long. */
export function toE164(country: Country, input: string): string | null {
  const national = nationalDigits(input, country.dial);
  const ok = country.dial === '1' ? national.length === 10 : national.length >= 6 && national.length <= 12;
  return ok ? `+${country.dial}${national}` : null;
}

/** "+1 ••• ••• 0123" */
export function maskPhone(e164: string, country?: Country): string {
  const digits = e164.replace(/\D/g, '');
  const dial = country?.dial ?? (digits.startsWith('1') ? '1' : digits.slice(0, 2));
  return `+${dial} ••• ••• ${digits.slice(-4)}`;
}
