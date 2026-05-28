import { request } from '@/service/request';

/** 调度看板（Dock 可视化 + 当前/排队任务摘要） */
export function fetchGetParkSchedulingBoard(params?: {
  warehouseId?: CommonType.IdType | null;
}) {
  return request<Api.Wms.ParkSchedulingBoard>({
    url: '/wms/park/scheduling/board',
    method: 'get',
    params
  });
}

/** 调度任务分页（侧栏待作业/已完成） */
export function fetchGetParkSchedulingTaskList(params?: Api.Wms.ParkSchedulingTaskSearchParams) {
  return request<Api.Wms.ParkSchedulingTaskList>({
    url: '/wms/park/scheduling/task/list',
    method: 'get',
    params
  });
}

/** 新建调度任务（拆柜 / 装车） */
export function fetchCreateParkSchedulingTask(data: Api.Wms.ParkSchedulingTaskCreateParams) {
  return request<boolean>({
    url: '/wms/park/scheduling/task',
    method: 'post',
    data
  });
}

/**
 * 批量新建/更新拆柜调度（按柜号匹配拆柜订单；装车仍走原语义）
 * @see docs/wms-park-devanning-scheduling-api.md
 */
export function fetchBatchCreateParkSchedulingTask(data: Api.Wms.ParkSchedulingTaskBatchCreateParams) {
  return request<Api.Wms.ParkSchedulingBatchUpsertResult>({
    url: '/wms/park/scheduling/task/batch',
    method: 'post',
    data
  });
}

/** 指派任务到 Dock；侧栏拖拽经 dataTransfer 传 `assignIntent`（待作业 `queued` / 未到仓 `not_arrived`） */
export function fetchAssignParkSchedulingTask(data: Api.Wms.ParkSchedulingTaskAssignParams) {
  return request<boolean>({
    url: '/wms/park/scheduling/task/assign',
    method: 'put',
    data
  });
}

/** 完成任务 */
export function fetchCompleteParkSchedulingTask(id: CommonType.IdType) {
  return request<boolean>({
    url: `/wms/park/scheduling/task/complete/${id}`,
    method: 'put'
  });
}

/** 就地修改任务字段（侧栏双击编辑） */
export function fetchPatchParkSchedulingTask(data: Api.Wms.ParkSchedulingTaskPatchParams) {
  return request<boolean>({
    url: '/wms/park/scheduling/task/patch',
    method: 'put',
    data
  });
}

/** 手动变更任务状态（待作业 / 作业中 / 已完成） */
export function fetchUpdateParkSchedulingTaskStatus(data: Api.Wms.ParkSchedulingTaskStatusParams) {
  return request<boolean>({
    url: '/wms/park/scheduling/task/status',
    method: 'put',
    data
  });
}

/** Dock 当前作业与排队明细（点击卡片弹窗） */
export function fetchGetParkDockQueueDetail(dockId: CommonType.IdType) {
  return request<Api.Wms.ParkDockQueueDetail>({
    url: `/wms/park/scheduling/dock/${dockId}/queue`,
    method: 'get'
  });
}

/** 调整 Dock 上排队任务的作业顺序；拆柜任务后端须同步作业轮次（见 docs §4.6.1） */
export function fetchReorderParkDockQueue(dockId: CommonType.IdType, data: Api.Wms.ParkDockQueueReorderParams) {
  return request<boolean>({
    url: `/wms/park/scheduling/dock/${dockId}/queue`,
    method: 'put',
    data
  });
}

/**
 * 跨 Dock 迁移排队任务（`status=queued`）；源/目标队列与拆柜轮次由后端按 §4.6.2 重算（见 docs §4.6.1.1）
 */
export function fetchTransferParkQueuedTaskBetweenDocks(data: Api.Wms.ParkQueuedTaskTransferParams) {
  return request<boolean>({
    url: '/wms/park/scheduling/task/queue/transfer',
    method: 'put',
    data
  });
}

/** 释放道口：将该 Dock 上全部海柜任务置为已完成并清空道口占用 */
export function fetchReleaseParkDock(data: Api.Wms.ParkDockReleaseParams) {
  return request<Api.Wms.ParkDockReleaseResult>({
    url: '/wms/park/scheduling/dock/release',
    method: 'put',
    data
  });
}
