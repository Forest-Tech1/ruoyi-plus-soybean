# WMS 拆柜订单 · 后端接口对接说明

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

### 2.2 拆柜轮次、订单等级（字典）

与 RuoYi **`sys_dict_type` / `sys_dict_data`** 一致，建议字典类型：

| dict_type             | 说明     | 备注                                                       |
| --------------------- | -------- | ---------------------------------------------------------- |
| `wms_devanning_round` | 拆柜轮次 | `dict_value` 存库、列表与前后端交互；`dict_label` 展示文案 |
| `wms_order_level`     | 订单等级 | 同上                                                       |

前端列表/搜索/新建均使用 **`dict_value`** 作为 `devanningRound`、`orderLevel` 字段值。**请在后端初始化上述字典及字典数据**（示例 SQL 见 §18）。

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
| orderLevel                     | string | 字典 `wms_order_level` 的 `dict_value`；不传或空表示不限     |
| orderByColumn                  | string | 可选                                                         |
| isAsc                          | string | `asc` / `desc`                                               |
| params[orderTimeBegin]         | string | 下单时间起，`yyyy-MM-dd HH:mm:ss`                            |
| params[orderTimeEnd]           | string | 下单时间止                                                   |
| params[devanningCompleteBegin] | string | 拆柜完成时间起                                               |
| params[devanningCompleteEnd]   | string | 拆柜完成时间止                                               |
| params[expectedDevanningBegin] | string | 预计拆柜**日期**区间起；可与前端一致为 `yyyy-MM-dd 00:00:00` |
| params[expectedDevanningEnd]   | string | 预计拆柜**日期**区间止；可与前端一致为 `yyyy-MM-dd 23:59:59` |

**排序（`orderByColumn` + `isAsc`）：**

- 前端列表默认请求 **`orderByColumn=orderDate`**、**`isAsc=desc`**（**下单日期降序**）。
- **建议后端**：当请求 **未带** `orderByColumn`/`isAsc` 或二者为空时，**默认仍按下单日期降序**排序，避免其它客户端直连接口时顺序与页面不一致。
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
| orderDate                  | string      | 下单日期 `yyyy-MM-dd`                           |
| blNo                       | string      | 提单号                                          |
| status                     | string      | 状态枚举                                        |
| devanningCompleteTime      | string      | 可空，拆柜完成时间                              |
| expectedDevanningTime      | string      | 可空，预计拆柜**日期** `yyyy-MM-dd`             |
| inboundWarehouse           | string      | 入库仓库                                        |
| orderLevel                 | string      | 订单等级（字典 `wms_order_level` 的 dictValue） |
| devanningDock              | string      | 拆柜口                                          |
| cargoQty                   | number      | 货物数量                                        |
| cargoWeight                | number      | 货物重量                                        |
| devanningRound             | string      | 可空，字典 `wms_devanning_round` 的 dictValue   |
| remark                     | string      | 备注（可选）                                    |
| createTime / updateTime 等 |             | 与 `BaseEntity` 一致即可                        |

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
- **响应：** 文件流（如 `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`），与现有导出接口一致；前端使用 GET 下载（`useDownload().zip`）。

## 14. 导入订单

前端为 **「多文件 → 解析预览 → 确认落库」**：**每个 Excel 文件对应一条拆柜主单**（单文件内多行入库计划仍按 §14.1）。接口建议如下：

| 接口                                  | 方法                | 说明                                                                                          |
| ------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `/wms/devanning-order/importTemplate` | **POST**（body 空） | 下载导入模板（与 `download()` 调用一致）；**建议列名与业务「派送文件」类 Excel 一致**，见下表 |
| `/wms/devanning-order/import-preview` | **POST**            | **解析预览，不落库**（`multipart`，见 §14.0）                                                 |
| `/wms/devanning-order/import-confirm` | **POST**            | **用户确认后批量写入**（JSON，见 §14.0）                                                      |
| `/wms/devanning-order/importData`     | **POST**            | （可选）旧版单次直传；前端主流程已不再使用                                                    |

- 成功/失败 **`code`** 与 **`msg`** 与全局一致；批量结果说明可用 HTML 放在 `msg`（需注意转义安全）。

### 14.0 两步导入（与前端对齐）

#### A）解析预览 `POST /wms/devanning-order/import-preview`

- **Content-Type：** `multipart/form-data`
- **表单字段：**
  - **`files`**：多文件上传（Spring 可用 `List<MultipartFile>` 接收同名 `files`）。
  - **`updateSupport`**：字符串 `true` / `false`，含义同 §14.4。
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
| Hold                       | 入库计划 **`deliveryMethod`** | 值判定：**若单元格包含子串 `HOLD`（不区分大小写）** → 派送方式为 **`暂扣`**；**否则** → **`卡车派送`**（与前端文案一致，亦可与字典编码映射后再存）                      |

### 14.2 导入时预计打板数

与 **§5** 新建规则一致，**导入写入每条入库计划时**：

\[
\texttt{estimatedPalletCount} = \begin{cases} \lceil \texttt{volumeCbm} / 2 \rceil & \texttt{volumeCbm} > 0 \\ 0 & \text{否则} \end{cases}
\]

### 14.3 主单其它字段

派送文件若 **不含提单号等主表列**，`blNo` 等可由后端 **留空** 或按现有默认策略填充；**`orderDate`** 建议与「新建单」一致为 **导入处理当日** `yyyy-MM-dd`（或由业务指定）。

### 14.4 `updateSupport`

与系统用户导入类似：为 `true` 时 **按业务唯一键更新已存在订单**（唯一键由后端定义，如 `coNo` + 某行标识）；为 `false` 时仅新增。**须避免误覆盖**。

## 15. 权限字符（建议）

与前端 `v-hasPermi` / `useAuth().hasAuth` 对齐（菜单与后端 `@SaCheckPermission` 配置）：

| 权限                                    | 说明                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `wms:devanningOrder:list`               | 列表（菜单可见）                                                         |
| `wms:devanningOrder:query`              | 查询（可与 list 合并）                                                   |
| `wms:devanningOrder:add`                | 新建                                                                     |
| `wms:devanningOrder:edit`               | 编辑主单（列表行内修改；前端在未配置时回退为 `add`）                     |
| `wms:devanningOrder:import`             | 导入                                                                     |
| `wms:devanningOrder:export`             | 导出拆柜单                                                               |
| `wms:devanningOrder:remove`             | 删除                                                                     |
| `wms:devanningOrder:complete`           | 完成拆柜                                                                 |
| `wms:devanningOrder:remark`             | 填写/更新备注                                                            |
| `wms:devanningOrder:cancelComplete`     | 取消拆柜完成                                                             |
| `wms:devanningOrder:markAbnormal`       | 标记异常                                                                 |
| `wms:devanningOrder:cancelAbnormal`     | 取消标记异常                                                             |
| `wms:devanningOrder:inboundPlan:edit`   | 详情-入库计划行修改（可与 `add` 并存；前端在未配置时回退为 `add`）       |
| `wms:devanningOrder:inboundPlan:remove` | 详情-入库计划行删除（可与 `remove` 并存；前端在未配置时回退为 `remove`） |

## 16. 入库计划（拆柜订单详情抽屉）

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
| deliveryMethod       | string      | 派送方式               |
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
