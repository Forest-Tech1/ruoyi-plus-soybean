# WMS 拆柜订单 · 后端接口对接说明

> 园区调度合并拆柜订单、Dock 双写、批量部分成功、历史迁移：**`docs/wms-backend-park-devanning-handoff.md`**。

本文档供 **RuoYi-Vue-Plus** 后端实现与前端（`src/views/wms/devanning-order`）对齐。统一前缀：**`/wms/devanning-order`**（若全局有 `/prod-api` 等 `context-path`，请拼在网关前缀之后）。

## 1. 通用约定

| 项           | 说明                                                                                                                                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 鉴权         | `Authorization: Bearer <access_token>`                                                                                                                                                                                                                      |
| 客户端       | 请求头 `Clientid`（与前端 `.env` 中 `VITE_APP_CLIENT_ID` 一致）                                                                                                                                                                                             |
| 成功码       | 与现有系统一致，前端 `.env` 中 `VITE_SERVICE_SUCCESS_CODE` 默认为 **`200`**（字符串比较）                                                                                                                                                                   |
| 分页请求     | `pageNum`、`pageSize`；可选排序 `orderByColumn`、`isAsc`（`asc`/`desc`）                                                                                                                                                                                    |
| 分页列表响应 | 建议与 MyBatis-Plus 分页一致：**顶层 JSON 含 `code`、`msg`、`rows`、`total`**（前端列表 transform 优先读取 `rows`；部分封装也会读 `data` 内层，请与现有 Controller 风格保持一致）。若沿用 RuoYi `TableDataInfo`，通常结构为：`{ code, msg, rows, total }`。 |
| 通用查询扩展 | 日期等额外条件放在 **`params`** 子对象中序列化传递（与框架 `BaseEntity.params` 习惯一致）。                                                                                                                                                                 |

## 2. 状态、字典与预计拆柜日期

### 2.1 订单状态 `status`（字符串，存库+回传）

| 值                  | 含义     |
| ------------------- | -------- |
| `pending_schedule`  | 待安排   |
| `pending_devanning` | 待拆柜   |
| `completed`         | 拆柜完成 |
| `abnormal`          | 异常     |

### 2.2 拆柜轮次、订单等级、园区调度字段

| 项 | 说明 |
| -- | ---- |
| `wms_devanning_round` | 拆柜轮次字典；`devanningRound` 存 **`dict_value`** |
| **`orderLevel`** | **数字**（`int`/`decimal`，用户输入），**不再**使用字典 `wms_order_level` |
| **`devanningStatus`** | **拆柜状态**（到仓/排队/作业等，与园区看板 `status` 一致）：`pending` \| `not_arrived` \| `queued` \| `in_progress` \| `completed`；过渡期后端可仍返 `schedulingStatus`（同义） |
| **`dockId`** | 可选，关联园区道口主数据 `wms_park_dock.id`（指派/排队用） |
| **`devanningDock`** | **拆柜口**（文本）；指派 Dock 时将槽位名写入此字段，**不单独维护 `dockName`** |
| **`driverPhone`** | **司机电话**（文本，可空）；司机公开 Check-in 成功时写入，仓库也可在列表/新建单维护 |
| **`queuePosition`** | Dock 排队序；见 **`docs/wms-park-devanning-scheduling-api.md`** |
| **`expectedDevanningTime`** | 预计拆柜日期 `yyyy-MM-dd`（与园区「计划作业时间」同一字段） |

**导入确认**生成的新海柜订单默认：`devanningStatus=not_arrived`。

### 2.3 预计拆柜时间 `expectedDevanningTime`

- **仅日期**：格式 **`yyyy-MM-dd`**，**不要**时分秒（前端日期选择器与提交均按日）。
- **状态联动（须后端与前端一致）：**
  - 当 **`expectedDevanningTime` 非空**（已安排预计拆柜日）→ 订单状态应为 **`pending_schedule`（待安排）**。
  - 当 **`expectedDevanningTime` 为空或未传** → 订单状态应为 **`pending_devanning`（待拆柜）**。
- **适用范围建议：** 在 **`POST` 新建**、**`PUT` 修改** 且请求体中包含或对 `expectedDevanningTime` 做了清空/更新时，后端按上表刷新 `status`；**已完成拆柜（`completed`）、异常（`abnormal`）等是否允许改预计日及是否参与联动由业务收口**（前端列表仅对「待安排 / 待拆柜」开放行内编辑）。

### 2.4 列表行内编辑（前端行为）

主列表对 **待安排 / 待拆柜** 订单，支持行内编辑并 **`PUT /wms/devanning-order`** 保存：

- **拆柜轮次** `devanningRound`（字典值）
- **预计拆柜时间** `expectedDevanningTime`（`yyyy-MM-dd`，可清空）
- **订单等级** `orderLevel`（字典值）
- **拆柜口** `devanningDock`（文本）
- **司机电话** `driverPhone`（文本，可清空）

若请求体包含 `expectedDevanningTime` 的变更，前端会同时传 **`status`**（按 §2.3 规则）；**以后端最终落库与校验为准**。

## 3. 列表查询

- **URL：** `GET /wms/devanning-order/list`
- **Query 参数：**

| 参数                           | 类型   | 说明                                                         |
| ------------------------------ | ------ | ------------------------------------------------------------ |
| pageNum                        | int    | 页码                                                         |
| pageSize                       | int    | 每页条数                                                     |
| coNo                           | string | 柜号（模糊可选）                                             |
| blNo                           | string | 提单号（模糊可选）                                           |
| status                         | string | 上表状态枚举；不传或空表示不限                               |
| devanningRound                 | string | 字典 `wms_devanning_round` 的 `dict_value`；不传或空表示不限 |
| orderLevel                     | number | 订单等级（数字）；不传或空表示不限                             |
| devanningStatus              | string | 拆柜状态；见 §2.2                                            |
| orderByColumn                  | string | 可选                                                         |
| isAsc                          | string | `asc` / `desc`                                               |
| params[createTimeBegin]        | string | **列表默认时间窗**：订单创建时间起，`yyyy-MM-dd HH:mm:ss`（前端首屏与重置默认 ±15 天） |
| params[createTimeEnd]          | string | 创建时间止                                                   |
| params[orderTimeBegin]         | string | 下单时间起（可选；默认不传）                                  |
| params[orderTimeEnd]           | string | 下单时间止                                                   |
| params[devanningCompleteBegin] | string | 拆柜完成时间起                                               |
| params[devanningCompleteEnd]   | string | 拆柜完成时间止                                               |
| params[expectedDevanningBegin] | string | 预计拆柜**日期**区间起；可与前端一致为 `yyyy-MM-dd 00:00:00` |
| params[expectedDevanningEnd]   | string | 预计拆柜**日期**区间止；可与前端一致为 `yyyy-MM-dd 23:59:59` |

