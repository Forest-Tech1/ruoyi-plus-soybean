# 库存数据 —「导入现有库存」后端 API 说明

前端页面：`/wms/order/inventory-data`（库存数据）  
前端源码：`src/views/wms/order/inventory-data/`、`src/service/api/wms/inventory-data.ts`  
本文档供后端实现接口与业务规则，与 `docs/wms-inventory-data-api.md` 中的列表/编辑/出库接口并列。

---

## 1. 业务目标

用户通过 Excel 将「线下/表格里已有」的库存信息导入系统，与当前**拆柜海柜（订单）**、**入库计划**、**库存明细**对齐：

1. **幂等 / 去重**：若系统中**已存在**同一组合 **海柜（柜号 `coNo`）+ 匹配到的订单（`systemSoNo`，由表格 Job No. 模糊匹配得到）+ FBA Code（与 `deliveryAddress` / Delivery Address 同一业务含义）**，则**本行不再写入**（跳过，不更新已有数据）。
2. **新建**：若不存在上述组合，则：
   - 创建（或关联）对应的**海柜/拆柜订单**；
   - **新增入库计划**（或按你们现有「拆柜订单 + 入库计划行」模型落库）。
3. **Job No. 与订单号**：表格中的 **Job No.** 在库存列表里可能对应**已聚合展示的一条订单号**（`systemSoNo` 可能由多条记录合并展示）。因此表格值与系统订单号需做**模糊匹配**（见第 4 节），不能只做精确相等。
4. **FBA Code**：与前端库存数据列 **Delivery Address** 同义，后端可用字段名 `fbaCode` 或 `deliveryAddress`，与现有入库计划/库存明细字段对齐即可。

---

## 2. Excel 模板列（建议）

模板下载接口返回的表头建议固定为下列之一（可用中英文列名映射，但需在预览接口中写死映射规则）：

| 列（建议表头） | 字段含义 | 必填 |
|---|---|---|
| 海柜 / 柜号 / `coNo` | 拆柜订单柜号 | 是 |
| Job No. / `jobNoRaw` | 用户表格中的 Job 编号，用于模糊匹配系统 `systemSoNo` | 是 |
| FBA Code / FBACode / `fbaCode` | 与 Delivery Address 同义 | 是 |
| 货件编码 `shipmentCode` | 可选，有则写入入库计划 | 否 |
| 打板数 `palletCount` | 可选 | 否 |
| 平台 `platform` | 可选 | 否 |
| 派送方式 `deliveryMethod` | 可选（字典同 `delivery_type`） | 否 |
| 重量 / 体积 / 件数 / 备注 | 可选 | 否 |

若用户表头为「多维表格」导出，可增加**同义词表**（如「海柜」「Container」→ `coNo`）。

---

## 3. 接口一览

| 说明 | Method | URL（与前端已写死路径一致） |
|---|---|---|
| 下载导入模板 | `POST` | `/wms/order/inventory-data/existing-import/template` |
| 解析预览（不落库） | `POST` | `/wms/order/inventory-data/existing-import/preview` |
| 确认导入（落库） | `POST` | `/wms/order/inventory-data/existing-import/confirm` |

> 说明：模板下载与项目内「平台仓库导入」一致，前端使用 **POST** 带鉴权下载空参数表单（`useDownload`）；若你们规范要求 `GET`，需同时改前端 `inventory-data-existing-import-modal.vue` 中的下载方式。

---

## 4. Job No. → 系统订单号（`systemSoNo`）模糊匹配规则（后端）

以下规则供实现参考，可按数据质量迭代：

1. **规范化**：对表格 `jobNoRaw` 与数据库候选 `systemSoNo` 去首尾空格、统一大小写（可选）、合并连续空白。
2. **包含关系（推荐基线）**：
   - `systemSoNo` **包含** `jobNoRaw`，或
   - `jobNoRaw` **包含** `systemSoNo` 的某一「聚合片段」（若订单号为 `A+B` 拼接展示，可配置分隔符拆分后逐段匹配）。
