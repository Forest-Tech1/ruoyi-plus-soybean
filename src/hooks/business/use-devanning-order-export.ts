import { computed } from 'vue';
import { withDevanningSheetExportTemplate } from '@/constants/wms-devanning';
import { useAuthStore } from '@/store/modules/auth';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { $t } from '@/locales';

/** 拆柜单 Excel、卡板贴 Word 导出所需字段 */
export type DevanningOrderExportTarget = Pick<Api.Wms.DevanningOrder, 'id' | 'coNo'>;

/** 列表「更多」与详情抽屉共用的导出能力 */
export function useDevanningOrderExport() {
  const authStore = useAuthStore();
  const { zip } = useDownload();
  const { hasAuth } = useAuth();

  const canExportSheet = computed(() => hasAuth('wms:devanningOrder:export'));
  const canExportPalletLabelWord = computed(
    () => hasAuth('wms:devanningOrder:palletLabel') || hasAuth('wms:devanningOrder:export')
  );

  async function exportDevanningSheet(row: DevanningOrderExportTarget): Promise<boolean> {
    const name = `${$t('page.wms.devanningOrder.exportFileNamePrefix')}_${row.coNo || row.id}_${Date.now()}.xlsx`;
    const url = withDevanningSheetExportTemplate(
      `/wms/devanning-order/export/${row.id}`,
      authStore.userInfo.user?.tenantId
    );
    return zip(url, name);
  }

  async function exportPalletLabelWord(row: DevanningOrderExportTarget): Promise<boolean> {
    const name = `${$t('page.wms.devanningOrder.palletLabelFilePrefix')}_${row.coNo || row.id}_${Date.now()}.docx`;
    return zip(`/wms/devanning-order/${row.id}/pallet-labels/export?format=docx`, name);
  }

  return {
    canExportSheet,
    canExportPalletLabelWord,
    exportDevanningSheet,
    exportPalletLabelWord
  };
}
