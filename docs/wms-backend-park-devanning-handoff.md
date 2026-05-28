# WMS 园区拆柜调度 — 后端专项对接文档

> **用途**：供后端按本次前端改造 **针对性开发**。  
> **范围**：拆柜（`taskType=devanning`）调度数据从 `wms_park_scheduling_task` **迁到** `wms_devanning_order`；园区调度 **接口 URL 不变**，由后端从拆柜订单组装原 `ParkSchedulingTask` / 看板结构。  
> **装车**（`taskType=loading`）可暂沿用 `wms_park_scheduling_task`，与拆柜分开实现。

前端已实现目录：`src/views/wms/order/park-scheduling`、`src/views/wms/order/devanning-order`、`src/service/api/wms/park-scheduling.ts`。

**拆柜批量新建两阶段（更新订单 → 自动分配道口 + 写 `orderLevel`）**：见 **`docs/wms-park-auto-assign-api.md`**。

---

## 1. 架构结论（必读）

| 项 | 约定 |
|----|------|
| 主数据表 | **`wms_devanning_order`（拆柜订单）** |
| 弃用 | 拆柜方向 **不再** 向 `wms_park_scheduling_task` 插入/更新 |
| 园区 API | `GET/PUT/POST /wms/park/scheduling/**` **路径不变** |
| 任务主键 | 看板/侧栏/拖拽中的 **`taskId` = 拆柜订单 `id`** |
| 拆柜口 | 订单字段 **`devanning_dock`**（文本）；**同时维护 `dock_id`** 关联 `wms_park_dock.id` |
| 计划时间 | **仅** `expected_devanning_time`（日期 `yyyy-MM-dd`），**不要** 在订单表新增 `planned_work_time` |
| 拆柜状态 | 订单字段 **`devanning_status`**，枚举与现网园区任务 `status` 一致 |
| 业务状态 | 订单 **`status`**（`pending_schedule` / `pending_devanning` / `completed` / `abnormal`）与 **`devanning_status`** **分离** |
| 历史数据 | **必须迁移**（见 §6）后再停写任务表 |

---

## 2. 拆柜订单表 `wms_devanning_order`

### 2.1 建议 DDL（按现网调整类型/索引）

```sql
-- 若列已存在则 MODIFY，勿重复 ADD
ALTER TABLE wms_devanning_order
  ADD COLUMN devanning_status   VARCHAR(32)  NULL COMMENT '拆柜调度状态 pending/not_arrived/queued/in_progress/completed',
  ADD COLUMN dock_id            BIGINT       NULL COMMENT '园区道口 wms_park_dock.id',
  ADD COLUMN queue_position     INT          NULL COMMENT 'Dock 内排队序号，从 1',
  MODIFY COLUMN order_level     INT          NULL COMMENT '订单等级，用户输入数字';

-- devanning_dock、expected_devanning_time、devanning_round 若表内已有则仅校对含义
-- 禁止新增 dock_name、planned_work_time
```

### 2.2 字段与 JSON 映射

| 库字段 | JSON | 类型 | 说明 |
|--------|------|------|------|
| `devanning_status` | `devanningStatus` | varchar | `pending` \| `not_arrived` \| `queued` \| `in_progress` \| `completed` |
| `dock_id` | `dockId` | bigint 可空 | 园区道口主键 |
| `devanning_dock` | `devanningDock` | varchar 可空 | **拆柜口展示名** = 指派 Dock 的 **`wms_park_dock.slot_name`** |
| `queue_position` | `queuePosition` | int 可空 | Dock 排队序 |
| `order_level` | `orderLevel` | **number** 可空 | 任意整数，**非** 字典枚举 |
| `devanning_round` | `devanningRound` | varchar | 字典 `wms_devanning_round` |
| `expected_devanning_time` | `expectedDevanningTime` | **date** | **唯一**「计划/预计拆柜」日期，`yyyy-MM-dd` |
| `remark` | `remark` | varchar | 园区新建备注可写此字段（或另列 `scheduling_remark`，二选一） |

**禁止：**

- 订单表 `dock_name`（与 `devanning_dock` 重复）
- 订单表 `planned_work_time`

### 2.3 Dock 与拆柜口（§ 用户确认 §1）

凡涉及 **绑定/改派 Dock** 的写操作，**必须同时写入**：

1. **`dock_id`** = `wms_park_dock.id`
2. **`devanning_dock`** = 该 Dock 的 **`slot_name`**

适用接口包括但不限于：

- `POST /wms/park/scheduling/task/batch`（带 `dockId`）
- `PUT /wms/park/scheduling/task/assign`
- `PUT /wms/park/scheduling/task/patch`（修改 `dockId`）
- `PUT /wms/park/scheduling/task/queue/transfer`（目标 Dock）
- 拆柜订单 `PUT /wms/devanning-order`（若允许改 `dockId`）

