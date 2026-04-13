# 基础数据 — 平台仓库管理（后端接口说明）

本文档与前端页面 **`/basic/platform-warehouse`**（视图组件 `basic/platform-warehouse/index`）对齐，供后端实现平台主数据、平台下仓库、导出与图标上传。

统一响应与若依一致：`code`、`msg`、`data`；分页列表 `data.rows`、`data.total`、`data.pageNum`（与前端 `defaultTransform` 一致）。

---

## 1. 菜单与路由（`sys_menu`）

| 层级 | 菜单名称（示例） | `path`               | `component`                          | 说明                                    |
| ---- | ---------------- | -------------------- | ------------------------------------ | --------------------------------------- |
| 一级 | 基础数据         | `basic`              | `Layout` 或框架约定的一级目录组件    | 与动态路由父级一致                      |
| 二级 | 平台仓库管理     | `platform-warehouse` | **`basic/platform-warehouse/index`** | 勿写成 `basic_platform-warehouse/index` |

前端路由名：`basic_platform-warehouse`；`i18nKey`：`route.basic`、`route.basic_platform-warehouse`（文案已在 `zh-cn` / `en-us` 维护）。

---

## 2. 字典与枚举

| 用途                 | 说明                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| `sys_normal_disable` | 复用系统字典：`0` 正常（启用）、`1` 停用；平台、仓库状态均用此约定。 |

**国家代码**：ISO 3166-1 alpha-2（如 `US`、`CN`），与前端常量一致即可。

### 2.1 已废弃：`platformType`（平台类型）

前端 **已删除「平台类型」字段**，请求与展示均不再使用。

**请后端同步：**

| 项                                | 说明                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| **POST/PUT `/basic/platform`**    | 请求体 **不要** 再要求 `platformType`；若仍收到该字段可 **忽略**。                                  |
| **GET `/basic/platform/list` 等** | 响应 **可不返回** `platformType`；若暂时仍返回，前端会忽略。                                        |
| **数据库**                        | 若有 `platform_type` 列，可按团队规范 **删列**、**弃用** 或保留仅作历史数据，**勿再作为业务必填**。 |

---

## 3. 权限标识（与前端 `hasAuth` 对齐）

建议列表/查询单独拆权限，便于菜单「页面访问」与按钮分离（前端未全部写 `hasAuth`，但后端接口应校验）。

### 3.1 平台 `basic:platform:*`

| 权限字符                | 说明                                     |
| ----------------------- | ---------------------------------------- |
| `basic:platform:list`   | **GET** 平台列表（建议页面进入即需）     |
| `basic:platform:add`    | 新增平台                                 |
| `basic:platform:edit`   | 编辑平台                                 |
| `basic:platform:status` | 启停平台                                 |
| `basic:platform:upload` | 图标上传（可与 `edit` 合并，二选一即可） |

### 3.2 仓库 `basic:warehouse:*`

| 权限字符                 | 说明                 |
| ------------------------ | -------------------- |
| `basic:warehouse:list`   | **GET** 仓库分页列表 |
| `basic:warehouse:query`  | **GET** 仓库详情     |
| `basic:warehouse:add`    | 新增仓库             |
| `basic:warehouse:edit`   | 编辑仓库             |
| `basic:warehouse:status` | 单条启停、批量启停   |
| `basic:warehouse:export` | 导出 Excel           |

---

## 4. 领域模型（JSON 驼峰）

### 4.1 平台 `Platform`

| 字段             | 类型     | 必填 | 说明                                                              |
| ---------------- | -------- | ---- | ----------------------------------------------------------------- |
| `id`             | Long     | —    | 主键                                                              |
| `platformName`   | String   | 是   | 中文名称，≤30                                                     |
| `platformCode`   | String   | 是   | 大写字母+数字，3～10 位，**全局唯一**；新增后可写，**编辑不可改** |
| `iconUrl`        | String   | 否   | 图标访问 URL                                                      |
| `status`         | String   | 是   | `0` / `1`                                                         |
| `remark`         | String   | 否   | ≤200                                                              |
| `warehouseCount` | Integer  | 否   | **列表接口建议返回**：该平台下仓库总数（用于左侧角标）            |
| `createTime` 等  | DateTime | —    | 若依通用字段按需返回                                              |

### 4.2 仓库 `PlatformWarehouse`

