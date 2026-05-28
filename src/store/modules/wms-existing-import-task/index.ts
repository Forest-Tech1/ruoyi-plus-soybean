import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { SetupStoreId } from '@/enum';
import {
  fetchCancelInventoryDataExistingImportTask,
  fetchGetInventoryDataExistingImportTask
} from '@/service/api/wms/inventory-data';

const STORAGE_KEY = 'wms-existing-import-tasks';
const MAX_TASKS = 40;
const POLL_MS = 3000;

export type WmsExistingImportTaskRecord = {
  taskId: CommonType.IdType;
  submittedAt: string;
  /** 用户已读（仅对终态任务计未读角标） */
  read: boolean;
  lastStatus: Api.Wms.WarehouseInventoryExistingImportTaskStatusVo | null;
};

function isTerminalStatus(st: string | null | undefined): boolean {
  const u = String(st ?? '')
    .trim()
    .toUpperCase();
  return (
    u === 'SUCCESS' ||
    u === 'FAILED' ||
    u === 'CANCELLED' ||
    u === 'CANCELED' ||
    u === 'CANCELLED_BY_USER' ||
    u === 'ABORTED'
  );
}

function isRunningStatus(st: string | null | undefined): boolean {
  if (st == null || !String(st).trim()) return true;
  return !isTerminalStatus(st);
}

function loadFromStorage(): WmsExistingImportTaskRecord[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as WmsExistingImportTaskRecord[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveToStorage(tasks: WmsExistingImportTaskRecord[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // ignore
  }
}

function pruneTasks(taskList: WmsExistingImportTaskRecord[]): WmsExistingImportTaskRecord[] {
  if (taskList.length <= MAX_TASKS) return taskList;
  const newestFirst = [...taskList].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
  return newestFirst.slice(0, MAX_TASKS);
}

export const useWmsExistingImportTaskStore = defineStore(SetupStoreId.WmsExistingImportTask, () => {
  const tasks = ref<WmsExistingImportTaskRecord[]>(loadFromStorage());
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  function persist() {
    saveToStorage(tasks.value);
  }

  function registerTask(taskId: CommonType.IdType) {
    const sid = String(taskId);
    if (tasks.value.some(t => String(t.taskId) === sid)) {
      persist();
      ensurePolling();
      return;
    }
    tasks.value.unshift({
      taskId,
      submittedAt: new Date().toISOString(),
      read: false,
      lastStatus: null
    });
    tasks.value = pruneTasks(tasks.value);
    persist();
    ensurePolling();
    void refreshTask(taskId);
  }

  function markRead(taskId: CommonType.IdType) {
    const sid = String(taskId);
    const i = tasks.value.findIndex(t => String(t.taskId) === sid);
    if (i < 0) return;
    tasks.value[i] = { ...tasks.value[i]!, read: true };
    persist();
  }

  function markAllTerminalRead() {
    let changed = false;
    tasks.value = tasks.value.map(t => {
      if (t.lastStatus && isTerminalStatus(t.lastStatus.status) && !t.read) {
        changed = true;
        return { ...t, read: true };
      }
      return t;
    });
    if (changed) persist();
  }

  async function refreshTask(taskId: CommonType.IdType): Promise<void> {
    const sid = String(taskId);
    const { data, error } = await fetchGetInventoryDataExistingImportTask(taskId);
    if (error) return;
    const idx = tasks.value.findIndex(t => String(t.taskId) === sid);
    if (idx < 0) return;
    tasks.value[idx] = {
      ...tasks.value[idx]!,
      lastStatus: data ?? null
    };
    persist();
  }

  async function pollOnce(): Promise<void> {
    const pending = tasks.value.filter(t => !t.lastStatus || isRunningStatus(t.lastStatus.status));
    await Promise.all(pending.map(t => refreshTask(t.taskId)));
  }

  function ensurePolling() {
    const need = tasks.value.some(t => !t.lastStatus || isRunningStatus(t.lastStatus.status));
    if (!need) {
      stopPolling();
      return;
    }
    if (pollTimer != null) return;
    pollTimer = setInterval(() => {
      void pollOnce();
    }, POLL_MS);
  }

  function stopPolling() {
    if (pollTimer != null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  watch(
    tasks,
    () => {
      const need = tasks.value.some(t => !t.lastStatus || isRunningStatus(t.lastStatus.status));
      if (need) ensurePolling();
      else stopPolling();
    },
    { deep: true }
  );

  /** 页面挂载时恢复轮询 */
  function resumePollingIfNeeded() {
    tasks.value = loadFromStorage();
    ensurePolling();
    void pollOnce();
  }

  const runningCount = computed(
    () =>
      tasks.value.filter(t => !t.lastStatus || isRunningStatus(t.lastStatus.status)).length
  );

  const unreadTerminalCount = computed(
    () =>
      tasks.value.filter(
        t => t.lastStatus && isTerminalStatus(t.lastStatus.status) && !t.read
      ).length
  );

  async function requestCancel(taskId: CommonType.IdType): Promise<boolean> {
    const { error } = await fetchCancelInventoryDataExistingImportTask(taskId);
    if (error) return false;
    await refreshTask(taskId);
    return true;
  }

  return {
    tasks,
    registerTask,
    markRead,
    markAllTerminalRead,
    refreshTask,
    resumePollingIfNeeded,
    requestCancel,
    runningCount,
    unreadTerminalCount,
    isTerminalStatus,
    isRunningStatus
  };
});
