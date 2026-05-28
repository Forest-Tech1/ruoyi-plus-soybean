# WMS 园区调度 / 园区管理 — 后端 API 对接文档

前端路由（**订单管理** 下，紧挨 **拆柜订单** 之后）：

| 路由名 | Path | 页面 |
| ------ | ---- | ---- |
| `wms_order_park-scheduling` | `/wms/order/park-scheduling` | 园区调度（看板 + 任务侧栏 + 拖拽指派） |
| `wms_order_park-management` | `/wms/order/park-management` | 园区管理（道口 / 停车位 CRUD） |

建议菜单 `order_num`：拆柜订单下一项起，**园区调度** → **园区管理**。

> **拆柜批量新建 + 自动分配道口（两阶段、`priority`、车数/体积仅排序）**：见 **`docs/wms-park-auto-assign-api.md`**。

---

## 1. 通用约定

- **鉴权**：RuoYi `@SaCheckPermission`，与下表权限字一致；未配置时前端按 `hasAuth` 隐藏按钮。
- **响应**：`{ code, msg, data }`；列表分页 `data: { rows, total }`。
- **仓库维度**：`warehouseId` 为 **平台仓库主键**（`basic_platform_warehouse.id`），与园区调度/管理顶栏下拉一致。
- **暂不实现**：拆柜进度百分比、自动化绑定、`row-rank` / `column-rank` 管理页列（后端可保留 `gridRow`/`gridCol` 仅用于看板布局，不在管理表格展示）。

---

## 2. 园区管理 — 道口 / 停车位

### 2.1 分页列表

- **URL：** `GET /wms/park/dock/list`
- **权限：** `wms:parkDock:list`
- **Query：**

| 参数 | 说明 |
| ---- | ---- |
| `warehouseId` | 必填（业务上） |
| `slotType` | `dock` \| `parking` |
| `slotName` | 模糊 |
| `locationArea` | 模糊 |
| `status` | `open` \| `closed` |
| `pageNum` / `pageSize` | 分页 |

- **响应 `rows[]`（`ParkDock`）：**

```json
{
  "id": 1,
  "warehouseId": 100,
  "warehouseName": "美西二号仓",
  "slotName": "1126",
  "slotType": "dock",
  "locationArea": "前院道口",
  "parkingLimit": 1,
  "status": "open",
  "yardZone": "front",
  "gridRow": 1,
  "gridCol": 3,
  "sortOrder": 10,
  "priority": 1,
  "remark": null,
  "createTime": "2026-05-15 10:00:00"
}
```

| 字段 | 说明 |
| ---- | ---- |
| `slotType` | `dock` 道口；`parking` 停车位 |
| `yardZone` | `front` 前院 / `back` 后院（看板分区） |
| `gridRow` / `gridCol` | 看板网格坐标（可选；**管理页不展示**） |
| `sortOrder` | 同区内排序 |
| `priority` | 调度优先级（≥1，**越小越优先**）；拆柜道口自动分配，默认 `1` |

### 2.2 详情

- **URL：** `GET /wms/park/dock/{id}`
- **权限：** `wms:parkDock:query`

### 2.3 新增

- **URL：** `POST /wms/park/dock`
- **权限：** `wms:parkDock:add`
- **Body：**

```json
{
  "warehouseId": 100,
  "slotName": "1126",
  "slotType": "dock",
  "locationArea": "前院道口",
  "parkingLimit": 1,
  "status": "open",
  "yardZone": "front",
  "gridRow": 1,
  "gridCol": 3,
  "sortOrder": 10,
  "priority": 1,
  "remark": ""
}
```

### 2.4 修改

- **URL：** `PUT /wms/park/dock`
- **权限：** `wms:parkDock:edit`
- **Body：** 同新增，含 `id`。

### 2.5 删除

- **URL：** `DELETE /wms/park/dock/{ids}`（逗号分隔）
- **权限：** `wms:parkDock:remove`

---

## 3. 园区调度 — 看板

### 3.1 看板数据

