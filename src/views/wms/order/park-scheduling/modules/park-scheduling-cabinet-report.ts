import { collectParkBoardDocks, sortParkDockBoardCardsByLayout } from '@/constants/wms-park';
import { sortParkDockQueuedTasks } from './park-dock-queue-reorder';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 看板打印：Dock 顺序（与网格一致，见 `sortParkDockBoardCardsByLayout`） */
export function sortParkDocksForReport(docks: Api.Wms.ParkDockBoardCard[]): Api.Wms.ParkDockBoardCard[] {
  return sortParkDockBoardCardsByLayout([...docks]);
}

function notArrivedListForDock(dock: Api.Wms.ParkDockBoardCard): Api.Wms.ParkSchedulingTask[] {
  const curId = dock.currentTask?.id;
  const raw =
    dock.notArrivedTasks && dock.notArrivedTasks.length > 0
      ? dock.notArrivedTasks
      : (dock.queuedTasks ?? []).filter(t => t.status === 'not_arrived');
  return raw.filter(t => curId == null || t.id !== curId);
}

/** 单 Dock：当前 → 排队 → 未到仓（与看板纵向顺序一致） */
export function collectDockTasksForCabinetReport(dock: Api.Wms.ParkDockBoardCard): Api.Wms.ParkSchedulingTask[] {
  const out: Api.Wms.ParkSchedulingTask[] = [];
  if (dock.currentTask) out.push(dock.currentTask);
  out.push(...sortParkDockQueuedTasks(dock.queuedTasks));
  out.push(...notArrivedListForDock(dock));
  return out;
}

function roundCell(
  task: Api.Wms.ParkSchedulingTask,
  taskType: Api.Wms.ParkTaskType,
  devanningRoundLabels: Record<string, string>
): string {
  if (taskType !== 'devanning') return '—';
  const v = task.devanningRound;
  if (v == null || String(v).trim() === '') return '—';
  const key = String(v).trim();
  return devanningRoundLabels[key] ?? key;
}

/** 报表第三列：仅 `not_arrived` 为「未到仓」，其余一律「在仓」 */
function reportWarehousePresenceLabel(
  status: Api.Wms.ParkTaskStatus | null | undefined,
  labels: CabinetReportTableLabels
): string {
  if (status === 'not_arrived') return labels.warehouseNotArrived;
  return labels.warehouseInWarehouse;
}

export type CabinetReportTableLabels = {
  coNo: string;
  devanningRound: string;
  /** 第三列：状态 */
  status: string;
  /** 在仓（非未到仓） */
  warehouseInWarehouse: string;
  /** 未到仓（与任务 `status=not_arrived` 对应） */
  warehouseNotArrived: string;
  dock: string;
  emptyRow: string;
};

/**
 * 生成供 iframe `srcdoc` 使用的完整 HTML（含打印样式）。
 * 按 Dock 分块：柜号、作业轮次、**状态（在仓 / 未到仓）**；**两列并排**（每行两个 Dock）。
 */
export function buildParkCabinetReportSrcdoc(options: {
  board: Api.Wms.ParkSchedulingBoard | null;
  taskType: Api.Wms.ParkTaskType;
  /** 表头展示用日期，如 2026-05-15 */
  reportDateText: string;
  /** 报表名称，如「排柜表」 */
  reportTitle: string;
  /** 左上角仓库等副标题，可空 */
  warehouseLine?: string | null;
  /** 任务类型展示，如「拆柜」 */
  taskTypeLine: string;
  tableLabels: CabinetReportTableLabels;
  devanningRoundLabels: Record<string, string>;
}): string {
  const {
    board,
    taskType,
    reportDateText,
    reportTitle,
    warehouseLine,
    taskTypeLine,
    tableLabels,
    devanningRoundLabels
  } = options;

  const docks = sortParkDocksForReport(collectParkBoardDocks(board)).filter(d => !d.placeholder);

  function renderDockBlock(dock: Api.Wms.ParkDockBoardCard): string {
    const tasks = collectDockTasksForCabinetReport(dock);
    const rowsHtml =
      tasks.length === 0
        ? `<tr><td colspan="3">${esc(tableLabels.emptyRow)}</td></tr>`
        : tasks
            .map(
              t =>
                `<tr><td>${esc(t.coNo ?? '—')}</td><td>${esc(roundCell(t, taskType, devanningRoundLabels))}</td><td>${esc(reportWarehousePresenceLabel(t.status, tableLabels))}</td></tr>`
            )
            .join('');

    return `
      <section class="dock-block">
        <h2 class="dock-title">${esc(tableLabels.dock)}：${esc(String(dock.slotName ?? '—'))}</h2>
        <table>
          <thead>
            <tr><th>${esc(tableLabels.coNo)}</th><th>${esc(tableLabels.devanningRound)}</th><th>${esc(tableLabels.status)}</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </section>
    `;
  }

  const dockBlocksHtml = docks.map(d => renderDockBlock(d)).join('');

  const sub = [warehouseLine?.trim(), taskTypeLine].filter(Boolean).join('　');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(reportTitle)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px 20px 24px; font-family: "Microsoft YaHei", "PingFang SC", sans-serif; font-size: 13px; color: #1a1a1a; }
    .head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #1a1a1a; }
    .head-date { font-size: 15px; font-weight: 600; }
    .head-title { font-size: 20px; font-weight: 700; letter-spacing: 2px; }
    .head-sub { width: 100%; font-size: 12px; color: #555; margin-top: 4px; }
    .dock-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 18px;
      align-items: start;
    }
    .dock-block { margin: 0; min-width: 0; page-break-inside: avoid; }
    .dock-title { font-size: 14px; font-weight: 700; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; word-break: break-all; }
    th { background: #f0f0f0; font-weight: 600; }
    @media print {
      body { padding: 12px 16px; }
      .dock-grid { gap: 12px 14px; }
      .dock-block { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header class="head">
    <div class="head-date">${esc(reportDateText)}</div>
    <div class="head-title">${esc(reportTitle)}</div>
    ${sub ? `<div class="head-sub">${esc(sub)}</div>` : ''}
  </header>
  ${dockBlocksHtml ? `<div class="dock-grid">${dockBlocksHtml}</div>` : `<p>${esc(tableLabels.emptyRow)}</p>`}
</body>
</html>`;
}
