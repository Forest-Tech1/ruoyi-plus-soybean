import dayjs from 'dayjs';
import { $t } from '@/locales';

/** Check-in 记录列表默认筛选：当天 00:00:00 ~ 23:59:59 */
export function getDefaultDriverCheckInRecordTimeRange() {
  return {
    checkedInBegin: dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    checkedInEnd: dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss')
  };
}

export function formatDriverCheckInNoticeMessage(
  record: Pick<Api.Wms.DriverCheckInRecord, 'coNo' | 'driverPhone' | 'checkedInAt'>
) {
  const coNo = (record.coNo ?? '').trim() || '—';
  const phone = (record.driverPhone ?? '').trim() || '—';
  return $t('page.wms.driverCheckInRecord.noticeMessage', { coNo, driverPhone: phone });
}
