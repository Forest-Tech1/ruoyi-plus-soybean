import type { SelectOption } from 'naive-ui';
import dayjs from 'dayjs';
import { fetchGetPlatformList, fetchGetPlatformWarehouseList } from '@/service/api/basic/platform-warehouse';
import { fetchGetParkSchedulingTaskList } from '@/service/api/wms/park-scheduling';

/** 园区位置类型 — 与后端 sys_dict_type.dict_type 一致；看板分区顺序按 dict_sort */
export const WMS_DICT_PARK_LOCATION_AREA = 'wms_park_location_area';

/** 取字典项排序权重（未命中字典的排最后） */
export function parkLocationAreaSortRank(dictValue: string, dictItems: Api.System.DictData[]): number {
  const item = dictItems.find(d => d.dictValue === dictValue);
  return item?.dictSort ?? Number.MAX_SAFE_INTEGER;
}

/** 按字典 dict_sort 排序位置类型 dict_value 列表 */
export function sortParkLocationAreaDictValues(
  values: string[],
  dictItems: Api.System.DictData[]
): string[] {
  return [...values].sort((a, b) => {
    const diff = parkLocationAreaSortRank(a, dictItems) - parkLocationAreaSortRank(b, dictItems);
    if (diff !== 0) return diff;
    return a.localeCompare(b, 'zh-CN');
  });
}

/** dict_value → 展示文案；未配置字典时回退原值 */
export function parkLocationAreaLabel(
  dictValue: string | null | undefined,
  record: Record<string, string>,
  unsetLabel: string
): string {
  const v = (dictValue ?? '').trim();
  if (!v) return unsetLabel;
  return record[v] ?? v;
}

/** 用户在下拉中可选的任务状态（与接口 `status` 一致，含排队、未到仓） */
export type ParkTaskManualStatus = 'pending' | 'not_arrived' | 'queued' | 'in_progress' | 'completed';

export function toParkTaskManualStatus(
  status: Api.Wms.ParkTaskStatus | null | undefined
): ParkTaskManualStatus {
  if (status === 'completed') return 'completed';
  if (status === 'in_progress') return 'in_progress';
  if (status === 'queued') return 'queued';
  if (status === 'not_arrived') return 'not_arrived';
  return 'pending';
}

/** 拆柜调度任务 → 拆柜订单主键（拆柜任务 `id` 与订单 id 同源） */
export function resolveParkTaskDevanningOrderId(
  task: Pick<Api.Wms.ParkSchedulingTask, 'id' | 'devanningOrderId' | 'taskType'>
): CommonType.IdType | null {
  if (task.taskType && task.taskType !== 'devanning') return null;
  const id = task.devanningOrderId ?? task.id;
  if (id == null || String(id).trim() === '') return null;
  return id;
}

