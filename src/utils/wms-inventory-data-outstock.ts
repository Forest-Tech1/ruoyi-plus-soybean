/** 解析库存数据「出库」接口返回的 data（PDF 上传 / 手动单行共用） */
export function normalizeWarehouseInventoryOutstockResult(raw: unknown): {
  summary: string | null;
  rows: Api.Wms.WarehouseInventoryOutstockResultItem[];
} {
  if (raw === true || raw === false || raw == null) {
    return { summary: null, rows: [] };
  }
  if (Array.isArray(raw)) {
    return { summary: null, rows: raw as Api.Wms.WarehouseInventoryOutstockResultItem[] };
  }
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const summaryRaw = o.summary ?? o.msg;
    const summary = typeof summaryRaw === 'string' && summaryRaw.trim() ? summaryRaw.trim() : null;
    const arr = o.rows ?? o.items ?? o.list ?? o.details;
    if (Array.isArray(arr)) {
      return { summary, rows: arr as Api.Wms.WarehouseInventoryOutstockResultItem[] };
    }
    return { summary, rows: [] };
  }
  return { summary: null, rows: [] };
}