- **URL：** `GET /wms/park/scheduling/board`
- **权限：** `wms:parkScheduling:list`
- **Query：**

| 参数 | 说明 |
| ---- | ---- |
| `warehouseId` | 必填 |
| `plannedWorkDate` | 可选，`yyyy-MM-dd`，默认当天；用于卡片当前/排队任务过滤 |

- **响应 `data`：**

```json
{
  "warehouseId": 100,
  "warehouseName": "美西二号仓",
  "frontYardLabel": "前院",
  "backYardLabel": "后院",
  "frontDocks": [
    {
      "id": 1,
      "slotName": "1126",
      "slotType": "dock",
      "yardZone": "front",
      "gridRow": 1,
      "gridCol": 1,
      "placeholder": false,
      "cardStatus": "in_progress",
      "currentTask": {
        "id": 501,
        "taskNo": "TSK-20260515-001",
        "taskType": "devanning",
        "coNo": "COMP008",
        "status": "in_progress"
      },
      "queuedTasks": [
        {
          "id": 502,
          "taskNo": "TSK-20260515-002",
          "coNo": "PARK001",
          "status": "queued",
          "queuePosition": 1
        }
      ]
    },
    {
      "slotName": "23",
      "placeholder": true,
      "cardStatus": "empty"
    }
  ],
  "backDocks": []
}
```

**`cardStatus`（卡片配色，前端映射）：**

| 值 | 含义 | 前端色 |
| -- | ---- | ------ |
| `empty` | 空位 | 蓝 |
| `waiting` | 有待作业/待装车未开工 | 橙 |
| `in_progress` | 作业中 | 红 |
| `completed` | 当日已完成（可选展示） | 绿 |

**说明：**

- **无拆柜进度字段**；勿返回 `progressPercent` 等。
- `placeholder: true` 为预留空位，**不可拖入任务**。
- `currentTask`：Dock 上正在作业的一条；`queuedTasks`：排队列表（按 `queuePosition` 升序）。

---

## 4. 园区调度 — 任务

### 4.1 任务分页（侧栏）

- **URL：** `GET /wms/park/scheduling/task/list`
- **权限：** `wms:parkScheduling:list`
- **Query：**

| 参数 | 说明 |
| ---- | ---- |
| `warehouseId` | 必填 |
| `taskType` | `devanning` \| `loading` |
| `workStatus` | `pending` 待作业 Tab \| `completed` 已完成 Tab |
| `plannedWorkTimeBegin` | 默认当天 00:00:00 |
| `plannedWorkTimeEnd` | 默认当天 23:59:59 |
| `pageNum` / `pageSize` | 分页 |

- **响应 `rows[]`：**

```json
{
  "id": 501,
  "taskNo": "TSK-20260515-001",
  "taskType": "devanning",
  "warehouseId": 100,
  "coNo": "CAAU4749001",
  "orderLevel": "A",
  "plannedWorkTime": "2026-05-15 08:00:00",
  "dockId": 1,
  "dockName": "1126",
  "devanningRound": "1",
  "status": "pending",
  "queuePosition": null,
  "devanningOrderId": null,
  "remark": null
}
```

**`status` 枚举：**

| 值 | 说明 |
| -- | ---- |
| `pending` | 待作业（未指派 Dock） |
| `queued` | 已指派 Dock，排队中 |
| `in_progress` | Dock 当前作业中 |
| `completed` | 已完成 |

**侧栏展示列：** 柜号、等级、待作业时间、Dock、作业轮次、状态（待作业 Tab 固定文案「待作业」；已完成 Tab 固定「已完成」）。

**`workStatus=pending`：** 返回 `pending` + 已指派但未完成的（`queued`/`in_progress`）由产品定；建议 **pending Tab = status in (pending, queued, in_progress)**，**completed Tab = completed**。

**`workStatus=completed`：** 仅 `status=completed`。

### 4.2 新建任务

- **URL：** `POST /wms/park/scheduling/task`
- **权限：** `wms:parkScheduling:add`
- **Body：**

