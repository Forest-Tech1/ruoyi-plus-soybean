# WMS 订单出库 — 后端对接说明

前端页面与路由：

| 页面 | 路由 path | 源码 |
|---|---|---|
| 出库数据 | `/wms/order/outstock-data` | `src/views/wms/order/outstock-data/index.vue` |
| 库存与出库看板（含出库柱状图） | `/wms/order/inventory-data-dashboard` | `src/views/wms/order/inventory-data-dashboard/index.vue` — 出库聚合接口见 **`docs/wms-outstock-data-dashboard-api.md`** |
| 出库异常数据 | `/wms/order/outstock-exception` | `src/views/wms/order/outstock-exception/index.vue` |

前端请求封装：`src/service/api/wms/outstock-data.ts`、`src/service/api/wms/outstock-exception.ts`  
类型定义：`src/typings/api/wms.api.d.ts`（`OutstockDataLine`、`OutstockExceptionBatchLine`、`OutstockExceptionDetailLine` 等）

响应需符合项目统一约定：HTTP 成功时外层 `code` 与 `.env` 中 `VITE_SERVICE_SUCCESS_CODE` 一致；分页列表与若依/RuoYi-Plus 常见结构一致（`total` + `rows`）。

### 装车序号 `loadingSequenceNo`（后端约定摘要）

- **字段名**：`loadingSequenceNo`（与前端类型、Query 参数名一致）。
- **出现位置**：出库数据列表行、出库异常批次列表行、出库异常明细行；§1 / §3 的列表 Query 支持按装车序号及 §3 的柜号、订单号等筛选（见 §3 Query 表）。
- **类型**：建议统一为 **string**（若为数字序列化亦需与列表/明细一致）；无值时返回 `null` 或省略字段均可，前端空值展示为「—」。
- **口径**：装车序号与出库计划、装车单或 PDF 行上序号的对应关系由业务与数据落库决定；异常批次列表若同一批次唯一装车序号，可填该值便于与出库数据对照。

---

## 1. 出库数据 — 分页列表

### Method & URL

- Method: `GET`
- URL: `/wms/order/outstock-data/list`

### Query 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `pageNum` | number | 页码 |
| `pageSize` | number | 每页条数 |
| `createTimeBegin` | string | **可选**。出库记录创建时间起始（含），格式 `yyyy-MM-dd HH:mm:ss`。前端默认：**当天往前 7 天**的 `00:00:00`（与 `createTimeEnd` 组成一周窗口），限制首屏数据量。 |
| `createTimeEnd` | string | **可选**。创建时间结束（含），格式同上。前端默认传**当日** `23:59:59`。用户清空筛选时可不传；**后端应对无时间条件时的全表查询做窗口/超时防护**（见下文 §1.1）。 |
| `outstockBatchNo` | string | 出库批次（可选，模糊或精确以后端为准） |
| `coNo` | string | 柜号 |
| `systemSoNo` | string | 订单号 |
| `shipmentCode` | string | 货件编码 |
| `deliveryAddress` | string | Delivery Address |
| `platform` | string | 平台 |
| `deliveryMethod` | string | 派送方式（字典建议与现有 `delivery_type` 一致，便于前端字典回显） |
| `zoneCode` | string | 库区 |
| `locationCode` | string | 库位 |
| `loadingSequenceNo` | string | **装车序号**筛选（可选，模糊或精确以后端为准） |
| `orderByColumn` | string | 排序字段（建议白名单，如 `createTime`、`id`） |
| `isAsc` | string | `asc` / `desc` |

### §1.1 后端建议（时间窗与性能）

- **列表查询**：对 `createTimeBegin` / `createTimeEnd` 做 **WHERE 命中索引**（出库明细表 `create_time` 或等价字段）；未传时间条件时若仍允许全表分页，建议：**放宽服务端 Statement/query 超时**、**限制单次扫描行数或强制默认时间窗**，避免与前端已加长的 HTTP 超时仍不匹配。
- **与前端对齐**：前端 `GET /wms/order/outstock-data/list` 默认超时已提高至 **120s**（可通过环境变量再调）；后端 JDBC / MyBatis / 网关超时建议 **≥ 前端超时**，或对大数据量查询走异步/导出接口。