/** 订单等级：解析为数字，非法则 null */
export function normalizeParkOrderLevel(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** 任务/订单等级（兼容看板 JSON 蛇形 `order_level`） */
export function readParkTaskOrderLevel(
  task: Api.Wms.ParkSchedulingTask | null | undefined
): number | null {
  if (!task) return null;
  const o = task as Record<string, unknown>;
  return normalizeParkOrderLevel(task.orderLevel ?? o.order_level);
}

export type ParkTaskOrderLevelLookup = {
  byId: Map<string, number>;
  byCoNo: Map<string, number>;
};

function ingestParkTaskOrderLevelLookup(
  lookup: ParkTaskOrderLevelLookup,
  task: Api.Wms.ParkSchedulingTask
) {
  const lv = readParkTaskOrderLevel(task);
  if (lv == null) return;
  lookup.byId.set(String(task.id), lv);
  const co = (task.coNo ?? '').trim();
  if (co) lookup.byCoNo.set(co, lv);
}

/** 从任务列表接口拉取等级，补全看板卡片任务（看板接口常不返 `orderLevel`） */
export async function buildParkTaskOrderLevelLookup(
  taskType: Api.Wms.ParkTaskType
): Promise<ParkTaskOrderLevelLookup> {
  const base: ParkSchedulingTaskListScanBase = {
    taskType,
    coNo: null,
    expectedDevanningTimeBegin: null,
    expectedDevanningTimeEnd: null
  };
  const [pendingPool, inProgress, notArrived] = await Promise.all([
    fetchParkSchedulingPendingPoolTasks(base),
    fetchParkSchedulingInProgressOnlyTasks(base),
    scanParkSchedulingTasksAllPages(base, 'not_arrived')
  ]);
  const lookup: ParkTaskOrderLevelLookup = { byId: new Map(), byCoNo: new Map() };
  for (const t of [...pendingPool, ...inProgress, ...notArrived]) {
    ingestParkTaskOrderLevelLookup(lookup, t);
  }
  return lookup;
}

function patchParkBoardTaskOrderLevel(
  task: Api.Wms.ParkSchedulingTask,
  lookup: ParkTaskOrderLevelLookup
): Api.Wms.ParkSchedulingTask {
  if (readParkTaskOrderLevel(task) != null) return task;
  const lv =
    lookup.byId.get(String(task.id)) ?? lookup.byCoNo.get((task.coNo ?? '').trim());
  return lv != null ? { ...task, orderLevel: lv } : task;
}

function patchParkBoardDockCard(
  dock: Api.Wms.ParkDockBoardCard,
  lookup: ParkTaskOrderLevelLookup
): Api.Wms.ParkDockBoardCard {
  return {
    ...dock,
    currentTask: dock.currentTask
      ? patchParkBoardTaskOrderLevel(dock.currentTask, lookup)
      : dock.currentTask,
    queuedTasks: dock.queuedTasks?.map(t => patchParkBoardTaskOrderLevel(t, lookup)),
    notArrivedTasks: dock.notArrivedTasks?.map(t => patchParkBoardTaskOrderLevel(t, lookup))
  };
}

/** 将任务列表中的 `orderLevel` 合并进看板 Dock 上的任务 */
export function applyParkBoardTaskOrderLevels(
  board: Api.Wms.ParkSchedulingBoard | null,
  lookup: ParkTaskOrderLevelLookup
): Api.Wms.ParkSchedulingBoard | null {
  if (!board) return null;

  if (board.sections?.length) {
    return {
      ...board,
      sections: board.sections.map(s => ({
        ...s,
        docks: (s.docks ?? []).map(d => patchParkBoardDockCard(d, lookup))
      }))
    };
  }

  if (board.docks?.length) {
    return { ...board, docks: board.docks.map(d => patchParkBoardDockCard(d, lookup)) };
  }

  const front = board.frontDocks?.map(d => patchParkBoardDockCard(d, lookup));
  const back = board.backDocks?.map(d => patchParkBoardDockCard(d, lookup));
  if (front?.length || back?.length) {
    return { ...board, frontDocks: front, backDocks: back };
  }

  return board;
}

/** 任务展示用预计拆柜日（`yyyy-MM-dd` 片段） */
export function parkTaskExpectedDevanningDate(
  task: Pick<Api.Wms.ParkSchedulingTask, 'expectedDevanningTime' | 'plannedWorkTime'> | null | undefined
): string {
  if (!task) return '';
  const raw = (task.expectedDevanningTime ?? task.plannedWorkTime ?? '').trim();
  if (!raw) return '';
  return raw.length >= 10 ? raw.slice(0, 10) : raw;
}

/**
 * 从列表接口 transform 后的 data 中取出 rows（兼容 RuoYi 顶层 rows、嵌套 data.rows、MyBatis-Plus records 等）
 */
export function extractPaginatedRows<T = unknown>(data: unknown): T[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data as T[];
  const o = data as Record<string, unknown>;
  const pick = (x: Record<string, unknown> | null | undefined): T[] | null => {
    if (!x || typeof x !== 'object' || Array.isArray(x)) return null;
    const tryKey = (v: unknown): T[] | null => {
      if (v === undefined || v === null) return null;
      if (Array.isArray(v)) return v as T[];
      if (typeof v === 'object' && !Array.isArray(v) && 'id' in (v as object)) return [v as T];
      return null;
    };
    return tryKey(x.rows) ?? tryKey(x.records) ?? tryKey(x.list);
  };
  const nested = o.data;
  if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
    const fromNested = pick(nested as Record<string, unknown>);
    if (fromNested && fromNested.length) return fromNested;
  }
  const top = pick(o);
  return top ?? [];
}

