# 库位管理 · 现有库存 / 剩余容量 / 库位详情抽屉 — 后端对接说明

本文档用于后端实现与前端（`ruoyi-plus-soybean`）对齐，涵盖：**库位列表字段扩展**、**分页查询与排序约定**（配合新版左右分栏 UI）、**库位详情抽屉**、**明细分页接口**、以及入库计划 **系统预库位** 编辑/删除所依赖的接口。

相关基础文档（库区/库位 CRUD）：[wms-inventory-api.md](./wms-inventory-api.md)。  
拆柜入库计划 **系统预库位 JSON** 与导出分配：[wms-devanning-order-prelocation-api.md](./wms-devanning-order-prelocation-api.md)。

---

## 0. 新版「库位管理」页面对后端的隐含约定（必读）

前端页面：`src/views/wms/inventory/location/index.vue`。

### 0.1 左侧「库区」列表

- **接口**：沿用已有 **库区分页列表**  
  `GET /wms/inventory/warehouse-area/list`  
- **前端调用（分页 + 检索）**：  
  - `pageNum`、`pageSize`（默认每页 12 条，可在页面上改为 8/12/16/24）  
  - `areaName`：左侧搜索框关键字（模糊；空则不按名称过滤）  
  - `orderByColumn=areaName`、`isAsc=asc`（名称 **升序**，便于 **A/B/C…** 区自上而下排列）  
- **后端**：分页 `total` / `rows` 必须正确；字段需含 `areaName`、`areaType`、`storageMethod`（见 [wms-inventory-api.md](./wms-inventory-api.md)）。  
- **说明**：左侧栏为窄列展示，已不再一次性 `pageSize=500` 拉全量。

### 0.2 右侧「库位」列表 — 筛选与排序

- **接口**：沿用已有 **库位分页列表**  
  `GET /wms/inventory/location/list`
- **查询参数（前端会传）**：

| 参数 | 说明 |
|------|------|
| `zoneCode` | **可选**。与库位表 `zone_code` / 前端 `zoneCode` 对齐；值为 **库区名称 `areaName`**（与历史库位下拉一致）。**不传或为空**：表示 **全库位**（不按库区过滤）。 |
| `locationKeyword` | 可选；库位编码等模糊条件（与现有文档一致）。 |
| `status` | 可选；启用停用。 |
| `pageNum` / `pageSize` | 分页。 |
| `orderByColumn` | 前端固定传 **`locationCode`**（若后端使用 snake_case，请兼容 **`location_code`** 映射到同一列）。 |
| `isAsc` | 前端固定传 **`asc`**（按库位编码 **升序**）。 |

**后端必须支持**：在无 `zoneCode` 时返回全部库位；有 `zoneCode` 时仅返回该库区下库位；并支持按库位编码列升序排序。若当前 Mapper/XML 未支持 `orderByColumn=locationCode`，需要补齐白名单与排序字段。

---

## 1. 需求概述

### 1.1 列表页（库位管理）

在库位列表增加两列：

- **现有库存**：`currentStock`
- **剩余容量**：`remainingCapacity`

其中 `remainingCapacity` 推荐后端直接返回，口径为：`capacity - currentStock`（若 capacity 为空则可返回 null）。

### 1.2 详情抽屉

库位列表操作列增加 **详情** 按钮，打开抽屉：

- 顶部展示：库位名称、库位容量、现有库存、剩余容量
- 下方表格：展示当前库位关联的「入库计划」记录（字段见 §3）
- 表格操作：编辑 / 删除（说明见 §4）

---

## 2. 需要后端配合的接口与字段

### 2.1 库位分页列表（已有接口扩展字段）

| 项 | 值 |
|---|---|
| Method | `GET` |
| URL | `/wms/inventory/location/list` |

**新增返回字段（每行）**

| 字段 | 类型 | 说明 |
|---|---|---|
| `currentStock` | number | 现有库存（板数/占用数，口径需固定） |
| `remainingCapacity` | number | 剩余容量（建议后端计算） |

前端类型：`Api.Wms.WarehouseLocation.currentStock` / `remainingCapacity`。

### 2.2 库位详情（已有接口扩展字段）

| 项 | 值 |
|---|---|
| Method | `GET` |
| URL | `/wms/inventory/location/{id}` |

**新增返回字段**

同 §2.1（用于抽屉顶部展示）。

### 2.3 库位详情抽屉明细（新增接口）

| 项 | 值 |
|---|---|
| Method | `GET` |
| URL | `/wms/inventory/location/{id}/inventory-detail` |
| Query | `pageNum`、`pageSize` |

**响应 data（推荐结构）**

