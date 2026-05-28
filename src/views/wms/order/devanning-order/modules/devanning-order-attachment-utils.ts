/** 拆柜订单附件数量（与列表「附件」列一致） */
export function getDevanningOrderAttachmentCount(
  order: Pick<Api.Wms.DevanningOrder, 'attachmentCount' | 'attachmentOssIds'>
): number {
  const n = Number(order.attachmentCount);
  if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  const s = String(order.attachmentOssIds ?? '').trim();
  if (!s) return 0;
  return s.split(',').map(v => v.trim()).filter(Boolean).length;
}