**解绑 Dock**（如作业完成、`dockId` 置空）时：建议 **`devanning_dock` 同步清空**。

看板任务 VO 可过渡返回 `dockName`，**值与 `devanningDock` 相同**；订单 CRUD **只认 `devanningDock`**。

### 2.4 拆柜订单 CRUD / 导入

| 接口 | 要求 |
|------|------|
| `GET /wms/devanning-order/list`、`GET .../{id}` | 回传 §2.2 全部调度字段 |
| `PUT /wms/devanning-order` | 可改 `devanningStatus`、`orderLevel`、`dockId`、`devanningDock`、`devanningRound`、`expectedDevanningTime` 等；改 `dockId` 时建议同步 `devanning_dock` |
| 列表 Query | 支持 `devanningStatus`、`orderLevel`（**数字**） |
| `POST .../import-confirm` | 新单默认 **`devanning_status = not_arrived`** |

**`expectedDevanningTime` 与业务 `status` 联动**（已有规则，保持不变）：有预计日 → `pending_schedule`；无 → `pending_devanning`。详见 `docs/wms-devanning-order-api.md` §2.3。

---

## 3. 计划拆柜时间（§ 用户确认 §3）

| 场景 | 字段 |
|------|------|
| 批量新建、侧栏筛选、看板展示 | **`expectedDevanningTime`** / `expected_devanning_time` |
| 园区侧栏 Query | `expectedDevanningTimeBegin`、`expectedDevanningTimeEnd`（`yyyy-MM-dd 00:00:00`～`23:59:59`，成对可选） |
| 兼容 | 可短期识别旧参 `plannedWorkTimeBegin`/`End`，**映射到同一列** |
| 拆柜批量 Body | **`expectedDevanningTime": "2026-05-19"`**，**不要** 要求 `plannedWorkTime` |

装车 `taskType=loading` 仍可使用 `plannedWorkTime`（`yyyy-MM-dd HH:mm:ss`），与拆柜无关。

---

## 4. 批量「新建任务」（§ 用户确认 §2）

### 4.1 语义变更（重要）

| 旧行为（勿再采用） | 新行为（必须） |
|-------------------|----------------|
| 一条失败 → **整批回滚** / HTTP 4xx 全失败 | **按柜号逐条处理**；成功条 **提交**，失败条 **跳过** |
| 仅返回 `msg` | 返回结构化 **`successes` / `failures`** |

- **URL**：`POST /wms/park/scheduling/task/batch`
- **权限**：`wms:parkScheduling:add`
- **实现建议**：每条 `coNo` **独立事务**（或批量事务 + 逐条 savepoint）；**禁止**「任一失败则全部 ROLLBACK」。

### 4.2 请求 Body（拆柜）

```json
{
  "taskType": "devanning",
  "coNos": ["EMCU8796709", "UNKNOWN001"],
  "batchItems": [
    { "coNo": "EMCU8796709", "status": "已到待拆" },
    { "coNo": "UNKNOWN001", "status": "柜子未到" }
  ],
  "orderLevel": 2,
  "expectedDevanningTime": "2026-05-19",
  "devanningRound": "1",
  "remark": "",
  "dockId": 12,
  "assignToDockMode": "queued"
}
```

| 请求字段 | 写入订单 |
|----------|----------|
| `coNo` / `batchItems[].coNo` | 匹配键：`wms_devanning_order.co_no` **精确**（trim、大小写与现网一致） |
| `orderLevel` | `order_level` |
| `expectedDevanningTime` | `expected_devanning_time` |
| `devanningRound` | `devanning_round` |
| `remark` | `remark` |
| `batchItems[].status` | 中文原文（如 `已到待拆`、`柜子未到`、`库存更新`）；后端映射为 `devanning_status`，**勿传** `pending`/`completed` 等英文 |
| `dockId` + `assignToDockMode` | `dock_id` + **`devanning_dock = slot_name`**，并按模式写 `devanning_status`、`queue_position` |

**`batchItems` 粘贴规则（前端提交中文）**：`柜子未到`→`柜子未到`；`库存更新`/`已到拆完`→对应中文（落库 `completed`）；`拆柜中`→`拆柜中`；`已到待拆`/仅柜号→`已到待拆`（落库 `pending`）。柜号含 `-` 预过滤（`CO_NO_HYPHEN`）。侧栏改状态仍用英文枚举。

**`assignToDockMode`（与现网 `wms-park-api.md` §4.2.1 一致）**

| 模式 | 行为 |
|------|------|
| `current` | Dock 无 `in_progress` 时本条 `in_progress`；已有作业中 → **本条失败**（进 `failures`，**不影响其它柜号**） |
| `queued` | 本条 `queued`，`queue_position` 队尾 |