```json
{
  "total": 2,
  "rows": [
    {
      "inboundPlanId": 1001,
      "orderId": 2001,
      "coNo": "CO123",
      "systemPreLocation": "{\"version\":1,\"allocations\":[{\"locationCode\":\"A-01\",\"palletCount\":2}]}",
      "palletCount": 2,
      "totalPalletCount": 3,
      "systemSoNo": "SO001",
      "shipmentCode": "SHIP001",
      "platform": "AMZ",
      "warehouseCode": "WH1",
      "addressType": "HOME",
      "deliveryMethod": "fedex",
      "deliveryMethodLabel": null,
      "hold": false,
      "totalPieces": 10,
      "weight": 12.3,
      "volumeCbm": 1.2,
      "remark": "xxx",
      "createTime": "2026-04-17 10:00:00"
    }
  ],
  "location": {
    "id": 1,
    "zoneCode": "A",
    "locationCode": "A-01",
    "capacity": 10,
    "currentStock": 6,
    "remainingCapacity": 4
  }
}
```

其中 `location` 为可选（前端会优先使用 `/wms/inventory/location/{id}` 的结果，但若该接口返回更准的实时库存，也可以在此返回并覆盖）。

---

## 3. 明细表字段（前端展示列）

表格列如下（字段名与前端类型 `Api.Wms.WarehouseLocationInventoryDetailLine` 一致）：

1. **系统预库位**：`systemPreLocation`（JSON 字符串，展示规则与拆柜入库计划一致：前两行库位+板数，超过 2 个第三行显示 `....`）
2. **板数**：`palletCount`（当前库位对应板数）
3. **柜号**：`coNo`
4. **订单号**：`systemSoNo`
5. **货件编码**：`shipmentCode`
6. **平台**：`platform`
7. **仓库代码**：`warehouseCode`
8. **地址类型**：`addressType`
9. **派送方式**：`deliveryMethod`（字典 `delivery_type`，可选返回 `deliveryMethodLabel` 做兜底回显）
10. **HOLD**：`hold`
11. **总件数**：`totalPieces`
12. **重量**：`weight`
13. **体积**：`volumeCbm`
14. **备注**：`remark`
15. **总打板数量**：`totalPalletCount`（该订单/入库计划行系统预库位合计板数）
16. **创建时间**：`createTime`（请在接口层固定口径：建议为入库计划行创建时间）
17. **操作**：前端提供编辑/删除按钮

---

## 4. 编辑 / 删除（当前前端交互与后端职责）

### 4.1 编辑

前端点击「编辑」会打开 **系统预库位编辑弹窗**（维护整条入库计划行的所有库位分配与板数），保存时调用现有接口：

- `PUT /wms/devanning-order/inbound-plan/system-pre-location`

后端只需保证该接口可用，并且库位详情明细查询能实时反映更新后的分配。

### 4.2 删除

前端点击「删除」会从该入库计划行的 `systemPreLocation.allocations` 中移除当前库位编码对应的分配（若存在多条同库位编码会一并移除），然后同样调用：

- `PUT /wms/devanning-order/inbound-plan/system-pre-location`

> 建议后端在写库时对 allocations 做去重（同库位最多一条），避免出现“同库位重复分配”导致删除影响过大。

---

## 5. 口径与性能建议

1. **currentStock / remainingCapacity 口径**：建议以「预库位分配板数合计」为准；若你们还有真实库存表，请注明口径（真实库存 vs 预分配占用）。
2. **性能**：`/inventory-detail` 建议直接按库位编码建立索引/反查（例如解析 JSON 后落表、或写入冗余映射表），避免每次列表都全表解析 JSON。
3. **一致性**：编辑/删除后，列表与抽屉顶部库存值建议一致（同一口径）。

---

## 6. 后端开发任务清单（交付给后端）

请按项实现或确认，便于与前端联调。

| # | 类型 | 内容 |
|---|------|------|
| 1 | **扩展字段** | `GET /wms/inventory/location/list` 每行增加 `currentStock`、`remainingCapacity`（推荐剩余容量服务端计算）。 |
| 2 | **扩展字段** | `GET /wms/inventory/location/{id}` 增加同上字段（抽屉顶部汇总）。 |
| 3 | **新增接口** | `GET /wms/inventory/location/{id}/inventory-detail?pageNum=&pageSize=`，返回 §2.3 结构（含 `rows`、`total`；可选 `location` 汇总）。 |
| 4 | **查询** | 库位列表支持 `zoneCode` 为空 = 全部；非空 = 按库区名称过滤（与库位 `zoneCode` 存值一致）。 |
| 5 | **排序** | 库位列表支持 `orderByColumn=locationCode`（或 `location_code`）+ `isAsc=asc`。 |
| 6 | **入库计划** | 实现或确认 `PUT /wms/devanning-order/inbound-plan/system-pre-location`（见 [wms-devanning-order-prelocation-api.md](./wms-devanning-order-prelocation-api.md)），供抽屉内编辑/删除后写回 `systemPreLocation` JSON。 |
| 7 | **可选** | 导出拆柜单时写预库位与列表库存口径一致（若与 §1、§5 同一套占用逻辑）。 |

---

## 7. 前端参考实现

- 列表页：`src/views/wms/inventory/location/index.vue`
- 详情抽屉：`src/views/wms/inventory/location/modules/location-detail-drawer.vue`
- 库位 API：`src/service/api/wms/location.ts`
- 类型：`src/typings/api/wms.api.d.ts`