/** 从列表接口 data 中读取 total（与 request transform 后的结构对齐） */
export function extractPaginatedTotal(data: unknown): number {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    return Array.isArray(data) ? data.length : 0;
  }
  const o = data as Record<string, unknown>;
  const nums: number[] = [];
  const push = (v: unknown) => {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) nums.push(n);
  };
  push(o.total);
  push(o.totalCount);
  const nestedRaw = o.data;
  if (nestedRaw != null && typeof nestedRaw === 'object' && !Array.isArray(nestedRaw)) {
    const nested = nestedRaw as Record<string, unknown>;
    push(nested.total);
    push(nested.totalCount);
  }
  return nums.length ? Math.max(...nums) : 0;
}

const PARK_SCHEDULING_LIST_SCAN_PAGE_SIZE = 200;
const PARK_SCHEDULING_LIST_SCAN_MAX_PAGES = 100;

function compareParkSchedulingTaskPlanned(
  a: Api.Wms.ParkSchedulingTask,
  b: Api.Wms.ParkSchedulingTask
): number {
  const ta = parkTaskExpectedDevanningDate(a);
  const tb = parkTaskExpectedDevanningDate(b);
  if (ta !== tb) return ta.localeCompare(tb);
  return String(a.id).localeCompare(String(b.id), 'en');
}

/** 与 `GET .../task/list` 侧栏筛选对齐（不含分页） */
export type ParkSchedulingTaskListScanBase = Pick<
  Api.Wms.ParkSchedulingTaskSearchParams,
  'taskType' | 'coNo' | 'expectedDevanningTimeBegin' | 'expectedDevanningTimeEnd'
>;

async function scanParkSchedulingTasksAllPages(
  base: ParkSchedulingTaskListScanBase,
  workStatus: Api.Wms.ParkSchedulingWorkStatus
): Promise<Api.Wms.ParkSchedulingTask[]> {
  const out: Api.Wms.ParkSchedulingTask[] = [];
  for (let page = 1; page <= PARK_SCHEDULING_LIST_SCAN_MAX_PAGES; page += 1) {
    const { data, error } = await fetchGetParkSchedulingTaskList({
      ...base,
      workStatus,
      pageNum: page,
      pageSize: PARK_SCHEDULING_LIST_SCAN_PAGE_SIZE
    });
    if (error || !data) break;
    const rows = extractPaginatedRows<Api.Wms.ParkSchedulingTask>(data);
    out.push(...rows);
    if (rows.length < PARK_SCHEDULING_LIST_SCAN_PAGE_SIZE) break;
  }
  return out;
}

/**
 * 侧栏「待作业」Tab 数据：`status=pending` ∪ `status=queued`（排队中归入待作业池），去重后按待作业时间排序。
 * 通过多次分页拉全再合并；若任务量超过单状态 `200×100` 条可能截断（应改后端 `workStatus=pending` 一次返回合并分页）。
 */
export async function fetchParkSchedulingPendingPoolTasks(
  base: ParkSchedulingTaskListScanBase
): Promise<Api.Wms.ParkSchedulingTask[]> {
  const [pendingRows, dockedRows] = await Promise.all([
    scanParkSchedulingTasksAllPages(base, 'pending'),
    scanParkSchedulingTasksAllPages(base, 'in_progress')
  ]);
  const queued = dockedRows.filter(t => t.status === 'queued');
  const map = new Map<string, Api.Wms.ParkSchedulingTask>();
  for (const t of pendingRows) map.set(String(t.id), t);
  for (const t of queued) {
    if (!map.has(String(t.id))) map.set(String(t.id), t);
  }
  return [...map.values()].sort(compareParkSchedulingTaskPlanned);
}

/** 侧栏「作业中」Tab：仅 `status=in_progress`（排队已在「待作业」池展示） */
export async function fetchParkSchedulingInProgressOnlyTasks(
  base: ParkSchedulingTaskListScanBase
): Promise<Api.Wms.ParkSchedulingTask[]> {
  const rows = await scanParkSchedulingTasksAllPages(base, 'in_progress');
  return rows.filter(t => t.status === 'in_progress').sort(compareParkSchedulingTaskPlanned);
}

