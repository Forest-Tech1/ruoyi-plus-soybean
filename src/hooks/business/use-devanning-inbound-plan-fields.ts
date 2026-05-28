import { ref } from 'vue';
import type { SelectOption } from 'naive-ui';
import { fetchGetPlatformList, fetchGetPlatformWarehouseList } from '@/service/api/basic/platform-warehouse';

/** 入库计划行「地址类型」落库值 */
export const WMS_INBOUND_ADDRESS_TYPE_COMMERCIAL = 'commercial';
export const WMS_INBOUND_ADDRESS_TYPE_PRIVATE = 'private';

/**
 * 平台 + 仓库下拉数据（基础数据：平台列表、平台下仓库）
 * - `platform` 字段存 **platformCode**
 * - 未选平台时仓库代码手输；选平台后仓库从列表选
 */
export function useDevanningInboundPlanFields() {
  const platforms = ref<Api.Basic.Platform[]>([]);
  const warehousesByPlatformId = ref<Record<string, Api.Basic.PlatformWarehouse[]>>({});
  let platformsLoading = false;

  async function loadPlatforms() {
    if (platformsLoading || platforms.value.length) return;
    platformsLoading = true;
    try {
      const { data, error } = await fetchGetPlatformList();
      if (!error && data?.length) {
        platforms.value = data.filter(p => p.status === '0');
      }
    } finally {
      platformsLoading = false;
    }
  }

  /** 按 platform 字段（存 platformCode，或历史数据为名称）解析平台 */
  function findPlatformByCodeOrName(codeOrName: string | null | undefined) {
    const c = (codeOrName ?? '').trim();
    if (!c) return undefined;
    const upper = c.toUpperCase();
    return platforms.value.find(
      p =>
        (p.platformCode ?? '').toUpperCase() === upper ||
        (p.platformName ?? '').trim() === c
    );
  }

  function platformResolvedByCode(codeOrName: string | null | undefined): boolean {
    return findPlatformByCodeOrName(codeOrName) != null;
  }

  function platformSelectOptions(): SelectOption[] {
    return platforms.value.map(p => ({
      label: `${p.platformName}（${p.platformCode}）`,
      value: String(p.platformCode ?? '')
    }));
  }

  async function ensureWarehouses(platformId: CommonType.IdType) {
    const key = String(platformId);
    if (warehousesByPlatformId.value[key]?.length !== undefined) {
      return warehousesByPlatformId.value[key]!;
    }
    const { data, error } = await fetchGetPlatformWarehouseList({
      platformId,
      pageNum: 1,
      pageSize: 500,
      keyword: null,
      status: null,
      countryCodes: null
    });
    if (error || data == null) {
      warehousesByPlatformId.value[key] = [];
      return [];
    }
    const body = data as unknown as Record<string, unknown>;
    const rows = Array.isArray(body.rows) ? (body.rows as Api.Basic.PlatformWarehouse[]) : [];
    warehousesByPlatformId.value[key] = rows;
    return rows;
  }

  function warehouseSelectOptions(rows: Api.Basic.PlatformWarehouse[]): SelectOption[] {
    return rows.map(w => ({
      label: w.warehouseName ? `${w.warehouseName}（${w.warehouseCode}）` : String(w.warehouseCode),
      value: String(w.warehouseCode)
    }));
  }

  async function warehouseOptionsForPlatformCode(platformCode: string | null | undefined) {
    const p = findPlatformByCodeOrName(platformCode);
    if (!p?.id) return [];
    const rows = await ensureWarehouses(p.id);
    return warehouseSelectOptions(rows);
  }

  /** 清空仓库缓存（切换平台下拉后调用，避免串库） */
  function clearWarehouseCache(platformId?: CommonType.IdType) {
    if (platformId != null) {
      delete warehousesByPlatformId.value[String(platformId)];
    }
  }

  return {
    platforms,
    loadPlatforms,
    findPlatformByCodeOrName,
    platformResolvedByCode,
    platformSelectOptions,
    ensureWarehouses,
    warehouseSelectOptions,
    warehouseOptionsForPlatformCode,
    clearWarehouseCache
  };
}