**排序（`orderByColumn` + `isAsc`）：**

- 前端列表默认请求 **`orderByColumn=createTime`**、**`isAsc=desc`**（**创建时间降序**）。
- **建议后端**：当请求 **未带** `orderByColumn`/`isAsc` 或二者为空时，可按 **`create_time` 降序** 或业务约定默认排序；列表筛选默认按 **`params.createTimeBegin` / `params.createTimeEnd`** 限制创建时间范围。
- 表头排序时，前端会传上述两参数；**建议后端对白名单字段做映射**（防注入），至少支持：
  - `orderDate` → 下单日期
  - `devanningCompleteTime` → 拆柜完成时间
  - `expectedDevanningTime` → 预计拆柜时间  
    （可按需增加 `createTime`、`updateTime` 等）
- `isAsc` 取值：`asc` 升序、`desc` 降序。

**行记录字段（`rows[]` 中单条）：** 至少包含前端表格所需字段：

| 字段                       | 类型        | 说明                                            |
| -------------------------- | ----------- | ----------------------------------------------- |
| id                         | long/string | 主键                                            |
| coNo                       | string      | 柜号                                            |
| attachmentOssIds           | string      | 可选，附件 OSS id 列表（逗号分隔），用于列表「附件」列展示与预览 |
| attachmentCount            | number      | 可选冗余，附件数量；若不返前端会由 `attachmentOssIds` 计算 |
| orderDate                  | string      | 下单日期 `yyyy-MM-dd`                           |
| blNo                       | string      | 提单号                                          |
| status                     | string      | 状态枚举                                        |
| devanningCompleteTime      | string      | 可空，拆柜完成时间                              |
| expectedDevanningTime      | string      | 可空，预计拆柜**日期** `yyyy-MM-dd`             |
| inboundWarehouse           | string      | 入库仓库                                        |
| orderLevel                 | number      | 订单等级（数字）                                  |
| devanningStatus            | string      | 拆柜状态（见 §2.2）；过渡期可兼返 `schedulingStatus` |
| dockId                     | long        | 可选，园区 Dock 主键（`wms_park_dock.id`）      |
| devanningDock              | string      | **拆柜口**（与 Dock 槽位名一致，不另返 dockName） |
| driverPhone                | string      | 可空，司机电话（Check-in 或后台维护）           |
| queuePosition              | number      | 可选，Dock 排队序                               |
| cargoQty                   | number      | 货物数量                                        |
| cargoWeight                | number      | 货物重量                                        |
| devanningRound             | string      | 可空，字典 `wms_devanning_round` 的 dictValue   |
| labelTag                   | string      | 可空，拆柜订单标签（用于列表展示/业务标记）     |
| hasHold                    | boolean     | 是否存在入库计划 `hold=true`（后端按明细汇总）  |
| remark                     | string      | 备注（可选）                                    |
| devanningSheetPrinted      | boolean     | 可选，默认 `false`；**拆柜单（Excel）已成功导出**后置 `true`，供列表「操作状态」第一行展示「拆柜单已打」 |
| palletLabelPrinted         | boolean     | 可选，默认 `false`；**卡板贴（Word 或 ZIP）任一格式已成功导出**后置 `true`，供列表「操作状态」第二行展示「卡板贴已打」 |
| createTime / updateTime 等 |             | 与 `BaseEntity` 一致即可                        |

## 3.2 附件（MinIO/OSS）

前端在列表新增「附件」列（位于 **柜号后**），支持：

- 上传附件（复用系统 OSS 上传接口 `POST /resource/oss/upload`，由后端配置存储到 MinIO）
- 已上传数量展示（`attachmentCount` 或按 `attachmentOssIds` 计算）
- 预览/下载（复用 `GET /resource/oss/listByIds/{ids}` 返回的 `url`）

### 3.2.1 绑定附件到拆柜订单（需新增）

- **Method**: `PUT`
- **URL**: `/wms/devanning-order/{id}/attachments`
- **Body**:

```json
{
  "ossIds": [1001, 1002]
}
```

- **说明**：
  - `ossIds` 为已上传的 OSS 对象 id（由 `POST /resource/oss/upload` 返回）。
  - 建议后端落库为字符串字段（逗号分隔）或中间表（order ↔ oss 多对多均可），但需要在 `GET /wms/devanning-order/list` / `GET /wms/devanning-order/{id}` 回传 `attachmentOssIds` / `attachmentCount`。

### 3.1 操作状态（打印标志）— 后端需要做的事

前端在 **「状态」列右侧** 增加 **「操作状态」** 列：固定 **上下两行**；第一行在 `devanningSheetPrinted === true` 时显示「拆柜单已打」，第二行在 `palletLabelPrinted === true` 时显示「卡板贴已打」；两行均未置位时显示 `—`。

1. **表结构**  
   - 在拆柜订单主表（或与主表 1:1 的扩展表）增加布尔字段（或 `char(1)` 存 `0/1`），建议命名与 JSON 一致：  
     - `devanning_sheet_printed` / `pallet_label_printed`（Java 实体用 `@JsonProperty` 或统一驼峰 `devanningSheetPrinted` / `palletLabelPrinted` 与前端对齐）。

2. **置位时机（与导出接口绑定）**  
   - **`GET /wms/devanning-order/export/{id}`**（拆柜单 Excel）：在 **文件成功生成并作为下载流返回前**（事务内或成功后立即更新），将 **`devanningSheetPrinted` 置为 `true`**。若本次请求失败（无文件、异常），**不得**置位。  
   - **`GET /wms/devanning-order/{id}/pallet-labels/export?format=docx|zip|pdf|pdfzip`**：在 **文件成功生成并返回前**，将 **`palletLabelPrinted` 置为 `true`**。各格式 **共用同一标志**（任一生效即视为「卡板贴已打」）。失败不置位。  
   - **例外（PDF 仅预览 / 仅打印不落库）：** `format=pdf` 且 **`preview=true`**（见 §13.3）时 **仅返回 PDF 流，不得将 `palletLabelPrinted` 置为 `true`**，供前端 **带鉴权拉 Blob** 后 **隐藏 iframe `print()` 直接调系统打印**，或（备选）`blob:` 新标签由用户 **Ctrl+P**；**正式记「已打印」**仍靠 **`format=pdf` 且 `preview=false`（或省略 `preview`，与旧版语义一致）** 或其它格式（docx/zip/pdfzip）的成功导出。

