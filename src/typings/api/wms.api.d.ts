/**
 * Namespace Api.Wms
 *
 * WMS 仓库管理 - 拆柜订单
 */
declare namespace Api {
  namespace Wms {
    /** 拆柜订单状态 */
    type DevanningOrderStatus = 'pending_schedule' | 'pending_devanning' | 'completed' | 'abnormal';

    /** 拆柜订单主表 */
    type DevanningOrder = Api.Common.CommonRecord<{
      id: CommonType.IdType;
      /** 柜号 */
      coNo?: string;
      /** 下单日期 yyyy-MM-dd */
      orderDate?: string;
      /** 提单号 */
      blNo?: string;
      /** 状态 */
      status: DevanningOrderStatus;
      /** 拆柜完成时间 */
      devanningCompleteTime?: string | null;
      /** 预计拆柜日期（仅日期 `yyyy-MM-dd`，不传具体时分秒） */
      expectedDevanningTime?: string | null;
      /** 入库仓库 */
      inboundWarehouse?: string;
      /** 订单等级（字典 `wms_order_level` 的 dictValue） */
      orderLevel?: string;
      /** 拆柜口 */
      devanningDock?: string;
      /** 货物数量 */
      cargoQty?: number;
      /** 货物重量（如 kg） */
      cargoWeight?: number;
      /** 拆柜轮次（字典 `wms_devanning_round` 的 dictValue） */
      devanningRound?: string | null;
      /** 备注 */
      remark?: string;
    }>;

    /** 列表查询参数（日期区间请放在 params 中，见对接文档） */
    type DevanningOrderSearchParams = CommonType.RecordNullable<
      {
        coNo?: string | null;
        blNo?: string | null;
        status?: DevanningOrderStatus | null;
        devanningRound?: string | null;
        /** 订单等级（字典 `wms_order_level`） */
        orderLevel?: string | null;
      } & Api.Common.CommonSearchParams
    >;

    /** 新建/编辑参数 */
    type DevanningOrderOperateParams = CommonType.RecordNullable<
      Pick<
        Api.Wms.DevanningOrder,
        | 'id'
        | 'coNo'
        | 'blNo'
        | 'orderDate'
        | 'expectedDevanningTime'
        | 'devanningRound'
        | 'orderLevel'
        | 'inboundWarehouse'
        | 'devanningDock'
        | 'cargoQty'
        | 'cargoWeight'
        | 'remark'
        | 'status'
      >
    >;

    type DevanningOrderList = Api.Common.PaginatingQueryRecord<DevanningOrder>;

    /** 拆柜订单 - 入库计划行（详情 Tab 分页列表） */
    type DevanningInboundPlan = Api.Common.CommonRecord<{
      id: CommonType.IdType;
      orderId?: CommonType.IdType;
      /** 系统预库位 */
      systemPreLocation?: string;
      /** 系统 SO 号 */
      systemSoNo?: string;
      /** 货件编码 */
      shipmentCode?: string;
      /** 平台 */
      platform?: string;
      /** 仓库代码 */
      warehouseCode?: string;
      /** 地址类型 */
      addressType?: string;
      /** 派送方式 */
      deliveryMethod?: string;
      /** 总件数 */
      totalPieces?: number;
      /** 重量 */
      weight?: number;
      /** 体积（CBM） */
      volumeCbm?: number;
      /** 预计打板数 */
      estimatedPalletCount?: number;
      /** 入库计划行备注（如派送文件「备注」列） */
      remark?: string | null;
    }>;

    /** 入库计划分页（可选汇总：柜号维度总件数/总 CBM，由后端在一次列表接口返回以减少请求） */
    type DevanningInboundPlanList = Api.Common.PaginatingQueryRecord<DevanningInboundPlan> & {
      summary?: {
        /** 汇总总件数 */
        totalPieces?: number;
        /** 汇总总体积 CBM */
        totalCbm?: number;
      };
    };

    type DevanningInboundPlanOperateParams = CommonType.RecordNullable<
      Pick<
        Api.Wms.DevanningInboundPlan,
        | 'id'
        | 'orderId'
        | 'systemPreLocation'
        | 'systemSoNo'
        | 'shipmentCode'
        | 'platform'
        | 'warehouseCode'
        | 'addressType'
        | 'deliveryMethod'
        | 'totalPieces'
        | 'weight'
        | 'volumeCbm'
        | 'estimatedPalletCount'
        | 'remark'
      >
    >;

