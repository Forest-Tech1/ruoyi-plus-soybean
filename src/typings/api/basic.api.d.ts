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
  }
}