3. **列表与详情**  
   - `GET /wms/devanning-order/list` 与 `GET /wms/devanning-order/{id}` 的 VO 中 **必须带回** 上述两字段（缺省按 `false`），以便列表与详情抽屉一致。

4. **历史数据**  
   - 已有订单若无法从日志反推，可默认 `false`；若业务需要「补打」仍算已打，以你们规则为准（可仅以后续成功导出为准）。

5. **幂等**  
   - 同一订单重复导出：标志位保持 `true` 即可（无需反复写库，但需保证并发下更新安全）。

## 4. 详情

- **URL：** `GET /wms/devanning-order/{id}`
- **响应 `data`：** 单条对象，字段同列表行（可更全）。

## 5. 新增

- **URL：** `POST /wms/devanning-order`
- **Body（JSON）：** 主表字段与 `DevanningOrderOperateParams` 对齐，并增加 **`inboundPlans`**：**一次提交主订单 + 入库计划明细**（与前端「新建单」双 Tab 一致）。

**主表字段（常用）+ 入库计划数组示例：**

```json
{
  "coNo": "CONTAINER01",
  "blNo": "BL123456",
  "orderDate": "2026-04-07",
  "expectedDevanningTime": "2026-04-08",
  "status": "pending_schedule",
  "devanningRound": "1",
  "orderLevel": "A",
  "inboundWarehouse": "一号库",
  "devanningDock": "口3",
  "cargoQty": 100,
  "cargoWeight": 1250.5,
  "remark": "",
  "inboundPlans": [
    {
      "systemSoNo": "SO123",
      "shipmentCode": "FBA0001",
      "platform": "Amazon",
      "warehouseCode": "LA-WH",
      "addressType": "FBA",
      "deliveryMethod": "快递",
      "hold": false,
      "totalPieces": 10,
      "weight": 100.5,
      "volumeCbm": 2.35,
      "remark": "行备注（可选，与主单 remark 无关）"
    }
  ]
}
```

**`inboundPlans[]` 单行字段约定：**

| 字段                         | 说明                                                  |
| ---------------------------- | ----------------------------------------------------- |
| systemSoNo / shipmentCode 等 | 与 §16 入库计划行一致（驼峰）                         |
| remark                       | **入库计划行备注**（可选；与主表 `remark` 不同字段）  |
| systemPreLocation            | **请求体无需传**（或忽略）；由后续业务/系统自动写入   |
| volumeCbm                    | 体积 CBM；**有值时后端须计算 `estimatedPalletCount`** |
| estimatedPalletCount         | **请求体无需传**（或忽略）；入库时由后端计算          |

**预计打板数计算规则（与前端展示一致，须后端落库）：**

\[
\texttt{estimatedPalletCount} = \begin{cases} \lceil \texttt{volumeCbm} / 2 \rceil & \texttt{volumeCbm} > 0 \\ 0 & \text{否则} \end{cases}
\]

（\(\lceil\cdot\rceil\) 为向上取整；前端仅作预览，**以服务端计算并保存为准**。）

- **下单日期 `orderDate`：** 前端「新建单」在提交时 **自动传当日** `yyyy-MM-dd`（与创建日一致），**不提供手选**；后端可与落库的 `create_time` 日期对齐校验或作兜底。

- **校验建议：** `inboundPlans` 至少 1 条；每条至少 **系统 SO 号** 或 **货件编码** 其一非空（与前端提示一致）。
- **新建单 `status`：** 前端会传 **`status`**：`expectedDevanningTime` 有值 → `pending_schedule`，否则 → `pending_devanning`（与 §2.3 一致）；后端应校验并落库，必要时可覆盖为业务规则允许的其他初始状态。

## 6. 修改（主单 PATCH）

- **URL：** `PUT /wms/devanning-order`
- **Body（JSON）：** 必须含 **`id`**；其余字段按需部分更新（与 `DevanningOrderOperateParams` 一致，含 **`status`**、**`devanningRound`**、**`orderLevel`**、**`expectedDevanningTime`**（`yyyy-MM-dd`）、**`devanningDock`** 等）。**若主表对 `coNo` / `blNo` 做了 `@NotBlank` 等全量校验**，请在 **部分更新** 接口中改为 **只校验本次入参字段**，或要求客户端同时带上当前 **`coNo`、`blNo`**（前端行内保存会一并提交当前行的柜号/提单号以避免误报「柜号不能为空」）。
- **建议实现：** 若客户端传入 **`expectedDevanningTime`**（含改为 `null` / 空字符串清空），后端**同步按 §2.3 重算 `status`**，并与客户端传入的 `status` 比对或以后端规则为准，避免状态与日期不一致。
- **字典字段：** `devanningRound`、`orderLevel` 须为有效 `dict_value`（或贵司约定的取值）。
- **鉴权建议：** `@SaCheckPermission("wms:devanningOrder:edit")`（与前端 `edit` 权限对齐；若无独立编辑权限可与 `add` 合并约定）。

## 7. 删除

- **URL：** `DELETE /wms/devanning-order/{ids}`
- **说明：** `{ids}` 为逗号分隔主键（与项目内 `demo`、`user` 等删除风格一致）。

## 8. 完成拆柜

- **URL：** `PUT /wms/devanning-order/complete/{id}`
- **Body：** 可空；后端将状态更新为 `completed`，并写入 `devanningCompleteTime`（服务器时间或业务时间）。

## 9. 更新备注（仅备注）

- **URL：** `PUT /wms/devanning-order/{id}/remark`
- **Body（JSON）：**

```json
{
  "remark": "客户要求优先拆柜"
}
```

- **说明：** 仅更新 `remark` 字段；**不建议**与状态强校验绑定（任意状态均可补备注），除非产品有明确要求。
- **鉴权建议：** `@SaCheckPermission("wms:devanningOrder:remark")`

## 10. 取消拆柜完成

- **URL：** `PUT /wms/devanning-order/cancel-complete/{id}`
- **Body：** 可空。
- **业务建议：** 仅当当前 `status === completed` 时允许；将状态回退为 **`pending_devanning`**（或与仓储流程一致的「待拆柜」状态），并清空或保留 `devanningCompleteTime` 由产品定（常见为清空）。
- **鉴权建议：** `@SaCheckPermission("wms:devanningOrder:cancelComplete")`

