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

/** 拆柜订单 - 入库计划修改 */
export function fetchUpdateDevanningInboundPlan(data: Api.Wms.DevanningInboundPlanOperateParams) {
  return request<boolean>({
    url: '/wms/devanning-order/inbound-plan',
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

/**
 * 多文件导入预览：每个文件解析为一条待创建订单，不落库。
 * multipart：`files` 重复追加多文件；`updateSupport` 文本 true/false。
 */
export function fetchPreviewDevanningOrderImport(files: File[], updateSupport: boolean) {
  const fd = new FormData();
  files.forEach(f => {
    fd.append('files', f);
  });
  fd.append('updateSupport', updateSupport ? 'true' : 'false');
  return request<Api.Wms.DevanningOrderImportPreviewResult>({
    url: '/wms/devanning-order/import-preview',
    method: 'post',
    data: fd
  });
}

/** 用户确认后批量落库（内容与预览接口返回的 items 一致） */
export function fetchConfirmDevanningOrderImport(data: Api.Wms.DevanningOrderImportConfirmParams) {
  return request<boolean>({
    url: '/wms/devanning-order/import-confirm',
    method: 'post',
    data
  });
}
