import { getWmsDevanningImportPreviewTimeoutMs } from '@/constants/wms-devanning';
import { request } from '@/service/request';

/** 拆柜订单分页列表 */
export function fetchGetDevanningOrderList(params?: Api.Wms.DevanningOrderSearchParams) {
  return request<Api.Wms.DevanningOrderList>({
    url: '/wms/devanning-order/list',
    method: 'get',
    params
  });
}

/** 拆柜订单详情 */
export function fetchGetDevanningOrderDetail(id: CommonType.IdType) {
  return request<Api.Wms.DevanningOrder>({
    url: `/wms/devanning-order/${id}`,
    method: 'get'
  });
}

/** 新增拆柜订单（可含 inboundPlans，见对接文档） */
export function fetchCreateDevanningOrder(data: Api.Wms.DevanningOrderCreateParams) {
  return request<boolean>({
    url: '/wms/devanning-order',
    method: 'post',
    data
  });
}

/** 修改拆柜订单 */
export function fetchUpdateDevanningOrder(data: Api.Wms.DevanningOrderOperateParams) {
  return request<boolean>({
    url: '/wms/devanning-order',
    method: 'put',
    data
  });
}

/** 批量删除拆柜订单 */
export function fetchBatchDeleteDevanningOrder(ids: CommonType.IdType[]) {
  return request<boolean>({
    url: `/wms/devanning-order/${ids.join(',')}`,
    method: 'delete'
  });
}

/** 完成拆柜 */
export function fetchCompleteDevanningOrder(id: CommonType.IdType) {
  return request<boolean>({
    url: `/wms/devanning-order/complete/${id}`,
    method: 'put'
  });
}

/** 仅更新备注 */
export function fetchUpdateDevanningOrderRemark(id: CommonType.IdType, remark: string) {
  return request<boolean>({
    url: `/wms/devanning-order/${id}/remark`,
    method: 'put',
    data: { remark }
  });
}

/** 拆柜订单 - 更新附件（OSS id 列表） */
export function fetchUpdateDevanningOrderAttachments(id: CommonType.IdType, ossIds: CommonType.IdType[]) {
  return request<boolean>({
    url: `/wms/devanning-order/${id}/attachments`,
    method: 'put',
    data: { ossIds }
  });
}

/** 取消拆柜完成（回退为待拆柜等业务约定状态，以后端为准） */
export function fetchCancelCompleteDevanningOrder(id: CommonType.IdType) {
  return request<boolean>({
    url: `/wms/devanning-order/cancel-complete/${id}`,
    method: 'put'
  });
}

/** 标记异常 */
export function fetchMarkAbnormalDevanningOrder(id: CommonType.IdType) {
  return request<boolean>({
    url: `/wms/devanning-order/mark-abnormal/${id}`,
    method: 'put'
  });
}

/** 取消标记异常 */
export function fetchCancelAbnormalDevanningOrder(id: CommonType.IdType) {
  return request<boolean>({
    url: `/wms/devanning-order/cancel-abnormal/${id}`,
    method: 'put'
  });
}

/** 拆柜订单 - 入库计划分页列表（详情抽屉） */
export function fetchGetDevanningInboundPlanList(
  orderId: CommonType.IdType,
  params?: Pick<Api.Common.CommonSearchParams, 'pageNum' | 'pageSize'>
) {
  return request<Api.Wms.DevanningInboundPlanList>({
    url: `/wms/devanning-order/${orderId}/inbound-plan/list`,
    method: 'get',
    params
  });
}

/**
 * 入库计划跨单分页列表（货物订单页）
 * @see docs/wms-cargo-inbound-plan-api.md
 */
export function fetchGetDevanningInboundPlanGlobalList(params: Api.Wms.DevanningInboundPlanGlobalSearchParams) {
  return request<Api.Wms.DevanningInboundPlanList>({
    url: '/wms/devanning-order/inbound-plan/list',
    method: 'get',
    params
  });
}

/** 拆柜订单 - 入库计划修改 */
export function fetchUpdateDevanningInboundPlan(data: Api.Wms.DevanningInboundPlanOperateParams) {
  return request<boolean>({
    url: '/wms/devanning-order/inbound-plan',
    method: 'put',
    data
  });
}

/**
 * 拆柜订单 - 仅更新入库计划「系统预库位」多库位分配（JSON 字符串）
 * 对接约定见 `docs/wms-devanning-order-prelocation-api.md`
 */
export function fetchUpdateDevanningInboundPlanSystemPreLocation(data: {
  id: CommonType.IdType;
  orderId?: CommonType.IdType;
  systemPreLocation: string;
}) {
  return request<boolean>({
    url: '/wms/devanning-order/inbound-plan/system-pre-location',
    method: 'put',
    data
  });
}

/** 拆柜订单 - 入库计划删除（多 id 逗号分隔，与主表删除风格一致） */
export function fetchBatchDeleteDevanningInboundPlan(ids: CommonType.IdType[]) {
  return request<boolean>({
    url: `/wms/devanning-order/inbound-plan/${ids.join(',')}`,
    method: 'delete'
  });
}