## 11. 标记异常

- **URL：** `PUT /wms/devanning-order/mark-abnormal/{id}`
- **Body：** 可空。
- **业务建议：** 当 `status !== abnormal` 时允许；将 `status` 置为 **`abnormal`**；是否写入异常原因可沿用 `remark` 或扩展字段。
- **鉴权建议：** `@SaCheckPermission("wms:devanningOrder:markAbnormal")`

## 12. 取消标记异常

- **URL：** `PUT /wms/devanning-order/cancel-abnormal/{id}`
- **Body：** 可空。
- **业务建议：** 仅当 `status === abnormal` 时允许；恢复状态建议为 **`pending_devanning`**（若此前已完成拆柜，是否恢复为 `completed` 需按业务规则，前端当前按「取消异常后由后端返回最终状态」处理列表刷新）。
- **鉴权建议：** `@SaCheckPermission("wms:devanningOrder:cancelAbnormal")`

## 13. 导出拆柜单（单条）

- **URL：** `GET /wms/devanning-order/export/{id}`
- **Path：** `id` — 拆柜订单主键。
- **Query（可选）：** `template` — 后端预置 **Excel 模版资源 key**（字符串）。**不传** 时使用默认/标准拆柜单模版（列结构与 §13.1 一致）。
  - **租户 198842 专用：** 当前登录用户 **`tenantId === '198842'`** 时，前端会自动附加  
    **`template=tenant198842-container-unloading`**（已对值做 URL 编码）。**其它租户请求不传该参数**。
  - **后端：** 建议将 `template` 列入 **白名单**；未知值可忽略并走默认模版，或返回 **400** 并提示合法取值 —— **禁止**将 `template` 直接当作文件路径以防路径穿越。
- **鉴权：** `@SaCheckPermission("wms:devanningOrder:export")`（与是否带 `template` 无关）。
- **响应：** `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`（或项目统一文件下载类型）；**Body** 为 **xlsx 二进制**。
- **文件名：** 建议响应头 **`Download-Filename`**（UTF-8 文件名）或前端兜底：`拆柜单_{coNo}_{timestamp}.xlsx`（`coNo` 为主单柜号）。
- **前端：** `useDownload().zip(GET, '/wms/devanning-order/export/{id}[?template=…]', filename)`；下载封装会在 URL 后再追加防缓存参数 `t`，与 `template` 使用 `&` 拼接。

### 13.1 业务模版版式（与仓库「拆柜单」Excel 对齐）

导出结果须与业务定稿的 **拆柜单** 表结构一致：**第 1 行为表头**，自第 2 行起为数据行；**每条入库计划一行**；主单 **柜号**在每行 **CONTAINER** 列重复（与业务样表一致）。

**列顺序与表头文案（A–L，须与模版完全一致，含空格与大小写）：**

| 列 | 表头（Excel 显示） | 数据来源 | 说明 |
| -- | ------------------ | -------- | ---- |
| A | `Delivery address` | 入库计划 `warehouseCode` | 仓库代码 |
| B | `CONTAINER` | 主单 `coNo` | 同一订单各行相同 |
| C | `Job NO.` | 入库计划 `systemSoNo` | **系统 SO 号**；与导入解析规则一致 |
| D | `CTNS` | 入库计划 `totalPieces` | 总件数，数值 |
| E | `PALLET` | 入库计划 `estimatedPalletCount` | **预计拆柜板数**；整数，无则 `0` 或空单元格由产品定 |
| F | `Products` | （可选） | 若当前无字段则 **留空**；后续可扩展 |
| G | `SH ID/MARK` | 入库计划 `shipmentCode` | **货件编码**；若库内为英文逗号分隔多值，导出时可 **换行** 写入单元格，并设置 **自动换行** |
| H | `KGS` | 入库计划 `weight` | 重量 |
| I | `CBM` | 入库计划 `volumeCbm` | 体积 |
| J | `remark` | 入库计划 `remark` | 行级备注 |
| K | `HOLD` | 入库计划 `hold` | `hold = true` 时填 **`HOLD`**（建议全大写）；**否则留空** |
| L | `系统预库位` | 入库计划 `systemPreLocation` | 文本；无则空 |

**样式（与业务样表一致时建议实现）：**

- 表头行：**加粗**、底边框。
- 数据区：全表 **细边框**。
- **条件格式（可选但建议）：** 当行满足「`HOLD` 列有值（如 HOLD）**且/或** 行备注含业务约定关键字（如 **拦截**）」时，该行 **整行填充浅黄背景**（与现场识别暂扣/拦截一致；具体条件以产品为准）。

**实现建议：**

1. 将定稿 **xlsx 空模版**（仅表头 + 样式）放入后端资源目录，使用 **模版填充**（EasyExcel `fill` / POI 等）写入数据区，避免手写列宽/合并导致与样张不一致。
2. 行顺序：与详情 **入库计划列表** 一致即可（建议按 `id` 升序或与列表接口一致）。
3. 若订单无入库计划：仍导出 **仅表头** 或 **表头 + 空数据提示行**（由产品定）。

### 13.2 与导入（§14.1）的对应关系

| 导出表头 | 导入列（§14.1） | 系统字段 |
| -------- | --------------- | -------- |
| `Delivery address` | Delivery Address | `warehouseCode` |
| `CONTAINER` | container | 主单 `coNo` |
| `Job NO.` | Job No | `systemSoNo` |
| `CTNS` | CTNS | `totalPieces` |
| `PALLET` | （若导入表有则解析，否则按 §14.2 计算） | `estimatedPalletCount` |
| `SH ID/MARK` | SH ID/MARK | `shipmentCode` |
| `KGS` / `CBM` | KGS / CBM | `weight` / `volumeCbm` |
| `remark` | 备注 | `remark` |
| `HOLD` | Hold | `hold`（同时建议联动 `deliveryMethod`） |
| `系统预库位` | （若导入扩展） | `systemPreLocation` |

### 13.3 卡板贴（导出 Word / ZIP）

业务样式：**顶部** 柜号（主单 `coNo`）；**中间** 大字 **`{warehouseCode}-HOLD-{序号}`**（`HOLD` 为固定字面量，与业务样张一致）；**底部** 日期（建议 `MM/dd/yyyy` 展示）。**序号** 按 **入库计划行** 展开：对每一行，设 `N = max(0, floor(estimatedPalletCount))`，生成 **`N` 张** 卡板贴，该行内序号 **`1 … N`**（与拆柜单「预计打板数」一致）。

