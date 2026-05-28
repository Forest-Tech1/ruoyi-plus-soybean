# 库存数据（当前库存明细）— 后端对接说明

前端页面：`/wms/order/inventory-data`  
源码：`src/views/wms/order/inventory-data/index.vue`

## 1. 需求概述

提供一个“当前库存详细数据”查询页：

- 顶部搜索：下单日期、拆柜完成日期、订单号、柜号、货件编码、库区、库位、Delivery Address、平台、派送方式
- 下方表格列：下单日期、拆柜完成日期、订单号、柜号、货件编码、库区、库位、**打板数**、Delivery Address、平台、派送方式、重量、体积、件数、备注、操作（编辑、**手动出库**）
- 分页

**取值逻辑**：与「库位管理 → 库位详情抽屉」里的明细表一致（同一业务口径/同一来源数据），只是从“单库位维度”扩展为“全库维度可搜索分页”。

---

## 2. 分页列表接口（需新增）

### Method & URL

- Method: `GET`
- URL: `/wms/inventory/location/inventory-detail/list`

> 说明：接口名可按你们后端规范调整；关键是返回字段与查询参数保持一致。

### Query 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `pageNum` | number | 页码 |
| `pageSize` | number | 每页条数 |
| `orderTimeBegin` | string | 下单日期开始（建议 `yyyy-MM-dd HH:mm:ss`） |
| `orderTimeEnd` | string | 下单日期结束（建议 `yyyy-MM-dd HH:mm:ss`） |
| `devanningCompleteBegin` | string | 拆柜完成日期开始（建议 `yyyy-MM-dd HH:mm:ss`） |
| `devanningCompleteEnd` | string | 拆柜完成日期结束（建议 `yyyy-MM-dd HH:mm:ss`） |
| `systemSoNo` | string | 订单号（与库位详情表字段 `systemSoNo` 一致） |
| `coNo` | string | 柜号 |
| `shipmentCode` | string | 货件编码 |
| `zoneCode` | string | 库区（与库位 `zoneCode` 一致，一般为库区名称） |
| `locationCode` | string | 库位编码 |
| `deliveryAddress` | string | Delivery Address（模糊） |
| `platform` | string | 平台 |
| `deliveryMethod` | string | 派送方式（字典同 `wms_delivery_type`，前端用字典组件回显） |
| `orderByColumn` | string | 可选排序字段（建议白名单） |
| `isAsc` | string | `asc` / `desc` |

### Response data（分页）

与项目通用分页结构一致；其中 **`total` 必须为符合条件记录的总条数（全库统计）**，不得等于当前页 `rows.length`，否则前端分页将无法显示正确的「共 xxx 条」。

若采用「外层 R 类 + 内层 `data` 放 `rows`」的包装，请保证 **外层 `total` 为全表条数**；前端请求层会将内外层 `total` / `totalCount` 合并取较大值，避免只解析内层时出现「总数=当前页条数」而无法翻页。

```json
{
  "total": 2,
  "rows": [
    {
      "orderTime": "2026-04-20 10:00:00",
      "devanningCompleteTime": "2026-04-21 16:30:00",
      "systemSoNo": "SO001",
      "coNo": "CO123",
      "shipmentCode": "SHIP001",
      "zoneCode": "Zone A",
      "locationCode": "A-01",
      "inventoryDetailId": 9001,
      "palletCount": 2,
      "deliveryAddress": "123 Main St, ...",
      "platform": "AMZ",
      "deliveryMethod": "fedex",
      "weight": 12.3,
      "volumeCbm": 0.18,
      "totalPieces": 10,
      "remark": "..."
    }
  ]
}
```

### 字段口径说明（与库位详情表保持一致）

本接口建议直接复用「库位详情抽屉」明细行的字段口径（见 `docs/wms-location-inventory-detail-api.md` 中 `WarehouseLocationInventoryDetailLine`），并补充：

