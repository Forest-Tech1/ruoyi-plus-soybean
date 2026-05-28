# 库存可视化平面图 — 后端对接说明（订单管理 · 库存平面图页）

前端页面：`/wms/order/warehouse-inventory-map`，源码：`src/views/wms/order/warehouse-inventory-map/index.vue`。

## 页面行为简述（当前 UI）

1. **布局**：左侧 **库区**筛选；右侧在「仓库」边框内按 **`zoneCode`（库区名称）分段**，区与区之间顺序与 **`GET /wms/inventory/warehouse-area/list`** 拉取的全量库区 **`areaName` 升序**一致（形如 A→B→C）；**区内**库位卡片 **`locationCode` 排序**后 **横向换行平铺**，**不再按 rowRank × columnRank 网格落位**。
2. **卡片内容**：缩放较小时仅显示 **库位编码**；放大后显示 **剩余可用库容**、按 **仓库代码**（`warehouseCode`）汇总的 **板数**（可滚动）；悬停可看摘要；点击打开 **详情抽屉**。占用颜色按使用率 **多档色阶**（依赖 `capacity` / `currentStock`）。
3. **数据**：库区列表（左侧）+ **库位分页列表**（大图一次拉较多条，见下）。
4. **拖拽改坐标**：已移除；库位行列请在 **库位管理** 维护。

---

## 1. 库位列表接口 — 必选字段

沿用 **`GET /wms/inventory/location/list`**。

每条库位至少需要：

| 字段 | 说明 |
|------|------|
| `zoneCode` | 与库区 `areaName` 一致，用于分段与排序归属 |
| `locationCode` | 区内排序与卡片标题 |
| `capacity`、`currentStock`、`remainingCapacity` | 展示与占用色阶判定 |
| `warehouseCodeOccupancies` | **可选**。数组，每项含 **`warehouseCode`**（仓库代码）、**`palletCount`**（该仓库代码在本库位的板数）。平面图按仓库代码维度展示明细。若短期仍返回旧字段名 **`destinationOccupancies`** 或行内 **`destination`**，前端会兼容映射为仓库代码 |

**`rowRank`、`columnRank`**：本页可视化 **不再强制**；仍可随列表返回供库位管理等场景使用。

**筛选**：选某一库区时传 **`zoneCode`**；选「全部」时不传 `zoneCode`。左侧「平面图」开关可在全部模式下隐藏指定库区。

**分页**：可视化会请求 **较大 `pageSize`**（如 5000）。不足时可提高上限或提供专用平面图接口。

---

## 1.0 平面图专用筛选（Query，可选）

前端路径：`/wms/order/warehouse-inventory-map`。在调用 **`GET /wms/inventory/location/list`** 时，除既有 `zoneCode`、`status` 等参数外，可增加下列 **可选** 查询参数（均为 **trim 后**传参；空字符串或不传表示不启用该条件）。

| Query 参数 | 类型 | 说明 |
|------------|------|------|
| `inventoryWarehouseCode` | string? | **库存仓库代码**筛选（与库位行内 `warehouseCodeOccupancies[].warehouseCode` 同一业务含义，如 `ONT8`）。 |
| `putawayDispatchMethod` | string? | **上架规则**筛选·**派送方式**（字典 `delivery_type`，与 **[上架配置模块](./wms-putaway-rule-api.md)** 列表筛选项一致）。**仅当本参数非空时**才启用上架维度；与 `putawayPlatformId`、`putawayPlatformWarehouseCode` 组合使用。 |
| `putawayPlatformId` | Long? | **上架规则**筛选·**平台**主数据 id；**可选**，不传表示不按平台限定（与上架配置页「平台」筛选语义一致）。 |
| `putawayPlatformWarehouseCode` | string? | **上架规则**筛选·**平台仓库代码**（如 `ONT8`）；**可选**，trim 后参与与规则条件 `platformCodes` 的匹配。 |

**组合逻辑**：

- `inventoryWarehouseCode` 与 **上架三参** 可同时存在，结果为 **AND**（须同时满足库存维与上架维；上架维仅在三参中 **`putawayDispatchMethod` 非空** 时生效）。
- 若 **`putawayDispatchMethod` 为空或未传**：**不要**应用上架规则过滤（前端清空派送方式时也不会带上架参数）。

### 1.0.1 `inventoryWarehouseCode`（库存 + 空库位）

**业务目标**：输入 `ONT8` 时，平面图上只关心：**库存里带有仓库代码 ONT8 的库位**，以及 **空库位**（便于安排同一代码入库或查看余量）。

**建议后端返回集合**：`结果 = LocHasCode(code) ∪ LocEmpty`（并集）。

- **`LocHasCode(code)`**：该库位在库存/占用明细中，**至少有一条** `warehouseCode`（或明细表里等价字段）在规范化后与 `code` **匹配**。匹配规则建议：**去首尾空格**后 **不区分大小写**（`ONT8` = `ont8`）。数据来源可与列表行上的 **`warehouseCodeOccupancies`** 一致（聚合自库存明细）。
- **`LocEmpty`**：**空库位**。建议定义与页面「空占用」展示一致，例如满足以下**之一**即可（按你们库存事实表选型一条为主，避免重复）：
  - `currentStock == 0`（或等价「在库板数为 0」）；或
  - 无在库库存记录且库位状态为可用。

**不应**仅按 `warehouseCodeOccupancies` 文本包含过滤而不含空库位（否则与产品诉求不符）。

**与其它筛选**：仍传 `zoneCode` 时，应先在该库区下计算上述并集。

### 1.0.2 `putawayDispatchMethod` / `putawayPlatformId` / `putawayPlatformWarehouseCode`（上架规则可分配库位）

