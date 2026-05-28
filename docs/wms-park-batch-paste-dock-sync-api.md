# 园区调度 · 批量新建粘贴（状态 + 道口同步）— 后端对接说明

> **前端已实现**（`park-scheduling-task-create-modal.vue`、`wms-park.ts`、`park-batch-paste-resolve.ts`）。  
> 接口 URL 不变：`POST /wms/park/scheduling/task/batch`。  
> 关联：`wms-park-auto-assign-api.md`、`wms-backend-park-devanning-handoff.md`、`wms-park-api.md` §4.3。

---

## 1. 业务目标

用户从 Excel/文本粘贴，每行格式：

```text
柜号 状态 [车数/体积] [道口识别码]
```

示例：

```text
YMLU9552149 拆柜中 1/30 43
CSNU7960955 柜子未到 12
EMCU8796709 已到待拆 2/15 26
```

提交后，对**每一柜**需同步：

1. **拆柜状态** `devanning_status`（由 `batchItems[].status` 中文映射，见 §3）
2. **拆柜口 / 道口** `devanning_dock`（= `wms_park_dock.slot_name`）及 `dock_id`
3. **拆柜中**须落在对应 Dock 上，看板表现为该道口 **当前作业**（`in_progress`）

前端在提交前用开放拆柜道口主数据 + 当前看板做**道口识别码模糊匹配**（§4）；匹配失败行不进 `batchItems`（前端预检），或可由后端再校验返回 `failures`。

---

## 2. 请求体（拆柜）

### 2.1 URL

- `POST /wms/park/scheduling/task/batch`
- 权限：`wms:parkScheduling:add`

### 2.2 Body 示例

```json
{
  "taskType": "devanning",
  "coNos": ["YMLU9552149", "CSNU7960955"],
  "expectedDevanningTime": "2026-05-19",
  "devanningRound": null,
  "remark": null,
  "orderLevel": null,
  "batchItems": [
    {
      "coNo": "YMLU9552149",
      "status": "拆柜中",
      "vehicleCount": 1,
      "volume": 30,
      "dockId": 43,
      "devanningDock": "43",
      "assignToDockMode": "current"
    },
    {
      "coNo": "CSNU7960955",
      "status": "柜子未到",
      "vehicleCount": null,
      "volume": null,
      "dockId": 12,
      "devanningDock": "12",
      "assignToDockMode": "not_arrived"
    }
  ]
}
```

### 2.3 顶层字段

| 字段 | 说明 |
|------|------|
| `coNos` | 与 `batchItems` 柜号集合一致、去重 |
| `expectedDevanningTime` | `yyyy-MM-dd`；写 `expected_devanning_time` |
| `orderLevel` | 前端传 `null`；有逐柜 `dockId` 时**跳过**阶段 2 全池自动分配 |
| `dockId` + `assignToDockMode` | **仅当所有行都无逐柜 `dockId`** 时成对使用（弹窗从某一 Dock「添加作业」预设）；否则以 **`batchItems[]` 为准** |

### 2.4 `batchItems[]` 新增/强化字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `coNo` | string | 是 | 海柜号，精确匹配 `wms_devanning_order.co_no` |
| `status` | string | 是 | **中文原文**（§3），禁止 `pending`/`in_progress` 等英文 |
| `vehicleCount` | number | 否 | 粘贴 `1/30` 前半段；可写 `order_level` 排序/展示 |
| `volume` | number | 否 | 粘贴 `1/30` 后半段；阶段 2 排序用，**可不落库** |
| `dockId` | long | 否 | `wms_park_dock.id`；有则必须同步 §5 |
| `devanningDock` | string | 否 | 拆柜口文案，应与 `dockId` 对应 `slot_name` 一致 |
| `assignToDockMode` | string | 否 | 有 `dockId` 时建议必传：`current` \| `queued` \| `not_arrived` |

---

## 3. `status` 中文 → `devanning_status`（须与前端一致）

| 粘贴/提交 `status` | 落库 `devanning_status` | 看板语义 | 有 `dockId` 时 `assignToDockMode` |
|--------------------|-------------------------|----------|-----------------------------------|
| `柜子未到` | `not_arrived` | 未到仓区 | `not_arrived` |
| `已到待拆` / 空 | `pending` | 待作业（可再入队） | `queued` |
| `拆柜中` | **`in_progress`** | **当前作业** | **`current`**（该 Dock 无其它 `in_progress` 时） |
| `库存更新` | `completed` | 已完成 | 可不绑道口；若传 `dockId` 仅更新拆柜口字段由产品定 |
| `已到拆完` | `completed` | 已完成 | 同上 |

**重要变更（相对旧文档）**：

- **`拆柜中` 必须更新为 `in_progress`（作业中）**，不再「不改状态」。
- 提交 `status` 字面量须为 **`"拆柜中"`**；传英文 `in_progress` / `pending` 应 **400** 并提示使用中文。

---

## 4. 道口识别码（前端匹配规则，后端可对齐）

粘贴**最后一列**（在 `车数/体积` 之后）为道口识别码，如 `43`。

匹配数据源：

- `GET /wms/park/dock/list`：`slot_type=dock`、`business_type=devanning`、`status=open`
- 或看板 `GET /wms/park/scheduling/board` 中的 Dock 卡片

匹配优先级（前端 `resolveParkDockFromHint`）：

1. `slot_name` 规范化后 **全等**（去空格、忽略大小写），如 `43` = `43`
2. `slot_name` **后缀**等于识别码
3. 子串模糊（识别码包含于 `slot_name` / `locationArea` / `id`）

