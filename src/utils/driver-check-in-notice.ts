import { formatDriverCheckInNoticeMessage } from '@/constants/wms-driver-check-in';
import { useNoticeStore, type NoticeItem } from '@/store/modules/notice';
import { localStg } from '@/utils/storage';

const SEEN_IDS_KEY = 'driver-check-in-record-seen-ids';
const MAX_SEEN_IDS = 500;

function loadSeenIds(): Set<string> {
  const raw = localStg.get(SEEN_IDS_KEY);
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.map(String));
}

function saveSeenIds(ids: Set<string>) {
  const arr = [...ids].slice(-MAX_SEEN_IDS);
  localStg.set(SEEN_IDS_KEY, arr);
}

export function markDriverCheckInRecordSeen(recordId: CommonType.IdType) {
  const ids = loadSeenIds();
  ids.add(String(recordId));
  saveSeenIds(ids);
}

export function isDriverCheckInRecordSeen(recordId: CommonType.IdType) {
  return loadSeenIds().has(String(recordId));
}

export function buildDriverCheckInNotice(record: Api.Wms.DriverCheckInRecord): NoticeItem {
  const seen = isDriverCheckInRecordSeen(record.id);
  return {
    kind: 'driver_check_in',
    recordId: record.id,
    coNo: record.coNo,
    driverPhone: record.driverPhone,
    title: record.coNo,
    message: formatDriverCheckInNoticeMessage(record),
    read: seen,
    time: record.checkedInAt
  };
}

export function pushDriverCheckInNotice(record: Api.Wms.DriverCheckInRecord) {
  const store = useNoticeStore();
  const exists = store.state.notices.some(
    n => n.kind === 'driver_check_in' && String(n.recordId) === String(record.id)
  );
  if (exists) return;
  store.addNotice(buildDriverCheckInNotice(record));
  if (!isDriverCheckInRecordSeen(record.id)) {
    window.$notification?.create({
      title: formatDriverCheckInNoticeMessage(record).split('·')[0]?.trim() || record.coNo,
      content: formatDriverCheckInNoticeMessage(record),
      type: 'info',
      duration: 4500
    });
  }
}

/** 解析 WebSocket / SSE 文本；支持纯 JSON 或嵌入 JSON */
export function tryParseDriverCheckInPush(raw: string): Api.Wms.DriverCheckInRecord | null {
  const text = raw.trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as Api.Wms.DriverCheckInRecordPushPayload | Api.Wms.DriverCheckInRecord;
    if ('type' in parsed && parsed.type === 'driver_check_in' && parsed.record) {
      return parsed.record;
    }
    if ('coNo' in parsed && 'checkedInAt' in parsed && 'driverPhone' in parsed) {
      return parsed as Api.Wms.DriverCheckInRecord;
    }
  } catch {
    /* not json */
  }
  return null;
}
