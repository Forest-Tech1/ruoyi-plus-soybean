import { request } from '@/service/request';

/** 系统预库位分配异常 — 分页列表 */
export function fetchGetPrelocationAllocationExceptionLogList(
  params?: Api.Wms.PrelocationAllocationExceptionLogSearchParams
) {
  return request<Api.Wms.PrelocationAllocationExceptionLogList>({
    url: '/wms/warehouse/prelocation-allocation-exception-log/list',
    method: 'get',
    params
  });
}
