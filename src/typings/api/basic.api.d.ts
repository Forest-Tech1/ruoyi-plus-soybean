/**
 * Namespace Api.Basic — 基础数据 / 平台与平台仓库
 */
declare namespace Api {
  namespace Basic {
    /** 平台主数据 */
    type Platform = Api.Common.CommonRecord<{
      id: CommonType.IdType;
      /** 平台名称（中文） */
      platformName: string;
      /** 平台代码，大写+数字，全局唯一 */
      platformCode: string;
      /** 图标 URL（上传后） */
      iconUrl?: string | null;
      /** 0 正常 1 停用（与 sys_normal_disable 一致） */
      status: string;
      remark?: string | null;
      /** 列表接口可返回：该平台下仓库数量 */
      warehouseCount?: number;
    }>;

    type PlatformOperateParams = {
      id?: CommonType.IdType | null;
      platformName: string;
      platformCode: string;
      iconUrl?: string | null;
      status: string;
      remark?: string | null;
    };

    /** 平台下仓库 */
    type PlatformWarehouse = Api.Common.CommonRecord<{
      id: CommonType.IdType;
      platformId: CommonType.IdType;
      warehouseCode: string;
      warehouseName: string;
      /** ISO 3166-1 alpha-2，如 US、CN */
      countryCode: string;
      /** 展示用国家名称（列表可冗余返回） */
      countryName?: string | null;
      stateProvince?: string | null;
      city?: string | null;
      addressLine: string;
      postalCode?: string | null;
      /** 单托 CBM（立方米/托，业务主数据；可空） */
      palletCbm?: number | null;
      status: string;
      remark?: string | null;
    }>;

    type PlatformWarehouseSearchParams = Api.Common.CommonSearchParams & {
      platformId: CommonType.IdType;
      /** 仓库代码/名称模糊 */
      keyword?: string | null;
      /** 0 / 1 / 空表示全部 */
      status?: string | null;
      /** 国家多选，可重复参数 countryCodes=US&countryCodes=CN */
      countryCodes?: string[] | null;
    };

    type PlatformWarehouseList = Api.Common.PaginatingQueryRecord<PlatformWarehouse>;

    type PlatformWarehouseOperateParams = {
      id?: CommonType.IdType | null;
      platformId: CommonType.IdType;
      warehouseName: string;
      warehouseCode: string;
      countryCode: string;
      stateProvince?: string | null;
      city?: string | null;
      addressLine: string;
      postalCode?: string | null;
      palletCbm?: number | null;
      status: string;
      remark?: string | null;
    };

    /** 仓库详情（含可选操作记录） */
    type PlatformWarehouseDetail = PlatformWarehouse & {
      operateLogs?: WarehouseOperateLog[];
    };

    type WarehouseOperateLog = {
      id: CommonType.IdType;
      operateUserName?: string;
      operateTime?: string;
      changeSummary?: string;
    };

    /** 停用平台前置检查 */
    type PlatformDisableCheck = {
      activeWarehouseCount: number;
    };

    /** 平台仓库 Excel 导入：预览行（与确认回传结构一致） */
    type PlatformWarehouseImportPreviewRow = {
      /** Excel 物理行号（可选，便于报错定位） */
      rowNum?: number | null;
      /** 平台代码，须能匹配已存在平台 `platformCode` */
      platformCode: string;
      /** 仓库代码；落库时 **仓库名称与仓库代码相同**（`warehouseName = warehouseCode`） */
      warehouseCode: string;
      /** 预览回显，可与 `warehouseCode` 相同；为空时后端按代码填充名称 */
      warehouseName?: string | null;
      /** ISO 3166-1 alpha-2 */
      countryCode: string;
      /** 详细地址（街道等） */
      addressLine: string;
      city?: string | null;
      stateProvince?: string | null;
      postalCode?: string | null;
      /** 单托 CBM（可选；导入模板可增加该列） */
      palletCbm?: number | null;
      /** 非空表示本行校验失败，确认导入时应跳过或整单拒绝（以后端策略为准） */
      errorMessage?: string | null;
    };

    /** POST import-preview 响应 `data` */
    type PlatformWarehouseImportPreviewResult = {
      rows: PlatformWarehouseImportPreviewRow[];
      /** 可选：后端生成的预览批次 id，确认时原样回传以便幂等/审计 */
      importBatchId?: string | null;
    };

    /** POST import-confirm 请求体 */
    type PlatformWarehouseImportConfirmParams = {
      updateSupport: boolean;
      /** 须与预览接口返回的 `rows` 一致（同一顺序与字段）；后端再次校验 */
      rows: PlatformWarehouseImportPreviewRow[];
      importBatchId?: string | null;
    };
  }
}
