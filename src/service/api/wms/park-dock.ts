import { request } from '@/service/request';

/** 道口/停车位分页列表 */
export function fetchGetParkDockList(params?: Api.Wms.ParkDockSearchParams) {
  return request<Api.Wms.ParkDockList>({
    url: '/wms/park/dock/list',
    method: 'get',
    params
  });
}

/** 道口/停车位详情 */
export function fetchGetParkDockDetail(id: CommonType.IdType) {
  return request<Api.Wms.ParkDock>({
    url: `/wms/park/dock/${id}`,
    method: 'get'
  });
}

/** 新增道口/停车位 */
export function fetchCreateParkDock(data: Api.Wms.ParkDockOperateParams) {
  return request<boolean>({
    url: '/wms/park/dock',
    method: 'post',
    data
  });
}

/** 修改道口/停车位 */
export function fetchUpdateParkDock(data: Api.Wms.ParkDockOperateParams) {
  return request<boolean>({
    url: '/wms/park/dock',
    method: 'put',
    data
  });
}

/** 批量删除道口/停车位 */
export function fetchBatchDeleteParkDock(ids: CommonType.IdType[]) {
  return request<boolean>({
    url: `/wms/park/dock/${ids.join(',')}`,
    method: 'delete'
  });
}
