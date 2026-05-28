# WMS 园区调度 × 拆柜订单 — 前端实现补充（v2）

> **给后端开发请优先阅读**：**[`docs/wms-backend-park-devanning-handoff.md`](./wms-backend-park-devanning-handoff.md)**（Dock 双写、批量部分成功、统一 `expectedDevanningTime`、历史迁移、检查清单）。  
> **架构变更**：`wms_park_scheduling_task`（园区调度任务表）**弃用**。拆柜类调度数据全部落在 **`wms_devanning_order`（拆柜订单）** 上；园区看板、侧栏、拖拽、排队等接口 **URL 保持不变**，由后端从拆柜订单组装原 `ParkSchedulingTask` / 看板结构。  
> **装车任务**（`taskType=loading`）若尚未有独立业务表，可暂保留旧表或另表，本文档以 **拆柜** 为主。

前端实现目录：`src/views/wms/order/park-scheduling`、`src/constants/wms-park.ts`、`src/service/api/wms/park-scheduling.ts`。

---

## 1. 拆柜订单表新增/调整字段

| 库字段建议 | JSON 字段 | 类型 | 说明 |
| ---------- | --------- | ---- | ---- |
| `order_level` | `orderLevel` | **数字**，可空 | 订单等级（用户输入，不限 1/2/3） |
| `devanning_status` | `devanningStatus` | varchar | **拆柜状态**（到仓/排队/作业，与原园区任务 `status` 一致）：`pending` \| `not_arrived` \| `queued` \| `in_progress` \| `completed` |
| `dock_id` | `dockId` | bigint，可空 | 指派园区 Dock 主键（`wms_park_dock.id`） |
| `devanning_dock` | `devanningDock` | string，可空 | **拆柜口**（与 Dock 槽位名 `slot_name` 一致；**不要**在订单表另增 `dock_name`） |
| `devanning_round` | `devanningRound` | varchar | 拆柜轮次，字典 `wms_devanning_round` 的 `dict_value` |
| `queue_position` | `queuePosition` | int，可空 | Dock 排队序号（从 1；当前作业可为 0 或不返） |
| `scheduling_remark` | `schedulingRemark` 或复用 `remark` | string | 园区新建任务备注（若与订单备注拆分） |

**业务订单状态 `status`**（`pending_schedule` / `pending_devanning` / `completed` / `abnormal`）**保持不变**，与 **拆柜状态 `devanningStatus`** 分离。

### 1.1 导入海柜订单默认值

`POST /wms/devanning-order/import-confirm`（及各类 import-preview 落库）生成的新拆柜订单建议默认：

| 字段 | 默认值 |
| ---- | ------ |
| `devanningStatus` | `not_arrived` |

（与前端常量 `DEVANNING_DEFAULT_STATUS` 一致。）

### 1.2 列表/详情/修改

- `GET /wms/devanning-order/list`、`GET /wms/devanning-order/{id}`：**必须回传** 上表调度相关字段。
- `PUT /wms/devanning-order`：允许修改 `orderLevel`（数字）、`devanningStatus`、`devanningDock`、`devanningRound`、`dockId`、`expectedDevanningTime` 等（权限与业务状态由后端收口）。

---

## 2. 园区调度接口（拆柜 — 写拆柜订单）

### 2.1 批量「新建任务」= 按柜号更新拆柜订单

- **URL**：`POST /wms/park/scheduling/task/batch`（不变）
- **权限**：`wms:parkScheduling:add`
- **Body**（拆柜 `taskType=devanning`）：

```json
{
  "taskType": "devanning",
  "coNos": ["EMCU8796709", "WHSU5127530"],
  "batchItems": [
    { "coNo": "EMCU8796709", "status": "pending" },
    { "coNo": "WHSU5127530", "status": "not_arrived" }
  ],
  "orderLevel": 2,
  "expectedDevanningTime": "2026-05-19",
  "devanningRound": "1",
  "remark": "",
  "dockId": 12,
  "assignToDockMode": "queued"
}
```

| 请求字段 | 写入拆柜订单 |
| -------- | ------------- |
| `coNo` / `batchItems[].coNo` | 匹配键：`co_no` **精确**（trim、大小写策略与现网一致） |
| `orderLevel` | `order_level`（**数字**，可空） |
| `devanningRound` | `devanning_round` |
| `expectedDevanningTime` | `expected_devanning_time` |
| `remark` | `remark` 或 `scheduling_remark` |
| `batchItems[].status` | `devanning_status`（拆柜状态） |
| `dockId` + `assignToDockMode` | `dock_id`；**`devanning_dock` = 该 Dock 的 `slot_name`**（拆柜口）；并按模式设置 `devanning_status` 与 `queue_position` |

