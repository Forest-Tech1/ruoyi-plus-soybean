export type DriverCheckInLang = 'zh' | 'en';

export type DriverCheckInErrorCode =
  | 'ORDER_NOT_FOUND'
  | 'ORDER_OUT_OF_DATE_RANGE'
  | 'STATUS_NOT_NOT_ARRIVED'
  | 'MULTIPLE_ORDERS'
  | 'CO_NO_REQUIRED'
  | 'CO_NOS_REQUIRED'
  | 'DRIVER_PHONE_REQUIRED'
  | 'BATCH_TOO_LARGE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

type MessageSchema = {
  companyName: string;
  pageTitle: string;
  driverPhoneLabel: string;
  driverPhonePlaceholder: string;
  coNoLabel: string;
  coNoPlaceholder: string;
  coNoPlaceholderSingle: string;
  coNoBatchHint: string;
  switchToBatch: string;
  switchToSingle: string;
  batchModeActive: string;
  checkInButton: string;
  checking: string;
  langZh: string;
  langEn: string;
  successTitle: string;
  successBatchTitle: string;
  successBatchSummary: string;
  successHintQueued: string;
  successHintPending: string;
  successAutoCloseHint: string;
  partialTitle: string;
  partialSummary: string;
  failuresHeading: string;
  successesHeading: string;
  errors: Record<DriverCheckInErrorCode, string>;
  statusLabels: Record<Api.Wms.DevanningStatus, string>;
};

const zh: MessageSchema = {
  companyName: 'Forest美西仓',
  pageTitle: '海柜到仓登记',
  driverPhoneLabel: '司机电话',
  driverPhonePlaceholder: '请输入司机手机号',
  coNoLabel: '柜号',
  coNoPlaceholder: '每行一个柜号，可批量粘贴',
  coNoPlaceholderSingle: '输入柜号，支持模糊搜索',
  coNoBatchHint: '支持多柜：一行一个柜号，空行会自动忽略。',
  switchToBatch: '切换为批量录入',
  switchToSingle: '切换为单柜搜索',
  batchModeActive: '批量模式',
  checkInButton: 'Check-in',
  checking: '登记中…',
  langZh: '中文',
  langEn: 'EN',
  successTitle: '登记成功',
  successBatchTitle: '批量登记完成',
  successBatchSummary: '共 {total} 柜，成功 {success} 柜。',
  successHintQueued: '柜号 {coNo} 已到仓，已进入 Dock 排队（排队中）。',
  successHintPending: '柜号 {coNo} 已到仓，当前为待作业（尚未指派 Dock）。',
  successAutoCloseHint: '本提示约 3 秒后自动关闭，可继续登记下一批。',
  partialTitle: '部分登记成功',
  partialSummary: '成功 {success} 柜，失败 {fail} 柜，请核对下方失败柜号。',
  failuresHeading: '登记失败',
  successesHeading: '登记成功',
  errors: {
    ORDER_NOT_FOUND: '未找到匹配的拆柜订单，请核对柜号或联系仓库。',
    ORDER_OUT_OF_DATE_RANGE: '该柜号不在可登记时间范围内（创建日为今天起前 7 天至后 2 天）。',
    STATUS_NOT_NOT_ARRIVED: '该海柜当前不是「未到仓」状态，无法登记到仓。',
    MULTIPLE_ORDERS: '柜号匹配到多条拆柜订单，请联系仓库人工处理。',
    CO_NO_REQUIRED: '请输入至少一个柜号。',
    CO_NOS_REQUIRED: '柜号列表不能为空。',
    DRIVER_PHONE_REQUIRED: '请输入司机电话。',
    BATCH_TOO_LARGE: '单次最多登记 50 个柜号，请分批提交。',
    NETWORK_ERROR: '网络异常，请稍后重试。',
    UNKNOWN: '登记失败，请稍后重试或联系仓库。'
  },
  statusLabels: {
    pending: '待作业',
    not_arrived: '未到仓',
    queued: '排队中',
    in_progress: '作业中',
    completed: '已完成'
  }
};

