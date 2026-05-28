import { getWmsExistingImportRequestTimeoutMs } from '@/constants/wms-inventory-import';
import { request } from '@/service/request';

/** 库存数据（全库维度）分页列表 */
export function fetchGetWarehouseInventoryDataList(params?: Api.Wms.WarehouseInventoryDataSearchParams) {
  return request<Api.Wms.WarehouseInventoryDataList>({
    url: '/wms/inventory/location/inventory-detail/list',
    method: 'get',
    params
  });
}

/**
 * 库存数据看板：按仓库代码汇总板数（降序，前 topN 条）
 * @see docs/wms-inventory-data-dashboard-api.md
 */
export function fetchGetInventoryDashboardByWarehouse(params?: Api.Wms.WarehouseInventoryDashboardByWarehouseParams) {
  return request<Api.Wms.WarehouseInventoryDashboardByWarehouseResult>({
    url: '/wms/inventory/location/inventory-detail/dashboard/by-warehouse',
    method: 'get',
    params
  });
}

/** 库存数据（全库维度）编辑：仅允许更新部分字段 */
export function fetchUpdateWarehouseInventoryData(data: Api.Wms.WarehouseInventoryDataUpdateBody) {
  return request<boolean>({
    url: `/wms/inventory/location/inventory-detail/${data.inventoryDetailId}`,
    method: 'put',
    data
  });
}

/**
 * 手动出库：按库存明细行提交（成功时 `data` 结构与 PDF 出库一致，见 Api.Wms.WarehouseInventoryOutstockResult）
 * @see docs/wms-inventory-data-api.md §2.3
 */
export function fetchPostInventoryDataManualOutstock(data: Api.Wms.WarehouseInventoryDataManualOutstockParams) {
  return request<Api.Wms.WarehouseInventoryOutstockResult>({
    url: '/wms/order/inventory-data/outstock/manual',
    method: 'post',
    data
  });
}

/** 出库：上传 PDF 文件（成功时 data 可为出库结果明细，见 Api.Wms.WarehouseInventoryOutstockResult） */
export function fetchUploadOutstockPdf(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<Api.Wms.WarehouseInventoryOutstockResult>({
    url: '/wms/order/inventory-data/outstock',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/** 导入现有库存：解析 Excel 预览（不落库），见 docs/wms-inventory-data-existing-import-api.md */
export function fetchPreviewInventoryDataExistingImport(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<Api.Wms.WarehouseInventoryDataExistingImportPreviewResult>({
    url: '/wms/order/inventory-data/existing-import/preview',
    method: 'post',
    data: formData,
    timeout: getWmsExistingImportRequestTimeoutMs(),
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/** 导入现有库存：确认写入（异步受理：`code === 202`，`data.taskId`；前端已改用 submit 直传文件） */
export function fetchConfirmInventoryDataExistingImport(data: Api.Wms.WarehouseInventoryDataExistingImportConfirmParams) {
  return request<Api.Wms.WarehouseInventoryExistingImportTaskSubmitVo>({
    url: '/wms/order/inventory-data/existing-import/confirm',
    method: 'post',
    data,
    /** 服务端先入队即返回；单独放宽以免弱网下误报超时 */
    timeout: 120_000
  });
}

/**
 * 导入现有库存：直接上传 Excel 并入异步任务（不落前端预览；后端解析与落库）
 * 成功时 `code === 202`，`data.taskId` 用于「导入任务」轮询
 */
export function fetchSubmitInventoryDataExistingImport(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<Api.Wms.WarehouseInventoryExistingImportTaskSubmitVo>({
    url: '/wms/order/inventory-data/existing-import/submit',
    method: 'post',
    data: formData,
    timeout: 120_000,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/** 导入现有库存：异步任务状态（轮询至 SUCCESS / FAILED） */
export function fetchGetInventoryDataExistingImportTask(taskId: CommonType.IdType) {
  return request<Api.Wms.WarehouseInventoryExistingImportTaskStatusVo>({
    url: `/wms/order/inventory-data/existing-import/task/${taskId}`,
    method: 'get'
  });
}

/** 导入现有库存：中断异步任务（终态为 CANCELLED / CANCELED 等，以后端为准） */
export function fetchCancelInventoryDataExistingImportTask(taskId: CommonType.IdType) {
  return request<boolean>({
    url: `/wms/order/inventory-data/existing-import/task/${taskId}/cancel`,
    method: 'post'
  });
}