| 字段 | 说明 |
|---|---|
| `zoneCode` | 库区名称（用于列表展示/筛选） |
| `locationCode` | 库位编码（用于列表展示/筛选） |
| `inventoryDetailId` | 明细记录 id（用于编辑更新） |
| `palletCount` | 打板数（可编辑） |
| `deliveryAddress` | Delivery Address（展示用完整字符串） |
| `orderTime` | 下单日期（用于列表展示；筛选口径与拆柜订单一致） |
| `devanningCompleteTime` | 拆柜完成日期（用于列表展示；筛选口径与拆柜订单一致） |

---

## 2.1 编辑接口（需新增）

### Method & URL

- Method: `PUT`
- URL: `/wms/inventory/location/inventory-detail/{inventoryDetailId}`

### Body

仅允许更新以下字段（其余字段由后端口径计算/来源数据决定）：

```json
{
  "inventoryDetailId": 9001,
  "zoneCode": "Zone A",
  "locationCode": "A-01",
  "palletCount": 2,
  "deliveryAddress": "123 Main St, ...",
  "platform": "AMZ",
  "deliveryMethod": "fedex"
}
```

- **`locationCode` / `zoneCode`（建议支持）**：库存数据列表支持从平面图迁库时写入；`zoneCode` 可与库位主数据一致，便于列表筛选与展示。
- **与入库计划「系统预库位」一致**：前端在迁库或改板数成功后，会额外调用 `PUT /wms/devanning-order/inbound-plan/system-pre-location` 合并更新该行入库计划的 `systemPreLocation` JSON（与拆柜订单入库计划页逻辑一致）。后端若选择在 **本条库存明细 PUT 内** 原子同步预库位与占用，需与前端约定是否仍保留独立接口调用，避免双重写入。

### Response

`true/false`（或统一响应结构）

---

## 2.2 出库（上传 PDF）接口（需新增）

### Method & URL

- Method: `POST`
- URL: `/wms/order/inventory-data/outstock`

### Content-Type

`multipart/form-data`

### FormData

| 字段 | 类型 | 说明 |
|---|---|---|
| `file` | File | PDF 文件 |

### 约束建议

- 仅允许 `application/pdf`（或 `.pdf`）
- 单文件上传（max=1）

### Response `data`（建议）

前端需在提交成功后展示出库明细，建议 `data` 返回结构化结果（兼容仅返回 `true` 表示成功无明细）。

**形式一（推荐）：对象**

```json
{
  "summary": "共处理 3 条，成功 2 条，失败 1 条",
  "rows": [
    {
      "systemSoNo": "SO001",
      "coNo": "CO123",
      "shipmentCode": "SHIP001",
      "zoneCode": "Zone A",
      "locationCode": "A-01",
      "outstockStatus": "success",
      "message": "已出库",
      "palletCount": 2
    }
  ]
}
```

说明：

- `summary`：可选，汇总文案。
- `rows`：明细行；若后端使用 `items` / `list` / `details` 命名，需与前端约定统一（当前前端优先读 `rows`，并可扩展兼容别名）。

**形式二**：`data` 为明细数组（无汇总）。

**形式三**：`data` 为 `true`，表示受理成功；前端仅提示成功，无表格明细。

字段别名兼容（单行）：`status` 可作为 `outstockStatus`；`remark` / `errorMsg` 可作为说明列。

---

## 2.3 手动出库（按明细行，需新增）

用于库存数据列表「操作」中的 **手动出库**：不依赖 PDF，针对 **库存明细 id** 发起 **整行全部板数** 出库（前端自动带当前行的 `palletCount`，用户不可改数量）。

### Method & URL

- Method: `POST`
- URL: `/wms/order/inventory-data/outstock/manual`

### Content-Type

`application/json`