#### A）卡板贴文件导出（Word / ZIP / PDF）

- **URL：** `GET /wms/devanning-order/{orderId}/pallet-labels/export`
- **Query：** `format` = **`docx`** | **`zip`** | **`pdf`** | **`pdfzip`**；可选 **`preview`** = **`true`** | **`false`**（**仅对 `format=pdf` 有意义**，其它格式可忽略）。
  - **`docx`**：单个 Word，内有多页/多节，**每页一张** 卡板贴，版式与 §13.3 描述一致。
  - **`zip`**：压缩包内 **每张贴纸一个** `.docx`，文件名建议含柜号与序号。
  - **`pdf`**：单个 PDF，多页（每页一张卡板贴）。**`preview=true`**：与正式 PDF 内容一致，但 **不置位** `palletLabelPrinted`（§3.1）；前端用 **带 Authorization 的 GET** 拉取 **`Blob`**，典型实现：**隐藏 iframe 赋 `blob:` URL 后 `contentWindow.print()`** 打开系统打印对话框（**禁止**静默跳过浏览器确认）；或备选 **`window.open(blobUrl)`** 新标签再 **Ctrl+P**。**禁止**仅用 `window.location` 指向接口 URL（会丢 token）。**`preview=false` 或省略**：行为同旧版，成功返回前 **置位** `palletLabelPrinted`。
  - **`pdfzip`**：ZIP 内 **每张贴纸一个** `.pdf`。
- **响应：** 二进制流；`Content-Type` / `Download-Filename` 与项目其它导出一致；**下载**场景前端使用带鉴权 **GET**（与 `export/{id}` xlsx 相同封装）；**`preview=true` 的 PDF** 使用同一鉴权头拉取 Blob 后 **iframe 打印** 或 **新标签打开**。
- **鉴权：**
  - **`docx` / `zip`**：`@SaCheckPermission("wms:devanningOrder:palletLabel")`（未配置时前端可与 `wms:devanningOrder:export` 对齐）。
  - **`pdf` / `pdfzip`**：建议 **`wms:devanningOrder:palletLabelPdf`**（若仅扩展 PDF 而未在库中新增该权限字，调用会被拒绝）；前端展示时另 **回退** `palletLabel`、`export` 与 Word 行为一致，便于灰度。

#### B）与 Excel 拆柜单导出的关系

卡板贴仅使用 **柜号、仓库代码、预计打板数、日期**；**不替代** §13.1 拆柜单 Excel。数据均来自同一订单主表与入库计划表。

## 14. 导入订单

前端为 **「多文件 → 解析预览 → 确认落库」**：**每个 Excel 文件对应一条拆柜主单**（单文件内多行入库计划仍按 §14.1）。接口建议如下：

| 接口                                  | 方法                | 说明                                                                                          |
| ------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `/wms/devanning-order/importTemplate` | **POST**（body 空） | 下载导入模板 — **标准派送**表头（与 `download()` 调用一致） |
| `/wms/devanning-order/importTemplate/v2` | **POST**（body 空） | 下载导入模板 — **V2 表头**（用于前端「**导入订单**」Sheet2 流程；含 Carrier、Remark 与 Delivery remark 分列等） |
| `/wms/devanning-order/import-preview` | **POST**            | **标准派送模版**：定列读取，**解析预览，不落库**（`multipart`，见 §14.0）                     |
| `/wms/devanning-order/import-preview/v2` | **POST**         | **导入订单（Sheet2）**预览：`multipart` 与 `import-preview` 相同（`files` + `updateSupport`）；前端 **`fetchPreviewDevanningOrderImportV2`**（原 `raw-order-sheet2` 入口已切换至此路径） |
| `/wms/devanning-order/import-preview/raw-order` | **POST**    | **原始订单派送表**：表头映射 + 预处理后再解析预览，响应结构与上一致；前端 `fetchPreviewDevanningOrderImportRawOrder` |
| `/wms/devanning-order/import-preview/raw-order-sheet2` | **POST** | （可选/遗留）**原始订单 · Sheet2**；若前端已全部改用 **`import-preview/v2`**，可由后端保留兼容或下线 |
| `/wms/devanning-order/import-confirm` | **POST**            | **用户确认后批量写入**（JSON，见 §14.0）；**标准 / 原始 / Sheet2 预览共用**                             |
| `/wms/devanning-order/importData`     | **POST**            | **标准（旧版）**单文件同步落库（可选）                                                              |
| `/wms/devanning-order/importData/v2`  | **POST**            | **标准 V2**单文件同步落库（可选）；`multipart`：`file` + `updateSupport`；前端 `fetchImportDevanningOrderDataV2` |
| `/wms/devanning-order/importData/raw-order` | **POST**      | **原始订单**单文件同步落库（可选）                                                          |
| `/wms/devanning-order/importData/raw-order-sheet2` | **POST** | **原始订单 Sheet2** 单文件同步落库（可选；仅读第二工作表） |

- 成功/失败 **`code`** 与 **`msg`** 与全局一致；批量结果说明可用 HTML 放在 `msg`（需注意转义安全）。
- **前端**：**「导入」下拉**「导入派送表（标准）」→ **`import-preview`** + **`importTemplate`**；「导入原始订单」→ **`import-preview/raw-order`**。旁侧 **「导入订单」**（Sheet2）→ **`import-preview/v2`** + **`importTemplate/v2`**。确认均为 **`import-confirm`**。**权限**均为 `wms:devanningOrder:import`。
- **Sheet2 注意**：工作簿须存在第二个 Sheet；仅一张表时后端应返回明确错误。预览与直传接口的 `multipart` 字段与 `raw-order` 一致（预览用 `files` + `updateSupport`，直传用 `file` + `updateSupport`，见后端实现）。

### 14.0 两步导入（与前端对齐）

#### A）解析预览 `POST /wms/devanning-order/import-preview`

- **Content-Type：** `multipart/form-data`
- **表单字段：**
  - **`files`**：多文件上传（Spring 可用 `List<MultipartFile>` 接收同名 `files`）。
  - **`updateSupport`**：字符串 `true` / `false`，含义同 §14.4。
