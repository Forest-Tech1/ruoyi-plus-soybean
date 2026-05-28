import { request } from '../../request';

/** Check-in 登记记录分页列表（需登录） */
export function fetchDriverCheckInRecordList(params?: Api.Wms.DriverCheckInRecordSearchParams) {
  return request<Api.Wms.DriverCheckInRecordList>({
    url: '/wms/driver-check-in/record/list',
    method: 'get',
    params
  });
}

/** 近期 Check-in 记录（顶部通知轮询） */
export function fetchDriverCheckInRecordRecent(params?: Api.Wms.DriverCheckInRecordRecentParams) {
  return request<Api.Wms.DriverCheckInRecord[]>({
    url: '/wms/driver-check-in/record/recent',
    method: 'get',
    params
  });
}
