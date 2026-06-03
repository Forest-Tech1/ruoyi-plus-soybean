/**
 * Namespace Api.Wms
 *
 * WMS 仓库管理 - 拆柜订单
 */
declare namespace Api {
  namespace Wms {
    /** 拆柜订单状态（业务：待安排/待拆柜/完成/异常） */
    type DevanningOrderStatus = 'pending_schedule' | 'pending_devanning' | 'completed' | 'abnormal';

    /**
     * 拆柜状态（到仓/排队/作业等，与园区看板 `ParkTaskStatus` 一致；主数据在拆柜订单）
     * 接口 JSON 推荐 `devanningStatus`；过渡期可读 `schedulingStatus`
     */
    type DevanningStatus = 'pending' | 'not_arrived' | 'queued' | 'in_progress' | 'completed';

    /** @deprecated 请用 `DevanningStatus` */
    type DevanningSchedulingStatus = DevanningStatus;

    /** 拆柜订单主表 */
    type DevanningOrder = Api.Common.CommonRecord<{
      id: CommonType.IdType;
      /** 柜号 */
      coNo?: string;
      /**
       * 附件（OSS 对象 id 列表，逗号分隔）。用于列表「附件」列展示与上传/预览。
       * 由后端落库（建议独立字段，如 devanning_order.attachment_oss_ids）。
       */
      attachmentOssIds?: string | null;
      /** 附件数量（可选冗余字段；若不返，前端会由 attachmentOssIds 计算） */
      attachmentCount?: number | null;
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
      /** 订单等级（用户输入数字，可空） */
      orderLevel?: number | null;
      /** 拆柜状态（到仓状态，与园区调度任务 status 同源） */
      devanningStatus?: DevanningStatus | null;
      /** @deprecated 与 `devanningStatus` 同义，后端过渡字段 */
      schedulingStatus?: DevanningStatus | null;
      /**
       * 园区 Dock 主键（`wms_park_dock.id`）；指派/排队用。
       * 展示「拆柜口」请用 {@link devanningDock}（与 Dock 槽位名同步，不单独维护 dockName）。
       */
      dockId?: CommonType.IdType | null;
      /** 排队序号（Dock 排队，从 1 起） */
      queuePosition?: number | null;
      /** 拆柜口（文本；与园区 Dock 槽位名 `slot_name` 一致） */
      devanningDock?: string;
      /** 司机电话（司机 Check-in 时写入或后台维护） */
      driverPhone?: string | null;
      /** 货物数量 */
      cargoQty?: number;
      /** 货物重量（如 kg） */
      cargoWeight?: number;
      /** 拆柜轮次（字典 `wms_devanning_round` 的 dictValue） */
      devanningRound?: string | null;
      /** 标签（可选，用于业务标记/展示） */
      labelTag?: string | null;
      /** 是否存在 HOLD（由入库计划明细汇总；用于列表快速展示） */
      hasHold?: boolean;
      /** 拆柜单（Excel）是否已导出/打印过（由后端在导出成功后置位，供列表「操作状态」首行） */
      devanningSheetPrinted?: boolean | null;
      /** 卡板贴是否已导出/打印过（Word/ZIP 任一成功导出后置位，供列表「操作状态」次行） */
      palletLabelPrinted?: boolean | null;
      /** 入库单是否已打印（供列表「操作状态」第三行） */
      inboundReceiptPrinted?: boolean | null;
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
        orderLevel?: number | null;
        devanningStatus?: DevanningStatus | null;
        dockId?: CommonType.IdType | null;
        driverPhone?: string | null;
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
        | 'driverPhone'
        | 'cargoQty'
        | 'cargoWeight'
        | 'labelTag'
        | 'remark'
        | 'status'
        | 'devanningStatus'
        | 'schedulingStatus'
        | 'dockId'
      >
    >;

    type DevanningOrderList = Api.Common.PaginatingQueryRecord<DevanningOrder>;

    /** 司机 Check-in 业务错误码（公开接口 `data.errorCode`） */
    type DriverCheckInErrorCode =
      | 'ORDER_NOT_FOUND'
      | 'ORDER_OUT_OF_DATE_RANGE'
      | 'STATUS_NOT_NOT_ARRIVED'
      | 'MULTIPLE_ORDERS'
      | 'CO_NO_REQUIRED'
      | 'CO_NOS_REQUIRED'
      | 'DRIVER_PHONE_REQUIRED'
      | 'BATCH_TOO_LARGE';

    /** GET `/wms/public/driver-check-in/co-suggest` */
    type DriverCheckInCoSuggestParams = {
      /** 柜号关键字（模糊），建议 ≥1 字符再请求 */
      keyword: string;
    };

    type DriverCheckInCoSuggestItem = {
      /** 拆柜订单主键 */
      id: CommonType.IdType;
      coNo: string;
      devanningStatus?: DevanningStatus | null;
    };

    /** POST `/wms/public/driver-check-in` */
    type DriverCheckInParams = {
      coNo: string;
      /** 司机电话（必填） */
      driverPhone: string;
    };

    /** POST `/wms/public/driver-check-in/batch` */
    type DriverCheckInBatchParams = {
      /** 本批次共用司机电话（必填） */
      driverPhone: string;
      /** 柜号列表（去重后 1～50 条，与单条接口校验规则一致） */
      coNos: string[];
    };

    type DriverCheckInResult = {
      orderId: CommonType.IdType;
      coNo: string;
      /** 登记时提交的司机电话（回显） */
      driverPhone?: string | null;
      /**
       * 登记成功后拆柜状态：已绑 Dock → `queued`；未绑 Dock → `pending`（待作业）
       */
      devanningStatus: DevanningStatus;
      /** 已指派 Dock 时回传，供前端展示 */
      dockId?: CommonType.IdType | null;
      devanningDock?: string | null;
      checkedInAt: string;
    };

    type DriverCheckInFailData = {
      errorCode?: DriverCheckInErrorCode | null;
      coNo?: string | null;
      devanningStatus?: DevanningStatus | null;
      matchedCount?: number | null;
    };

    type DriverCheckInBatchFailure = {
      coNo: string;
      errorCode: DriverCheckInErrorCode;
      devanningStatus?: DevanningStatus | null;
      matchedCount?: number | null;
      message?: string | null;
    };

    type DriverCheckInBatchResult = {
      driverPhone: string;
      total: number;
      successCount: number;
      failCount: number;
      successes: DriverCheckInResult[];
      failures: DriverCheckInBatchFailure[];
    };

    /** 司机 Check-in 登记记录（落库，供列表与顶部通知） */
    type DriverCheckInRecord = Api.Common.CommonRecord<{
      id: CommonType.IdType;
      /** 拆柜订单 id（可选） */
      orderId?: CommonType.IdType | null;
      coNo: string;
      driverPhone: string;
      /** 登记时间 yyyy-MM-dd HH:mm:ss */
      checkedInAt: string;
      /** 登记后拆柜状态（可选回显） */
      devanningStatus?: DevanningStatus | null;
    }>;

    type DriverCheckInRecordSearchParams = CommonType.RecordNullable<
      {
        coNo?: string | null;
        driverPhone?: string | null;
        /** Check-in 时间起止（`params.checkedInBegin` / `params.checkedInEnd`） */
        params?: {
          checkedInBegin?: string | null;
          checkedInEnd?: string | null;
        };
      } & Api.Common.CommonSearchParams
    >;

    type DriverCheckInRecordList = Api.Common.PaginatingQueryRecord<DriverCheckInRecord>;

    /** GET `/wms/driver-check-in/record/recent` — 顶部通知轮询 */
    type DriverCheckInRecordRecentParams = {
      /** 仅当天，默认 true */
      todayOnly?: boolean;
      /** 条数上限，默认 20 */
      limit?: number;
      /** 大于该 id 的新增记录（增量拉取，可选） */
      afterId?: CommonType.IdType | null;
    };

    /** WebSocket / SSE 推送体（与轮询记录字段对齐） */
    type DriverCheckInRecordPushPayload = {
      type: 'driver_check_in';
      record: DriverCheckInRecord;
    };

    /** 入库计划行出库状态（与后端字典或枚举对齐；缺省按未出库展示） */
    type DevanningInboundPlanOutboundStatus = 'pending_outbound' | 'outbound_done';

    /**
     * 货物订单列表「状态」Tab 筛选（库存/出库阶段）
     * - `not_in_stock`：未入库（未分配系统预库位 / 尚未进入库存数据口径，由后端定义）
     * - `in_stock`：已入库（已有库存数据）
     * - `out_stock`：已出库（可与 `outboundStatus=outbound_done` 对齐）
     */
    type CargoInboundInventoryPhase = 'not_in_stock' | 'in_stock' | 'out_stock';

    /**
     * 入库计划跨单分页查询（货物订单页）
     * - 与 `GET /wms/devanning-order/{orderId}/inbound-plan/list` 行结构一致，并补充 `coNo`
     */
    type DevanningInboundPlanGlobalSearchParams = CommonType.RecordNullable<
      {
        /** 拆柜订单柜号 */
        coNo?: string | null;
        /** 入库计划订单号 systemSoNo */
        systemSoNo?: string | null;
        shipmentCode?: string | null;
        /** 系统预库位 JSON 内 locationCode 命中筛选（后端解析 allocations） */
        locationCode?: string | null;
        /** 库区（与库位 zoneCode / 库区名称口径一致） */
        zoneCode?: string | null;
        /** 货物订单页 Tag 状态；不传或 null 表示全部 */
        cargoPhase?: CargoInboundInventoryPhase | null;
      } & Api.Common.CommonSearchParams
    >;

    /** 入库单打印 · 卡板行（GET print-data 响应） */
    type DevanningInboundReceiptPrintRow = {
      inboundPlanId?: CommonType.IdType;
      systemSoNo?: string | null;
      palletSeq: number;
      warehouseCodeLabel: string;
      recommendedLocation?: string | null;
      actualLocation?: null;
      boxCount?: null;
    };

    /** 入库单打印数据 @see docs/wms-inbound-receipt-print-api.md */
    type DevanningInboundReceiptPrintData = {
      orderId: CommonType.IdType;
      coNo: string;
      printDate: string;
      qrContent: string;
      rows: DevanningInboundReceiptPrintRow[];
      totalPalletCount?: number;
    };

    /** 拆柜订单 - 入库计划行（详情 Tab 分页列表） */
    type DevanningInboundPlan = Api.Common.CommonRecord<{
      id: CommonType.IdType;
      orderId?: CommonType.IdType;
      /** 全局列表接口可冗余返回柜号，便于列表首列展示 */
      coNo?: string | null;
      /**
       * 系统预库位（多库位 JSON，见 `docs/wms-devanning-order-prelocation-api.md`）
       * 示例：`{"version":1,"allocations":[{"locationCode":"A-01","palletCount":3}]}`
       */
      systemPreLocation?: string;
      /** 出库状态：未出库 / 已出库 */
      outboundStatus?: DevanningInboundPlanOutboundStatus | null;
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
      /** 派送方式（字典 `delivery_type` / `WMS_DICT_DELIVERY_TYPE`；列表、导入预览 DictTag、提交均仅此字段） */
      deliveryMethod?: string;
      /** 可读文案（导入预览或列表接口可选返回）；字典无对应 `dictValue` 时前端用作回显，有字典时仍以 `dictLabel` 为准 */
      deliveryMethodLabel?: string | null;
      /** 是否 HOLD（单独字段，导入/导出与卡板贴等逻辑使用） */
      hold?: boolean | null;
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
        | 'hold'
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
        | 'hold'
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
    /** 导入预览行：在新建行字段基础上可带预计板数、可选 `deliveryMethodLabel`（展示仍只认 `deliveryMethod` + DictTag） */
    type DevanningInboundPlanPreviewLine = Api.Wms.DevanningInboundPlanCreateLine &
      Partial<Pick<Api.Wms.DevanningInboundPlan, 'deliveryMethodLabel'>> & {
        estimatedPalletCount?: number | null;
      };

    /** 导入预览单条：一个 Excel 文件对应一笔待创建订单 */
    type DevanningOrderImportPreviewItem = {
      /** 预览批次内唯一，确认原样回传；若后端未给则由前端生成 */
      previewId: string;
      /** 来源文件名 */
      sourceFileName: string;
      /** 解析结果，结构与 POST 新建订单 body 一致；可选带回 createTime 便于与列表展示对齐 */
      order: Omit<Api.Wms.DevanningOrderCreateParams, 'inboundPlans'> & {
        inboundPlans: Api.Wms.DevanningInboundPlanPreviewLine[];
      } & {
        createTime?: string | null;
      };
    };

    /** POST /import-preview（及 raw-order）响应 data */
    type DevanningOrderImportPreviewResult = {
      /** 后端回显，可与确认请求体对齐 */
      updateSupport?: boolean;
      items: Api.Wms.DevanningOrderImportPreviewItem[];
    };

    /** POST /import-confirm 请求体 */
    type DevanningOrderImportConfirmParams = {
      updateSupport: boolean;
      items: Api.Wms.DevanningOrderImportPreviewItem[];
    };

    /** GET /import-inventory/list 行模型（导入落库快照；字段以后端为准） */
    type DevanningImportInventory = Api.Common.CommonRecord<{
      id: CommonType.IdType;
      devanningOrderId?: CommonType.IdType | null;
      coNo?: string | null;
      blNo?: string | null;
      warehouseCode?: string | null;
      systemSoNo?: string | null;
      shipmentCode?: string | null;
      systemPreLocation?: string | null;
      sourceFileName?: string | null;
      createTime?: string | null;
    }>;

    type DevanningImportInventorySearchParams = CommonType.RecordNullable<
      Pick<Api.Wms.DevanningImportInventory, 'coNo' | 'blNo' | 'warehouseCode'> & Api.Common.CommonSearchParams
    >;

    type DevanningImportInventoryList = Api.Common.PaginatingQueryRecord<DevanningImportInventory>;

    /** —— 库存管理：库区（无逻辑区域相关字段） */

    /** 库区/全库库存汇总（板数口径与 currentStock 一致） */
    type WarehouseAreaStockSummary = {
      /** 库区名称（与 areaName/zoneCode 一致；全库汇总时可为空） */
      areaName?: string | null;
      /** 总容量（板数） */
      totalCapacity?: number | null;
      /** 现有库存（板数） */
      totalCurrentStock?: number | null;
      /** 占用率（0-100），可由后端直接给出；前端也会按库存/容量计算 */
      utilizationPercent?: number | null;
    };

    /** 平面图侧栏汇总：全库 + 各库区 */
    type WarehouseAreaStockStatistics = {
      all: WarehouseAreaStockSummary;
      areas: WarehouseAreaStockSummary[];
    };

    type WarehouseArea = Api.Common.CommonRecord<{
      id: CommonType.IdType;
      /** 区域名称 */
      areaName: string;
      /** 存放方式（字典 `wms_storage_method`） */
      storageMethod?: string | null;
      /** 库区类型（字典 `wms_warehouse_area_type`） */
      areaType?: string | null;
      /** 排（库区布局） */
      rowRank?: number | null;
      /** 列（库区布局） */
      columnRank?: number | null;
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
        | 'id'
        | 'areaName'
        | 'storageMethod'
        | 'areaType'
        | 'rowRank'
        | 'columnRank'
        | 'locationMixedStorage'
        | 'maxMixedQty'
      >
    >;

    type WarehouseAreaList = Api.Common.PaginatingQueryRecord<WarehouseArea>;

    /** —— 库存管理：库位 */

    /** 库位在某一仓库代码维度下的占用（平面图等列表可选汇总字段） */
    type WarehouseCodeOccupancyItem = {
      /** 仓库代码 */
      warehouseCode?: string | null;
      /** 该仓库代码在本库位占用的板数 */
      palletCount?: number | null;
    };

    type WarehouseLocation = Api.Common.CommonRecord<{
      id: CommonType.IdType;
      /** 区域 */
      zoneCode?: string | null;
      /** 库位编码 */
      locationCode?: string | null;
      /**
       * 排位（库位本身行序号，见 docs/wms-inventory-api.md）
       * 库存平面图页按 rowRank × columnRank 落格；缺省则该库位不参与网格
       */
      rowRank?: number | null;
      /**
       * 列位（库位本身列序号）
       */
      columnRank?: number | null;
      /** 库位容量 */
      capacity?: number | null;
      /** 现有库存（板数/占用数，以后端口径为准） */
      currentStock?: number | null;
      /** 剩余容量（capacity - currentStock，以后端口径为准） */
      remainingCapacity?: number | null;
      /**
       * 平面图列表可选：按仓库代码的占用明细（仓库代码 + 该代码在本库位的板数）
       * 后端可在 GET /wms/inventory/location/list 聚合返回；旧字段名 `destinationOccupancies` 仍可兼容映射
       */
      warehouseCodeOccupancies?: Api.Wms.WarehouseCodeOccupancyItem[] | null;
      priority?: number | null;
      /** 0 正常/启用 1 停用 */
      status?: Api.Common.EnableStatus | null;
      createTime?: string | null;
    }>;

    type WarehouseLocationSearchParams = CommonType.RecordNullable<
      {
        /** 库区筛选（与库位 `zoneCode` 存值一致，一般为库区名称；与 `locationKeyword` 独立） */
        zoneCode?: string | null;
        /** 仅库位编码等模糊筛选（与库区独立） */
        locationKeyword?: string | null;
        /**
         * 兼容旧版：同时匹配区域与库位。新前端拆分为 `zoneCode` + `locationKeyword`；
         * 后端可忽略或映射，见 docs/wms-inventory-api.md。
         */
        keyword?: string | null;
        /** 状态：0 正常/启用 1 停用（字典 sys_normal_disable） */
        status?: Api.Common.EnableStatus | null;
        /**
         * 库存平面图：按**平台仓库代码**筛选（如 ONT8）。
         * 后端应返回：**占有该代码库存的库位** ∪ **空库位**（见 docs/wms-warehouse-inventory-visual-map-api.md）。
         */
        inventoryWarehouseCode?: string | null;
        /**
         * 库存平面图·上架维度：**派送方式**（字典 `delivery_type`）。
         * 仅当本参数非空时启用上架规则筛选；与 `putawayPlatformId`、`putawayPlatformWarehouseCode` 组合，详见可视化文档。
         */
        putawayDispatchMethod?: string | null;
        /** 库存平面图·上架维度：平台主数据 id；可选，不传表示不按平台限定（与上架配置列表筛选语义对齐）。 */
        putawayPlatformId?: CommonType.IdType | null;
        /** 库存平面图·上架维度：平台仓库代码（可与上架规则条件 `platformCodes` 匹配；可选）。 */
        putawayPlatformWarehouseCode?: string | null;
      } & Api.Common.CommonSearchParams
    >;

    type WarehouseLocationOperateParams = CommonType.RecordNullable<
      Pick<
        Api.Wms.WarehouseLocation,
        | 'id'
        | 'zoneCode'
        | 'locationCode'
        | 'rowRank'
        | 'columnRank'
        | 'capacity'
        | 'priority'
        | 'status'
      >
    >;

    type WarehouseLocationList = Api.Common.PaginatingQueryRecord<WarehouseLocation>;

    /** 库位详情抽屉 - 明细行（当前库位下的入库计划占用/预分配） */
    type WarehouseLocationInventoryDetailLine = Api.Common.CommonRecord<{
      /** 入库计划行 id（拆柜入库计划） */
      inboundPlanId: CommonType.IdType;
      /** 拆柜订单 id */
      orderId: CommonType.IdType;
      /** 柜号 */
      coNo?: string | null;
      /** 系统预库位 JSON（整条入库计划行的原始字段） */
      systemPreLocation?: string | null;
      /** 当前库位对应板数 */
      palletCount?: number | null;
      /** 该订单（入库计划行）系统预库位合计板数 */
      totalPalletCount?: number | null;
      /** 系统 SO 号 */
      systemSoNo?: string | null;
      /** 货件编码 */
      shipmentCode?: string | null;
      /** 平台 */
      platform?: string | null;
      /** 仓库代码 */
      warehouseCode?: string | null;
      /** 地址类型 */
      addressType?: string | null;
      /** 派送方式 */
      deliveryMethod?: string | null;
      /** 派送方式回显文案（可选） */
      deliveryMethodLabel?: string | null;
      /** HOLD */
      hold?: boolean | null;
      /** 总件数 */
      totalPieces?: number | null;
      /** 重量 */
      weight?: number | null;
      /** 体积（CBM） */
      volumeCbm?: number | null;
      /** 备注 */
      remark?: string | null;
      /** 该订单记录创建时间（后端口径：入库计划行创建时间或占用记录创建时间，需在接口说明里固定） */
      createTime?: string | null;
    }>;

    /** 库存数据（全库维度）- 明细行：复用库位详情抽屉字段，并补充库区/库位/Delivery Address */
    type WarehouseInventoryDataLine = WarehouseLocationInventoryDetailLine & {
      /** 明细记录 id（用于编辑更新） */
      inventoryDetailId?: CommonType.IdType | null;
      /** 下单日期（与拆柜订单口径一致） */
      orderTime?: string | null;
      /** 拆柜完成日期（与拆柜订单口径一致） */
      devanningCompleteTime?: string | null;
      /** 库区（与库位 `zoneCode` 一致，一般为库区名称） */
      zoneCode?: string | null;
      /** 库位编码 */
      locationCode?: string | null;
      /** Delivery Address（展示用完整地址字符串） */
      deliveryAddress?: string | null;
    };

    type WarehouseInventoryDataUpdateBody = {
      inventoryDetailId: CommonType.IdType;
      /** 库区（与库位主数据一致；迁库时由平面图带出，可选） */
      zoneCode?: string | null;
      /** 库位编码（迁库；需后端 PUT 支持，见 `docs/wms-inventory-data-api.md`） */
      locationCode?: string | null;
      /** 打板数 */
      palletCount?: number | null;
      /** Delivery Address */
      deliveryAddress?: string | null;
      /** 平台 */
      platform?: string | null;
      /** 派送方式 */
      deliveryMethod?: string | null;
    };

    type WarehouseInventoryDataSearchParams = CommonType.RecordNullable<
      {
        /** 下单日期开始（与拆柜订单口径一致，建议 yyyy-MM-dd HH:mm:ss） */
        orderTimeBegin?: string | null;
        /** 下单日期结束 */
        orderTimeEnd?: string | null;
        /** 拆柜完成日期开始（yyyy-MM-dd HH:mm:ss） */
        devanningCompleteBegin?: string | null;
        /** 拆柜完成日期结束 */
        devanningCompleteEnd?: string | null;
        /** 订单号（systemSoNo） */
        systemSoNo?: string | null;
        /** 柜号 */
        coNo?: string | null;
        /** 货件编码 */
        shipmentCode?: string | null;
        /** 库区（= zoneCode） */
        zoneCode?: string | null;
        /** 库位 */
        locationCode?: string | null;
        /** Delivery Address 模糊搜索 */
        deliveryAddress?: string | null;
        /** 平台 */
        platform?: string | null;
        /** 派送方式 */
        deliveryMethod?: string | null;
      } & Api.Common.CommonSearchParams
    >;

    type WarehouseInventoryDataList = Api.Common.PaginatingQueryRecord<WarehouseInventoryDataLine>;

    /**
     * 库存数据看板：按仓库代码聚合（Query 与列表筛选字段一致，另加 topN）
     * @see docs/wms-inventory-data-dashboard-api.md
     */
    type WarehouseInventoryDashboardByWarehouseParams = CommonType.RecordNullable<
      {
        /** 返回板数合计最高的前 N 个仓库代码 */
        topN?: number | null;
        orderTimeBegin?: string | null;
        orderTimeEnd?: string | null;
        devanningCompleteBegin?: string | null;
        devanningCompleteEnd?: string | null;
        systemSoNo?: string | null;
        coNo?: string | null;
        shipmentCode?: string | null;
        zoneCode?: string | null;
        locationCode?: string | null;
        deliveryAddress?: string | null;
        platform?: string | null;
        deliveryMethod?: string | null;
      } & Pick<Api.Common.CommonSearchParams, 'params'>
    >;

    /** 看板聚合接口单行 */
    type WarehouseInventoryDashboardByWarehouseRow = {
      warehouseCode?: string | null;
      /** 该仓库代码下打板数合计 */
      totalPalletCount?: number | null;
    };

    /** 看板聚合接口 data（与 RuoYi 包装兼容：可为 data 根对象或嵌套） */
    type WarehouseInventoryDashboardByWarehouseResult = {
      rows?: WarehouseInventoryDashboardByWarehouseRow[] | null;
      /** 满足筛选的不同仓库代码总数（可选） */
      totalWarehouses?: number | null;
    };

    /**
     * 库存数据：按明细行手动出库（请求体）
     * @see docs/wms-inventory-data-api.md §2.3
     */
    type WarehouseInventoryDataManualOutstockParams = {
      inventoryDetailId: CommonType.IdType;
      /** 整行出库：与列表行 `palletCount` 一致的全部板数（前端自动填入，用户不可改） */
      palletCount: number;
    };

    /** 出库上传 PDF 后单条处理结果（字段名后端可按实际扩展，前端兼容常见别名） */
    type WarehouseInventoryOutstockResultItem = {
      systemSoNo?: string | null;
      coNo?: string | null;
      shipmentCode?: string | null;
      zoneCode?: string | null;
      locationCode?: string | null;
      /** 出库状态（如 success / failed / skipped，以后端为准） */
      outstockStatus?: string | null;
      status?: string | null;
      /** 说明 / 失败原因 */
      message?: string | null;
      remark?: string | null;
      errorMsg?: string | null;
      palletCount?: number | null;
    };

    /**
     * 出库接口 `data`：可为 `true`（无明细）、对象（含汇总与明细数组）、或直接为明细数组（少数后端约定）
     */
    type WarehouseInventoryOutstockResult =
      | boolean
      | WarehouseInventoryOutstockResultItem[]
      | {
          summary?: string | null;
          msg?: string | null;
          rows?: WarehouseInventoryOutstockResultItem[] | null;
          items?: WarehouseInventoryOutstockResultItem[] | null;
          list?: WarehouseInventoryOutstockResultItem[] | null;
          details?: WarehouseInventoryOutstockResultItem[] | null;
        };

    /**
     * 库存数据「导入现有库存」预览行（字段以后端为准；前端兼容别名）
     * @see docs/wms-inventory-data-existing-import-api.md
     */
    type WarehouseInventoryDataExistingImportPreviewRow = {
      rowNum?: number | null;
      /** Excel 库存状态原样回传（如「已出库」等，以后端为准） */
      inventoryStatus?: string | null;
      /** 海柜 / 柜号 */
      coNo?: string | null;
      /** 表格 Job No. 原文 */
      jobNoRaw?: string | null;
      jobNo?: string | null;
      /** FBA Code，业务上与 Delivery Address 一致 */
      fbaCode?: string | null;
      deliveryAddress?: string | null;
      /** 模糊匹配到的系统订单号 systemSoNo */
      matchedSystemSoNo?: string | null;
      matchedOrderId?: CommonType.IdType | null;
      /** 匹配方式说明（如 contains、token、aggregated 等，后端自定义） */
      matchType?: string | null;
      /** 多条候选时的摘要文案 */
      matchCandidates?: string | null;
      /**
       * 计划动作：`skip` 已存在不写入；`create_order_and_plan` 新建海柜并入计划；
       * `add_inbound_plan` 仅追加入库计划；`auto_outbound` 库存状态命中已出库等由后端自动出库；
       * `ambiguous` / `error` 需人工或无法导入
       */
      plannedAction?: string | null;
      action?: string | null;
      /** 异步执行后该行的处理说明（匹配成功出库、未匹配、失败原因等，以后端为准） */
      rowResultMessage?: string | null;
      errorMessage?: string | null;
      message?: string | null;
    };

    type WarehouseInventoryDataExistingImportPreviewResult = {
      rows: WarehouseInventoryDataExistingImportPreviewRow[];
      importBatchId?: string | null;
    };

    type WarehouseInventoryDataExistingImportConfirmParams = {
      importBatchId?: string | null;
      rows: WarehouseInventoryDataExistingImportPreviewRow[];
    };

    /** 异步确认受理（`POST .../existing-import/confirm` 返回 `code === 202` 时 `data`） */
    type WarehouseInventoryExistingImportTaskSubmitVo = {
      taskId: CommonType.IdType;
      importBatchId?: string | null;
      status?: string | null;
    };

    /** `GET .../existing-import/task/{taskId}` 状态 */
    type WarehouseInventoryExistingImportTaskStatusVo = {
      taskId?: CommonType.IdType;
      importBatchId?: string | null;
      status?: string | null;
      totalRows?: number | null;
      successCount?: number | null;
      failCount?: number | null;
      errorMessage?: string | null;
      /** 整体说明（成功摘要或失败概要，以后端为准） */
      summaryMessage?: string | null;
      startTime?: string | null;
      endTime?: string | null;
      createTime?: string | null;
      /** 完成后行级结果（结构与预览行一致或子集，便于展示每行处理结果） */
      resultRows?: WarehouseInventoryDataExistingImportPreviewRow[] | null;
      rows?: WarehouseInventoryDataExistingImportPreviewRow[] | null;
    };

    /** 订单：出库数据（分页；取消出库即删除记录并回退库存与入库计划状态，以后端为准） */
    type OutstockDataLine = {
      id: CommonType.IdType;
      /** 出库批次号 */
      outstockBatchNo?: string | null;
      coNo?: string | null;
      systemSoNo?: string | null;
      shipmentCode?: string | null;
      /** 装车序号（出库单/装车维度展示，字符串或数字由后端序列化） */
      loadingSequenceNo?: string | number | null;
      deliveryAddress?: string | null;
      platform?: string | null;
      deliveryMethod?: string | null;
      palletCount?: number | null;
      zoneCode?: string | null;
      locationCode?: string | null;
      weight?: number | string | null;
      volumeCbm?: number | string | null;
      totalPieces?: number | null;
      /** 出库记录创建时间（列表展示；以后端是否返回为准） */
      createTime?: string | null;
    };

    type OutstockDataSearchParams = CommonType.RecordNullable<
      {
        /** 创建时间起（含），格式 `yyyy-MM-dd HH:mm:ss` */
        createTimeBegin?: string | null;
        /** 创建时间止（含），格式 `yyyy-MM-dd HH:mm:ss` */
        createTimeEnd?: string | null;
        outstockBatchNo?: string | null;
        coNo?: string | null;
        systemSoNo?: string | null;
        shipmentCode?: string | null;
        loadingSequenceNo?: string | null;
        deliveryAddress?: string | null;
        platform?: string | null;
        deliveryMethod?: string | null;
        zoneCode?: string | null;
        locationCode?: string | null;
      } & Api.Common.CommonSearchParams
    >;

    type OutstockDataList = Api.Common.PaginatingQueryRecord<OutstockDataLine>;

    /**
     * 出库数据看板：按仓库代码聚合（Query 与出库列表筛选一致 + topN）
     * @see docs/wms-outstock-data-dashboard-api.md
     */
    type OutstockDashboardByWarehouseParams = CommonType.RecordNullable<
      {
        /** 返回合计板数最高的前 N 个仓库代码 */
        topN?: number | null;
        createTimeBegin?: string | null;
        createTimeEnd?: string | null;
        outstockBatchNo?: string | null;
        coNo?: string | null;
        systemSoNo?: string | null;
        shipmentCode?: string | null;
        loadingSequenceNo?: string | null;
        deliveryAddress?: string | null;
        platform?: string | null;
        deliveryMethod?: string | null;
        zoneCode?: string | null;
        locationCode?: string | null;
      } & Pick<Api.Common.CommonSearchParams, 'params'>
    >;

    /** 与库存看板相同：`rows` + `totalWarehouses` */
    type OutstockDashboardByWarehouseResult = WarehouseInventoryDashboardByWarehouseResult;

    /** 订单：出库异常 — 按已出库批次聚合 */
    type OutstockExceptionBatchLine = {
      /** 拉取明细用 */
      outstockBatchId: CommonType.IdType;
      outstockBatchNo?: string | null;
      /** 装车序号（与出库数据口径一致时便于列表对照） */
      loadingSequenceNo?: string | number | null;
      exceptionCount?: number | null;
      lastExceptionTime?: string | null;
      createTime?: string | null;
    };

    type OutstockExceptionBatchSearchParams = CommonType.RecordNullable<
      {
        outstockBatchNo?: string | null;
        loadingSequenceNo?: string | null;
        coNo?: string | null;
        systemSoNo?: string | null;
      } & Api.Common.CommonSearchParams
    >;

    type OutstockExceptionBatchList = Api.Common.PaginatingQueryRecord<OutstockExceptionBatchLine>;

    /** 某批次下异常明细 */
    type OutstockExceptionDetailLine = {
      id?: CommonType.IdType | null;
      outstockBatchNo?: string | null;
      /** 订单号展示；后端由 `job_no_raw`（PDF Job NO. 原文）映射 */
      systemSoNo?: string | null;
      coNo?: string | null;
      /** 装车序号 */
      loadingSequenceNo?: string | number | null;
      /** Fbacode 展示；接口字段名仍为 `shipmentCode`，后端由 `fbacode_raw` 等映射 */
      shipmentCode?: string | null;
      exceptionType?: string | null;
      exceptionMessage?: string | null;
      message?: string | null;
      remark?: string | null;
      createTime?: string | null;
    };

    /** 库位详情抽屉 - 明细分页（可选同时返回库位汇总字段） */
    type WarehouseLocationInventoryDetailList = Api.Common.PaginatingQueryRecord<WarehouseLocationInventoryDetailLine> & {
      location?: Pick<
        Api.Wms.WarehouseLocation,
        'id' | 'zoneCode' | 'locationCode' | 'capacity' | 'currentStock' | 'remainingCapacity'
      >;
    };

    type WarehouseLocationBatchStatusBody = {
      ids: CommonType.IdType[];
      status: Api.Common.EnableStatus;
    };

    /** —— 仓库设置：上架规则（独立配置页；规则 JSON 见 docs/wms-putaway-rule-api.md） */

    type PutawayRuleSearchParams = CommonType.RecordNullable<
      {
        /** 区域名称模糊 */
        areaName?: string | null;
        /** 库位编码模糊 */
        locationCode?: string | null;
        /** 库区类型（字典 wms_warehouse_area_type） */
        areaType?: string | null;
        /** 存放方式（字典 wms_storage_method） */
        storageMethod?: string | null;
        /** 派送方式（字典 delivery_type） */
        dispatchMethod?: string | null;
        /** 平台主数据 id */
        platformId?: CommonType.IdType | null;
        /** 平台仓库代码关键字（模糊） */
        platformWarehouseCode?: string | null;
      } & Api.Common.CommonSearchParams
    >;

    /** 列表行（后端可扁平化展示；编辑时务必带回 rulePayload） */
    type PutawayRule = Api.Common.CommonRecord<{
      id: CommonType.IdType;
      /** 库区名称 */
      areaName?: string | null;
      /** 库位编码 */
      locationCode?: string | null;
      /** 库区类型字典值 */
      areaType?: string | null;
      /** 存放方式字典值 */
      storageMethod?: string | null;
      /** 优先级展示（如多条上架条件摘要） */
      priorityDisplay?: string | null;
      /** 派送方式展示 */
      dispatchMethodDisplay?: string | null;
      /** 平台展示 */
      platformDisplay?: string | null;
      /** 平台仓库代码展示（逗号分隔等） */
      platformCodesDisplay?: string | null;
      /** 完整规则 JSON（version=2），供弹窗回填 */
      rulePayload?: string | null;
    }>;

    type PutawayRuleList = Api.Common.PaginatingQueryRecord<PutawayRule>;

    /** 新建/修改：单字段承载完整规则，便于后端落库 TEXT */
    type PutawayRuleOperateParams = {
      id?: CommonType.IdType | null;
      rulePayload: string;
    };

    /**
     * 系统预库位分配兜底范围（上架配置页「分配兜底库区库位」）
     * - `warehouseAreaIds`：可选；**空数组表示不配置兜底库区**（关闭兜底范围）
     * - `warehouseLocationIds`：可选；空数组表示不限定具体库位；库区为空时应一并为空
     */
    type PutawayFallbackAllocation = {
      warehouseAreaIds: CommonType.IdType[];
      warehouseLocationIds: CommonType.IdType[];
    };

    type PutawayFallbackAllocationOperateParams = CommonType.RecordNullable<Api.Wms.PutawayFallbackAllocation>;

    /** —— 仓库设置：系统预库位分配异常日志（见 docs/wms-prelocation-allocation-exception-log-api.md） */

    type PrelocationAllocationExceptionLogSearchParams = CommonType.RecordNullable<
      {
        /** 订单号（与入库计划行「订单号」一致，一般为 systemSoNo） */
        orderNo?: string | null;
        /** 柜号（拆柜订单 coNo） */
        coNo?: string | null;
        /** 货件编码 */
        shipmentCode?: string | null;
        /** 异常类型（字典 `wms_prelocation_allocation_exception_type` 的 dictValue） */
        exceptionType?: string | null;
        /** 异常原因关键字（模糊） */
        exceptionReasonKeyword?: string | null;
      } & Api.Common.CommonSearchParams
    >;

    /** 日志行：关联入库计划维度字段 + 异常信息 */
    type PrelocationAllocationExceptionLog = Api.Common.CommonRecord<{
      id: CommonType.IdType;
      /** 拆柜订单 id（可选，详情跳转） */
      devanningOrderId?: CommonType.IdType | null;
      /** 入库计划行 id */
      inboundPlanId?: CommonType.IdType | null;
      /** 订单号（入库计划数据行展示字段） */
      orderNo?: string | null;
      /** 柜号 */
      coNo?: string | null;
      shipmentCode?: string | null;
      estimatedPalletCount?: number | null;
      /** 异常类型（字典值） */
      exceptionType?: string | null;
      /** 异常原因 */
      exceptionReason?: string | null;
    }>;

    type PrelocationAllocationExceptionLogList = Api.Common.PaginatingQueryRecord<PrelocationAllocationExceptionLog>;

    /** 园区 — 道口/停车位类型 */
    type ParkSlotType = 'dock' | 'parking';

    /** 园区 — 道口/停车位状态 */
    type ParkSlotStatus = 'open' | 'closed';

    /** 园区 — 调度任务类型 */
    type ParkTaskType = 'devanning' | 'loading';

    /** 园区 — 调度任务状态 */
    type ParkTaskStatus = 'pending' | 'not_arrived' | 'queued' | 'in_progress' | 'completed';

    /** 园区 — 可视化区域（前院/后院，调度看板分区） */
    type ParkYardZone = 'front' | 'back';

    /** 园区道口/停车位主数据 */
    type ParkDock = Api.Common.CommonRecord<{
      id: CommonType.IdType;
      /** 所属仓库 id（平台仓库）；园区管理暂不按仓库维护，可为空 */
      warehouseId?: CommonType.IdType | null;
      warehouseName?: string | null;
      /** 道口/停车位名称 */
      slotName: string;
      slotType: ParkSlotType;
      /** 业务类型：拆柜 / 装车（与调度任务 taskType 对齐） */
      businessType: ParkTaskType;
      /** 位置类型，字典 wms_park_location_area 的 dict_value */
      locationArea?: string | null;
      /** 限制停车数（辆） */
      parkingLimit?: number | null;
      status: ParkSlotStatus;
      /** 调度看板分区（可选，后端维护布局） */
      yardZone?: ParkYardZone | null;
      /** 看板网格行/列（后端布局用；管理页暂不展示） */
      gridRow?: number | null;
      gridCol?: number | null;
      sortOrder?: number | null;
      /**
       * 拆柜口调度优先级（从 1 起，**数值越小越优先**）；仅 `businessType=devanning` 的道口参与自动分配。
       */
      priority?: number | null;
      remark?: string | null;
    }>;

    type ParkDockSearchParams = CommonType.RecordNullable<
      Pick<ParkDock, 'warehouseId' | 'slotName' | 'slotType' | 'businessType' | 'locationArea' | 'status'> &
        Api.Common.CommonSearchParams
    >;

    type ParkDockList = Api.Common.PaginatingQueryRecord<ParkDock>;

    type ParkDockOperateParams = CommonType.RecordNullable<
      Pick<
        ParkDock,
        | 'id'
        | 'warehouseId'
        | 'slotName'
        | 'slotType'
        | 'businessType'
        | 'locationArea'
        | 'parkingLimit'
        | 'status'
        | 'yardZone'
        | 'gridRow'
        | 'gridCol'
        | 'sortOrder'
        | 'priority'
        | 'remark'
      >
    >;

    /** 拆柜批量粘贴单项（`batchItems`）；`status` 传中文原文，勿传 pending/completed 等英文码 */
    type ParkSchedulingBatchItem = {
      coNo: string;
      status?: string | null;
      /** 车数量；未传则自动分配时视为最低档 */
      vehicleCount?: number | null;
      /** 体积；未传则自动分配时视为最低档 */
      volume?: number | null;
      /**
       * 逐柜指定道口（粘贴末尾识别码解析或弹窗预设 Dock）；与 `assignToDockMode` 成对。
       * 写入拆柜订单 `dock_id`，`devanning_dock` = 道口 `slot_name`。
       */
      dockId?: CommonType.IdType | null;
      /** 拆柜口名称（与 `wms_park_dock.slot_name` 一致，便于后端校验） */
      devanningDock?: string | null;
      /**
       * 逐柜指派语义：`current`（拆柜中→作业中）、`queued`（已到待拆）、`not_arrived`（柜子未到）。
       * 见 `docs/wms-park-batch-paste-dock-sync-api.md`
       */
      assignToDockMode?: 'current' | 'queued' | 'not_arrived' | null;
    };

    /** 批量新建阶段 2：自动分配道口结果 */
    type ParkSchedulingAutoAssignResult = {
      /** 是否执行了自动分配（`dockId` 预设创建时为 false） */
      executed: boolean;
      expectedDevanningTime: string;
      assignedCount: number;
      skippedCount: number;
      assigned: {
        coNo: string;
        orderId: CommonType.IdType;
        dockId: CommonType.IdType;
        dockName: string;
        orderLevel: number;
        devanningStatus: ParkTaskStatus;
      }[];
      assignSkipped: { coNo: string; orderId?: CommonType.IdType | null; reason: string }[];
      dockLoads: { dockId: CommonType.IdType; dockName: string; count: number }[];
    };

    /** 园区调度任务 */
    type ParkSchedulingTask = Api.Common.CommonRecord<{
      id: CommonType.IdType;
      /** 任务号（展示用） */
      taskNo: string;
      taskType: ParkTaskType;
      warehouseId?: CommonType.IdType | null;
      /** 柜号 */
      coNo: string;
      /** 拆柜等级（数字，可空） */
      orderLevel?: number | null;
      /** 预计拆柜日期 `yyyy-MM-dd`（与拆柜订单 `expectedDevanningTime` 同源） */
      expectedDevanningTime?: string | null;
      /** @deprecated 看板兼容字段，与 `expectedDevanningTime` 同义 */
      plannedWorkTime?: string | null;
      dockId?: CommonType.IdType | null;
      /** 拆柜口（与订单 `devanningDock` 同源；后端可只返其一） */
      devanningDock?: string | null;
      /** @deprecated 看板兼容；请返 `devanningDock`，与拆柜口同义 */
      dockName?: string | null;
      /** 作业轮次（字典 wms_devanning_round） */
      devanningRound?: string | null;
      /** 调度状态；拆柜任务与 `DevanningOrder.schedulingStatus` 一致，`id` 即拆柜订单 id */
      status: ParkTaskStatus;
      /** 排队序号（从 1 起；当前作业为 0 或不返） */
      queuePosition?: number | null;
      /** @deprecated 拆柜任务 id 即订单 id；装车任务可仍为独立表主键 */
      devanningOrderId?: CommonType.IdType | null;
      remark?: string | null;
    }>;

    /** 侧栏作业状态 Tab（`GET .../task/list` 的 `workStatus`） */
    type ParkSchedulingWorkStatus = 'pending' | 'in_progress' | 'completed' | 'not_arrived';

    type ParkSchedulingTaskSearchParams = CommonType.RecordNullable<
      {
        /** 暂不按仓库筛选，前端不传 */
        warehouseId?: CommonType.IdType | null;
        taskType?: ParkTaskType | null;
        /** pending=待作业池（含 queued，见 docs §4.1）；in_progress=仅作业中；completed；not_arrived */
        workStatus?: ParkSchedulingWorkStatus | null;
        /** 柜号筛选（模糊匹配；后端未实现时可先忽略，由前端在当页结果内过滤） */
        coNo?: string | null;
        /**
         * 预计拆柜日期区间起（含），筛选拆柜订单 `expected_devanning_time`；
         * 前端传 `yyyy-MM-dd 00:00:00`；与 `expectedDevanningTimeEnd` 成对
         */
        expectedDevanningTimeBegin?: string | null;
        expectedDevanningTimeEnd?: string | null;
        /** @deprecated 请用 `expectedDevanningTimeBegin` */
        plannedWorkTimeBegin?: string | null;
        /** @deprecated 请用 `expectedDevanningTimeEnd` */
        plannedWorkTimeEnd?: string | null;
      } & Api.Common.CommonSearchParams
    >;

    type ParkSchedulingTaskList = Api.Common.PaginatingQueryRecord<ParkSchedulingTask>;

    type ParkSchedulingTaskCreateParams = {
      warehouseId?: CommonType.IdType | null;
      taskType: ParkTaskType;
      coNo: string;
      orderLevel?: number | null;
      /** 预计拆柜日期 `yyyy-MM-dd` */
      expectedDevanningTime?: string | null;
      devanningRound?: string | null;
      remark?: string | null;
    };

    /** 批量新建/更新拆柜调度（按柜号匹配拆柜订单）结果 */
    type ParkSchedulingBatchUpsertResult = {
      successCount: number;
      failCount: number;
      successes: { coNo: string; orderId: CommonType.IdType }[];
      failures: { coNo: string; reason: string }[];
      /** 阶段 1 完成后执行的自动分配（拆柜且未传 `dockId` 时由后端执行） */
      autoAssign?: ParkSchedulingAutoAssignResult | null;
    };

    /** 批量新建调度任务（多柜号一次提交） */
    type ParkSchedulingTaskBatchCreateParams = {
      warehouseId?: CommonType.IdType | null;
      taskType: ParkTaskType;
      /** 柜号列表（去重、去空后）；与 `batchItems` 二选一或并存时以后端约定为准 */
      coNos: string[];
      /**
       * 拆柜批量：`batchItems[].status` 为粘贴中文（已到待拆/柜子未到/库存更新/已到拆完/拆柜中）；
       * 与 `coNos` 柜号集合一致、条数相同。
       */
      batchItems?: ParkSchedulingBatchItem[] | null;
      /**
       * 拆柜批量新建：等级由阶段 2 自动分配写入，**前端不传**。
       * 装车或未启用自动分配时可为空。
       */
      orderLevel?: number | null;
      /** 预计拆柜日期 `yyyy-MM-dd`（写拆柜订单 `expectedDevanningTime`） */
      expectedDevanningTime?: string | null;
      /** @deprecated 拆柜请用 `expectedDevanningTime` */
      plannedWorkTime?: string | null;
      devanningRound?: string | null;
      remark?: string | null;
      /**
       * 与 `assignToDockMode` 成对：创建成功后立即指派到该 Dock。
       * `current`：仅当该 Dock **尚无** `in_progress` 时新建任务为 `in_progress`，否则 **400/409**（不得静默改为排队）。
       * `queued`：新建任务均为 `queued`，队尾入队。
       */
      dockId?: CommonType.IdType | null;
      assignToDockMode?: 'current' | 'queued' | null;
    };

    type ParkSchedulingTaskAssignParams = {
      taskId: CommonType.IdType;
      dockId: CommonType.IdType;
      /**
       * 可选。`not_arrived`：**未到仓**（绑 Dock，不入 `queuedTasks` 排队，见看板 `notArrivedTasks`）。
       * `queued` 强制入队；`current` 仅当道口无作业中时可落 `in_progress`，否则 **400/409**。
       * 侧栏「待作业」拖入传 **`queued`**；「未到仓」Tab 改派传 **`not_arrived`**。
       */
      assignIntent?: 'current' | 'queued' | 'not_arrived' | null;
    };

    /** 手动变更状态：含排队（一般仅展示；与 Dock 指派语义见 docs §4.4） */
    type ParkSchedulingTaskStatusParams = {
      taskId: CommonType.IdType;
      status: ParkTaskStatus;
    };

    /**
     * 侧栏就地修改（双击）：`orderLevel` / `devanningRound` / `dockId` 至少传一项；
     * 字段传 `null` 或省略后由后端按「清空」语义落库（见 docs §4.4.1）
     */
    type ParkSchedulingTaskPatchParams = {
      taskId: CommonType.IdType;
      orderLevel?: number | null;
      devanningRound?: string | null;
      dockId?: CommonType.IdType | null;
    };

    /** 看板 — 单个 Dock 卡片状态 */
    type ParkDockBoardCard = ParkDock & {
      /** empty | waiting | in_progress | completed */
      cardStatus: 'empty' | 'waiting' | 'in_progress' | 'completed';
      /** 该 Dock 唯一作业中任务，须 status=in_progress；无则为 null */
      currentTask?: ParkSchedulingTask | null;
      /** 排队任务，须均为 queued；同 Dock 至多一条 in_progress（见 currentTask） */
      queuedTasks?: ParkSchedulingTask[];
      /**
       * 已指派本 Dock、**未到仓**（`status=not_arrived`）的任务；**不参与** `queuedTasks` 排队与 `PUT .../queue` 重排。
       * 到仓后由业务改为 `queued`（入队）或经状态接口进入作业流；未返本字段时前端可从 `queuedTasks` 中兼容筛出 `not_arrived`。
       */
      notArrivedTasks?: ParkSchedulingTask[];
      /** 占位格（可视化预留空位，不可拖入） */
      placeholder?: boolean;
    };

    /** 看板分区：按园区管理中的「位置类型 locationArea（dict_value）」分组 */
    type ParkSchedulingBoardSection = {
      /** 位置类型 dict_value（展示文案由字典 dict_label 解析） */
      locationArea: string;
      /** @deprecated 前端分区顺序以字典 dict_sort 为准，可不返 */
      sortOrder?: number | null;
      docks: ParkDockBoardCard[];
    };

    type ParkSchedulingBoard = {
      warehouseId: CommonType.IdType;
      warehouseName?: string | null;
      /** 推荐：按 locationArea 分区返回 */
      sections?: ParkSchedulingBoardSection[];
      /** 可选：扁平 Dock 列表，前端将按 locationArea 自动分组 */
      docks?: ParkDockBoardCard[];
      /** @deprecated 兼容旧版；与 backDocks 合并后仍按 locationArea 重分区 */
      frontDocks?: ParkDockBoardCard[];
      backDocks?: ParkDockBoardCard[];
    };

    type ParkDockQueueDetail = {
      dockId: CommonType.IdType;
      dockName: string;
      /** 该 Dock 唯一 in_progress；无则为 null */
      currentTask?: ParkSchedulingTask | null;
      /** 均为 queued */
      queuedTasks: ParkSchedulingTask[];
      /** 未到仓（已绑 Dock，未入队）；不参与排队拖拽 */
      notArrivedTasks?: ParkSchedulingTask[];
    };

    /** Dock 排队任务重排（仅 `queued`；顺序即作业优先级，见 docs §4.6.1） */
    type ParkDockQueueReorderParams = {
      /** 按新作业顺序排列的任务 id；须与当前 Dock 上 `queued` 任务集合一致 */
      orderedTaskIds: CommonType.IdType[];
    };

    /** 跨 Dock 排队迁移（见 docs §4.6.1.1） */
    /** 释放道口（一键完成该 Dock 全部任务） */
    type ParkDockReleaseParams = {
      dockId: CommonType.IdType;
      /** 与顶栏任务类型一致，后端校验 Dock.businessType */
      taskType: ParkTaskType;
    };

    type ParkDockReleaseResult = {
      dockId: CommonType.IdType;
      dockName: string;
      /** 本次置为 completed 的任务条数 */
      completedTaskCount: number;
      /** 涉及柜号（去重，可选） */
      completedCoNos?: string[];
    };

    type ParkQueuedTaskTransferParams = {
      taskId: CommonType.IdType;
      fromDockId: CommonType.IdType;
      toDockId: CommonType.IdType;
      /** 插入到该任务之前；`null`/省略 表示追加到目标 Dock 排队队尾 */
      insertBeforeTaskId?: CommonType.IdType | null;
    };
  }
}