/** 侧栏「全部」Tab：合并待作业池、作业中、已完成、未到仓，按 id 去重 */
export async function fetchParkSchedulingAllTasks(
  base: ParkSchedulingTaskListScanBase
): Promise<Api.Wms.ParkSchedulingTask[]> {
  const [pendingPool, inProgress, completed, notArrived] = await Promise.all([
    fetchParkSchedulingPendingPoolTasks(base),
    fetchParkSchedulingInProgressOnlyTasks(base),
    scanParkSchedulingTasksAllPages(base, 'completed'),
    scanParkSchedulingTasksAllPages(base, 'not_arrived')
  ]);
  const map = new Map<string, Api.Wms.ParkSchedulingTask>();
  for (const t of [...pendingPool, ...inProgress, ...completed, ...notArrived]) {
    map.set(String(t.id), t);
  }
  return [...map.values()].sort(compareParkSchedulingTaskPlanned);
}

/**
 * 侧栏 Tab 角标 / 顶部统计：与 `GET .../task/list` 相同筛选（含预计拆柜日期、柜号）。
 * 「待作业」= `pending` ∪ `queued`（与 `fetchParkSchedulingPendingPoolTasks` 一致）。
 */
export async function computeParkSchedulingTaskTypeSummaries(
  base: ParkSchedulingTaskListScanBase
): Promise<{
  pendingPoolCount: number;
  inProgressOnlyCount: number;
  completedTotal: number;
  notArrivedTotal: number;
}> {
  const [pendingPool, inProgressOnly, rc, rna] = await Promise.all([
    fetchParkSchedulingPendingPoolTasks(base),
    fetchParkSchedulingInProgressOnlyTasks(base),
    fetchGetParkSchedulingTaskList({ ...base, workStatus: 'completed', pageNum: 1, pageSize: 1 }),
    fetchGetParkSchedulingTaskList({ ...base, workStatus: 'not_arrived', pageNum: 1, pageSize: 1 })
  ]);
  return {
    pendingPoolCount: pendingPool.length,
    inProgressOnlyCount: inProgressOnly.length,
    completedTotal: rc.error ? 0 : extractPaginatedTotal(rc.data),
    notArrivedTotal: rna.error ? 0 : extractPaginatedTotal(rna.data)
  };
}

/** 看板所有 Dock 卡片（含分区） */
export function collectParkBoardDocks(board: Api.Wms.ParkSchedulingBoard | null): Api.Wms.ParkDockBoardCard[] {
  if (!board) return [];
  if (board.sections?.length) return board.sections.flatMap(s => s.docks ?? []);
  if (board.docks?.length) return board.docks;
  return [...(board.frontDocks ?? []), ...(board.backDocks ?? [])];
}

/**
 * 从看板 Dock 卡片读取 **`sort_order` / `sortOrder`**（RuoYi 列表常为蛇形 `sort_order`，看板 JSON 若未转驼峰则前端原先读不到 `sortOrder`，会导致区内顺序退化为按名称排序，出现「铁门」排在 Dock43 前等问题）。
 */
