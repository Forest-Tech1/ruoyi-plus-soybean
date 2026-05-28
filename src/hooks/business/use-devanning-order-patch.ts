import { fetchUpdateDevanningOrder } from '@/service/api/wms/devanning-order';
import { useAuth } from '@/hooks/business/auth';
import { $t } from '@/locales';

/** 预计拆柜日期展示/提交：仅 yyyy-MM-dd */
export function formatExpectedDevanningDateOnly(s: string | null | undefined) {
  if (s == null || !String(s).trim()) return null;
  return String(s).slice(0, 10);
}

export function useDevanningOrderEditPermission() {
  const { hasAuth } = useAuth();

  function canEditDevanningRow(row: Api.Wms.DevanningOrder) {
    return (
      (hasAuth('wms:devanningOrder:edit') || hasAuth('wms:devanningOrder:add')) &&
      (row.status === 'pending_schedule' || row.status === 'pending_devanning')
    );
  }

  function canEditDevanningLabelTag() {
    return hasAuth('wms:devanningOrder:edit') || hasAuth('wms:devanningOrder:add');
  }

  function canEditDevanningRemark(row: Api.Wms.DevanningOrder) {
    return hasAuth('wms:devanningOrder:remark') || canEditDevanningRow(row);
  }

  return { canEditDevanningRow, canEditDevanningLabelTag, canEditDevanningRemark };
}

/**
 * 行内/详情 PATCH：必带当前行主数据，避免后端整单 @NotBlank 校验缺字段。
 * 修改预计拆柜日期时会同步调整订单 status（与列表一致）。
 */
export async function patchDevanningOrder(
  row: Api.Wms.DevanningOrder,
  patch: Partial<Api.Wms.DevanningOrderOperateParams>
): Promise<boolean> {
  const body: Api.Wms.DevanningOrderOperateParams = {
    id: row.id,
    coNo: row.coNo ?? '',
    blNo: row.blNo ?? '',
    orderDate: row.orderDate ?? '',
    ...patch
  };
  if (Object.prototype.hasOwnProperty.call(patch, 'expectedDevanningTime')) {
    const d = patch.expectedDevanningTime;
    const has = Boolean(d && String(d).trim());
    body.status = has ? 'pending_schedule' : 'pending_devanning';
  }
  const { error } = await fetchUpdateDevanningOrder(body);
  if (error) return false;
  window.$message?.success($t('common.updateSuccess'));
  return true;
}
