import { request } from '@/service/request';

/** 库区分页列表 */
export function fetchGetWarehouseAreaList(params?: Api.Wms.WarehouseAreaSearchParams) {
  return request<Api.Wms.WarehouseAreaList>({
    url: '/wms/inventory/warehouse-area/list',
    method: 'get',
    params
  });
}

/** 库区详情 */
export function fetchGetWarehouseAreaDetail(id: CommonType.IdType) {
  return request<Api.Wms.WarehouseArea>({
    url: `/wms/inventory/warehouse-area/${id}`,
    method: 'get'
  });
}

/** 新增库区 */
export function fetchCreateWarehouseArea(data: Api.Wms.WarehouseAreaOperateParams) {
  return request<boolean>({
    url: '/wms/inventory/warehouse-area',
    method: 'post',
    data
  });
}

/** 修改库区 */
export function fetchUpdateWarehouseArea(data: Api.Wms.WarehouseAreaOperateParams) {
  return request<boolean>({
    url: '/wms/inventory/warehouse-area',
    method: 'put',
    data
  });
}

/** 仅更新库位混合存储（混合存储开启时需传最大混合数量） */
export function fetchUpdateWarehouseAreaMixedStorage(
  id: CommonType.IdType,
  locationMixedStorage: boolean,
  maxMixedQty?: number | null
) {
  return request<boolean>({
    url: `/wms/inventory/warehouse-area/${id}/mixed-storage`,
    method: 'put',
    data: { locationMixedStorage, maxMixedQty: maxMixedQty ?? null }
  });
}

/** 仅更新上架条件 */
export function fetchUpdateWarehouseAreaPutaway(id: CommonType.IdType, putawayCondition: string) {
  return request<boolean>({
    url: `/wms/inventory/warehouse-area/${id}/putaway-condition`,
    method: 'put',
    data: { putawayCondition }
  });
}

/** 批量删除库区 */
export function fetchBatchDeleteWarehouseArea(ids: CommonType.IdType[]) {
  return request<boolean>({
    url: `/wms/inventory/warehouse-area/${ids.join(',')}`,
    method: 'delete'
  });
}