3. **聚合单号**：若库存列表展示的 `systemSoNo` 由多条 Job 聚合而成（如 `JOB001/JOB002`），应支持 **按分隔符拆分后任一片段与 `jobNoRaw` 匹配即视为命中该聚合单**。
4. **唯一性**：
   - **0 条**命中：预览行 `plannedAction` 可为 `create_order_and_plan`（在柜号新场景）或 `error`（无法解析订单语义时），`errorMessage` 写明原因。
   - **1 条**命中：写入 `matchedSystemSoNo`、`matchedOrderId`（拆柜订单 id），`matchType` 简述（如 `contains`）。
   - **多条**命中：`plannedAction` = `ambiguous`，`matchCandidates` 列出候选订单号摘要，`errorMessage` 提示用户调整表格或后台主数据；**确认导入时建议整行拒绝落库**（与前端「无错误行才可导入」一致）。
5. **与柜号联合**：模糊匹配订单时，建议**优先在同一 `coNo`（海柜）下**检索拆柜订单/入库计划，减少跨柜误匹配。

---

## 5. 去重判定（跳过逻辑）

在预览或确认阶段，对每一行在「匹配到唯一订单 + 柜号 + FBA」后查询是否**已存在**入库计划行或库存占用（口径与 `GET /wms/inventory/location/inventory-detail/list` 一致）：

- 若已存在：**`plannedAction` = `skip`**，`errorMessage` 为空。
- 若不存在且订单、柜号均合法：**`add_inbound_plan`**（订单已存在仅缺计划）或 **`create_order_and_plan`**（需新建拆柜订单/海柜），由你们实际模型选择其一或两种都支持并在预览中区分。

**FBA / 地址比较**：建议对 `fbaCode` 与库内 `deliveryAddress` 做**规范化后比较**（去空格、全半角、大小写），避免同址不同写法导致重复导入。

---

## 6. `POST …/existing-import/preview`

### Content-Type

`multipart/form-data`

### FormData

| 字段 | 类型 | 说明 |
|---|---|---|
| `file` | File | `.xls` / `.xlsx`，单文件 |

### 成功响应 `data`（建议结构）

与前端解析逻辑一致（支持外层 `data` 包裹）：

```json
{
  "importBatchId": "uuid-or-snowflake",
  "rows": [
    {
      "rowNum": 2,
      "coNo": "ABCD1234567",
      "jobNoRaw": "SO-9988",
      "fbaCode": "LAX9",
      "matchedSystemSoNo": "AGG-SO-9988-001",
      "matchedOrderId": 10001,
      "matchType": "contains",
      "matchCandidates": null,
      "plannedAction": "skip",
      "errorMessage": null
    }
  ]
}
```

### 预览行字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| `rowNum` | number | Excel 物理行号（建议表头占第 1 行，数据从第 2 行起） |
| `coNo` | string | 海柜/柜号 |
| `jobNoRaw` | string | 表格 Job No. 原文 |
| `fbaCode` | string | 可选；与 `deliveryAddress` 二选一或同时返回 |
| `deliveryAddress` | string | 与 FBA Code 同义时可直接填展示用地址串 |
| `matchedSystemSoNo` | string | 模糊匹配到的系统订单号 |
| `matchedOrderId` | long | 拆柜订单 id，供确认阶段落库 |
| `matchType` | string | 匹配策略简述，供用户理解 |
| `matchCandidates` | string | 多候选时摘要；单候选可为 null |
| `plannedAction` | string | 见下表 |
| `errorMessage` | string | 有值时前端将该行视为**不可确认**（与平台仓库导入一致） |

**`plannedAction` 建议枚举：**

| 值 | 含义 |
|---|---|
| `skip` | 已存在同一海柜+订单+FBA，不写入 |
| `add_inbound_plan` | 订单/海柜已存在，仅新增入库计划行 |
| `create_order_and_plan` | 需新建拆柜订单（海柜）并创建入库计划 |
| `ambiguous` | Job No. 匹配多订单，需人工 |
| `error` | 数据非法、缺列、柜号不存在等 |

前端兼容：`plannedAction` 缺失时可读同义字段 `action`。

---

## 7. `POST …/existing-import/confirm`

### Content-Type

`application/json`

### Body

