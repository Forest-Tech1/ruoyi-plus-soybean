import { onMounted, onUnmounted, watch } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { fetchDriverCheckInRecordRecent } from '@/service/api/wms/driver-check-in-record';
import { pushDriverCheckInNotice } from '@/utils/driver-check-in-notice';

const POLL_MS = 30_000;

let pollTimer: ReturnType<typeof setInterval> | null = null;
let polling = false;

async function pollDriverCheckInRecords() {
  if (polling) return;
  polling = true;
  try {
    const { data, error } = await fetchDriverCheckInRecordRecent({ todayOnly: true, limit: 30 });
    if (error || !data?.length) return;
    for (const record of data) {
      pushDriverCheckInNotice(record);
    }
  } finally {
    polling = false;
  }
}

function startPoll() {
  stopPoll();
  void pollDriverCheckInRecords();
  pollTimer = setInterval(() => {
    void pollDriverCheckInRecords();
  }, POLL_MS);
}

function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/** 登录后轮询当天 Check-in 记录，写入顶部通知 */
export function useDriverCheckInNoticePoll() {
  const authStore = useAuthStore();

  onMounted(() => {
    if (authStore.isLogin) startPoll();
  });

  watch(
    () => authStore.isLogin,
    loggedIn => {
      if (loggedIn) startPoll();
      else stopPoll();
    }
  );

  onUnmounted(() => {
    stopPoll();
  });
}
