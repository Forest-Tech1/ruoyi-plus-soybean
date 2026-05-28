# 拆柜单 · 系统预库位多分配与出库状态 — 后端对接说明

本文档供后端实现与前端（`ruoyi-plus-soybean`）对齐，涵盖：**导出拆柜单时自动分配预库位**、**入库计划 `systemPreLocation` 存 JSON**、**独立更新接口**、**出库状态字段**、**上架规则匹配与兜底**。

---

## 1. 业务目标

1. 用户导出拆柜单（Excel）时，后端在**同一业务事务**内（推荐）根据上架配置为每条**入库计划**计算**系统预库位**，可对应**多个库位及各自板数**，写入字段 `system_pre_location`（或项目既有列名，与前端 `Api.Wms.DevanningInboundPlan.systemPreLocation` 一致）。
2. 前端列表展示规则：最多展示两行「库位 n：编码（x板）」；若分配超过 2 个库位，**第三行固定为 `....`**（省略号文案与前端 i18n `preLocationMore` 一致即可）。
3. 用户可在入库计划行通过**编辑系统预库位**弹窗维护全部分配（改库位、改板数、删行、增行），保存走**独立接口**（见 §4），避免与普通入库计划整行 `PUT` 混用导致字段被覆盖。
4. 入库计划增加**出库状态**：`pending_outbound`（未出库） / `outbound_done`（已出库）。初始值、何时变为已出库由业务定义（如出库确认、发运单关联等），需在列表接口返回。

---

## 2. `system_pre_location` 存储格式（与前端解析一致）

推荐使用 **JSON 字符串** 存库，结构如下（前端序列化工具：`src/utils/wms-devanning-pre-location.ts`）。

