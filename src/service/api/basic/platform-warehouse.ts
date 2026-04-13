import { request } from '@/service/request';

/** 平台列表（全量，不分页） */
export function fetchGetPlatformList() {
  return request<Api.Basic.Platform[]>({
    url: '/basic/platform/list',
    method: 'get'
  });
}

/** 新增平台 */
export function fetchCreatePlatform(data: Api.Basic.PlatformOperateParams) {
  return request<boolean>({
    url: '/basic/platform',
    method: 'post',
    data
  });
}

/** 修改平台（平台代码不可改由后端忽略入参） */
export function fetchUpdatePlatform(data: Api.Basic.PlatformOperateParams) {
  return request<boolean>({
    url: '/basic/platform',
    method: 'put',
    data
  });
}

/** 启停平台 */
export function fetchUpdatePlatformStatus(id: CommonType.IdType, status: string) {
  return request<boolean>({
    url: `/basic/platform/${id}/status`,
    method: 'put',
    data: { status }
  });
}

/** 停用前检查：启用中仓库数量 */
export function fetchGetPlatformDisableCheck(id: CommonType.IdType) {
  return request<Api.Basic.PlatformDisableCheck>({
    url: `/basic/platform/${id}/disable-check`,
    method: 'get'
  });
}

/** 平台图标上传（返回可访问 URL 字符串或 { url }，以后端为准） */
export function fetchUploadPlatformIcon(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  return request<string>({
    url: '/basic/platform/upload-icon',
    method: 'post',
    data: fd
  });
}

/** 仓库分页列表 */
export function fetchGetPlatformWarehouseList(params: Api.Basic.PlatformWarehouseSearchParams) {
  return request<Api.Basic.PlatformWarehouseList>({
    url: '/basic/platform-warehouse/list',
    method: 'get',
    params
  });
}

/** 仓库详情（含操作记录） */
export function fetchGetPlatformWarehouseDetail(id: CommonType.IdType) {
  return request<Api.Basic.PlatformWarehouseDetail>({
    url: `/basic/platform-warehouse/${id}`,
    method: 'get'
  });
}

/** 新增仓库 */
export function fetchCreatePlatformWarehouse(data: Api.Basic.PlatformWarehouseOperateParams) {
  return request<boolean>({
    url: '/basic/platform-warehouse',
    method: 'post',
    data
  });
}

/** 修改仓库 */
export function fetchUpdatePlatformWarehouse(data: Api.Basic.PlatformWarehouseOperateParams) {
  return request<boolean>({
    url: '/basic/platform-warehouse',
    method: 'put',
    data
  });
}

/** 单条启停 */
export function fetchUpdatePlatformWarehouseStatus(id: CommonType.IdType, status: string) {
  return request<boolean>({
    url: `/basic/platform-warehouse/${id}/status`,
    method: 'put',
    data: { status }
  });
}

/** 批量启停 */
export function fetchBatchPlatformWarehouseStatus(ids: CommonType.IdType[], status: string) {
  return request<boolean>({
    url: '/basic/platform-warehouse/status/batch',
    method: 'put',
    data: { ids, status }
  });
}
