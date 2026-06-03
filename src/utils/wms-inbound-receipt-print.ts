/** 入库单打印行展开与 HTML 生成（规则见 docs/wms-inbound-receipt-print-api.md） */

import { parseSystemPreLocationAllocations } from '@/utils/wms-devanning-pre-location';

export type WmsInboundReceiptPrintRow = {
  inboundPlanId?: CommonType.IdType;
  systemSoNo?: string | null;
  palletSeq: number;
  warehouseCodeLabel: string;
  recommendedLocation: string | null;
  actualLocation: null;
  boxCount: null;
};

export type WmsInboundReceiptPrintModel = {
  orderId: CommonType.IdType;
  coNo: string;
  printDate: string;
  qrContent: string;
  rows: WmsInboundReceiptPrintRow[];
  totalPalletCount: number;
};

export type WmsInboundReceiptTableLabels = {
  warehouseCode: string;
  recommendedLocation: string;
  actualLocation: string;
  boxCount: string;
  title: string;
  emptyRow: string;
};

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 与卡板贴 §13.3 一致：HOLD → `{base}-HOLD-{seq}`，否则 `{base}-{seq}` */
export function buildInboundReceiptWarehouseCodeLabel(
  warehouseCode: string | null | undefined,
  hold: boolean | null | undefined,
  palletSeq: number
): string {
  const base = String(warehouseCode ?? '').trim();
  if (!base) return '';
  const seq = Math.max(1, Math.floor(palletSeq));
  if (hold === true) return `${base}-HOLD-${seq}`;
  return `${base}-${seq}`;
}

/**
 * 将 systemPreLocation 按板序号展开为 N 个推荐库位。
 * 见 docs/wms-inbound-receipt-print-api.md §3.3
 */
export function expandRecommendedLocationsForPallets(
  rawSystemPreLocation: string | null | undefined,
  palletCount: number
): string[] {
  const n = Math.max(0, Math.floor(palletCount));
  if (n === 0) return [];

  const allocs = parseSystemPreLocationAllocations(rawSystemPreLocation);
  if (!allocs.length) {
    return Array.from({ length: n }, () => '');
  }

  const isLegacySingle =
    allocs.length === 1 && (allocs[0]?.palletCount ?? 0) <= 0;
  if (isLegacySingle) {
    const code = allocs[0]!.locationCode;
    return Array.from({ length: n }, () => code);
  }

  const result: string[] = [];
  for (const a of allocs) {
    const pc = Math.max(0, Math.floor(Number(a.palletCount) || 0));
    for (let i = 0; i < pc && result.length < n; i++) {
      result.push(a.locationCode);
    }
  }
  while (result.length < n) {
    result.push('');
  }
  return result;
}

/** 从入库计划列表展开打印行（与后端 print-data 规则一致） */
export function buildInboundReceiptPrintModelFromPlans(
  orderId: CommonType.IdType,
  coNo: string,
  printDate: string,
  plans: Api.Wms.DevanningInboundPlan[]
): WmsInboundReceiptPrintModel {
  const sorted = [...plans].sort((a, b) => {
    const ia = Number(a.id);
    const ib = Number(b.id);
    if (Number.isFinite(ia) && Number.isFinite(ib) && ia !== ib) return ia - ib;
    return String(a.id ?? '').localeCompare(String(b.id ?? ''), 'zh-CN');
  });

  const rows: WmsInboundReceiptPrintRow[] = [];

  for (const plan of sorted) {
    const n = Math.max(0, Math.floor(Number(plan.estimatedPalletCount) || 0));
    if (n === 0) continue;

    const locations = expandRecommendedLocationsForPallets(plan.systemPreLocation, n);

    for (let seq = 1; seq <= n; seq++) {
      const loc = locations[seq - 1]?.trim() ?? '';
      rows.push({
        inboundPlanId: plan.id,
        systemSoNo: plan.systemSoNo ?? null,
        palletSeq: seq,
        warehouseCodeLabel: buildInboundReceiptWarehouseCodeLabel(plan.warehouseCode, plan.hold, seq),
        recommendedLocation: loc || null,
        actualLocation: null,
        boxCount: null
      });
    }
  }

  const co = String(coNo ?? '').trim();

  return {
    orderId,
    coNo: co,
    printDate,
    qrContent: co,
    rows,
    totalPalletCount: rows.length
  };
}

/** 生成供 iframe `srcdoc` 使用的完整 HTML（含打印样式） */
export function buildInboundReceiptPrintSrcdoc(options: {
  model: WmsInboundReceiptPrintModel;
  qrDataUrl: string;
  tableLabels: WmsInboundReceiptTableLabels;
}): string {
  const { model, qrDataUrl, tableLabels } = options;

  const rowsHtml =
    model.rows.length === 0
      ? `<tr><td colspan="4">${esc(tableLabels.emptyRow)}</td></tr>`
      : model.rows
          .map(
            r =>
              `<tr><td>${esc(r.warehouseCodeLabel || '—')}</td><td>${esc(r.recommendedLocation ?? '')}</td><td></td><td></td></tr>`
          )
          .join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(tableLabels.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px 20px 24px; font-family: "Microsoft YaHei", "PingFang SC", sans-serif; font-size: 13px; color: #1a1a1a; }
    .head {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #1a1a1a;
    }
    .head-left { justify-self: start; }
    .head-qr { width: 96px; height: 96px; }
    .head-qr img { display: block; width: 96px; height: 96px; }
    .head-main { justify-self: center; text-align: center; min-width: 0; max-width: 100%; }
    .head-title { font-size: 22px; font-weight: 700; letter-spacing: 2px; line-height: 1.2; margin-bottom: 6px; }
    .head-co { font-size: 18px; font-weight: 600; line-height: 1.3; word-break: break-all; }
    .head-date { justify-self: end; font-size: 15px; font-weight: 600; text-align: right; white-space: nowrap; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #333; padding: 8px 10px; text-align: left; word-break: break-all; vertical-align: middle; }
    th { background: #f0f0f0; font-weight: 600; font-size: 13px; }
    td { min-height: 32px; }
    @media print {
      body { padding: 12px 16px; }
      .head { page-break-inside: avoid; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header class="head">
    <div class="head-left">
      <div class="head-qr"><img src="${esc(qrDataUrl)}" alt="QR" /></div>
    </div>
    <div class="head-main">
      <div class="head-title">${esc(tableLabels.title)}</div>
      <div class="head-co">${esc(model.coNo || '—')}</div>
    </div>
    <div class="head-date">${esc(model.printDate)}</div>
  </header>
  <table>
    <thead>
      <tr>
        <th>${esc(tableLabels.warehouseCode)}</th>
        <th>${esc(tableLabels.recommendedLocation)}</th>
        <th>${esc(tableLabels.actualLocation)}</th>
        <th>${esc(tableLabels.boxCount)}</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`;
}
