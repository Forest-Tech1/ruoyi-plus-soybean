# WMS 上架规则（上架配置）接口说明

前端页面路径：**仓库设置 → 上架配置**（`/wms/warehouse/settings/putaway-config`）。

库区管理页已**移除**「上架条件」列与「编辑上架条件」；原 `PUT /wms/inventory/warehouse-area/{id}/putaway-condition` 可由后端标记废弃，改由本模块统一维护规则（或迁移后双写一段时间）。

---

## 1. 数据模型

### 1.1 规则载荷 `rulePayload`（JSON 字符串，存库建议 `TEXT`）

当前前端提交 **`version: 3`**。规则对象 **四选一**：`targetKind` 决定维度；除 **`warehouse_location`（按库位）** 需同时携带 **库区 id 数组（必填）** 与 **库位 id 数组（可多选，可为空由后端约定是否表示「所选库区下全部库位」）** 外，其余维度仅 **一组** 非 null 数组。

```json
{
  "version": 3,
  "scope": {
    "targetKind": "warehouse_location",
    "warehouseAreaIds": [1, 2],
    "warehouseLocationIds": [10, 11, 12],
    "areaTypes": null,
    "storageMethods": null
  },
  "conditionOp": "OR",
  "conditions": [
    {
      "priority": 1,
      "dispatchMethod": "truck_delivery",
      "platformId": 2,
      "platformCodes": ["BHM1", "AZA4"]
    },
    {
      "priority": 2,
      "dispatchMethod": null,
      "platformId": null,
      "platformCodes": []
    }
  ]
}
```

`targetKind` 取值：

| 值 | 含义 | 使用的字段 |
|----|------|------------|
| `warehouse_area` | 按库区 | 仅 `warehouseAreaIds` 非 null（长度 ≥ 1），其余为 `null` |
| `warehouse_location` | 按库位（库区+库位） | **`warehouseAreaIds`（必填，长度 ≥ 1）** 与 **`warehouseLocationIds`（非 null 数组，可多选）** 同时非 null；`areaTypes`、`storageMethods` 为 `null` |
| `area_type` | 按库区类型 | 仅 `areaTypes` 非 null（长度 ≥ 1） |
| `storage_method` | 按存放方式 | 仅 `storageMethods` 非 null（长度 ≥ 1） |

| 字段 | 说明 |
|------|------|
| `scope.targetKind` | 必填。上述四选一。 |
| `scope.warehouseAreaIds` / `warehouseLocationIds` 等 | 见上表；未用到的字段必须为 `null`。 |
| `conditionOp` | `AND` 或 `OR`，表示 **多条 `conditions` 之间** 的逻辑关系。 |
| `conditions[]` | 上架条件行：优先级、派送方式（字典 `delivery_type`）、**平台主数据 id（可选）**、平台仓库代码列表（大写）。**`platformId` 为 `null` 表示本条不按平台过滤**（建议 `platformCodes` 为 `[]`）。**已选平台**时：`platformCodes` 为空数组表示该平台下不限定具体仓库代码；非空则仅匹配所列代码。 |

**兼容**：前端仍可解析旧版 **`version: 2`**（`warehouseAreaId` / `warehouseLocationId` / `areaType` / `storageMethod` 单值），保存时统一写出 **v3**。

| 字段（v2 已废弃） | 迁移到 v3 |
|------------------|-----------|
| `scope.warehouseAreaId`（仅有库区） | `targetKind: warehouse_area`，`warehouseAreaIds: [id]` |
| `scope.warehouseLocationId`（可有库区） | `targetKind: warehouse_location`，`warehouseAreaIds: [areaId]`（若旧数据无库区则为 `[]`，需用户补全），`warehouseLocationIds: [locId]` |
| `scope.areaType` | `targetKind: area_type`，`areaTypes: [值]` |
| `scope.storageMethod` | `targetKind: storage_method`，`storageMethods: [值]` |

**后端职责建议**：解析 `scope` + `conditions` 做命中判断；列表接口返回扁平展示字段（见 1.2），并带回 `rulePayload` 供编辑回填。

### 1.2 列表行 `PutawayRule`（分页 `rows` 元素）

除通用字段外，建议至少包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 主键 |
| `areaName` | string? | 库区名称（展示） |
| `locationCode` | string? | 库位编码（展示） |
| `areaType` | string? | 库区类型字典值 |
| `storageMethod` | string? | 存放方式字典值 |
| `priorityDisplay` | string? | 优先级摘要，如 `1` 或 `1 / 2` |
| `dispatchMethodDisplay` | string? | 派送方式摘要（已翻译或字典标签） |
| `platformDisplay` | string? | 平台摘要，如 `亚马逊 (AMZ)` |
| `platformCodesDisplay` | string? | 仓库代码摘要，如 `BHM1, AZA4` |
| `rulePayload` | string | **必填（编辑场景）**。与 1.1 结构一致的 JSON 字符串。 |

---

## 2. 权限字符（与前端 `hasAuth` 对齐）

| 权限 | 说明 |
|------|------|
| `wms:putawayRule:list` | 分页查询 |
| `wms:putawayRule:add` | 新建 |
| `wms:putawayRule:edit` | 修改 |
| `wms:putawayRule:remove` | 删除 |

菜单：挂在「仓库设置」下，路由名 `wms_warehouse_settings_putaway-config`，组件路径 `wms/warehouse/settings/putaway-config`。

