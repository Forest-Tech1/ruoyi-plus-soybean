import { fetchPatchParkSchedulingTask, fetchReorderParkDockQueue } from '@/service/api/wms/park-scheduling';
import { getDevanningRoundDictValuesSorted } from '@/constants/wms-devanning';

/** 排队任务：仅 `status=queued`，按 `queuePosition` 升序 */
export function sortParkDockQueuedTasks(
  tasks: Api.Wms.ParkSchedulingTask[] | null | undefined
): Api.Wms.ParkSchedulingTask[] {
  return [...(tasks ?? [])]
    .filter(t => t.status === 'queued')
    .sort((a, b) => (a.queuePosition ?? 0) - (b.queuePosition ?? 0));
}

/**
 * 按排队顺序为拆柜任务对齐作业轮次（字典 dict_sort）；装车跳过。
 * `leadingDevanningSlots`：Dock 上已占用字典前几顺位（通常为当前 `in_progress` 拆柜占 1 位，使队首排队任务从「第二轮」起对齐）。
 */
export async function patchDevanningRoundsForQueuedOrder(
  tasksInOrder: Api.Wms.ParkSchedulingTask[],
  devanningDictItems: Api.System.DictData[],
  options?: { leadingDevanningSlots?: number }
) {
  const values = getDevanningRoundDictValuesSorted(devanningDictItems);
  if (!values.length) return;

  let devIdx = Math.max(0, options?.leadingDevanningSlots ?? 0);
  for (const task of tasksInOrder) {
    if (task.taskType !== 'devanning') continue;
    const desired = devIdx < values.length ? values[devIdx]! : null;
    devIdx += 1;
    const cur =
      task.devanningRound != null && String(task.devanningRound).trim() !== ''
        ? String(task.devanningRound)
        : null;
    if (cur === desired) continue;
    const { error } = await fetchPatchParkSchedulingTask({ taskId: task.id, devanningRound: desired });
    if (error) break;
  }
}

/** `PUT .../queue` + 拆柜轮次 PATCH 兜底；成功返回 `true` */
export async function persistParkDockQueuedOrder(
  dockId: CommonType.IdType,
  orderedQueued: Api.Wms.ParkSchedulingTask[],
  devanningDictItems: Api.System.DictData[],
  options?: { leadingDevanningSlots?: number }
): Promise<boolean> {
  const { error } = await fetchReorderParkDockQueue(dockId, {
    orderedTaskIds: orderedQueued.map(t => t.id)
  });
  if (error) return false;
  await patchDevanningRoundsForQueuedOrder(orderedQueued, devanningDictItems, options);
  return true;
}

/** Dock 当前拆柜作业中任务占用「第一轮」字典顺位；队首排队任务从下一轮起对齐 */
export function countLeadingDevanningRoundSlots(
  currentTask: Api.Wms.ParkSchedulingTask | null | undefined
): number {
  if (!currentTask || currentTask.taskType !== 'devanning') return 0;
  if (currentTask.status !== 'in_progress') return 0;
  return 1;
}