| 字段            | 类型     | 必填 | 说明                                                        |
| --------------- | -------- | ---- | ----------------------------------------------------------- |
| `id`            | Long     | —    | 主键                                                        |
| `platformId`    | Long     | 是   | 所属平台                                                    |
| `warehouseCode` | String   | 是   | 大写字母、数字、连字符，1～20，**全局唯一**；**编辑不可改** |
| `warehouseName` | String   | 是   | ≤100                                                        |
| `countryCode`   | String   | 是   | ISO2                                                        |
| `countryName`   | String   | 否   | 列表可冗余展示                                              |
| `stateProvince` | String   | 否   | 美国可为州代码或名称；其他国家文本                          |
| `city`          | String   | 否   | ≤100                                                        |
| `addressLine`   | String   | 是   | 街道地址，≤200                                              |
| `postalCode`    | String   | 否   | ≤20                                                         |
| `status`        | String   | 是   | `0` / `1`                                                   |
| `remark`        | String   | 否   | ≤200                                                        |
| `createTime`    | DateTime | —    | 列表默认按创建时间 **倒序**                                 |

### 4.3 操作记录 `WarehouseOperateLog`（详情可选）

| 字段              | 类型     | 说明                       |
| ----------------- | -------- | -------------------------- |
| `id`              | Long     | 主键                       |
| `operateUserName` | String   | 操作人                     |
| `operateTime`     | DateTime | 操作时间                   |
| `changeSummary`   | String   | 变更摘要（如「状态 0→1」） |

---

## 5. 平台 API

**基础路径**：`/basic/platform`

### 5.1 平台列表（全量，不分页）

- **GET** `/basic/platform/list`
- **权限**：`basic:platform:list`
- **响应 `data`**：`Platform[]`
- **排序**：可按名称或创建时间，前端无强制要求。

**可选 Query（后端按需实现，非当前前端必依赖）**

| 参数      | 说明                                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| `keyword` | 对 `platformName`、`platformCode` **模糊**过滤（大小写不敏感建议仅对代码段生效）。 |

> **说明**：当前前端在左侧平台列表顶部使用 **本地模糊筛选**（名称子串 + 代码子串），**不传递** `keyword`。若未来平台数量很大、改为服务端分页/搜索，再启用本参数并同步改前端。

### 5.2 新增平台

- **POST** `/basic/platform`
- **权限**：`basic:platform:add`
- **Body**：`PlatformOperateParams`（无 `id` 或 `id` 为空）
- **校验**：`platformCode` 唯一；字段长度见 §4.1。

### 5.3 修改平台

- **PUT** `/basic/platform`
- **权限**：`basic:platform:edit`
- **Body**：含 `id`；**忽略或拒绝修改 `platformCode`**。

### 5.4 启停平台

- **PUT** `/basic/platform/{id}/status`
- **权限**：`basic:platform:status`
- **Body**：`{ "status": "0" | "1" }`
- **业务**：停用平台前，前端会先调 §5.5；后端仍应保证：**停用平台时同步将该平台下所有仓库置为停用**，且后续业务下拉中不展示该平台及下属启用仓库（仅展示逻辑由业务模块查询条件保证）。

### 5.5 停用平台前检查

- **GET** `/basic/platform/{id}/disable-check`
- **权限**：`basic:platform:status`（或与 list 同级）
- **响应 `data`**：

```json
{ "activeWarehouseCount": 0 }
```

`activeWarehouseCount`：当前 **状态为启用（`0`）** 的仓库数量；大于 0 时前端弹出二次确认文案。

### 5.6 平台图标上传

- **POST** `/basic/platform/upload-icon`
- **权限**：`basic:platform:upload` 或 `basic:platform:edit`
- **Content-Type**：`multipart/form-data`，字段名 **`file`**
- **响应 `data`**：字符串，为可访问的 **图标 URL**（若返回对象，需与前端约定；当前前端按 **字符串 URL** 解析）。

---

## 6. 仓库 API

**基础路径**：`/basic/platform-warehouse`

### 6.1 分页列表

- **GET** `/basic/platform-warehouse/list`
- **权限**：`basic:warehouse:list`
- **Query**（在若依分页参数基础上）：

| 参数            | 说明                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| `pageNum`       | 页码                                                                                                        |
| `pageSize`      | 每页条数                                                                                                    |
| `platformId`    | **必填**，当前选中的平台                                                                                    |
| `keyword`       | 可选；仓库代码、名称 **模糊**                                                                               |
| `status`        | 可选；`0` / `1`；**不传或空表示全部**                                                                       |
| `countryCodes`  | 可选；**多选**：重复键 `countryCodes=US&countryCodes=CN` 或逗号分隔（需与全局参数解析一致，**推荐重复键**） |
| `orderByColumn` | 可选；建议白名单：`createTime`                                                                              |
| `isAsc`         | 可选；**默认**：`createTime` **desc**                                                                       |

- **响应 `data`**：`{ rows, total, pageNum }`

### 6.2 仓库详情（含操作记录）

