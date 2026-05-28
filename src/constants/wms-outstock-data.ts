import dayjs from 'dayjs';

/**
 * 出库数据默认「创建时间」筛选：**当天 23:59:59** 起往前 **7 天**（含当日），即
 * `[当天-7日 00:00:00, 当日 23:59:59]`。
 * - 列表首屏 / 重置搜索：`getDefaultOutstockDataCreateTimeRange`
 * - 库存与出库看板 · 出库图：`getDefaultOutstockDashboardCreateTimeRange`（与列表同一口径）
 */
function getDefaultOutstockCreateTimeRangeWeek() {
  return {
    createTimeBegin: dayjs().subtract(7, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    createTimeEnd: dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss')
  };
}

export function getDefaultOutstockDataCreateTimeRange() {
  return getDefaultOutstockCreateTimeRangeWeek();
}

export function getDefaultOutstockDashboardCreateTimeRange() {
  return getDefaultOutstockCreateTimeRangeWeek();
}

/**
 * `GET /wms/order/outstock-data/list` 超时（毫秒）。
 * 数据量大时易超过 Axios 默认 ~10s；默认 120s。
 * 可在 `.env*` 设置 `VITE_WMS_OUTSTOCK_DATA_LIST_TIMEOUT_MS`；`0` 表示不设限（慎用）。
 */
export function getWmsOutstockDataListTimeoutMs(): number {
  const raw = import.meta.env.VITE_WMS_OUTSTOCK_DATA_LIST_TIMEOUT_MS as string | undefined;
  if (raw === '0') return 0;
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return n;
  return 120_000;
}