---

## 3. 接口列表

统一前缀示例：`/wms/warehouse/putaway-rule`（可按项目规范微调，与 `src/service/api/wms/putaway-rule.ts` 保持一致即可）。

### 3.1 分页列表

- **GET** `/wms/warehouse/putaway-rule/list`
- **Query**：与 `Api.Wms.PutawayRuleSearchParams` 一致（RuoYi 风格分页 + 筛选）：

| 参数 | 说明 |
|------|------|
| `pageNum` | 页码 |
| `pageSize` | 每页条数 |
| `areaName` | 区域名称模糊 |
| `locationCode` | 库位号模糊 |
| `areaType` | 库区类型 |
| `storageMethod` | 存放方式 |
| `dispatchMethod` | 派送方式（字典 `delivery_type`） |
| `platformId` | 平台主数据 id |
| `platformWarehouseCode` | 平台仓库代码模糊（匹配 `conditions` 内代码或落库冗余字段） |
| `orderByColumn` / `isAsc` | 可选排序 |

- **Response**：`TableDataInfo` / 项目统一分页结构，`rows` 为 `PutawayRule[]`，`total` 为总条数。

### 3.2 详情（可选）

- **GET** `/wms/warehouse/putaway-rule/{id}`
- **Response**：单条 `PutawayRule`（含 `rulePayload`）。若列表已含完整 `rulePayload`，可省略此接口。

### 3.3 新建

- **POST** `/wms/warehouse/putaway-rule`
- **Body**：

```json
{
  "rulePayload": "{\"version\":3,...}"
}
```

- **Response**：`AjaxResult` 成功即可（前端按 `boolean` 处理）。

### 3.4 修改

- **PUT** `/wms/warehouse/putaway-rule`
- **Body**：

```json
{
  "id": 1,
  "rulePayload": "{\"version\":3,...}"
}
```

### 3.5 删除

- **DELETE** `/wms/warehouse/putaway-rule/{id}`
- **Response**：`AjaxResult`。

### 3.6 预库位分配兜底配置（库区必填、库位选填）

用于 **系统预库位自动分配** 时的兜底候选范围（与 `docs/wms-devanning-order-prelocation-api.md` §3.3 兜底策略一致）。前端入口：**上架配置**页工具栏 →「分配兜底库区库位」。

| 项 | 值 |
|----|-----|
| 查询 | **GET** `/wms/warehouse/putaway-rule/fallback-allocation` |
| 保存 | **PUT** `/wms/warehouse/putaway-rule/fallback-allocation` |

**GET Response `data`**（与 `Api.Wms.PutawayFallbackAllocation` 对齐）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `warehouseAreaIds` | `Long[]` | 库区主键 id，至少 1 个（保存时校验）；首次未配置可返回 `[]` |
| `warehouseLocationIds` | `Long[]` | 库位主键 id，**可选**；空数组表示不限定具体库位，仅按库区兜底 |

**PUT Body**：同上。后端需校验：`warehouseAreaIds` 非空且 id 有效；`warehouseLocationIds`（若传）须属于所选库区（与库位表 `zone_code` / 库区 `area_name` 关联一致）。

**权限**：建议使用 `wms:putawayRule:edit`（与上架规则修改同级）；若需细分可增加 `wms:putawayRule:fallback`。

---

## 4. 与库区接口的关系

- 库区实体 `WarehouseArea` 上若仍保留 `putawayCondition` 字段：可由迁移任务把历史 JSON 导入上架规则表后清空；新前端不再读写该字段。
- **PUT** `/wms/inventory/warehouse-area/{id}/putaway-condition` 建议在后端文档中标注 **废弃**。

---

## 5. 前端文件索引

| 路径 | 说明 |
|------|------|
| `src/views/wms/warehouse/settings/putaway-config/index.vue` | 列表页 |
| `src/views/wms/warehouse/settings/putaway-config/modules/putaway-config-search.vue` | 搜索栏 |
| `src/views/wms/warehouse/settings/putaway-config/modules/putaway-rule-operate-modal.vue` | 新建/编辑弹窗（左规则对象 + 右上架条件） |
| `src/views/wms/warehouse/settings/putaway-config/modules/putaway-fallback-allocation-modal.vue` | 兜底库区/库位配置弹窗 |
| `src/service/api/wms/putaway-rule.ts` | 请求封装 |
| `src/typings/api/wms.api.d.ts` | `PutawayRule*` 类型 |

---

## 6. 校验建议（后端）

1. `rulePayload` 必须为合法 JSON；**推荐** `version === 3` 且 `conditions.length >= 1`。若仍接收 `version === 2`，请按 1.1 表迁移 `scope` 后再落库或内存归一化为 v3。
2. **`scope`（v3）**：`targetKind` 为上述四值之一。`warehouse_area` / `area_type` / `storage_method`：对应唯一数组 **非 null 且长度 ≥ 1**，其余为 `null`。**`warehouse_location`**：`warehouseAreaIds` **长度 ≥ 1**；`warehouseLocationIds` 非 null（允许空数组，语义与后端约定一致）。
3. 每条 `conditions[i]`：**`platformId` 可选**；为 `null` 时不限制平台。`platformCodes` 必须为数组；仅当 `platformId` 非空时有业务意义，元素建议规范为大写；`platformId` 为空时建议 `platformCodes` 为 `[]`。
4. `conditionOp` 仅允许 `AND` | `OR`。
