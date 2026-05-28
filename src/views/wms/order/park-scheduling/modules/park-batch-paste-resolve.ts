import {
  PARK_DEVANNING_BATCH_STATUS,
  resolveBatchAssignModeForDevanningStatus,
  type ParkDevanningBatchPasteItem,
  type ParkDevanningBatchPasteSkipped
} from '@/constants/wms-park';
import {
  resolveParkDockFromHint,
  type ParkDockSuggestOption
} from './park-dock-suggest';

export type ParkBatchPastePresetDock = {
  id: CommonType.IdType;
  slotName: string;
  assignMode: 'current' | 'queued';
};

/**
 * 解析粘贴道口识别码 / 弹窗预设 Dock，并校验「拆柜中」必须能落到道口。
 */
export function enrichDevanningBatchPasteItems(
  items: ParkDevanningBatchPasteItem[],
  dockOptions: ParkDockSuggestOption[],
  presetDock?: ParkBatchPastePresetDock | null
): { items: ParkDevanningBatchPasteItem[]; skipped: ParkDevanningBatchPasteSkipped[] } {
  const skipped: ParkDevanningBatchPasteSkipped[] = [];
  const enriched: ParkDevanningBatchPasteItem[] = [];

  for (const raw of items) {
    let dockId = raw.dockId ?? null;
    let devanningDock = raw.devanningDock ?? null;
    const hint = String(raw.dockHint ?? '').trim();

    if (hint) {
      const opt = resolveParkDockFromHint(hint, dockOptions);
      if (!opt) {
        skipped.push({
          coNo: raw.coNo,
          rawLine: `${raw.coNo} … ${hint}`,
          reason: 'DOCK_NOT_MATCHED'
        });
        continue;
      }
      dockId = opt.dockId;
      devanningDock = opt.slotName;
    } else if (presetDock?.id != null) {
      dockId = presetDock.id;
      devanningDock = presetDock.slotName;
    }

    if (raw.status === PARK_DEVANNING_BATCH_STATUS.IN_PROGRESS && dockId == null) {
      skipped.push({
        coNo: raw.coNo,
        rawLine: raw.coNo,
        reason: 'DOCK_REQUIRED_IN_PROGRESS'
      });
      continue;
    }

    let assignToDockMode = resolveBatchAssignModeForDevanningStatus(raw.status);
    if (dockId != null && assignToDockMode == null && presetDock) {
      if (raw.status === PARK_DEVANNING_BATCH_STATUS.PENDING) {
        assignToDockMode = presetDock.assignMode;
      }
    }
    if (dockId == null) {
      assignToDockMode = null;
    }

    enriched.push({
      ...raw,
      dockId,
      devanningDock,
      assignToDockMode
    });
  }

  return { items: enriched, skipped };
}