- **GET** `/basic/platform-warehouse/{id}`
- **权限**：`basic:warehouse:query`
- **响应 `data`**：`PlatformWarehouse` + `operateLogs?: WarehouseOperateLog[]`（无则空数组或省略）。

### 6.3 新增仓库

- **POST** `/basic/platform-warehouse`
- **权限**：`basic:warehouse:add`
- **Body**：`PlatformWarehouseOperateParams`（无 `id`）
- **`platformId`**：**必填**，由用户在表单中 **手动选择** 目标平台并随请求提交；后端须校验平台存在、归属有效（若停用平台不允许再挂新仓，请在此返回明确错误）。

### 6.4 修改仓库

- **PUT** `/basic/platform-warehouse`
- **权限**：`basic:warehouse:edit`
- **Body**：含 `id`；**不可改 `warehouseCode`**。
- **`platformId`**：前端 **编辑时锁定所属平台**（不允许改为其他平台）。后端 **建议校验**：若 body 中 `platformId` 与数据库中该仓库已有 `platformId` **不一致**，返回 **400** 或直接 **忽略该字段**，避免误把仓库迁移到其他平台；请勿静默接受跨平台变更除非有单独业务审批流。

### 6.5 单条启停

- **PUT** `/basic/platform-warehouse/{id}/status`
- **权限**：`basic:warehouse:status`
- **Body**：`{ "status": "0" | "1" }`

### 6.6 批量启停

- **PUT** `/basic/platform-warehouse/status/batch`
- **权限**：`basic:warehouse:status`
- **Body**：

```json
{ "ids": [1, 2, 3], "status": "0" }
```

### 6.7 导出当前平台仓库 Excel

- **GET** `/basic/platform-warehouse/export`
- **权限**：`basic:warehouse:export`
- **Query**（与列表筛选一致，前端当前传参）：

| 参数                   | 说明                                                        |
| ---------------------- | ----------------------------------------------------------- |
| `platformId`           | 必填                                                        |
| `pageNum` / `pageSize` | 可选；若后端导出**全量**可忽略，建议文档说明实际行为        |
| `keyword`              | 可选                                                        |
| `status`               | 可选                                                        |
| `countryCodes`         | 可选；前端使用 **逗号拼接** 单参数，如 `countryCodes=US,CN` |

- **响应**：文件流，`Content-Disposition` 附件；文件名由前端生成。

---

## 7. 业务规则摘要（后端需落地）

1. **不允许删除平台**：仅停用；历史关联保留。
2. **停用平台**：可同步停用其下全部仓库；业务模块下拉过滤停用平台及其仓库。
3. **停用仓库**：历史单据保留快照；下拉不可再选。
4. **平台代码 / 仓库代码** 全局唯一；编辑接口禁止改代码字段。
5. **新增仓库** 的 `platformId` 必须由请求体显式传入并校验；**编辑仓库** 不允许变更所属平台（与 §6.4 一致）。
6. 左侧 **平台列表搜索** 当前为前端本地过滤，**不调用** §5.1 的 `keyword` 参数。
7. 列表、导出、权限与 **租户**、数据权限策略与现有若依模块一致。

---

## 8. 前端调用索引（便于联调）

| 方法 | 路径                                     | 函数（`src/service/api/basic/platform-warehouse.ts`） |
| ---- | ---------------------------------------- | ----------------------------------------------------- |
| GET  | `/basic/platform/list`                   | `fetchGetPlatformList`                                |
| POST | `/basic/platform`                        | `fetchCreatePlatform`                                 |
| PUT  | `/basic/platform`                        | `fetchUpdatePlatform`                                 |
| PUT  | `/basic/platform/{id}/status`            | `fetchUpdatePlatformStatus`                           |
| GET  | `/basic/platform/{id}/disable-check`     | `fetchGetPlatformDisableCheck`                        |
| POST | `/basic/platform/upload-icon`            | `fetchUploadPlatformIcon`                             |
| GET  | `/basic/platform-warehouse/list`         | `fetchGetPlatformWarehouseList`                       |
| GET  | `/basic/platform-warehouse/{id}`         | `fetchGetPlatformWarehouseDetail`                     |
| POST | `/basic/platform-warehouse`              | `fetchCreatePlatformWarehouse`                        |
| PUT  | `/basic/platform-warehouse`              | `fetchUpdatePlatformWarehouse`                        |
| PUT  | `/basic/platform-warehouse/{id}/status`  | `fetchUpdatePlatformWarehouseStatus`                  |
| PUT  | `/basic/platform-warehouse/status/batch` | `fetchBatchPlatformWarehouseStatus`                   |
| GET  | `/basic/platform-warehouse/export`       | `useDownload` 直链                                    |

如有字段名或路径变更，请同步修改前端 `platform-warehouse.ts` 与 `basic.api.d.ts`。
