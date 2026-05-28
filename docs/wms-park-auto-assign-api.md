# WMS 园区调度 — 拆柜批量新建与自动分配道口（后端对接）

> 前端：`ruoyi-plus-soybean` 园区调度「新建任务」、园区管理道口 **`priority`**。  
> 关联：`wms-park-api.md`、`wms-backend-park-devanning-handoff.md`、`wms-park-devanning-scheduling-api.md`

---

## 1. 业务目标

1. **园区管理**：道口增加 **`priority`**（调度优先级），整数 **≥1**，**数值越小越优先**（`1` 最高）。
2. **批量新建拆柜任务**：粘贴 **柜号 + 状态 + 可选车数/体积**；仅处理「已到待拆」「柜子未到」。
3. **两阶段**（同一 `POST .../task/batch` 请求内顺序执行；阶段 2 失败 **不回滚** 阶段 1 已成功条）：
   - **阶段 1**：按柜号更新拆柜订单（预计拆柜日、拆柜状态等）；**不写** `orderLevel`、`dockId`。
   - **阶段 2**：对「当天预计拆柜、未绑道口」海柜池 **排序定等级** + **分配道口**（每道口最多 **4** 柜）。

**车数 / 体积**：仅阶段 2 排序用，**不落库**。  
**等级 `orderLevel`**：阶段 2 按排序写入（`1` = 本池最优先）。

---

## 2. 数据模型

### 2.1 `wms_park_dock`

| 列 | 类型 | 默认 | 说明 |
|----|------|------|------|
| `priority` | INT | 1 | ≥1，越小越优先 |

参与自动分配：`business_type=devanning` AND `slot_type=dock` AND `status=open`。

### 2.2 `wms_devanning_order`

- **不新增**车数、体积列。
- 阶段 2 写入：`order_level`、`dock_id`、`devanning_dock`（=`slot_name`）、`devanning_status`、`queue_position`（入队时）。

---

## 3. 园区管理接口扩展

`GET/POST/PUT /wms/park/dock*` 的 `ParkDock` 增加：

```json
{ "priority": 1 }
```

校验：整数且 `>= 1`，缺省 `1`。

---

## 4. 批量新建 `POST /wms/park/scheduling/task/batch`

**权限**：`wms:parkScheduling:add`

### 4.1 Body（拆柜）

```json
{
  "taskType": "devanning",
  "coNos": ["YMLU9552149", "CSNU7960955"],
  "batchItems": [
    { "coNo": "YMLU9552149", "status": "已到待拆", "vehicleCount": 4, "volume": 7 },
    { "coNo": "CSNU7960955", "status": "柜子未到", "vehicleCount": 3, "volume": 10.15 }
  ],
  "expectedDevanningTime": "2026-05-19",
  "devanningRound": "1",
  "remark": null,
  "orderLevel": null,
  "dockId": null,
  "assignToDockMode": null
}
```

| 字段 | 说明 |
|------|------|
| `batchItems[].status` | **中文原文**（见 §4.2）；勿传 `pending` / `completed` 等英文库字段 |
| `vehicleCount` / `volume` | 可选；**仅阶段 2 排序，禁止落库** |
| `orderLevel` | 前端传 `null`；由阶段 2 写入 |
| `dockId` + `assignToDockMode` | 成对传入时：仅阶段 1 + 指定道口，**跳过阶段 2** |

### 4.2 粘贴（前端已解析 → 提交中文 `status`）

| 粘贴文案（子串匹配） | 提交 `batchItems[].status` | 落库 `devanning_status` |
|------|----------|----------|
| 柜子未到 | `柜子未到` | `not_arrived` |
| 库存更新 | `库存更新` | `completed` |
| 已到拆完 | `已到拆完` | `completed` |
| 拆柜中 | `拆柜中` | **`in_progress`**（须 `dockId` + `assignToDockMode=current`，见 `wms-park-batch-paste-dock-sync-api.md`） |
| 已到待拆 / 空 / 其它 | `已到待拆` | `pending` |
| 英文 `pending` 等 | ❌ 报错；前端应映射为中文 |