### 4.3 响应 Body（前端已对接）

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "successCount": 1,
    "failCount": 1,
    "successes": [
      { "coNo": "EMCU8796709", "orderId": 10001 }
    ],
    "failures": [
      { "coNo": "UNKNOWN001", "reason": "未找到对应拆柜订单" }
    ]
  }
}
```

| 规则 | 说明 |
|------|------|
| HTTP | 请求合法时 **建议始终 200**，`code=200` |
| 部分失败 | `successCount > 0` 且 `failCount > 0` **允许** |
| 全失败 | `successCount=0`，仍 200 + 完整 `failures` |
| `orderId` | 成功条为 **`wms_devanning_order.id`**（即后续 `taskId`） |
| `reason` | 中文可读，如：未找到订单、柜号重复无法消歧、道口已有作业中任务、无权限、业务状态不允许 |

**常见失败原因（示例）**

| 场景 | `reason` 示例 |
|------|----------------|
| 无拆柜订单 | 未找到对应拆柜订单 |
| 多条 `co_no` 命中且无法消歧 | 柜号对应多条拆柜订单，请人工处理 |
| `assignToDockMode=current` 且 Dock 已占用 | 该道口已有作业中任务，请使用排队添加 |
| 订单已完成拆柜等 | 拆柜订单已完成，无法加入调度 |

### 4.4 前端交互（联调）

1. 用户点 **「新建任务」** → 调用本接口。
2. 有失败时（`failCount > 0`）→ **自动弹出**「任务结果」明细。
3. 工具栏 **「任务结果」** 按钮在 **「新建任务」左侧**；展示 `成功数/总数` 角标，可再次打开上次批量结果。
4. `successCount > 0` → Toast 成功条数；`successCount = 0` → Toast 全部失败。

---

## 5. 其它园区调度接口（拆柜落库订单表）

以下接口 **URL、权限不变**；`taskId` = **`wms_devanning_order.id`**。

### 5.1 看板 `GET /wms/park/scheduling/board`

从订单聚合各 Dock 的 `currentTask` / `queuedTasks` / `notArrivedTasks`（规则见 `docs/wms-park-api.md` §3）。

**任务 VO 映射**

| 任务 JSON | 订单来源 |
|-----------|----------|
| `id` | `id` |
| `coNo` | `co_no` |
| `taskType` | 固定 `devanning` |
| `status` | `devanning_status` |
| `orderLevel` | `order_level`（**JSON number**） |
| `expectedDevanningTime` | `expected_devanning_time` |
| `devanningRound` | `devanning_round` |
| `dockId` | `dock_id` |
| `devanningDock` / 过渡 `dockName` | `devanning_dock` |
| `queuePosition` | `queue_position` |
| `taskNo` | 可生成展示号或直接用 `coNo` |

### 5.2 侧栏 `GET /wms/park/scheduling/task/list`

| Query | 说明 |
|-------|------|
| `taskType` | `devanning` |
| `workStatus` | 按 **`devanning_status`** 过滤（口径见 `wms-park-api.md` §4.1） |
| `expectedDevanningTimeBegin` / `End` | 筛选 **`expected_devanning_time`** |
| `coNo` | 柜号模糊（可选） |

`workStatus=pending` 建议一次返回 **`pending` ∪ `queued`**（待作业池）。

### 5.3 写接口摘要

| 接口 | 更新字段要点 |
|------|----------------|
| `PUT .../task/assign` | `dock_id`、`devanning_dock`、`devanning_status`、`queue_position` |
| `PUT .../task/status` | `devanning_status` |
| `PUT .../task/patch` | `order_level`、`devanning_round`、`dock_id`（改 Dock **同步 `devanning_dock`**） |
| `PUT .../dock/{dockId}/queue` | 重排 `queue_position`（仅 `queued`） |
| `PUT .../task/queue/transfer` | 跨 Dock：`dock_id`、`devanning_dock`、`queue_position` |

**`status` 枚举**（与现网一致）：`pending` | `not_arrived` | `queued` | `in_progress` | `completed`。

---

## 6. 历史数据迁移（§ 用户确认 §4）

### 6.1 目标

将 **`wms_park_scheduling_task` 中 `task_type = 'devanning'`** 的有效调度信息 **合并到** 对应 **`wms_devanning_order`**，使上线后看板/侧栏 **无数据断层**。

### 6.2 匹配键（优先级）

1. **`devanning_order_id`** 非空 → 直接更新该订单  
2. 否则按 **`co_no` 精确匹配** 订单；多命中按现网规则取一条（建议：未删除、非 `completed`，`id` 最大）  
3. 无法匹配 → **记录迁移日志**，人工处理（**不要** 静默丢数）

### 6.3 字段回填映射

| 任务表 `wms_park_scheduling_task` | 订单表 `wms_devanning_order` |
|----------------------------------|------------------------------|
| `status` | `devanning_status` |
| `dock_id` | `dock_id` |
| `dock_id` → join `wms_park_dock.slot_name` | `devanning_dock` |
| `queue_position` | `queue_position` |
| `order_level` | `order_level`（转为 **INT**） |
| `devanning_round` | `devanning_round` |
| `planned_work_time`（取 **日期部分**） | `expected_devanning_time`（仅当订单该字段为空时回填，避免覆盖已有业务日期） |
| `remark` | `remark`（可选，按业务是否覆盖） |

### 6.4 迁移 SQL 示例（需按现网表名/列名调整）

```sql
-- Step 1: 结构就绪（§2.1）

