# 库存数据看板 · 后端对接说明

**同页**另有 **出库数据看板**，接口见 `docs/wms-outstock-data-dashboard-api.md`。

前端页面：`/wms/order/inventory-data-dashboard`  
源码：`src/views/wms/order/inventory-data-dashboard/index.vue`  
API 封装：`src/service/api/wms/inventory-data.ts` → `fetchGetInventoryDashboardByWarehouse`

## 1. 业务说明

看板需要：**按「仓库代码」`warehouseCode` 聚合**，将同一仓库代码下所有明细行的 **`palletCount`（打板数）相加**，得到合计板数；再按合计板数 **从高到低** 排序，只返回前 **N** 个仓库（`topN`，前端默认 30，最大 500）。

> **仓库代码**与库存明细、入库计划中的 `warehouseCode` 口径一致；**打板数**与库存数据列表中的 `palletCount` 一致。

---

## 2. 主接口（前端当前使用）

### 2.1 Method & URL

| 项 | 说明 |
| --- | --- |
| Method | `GET` |
| URL | `/wms/inventory/location/inventory-detail/dashboard/by-warehouse` |

### 2.2 Query 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `topN` | int | **建议必填** | 返回合计板数最高的前 **N** 个仓库代码；前端传 **1～500**，默认 **30** |
| `orderTimeBegin` | string | 否 | 与库存数据列表一致，建议 `yyyy-MM-dd HH:mm:ss` |
| `orderTimeEnd` | string | 否 | 同上 |
| `devanningCompleteBegin` | string | 否 | 同上 |
| `devanningCompleteEnd` | string | 否 | 同上 |
| `systemSoNo` | string | 否 | 订单号 |
| `coNo` | string | 否 | 柜号 |
| `shipmentCode` | string | 否 | 货件编码 |
| `zoneCode` | string | 否 | 库区 |
| `locationCode` | string | 否 | 库位 |
| `deliveryAddress` | string | 否 | Delivery Address（模糊） |
| `platform` | string | 否 | 平台 |
| `deliveryMethod` | string | 否 | 派送方式 |
| `params[…]` | — | 否 | 与 RuoYi `BaseEntity.params` 一致时，可沿用列表扩展参数 |

看板页 **当前** 仅传 `topN`；后续可在页面上增加与「库存数据」相同的筛选项，并将上述参数一并拼到 Query。

### 2.3 Response（`data` 段）

与项目统一 `R` 包装兼容；前端会解析 **`data` 根**或 **`data.data` 嵌套** 中带 **`rows`** 的对象：

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
| `rows` | 数组；每项表示一个仓库代码及其板数合计 |
| `rows[].warehouseCode` | 仓库代码；无业务代码时可返 `""` / `null`，前端展示为「（空仓库代码）」 |
| `rows[].totalPalletCount` | 该 `warehouseCode` 下对明细 **`sum(palletCount)`** |
| `totalWarehouses` | **可选**；满足筛选条件的 **不同仓库代码个数**（用于页脚统计）；若缺省，前端用 `rows.length` 兜底 |

**排序与截断：** `rows` 必须已按 `totalPalletCount` **降序**，且 **条数 ≤ `topN`**。

### 2.4 鉴权

建议与库存数据列表一致（例如 `@SaCheckPermission` 与「库存数据」菜单 `perms` 对齐）。

---

## 3. 列表接口（仅作参考，看板不再全量拉明细）

若联调阶段暂无 §2 聚合接口，历史上曾用 **`GET /wms/inventory/location/inventory-detail/list`** 分页拉全量再在前端聚合——**当前前端已改为仅调用 §2**，不再使用该方式。列表字段说明仍以 `docs/wms-inventory-data-api.md` §2 为准。

---

## 4. 性能建议

- 聚合应在 **SQL `GROUP BY warehouseCode`**（或等价）完成，避免先扫全表明细再在内存聚合。
- `warehouseCode` 建议有索引或规范化存储，空值合并规则与列表/业务约定一致。
