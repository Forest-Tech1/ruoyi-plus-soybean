/** 拆柜入库计划「系统预库位」多库位分配（与后端约定见 docs/wms-devanning-order-prelocation-api.md） */

export type WmsPreLocationAllocation = {
  locationCode: string;
  palletCount: number;
  /** 仅前端从平面图带出，写入库存明细 PUT；不参与 `systemPreLocation` JSON */
  zoneCode?: string | null;
};

export const WMS_PRE_LOCATION_JSON_VERSION = 1;

function normalizeAllocationLine(item: unknown): WmsPreLocationAllocation | null {
  if (item == null || typeof item !== 'object') return null;
  const r = item as Record<string, unknown>;
  const code = String(r.locationCode ?? r.location_code ?? '').trim();
  if (!code) return null;
  const pc = r.palletCount ?? r.pallet_count;
  const n = Number(pc);
  const palletCount = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  return { locationCode: code, palletCount };
}

/**
 * 解析 `systemPreLocation` 字段：
 * - 推荐 JSON：`{"version":1,"allocations":[{"locationCode":"A-01","palletCount":3}]}`
 * - 兼容 JSON 数组：`[{...}]`
 * - 兼容历史单行纯文本：整串作为单个库位编码，板数为 0
 */
export function parseSystemPreLocationAllocations(raw: string | null | undefined): WmsPreLocationAllocation[] {
  if (raw == null) return [];
  const s = String(raw).trim();
  if (!s) return [];
  if (!s.startsWith('{') && !s.startsWith('[')) {
    return [{ locationCode: s, palletCount: 0 }];
  }
  try {
    const v = JSON.parse(s) as unknown;
    if (Array.isArray(v)) {
      return v.map(normalizeAllocationLine).filter((x): x is WmsPreLocationAllocation => x != null);
    }
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      const allocs = o.allocations ?? o.lines;
      if (Array.isArray(allocs)) {
        return allocs.map(normalizeAllocationLine).filter((x): x is WmsPreLocationAllocation => x != null);
      }
    }
  } catch {
    // ignore
  }
  return [{ locationCode: s, palletCount: 0 }];
}

export function serializeSystemPreLocationAllocations(lines: WmsPreLocationAllocation[]): string {
  const cleaned = lines
    .map(l => ({
      locationCode: String(l.locationCode ?? '').trim(),
      palletCount: Math.max(0, Math.floor(Number(l.palletCount) || 0))
    }))
    .filter(l => l.locationCode.length > 0);
  return JSON.stringify({ version: WMS_PRE_LOCATION_JSON_VERSION, allocations: cleaned });
}

/**
 * 库存行迁库：从 `systemPreLocation` 中移除旧库位分配（若存在），写入新库位+板数；避免新编码重复会先删同编码行。
 */
export function mergePreLocationAfterInventoryLocationChange(
  rawSystemPreLocation: string | null | undefined,
  oldLocationCode: string | null | undefined,
  newLocationCode: string,
  newPalletCount: number
): string {
  const old = String(oldLocationCode ?? '').trim();
  const fresh = String(newLocationCode ?? '').trim();
  let allocs = parseSystemPreLocationAllocations(rawSystemPreLocation);
  if (old) {
    allocs = allocs.filter(a => String(a.locationCode).trim() !== old);
  }
  if (fresh) {
    allocs = allocs.filter(a => String(a.locationCode).trim() !== fresh);
  }
  allocs.push({
    locationCode: fresh,
    palletCount: Math.max(0, Math.floor(Number(newPalletCount) || 0))
  });
  return serializeSystemPreLocationAllocations(allocs);
}

/** 仅改板数：命中与 `locationCode` 一致的分配行后重写板数；未命中返回 null（调用方可跳过预库位 PUT） */
export function setPalletCountInPreLocationForLocation(
  rawSystemPreLocation: string | null | undefined,
  locationCode: string | null | undefined,
  newPalletCount: number
): string | null {
  const loc = String(locationCode ?? '').trim();
  if (!loc) return null;
  const allocs = parseSystemPreLocationAllocations(rawSystemPreLocation);
  const idx = allocs.findIndex(a => String(a.locationCode).trim() === loc);
  if (idx < 0) return null;
  const next = allocs.map((a, i) =>
    i === idx ? { ...a, palletCount: Math.max(0, Math.floor(Number(newPalletCount) || 0)) } : a
  );
  return serializeSystemPreLocationAllocations(next);
}

/**
 * 表格展示：前两行各一条「库位 n：编码（x板）」；超过 2 条时第三行仅为省略号
 */
export function getSystemPreLocationDisplayRows(
  lines: WmsPreLocationAllocation[],
  formatLine: (p: { index: number; location: string; pallets: number }) => string,
  moreMarker: string
): string[] {
  if (!lines.length) return [];
  if (lines.length <= 2) {
    return lines.map((l, i) => formatLine({ index: i + 1, location: l.locationCode, pallets: l.palletCount }));
  }
  return [
    formatLine({ index: 1, location: lines[0].locationCode, pallets: lines[0].palletCount }),
    formatLine({ index: 2, location: lines[1].locationCode, pallets: lines[1].palletCount }),
    moreMarker
  ];
}
