# 货物订单（跨拆柜订单入库计划列表）— 后端 API 说明

前端页面：`/wms/order/cargo-inbound-plan`（菜单名：**货物订单**，位于「订单管理」下）  
源码：`src/views/wms/order/cargo-inbound-plan/index.vue`  
表格与交互复用：`src/views/wms/order/devanning-order/modules/devanning-order-inbound-plan-tab.vue`（`globalMode`）

目标：与拆柜订单详情 → **入库计划** Tab **同一套字段与操作**（行内编辑、弹窗编辑、HOLD、删除、**分配系统预库位** / 地图选点等），仅多一列 **柜号 `coNo`（首列）**，并支持顶部条件检索。

---

## 1. 复用已有接口（无需改 URL）

以下接口与详情入库计划 Tab **完全一致**，货物订单页继续调用：

| 说明 | Method | URL |
|---|---|---|
| 修改入库计划行 | `PUT` | `/wms/devanning-order/inbound-plan` |
| 仅更新系统预库位 JSON | `PUT` | `/wms/devanning-order/inbound-plan/system-pre-location` |
| 删除入库计划行 | `DELETE` | `/wms/devanning-order/inbound-plan/{id1,id2,...}` |

请求体、权限字符与 `docs/wms-devanning-order-prelocation-api.md`（预库位）及现有拆柜订单模块保持一致。  
行操作必须带 **`orderId`（拆柜订单主键）**：全局列表每一行都要返回 `orderId`，与详情 Tab 中单柜下列表一致。

---

## 2. 需新增：跨单分页列表（唯一新接口）

### Method & URL

- Method: `GET`
- URL: `/wms/devanning-order/inbound-plan/list`

> 与现有「单柜下列表」`GET /wms/devanning-order/{orderId}/inbound-plan/list` 路径区分：前者无 `orderId` 路径段，用 Query 筛选。

### Query 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `pageNum` | number | 页码 |
| `pageSize` | number | 每页条数 |
| `coNo` | string | 柜号（模糊或精确由后端约定，建议模糊） |
| `systemSoNo` | string | 订单号（入库计划 `systemSoNo`） |
| `shipmentCode` | string | 货件编码 |
| `locationCode` | string | 库位：匹配 **系统预库位** JSON `allocations[].locationCode`（见预库位文档 version=1） |
| `zoneCode` | string | 库区：与库位主数据 `zoneCode` / 库区名称口径一致，用于筛「预库位所在库区」或关联库位维度（由后端实现） |
| `cargoPhase` | string | 见下表；**不传或空** 表示「全部」 |

**`cargoPhase`（货物订单状态 Tag，与页面一致）**

| 值 | 含义（产品口径，需后端落实现） |
|---|---|
| `not_in_stock` | **未入库**：未分配系统预库位，或尚未进入**库存数据**（与「库存数据」页/库位占用无记录等条件一致，由你们表结构定义） |
| `in_stock` | **已入库**：已存在对应**库存数据**（与库位库存、库存明细可关联） |
| `out_stock` | **已出库**：可与入库计划行 `outboundStatus = outbound_done` 一致，或按你们出库单/库存回写状态 |

> 注意：`not_in_stock` 与 `in_stock` 的精确判定依赖主数据与库存表关联，请与「库存数据」列表同一套业务定义，避免与 `outboundStatus` 冲突时以文档/产品为准（例如已出库行是否同时算「已入库」过，需二选一规则）。

### Response

与现有 `GET /wms/devanning-order/{orderId}/inbound-plan/list` **相同分页结构**（`total` + `rows`，可选 `summary`），其中 **`rows` 每一行** 在原有 `DevanningInboundPlan` 字段基础上 **必须包含**：

| 字段 | 说明 |
|---|---|
| `id` | 入库计划行 id |
| `orderId` | 所属拆柜订单 id（**必填**，供 PUT/预库位/删除） |
| `coNo` | 该订单柜号（**必填**，供列表首列展示） |
| 其余 | 与单柜下列表一致：`systemPreLocation`、`systemSoNo`、`shipmentCode`、`platform`、`warehouseCode`、`addressType`、`deliveryMethod`、`hold`、`totalPieces`、`weight`、`volumeCbm`、`estimatedPalletCount`、`remark`、`outboundStatus` 等 |

`summary`（总件数、总 CBM）可选，与现接口一致即可。

---

## 3. 筛选语义建议

1. **`cargoPhase`**：与其它 Query 组合时为 **AND**；与 `locationCode`、`zoneCode` 可同时生效。
2. **`locationCode`**：对 `systemPreLocation` 解析后的 `allocations` 做子串/JSON 查询；无预库位时可不匹配或仅匹配空，由产品定。
3. **`zoneCode`**：若预库位 JSON 不含库区，可通过 `locationCode` 关联 `wms_location` / 库区表反查过滤。
4. 多条件为 **AND**。

---

## 4. 权限

建议与入库计划行操作复用同一套（与前端 `hasAuth` 一致即可），例如：

- 列表：`wms:devanningOrder:query` 或单独 `wms:devanningOrder:inboundPlan:list`
- 编辑 / 预库位：`wms:devanningOrder:inboundPlan:edit` 或 `wms:devanningOrder:add`
- 删除：`wms:devanningOrder:inboundPlan:remove` 或 `wms:devanningOrder:remove`

以你们后端菜单为准；前端未新增独立权限字符。

---

## 5. 菜单 SQL（示例）

在「订单管理」父菜单下新增子菜单，路由 path 与前端 elegant-router 生成一致，例如：

- `path`: `cargo-inbound-plan`（完整 path：`/wms/order/cargo-inbound-plan`，以生成器为准）
- `component`: 指向 Vue 视图 `wms/order/cargo-inbound-plan/index`
- 名称：**货物订单**

---

## 6. 相关文档

- 拆柜订单 / 入库计划：`docs/wms-devanning-order-api.md`（若仓库中有）
- 系统预库位 JSON：`docs/wms-devanning-order-prelocation-api.md`

---

## 7. 前端调用摘要

- 列表：`fetchGetDevanningInboundPlanGlobalList` → `GET /wms/devanning-order/inbound-plan/list`
- 其余：`src/service/api/wms/devanning-order.ts` 中已有 `fetchUpdateDevanningInboundPlan`、`fetchUpdateDevanningInboundPlanSystemPreLocation`、`fetchBatchDeleteDevanningInboundPlan`

若后端将新列表 URL 改为其它路径，请同步修改 `fetchGetDevanningInboundPlanGlobalList` 与本文档。
