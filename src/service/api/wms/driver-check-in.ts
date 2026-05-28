import { request } from '../../request';

const publicHeaders = {
  isToken: false,
  repeatSubmit: false
} as const;

/** 司机 Check-in：柜号模糊联想（无需登录） */
export function fetchDriverCheckInCoSuggest(params: Api.Wms.DriverCheckInCoSuggestParams) {
  return request<Api.Wms.DriverCheckInCoSuggestItem[]>({
    url: '/wms/public/driver-check-in/co-suggest',
    method: 'get',
    headers: publicHeaders,
    params
  });
}

/** 司机 Check-in：到仓登记（无需登录） */
export function fetchDriverCheckIn(data: Api.Wms.DriverCheckInParams) {
  return request<Api.Wms.DriverCheckInResult>({
    url: '/wms/public/driver-check-in',
    method: 'post',
    headers: publicHeaders,
    data
  });
}

/** 司机 Check-in：批量到仓登记（无需登录；柜号列表 + 共用司机电话） */
export function fetchDriverCheckInBatch(data: Api.Wms.DriverCheckInBatchParams) {
  return request<Api.Wms.DriverCheckInBatchResult>({
    url: '/wms/public/driver-check-in/batch',
    method: 'post',
    headers: publicHeaders,
    data
  });
}