```json
{
  "version": 1,
  "allocations": [
    { "locationCode": "A-01-01", "palletCount": 3 },
    { "locationCode": "B-02-03", "palletCount": 1 }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `version` | number | 当前固定为 `1`，便于以后扩展 |
| `allocations` | array | 有序列表；**顺序影响前端「库位1 / 库位2」展示顺序** |
| `allocations[].locationCode` | string | 库位编码，必填 |
| `allocations[].palletCount` | number | 非负整数板数 |

兼容约定（前端解析）：

- 若整段为 JSON **数组** `[{...}]`，视为 `allocations`。
- 若整段**非 JSON**（历史单行文本），前端视为单个 `locationCode`，`palletCount` 按 `0` 展示。

后端写入时应统一为带 `version` 的对象形式。

---

## 3. 导出拆柜单时自动分配（推荐实现方式）

### 3.1 触发时机

- **推荐**：在现有「导出拆柜单」接口（如 `GET /wms/devanning-order/export/{orderId}`）处理流程中，在生成 Excel 流**之前**完成分配并落库，保证用户打开文件时库内数据已一致。
- **可选**：若导出与写库必须解耦，可增加 `POST /wms/devanning-order/{orderId}/allocate-pre-location` 由网关或前端在导出前调用；需保证**幂等**与**与导出顺序**的文档说明，避免重复分配。

前端行为：导出成功后刷新列表；若详情抽屉已打开同一订单，会递增 `inboundReloadNonce` 触发入库计划 Tab 重新请求列表（见前端实现）。

### 3.2 分配输入（建议后端使用的维度）

对拆柜订单下**每条入库计划行**（含 `warehouse_code`、`platform`、`shipment_code`、`volume_cbm`、`estimated_pallet_count` 等现有字段），结合**上架配置（putaway rule）**匹配目标库位集合，再将**预计板数**拆分为多条 `allocations`（多库位、每库位板数）。

具体匹配规则由仓储业务定义，建议至少包含：

1. **规则来源**：读取「上架配置」中与当前货物/仓库/平台/库区类型等条件匹配的规则（与现有上架配置模块一致）。
2. **多库位拆分**：当单库位容量或规则限定单库位最大板数时，按优先级依次填满多个库位，生成多条 `{ locationCode, palletCount }`。
3. **兜底**：若**无任何规则命中**或**无可用库位**：
   - 写入空数组 `{"version":1,"allocations":[]}`，或
   - 写入配置的**默认兜底库位**（如系统参数 `wms.devanning.prelocation.fallback_location_code`），`palletCount` 取该行 `estimated_pallet_count` 或按体积规则计算；
   - 须在接口日志或业务字段中可追踪「兜底触发」，便于运营排查。

### 3.3 幂等与重导出

同一订单多次导出：若业务要求「仅首次分配、后续不覆盖人工编辑」，可增加行级标记 `pre_location_locked`；否则每次导出按规则重算并覆盖（需产品确认）。文档建议默认：**导出时总是重算并覆盖**，除非行已被人工锁定。

---

## 4. 独立接口：仅更新系统预库位

与前端 `fetchUpdateDevanningInboundPlanSystemPreLocation` 对齐。

| 项 | 值 |
|----|-----|
| Method | `PUT` |
| URL | `/wms/devanning-order/inbound-plan/system-pre-location` |
| Content-Type | `application/json` |

**Body**

```json
{
  "id": 123456789,
  "orderId": 987654321,
  "systemPreLocation": "{\"version\":1,\"allocations\":[{\"locationCode\":\"A-01\",\"palletCount\":2}]}"
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | 是 | 入库计划行主键 |
| `orderId` | 建议必填 | 与路径/订单一致性校验，防止越权改他单明细 |
| `systemPreLocation` | 是 | 符合 §2 的 JSON 字符串；允许 `allocations` 为空数组表示清空 |

**响应**：与项目统一 `AjaxResult` / `R<?>` 风格一致即可。

**权限**：建议权限字符 `wms:devanningOrder:inboundPlan:edit`（与现有入库计划编辑一致）或单独细分 `wms:devanningOrder:inboundPlan:preLocation:edit`。

---

## 5. 入库计划列表 / 详情接口扩展

在 `GET .../inbound-plan/list`（及任何返回入库计划行的接口）中增加或对齐：

| 字段 | 类型 | 说明 |
|------|------|------|
| `systemPreLocation` | string | §2 JSON；导出分配后更新 |
| `outboundStatus` | string | `pending_outbound` \| `outbound_done`；缺省时前端按未出库展示 |

若后端使用 `snake_case`，请同时返回 `outbound_status`（前端已做兼容映射）。

---

## 6. 出库状态变更（后端职责说明）

前端当前**仅展示**出库状态，不提供行内切换。后端需在合适业务节点更新 `outbound_status`，例如：

- 出库单确认 / 发运完成回调；
- 与 WMS 出库流水对接后的定时任务。

请在接口文档或字典中说明状态流转，便于后续前端增加「标记已出库」等操作。

---

## 7. 校验与安全

1. `orderId` + `id` 联合校验：行必须属于该拆柜订单。
2. `locationCode`：建议校验存在于主数据库位表且状态可用（与上架规则目标库位一致）。
3. `palletCount`：非负整数；可选校验各行之和与 `estimated_pallet_count` 关系（警告或强制，由产品定）。
4. 租户隔离：与现有拆柜订单接口一致。

---

## 8. 前端参考路径（便于联调）

| 用途 | 路径 |
|------|------|
| 解析/序列化 JSON | `src/utils/wms-devanning-pre-location.ts` |
| 更新预库位请求 | `src/service/api/wms/devanning-order.ts` → `fetchUpdateDevanningInboundPlanSystemPreLocation` |
| 入库计划 Tab UI | `src/views/wms/order/devanning-order/modules/devanning-order-inbound-plan-tab.vue` |
| 编辑弹窗 | `src/views/wms/order/devanning-order/modules/devanning-order-inbound-pre-location-modal.vue` |
| 平面图多选弹窗 | `src/views/wms/order/devanning-order/modules/devanning-order-pre-location-map-picker-modal.vue` |
| 类型 | `src/typings/api/wms.api.d.ts` → `DevanningInboundPlan`、`DevanningInboundPlanOutboundStatus` |

---

## 9. 验收清单（建议）

- [ ] 导出拆柜单后，入库计划 `systemPreLocation` 为合法 JSON，且与上架规则 / 兜底一致。
- [ ] 列表接口返回 `outboundStatus`（或 snake_case 兼容）。
- [ ] `PUT .../system-pre-location` 可增删改分配，刷新后前端展示与库内一致。
- [ ] 超过 2 个库位时，前端第三行为 `....`（由数据顺序保证前两行对应库位 1、2）。

如有字段命名与现有库表不一致，请在后端适配层统一映射为上述 JSON 与枚举值，前端无需再改解析逻辑。

---

## 10. 入库计划「编辑系统预库位」— 平面图多选（前端交互，接口无变更）

前端在 **`编辑系统预库位`** 弹窗中点击 **「新增库位行」** 时，打开嵌套弹窗 **`devanning-order-pre-location-map-picker-modal`**，展示与 **仓库库存可视化**（`/wms/order/warehouse-inventory-map`）同一数据源的库位平面图风格（分段、编码排序、占用色阶），支持：

- 按库区筛选库位列表；
- 点击格子 **多选/取消** 库位，默认每处 **1 板**，可在已选列表中修改板数；
- 顶部文案汇总示例：`已选中：库位：A01，5板，库位：A02，3板`（格式随 i18n）；
- **确定** 后将所选 `locationCode` / `palletCount` 行合并入主弹窗列表（若列表已有同编码库位则 **板数相加**），用户再点主弹窗 **保存** 仍仅调用 §4 **`PUT .../system-pre-location`**。

**后端无需新增接口**。请保证：

1. **`GET /wms/inventory/location/list`** 可返回足够条数（如 `pageSize`≥5000）、含 `zoneCode`、`locationCode`、`capacity`、`currentStock`、`remainingCapacity` 等，与 [wms-warehouse-inventory-visual-map-api.md](./wms-warehouse-inventory-visual-map-api.md) 一致。
2. **`PUT .../system-pre-location`**（§4）继续校验 `locationCode` 合法性、租户与订单行归属等与 §7 一致。

若列表接口分页上限不足，需后端提高上限或提供平面图专用列表接口——属 **既有接口能力** 增强，不改变 §2 JSON 与 §4 契约。