-- Step 2: 有 devanning_order_id 的任务
UPDATE wms_devanning_order o
INNER JOIN wms_park_scheduling_task t ON t.devanning_order_id = o.id
SET
  o.devanning_status = COALESCE(o.devanning_status, t.status),
  o.dock_id          = COALESCE(o.dock_id, t.dock_id),
  o.queue_position   = COALESCE(o.queue_position, t.queue_position),
  o.order_level      = COALESCE(o.order_level, CAST(t.order_level AS SIGNED)),
  o.devanning_round  = COALESCE(o.devanning_round, t.devanning_round),
  o.expected_devanning_time = COALESCE(
        o.expected_devanning_time,
        DATE(t.planned_work_time)
      )
WHERE t.task_type = 'devanning'
  AND t.del_flag = '0';  -- 若使用逻辑删除

-- Step 3: devanning_dock 由 dock_id 回填
UPDATE wms_devanning_order o
INNER JOIN wms_park_dock d ON d.id = o.dock_id
SET o.devanning_dock = d.slot_name
WHERE o.dock_id IS NOT NULL
  AND (o.devanning_dock IS NULL OR o.devanning_dock = '');

-- Step 4: 无 devanning_order_id、仅 co_no 的任务（需防重复，建议用脚本逐条）
-- 见业务脚本，勿盲目全表 UPDATE

-- Step 5: 校验
-- SELECT COUNT(*) FROM wms_park_scheduling_task t
-- WHERE t.task_type='devanning' AND t.status IN ('queued','in_progress')
--   AND NOT EXISTS (SELECT 1 FROM wms_devanning_order o WHERE o.id=t.devanning_order_id OR o.co_no=t.co_no);
```

### 6.5 上线顺序建议

1. 发版 **加列** + 迁移脚本（可只读旧表）  
2. 部署 **双写或只写订单** 的后端（拆柜 API 改读写订单）  
3. 校验看板/侧栏/批量新建  
4. 标记 `wms_park_scheduling_task` 拆柜数据 **只读归档**（装车仍可用）

---

## 7. 装车任务（本期可不变）

- `taskType=loading` 可继续 `wms_park_scheduling_task` + `plannedWorkTime`。  
- 批量接口对装车可暂返回 `{ successCount: n, failCount: 0, successes: [], failures: [] }` 或沿用旧逻辑，**直到装车表方案确定**。

---

## 8. 后端开发检查清单

- [ ] `wms_devanning_order` 增加/校对：`devanning_status`、`dock_id`、`devanning_dock`、`queue_position`；`order_level` 为数字  
- [ ] **不写** 订单 `dock_name`、`planned_work_time`  
- [ ] 凡写 `dock_id` **必写** `devanning_dock = slot_name`  
- [ ] `POST .../task/batch`：**逐条提交**，返回 `successes`/`failures`，部分失败仍 200  
- [ ] 看板/侧栏/assign/patch/queue：**taskId = 订单 id**，数据来自订单表  
- [ ] 侧栏日期筛选用 **`expected_devanning_time`**（`expectedDevanningTimeBegin/End`）  
- [ ] 拆柜订单 list/detail/put/import 支持新字段  
- [ ] 导入默认 `devanning_status = not_arrived`  
- [ ] **历史拆柜任务迁移** + 校验脚本  
- [ ] 拆柜停止写入 `wms_park_scheduling_task`

---

## 9. 相关文档

| 文档 | 说明 |
|------|------|
| `docs/wms-devanning-order-api.md` | 拆柜订单 CRUD、预计拆柜日与业务 `status` |
| `docs/wms-park-api.md` | 看板布局、Dock 规则、`workStatus` Tab 口径 |
| `docs/wms-park-devanning-scheduling-api.md` | 前端实现侧补充说明（可与本文档并存） |

---

## 10. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-05-19 | 初版：Dock 双写、批量部分成功、统一预计拆柜日、历史迁移 |
