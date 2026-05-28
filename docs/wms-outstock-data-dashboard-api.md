# 出库数据看板 · 后端对接说明

与 **库存数据看板** 同页展示，见：  
`src/views/wms/order/inventory-data-dashboard/index.vue`  
本接口仅服务其中 **「出库数据看板」** 柱状图。

前端封装：`src/service/api/wms/outstock-data.ts` → `fetchGetOutstockDashboardByWarehouse`  
类型：`Api.Wms.OutstockDashboardByWarehouseParams` / `OutstockDashboardByWarehouseResult`（**响应结构与库存看板一致**，见下）

---

## 1. 业务说明

按 **`warehouseCode`（仓库代码）** 对出库明细聚合：对每个仓库代码，将该仓库下所有出库记录的 **`palletCount`（打板数）求和**，得到 `totalPalletCount`；按合计 **从高到低** 排序，仅返回前 **`topN`** 个仓库（前端默认 30，最大 500）。

> **仓库代码**口径须与业务主数据/库存侧一致，以便与「库存数据看板」可对照。若出库表无独立 `warehouse_code` 列，需由后端从入库计划/库位/主单等 **解析或关联** 得到分组键，并与列表行展示口径统一。

---

## 2. Method & URL

| 项 | 说明 |
| --- | --- |
| Method | `GET` |
| URL | `/wms/order/outstock-data/dashboard/by-warehouse` |

---

## 3. Query 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `topN` | int | **建议必填** | 返回合计板数最高的前 **N** 个仓库；前端传 **1～500**，默认 **30** |
| `createTimeBegin` | string | 否（前端默认会传） | 出库记录创建时间起（含），`yyyy-MM-dd HH:mm:ss`，与列表 §1 一致；**WHERE 命中 `create_time` 索引** |
| `createTimeEnd` | string | 否（前端默认会传） | 创建时间止（含） |
| `outstockBatchNo` | string | 否 | 出库批次 |
| `coNo` | string | 否 | 柜号 |
| `systemSoNo` | string | 否 | 订单号 |
| `shipmentCode` | string | 否 | 货件编码 |
| `loadingSequenceNo` | string | 否 | 装车序号 |
| `deliveryAddress` | string | 否 | Delivery Address |
| `platform` | string | 否 | 平台 |
| `deliveryMethod` | string | 否 | 派送方式 |
| `zoneCode` | string | 否 | 库区 |
| `locationCode` | string | 否 | 库位 |
| `params[…]` | — | 否 | RuoYi `BaseEntity.params` 扩展 |

看板页 **当前** 必传 **`topN`**，并传 **创建时间** `createTimeBegin` / `createTimeEnd`（与列表 §1 一致，出库记录 `create_time` 区间）。

- **前端默认**：`createTimeBegin` = **当天往前 7 天**的 `00:00:00`，`createTimeEnd` = **当天** `23:59:59`（与出库数据列表、`getDefaultOutstockDashboardCreateTimeRange()` 一致）。用户可改日期或清空；**清空** 时前端不传时间参数，由后端决定是否全表统计（需防慢查询，见主文档 §1.1）。

其它筛选与 `docs/wms-outstock-order-api.md` §1 列表 Query **对齐**，便于后续在看板工具栏增加与出库列表相同的条件。

---

## 4. Response（`data`）

与 **库存看板** 相同（便于前端共用解析逻辑），例如：

```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "rows": [
      { "warehouseCode": "LA-WH-01", "totalPalletCount": 120 },
      { "warehouseCode": "NYC-02", "totalPalletCount": 88 }
    ],
    "totalWarehouses": 95
  }
}
```

| 字段 | 说明 |
| --- | --- |
| `rows[].warehouseCode` | 仓库代码 |
| `rows[].totalPalletCount` | 该仓库代码下出库 **`sum(palletCount)`** |
| `totalWarehouses` | **可选**；满足筛选的不同仓库代码个数 |

**排序与截断：** `rows` 须已按 `totalPalletCount` **降序**，且 **条数 ≤ topN**。

---

## 5. 鉴权与超时

- 鉴权建议与 **`GET /wms/order/outstock-data/list`** 一致（出库数据菜单权限）。
- 前端对该请求使用与列表相同的 **较长超时**（见 `getWmsOutstockDataListTimeoutMs()`）；后端 JDBC / 网关超时建议 **≥ 前端**。

---

## 6. 性能建议

- 使用 **`GROUP BY warehouse_code`**（或等价）在数据库侧聚合，避免先扫全表再在内存汇总。
- 对出库表 `create_time`、`warehouse_code`（或关联键）建立合适索引以支撑筛选与分组。
