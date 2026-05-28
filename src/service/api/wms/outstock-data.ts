import { getWmsOutstockDataListTimeoutMs } from '@/constants/wms-outstock-data';
import { request } from '@/service/request';

/** 出库数据分页列表 */
export function fetchGetOutstockDataList(params?: Api.Wms.OutstockDataSearchParams) {
  return request<Api.Wms.OutstockDataList>({
    url: '/wms/order/outstock-data/list',
    method: 'get',
    params,
    timeout: getWmsOutstockDataListTimeoutMs()
  });
}

/**
 * 出库数据看板：按仓库代码汇总板数（降序，前 topN 条）
 * @see docs/wms-outstock-data-dashboard-api.md
 */
export function fetchGetOutstockDashboardByWarehouse(params?: Api.Wms.OutstockDashboardByWarehouseParams) {
  return request<Api.Wms.OutstockDashboardByWarehouseResult>({
    url: '/wms/order/outstock-data/dashboard/by-warehouse',
    method: 'get',
    params,
    timeout: getWmsOutstockDataListTimeoutMs()
  });
}

/**
 * 取消出库：删除出库数据、数据回库存、对应入库计划改为未出库（以后端业务为准）
 */
export function fetchCancelOutstockData(id: CommonType.IdType) {
  return request<boolean>({
    url: `/wms/order/outstock-data/${id}`,
    method: 'delete'
  });
}