const en: MessageSchema = {
  companyName: 'Forest US West Warehouse',
  pageTitle: 'Container Check-in',
  driverPhoneLabel: 'Driver phone',
  driverPhonePlaceholder: 'Enter driver mobile number',
  coNoLabel: 'Container No.',
  coNoPlaceholder: 'One container per line; paste multiple',
  coNoPlaceholderSingle: 'Enter container no., fuzzy search',
  coNoBatchHint: 'Multiple containers: one per line. Blank lines are ignored.',
  switchToBatch: 'Switch to batch entry',
  switchToSingle: 'Switch to single search',
  batchModeActive: 'Batch mode',
  checkInButton: 'Check-in',
  checking: 'Checking in…',
  langZh: '中文',
  langEn: 'EN',
  successTitle: 'Check-in successful',
  successBatchTitle: 'Batch check-in complete',
  successBatchSummary: '{total} container(s), {success} succeeded.',
  successHintQueued: 'Container {coNo} checked in and queued at the assigned dock.',
  successHintPending: 'Container {coNo} checked in. Status is pending (no dock assigned yet).',
  successAutoCloseHint: 'This message closes in about 3 seconds. You may check in another batch.',
  partialTitle: 'Partially successful',
  partialSummary: '{success} succeeded, {fail} failed. See failed containers below.',
  failuresHeading: 'Failed',
  successesHeading: 'Succeeded',
  errors: {
    ORDER_NOT_FOUND: 'No matching devanning order. Please verify the container no.',
    ORDER_OUT_OF_DATE_RANGE:
      'Container is outside the check-in window (orders created from 7 days ago through 2 days ahead).',
    STATUS_NOT_NOT_ARRIVED: 'Container is not in "Not arrived" status and cannot be checked in.',
    MULTIPLE_ORDERS: 'Multiple orders match this container no. Please contact the warehouse.',
    CO_NO_REQUIRED: 'Enter at least one container no.',
    CO_NOS_REQUIRED: 'Container list cannot be empty.',
    DRIVER_PHONE_REQUIRED: 'Please enter the driver phone number.',
    BATCH_TOO_LARGE: 'At most 50 containers per submission. Please split into batches.',
    NETWORK_ERROR: 'Network error. Please try again.',
    UNKNOWN: 'Check-in failed. Please try again or contact the warehouse.'
  },
  statusLabels: {
    pending: 'Pending',
    not_arrived: 'Not arrived',
    queued: 'Queued',
    in_progress: 'In progress',
    completed: 'Completed'
  }
};

export const driverCheckInMessages: Record<DriverCheckInLang, MessageSchema> = { zh, en };

export function formatDriverCheckInSuccessMessage(
  lang: DriverCheckInLang,
  result: Pick<Api.Wms.DriverCheckInResult, 'coNo' | 'devanningStatus' | 'dockId'>
): string {
  const coNo = (result.coNo ?? '').trim();
  const hasDock = result.dockId != null && String(result.dockId).trim() !== '';
  const isQueued = result.devanningStatus === 'queued' || hasDock;
  const tpl = isQueued
    ? driverCheckInMessages[lang].successHintQueued
    : driverCheckInMessages[lang].successHintPending;
  return tpl.replace('{coNo}', coNo || '—');
}

export function formatStatusNotArrivedError(
  lang: DriverCheckInLang,
  status: Api.Wms.DevanningStatus | null | undefined
): string {
  const base = driverCheckInMessages[lang].errors.STATUS_NOT_NOT_ARRIVED;
  if (!status) return base;
  const label = driverCheckInMessages[lang].statusLabels[status] ?? status;
  return lang === 'zh' ? `${base}（当前：${label}）` : `${base} (current: ${label})`;
}

export function resolveDriverCheckInErrorMessage(
  lang: DriverCheckInLang,
  code: DriverCheckInErrorCode | string | null | undefined,
  fail?: Api.Wms.DriverCheckInFailData | Api.Wms.DriverCheckInBatchFailure | null
): string {
  const c = (code ?? 'UNKNOWN') as DriverCheckInErrorCode;
  if (c === 'STATUS_NOT_NOT_ARRIVED') {
    return formatStatusNotArrivedError(lang, fail?.devanningStatus ?? null);
  }
  const known = driverCheckInMessages[lang].errors[c as keyof typeof driverCheckInMessages.zh.errors];
  if (known) return known;
  const msg = fail && 'message' in fail ? fail.message : null;
  return msg?.trim() || driverCheckInMessages[lang].errors.UNKNOWN;
}