### Response `data`（分页）

与项目通用分页一致，示例：

```json
{
  "total": 100,
  "rows": [
    {
      "id": "1928374650987654321",
      "outstockBatchNo": "OB-20260420-001",
      "loadingSequenceNo": "LS-001",
      "coNo": "CO123",
      "systemSoNo": "SO001",
      "shipmentCode": "SHIP001",
      "deliveryAddress": "123 Main St",
      "platform": "AMZ",
      "deliveryMethod": "fedex",
      "palletCount": 2,
      "zoneCode": "Zone A",
      "locationCode": "A-01",
      "weight": 12.3,
      "volumeCbm": 0.18,
      "totalPieces": 10,
      "createTime": "2026-05-06 14:30:00"
    }
  ]
}
```

### 行字段说明

| 字段 | 说明 |
|---|---|
| `id` | **必填**。出库记录主键；用于「取消出库」删除接口路径参数。前端类型为 `CommonType.IdType`（字符串或数字均可，与现有模块一致）。 |
| `createTime` | **建议返回**。出库记录创建时间，供列表「创建时间」列与筛选口径一致；格式与 Query 中时间字符串一致即可。 |
| `outstockBatchNo` | 出库批次号（列表「出库批次」列） |
| `loadingSequenceNo` | **装车序号**（字符串或数字序列化均可；与出库计划/装车单口径一致） |
| `coNo` | 柜号 |
| `systemSoNo` | 订单号 |
| `shipmentCode` | 货件编码 |
| `deliveryAddress` | Delivery Address |
| `platform` | 平台 |
| `deliveryMethod` | 派送方式字典值 |
| `palletCount` | 板数 |
| `zoneCode` | 库区 |
| `locationCode` | 库位 |
| `weight` | 重量 |
| `volumeCbm` | 体积（CBM） |
| `totalPieces` | 总件数 |

---

## 2. 出库数据 — 取消出库（删除）

### Method & URL

- Method: `DELETE`
- URL: `/wms/order/outstock-data/{id}`

路径参数 `id` 与列表行中的 `id` 一致。

### 业务约定（需后端实现）

1. 删除（或作废）该条出库数据记录。
2. 库存侧：对应明细/数量回到「库存数据」口径（与 `/wms/order/inventory-data`、`/wms/inventory/location/inventory-detail/list` 等业务一致）。
3. 入库计划：与该出库关联的入库计划行恢复为 **未出库**（具体字段/状态枚举以后端入库计划模型为准）。

### Response

`data` 可为 `true` 或与项目一致的布尔/空对象约定；失败返回业务错误码与 `msg`。

### 权限建议（与前端按钮一致）

前端操作列仅在具备权限 `wms:outstockData:cancel` 时展示（列表接口建议 `wms:outstockData:list`）。

---

## 3. 出库异常 — 按出库批次分页列表

### Method & URL

- Method: `GET`
- URL: `/wms/order/outstock-exception/batch/list`

### Query 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `pageNum` | number | 页码 |
| `pageSize` | number | 每页条数 |
| `outstockBatchNo` | string | 出库批次筛选（可选） |
| `loadingSequenceNo` | string | **装车序号**筛选（可选） |
| `coNo` | string | **柜号**筛选（可选；通常匹配该批次下异常明细中的柜号，存在即命中批次） |
| `systemSoNo` | string | **订单号**筛选（可选；与明细 `systemSoNo` / Job NO. 口径一致） |
| `orderByColumn` | string | 排序字段（建议白名单） |
| `isAsc` | string | `asc` / `desc` |

### Response `data`（分页）

```json
{
  "total": 5,
  "rows": [
    {
      "outstockBatchId": "1928374650987654321",
      "outstockBatchNo": "OB-20260420-001",
      "loadingSequenceNo": "LS-001",
      "exceptionCount": 3,
      "lastExceptionTime": "2026-04-20 18:30:00",
      "createTime": "2026-04-20 10:00:00"
    }
  ]
}
```

### 行字段说明