export function readParkDockSortOrder(dock: Api.Wms.ParkDockBoardCard): number | null {
  const o = dock as Record<string, unknown>;
  const raw = dock.sortOrder ?? o.sort_order;
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw === 'string') {
    const n = Number(String(raw).trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * 升序比较用键：**`null` / 非数字** 视为未配置，用极大值排**同区块末尾**（避免误用 `0` 抢最前）。
 */
export function parkDockBoardSortRankNumber(v: number | null | undefined): number {
  if (v == null) return Number.MAX_SAFE_INTEGER;
  const n = Number(v);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

/** 看板道口卡片排序键（= `readParkDockSortOrder` + 空值排尾） */
export function parkDockBoardSortOrderKeyFromDock(dock: Api.Wms.ParkDockBoardCard): number {
  return parkDockBoardSortRankNumber(readParkDockSortOrder(dock));
}

/**
 * 看板分区内 Dock 排序：优先 `sortOrder`（含蛇形 `sort_order`）、再 `gridRow` / `gridCol`。
 * 仍无法区分时按**传入数组的下标**稳定排序（保持接口 `docks[]` 顺序），**不用** `slotName` 的 `localeCompare` 作末键：
 * 否则在均未返 `sortOrder`、网格全空时，`Dock-铁门*` 会因连字符 `-` 排在 `Dock43` 的 `4` 之前而倒置。
 */
export function sortParkDockBoardCardsByLayout(docks: Api.Wms.ParkDockBoardCard[]): Api.Wms.ParkDockBoardCard[] {
  return docks
    .map((dock, index) => ({ dock, index }))
    .sort((a, b) => {
      const s = parkDockBoardSortOrderKeyFromDock(a.dock) - parkDockBoardSortOrderKeyFromDock(b.dock);
      if (s !== 0) return s;
      const r = (a.dock.gridRow ?? 0) - (b.dock.gridRow ?? 0);
      if (r !== 0) return r;
      const c = (a.dock.gridCol ?? 0) - (b.dock.gridCol ?? 0);
      if (c !== 0) return c;
      return a.index - b.index;
    })
    .map(({ dock }) => dock);
}

/** 按道口 `businessType` 过滤看板（前端裁剪；接口仍可按全量返回） */
export function filterParkBoardByDockBusinessType(
  board: Api.Wms.ParkSchedulingBoard | null,
  businessType: Api.Wms.ParkTaskType
): Api.Wms.ParkSchedulingBoard | null {
  if (!board) return null;
  const match = (d: Api.Wms.ParkDockBoardCard) => (d.businessType ?? 'devanning') === businessType;

  if (board.sections?.length) {
    const sections = board.sections
      .map(s => ({
        ...s,
        docks: (s.docks ?? []).filter(match)
      }))
      .filter(s => (s.docks?.length ?? 0) > 0);
    return { ...board, sections };
  }

  if (board.docks?.length) {
    return { ...board, docks: board.docks.filter(match) };
  }

  const front = (board.frontDocks ?? []).filter(match);
  const back = (board.backDocks ?? []).filter(match);
  if ((board.frontDocks?.length ?? 0) > 0 || (board.backDocks?.length ?? 0) > 0) {
    return {
      ...board,
      frontDocks: front.length ? front : undefined,
      backDocks: back.length ? back : undefined
    };
  }

  return board;
}

/**
 * Dock 上「正在作业」的任务数：当前看板中 `currentTask.status === in_progress`
 * 且任务类型与给定 `taskType` 一致（与侧栏拆柜/装车筛选对齐）
 */
export function countParkBoardDockInProgressTasks(
  board: Api.Wms.ParkSchedulingBoard | null,
  taskType: Api.Wms.ParkTaskType
): number {
  return collectParkBoardDocks(board).filter(
    d =>
      !d.placeholder &&
      d.currentTask?.status === 'in_progress' &&
      d.currentTask.taskType === taskType
  ).length;
}
/** 侧栏默认筛选：预计拆柜日期 = 当日 */
export function getDefaultParkExpectedDevanningTimeRange() {
  return {
    expectedDevanningTimeBegin: dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    expectedDevanningTimeEnd: dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss')
  };
}

/** @deprecated 请用 {@link getDefaultParkExpectedDevanningTimeRange} */
export const getDefaultParkTaskPlannedWorkTimeRange = getDefaultParkExpectedDevanningTimeRange;

/** 新建任务 — 默认预计拆柜日期 `yyyy-MM-dd` */
export function getDefaultParkTaskPlannedWorkDate() {
  return dayjs().format('YYYY-MM-DD');
}

/** 批量柜号输入：换行、逗号、分号、空格分隔，去重 */
export function parseParkTaskCoNoBatch(raw: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(/[\n,，;；\s]+/)) {
    const co = part.trim();
    if (!co || seen.has(co)) continue;
    seen.add(co);
    result.push(co);
  }
  return result;
}

/** 批量 `POST .../task/batch` 的 `batchItems[].status` 合法中文原文（与后端常量一致） */
export const PARK_DEVANNING_BATCH_STATUS = {
  NOT_ARRIVED: '柜子未到',
  PENDING: '已到待拆',
  INVENTORY_UPDATE: '库存更新',
  COMPLETED: '已到拆完',
  IN_PROGRESS: '拆柜中'
} as const;

export type ParkDevanningBatchPasteStatus =
  (typeof PARK_DEVANNING_BATCH_STATUS)[keyof typeof PARK_DEVANNING_BATCH_STATUS];

export type ParkDevanningBatchPasteItem = {
  coNo: string;
  /** 提交接口用的中文 status，非侧栏英文码 */
  status: ParkDevanningBatchPasteStatus;
  vehicleCount?: number | null;
  volume?: number | null;
  /** 粘贴列末尾道口识别码（如 `43`），提交前解析为 dockId */
  dockHint?: string | null;
  dockId?: CommonType.IdType | null;
  devanningDock?: string | null;
  assignToDockMode?: 'current' | 'queued' | 'not_arrived' | null;
};

/** 后端不参与调度的柜号（含连字符） */
export function isParkBatchCoNoRejected(coNo: string): boolean {
  return String(coNo ?? '').trim().includes('-');
}

export type ParkDevanningBatchPasteSkipped = {
  coNo: string;
  rawLine: string;
  reason: string;
};

function parseVehicleVolumeRatio(text: string): { vehicleCount: number; volume: number } | null {
  const m = text.trim().match(/^(\d+)\s*\/\s*([\d.]+)$/);
  if (!m) return null;
  const vehicleCount = Number(m[1]);
  const volume = Number(m[2]);
  if (!Number.isFinite(vehicleCount) || !Number.isFinite(volume)) return null;
  return { vehicleCount, volume };
}

/**
 * 粘贴列状态 → `batchItems[].status` 中文原文（先匹配更长短语）。
 * 侧栏/改状态接口仍用英文 `ParkTaskStatus`，勿混用。
 */
export function resolveDevanningPasteBatchStatus(statusText: string): ParkDevanningBatchPasteStatus {
  const t = statusText.trim();
  if (!t) return PARK_DEVANNING_BATCH_STATUS.PENDING;
  if (t.includes('柜子未到')) return PARK_DEVANNING_BATCH_STATUS.NOT_ARRIVED;
  if (t.includes('已到拆完')) return PARK_DEVANNING_BATCH_STATUS.COMPLETED;
  if (t.includes('库存更新')) return PARK_DEVANNING_BATCH_STATUS.INVENTORY_UPDATE;
  if (t.includes('拆柜中')) return PARK_DEVANNING_BATCH_STATUS.IN_PROGRESS;
  if (t.includes('已到待拆')) return PARK_DEVANNING_BATCH_STATUS.PENDING;
  const lower = t.toLowerCase();
  if (lower === 'not_arrived') return PARK_DEVANNING_BATCH_STATUS.NOT_ARRIVED;
  if (lower === 'completed') return PARK_DEVANNING_BATCH_STATUS.COMPLETED;
  if (lower === 'in_progress') return PARK_DEVANNING_BATCH_STATUS.IN_PROGRESS;
  if (lower === 'pending' || lower === 'queued') return PARK_DEVANNING_BATCH_STATUS.PENDING;
  return PARK_DEVANNING_BATCH_STATUS.PENDING;
}

/** 批量粘贴状态 → 逐柜 `assignToDockMode`（与 POST batch 逐柜字段一致） */
export function resolveBatchAssignModeForDevanningStatus(
  status: ParkDevanningBatchPasteStatus
): 'current' | 'queued' | 'not_arrived' | null {
  if (status === PARK_DEVANNING_BATCH_STATUS.IN_PROGRESS) return 'current';
  if (status === PARK_DEVANNING_BATCH_STATUS.NOT_ARRIVED) return 'not_arrived';
  if (status === PARK_DEVANNING_BATCH_STATUS.PENDING) return 'queued';
  return null;
}

function pasteTokenLooksLikeDockHint(token: string): boolean {
  const t = token.trim();
  if (!t || t.includes('/')) return false;
  if (/柜子|待到|拆完|库存|拆柜|已到/.test(t)) return false;
  return /^[\dA-Za-z][\dA-Za-z-]*$/.test(t);
}

/** 解析「状态 + 可选 车数/体积 + 可选 道口识别码」列（空格或 tab 分列） */
function parseDevanningPasteTailTokens(tokens: string[]): {
  statusText: string;
  ratioText?: string;
  dockHint?: string;
} {
  if (!tokens.length) return { statusText: '' };

  const work = [...tokens];
  let dockHint: string | undefined;
  const ratioIdx = work.findIndex(t => parseVehicleVolumeRatio(t));

  if (ratioIdx >= 0 && work.length > ratioIdx + 1) {
    const tail = work[work.length - 1]!;
    if (pasteTokenLooksLikeDockHint(tail)) {
      dockHint = work.pop()!.trim();
    }
  } else if (work.length > 0) {
    const tail = work[work.length - 1]!;
    if (pasteTokenLooksLikeDockHint(tail)) {
      dockHint = work.pop()!.trim();
    }
  }

  let ratioText: string | undefined;
  const rIdx = work.findIndex(t => parseVehicleVolumeRatio(t));
  if (rIdx >= 0) {
    ratioText = work[rIdx];
    work.splice(rIdx, 1);
  }

  return { statusText: work.join(' ').trim(), ratioText, dockHint };
}

/** 批量失败 `failures[].reason` 展示（未知 reason 原样返回） */
export function formatParkBatchFailureReason(
  reason: string,
  translate: (key: string) => string
): string {
  const code = String(reason ?? '').trim();
  if (!code) return '';
  const key = `page.wms.parkScheduling.batchFailure.${code}`;
  const label = translate(key);
  return label !== key ? label : code;
}

function parseDevanningPasteSegment(segment: string): {
  item: ParkDevanningBatchPasteItem | null;
  skipped: ParkDevanningBatchPasteSkipped | null;
} {
  const t = segment.trim();
  if (!t) return { item: null, skipped: null };

  const tabParts = t.split(/\t/).map(p => p.trim()).filter(Boolean);
  let coNo = '';
  let statusText = '';
  let ratioText: string | undefined;

  let dockHint: string | undefined;

  if (tabParts.length >= 2) {
    coNo = tabParts[0]!;
    const tail = parseDevanningPasteTailTokens(tabParts.slice(1));
    statusText = tail.statusText;
    ratioText = tail.ratioText;
    dockHint = tail.dockHint;
  } else if (/^\S+\s+\S/.test(t)) {
    const sp = t.split(/\s+/).filter(Boolean);
    coNo = sp[0]!;
    const tail = parseDevanningPasteTailTokens(sp.slice(1));
    statusText = tail.statusText;
    ratioText = tail.ratioText;
    dockHint = tail.dockHint;
  } else {
    coNo = t;
    statusText = '';
  }

  if (!coNo) return { item: null, skipped: null };

  if (isParkBatchCoNoRejected(coNo)) {
    return {
      item: null,
      skipped: { coNo, rawLine: t, reason: 'CO_NO_HYPHEN' }
    };
  }

  const status = resolveDevanningPasteBatchStatus(statusText);

  const ratio = ratioText ? parseVehicleVolumeRatio(ratioText) : null;
  return {
    item: {
      coNo,
      status,
      vehicleCount: ratio?.vehicleCount ?? null,
      volume: ratio?.volume ?? null,
      dockHint: dockHint ?? null,
      dockId: null,
      devanningDock: null,
      assignToDockMode: resolveBatchAssignModeForDevanningStatus(status)
    },
    skipped: null
  };
}

/**
 * 拆柜批量粘贴：柜号 + 状态 + 可选「车数/体积」。
 * - 格式：`柜号 状态 [车数/体积] [道口识别码]`，例 `YMLU9552149 拆柜中 1/30 43`（`43` 模糊匹配道口名称）。
 * - `batchItems[].status` 传中文；拆柜中 → 作业中 + 指定道口；见 `docs/wms-park-batch-paste-dock-sync-api.md`。
 * - 柜号含 `-` 整行跳过（`CO_NO_HYPHEN`）。
 */
export function parseParkDevanningBatchPaste(raw: string): {
  items: ParkDevanningBatchPasteItem[];
  skipped: ParkDevanningBatchPasteSkipped[];
} {
  const byCo = new Map<string, ParkDevanningBatchPasteItem>();
  const skipped: ParkDevanningBatchPasteSkipped[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;

    const segments = /[,，;；]/.test(t) && !t.includes('\t') ? t.split(/[,，;；]+/) : [t];
    for (const seg of segments) {
      const { item, skipped: sk } = parseDevanningPasteSegment(seg);
      if (sk) skipped.push(sk);
      if (item) byCo.set(item.coNo, item);
    }
  }

  return { items: [...byCo.values()], skipped };
}

/** @deprecated 请用 `parseParkDevanningBatchPaste` */
export function parseParkDevanningBatchLines(raw: string): ParkDevanningBatchPasteItem[] {
  return parseParkDevanningBatchPaste(raw).items;
}

/** 拉取全部启用平台下的仓库，供园区调度/管理页仓库下拉 */
export async function fetchParkWarehouseSelectOptions(): Promise<SelectOption[]> {
  const { data: platforms, error: platformError } = await fetchGetPlatformList();
  if (platformError || !platforms?.length) return [];

  const options: SelectOption[] = [];
  for (const platform of platforms) {
    if (platform.status != null && platform.status !== '0') continue;
    const { data, error } = await fetchGetPlatformWarehouseList({
      platformId: platform.id,
      pageNum: 1,
      pageSize: 500,
      keyword: null,
      status: '0',
      countryCodes: null
    });
    if (error || !data?.rows?.length) continue;
    for (const w of data.rows) {
      options.push({
        label: w.warehouseName ? `${w.warehouseName}` : String(w.warehouseCode),
        value: w.id
      });
    }
  }
  return options;
}

/** 解析批量新建接口返回（兼容 `data` 包裹或旧版仅 `code=200`） */
export function normalizeParkBatchUpsertResult(raw: unknown): Api.Wms.ParkSchedulingBatchUpsertResult | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const body =
    o.successCount != null || o.failCount != null || o.successes != null || o.failures != null
      ? o
      : o.data != null && typeof o.data === 'object' && !Array.isArray(o.data)
        ? (o.data as Record<string, unknown>)
        : null;
  if (!body) return null;

  const successes = Array.isArray(body.successes)
    ? (body.successes as { coNo?: string; orderId?: CommonType.IdType }[])
        .filter(x => x?.coNo)
        .map(x => ({ coNo: String(x.coNo), orderId: x.orderId! }))
    : [];
  const failures = Array.isArray(body.failures)
    ? (body.failures as { coNo?: string; reason?: string }[])
        .filter(x => x?.coNo)
        .map(x => ({ coNo: String(x.coNo), reason: String(x.reason ?? '') }))
    : [];

  let autoAssign: Api.Wms.ParkSchedulingAutoAssignResult | null | undefined;
  const aa = body.autoAssign;
  if (aa != null && typeof aa === 'object' && !Array.isArray(aa)) {
    const a = aa as Record<string, unknown>;
    autoAssign = {
      executed: Boolean(a.executed),
      expectedDevanningTime: String(a.expectedDevanningTime ?? ''),
      assignedCount: Number(a.assignedCount ?? 0) || 0,
      skippedCount: Number(a.skippedCount ?? 0) || 0,
      assigned: Array.isArray(a.assigned)
        ? (a.assigned as Api.Wms.ParkSchedulingAutoAssignResult['assigned'])
        : [],
      assignSkipped: Array.isArray(a.assignSkipped)
        ? (a.assignSkipped as Api.Wms.ParkSchedulingAutoAssignResult['assignSkipped'])
        : [],
      dockLoads: Array.isArray(a.dockLoads)
        ? (a.dockLoads as Api.Wms.ParkSchedulingAutoAssignResult['dockLoads'])
        : []
    };
  }

  return {
    successCount: Number(body.successCount ?? successes.length) || 0,
    failCount: Number(body.failCount ?? failures.length) || 0,
    successes,
    failures,
    autoAssign
  };
}