```json
{
  "warehouseId": 100,
  "taskType": "devanning",
  "coNo": "CAAU4749001",
  "orderLevel": "A",
  "plannedWorkTime": "2026-05-15 00:00:00",
  "devanningRound": "1",
  "remark": ""
}
```

| 字段 | 拆柜 `devanning` | 装车 `loading` |
| ---- | ---------------- | -------------- |
| `coNo` | 必填 | 必填 |
| `orderLevel` | **必填**，用户手输等级 | 可不传 |
| `plannedWorkTime` | 必填；前端默认 **当天** | 同左 |
| `devanningRound` | 可选，字典 `wms_devanning_round` | 忽略 |

- **后端：** 生成 `taskNo`；初始 `status=pending`；`dockId` 为空。

### 4.3 指派 Dock（拖拽）

- **URL：** `PUT /wms/park/scheduling/task/assign`
- **权限：** `wms:parkScheduling:assign`
- **Body：**

```json
{
  "taskId": 501,
  "dockId": 1
}
```

**业务规则：**

1. Dock **无当前作业**：该任务 → `in_progress`，写入 `currentTask`。
2. Dock **已有当前作业**：该任务 → `queued`，追加到队尾，`queuePosition` 递增。
3. 仅 `status=pending` 或允许改派的任务可拖入（具体规则后端定义）。
4. 成功后前端刷新看板 + 侧栏。

### 4.4 完成任务

- **URL：** `PUT /wms/park/scheduling/task/complete/{id}`
- **权限：** `wms:parkScheduling:complete`
- **说明：** 完成当前作业后，若存在 `queuedTasks[0]`，应 **自动升为 `in_progress`**（队首顶上）。

### 4.5 Dock 队列明细（点击卡片弹窗）

- **URL：** `GET /wms/park/scheduling/dock/{dockId}/queue`
- **权限：** `wms:parkScheduling:list`
- **响应：**

```json
{
  "dockId": 1,
  "dockName": "1126",
  "currentTask": { "id": 501, "taskNo": "TSK-...", "coNo": "COMP008", "taskType": "devanning" },
  "queuedTasks": [
    { "id": 502, "taskNo": "TSK-...", "coNo": "PARK001", "devanningRound": "1", "queuePosition": 1 }
  ]
}
```

弹窗展示：**当前作业任务号** + **排队任务号列表**。

### 4.6 释放道口（一键完成该 Dock 全部任务）— **需新增**

前端顶栏「任务类型」（拆柜/装车）右侧 **「释放道口」**：弹窗选择道口（名称/位置类型模糊匹配）→ 二次确认 → 批量完成。

- **URL：** `PUT /wms/park/scheduling/dock/release`
- **权限：** `wms:parkScheduling:releaseDock`（前端兼容：无此字时可用 `wms:parkScheduling:complete` 或 `wms:parkScheduling:edit`）
- **Body：**

```json
{
  "dockId": 1,
  "taskType": "devanning"
}
```

| 字段 | 说明 |
| ---- | ---- |
| `dockId` | 道口主键 `wms_park_dock.id` |
| `taskType` | `devanning` \| `loading`，须与 Dock.`business_type` 一致，否则 `400` |

- **响应 `data`：**

```json
{
  "dockId": 1,
  "dockName": "1126",
  "completedTaskCount": 5,
  "completedCoNos": ["CAAU4749001", "YMLU9552149"]
}
```

**业务规则（建议后端实现）：**