**业务目标**：与 **上架配置** 页筛选项对齐——用户选择 **派送方式**（必填启用）、可选 **平台**、可选 **平台仓库代码** 后，平面图上 **只显示** 命中上架规则的库位；**不匹配的全部不返回**（前端不展示）。

**规则数据来源**：与 **[wms-putaway-rule-api.md](./wms-putaway-rule-api.md)** 中 **`rulePayload`**（`version: 3`）一致：解析 `scope` 与 `conditions`（`dispatchMethod`、`platformId`、`platformCodes` 等）。

**启用条件**：请求里 **`putawayDispatchMethod` 非空**（trim 后）才执行本节；否则上架维度不参与过滤。

**建议后端逻辑（语义说明，实现可优化）**：

1. 取租户下 **启用** 的上架规则（与上架配置模块一致）。
2. 对每条规则解析 `rulePayload`。若 **整条规则** 经下列条件命中，则将其 **`scope`** 展开为库位 id 集合并参与并集：
   - **派送方式**：至少存在一条 `conditions[]`，其 **`dispatchMethod`** 与请求 **`putawayDispatchMethod`** 一致（字典值相等）。若业务允许条件行 `dispatchMethod` 为空表示「不限派送方式」，与 **现有上架命中/列表筛选** 保持一致。
   - **平台**（仅当请求传入 **`putawayPlatformId`**）：至少存在一条 `conditions[]`，其 **`platformId`** 与请求 id **相等**；或未选平台时 **不要求** 本条（不传 `putawayPlatformId` 则不在条件里过滤平台）。
   - **平台仓库代码**（仅当请求传入非空 **`putawayPlatformWarehouseCode`**）：对命中的条件行，其 **`platformCodes`**：
     - 若为非空数组：须包含该代码（建议 **不区分大小写**，trim）。
     - 若为空数组：表示在该 **`platformId` 下不限定具体仓库代码** —— 是否与「仅填代码不传平台」等组合兼容，须与 **预库位/上架列表接口** 已有语义一致。
   - 单条规则内多行 `conditions` 由 **`conditionOp`（AND/OR）** 合成后再判断是否「该规则整体命中」。
3. **多条规则**的库位 scope 取 **并集（OR）**。
4. 列表接口 **仅返回** 库位 id 落在该并集中的记录（分页同上）。

**与库存筛选组合**：若同时传 `inventoryWarehouseCode`，返回  
`(LocHasCode ∪ LocEmpty) ∩ PutawayScope(派送方式, 可选平台, 可选平台代码)`。

### 1.0.3 权限与性能

- **权限**：与 **`wms:location:list`**（或项目现有库位列表权限）一致即可。
- **性能**：上架三参可能涉及规则解析与 bulk id；若较慢，可对常见 `(dispatchMethod, platformId, code)` 做短 TTL 缓存，或提供独立聚合接口（非必须，前端当前沿用 **list**）。

---

## 1.1 库区/全库库存汇总（左侧列表用，需新增接口）

左侧库区列表需要展示：

- **全部库位**：现有库存板数、总容量板数、占用比例（百分比）
- **每个库区**：同上，并按占用比例分段着色（与右侧库位格子使用同一色阶）

为避免前端在分页库区列表里逐个库区再去查询库位明细（N+1），建议后端提供一个聚合接口，一次返回 **全库** + **各库区** 的汇总。

### Method & URL

- Method: `GET`
- URL: `/wms/inventory/warehouse-area/stock-statistics`

### Query

无（或可选传 `warehouseCode` / `tenantId` 等后端现有通用参数，按你们系统约定）。

### Response data

```json
{
  "all": {
    "areaName": null,
    "totalCapacity": 1200,
    "totalCurrentStock": 860,
    "utilizationPercent": 72
  },
  "areas": [
    {
      "areaName": "Zone A",
      "totalCapacity": 400,
      "totalCurrentStock": 120,
      "utilizationPercent": 30
    },
    {
      "areaName": "Zone B",
      "totalCapacity": 500,
      "totalCurrentStock": 475,
      "utilizationPercent": 95
    }
  ]
}
```

### 字段说明

| 字段 | 说明 |
|---|---|
| `areaName` | 库区名称，需与 `warehouse-area/list` 返回的 `areaName` 以及库位列表中的 `zoneCode` **完全一致**，用于前端映射 |
| `totalCapacity` | 该库区（或全库）**总容量（板数）** |
| `totalCurrentStock` | 该库区（或全库）**现有库存（板数）** |
| `utilizationPercent` | 占用率百分比（0-100）。可选：后端不返回时，前端会用 `totalCurrentStock / totalCapacity` 计算（capacity<=0 则视为未知） |

### 前端分段色阶（与库位格子一致）

- Empty: 0%
- Low: 1–49%
- Moderate: 50–79%
- High: 80–94%
- Critical: 95%+
- 容量无效（`totalCapacity` 为空或 ≤ 0）：灰

---

## 2. 库区列表顺序

前端会用 **`warehouse-area/list`** **全量一次**（如 `pageSize` 较大）生成 **库区名称顺序**，再据此排列 A/B/C 分段。若与业务期望不一致，请后端保证 **`areaName`** 排序规则与仓库命名一致。

---

## 3. 库存字段与使用率

同 [wms-inventory-api.md](./wms-inventory-api.md)：**`capacity`、`currentStock`、`remainingCapacity`**；使用率由前端按库存/库容计算。

---

## 4. 拖拽编辑布局（历史）

已不再使用。**库位行列**请在库位管理中维护；若仅需保留说明，参见 **[wms-warehouse-inventory-map-edit-api.md](./wms-warehouse-inventory-map-edit-api.md)**（部分内容已过时）。

---

## 5. 权限

沿用 **`wms:location:list`** 等与列表一致。
