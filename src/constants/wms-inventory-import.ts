/**
 * 「导入现有库存」预览/确认：单请求超时（毫秒）。
 * - `@sa/axios` 默认约 10s，大表解析/落库需单独拉长。
 * - 可在 `.env*` 设置 `VITE_WMS_EXISTING_IMPORT_TIMEOUT_MS`（数字）；设为 `0` 表示不设超时（慎用）。
 */
export function getWmsExistingImportRequestTimeoutMs(): number {
  const raw = import.meta.env.VITE_WMS_EXISTING_IMPORT_TIMEOUT_MS as string | undefined;
  if (raw === '0') return 0;
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return n;
  return 30 * 60 * 1000;
}