- **前端超时：** 多文件上传 + 服务端解析可能超过 Axios 默认约 10s；预览请求单独使用 **120s** 超时（`getWmsDevanningImportPreviewTimeoutMs`）。可在环境变量 **`VITE_WMS_DEVANNING_IMPORT_PREVIEW_TIMEOUT_MS`** 覆盖（毫秒；`0` 表示不限制）。网关 `proxy_read_timeout` 等需与之匹配。
- **业务：** 每个文件解析为一条与 **§5** 一致的 **`order`（主表 + `inboundPlans`）**，**不落库**。
- **响应 `data` 示例：**

```json
{
  "items": [
    {
      "previewId": "550e8400-e29b-41d4-a716-446655440000",
      "sourceFileName": "CCLU7832278派送文件.xlsx",
      "order": {
        "coNo": "CCLU7832278",
        "blNo": "",
        "orderDate": "2026-04-10",
        "inboundPlans": []
      }
    }
  ]
}
```

- **`previewId`** 建议后端生成 UUID 并由确认接口原样校验；省略时前端会补临时 UUID。
- **`order`** 中与 §5 相同；`inboundPlans` 行可带 `estimatedPalletCount` 仅展示，落库仍建议按 §5 重算。
- **预览行可选扩展**：可返回 **`deliveryMethodLabel`**（解析原文/可读文案，便于对账或错误提示）。**派送方式业务码与前端 DictTag 仅认字段 `deliveryMethod`**（字典 `delivery_type` 的 dictValue）。**请勿**再与 `deliveryMethod` 重复返回同义的 `deliveryType` 等别名，避免前后端与文档三套字段混用；若历史接口仍带多余字段，前端可忽略。

#### B）确认导入 `POST /wms/devanning-order/import-confirm`

- **Body（JSON）：** `{ "updateSupport": boolean, "items": [ { "previewId", "sourceFileName", "order" } ] }`（与 preview 返回一致）。
- **业务：** 校验后逐单写入（或按 `updateSupport` 更新）。**响应**同项目惯例（如 `data: true`）。

#### C）权限

建议沿用 **`wms:devanningOrder:import`**，或按贵司拆分子权限。

### 14.1 派送文件列 → 系统字段（建议后端解析规则）

以下列名为业务常见写法；**表头匹配建议忽略首尾空格，大小写可按约定兼容**（如 `container` / `Container`）。

| Excel 列（示例）           | 落库 / 业务字段               | 说明                                                                                                                                                                    |
| -------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| container                  | 主单 **`coNo`（柜号）**       | 同一导入文件内建议 **柜号一致**：生成 **一条拆柜主单**，其下 **每条数据行对应一条入库计划**。若出现多柜号，由后端策略处理（拒绝 / 拆分为多单 / 取首行），需与产品确认。 |
| Delivery Address           | 入库计划 **`warehouseCode`**  | 仓库代码                                                                                                                                                                |
| Job No                     | 入库计划 **`systemSoNo`**     | 单元格内多个 SO 若以 **换行**、空白等分隔，规范化后合并为 **一个字符串**，多值之间用 **英文逗号** `,`（可先去重、去空）                                                 |
| CTNS                       | 入库计划 **`totalPieces`**    | 总件数                                                                                                                                                                  |
| SH ID/MARK                 | 入库计划 **`shipmentCode`**   | 多值同 Job No：**换行等 → 英文逗号分隔** 的单一字段                                                                                                                     |
| KGS                        | 入库计划 **`weight`**         | 重量                                                                                                                                                                    |
| CBM                        | 入库计划 **`volumeCbm`**      | 体积（立方米）                                                                                                                                                          |
| 备注（或业务表「备注」列） | 入库计划 **`remark`**         | **行级备注**；与主单 `DevanningOrder.remark` 区分                                                                                                                       |
| Hold                       | 入库计划 **`hold`**           | 值判定：**若单元格包含子串 `HOLD`（不区分大小写）** → `hold = true`；**否则** → `hold = false` |
| Hold（同列联动，可选）     | 入库计划 **`deliveryMethod`** | **建议**：`hold = true` 时 `deliveryMethod = "hold"`；否则 `deliveryMethod = "truck_delivery"`（值以字典 `delivery_type` 为准） |
| PALLET（若表中有）         | 入库计划 **`estimatedPalletCount`** | 可选列；有值则解析为整数写入；**无则仍按 §14.2 由 CBM 计算**（与产品确认优先级：文件优先或计算覆盖） |
| 系统预库位（若表中有）     | 入库计划 **`systemPreLocation`**   | 可选；通常导入由后端生成，若业务表含该列可解析落库 |

### 14.2 导入时预计打板数

与 **§5** 新建规则一致，**导入写入每条入库计划时**：

\[
\texttt{estimatedPalletCount} = \begin{cases} \lceil \texttt{volumeCbm} / 2 \rceil & \texttt{volumeCbm} > 0 \\ 0 & \text{否则} \end{cases}
\]

### 14.3 主单其它字段

派送文件若 **不含提单号等主表列**，`blNo` 等可由后端 **留空** 或按现有默认策略填充；**`orderDate`** 建议与「新建单」一致为 **导入处理当日** `yyyy-MM-dd`（或由业务指定）。

### 14.4 `updateSupport`

与系统用户导入类似：为 `true` 时 **按业务唯一键更新已存在订单**（唯一键由后端定义，如 `coNo` + 某行标识）；为 `false` 时仅新增。**须避免误覆盖**。

### 14.5 导出货物订单（按海柜 / 拆柜主单）

前端在列表 **每一行「更多」** 菜单中提供 **「导出货物订单」**：对该 **拆柜订单（海柜）** 导出关联货物订单 Excel。**导出哪些业务字段、按主单还是按入库计划行展开**，由产品与后端共同定稿。

#### 约定（必改 / 强烈建议）

- **URL**：`POST /wms/devanning-order/export/cargo-orders`
- **请求体须尽量携带当前操作所针对的拆柜订单主键**（与 **列表行**、**详情** 中同一条单一致，即主表 `id`）：
  - 推荐参数名：**`orderId`**（与列表 `rows[].id`、详情 `GET /wms/devanning-order/{id}` 的 `id` 同一值）。
- **语义**：有 **`orderId`** 时，后端 **只导出该海柜（该拆柜主单）** 维度的货物订单数据，避免误把整表/整页混出；**这是推荐对接方式**。
- 若历史实现未接 `orderId`，**应增加对 `orderId` 的识别与按单过滤**；无 `orderId` 时的批量/筛选导出仅作为扩展，**非本页当前入口**。

