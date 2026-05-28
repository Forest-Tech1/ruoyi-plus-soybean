import { collectParkBoardDocks, extractPaginatedRows } from '@/constants/wms-park';
import { fetchGetParkDockList } from '@/service/api/wms/park-dock';

export type ParkDockSuggestOption = {
  value: string;
  label: string;
  dockId: CommonType.IdType;
  slotName: string;
  locationArea: string;
  businessType: Api.Wms.ParkTaskType;
};

function normalizeFuzzyText(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '');
}

/** 道口名称 / 位置类型 / id 子串匹配（忽略大小写与空格） */
export function fuzzyMatchParkDockQuery(
  query: string,
  item: Pick<ParkDockSuggestOption, 'slotName' | 'locationArea' | 'value'>
): boolean {
  const q = normalizeFuzzyText(query);
  if (!q) return true;
  const haystacks = [
    normalizeFuzzyText(item.slotName),
    normalizeFuzzyText(item.locationArea),
    normalizeFuzzyText(String(item.value))
  ];
  const combined = haystacks.join('');
  return haystacks.some(h => h.includes(q)) || combined.includes(q);
}

function cardToOption(dock: Api.Wms.ParkDockBoardCard): ParkDockSuggestOption | null {
  if (dock.placeholder || dock.id == null) return null;
  const slotName = String(dock.slotName ?? '').trim() || String(dock.id);
  const locationArea = String(dock.locationArea ?? '').trim();
  const businessType = (dock.businessType ?? 'devanning') as Api.Wms.ParkTaskType;
  const label = locationArea ? `${slotName} · ${locationArea}` : slotName;
  return {
    value: String(dock.id),
    label,
    dockId: dock.id,
    slotName,
    locationArea,
    businessType
  };
}

function masterToOption(dock: Api.Wms.ParkDock): ParkDockSuggestOption | null {
  if (dock.id == null) return null;
  const slotName = String(dock.slotName ?? '').trim() || String(dock.id);
  const locationArea = String(dock.locationArea ?? '').trim();
  const businessType = (dock.businessType ?? 'devanning') as Api.Wms.ParkTaskType;
  const label = locationArea ? `${slotName} · ${locationArea}` : slotName;
  return {
    value: String(dock.id),
    label,
    dockId: dock.id,
    slotName,
    locationArea,
    businessType
  };
}

export function buildParkDockSuggestOptionsFromBoard(
  board: Api.Wms.ParkSchedulingBoard | null,
  taskType: Api.Wms.ParkTaskType
): ParkDockSuggestOption[] {
  const map = new Map<string, ParkDockSuggestOption>();
  for (const dock of collectParkBoardDocks(board)) {
    const opt = cardToOption(dock);
    if (!opt || opt.businessType !== taskType) continue;
    map.set(opt.value, opt);
  }
  return [...map.values()].sort((a, b) => a.slotName.localeCompare(b.slotName, 'zh-CN'));
}

export async function fetchParkDockSuggestOptions(
  taskType: Api.Wms.ParkTaskType
): Promise<ParkDockSuggestOption[]> {
  const { data, error } = await fetchGetParkDockList({
    slotType: 'dock',
    businessType: taskType,
    status: 'open',
    pageNum: 1,
    pageSize: 500
  });
  if (error || !data) return [];
  const rows = extractPaginatedRows<Api.Wms.ParkDock>(data);
  return rows
    .map(masterToOption)
    .filter((o): o is ParkDockSuggestOption => Boolean(o))
    .sort((a, b) => a.slotName.localeCompare(b.slotName, 'zh-CN'));
}

export function mergeParkDockSuggestOptions(
  boardOptions: ParkDockSuggestOption[],
  masterOptions: ParkDockSuggestOption[]
): ParkDockSuggestOption[] {
  const map = new Map<string, ParkDockSuggestOption>();
  for (const o of masterOptions) map.set(o.value, o);
  for (const o of boardOptions) map.set(o.value, o);
  return [...map.values()].sort((a, b) => a.slotName.localeCompare(b.slotName, 'zh-CN'));
}

export function filterParkDockSuggestOptions(
  options: ParkDockSuggestOption[],
  query: string
): ParkDockSuggestOption[] {
  if (!normalizeFuzzyText(query)) return options.slice(0, 50);
  return options.filter(o => fuzzyMatchParkDockQuery(query, o)).slice(0, 50);
}

export function findParkDockSuggestOption(
  options: ParkDockSuggestOption[],
  dockId: CommonType.IdType | null
): ParkDockSuggestOption | null {
  if (dockId == null) return null;
  return options.find(o => String(o.dockId) === String(dockId)) ?? null;
}

/**
 * 批量粘贴末尾道口识别码（如 `43`）→ 拆柜道口选项；优先 slotName 精确/后缀匹配，再子串模糊。
 */
export function resolveParkDockFromHint(
  hint: string,
  options: ParkDockSuggestOption[]
): ParkDockSuggestOption | null {
  const q = normalizeFuzzyText(hint);
  if (!q || !options.length) return null;

  const matches = options.filter(o => fuzzyMatchParkDockQuery(hint, o));
  if (!matches.length) return null;

  const exact = matches.filter(o => normalizeFuzzyText(o.slotName) === q);
  if (exact.length === 1) return exact[0]!;
  if (exact.length > 1) {
    return exact.sort((a, b) => a.slotName.localeCompare(b.slotName, 'zh-CN'))[0]!;
  }

  const endsWith = matches.filter(o => normalizeFuzzyText(o.slotName).endsWith(q));
  if (endsWith.length === 1) return endsWith[0]!;
  if (endsWith.length > 1) {
    return endsWith.sort(
      (a, b) => normalizeFuzzyText(a.slotName).length - normalizeFuzzyText(b.slotName).length
    )[0]!;
  }

  return matches.sort((a, b) => {
    const la = normalizeFuzzyText(a.slotName).length;
    const lb = normalizeFuzzyText(b.slotName).length;
    const da = Math.abs(la - q.length);
    const db = Math.abs(lb - q.length);
    if (da !== db) return da - db;
    return a.slotName.localeCompare(b.slotName, 'zh-CN');
  })[0]!;
}

/** 看板上该道口未完成海柜数量（用于确认提示） */
export function countActiveCoOnDock(
  board: Api.Wms.ParkSchedulingBoard | null,
  dockId: CommonType.IdType
): number {
  const dock = collectParkBoardDocks(board).find(d => String(d.id) === String(dockId));
  if (!dock) return 0;
  const ids = new Set<string>();
  const push = (t: Api.Wms.ParkSchedulingTask | null | undefined) => {
    if (!t || t.status === 'completed') return;
    const key = String(t.coNo ?? t.id ?? '').trim();
    if (key) ids.add(key);
  };
  push(dock.currentTask);
  for (const t of dock.queuedTasks ?? []) push(t);
  for (const t of dock.notArrivedTasks ?? []) push(t);
  if (!dock.notArrivedTasks?.length) {
    for (const t of dock.queuedTasks ?? []) {
      if (t.status === 'not_arrived') push(t);
    }
  }
  return ids.size;
}