1. 查出该 `dockId` 上所有 **未完成** 调度任务：`status` ∈ `pending` / `not_arrived` / `queued` / `in_progress`，且 `task_type` = 请求的 `taskType`（含 `currentTask`、排队、未到仓，与看板 `GET .../board` 一致）。
2. 将上述任务 **全部** 更新为 `status=completed`，写入 `complete_time`（若有）；清空 `dock_id`、`queue_position`（或按你们队列表设计释放占用）。
3. 若 Dock 存在队列表/当前作业指针，同步清空，使看板该卡片为 **空位**。
4. **拆柜任务**（`task_type=devanning`）：建议同步关联 **拆柜订单** / 拆柜状态为已完成（与单条 `PUT .../task/status` 置 `completed`、或 `PUT .../task/complete/{id}` 行为一致），避免侧栏/订单列表仍显示待拆。
5. **装车任务**（`loading`）：按装车业务约定同步状态（若有独立订单表）。
6. 已是 `completed` 的任务 **跳过**，不计入 `completedTaskCount`。
7. 事务：全部成功或全部回滚；返回实际完成条数与柜号列表（`completedCoNos` 去重可选）。

**错误码建议：**

| 场景 | HTTP / code |
| ---- | ----------- |
| Dock 不存在 | 404 |
| Dock.`business_type` ≠ `taskType` | 400 |
| Dock 上无任何可完成任务 | 200 且 `completedTaskCount=0` 或 400「无可释放任务」（二选一，与前端约定；前端当前按 200 成功处理） |

成功后前端 **刷新看板 + 侧栏统计**（`refreshAll`）。

---

## 5. 权限字建议（`sys_menu` / 按钮）

| 权限 | 说明 |
| ---- | ---- |
| `wms:parkDock:list` | 园区管理列表 |
| `wms:parkDock:query` | 详情 |
| `wms:parkDock:add` | 新增道口/停车位 |
| `wms:parkDock:edit` | 编辑 |
| `wms:parkDock:remove` | 删除 |
| `wms:parkScheduling:list` | 看板、侧栏、Dock 队列 |
| `wms:parkScheduling:add` | 新建任务 |
| `wms:parkScheduling:assign` | 拖拽指派 Dock |
| `wms:parkScheduling:complete` | 完成任务（单条） |
| `wms:parkScheduling:releaseDock` | **释放道口**（该 Dock 全部任务一键完成） |
| `wms:parkScheduling:edit` | 侧栏/看板改状态、排队拖拽等 |

---

## 6. 表结构建议（供后端参考）

### `wms_park_dock`（道口/停车位）

| 列 | 类型 | 说明 |
| -- | ---- | ---- |
| id | bigint PK | |
| tenant_id | bigint | 多租户 |
| warehouse_id | bigint | 平台仓库 id |
| slot_name | varchar | 名称/编号 |
| slot_type | varchar | dock / parking |
| location_area | varchar | 位置区域 |
| parking_limit | int | 限制停车数 |
| status | varchar | open / closed |
| yard_zone | varchar | front / back |
| grid_row / grid_col | int | 看板布局（管理页不展示） |
| sort_order | int | 排序 |
| remark | varchar | |

### `wms_park_scheduling_task`（调度任务）

| 列 | 类型 | 说明 |
| -- | ---- | ---- |
| id | bigint PK | |
| task_no | varchar | 任务号 |
| warehouse_id | bigint | |
| task_type | varchar | devanning / loading |
| co_no | varchar | 柜号 |
| order_level | varchar | 拆柜等级 |
| planned_work_time | datetime | 待作业时间 |
| dock_id | bigint nullable | 指派 Dock |
| devanning_round | varchar | 作业轮次 |
| status | varchar | pending / queued / in_progress / completed |
| queue_position | int nullable | Dock 内排队序号 |
| devanning_order_id | bigint nullable | 可选关联拆柜单 |
| complete_time | datetime nullable | |

### `wms_park_dock_assignment`（可选）

若队列表独立维护，可用中间表 `(dock_id, task_id, queue_position, is_current)`；也可仅在 task 表用 `dock_id + queue_position` 表达。

---

## 7. 前端文件索引

| 类型 | 路径 |
| ---- | ---- |
| 调度页 | `src/views/wms/order/park-scheduling/index.vue` |
| 管理页 | `src/views/wms/order/park-management/index.vue` |
| API | `src/service/api/wms/park-scheduling.ts`、`park-dock.ts` |
| 类型 | `src/typings/api/wms.api.d.ts` → `Api.Wms.Park*` |
