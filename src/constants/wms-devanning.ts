import dayjs from 'dayjs';
import type { SelectOption } from 'naive-ui';

/** WMS 拆柜 — 与后端 sys_dict_type.dict_type 保持一致 */
export const WMS_DICT_DEVANNING_ROUND = 'wms_devanning_round';

/** 按 `dict_sort` 升序取拆柜轮次 `dict_value`（与 Dock 排队序号对齐用） */
export function getDevanningRoundDictValuesSorted(dictItems: Api.System.DictData[]): string[] {
  return [...dictItems]
    .filter(d => d.dictValue != null && String(d.dictValue).trim() !== '')
    .sort((a, b) => (a.dictSort ?? 0) - (b.dictSort ?? 0))
    .map(d => String(d.dictValue));
}

/** @deprecated 订单等级已改为用户输入数字 */
export const WMS_DICT_ORDER_LEVEL = 'wms_order_level';

/** 订单等级：解析为数字，非法则 null */
export function normalizeDevanningOrderLevel(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** 导入/新建海柜订单默认拆柜状态 */
export const DEVANNING_DEFAULT_STATUS: Api.Wms.DevanningStatus = 'not_arrived';

export const DEVANNING_STATUS_VALUES: readonly Api.Wms.DevanningStatus[] = [
  'pending',
  'not_arrived',
  'queued',
  'in_progress',
  'completed'
] as const;

const DEVANNING_STATUS_I18N: Record<Api.Wms.DevanningStatus, App.I18n.I18nKey> = {
  pending: 'page.wms.parkScheduling.statusPending',
  queued: 'page.wms.parkScheduling.statusQueued',
  not_arrived: 'page.wms.parkScheduling.statusNotArrived',
  in_progress: 'page.wms.parkScheduling.statusInProgress',
  completed: 'page.wms.parkScheduling.statusCompleted'
};

/** 带文案的下拉（需在组件内传入 `$t`） */
export function buildDevanningStatusSelectOptions(
  labelOf: (key: App.I18n.I18nKey) => string
): SelectOption[] {
  return DEVANNING_STATUS_VALUES.map(v => {
    const key = devanningStatusI18nKey(v);
    return { value: v, label: key ? labelOf(key) : v };
  });
}

/** 拆柜口展示（订单 `devanningDock`；看板任务可过渡读 `dockName`） */
export function resolveDevanningDockDisplay(
  row: { devanningDock?: string | null; dockName?: string | null } | null | undefined
): string {
  if (!row) return '';
  return (row.devanningDock ?? row.dockName ?? '').trim();
}

/** 读取拆柜状态（兼容后端仍返 schedulingStatus） */
export function resolveDevanningOrderStatus(
  row: Pick<Api.Wms.DevanningOrder, 'devanningStatus' | 'schedulingStatus'> | null | undefined
): Api.Wms.DevanningStatus | null {
  if (!row) return null;
  return row.devanningStatus ?? row.schedulingStatus ?? null;
}

/** 拆柜状态 i18n key */
export function devanningStatusI18nKey(status: Api.Wms.DevanningStatus | null | undefined): App.I18n.I18nKey | null {
  if (!status) return null;
  return DEVANNING_STATUS_I18N[status] ?? null;
}

/** @deprecated 请用 {@link devanningStatusI18nKey} */
export const devanningSchedulingStatusI18nKey = devanningStatusI18nKey;
/** 派送方式（与库区上架条件等共用字典） */
export const WMS_DICT_DELIVERY_TYPE = 'delivery_type';

/**
 * 拆柜列表默认 **创建时间** 筛选（`params.createTimeBegin` / `params.createTimeEnd`）。
 * 固定为：**今天往前 15 天 00:00:00** ～ **今天往后 15 天 23:59:59**。
 * 列表页首屏与 `DevanningOrderSearch` 必须共用，避免表格 `immediate` 拉数早于子组件写入 `params`。
 */
export function getDefaultDevanningOrderCreateTimeRange() {
  return {
    createTimeBegin: dayjs().subtract(15, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    createTimeEnd: dayjs().add(15, 'day').endOf('day').format('YYYY-MM-DD HH:mm:ss')
  };
}

/**
 * 拆柜订单「多文件上传 + 解析预览」POST 超时（毫秒）。
 * 默认 120s：multipart 上传 + 后端解析多表易超过 Axios 默认 ~10s。
 * 可在 `.env*` 设置 `VITE_WMS_DEVANNING_IMPORT_PREVIEW_TIMEOUT_MS`；`0` 表示不设限（慎用）。
 */
export function getWmsDevanningImportPreviewTimeoutMs(): number {
  const raw = import.meta.env.VITE_WMS_DEVANNING_IMPORT_PREVIEW_TIMEOUT_MS as string | undefined;
  if (raw === '0') return 0;
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return n;
  return 120_000;
}

/** 租户 `198842`：拆柜单 Excel `GET .../export/{id}` 额外携带 `template`（其它租户不传）。 */
export const WMS_DEVANNING_EXPORT_TEMPLATE_TENANT_ID = '198842';

/** 后端预置模版 key，与 `template` 查询参数值一致 */
export const WMS_DEVANNING_EXPORT_TEMPLATE_KEY = 'tenant198842-container-unloading';

/**
 * 按当前租户为拆柜单导出 URL 追加 `template`（仅租户 198842）。
 *
 * @param path 已含路径，如 `/wms/devanning-order/export/123`
 */
export function withDevanningSheetExportTemplate(path: string, tenantId: unknown): string {
  if (String(tenantId ?? '') !== WMS_DEVANNING_EXPORT_TEMPLATE_TENANT_ID) {
    return path;
  }
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}template=${encodeURIComponent(WMS_DEVANNING_EXPORT_TEMPLATE_KEY)}`;
}
