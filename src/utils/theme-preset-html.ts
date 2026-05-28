import { localStg } from '@/utils/storage';

const PREFIX = 'theme-preset-';

/** 与 `src/theme/preset/*.json` 文件名对应的 html 类名前缀，用于附加全局样式 */
export function syncThemePresetHtmlClass(presetId: string | null | undefined) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  Array.from(el.classList)
    .filter(c => c.startsWith(PREFIX))
    .forEach(c => el.classList.remove(c));
  if (presetId) el.classList.add(`${PREFIX}${presetId}`);
}

export function persistThemeActivePresetId(presetId: string | null | undefined) {
  if (presetId) localStg.set('themeActivePresetId', presetId);
  else localStg.remove('themeActivePresetId');
}

export function readThemeActivePresetId(): string | null {
  return localStg.get('themeActivePresetId') ?? null;
}
