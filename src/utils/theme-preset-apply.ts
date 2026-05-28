import { defu } from 'defu';
import { useThemeStore } from '@/store/modules/theme';
import { themeSettings } from '@/theme/settings';
import { persistThemeActivePresetId, syncThemePresetHtmlClass } from '@/utils/theme-preset-html';
import { $t } from '@/locales';

/** 与 `theme/preset/*.json` + 文件 id 对齐，用于合并进 `themeSettings` */
export type ThemePresetApplyPayload = Pick<
  App.Theme.ThemeSetting,
  | 'themeScheme'
  | 'grayscale'
  | 'colourWeakness'
  | 'recommendColor'
  | 'themeColor'
  | 'themeRadius'
  | 'otherColor'
  | 'isInfoFollowPrimary'
  | 'layout'
  | 'page'
  | 'header'
  | 'tab'
  | 'fixedHeaderAndTab'
  | 'sider'
  | 'footer'
  | 'watermark'
  | 'tokens'
  | 'table'
> & {
  name: string;
  desc: string;
  i18nkey?: string;
  version: string;
  sort: number;
  naiveui?: App.Theme.NaiveUIThemeOverride;
  id?: string;
};

/**
 * 应用主题预设（与「预设」Tab 中「应用」逻辑一致）
 */
export function applyThemePreset(preset: ThemePresetApplyPayload & { id?: string }, options?: { silent?: boolean }) {
  const themeStore = useThemeStore();
  const mergedPreset = defu(preset, themeSettings) as ThemePresetApplyPayload & { id?: string };
  const {
    id: _presetFileId,
    name: _presetName,
    desc: _presetDesc,
    i18nkey: _presetI18n,
    version: _presetVer,
    sort: _presetSort,
    themeScheme,
    grayscale,
    colourWeakness,
    layout,
    watermark,
    naiveui,
    ...rest
  } = mergedPreset;

  themeStore.setThemeScheme(themeScheme);
  themeStore.setGrayscale(grayscale);
  themeStore.setColourWeakness(colourWeakness);
  themeStore.setThemeLayout(layout.mode);
  themeStore.setWatermarkEnableUserName(watermark.enableUserName);
  themeStore.setWatermarkEnableTime(watermark.enableTime);

  Object.assign(themeStore, {
    ...rest,
    layout: { ...themeStore.layout, scrollMode: layout.scrollMode },
    page: { ...rest.page },
    header: { ...rest.header },
    tab: { ...rest.tab },
    sider: { ...rest.sider },
    footer: { ...rest.footer },
    watermark: { ...watermark },
    tokens: { ...rest.tokens }
  });

  themeStore.setNaiveThemeOverrides(naiveui);

  const pid = preset.id ?? null;
  persistThemeActivePresetId(pid);
  syncThemePresetHtmlClass(pid);

  if (!options?.silent) {
    window.$message?.success($t('theme.appearance.preset.applySuccess'));
  }
}