| 项 | 说明 |
| --- | --- |
| **URL** | `POST /wms/devanning-order/export/cargo-orders` |
| **Content-Type** | `application/x-www-form-urlencoded`（与前端 `useDownload().download()` 一致） |
| **必传（本页入口）** | **`orderId`**：拆柜订单主键，**与当前行/详情为同一条单**；后端 **仅** 按该 `orderId` 查询并组装 Excel。 |
| **扩展（可选）** | 若需「按列表筛选批量导出」：可约定 **不传** `orderId` 时与 **`GET /wms/devanning-order/list`** 查询参数对齐；**前端当前列表行入口始终带 `orderId`，不调用无 `orderId` 模式。** |
| **响应** | Excel 二进制流；`Download-Filename`、错误时 JSON 提示与项目其它导出一致。 |
| **权限** | 建议 `@SaCheckPermission("wms:devanningOrder:export")`（与 §15 导出类权限一致）。若需与「拆柜单 Excel」区分，可单独增加 `wms:devanningOrder:exportCargoOrder` 并在菜单/角色中配置。 |

**后端与产品需对齐的清单（示例）**

- 业务含义：**货物订单**对应库表/视图（拆柜主单、入库计划行、货物订单中间表、库存明细等）及 **一行 Excel 对应一条什么记录**。
- 列清单：柜号、SO、货件、仓库、件重尺、状态、预计拆柜、备注等是否导出。
- **`orderId`** 与入库计划、货物订单明细的关联查询方式。

## 15. 权限字符（建议）

与前端 `v-hasPermi` / `useAuth().hasAuth` 对齐（菜单与后端 `@SaCheckPermission` 配置）：

| 权限                                    | 说明                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `wms:devanningOrder:list`               | 列表（菜单可见）                                                         |
| `wms:devanningOrder:query`              | 查询（可与 list 合并）                                                   |
| `wms:devanningOrder:add`                | 新建                                                                     |
| `wms:devanningOrder:edit`               | 编辑主单（列表行内修改；前端在未配置时回退为 `add`）                     |
| `wms:devanningOrder:import`             | 导入                                                                     |
| `wms:devanningOrder:export`             | 导出（拆柜单 Excel、**货物订单导出** §14.5 等；前端列表行「更多」依赖此项） |
| `wms:devanningOrder:palletLabel`      | 卡板贴 Word / ZIP（`format=docx`/`zip`；未配置时前端可与 `export` 合并）   |
| `wms:devanningOrder:palletLabelPdf`   | 卡板贴 PDF / PDF·ZIP（`format=pdf`/`pdfzip`；需在菜单 SQL 中配置）        |
| `wms:devanningOrder:remove`             | 删除                                                                     |
| `wms:devanningOrder:complete`           | 完成拆柜                                                                 |
| `wms:devanningOrder:remark`             | 填写/更新备注                                                            |
| `wms:devanningOrder:cancelComplete`     | 取消拆柜完成                                                             |
| `wms:devanningOrder:markAbnormal`       | 标记异常                                                                 |
| `wms:devanningOrder:cancelAbnormal`     | 取消标记异常                                                             |
| `wms:devanningOrder:inboundPlan:edit`   | 详情-入库计划行修改（可与 `add` 并存；前端在未配置时回退为 `add`）       |
| `wms:devanningOrder:inboundPlan:remove` | 详情-入库计划行删除（可与 `remove` 并存；前端在未配置时回退为 `remove`） |

## 16. 入库计划（拆柜订单详情抽屉）

> 补充：前端已将「派送方式」与「库区管理-上架条件」统一使用同一字典，请后端一并配置字典类型 **`delivery_type`**。**`dictValue` 须覆盖业务实际落库的全部编码**（如 `private_warehouse`、`self_pickup_order` 等）；列表与导入预览会按字典行展示 **`dictLabel`（字典标签）**。若某码暂未配置字典项，可返回 **`deliveryMethodLabel`** 作为回显文案；仍无则回退显示 `deliveryMethod` 原始编码。**建议在 `sys_dict_data` 中补全 `dictLabel`（中文）与 `dictValue`（与接口一致）**。

用于详情抽屉第二个 Tab **「入库计划」**：顶部信息栏展示柜号及汇总；下方为**可复选、分页**的明细表。

### 16.1 分页列表

- **URL：** `GET /wms/devanning-order/{orderId}/inbound-plan/list`
- **Path：** `orderId` 拆柜订单主键
- **Query：** `pageNum`、`pageSize`（与全局分页一致）
- **响应（建议与 `TableDataInfo` / MyBatis-Plus 分页一致）：** 顶层 `code`、`msg`、`rows`、`total`。可选扩展字段 **`summary`**（与 `rows` 同级），用于信息栏汇总，避免额外请求：

```json
{
  "code": 200,
  "msg": "成功",
  "rows": [
    {
      "id": 1,
      "orderId": 100,
      "systemPreLocation": "A-01-01",
      "systemSoNo": "SO123",
      "shipmentCode": "FBAxxxx",
      "platform": "Amazon",
      "warehouseCode": "LA-WH",
      "addressType": "FBA",
      "deliveryMethod": "快递",
      "totalPieces": 10,
      "weight": 100.5,
      "volumeCbm": 2.35,
      "estimatedPalletCount": 1,
      "remark": "派送表行备注"
    }
  ],
  "total": 100,
  "summary": {
    "totalPieces": 999,
    "totalCbm": 123.45
  }
}
```

**行字段与前端 `Api.Wms.DevanningInboundPlan` 对齐**（可与库表 snake 映射为 camelCase 返回）：

| 字段                 | 类型        | 说明                   |
| -------------------- | ----------- | ---------------------- |
| id                   | long/string | 主键                   |
| orderId              | long/string | 所属拆柜订单 id        |
| systemPreLocation    | string      | 系统预库位             |
| systemSoNo           | string      | 系统 SO 号             |
| shipmentCode         | string      | 货件编码               |
| platform             | string      | 平台                   |
| warehouseCode        | string      | 仓库代码               |
| addressType          | string      | 地址类型               |
| deliveryMethod       | string      | 派送方式（字典 `delivery_type`，前端 DictTag 以此为准） |
| deliveryMethodLabel  | string      | 可选；解析得到的文案，**前端不用于 DictTag**（仅扩展字段/对账）；**不要**再单独返回与 `deliveryMethod` 同值的 `deliveryType` 等重复字段 |
| totalPieces          | number      | 总件数                 |
| weight               | number      | 重量                   |
| volumeCbm            | number      | 体积（CBM）            |
| estimatedPalletCount | number      | 预计打板数             |
| remark               | string      | 入库计划行备注（可选） |

**summary（可选）：**