### Body

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `inventoryDetailId` | number | 是 | 与列表接口返回的 `inventoryDetailId` 一致（同「编辑库存数据」PUT 路径中的 id） |
| `palletCount` | number | 建议必填 | 当前前端为 **整行出库**：始终传该行列表上的 **全部打板数**（与 `GET .../inventory-detail/list` 返回的 `palletCount` 一致），用户不可改数量。后端可仅用其做校验，或仅按 `inventoryDetailId` 按行清空库存，但须与列表展示口径一致。 |

示例：

```json
{
  "inventoryDetailId": 9001,
  "palletCount": 2
}
```

### 业务要求（建议）

1. **与 PDF 出库对齐**：成功后的库存扣减、出库单/出库数据写入、异常记录等，应与 `POST /wms/order/inventory-data/outstock`（PDF）**同一套或等价流程**，避免两套口径。
2. **整行出库**：本接口语义为 **一次性出清该明细行在列表中的全部板数**；若 `palletCount` 与库内实际占用不一致，以后端校验为准并返回明确错误。
3. **幂等与并发**：同一明细短时间重复提交，需按业务决定是否拒绝或合并（避免重复出库）。

### Response `data`

与 **§2.2 出库（上传 PDF）** 的 `data` 约定一致（`true` / 对象含 `summary`+`rows` / 数组等），便于前端复用同一套结果展示逻辑。

若业务失败但 HTTP 仍为 200，可在 `rows[0].outstockStatus` 中返回 `failed`（或等价），并在 `message` / `remark` 中写明原因。

### 权限（建议）

单独权限字符，例如：`wms:inventory-data:manualOutstock`（与列表/编辑区分）；若暂不单开，可与编辑或 PDF 出库共用权限，由后端菜单配置决定。

### 后端需要做的事（清单，可直接转发）

1. **新增接口**  
   - `POST /wms/order/inventory-data/outstock/manual`  
   - `Content-Type: application/json`  
   - Body：`{ "inventoryDetailId": number, "palletCount": number }`（含义见上表；前端整行出库时 `palletCount` 与列表行 `palletCount` 一致）。

2. **入参校验**  
   - `inventoryDetailId` 非空、记录存在，且与 `GET /wms/inventory/location/inventory-detail/list`、`PUT /wms/inventory/location/inventory-detail/{id}` 为同一套「库存明细」实体。  
   - 该行当前可出库板数 **> 0**（为 0 时返回明确业务错误，服务端兜底）。  
   - **校验 `palletCount`**：须为正整数，且与库内该明细 **实际可出库板数** 一致（或与你们列表聚合口径一致）；不一致则拒绝并返回可读 `msg`。

3. **业务实现（核心）**  
   - **复用**现有 `POST /wms/order/inventory-data/outstock`（PDF）背后的出库/扣库存/写出库数据/写异常等 **Service 公共逻辑**，避免两套规则分叉。  
   - 语义：**一次性出清该明细行对应库存**（整行），不做部分出库。

4. **返回值**  
   - HTTP 成功时，`data` 结构与 **§2.2** 一致（`true` / `{ summary, rows }` / 数组等）。  
   - 若业务失败仍走 HTTP 200，至少在 `rows[0]` 中给出 `outstockStatus`（如 `failed`）与 `message` / `remark`。

5. **权限与菜单**  
   - 在 RuoYi 中增加权限标识（建议 `wms:inventory-data:manualOutstock`），并挂到「库存数据」相关菜单；若暂合并权限，需在配置里与前端约定按钮权限字符。

6. **幂等与并发**  
   - 同一 `inventoryDetailId` 短时间重复提交：明确策略（拒绝「已出库」、幂等返回成功、或加锁防重），避免重复扣减。

7. **可观测性**  
   - 关键步骤打日志（操作人、明细 id、出库板数、若有出库批次号一并记录）；必要时记操作日志表，便于与出库数据、异常表对账。

## 3. 权限

建议沿用库位明细的查询权限（例如 `wms:location:list` 或单独新增 `wms:inventory-data:list`，以你们后端为准）。

## 4. 相关文档

- 出库数据列表、取消出库、出库异常批次与明细：`docs/wms-outstock-order-api.md`