```json
{
  "importBatchId": "uuid-or-snowflake",
  "rows": []
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `importBatchId` | string | 与预览一致；若后端将预览结果缓存于服务端，可**仅校验 id + 版本** 落库，忽略客户端篡改的 `rows`；若不做缓存，则**以本次提交的 `rows` 为准**重新校验并写入。 |
| `rows` | array | 与预览结构相同；建议后端**重新执行校验**（模糊匹配、去重、权限），勿盲信客户端。 |

### 处理建议

1. 仅处理 `errorMessage` 为空且 `plannedAction` 不为 `ambiguous` / `error` 的行（与前端「有效行数」一致）。
2. 实际解析/写库在**后台异步**执行；接口须**立即返回受理结果**，勿长时间同步阻塞。

### Response（异步受理）

项目统一 `R<?>`：**业务码 `code` 为 `202`（`HttpStatus.ACCEPTED`，已受理）**，**不是 200**。`msg` 一般为「已受理」。

`data` 必有，类型 **`WmsInventoryExistingImportTaskSubmitVo`**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `taskId` | Long | 异步任务 id，前端用于轮询 |
| `importBatchId` | string | 与请求/预览批次一致（可空） |
| `status` | string | 初始一般为 **`PENDING`** |

前端：`src/service/request` 将 **`code === 202`** 与成功码一并视为成功响应；受理后轮询 **`GET …/existing-import/task/{taskId}`**，直至 **`SUCCESS`** / **`FAILED`** 再 toast 并刷新列表。

### `GET …/existing-import/task/{taskId}`

查询异步导入任务状态（前端轮询，建议间隔 1～3s）。

### 响应 `data`：`WmsInventoryExistingImportTaskStatusVo`

| 字段 | 说明 |
|---|---|
| `status` | `PENDING` \| `RUNNING` \| `SUCCESS` \| `FAILED` |
| `successCount` / `failCount` / `errorMessage` | 汇总与失败概要 |

终态为 `SUCCESS` 或 `FAILED` 时停止轮询。

---

## 8. `POST …/existing-import/template`

返回 **xlsx** 二进制流；响应头可带 `Download-Filename`（UTF-8 编码文件名），与现有导入模板接口一致。

---

## 9. 权限与安全

- 建议权限字符与库存数据列表或拆柜订单导入同级，例如：`wms:inventory-data:import`（以你们规范为准）。
- 文件类型、大小限制：前端限制 **20MB**、`.xls/.xlsx`；后端应再次校验魔数/内容，防止恶意文件。

---

## 10. 与现有模块的关系

- 列表/编辑：`docs/wms-inventory-data-api.md`
- 拆柜订单导入（多文件、结构不同）：`docs/wms-devanning-order-api.md`（若存在）
- 入库计划字段：以拆柜订单/入库计划既有表结构为准，本导入本质是「补单 + 补计划行」。

---

## 11. 前端已实现契约摘要

- 预览：`POST /wms/order/inventory-data/existing-import/preview`，`multipart`，字段名 `file`（单独长超时，见 `VITE_WMS_EXISTING_IMPORT_TIMEOUT_MS`）。
- 确认：`POST /wms/order/inventory-data/existing-import/confirm`，JSON：`{ importBatchId, rows }`；响应 **`code === 202`**，`data.taskId`；随后 **`GET …/existing-import/task/{taskId}`** 轮询至终态。
- 模板：`POST /wms/order/inventory-data/existing-import/template`，与 `useDownload` 一致。

后端实现完成后，若字段名或路径有变更，请同步修改 `src/service/api/wms/inventory-data.ts` 与本文档。

---

## 12. 大数据量：超时与异步（推荐后端方案）

### 现象

浏览器或网关常在 **60s / 120s** 等处断开空闲连接；而后端仍在执行导入，表现为 **前端已超时报错，但库内数据仍在变化**。

### 前端已做

- **预览**：单独长 **`timeout`**（默认 **30 分钟**），环境变量 **`VITE_WMS_EXISTING_IMPORT_TIMEOUT_MS`**；**`0`** 表示 Axios 不设限（慎用）。
- **确认**：服务端快返；请求约 **120s** 超时即可。**落库耗时**由 **`GET …/task/{taskId}` 轮询**承接。

### 仍需运维/网关对齐

- **预览**大文件解析仍可能较慢：**Nginx** `proxy_read_timeout` 等建议 ≥ 预览超时，或与业务约定分批导入。
- **Spring Boot / 网关**：Tomcat `connection-timeout`、负载均衡空闲超时等同理。

### 异步方案（已与后端对齐并实现）

1. **确认**：`POST …/existing-import/confirm` 返回 **`code === 202`** + **`data.taskId`**。
2. **轮询**：`GET …/existing-import/task/{taskId}`，直至 **`SUCCESS`** / **`FAILED`**。

网关对「确认」接口仅需覆盖**秒级**受理响应；长时间处理在服务端后台完成。