柜号含 `-`：前端预过滤，失败码 `CO_NO_HYPHEN`。  
第三列：`4/7` → `vehicleCount=4`, `volume=7`（仅阶段 2 排序，不落库）。

---

## 5. 阶段 1 — 更新订单

与 `wms-backend-park-devanning-handoff.md` §4 相同：**逐柜提交**，失败进 `failures`。

写入：`expected_devanning_time`、`devanning_status`、`devanning_round`、`remark` 等。  
**禁止**（无 `dockId` 时）：`order_level`、`dock_id`、`devanning_dock`、`queue_position`。

---

## 6. 阶段 2 — 自动分配

### 6.1 执行条件

| 条件 | 行为 |
|------|------|
| `taskType != devanning` 或 `dockId` 已传 | `autoAssign.executed=false`，跳过 |
| 否则 | 执行 |

### 6.2 分配池

`expected_devanning_time` = 请求的 `expectedDevanningTime`（当天）  
AND `dock_id IS NULL`  
AND `devanning_status IN ('pending','not_arrived')`

本批 `batchItems` 车数/体积 → `Map<coNo,…>`，仅用于排序；池内其它柜 **无数据视为最低档**。

### 6.3 排序 → `order_level`

1. `vehicleCount` 降序  
2. 同车数 `volume` 降序  
3. 无车数/体积 → 最后（`co_no` 稳定排序）

依次 `order_level = 1, 2, 3, …`

### 6.4 道口选择

- 候选：§2.1 开放拆柜道口，按 `priority ASC`, `sort_order ASC`, `id ASC`
- `loadCount`：该道口已绑且 `devanning_status IN ('not_arrived','queued','in_progress')`（建议口径）
- `MAX_PER_DOCK = 4`

对每条已排序海柜：

1. `P` = 当前最小 `priority` 且存在 `loadCount < 4` 的档  
2. 该档全满则 `P+1`  
3. 在 `priority=P` 中选 **`loadCount` 最小** 的道口  
4. 绑定：`dock_id`、`devanning_dock`；`pending`→`queued`+队尾，`not_arrived` 保持  
5. `loadCount++`

### 6.5 无法分配

`assignSkipped[]`：`{ coNo, orderId?, reason: "NO_DOCK_CAPACITY" }`

---

## 7. 响应 `data`

```json
{
  "successCount": 10,
  "failCount": 1,
  "successes": [{ "coNo": "YMLU9552149", "orderId": 1001 }],
  "failures": [{ "coNo": "BAD", "reason": "ORDER_NOT_FOUND" }],
  "autoAssign": {
    "executed": true,
    "expectedDevanningTime": "2026-05-19",
    "assignedCount": 8,
    "skippedCount": 2,
    "assigned": [
      {
        "coNo": "YMLU9552149",
        "orderId": 1001,
        "dockId": 44,
        "dockName": "Dock44",
        "orderLevel": 1,
        "devanningStatus": "queued"
      }
    ],
    "assignSkipped": [],
    "dockLoads": [{ "dockId": 44, "dockName": "Dock44", "count": 3 }]
  }
}
```

---

## 8. 后端检查清单

- [ ] `wms_park_dock.priority` 迁移 + CRUD  
- [ ] `batchItems` 接收 `vehicleCount`/`volume`，**不落库**  
- [ ] 阶段 1 → 阶段 2 顺序  
- [ ] `order_level` 仅阶段 2  
- [ ] `dockId` 预设跳过阶段 2  
- [ ] 返回 `autoAssign`  
- [ ] 看板接口反映新绑定  

---

## 9. 排序示例

| coNo | 本批 车/体积 | orderLevel |
|------|-------------|------------|
| A | 4/7 | 1 |
| B | 3/10.15 | 2 |
| C | 无 | 3 |
