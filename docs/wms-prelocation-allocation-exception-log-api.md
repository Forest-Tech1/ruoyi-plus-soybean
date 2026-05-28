# 仓库设置 · 系统预库位分配异常日志 — 后端对接说明

本文档供后端实现与前端（`ruoyi-vue-plus-soybean`）对齐，对应页面：

- 路由：`/wms/warehouse/settings/prelocation-exception-log`
- 源码：`src/views/wms/warehouse/settings/prelocation-exception-log/index.vue`
- 请求封装：`src/service/api/wms/prelocation-allocation-exception-log.ts`

业务含义：在 **导出拆柜单 / 系统预库位自动分配**（参见 [wms-devanning-order-prelocation-api.md](./wms-devanning-order-prelocation-api.md)）过程中，若某条 **入库计划行** 无法按规则完成预分配或进入兜底策略，写入一条 **异常日志**，供仓储在「预分配异常日志」页检索与追溯。

---

## 1. 分页列表接口（必选）

| 项 | 值 |
|----|-----|
| Method | `GET` |
| URL | **`/wms/warehouse/prelocation-allocation-exception-log/list`** |

### 1.1 查询参数（Query）

与项目通用分页一致：`pageNum`、`pageSize`、`orderByColumn`、`isAsc`。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pageNum` | number | 是 | 页码，从 1 开始 |
| `pageSize` | number | 是 | 每页条数 |
| `orderByColumn` | string | 否 | 前端默认传 **`createTime`**（日志产生时间排序） |
| `isAsc` | string | 否 | `asc` / `desc`；前端默认 **`desc`**（最新在前） |
| `orderNo` | string | 否 | **订单号** 模糊查询；应对齐入库计划行展示用的「订单号」（一般为 **`system_so_no` / systemSoNo**） |
| `coNo` | string | 否 | **柜号** 模糊查询；拆柜订单主表 **`co_no`** |
| `shipmentCode` | string | 否 | **货件编码** 模糊查询 |
| `exceptionType` | string | 否 | **异常类型**，精确匹配字典 **`wms_prelocation_allocation_exception_type`** 的 `dictValue`（与前端 `DictSelect` 一致） |
| `exceptionReasonKeyword` | string | 否 | **异常原因** 关键字模糊查询 |

**日期范围（与 RuoYi 约定一致）**：通过嵌套对象 **`params`** 传递（若后端框架使用扁平化 `beginTime`/`endTime`，请二选一兼容）。

| 路径 | 说明 |
|------|------|
| `params[beginTime]` | 记录时间起始（含），格式建议 `yyyy-MM-dd HH:mm:ss` |
| `params[endTime]` | 记录时间结束（含），格式建议 `yyyy-MM-dd HH:mm:ss` |

> 说明：列表行的「记录时间」使用实体 **`createTime`**（日志写入时间）。筛选应对 **`create_time`** 列。

### 1.2 响应 `rows[]` 单条字段（与前端 `Api.Wms.PrelocationAllocationExceptionLog` 对齐）

建议返回 **camelCase**（与现有 WMS 接口一致）；若仅返回 snake_case，请在后端统一配置 Jackson / MyBatis 映射为驼峰，或另行约定前端兼容层。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | long/string | 是 | 日志主键 |
| `devanningOrderId` | long | 否 | 拆柜订单 id；便于跳转订单详情 |
| `inboundPlanId` | long | 否 | 入库计划行 id |
| `orderNo` | string | 否 | **订单号**（与入库计划列表「订单号」同一语义，通常来自 **`system_so_no`**） |
| `coNo` | string | 否 | **柜号**（来自拆柜订单 **`co_no`**） |
| `shipmentCode` | string | 否 | **货件编码** |
| `estimatedPalletCount` | number | 否 | **预计打板数**（与入库计划行一致） |
| `exceptionType` | string | 否 | **异常类型**（字典 `wms_prelocation_allocation_exception_type` 的 `dictValue`） |
| `exceptionReason` | string | 否 | **异常原因**（可读长文本） |
| `createTime` | string | 是 | **记录时间**（日志创建时间） |
| `createBy` / `updateBy` / `updateTime` | string | 否 | 若继承基类字段，可按项目惯例返回 |

响应分页外壳：与现有模块一致，`total` + `rows`。

---

## 2. 字典：`wms_prelocation_allocation_exception_type`

前端表格「异常类型」列使用 **`DictTag`** + 字典编码 **`wms_prelocation_allocation_exception_type`**。

请在 `sys_dict_type` / `sys_dict_data` 中维护类型与数据项（示例值仅供产品命名参考，可按业务调整）：

| dictValue（示例） | dictLabel（示例） |
|-------------------|-------------------|
| `no_matching_rule` | 未命中上架规则 |
| `no_available_location` | 无可用库位 |
| `capacity_insufficient` | 库位容量不足 |
| `fallback_applied` | 已使用兜底库位 |
| `data_incomplete` | 入库计划数据不全 |

---

## 3. 权限与菜单（建议）

| 项 | 建议值 |
|----|--------|
| 权限字符 | `wms:prelocationAllocationExceptionLog:list`（列表查询）；若仅只读日志，可只配此权限 |
| 菜单类型 | 菜单 |
| 路由地址 | `/wms/warehouse/settings/prelocation-exception-log` |
| 组件路径 | `wms/warehouse/settings/prelocation-exception-log/index`（按若依 Vue 插件填写规则与本地路径对齐） |

前端当前页面 **无新增/删除按钮**，仅需列表权限即可展示。

---

## 4. 写入时机（后端职责说明）

下列时机建议 **插入日志表**（具体表名由后端定义）：

1. **自动分配预库位**流程中判定异常（无规则、无库位、容量不足、强制兜底等）。
2. 可与「导出拆柜单触发分配」在同一事务或异步补偿任务中写入；需保证 **`orderNo` / `coNo` / `shipmentCode` / `estimatedPalletCount`** 与当时入库计划行快照一致，便于事后审计。

---

## 5. 关联文档

- [wms-devanning-order-prelocation-api.md](./wms-devanning-order-prelocation-api.md) — 预库位 JSON、分配与兜底
- [wms-putaway-rule-api.md](./wms-putaway-rule-api.md) — 上架规则（若单独存在）