**匹配失败**：单条计入 `failures`，**其它柜号仍处理**（禁止整批回滚）。详见 **`wms-backend-park-devanning-handoff.md` §4**。

**响应 `data`（前端已对接）**：

```json
{
  "successCount": 1,
  "failCount": 1,
  "successes": [{ "coNo": "EMCU8796709", "orderId": 10001 }],
  "failures": [{ "coNo": "UNKNOWN001", "reason": "未找到对应拆柜订单" }]
}
```

- HTTP：**建议始终 200** + `code=200`，由 `successCount`/`failCount` 表达部分失败；前端在「新建任务」旁提供 **「任务结果」** 按钮查看明细。
- **装车** `taskType=loading`：可继续旧逻辑或返回 `{ successCount: n, failCount: 0, successes: [], failures: [] }` 直至装车表方案确定。

### 2.2 看板 `GET /wms/park/scheduling/board`

- 从 **拆柜订单** 聚合：每个 Dock 的 `currentTask` / `queuedTasks` / `notArrivedTasks` 结构不变。
- 任务对象字段映射：

| 原 `ParkSchedulingTask` | 来源 |
| ----------------------- | ---- |
| `id` | `wms_devanning_order.id` |
| `taskNo` | 可生成展示号或直接用 `coNo` |
| `taskType` | 固定 `devanning` |
| `coNo` | `co_no` |
| `orderLevel` | `order_level`（**number**） |
| `status` | `devanning_status` |
| `dockId` | `dock_id` |
| `devanningDock`（看板任务 VO 可过渡字段名 `dockName`，值同拆柜口） | `devanning_dock` |
| `devanningRound` | `devanning_round` |
| `expectedDevanningTime` | `expected_devanning_time` |
| `queuePosition` | `queue_position` |

### 2.3 侧栏列表 `GET /wms/park/scheduling/task/list`

- 日期筛选：**`expectedDevanningTimeBegin` / `End`** → `expected_devanning_time`（可兼容旧 `plannedWorkTimeBegin/End`）。
- `workStatus` 筛选改为基于 **`devanning_status`**（及 `dock_id` 是否为空等业务规则），语义与现网文档 §4.1 一致：
  - `pending`：待作业池（含 `pending`、未上 Dock 的 `queued` 等，与现前端扫描逻辑对齐）
  - `in_progress` / `completed` / `not_arrived`

### 2.4 指派、改状态、PATCH、排队

以下接口 **URL 不变**；`taskId` 对拆柜即 **`devanning_order.id`**：

| 接口 | 说明 |
| ---- | ---- |
| `PUT /wms/park/scheduling/task/assign` | 更新 `dock_id`、`devanning_dock`（= `slot_name`）、`devanning_status`、`queue_position` 等 |
| `PUT /wms/park/scheduling/task/status` | 更新 `devanning_status` |
| `PUT /wms/park/scheduling/task/patch` | 更新 `order_level`（数字）、`devanning_round`、`dock_id` |
| `PUT /wms/park/scheduling/dock/{dockId}/queue` | 重排 `queue_position` + 同步 `devanning_round` |
| `PUT /wms/park/scheduling/task/queue/transfer` | 跨 Dock 迁移排队 |

### 2.5 弃用说明

- 不再向 `wms_park_scheduling_task` **插入/更新** 拆柜记录。
- **历史数据迁移（必须）**：见 **`wms-backend-park-devanning-handoff.md` §6**。

---

## 3. 前端行为摘要（供联调）

1. **新建任务**：仅调用 `POST .../task/batch`；展示 **任务结果** 按钮（成功/失败条数 + 明细弹窗）。
2. **匹配失败**：`failCount > 0` 时自动打开结果弹窗；`successCount = 0` 时 toast 提示全部失败。
3. **订单等级**：全站拆柜相关表单项为 **数字 1/2/3** 下拉，不再提交字典 `wms_order_level`。
4. **看板/侧栏**：仍消费原园区调度 API；后端需保证 `orderLevel` 为 **number** 类型 JSON。

---

## 4. 相关文档

- **后端专项对接**：`docs/wms-backend-park-devanning-handoff.md`
- 拆柜订单 CRUD/导入：`docs/wms-devanning-order-api.md`
- 园区道口主数据、看板布局：`docs/wms-park-api.md`
