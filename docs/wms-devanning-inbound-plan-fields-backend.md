# 拆柜订单 · 入库计划字段约定变更（后端对接）

**适用版本：** 与前端拆柜订单「入库计划」Tab / 导入预览的行编辑迭代对齐。

**文档目的：** 说明 **`platform`、`warehouseCode`、`addressType`** 三个字段的**语义与校验**变更，供后端（实体、校验、导入解析、详情/列表接口）同步修改。

**关联主文档：** `docs/wms-devanning-order-api.md`（§16 入库计划）；**基础数据：** `docs/basic-platform-warehouse-api.md`（平台代码、平台下仓库）。

---

## 1. 变更摘要

| 字段 | 原先（宽松理解） | 现行约定 |
| ---- | ---------------- | -------- |
| `platform` | 任意文本「平台名称」 | **优先存「平台代码」** `platformCode`，与 **`/basic/platform`** 维护的平台主数据对齐；存量可为历史自由文本 |
| `warehouseCode` | 任意文本 | **未选平台 / 无法解析平台时**：允许自由文本；**已关联有效平台时**：应为该平台下 **`/basic/warehouse`** 仓库主数据中的 **`warehouseCode`** |
| `addressType` | 任意文本（曾出现「地址」列与 FBA 等混用） | **枚举**：仅允许 **`commercial`**（商业地址）、**`private`**（私人地址）；或 **空** |

前端展示：  
- 平台：下拉来自 **`GET /basic/platform/list`**（启用 `status=0`），提交值使用 **`platformCode`**。  
- 仓库：仅当 `platform` 能匹配到平台主数据时，下拉来自 **`GET /basic/warehouse/list`**（按 `platformId` 过滤）；否则输入框手输。  
- 地址类型：下拉两项，对应上表枚举值。

---

## 2. 字段详细说明

### 2.1 `platform`

- **含义：** 电商平台 / 销售渠道侧标识；**与新数据写入规范一致时应为 `platformCode`**（与基础数据 `Platform.platformCode` 一致，通常大写 alphanumeric）。
- **兼容：** 历史数据可能存在 **平台名称** 或非标准字符串；后端 **读接口** 应继续原样返回；**校验策略**可采用「能按 code 或 name 命中则视为有效平台」，与前端 `findPlatformByCodeOrName` 逻辑对齐（按需服务端复用一套工具方法）。
- **写入建议（`POST` 主单+明细、`PUT` 明细行、导入确认）：**
  - 若入参为非空字符串：可选校验其是否等于某启用平台的 `platformCode`，或历史上允许的别名映射；**无效值策略**：拒绝（400 + 明确文案）或 **允许落库但标记/日志**（由产品定）。
  - 清空：传 `null` / 省略按既有「部分更新」约定处理。

### 2.2 `warehouseCode`

- **含义：** 物理仓 / 派送仓代码。
- **规则：**
  - 当 **`platform` 可解析到有效平台 ID** 时：`warehouseCode` **建议强校验**：必须存在于 **`basic` 模块该平台下的仓库列表**（与 `platformId` + `warehouseCode` 联合唯一语义一致）。
  - 当 **`platform` 为空或无法解析** 时：`warehouseCode` **允许任意非空字符串**（业务上手输），**不要求**存在于仓库主数据。
- **联动：** 当前端或调用方 **修改 `platform`** 时，应 **清空 `warehouseCode`**（避免跨平台仓库串库）；后端若收到「平台变更但仓库仍为旧平台下的代码」，应 **拒绝或自动清空**（推荐与前端一致：**清空并校验**）。

### 2.3 `addressType`

- **含义：** **地址类型**（不是详细地址文本）。
- **允许值（建议 DB 层 CHECK 或 Java 枚举）：**

| 值 | 含义 |
| --- | --- |
| `commercial` | 商业地址 |
| `private` | 私人地址 |
| `null` / 空字符串 | 未填写（若业务允许） |

- **迁移：** 历史数据中若为「FBA」、中文描述等自由文本，建议：
  - **离线脚本 / 一次性迁移** 映射到 `commercial`/`private`；无法映射的 **保留原值** 或置空 + 备份字段（由业务定）。
  - **接口层**：新写入 **拒绝** 非枚举值（400），避免继续污染。

---

## 3. 受影响的接口（建议逐项自查）

以下为拆柜订单域常见接口；**凡请求/响应体包含入库计划行且含上述三字段者**，均需对齐约定。

| 场景 | 说明 |
| ---- | ---- |
| `POST /wms/devanning-order` | 新建主单 + `inboundPlans[]` |
| `PUT /wms/devanning-order` | 修改主单（若携带入库计划数组） |
| `GET …/inbound-plan` 分页列表 | `rows[].platform`、`warehouseCode`、`addressType` 返回形态不变，**语义按上文** |
| `PUT /wms/devanning-order/inbound-plan` | 单行更新：校验与联动 |
| 导入：**解析预览** | 后端返回的预览 JSON 中同上字段建议已是合法枚举 / code |
| 导入：**确认落库** | 与新建/修改同一套校验 |
| Excel 导出拆柜单 | 若导出「平台/仓库/地址类型」列，展示 **码 + 文案** 由产品定；**落库仍以码为准** |

**无新增 URL**；均为既有路径上 **校验与语义加强**。

---

## 4. 校验建议（服务端）

1. **`addressType`**：`null` 或 ∈ {`commercial`,`private`}；否则 **400**，`msg` 指明允许值。
2. **`platform` + `warehouseCode`：**
   - 解析出 `platformId` 后，校验 `warehouseCode` 属于该平台的仓库列表；失败时 **400**（如「仓库代码与所选平台不匹配」）。
   - `platform` 为空或不可解析：**不**做仓库主数据存在性校验（仅长度/非空等业务规则）。
3. **更新 `platform`：** 若新 `platform` 与旧值不同，**忽略请求中的旧 `warehouseCode`** 或要求必须重选（与前端「切换平台清空仓库」一致）。

---

## 5. 与基础数据模块的依赖

| 能力 | 接口（与前端一致） |
| ---- | ------------------ |
| 平台全量列表 | `GET /basic/platform/list`（启用平台） |
| 某平台下仓库分页 | `GET /basic/warehouse/list`，Query 含 `platformId` 等 |

拆柜订单服务若做强校验，可 **Feign / 本地 Service** 查询上述主数据，或 **复用现有 basic 模块的校验器**。

---

## 6. OpenAPI / 文档维护

- 在 swagger/Apifox 中为入库计划行 model 标注：
  - `platform`：示例用 `AMZ` 等 **platformCode**；
  - `addressType`：enum `commercial` | `private`；
  - `warehouseCode`：说明「有平台时必须为平台下仓库代码」。
- 主文档 `wms-devanning-order-api.md` §16 示例 JSON 建议同步将 `addressType` 从示例 `FBA` 改为 **`commercial`** 或 **`private`**，避免与枚举冲突。

---

## 7. 数据库（可选）

- `address_type` 列：VARCHAR，建议约束为枚举或迁移后缩窄长度。  
- 无需为 `platform` 单独建 FK 到 `basic_platform`（仅存 code 字符串即可），除非产品要求强引用。

---

**文档版本：** 1.0 · 入库计划字段约定与前端 `useDevanningInboundPlanFields` / 行编辑行为对齐。