function buildDevanningImportFormData(files: File[], updateSupport: boolean) {
  const fd = new FormData();
  files.forEach(f => {
    fd.append('files', f);
  });
  fd.append('updateSupport', updateSupport ? 'true' : 'false');
  return fd;
}

/**
 * 多文件导入预览（标准派送模版 · 旧版表头）：定列读取，无脚本预处理。
 * multipart：仅使用字段名 `files`；`updateSupport` 文本 true/false。
 */
export function fetchPreviewDevanningOrderImport(files: File[], updateSupport: boolean) {
  return request<Api.Wms.DevanningOrderImportPreviewResult>({
    url: '/wms/devanning-order/import-preview',
    method: 'post',
    data: buildDevanningImportFormData(files, updateSupport),
    timeout: getWmsDevanningImportPreviewTimeoutMs()
  });
}

/**
 * 多文件导入预览（**导入订单 / Sheet2** 流程 · V2 表头）。
 * multipart 与 `import-preview` 相同：`files`、`updateSupport`；响应结构同标准预览。
 */
export function fetchPreviewDevanningOrderImportV2(files: File[], updateSupport: boolean) {
  return request<Api.Wms.DevanningOrderImportPreviewResult>({
    url: '/wms/devanning-order/import-preview/v2',
    method: 'post',
    data: buildDevanningImportFormData(files, updateSupport),
    timeout: getWmsDevanningImportPreviewTimeoutMs()
  });
}

/**
 * 标准派送 V2 表头 — 单文件直传落库（不经预览；与现网 `importData` 类接口一致时选用）。
 * multipart：字段名 `file`；`updateSupport` 文本 true/false。
 */
export function fetchImportDevanningOrderDataV2(file: File, updateSupport: boolean) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('updateSupport', updateSupport ? 'true' : 'false');
  return request<boolean>({
    url: '/wms/devanning-order/importData/v2',
    method: 'post',
    data: fd,
    headers: {
      repeatSubmit: false
    },
    timeout: getWmsDevanningImportPreviewTimeoutMs()
  });
}

/**
 * 多文件导入预览（原始订单派送表）：表头映射 + 预处理后再解析，不落库。
 * 响应结构与标准预览一致；确认落库仍走 {@link fetchConfirmDevanningOrderImport}。
 */
export function fetchPreviewDevanningOrderImportRawOrder(files: File[], updateSupport: boolean) {
  return request<Api.Wms.DevanningOrderImportPreviewResult>({
    url: '/wms/devanning-order/import-preview/raw-order',
    method: 'post',
    data: buildDevanningImportFormData(files, updateSupport),
    timeout: getWmsDevanningImportPreviewTimeoutMs()
  });
}

/**
 * 多文件导入预览（原始订单 · 仅第二个工作表 Sheet2）：承运商/双地址/非 HOLD 同址合并等预处理后再解析，不落库。
 * 响应结构与标准预览一致；确认落库仍走 {@link fetchConfirmDevanningOrderImport}。
 */
export function fetchPreviewDevanningOrderImportRawOrderSheet2(files: File[], updateSupport: boolean) {
  return request<Api.Wms.DevanningOrderImportPreviewResult>({
    url: '/wms/devanning-order/import-preview/raw-order-sheet2',
    method: 'post',
    data: buildDevanningImportFormData(files, updateSupport),
    timeout: getWmsDevanningImportPreviewTimeoutMs()
  });
}

/** 用户确认后批量落库（内容与预览接口返回的 items 一致） */
export function fetchConfirmDevanningOrderImport(data: Api.Wms.DevanningOrderImportConfirmParams) {
  return request<boolean>({
    url: '/wms/devanning-order/import-confirm',
    method: 'post',
    /** 避免与短时间内其它 POST 的重复提交守卫误判；大 Body 序列化校验见前端日志 */
    headers: {
      repeatSubmit: false
    },
    data
  });
}

/** 拆柜单导入库存明细分页（见 docs/wms-devanning-order-api.md §14.5） */
export function fetchGetDevanningImportInventoryList(params?: Api.Wms.DevanningImportInventorySearchParams) {
  return request<Api.Wms.DevanningImportInventoryList>({
    url: '/wms/devanning-order/import-inventory/list',
    method: 'get',
    params
  });
}

/** 入库单打印数据 @see docs/wms-inbound-receipt-print-api.md */
export function fetchGetDevanningInboundReceiptPrintData(orderId: CommonType.IdType) {
  return request<Api.Wms.DevanningInboundReceiptPrintData>({
    url: `/wms/devanning-order/${orderId}/inbound-receipt/print-data`,
    method: 'get'
  });
}

/** 入库单打印成功后置位「入库单已打」 */
export function fetchMarkDevanningInboundReceiptPrinted(orderId: CommonType.IdType) {
  return request<boolean>({
    url: `/wms/devanning-order/${orderId}/inbound-receipt/mark-printed`,
    method: 'put'
  });
}