| 字段 | 说明 |
|---|---|
| `outstockBatchId` | **必填**。出库批次主键；用于下一节「明细」接口路径参数，需与 `/details` 中 `{outstockBatchId}` 对应。 |
| `outstockBatchNo` | 出库批次号（展示） |
| `loadingSequenceNo` | **装车序号**（与出库数据列表字段一致，便于对照） |
| `exceptionCount` | 该批次下异常条数（聚合统计） |
| `lastExceptionTime` | 最近一次异常时间（可选） |
| `createTime` | 批次记录创建时间（可选） |

列表维度：**已出库批次**（仅包含有异常的批次，或包含全部批次由产品决定；前端表格均按返回行展示）。

---

## 4. 出库异常 — 指定批次明细列表

### Method & URL

- Method: `GET`
- URL: `/wms/order/outstock-exception/batch/{outstockBatchId}/details`

路径参数 `outstockBatchId` 与上一节列表中的 `outstockBatchId` 一致。

### Response `data`

主约定：**直接返回明细数组**（放入统一响应的 `data` 字段）。

```json
[
  {
    "id": "30001",
    "outstockBatchNo": "OB-20260420-001",
    "systemSoNo": "SO001",
    "coNo": "CO123",
    "loadingSequenceNo": "LS-001",
    "shipmentCode": "FBA...",
    "exceptionType": "SHORT_PICK",
    "exceptionMessage": "件数与单据不符",
    "createTime": "2026-04-20 18:30:00"
  }
]
```

### 字段说明

| 字段 | 说明 |
|---|---|
| `id` | 明细主键（可选） |
| `outstockBatchNo` | 出库批次号（可选，便于审计） |
| `systemSoNo` | 订单号（前端「订单号」列） |
| `coNo` | 柜号 |
| `loadingSequenceNo` | **装车序号**（与主单/行上装车序一致时展示；可空） |
| `shipmentCode` | Fbacode 展示值；接口字段名仍为 `shipmentCode`，前端列标题为「Fbacode」 |
| `exceptionType` | 异常类型（编码或枚举名，前端原样展示） |
| `exceptionMessage` | 异常说明（主字段） |
| `message` / `remark` | 兼容备用说明字段（可选） |
| `createTime` | 异常记录时间 |

### 后端表字段映射（出库异常明细）

列表接口返回的 JSON 字段名仍为 `systemSoNo`、`shipmentCode`，由 Mapper 从异常表取值，例如：

| 接口字段（前端列） | 典型来源列（示例） | 说明 |
|---|---|---|
| `systemSoNo` | `wms_inventory_outbound_exception.job_no_raw` | PDF 中 Job NO. 原文 |
| `shipmentCode` | `wms_inventory_outbound_exception.fbacode_raw` | PDF Fbacode 原文；前端列名为「Fbacode」，不再展示派送地址列 |

写入时在 `insertCoNoNotFoundException`、`MATCH_FAILED` 等分支已对 `job_no_raw`、`fbacode_raw` 赋值；若明细中某一列为空，多为当时解析结果为空，可对照该批次 `raw_pdf_row_text` 排查。

**兼容说明**：若后端更愿意返回 `{ "rows": [ ... ] }`，前端抽屉内已对 `rows` / `list` / `items` 做了兼容解析；推荐优先使用 **数组直出**，与现有 `request` 转义逻辑一致。

---

## 5. 权限与菜单（实施清单）

| 菜单名建议 | path | 权限标识建议 |
|---|---|---|
| 出库数据 | `/wms/order/outstock-data` | `wms:outstockData:list`，取消出库 `wms:outstockData:cancel` |
| 出库异常数据 | `/wms/order/outstock-exception` | `wms:outstockException:list`（若需细粒度） |

菜单挂在「订单管理」下，组件路径与动态路由配置与现有 WMS 订单子模块相同。

---

## 6. 与库存数据、出库上传的关系

- **库存数据**：`docs/wms-inventory-data-api.md` — 当前在库明细查询与编辑。
- **出库上传 PDF**：同一文档中「出库（上传 PDF）」— 生成出库业务后，出库结果与批次号生成规则由后端定义；本文件的「出库数据」列表应对应你们持久化后的出库行/明细。

若批次号在「上传出库」与「出库数据列表」之间需严格一致，请在入库/出库流水设计中统一 `outstockBatchNo` / `outstockBatchId` 的生成与关联关系。
