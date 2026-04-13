/** 常用国家/地区（ISO2，表单与筛选） */
export const COUNTRY_OPTIONS: { code: string; nameZh: string; nameEn: string }[] = [
  { code: 'CN', nameZh: '中国', nameEn: 'China' },
  { code: 'US', nameZh: '美国', nameEn: 'United States' },
  { code: 'GB', nameZh: '英国', nameEn: 'United Kingdom' },
  { code: 'DE', nameZh: '德国', nameEn: 'Germany' },
  { code: 'FR', nameZh: '法国', nameEn: 'France' },
  { code: 'JP', nameZh: '日本', nameEn: 'Japan' },
  { code: 'KR', nameZh: '韩国', nameEn: 'South Korea' },
  { code: 'CA', nameZh: '加拿大', nameEn: 'Canada' },
  { code: 'AU', nameZh: '澳大利亚', nameEn: 'Australia' },
  { code: 'MX', nameZh: '墨西哥', nameEn: 'Mexico' },
  { code: 'BR', nameZh: '巴西', nameEn: 'Brazil' },
  { code: 'IN', nameZh: '印度', nameEn: 'India' },
  { code: 'VN', nameZh: '越南', nameEn: 'Vietnam' },
  { code: 'TH', nameZh: '泰国', nameEn: 'Thailand' },
  { code: 'MY', nameZh: '马来西亚', nameEn: 'Malaysia' },
  { code: 'SG', nameZh: '新加坡', nameEn: 'Singapore' },
  { code: 'NL', nameZh: '荷兰', nameEn: 'Netherlands' },
  { code: 'IT', nameZh: '意大利', nameEn: 'Italy' },
  { code: 'ES', nameZh: '西班牙', nameEn: 'Spain' },
  { code: 'PL', nameZh: '波兰', nameEn: 'Poland' }
];

export const US_STATE_OPTIONS: { label: string; value: string }[] = [
  { label: 'AL', value: 'AL' },
  { label: 'AK', value: 'AK' },
  { label: 'AZ', value: 'AZ' },
  { label: 'AR', value: 'AR' },
  { label: 'CA', value: 'CA' },
  { label: 'CO', value: 'CO' },
  { label: 'CT', value: 'CT' },
  { label: 'DE', value: 'DE' },
  { label: 'FL', value: 'FL' },
  { label: 'GA', value: 'GA' },
  { label: 'IL', value: 'IL' },
  { label: 'IN', value: 'IN' },
  { label: 'KS', value: 'KS' },
  { label: 'KY', value: 'KY' },
  { label: 'LA', value: 'LA' },
  { label: 'MA', value: 'MA' },
  { label: 'MD', value: 'MD' },
  { label: 'MI', value: 'MI' },
  { label: 'MN', value: 'MN' },
  { label: 'MO', value: 'MO' },
  { label: 'NJ', value: 'NJ' },
  { label: 'NY', value: 'NY' },
  { label: 'NC', value: 'NC' },
  { label: 'OH', value: 'OH' },
  { label: 'OR', value: 'OR' },
  { label: 'PA', value: 'PA' },
  { label: 'TN', value: 'TN' },
  { label: 'TX', value: 'TX' },
  { label: 'WA', value: 'WA' },
  { label: 'WI', value: 'WI' }
];

export function countryFlagEmoji(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return '🏳️';
  const A = 0x1f1e6;
  const upper = iso2.toUpperCase();
  const chars = [...upper];
  if (chars.some(c => c < 'A' || c > 'Z')) return '🏳️';
  return String.fromCodePoint(A + (chars[0]!.charCodeAt(0) - 65), A + (chars[1]!.charCodeAt(0) - 65));
}

export function getCountryLabel(code: string, locale: App.I18n.LangType): string {
  const row = COUNTRY_OPTIONS.find(c => c.code === code);
  if (!row) return code;
  return locale === 'zh-CN' ? row.nameZh : row.nameEn;
}