**后端建议**：

- 接受 `batchItems[].dockId`，校验：`dock` 存在、开放、业务类型=拆柜
- `devanningDock` 与 `slot_name` 不一致时可 **以主数据为准覆盖** 或 400
- 无法解析道口时：`failures[].reason = DOCK_NOT_FOUND` 或 `DOCK_NOT_MATCHED`

**拆柜中**：

- 前端强制：无 `dockId` 的行不提交（`DOCK_REQUIRED_IN_PROGRESS`）
- 后端建议二次校验：无 `dockId` 且 `status=拆柜中` → 失败

---

## 5. 逐柜写库（阶段 1，每柜独立事务）

对 `batchItems` 每一行（按 `coNo` 命中拆柜订单）：

| 写入字段 | 来源 |
|----------|------|
| `expected_devanning_time` | 请求 `expectedDevanningTime` |
| `devanning_status` | §3 映射 |
| `devanning_round` | 请求 `devanningRound`（可空） |
| `remark` / `scheduling_remark` | 请求 `remark` |
| `dock_id` | `batchItems[].dockId` |
| `devanning_dock` | **`wms_park_dock.slot_name`**（= `devanningDock`） |
| `queue_position` | 见 §6 |
| `order_level` | 有 `vehicleCount` 时可更新；无则保持 |

**禁止**：

- 柜号含 `-` 不参与（`CO_NO_HYPHEN`）
- 英文 `status` 入参

**双写一致性**（与 `wms-backend-park-devanning-handoff.md` 一致）：

- 看板 `GET .../board`、`GET .../task/list` 须从 **同一套** `dock_id` / `devanning_dock` / `devanning_status` 读取
- 拆柜订单详情、列表须回显 `devanningDock`、`devanningStatus`

---

## 6. `assignToDockMode` 语义（有 `dockId` 时）

与 `PUT /wms/park/scheduling/task/assign`、`批量新建顶层 dockId` 语义对齐：

| `assignToDockMode` | 条件 | 行为 |
|--------------------|------|------|
| `current` | 拆柜中 | 该柜 → `in_progress`；成为该 Dock **当前作业**（若 Dock 已有 `in_progress` → **本行失败** 409/入 `failures`，勿静默改排队） |
| `queued` | 已到待拆 | `devanning_status=queued`（或 `pending` 再入队，与现网一致），`queue_position` 队尾 |
| `not_arrived` | 柜子未到 | `devanning_status=not_arrived`，绑 `dock_id`，**不入** `queuedTasks` 排队列表（看板 `notArrivedTasks`） |

---

## 7. 阶段 2 自动分配

当 **任意** `batchItems[].dockId` 非空时：

- `autoAssign.executed = false`（与现网「指定道口则跳过阶段 2」一致）

当 **全部** 无 `dockId` 且未传顶层 `dockId`：

- 仍可按 `expectedDevanningTime` 跑自动分配（`wms-park-auto-assign-api.md`）

---

## 8. 失败码 `failures[].reason`（建议）

| reason | 含义 |
|--------|------|
| `ORDER_NOT_FOUND` | 无拆柜单 / 柜号无效 |
| `CO_NO_HYPHEN` | 柜号含 `-` |
| `DOCK_NOT_FOUND` / `DOCK_NOT_MATCHED` | `dockId` 无效或识别码无法解析 |
| `DOCK_REQUIRED_IN_PROGRESS` | 拆柜中但未绑道口 |
| `DOCK_BUSY` | `assignToDockMode=current` 但 Dock 已有作业中 |
| `STATUS_INVALID` | `status` 非约定中文 |
| `STATUS_ENGLISH_NOT_ALLOWED` | 传了 `pending`/`in_progress` 等英文 |

---

## 9. 响应（不变）

```json
{
  "successCount": 2,
  "failCount": 0,
  "successes": [{ "coNo": "YMLU9552149", "orderId": 8801 }],
  "failures": [],
  "autoAssign": { "executed": false }
}
```

---

## 10. 后端改造检查清单

- [ ] `batchItems[].dockId`、`devanningDock`、`assignToDockMode` 落库 `dock_id`、`devanning_dock`、`devanning_status`、`queue_position`
- [ ] `status=拆柜中` → `devanning_status=in_progress`，且 `assignToDockMode=current` 时设为该 Dock 当前作业
- [ ] `status=柜子未到` + 道口 → `not_arrived` + `dock_id`，不进排队
- [ ] 拒绝 `batchItems[].status` 英文字面量 `pending`/`in_progress`
- [ ] 有逐柜 `dockId` 时跳过阶段 2 自动分配
- [ ] 看板/侧栏/拆柜订单列表字段与写库一致
- [ ] 单柜失败不影响其它柜（部分成功）

---

## 11. 联调用 curl 示例

```bash
curl -X POST '/wms/park/scheduling/task/batch' \
  -H 'Content-Type: application/json' \
  -d '{
    "taskType": "devanning",
    "coNos": ["TESTCO001"],
    "expectedDevanningTime": "2026-05-19",
    "batchItems": [{
      "coNo": "TESTCO001",
      "status": "拆柜中",
      "vehicleCount": 1,
      "volume": 30,
      "dockId": 1,
      "devanningDock": "43",
      "assignToDockMode": "current"
    }]
  }'
```

验收：拆柜订单 `devanning_status=in_progress`，`dock_id`、`devanning_dock` 已更新；看板对应 Dock 显示该柜为当前作业。
