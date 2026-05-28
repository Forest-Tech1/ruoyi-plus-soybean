import { reactive } from 'vue';
import { defineStore } from 'pinia';
import { SetupStoreId } from '@/enum';

export type NoticeKind = 'generic' | 'driver_check_in';

export interface NoticeItem {
  kind?: NoticeKind;
  /** Check-in 记录主键（`driver_check_in` 时用于跳转与已读） */
  recordId?: CommonType.IdType;
  coNo?: string;
  driverPhone?: string;
  title?: string;
  read: boolean;
  message: string;
  time: string;
}

export const useNoticeStore = defineStore(SetupStoreId.Notice, () => {
  const state: { notices: NoticeItem[] } = reactive({
    notices: []
  });

  const addNotice = (notice: NoticeItem) => {
    state.notices.unshift(notice);
    if (state.notices.length > 100) {
      state.notices.length = 100;
    }
  };

  const removeNotice = (notice: NoticeItem) => {
    const idx = state.notices.indexOf(notice);
    if (idx >= 0) state.notices.splice(idx, 1);
  };

  const readNotice = (notice: NoticeItem) => {
    const idx = state.notices.indexOf(notice);
    if (idx >= 0) state.notices[idx].read = true;
  };

  const readAll = () => {
    state.notices.forEach(item => {
      item.read = true;
    });
  };

  const clearNotice = () => {
    state.notices = [];
  };

  const driverCheckInNotices = () =>
    state.notices.filter(n => n.kind === 'driver_check_in');

  const genericNotices = () => state.notices.filter(n => n.kind !== 'driver_check_in');

  return {
    state,
    addNotice,
    removeNotice,
    readNotice,
    readAll,
    clearNotice,
    driverCheckInNotices,
    genericNotices
  };
});
