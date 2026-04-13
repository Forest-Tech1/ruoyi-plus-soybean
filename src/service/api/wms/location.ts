import { request } from '@/service/request';

/** 库位分页列表 */
export function fetchGetWarehouseLocationList(params?: Api.Wms.WarehouseLocationSearchParams) {
  return request<Api.Wms.WarehouseLocationList>({
    url: '/wms/inventory/location/list',
    method: 'get',
    params
  });
}

/** 库位详情 */
export function fetchGetWarehouseLocationDetail(id: CommonType.IdType) {
  return request<Api.Wms.WarehouseLocation>({
    url: `/wms/inventory/location/${id}`,
    method: 'get'
  });
}

/** 新增库位 */
export function fetchCreateWarehouseLocation(data: Api.Wms.WarehouseLocationOperateParams) {
  return request<boolean>({
    url: '/wms/inventory/location',
    method: 'post',
    data
  });
}

/** 修改库位 */
export function fetchUpdateWarehouseLocation(data: Api.Wms.WarehouseLocationOperateParams) {
  return request<boolean>({
    url: '/wms/inventory/location',
    method: 'put',
    data
  });
}

/** 批量修改状态 */
export function fetchBatchUpdateWarehouseLocationStatus(data: Api.Wms.WarehouseLocationBatchStatusBody) {
  return request<boolean>({
    url: '/wms/inventory/location/status',
    method: 'put',
    data
  });
}

/** 批量删除库位 */
export function fetchBatchDeleteWarehouseLocation(ids: CommonType.IdType[]) {
  return request<boolean>({
    url: `/wms/inventory/location/${ids.join(',')}`,
    method: 'delete'
  });
}