| 字段        | 类型   | 说明                                           |
| ----------- | ------ | ---------------------------------------------- |
| totalPieces | number | 当前订单入库计划汇总总件数（信息栏「总件数」） |
| totalCbm    | number | 当前订单汇总总体积 CBM（信息栏「总CBM」）      |

> 若暂不提供 `summary`，前端信息栏汇总可显示为 `—`；**建议后端补齐**，与列表同接口返回即可。

### 16.2 修改明细行

- **URL：** `PUT /wms/devanning-order/inbound-plan`
- **Body（JSON）：** 含 `id`、可选 `orderId` 及需修改字段（与 `DevanningInboundPlanOperateParams` 一致），包含 **`remark`**（行备注）等。
- **预计打板数：** 若请求中携带 `volumeCbm`，建议后端**按 §5 同一公式**重算并覆盖 `estimatedPalletCount`（`ceil(volumeCbm/2)`，`volumeCbm<=0` 时为 `0`），避免与前端只读展示不一致；若客户端传入 `estimatedPalletCount` 可作为校验对比或忽略。
- **系统预库位：** 当前前端编辑弹窗为只读占位；是否允许接口修改由后续业务定。

#### 16.2.1 行内编辑（详情 / 入库计划列表，与 16.2 同一接口）

前端在详情抽屉 → **入库计划** Tab 的表格中，对 **`platform`、`warehouseCode`、`addressType`、`deliveryMethod`、`hold`** 支持「双击单元格 → 就地编辑」，**保存时仍调用本条 `PUT /wms/devanning-order/inbound-plan`**（与「更多 → 编辑」弹窗一致），**无新增 URL**。

- **请求体：** 建议与弹窗编辑相同：携带该行 **`id`**、**`orderId`**（可选）及当前行需保留的主数据字段（`systemSoNo`、`shipmentCode`、`totalPieces`、`weight`、`volumeCbm`、`remark`、`systemPreLocation` 等），再合并本次修改字段，避免部分字段被清空。
- **`addressType`：** 界面「地址」列与此字段对应（业务上可为 FBA 等地址类型/摘要）。
- **`hold` 与 `deliveryMethod`：** 与弹窗逻辑一致——勾选 HOLD 时前端将 **`deliveryMethod` 置为 `hold`**；取消 HOLD 且原派送方式为 `hold` 时 **`deliveryMethod` 置空**（由业务或字典决定后续默认值）；选择非 `hold` 的派送方式时 **`hold` 置为 `false`**。
- **`estimatedPalletCount`：** 行内编辑上述五字段时，前端按 **§16.2** 根据当前 **`volumeCbm`** 重算并一并提交（`ceil(volumeCbm/2)`，`volumeCbm<=0` 时为 `0`）。
- **权限：** 与弹窗一致，建议 **`wms:devanningOrder:inboundPlan:edit`**（或回退 **`wms:devanningOrder:add`**）。
- **导入预览：** 导入流程中「解析并预览」阶段的入库计划表格相同字段仅在前端内存中修改，**确认导入**时写入订单，**不调用本 PUT**。

若后端 **`PUT` 支持部分字段更新**，请明确文档并校验：仅传 `id` + 变更字段是否足够；否则前端已采用 **整行合并提交** 以满足 `@NotBlank` 等校验。

### 16.3 删除明细行

- **URL：** `DELETE /wms/devanning-order/inbound-plan/{ids}`
- **说明：** `{ids}` 为逗号分隔主键（与主表删除风格一致）。

## 17. 动态菜单（RuoYi SQL 示例）

前端路由由 **elegant-router** 生成，浏览器路径为 **`/wms/devanning-order`**。动态菜单模式下请在 **`sys_menu`** 中增加目录与菜单（示例，按贵司规范调整 `menu_id`、`parent_id`、`order_num`、`path`、`component`、`perms`）：

- **一级目录：** 菜单名称 `WMS 仓库管理`，路由 `wms`，组件 `Layout` 或框架约定的一级布局，图标可选 `mdi:warehouse`。
- **子菜单：** 菜单名称 `拆柜订单`，路由 **`devanning-order`**，组件 **`wms/devanning-order/index`**（与 Vue 工程 `views` 路径对应），`perms` 如 `wms:devanningOrder:list`。

（具体 `component` 写法以贵项目 **Vue3 + Vite** 菜单配置为准。）

## 18. 字典初始化 SQL（示例）

以下仅为 **示例**，`dict_id` / `tenant_id` 等请按贵库实际与 RuoYi 规范调整；**租户库**需执行到对应租户数据源。

```sql
-- 字典类型
INSERT INTO sys_dict_type (dict_name, dict_type, status, create_dept, create_by, create_time, remark)
VALUES ('拆柜轮次', 'wms_devanning_round', '0', 103, 1, NOW(), 'WMS 拆柜订单拆柜轮次');

INSERT INTO sys_dict_type (dict_name, dict_type, status, create_dept, create_by, create_time, remark)
VALUES ('订单等级', 'wms_order_level', '0', 103, 1, NOW(), 'WMS 拆柜订单订单等级');

-- 拆柜轮次数据（dict_sort / dict_value 按实际扩展）
INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_dept, create_by, create_time, remark)
VALUES (1, '第一轮', '1', 'wms_devanning_round', '', 'default', 'N', '0', 103, 1, NOW(), NULL);
INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_dept, create_by, create_time, remark)
VALUES (2, '第二轮', '2', 'wms_devanning_round', '', 'default', 'N', '0', 103, 1, NOW(), NULL);
INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_dept, create_by, create_time, remark)
VALUES (3, '第三轮', '3', 'wms_devanning_round', '', 'default', 'N', '0', 103, 1, NOW(), NULL);

-- 订单等级数据（示例）
INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_dept, create_by, create_time, remark)
VALUES (1, 'A级', 'A', 'wms_order_level', '', 'default', 'N', '0', 103, 1, NOW(), NULL);
INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_dept, create_by, create_time, remark)
VALUES (2, 'B级', 'B', 'wms_order_level', '', 'default', 'N', '0', 103, 1, NOW(), NULL);
```

> 若库表字段与 RuoYi-Vue-Plus 版本不一致，请以代码生成器或现有 `sys_dict_*` 为准改写 SQL。

---

**文档版本：** 与前端 `wms/devanning-order` 迭代对齐；字段名如有变更请同步修改 `src/typings/api/wms.api.d.ts` 与 `src/service/api/wms/devanning-order.ts`。