    /**
     * 新建订单时随单提交的入库计划行（无 id、orderId）
     * - 不传 `systemPreLocation`、`estimatedPalletCount`：由后端生成；预计板数按体积 CBM÷2 向上取整
     */
    type DevanningInboundPlanCreateLine = CommonType.RecordNullable<
      Pick<
        Api.Wms.DevanningInboundPlan,
        | 'systemSoNo'
        | 'shipmentCode'
        | 'platform'
        | 'warehouseCode'
        | 'addressType'
        | 'deliveryMethod'
        | 'totalPieces'
        | 'weight'
        | 'volumeCbm'
        | 'remark'
      >
    >;

    /** 新建拆柜订单（主表 + 入库计划明细一次提交） */
    type DevanningOrderCreateParams = Api.Wms.DevanningOrderOperateParams & {
      inboundPlans: Api.Wms.DevanningInboundPlanCreateLine[];
    };

    /**
     * 导入预览：单行入库计划（可在解析结果中带预计打板，仅展示；确认入库以 §5 规则为准）
     */
    type DevanningInboundPlanPreviewLine = Api.Wms.DevanningInboundPlanCreateLine & {
      estimatedPalletCount?: number | null;
    };

    /** 导入预览单条：一个 Excel 文件对应一笔待创建订单 */
    type DevanningOrderImportPreviewItem = {
      /** 预览批次内唯一，确认原样回传；若后端未给则由前端生成 */
      previewId: string;
      /** 来源文件名 */
      sourceFileName: string;
      /** 解析结果，结构与 POST 新建订单 body 一致 */
      order: Omit<Api.Wms.DevanningOrderCreateParams, 'inboundPlans'> & {
        inboundPlans: Api.Wms.DevanningInboundPlanPreviewLine[];
      };
    };

    /** POST /import-preview 响应 data */
    type DevanningOrderImportPreviewResult = {
      items: Api.Wms.DevanningOrderImportPreviewItem[];
    };

    /** POST /import-confirm 请求体 */
    type DevanningOrderImportConfirmParams = {
      updateSupport: boolean;
      items: Api.Wms.DevanningOrderImportPreviewItem[];
    };

    /** —— 库存管理：库区（无逻辑区域相关字段） */

    type WarehouseArea = Api.Common.CommonRecord<{
      id: CommonType.IdType;
      /** 区域名称 */
      areaName: string;
      /** 存放方式（字典 `wms_storage_method`） */
      storageMethod?: string | null;
      /** 库区类型（字典 `wms_warehouse_area_type`） */
      areaType?: string | null;
      /** 库位混合存储 */
      locationMixedStorage?: boolean | null;
      /** 最大混合数量（当启用混合存储时必填） */
      maxMixedQty?: number | null;
      /** 上架条件说明；空表示未设置 */
      putawayCondition?: string | null;
      createTime?: string | null;
    }>;

    type WarehouseAreaSearchParams = CommonType.RecordNullable<
      Pick<Api.Wms.WarehouseArea, 'areaName' | 'storageMethod' | 'areaType'> & Api.Common.CommonSearchParams
    >;

    type WarehouseAreaOperateParams = CommonType.RecordNullable<
      Pick<
        Api.Wms.WarehouseArea,
        'id' | 'areaName' | 'storageMethod' | 'areaType' | 'locationMixedStorage' | 'maxMixedQty'
      >
    >;

    type WarehouseAreaList = Api.Common.PaginatingQueryRecord<WarehouseArea>;

    /** —— 库存管理：库位 */

    type WarehouseLocation = Api.Common.CommonRecord<{
      id: CommonType.IdType;
      /** 区域 */
      zoneCode?: string | null;
      /** 库位编码 */
      locationCode?: string | null;
      rowRank?: number | null;
      columnRank?: number | null;
      /** 库位容量 */
      capacity?: number | null;
      priority?: number | null;
      /** 0 正常/启用 1 停用 */
      status?: Api.Common.EnableStatus | null;
      createTime?: string | null;
    }>;

    type WarehouseLocationSearchParams = CommonType.RecordNullable<
      {
        /** 筛选区域或库位 */
        keyword?: string | null;
        /** 状态：0 正常/启用 1 停用（字典 sys_normal_disable） */
        status?: Api.Common.EnableStatus | null;
      } & Api.Common.CommonSearchParams
    >;

    type WarehouseLocationOperateParams = CommonType.RecordNullable<
      Pick<
        Api.Wms.WarehouseLocation,
        'id' | 'zoneCode' | 'locationCode' | 'rowRank' | 'columnRank' | 'capacity' | 'priority' | 'status'
      >
    >;

    type WarehouseLocationList = Api.Common.PaginatingQueryRecord<WarehouseLocation>;

    type WarehouseLocationBatchStatusBody = {
      ids: CommonType.IdType[];
      status: Api.Common.EnableStatus;
    };
  }
}
