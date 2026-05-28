import { request } from '@/service/request';

/** 出库异常 — 按出库批次分页列表 */
export function fetchGetOutstockExceptionBatchList(params?: Api.Wms.OutstockExceptionBatchSearchParams) {
  return request<Api.Wms.OutstockExceptionBatchList>({
    url: '/wms/order/outstock-exception/batch/list',
    method: 'get',
    params
  });
}

/** 指定出库批次下的异常明细 */
export function fetchGetOutstockExceptionDetails(outstockBatchId: CommonType.IdType) {
  return request<Api.Wms.OutstockExceptionDetailLine[]>({
    url: `/wms/order/outstock-exception/batch/${outstockBatchId}/details`,
    method: 'get'
  });
}
