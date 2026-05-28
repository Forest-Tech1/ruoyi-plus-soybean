import { request } from '@/service/request';

/** 上架规则分页列表 */
export function fetchGetPutawayRuleList(params?: Api.Wms.PutawayRuleSearchParams) {
  return request<Api.Wms.PutawayRuleList>({
    url: '/wms/warehouse/putaway-rule/list',
    method: 'get',
    params
  });
}

/** 上架规则详情（可选；列表已含 rulePayload 时可不用） */
export function fetchGetPutawayRuleDetail(id: CommonType.IdType) {
  return request<Api.Wms.PutawayRule>({
    url: `/wms/warehouse/putaway-rule/${id}`,
    method: 'get'
  });
}

/** 新建上架规则 */
export function fetchCreatePutawayRule(data: Api.Wms.PutawayRuleOperateParams) {
  return request<boolean>({
    url: '/wms/warehouse/putaway-rule',
    method: 'post',
    data
  });
}

/** 修改上架规则 */
export function fetchUpdatePutawayRule(data: Api.Wms.PutawayRuleOperateParams) {
  return request<boolean>({
    url: '/wms/warehouse/putaway-rule',
    method: 'put',
    data
  });
}

/** 删除上架规则 */
export function fetchDeletePutawayRule(id: CommonType.IdType) {
  return request<boolean>({
    url: `/wms/warehouse/putaway-rule/${id}`,
    method: 'delete'
  });
}

/** 查询预库位分配兜底配置（库区、库位均可为空数组；空库区表示关闭兜底范围，见 Api.Wms.PutawayFallbackAllocation） */
export function fetchGetPutawayFallbackAllocation() {
  return request<Api.Wms.PutawayFallbackAllocation>({
    url: '/wms/warehouse/putaway-rule/fallback-allocation',
    method: 'get'
  });
}

/** 保存预库位分配兜底配置 */
export function fetchSavePutawayFallbackAllocation(data: Api.Wms.PutawayFallbackAllocationOperateParams) {
  return request<boolean>({
    url: '/wms/warehouse/putaway-rule/fallback-allocation',
    method: 'put',
    data
  });
}
