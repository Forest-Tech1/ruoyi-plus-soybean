# WMS 司机海柜到仓 Check-in（公开页）— 后端 API 对接文档

> **前端页面（无需登录）**：`/driver-check-in`（可分享 `?lang=en` / `?lang=zh`）  
> **前端实现**：`src/views/_builtin/driver-check-in/`（**空白布局**，无侧栏/顶栏/多页签）  
> **请求封装**：`src/service/api/wms/driver-check-in.ts`（`headers.isToken = false`）  
> **拆柜订单字段**：`driverPhone` 见 `docs/wms-devanning-order-api.md` §2.2

---

## 1. 业务目标

司机在仓库门口用手机打开公开页，填写 **司机电话** 与 **柜号**（支持 **多柜批量**，一行一个）后点击 **Check-in**，系统：

1. 在 **`wms_devanning_order`（拆柜订单）** 中按柜号匹配；
2. 仅允许 **`devanning_status = not_arrived`（未到仓）** 的订单登记到仓；
3. 登记成功后将拆柜状态更新为 **`queued`（排队中）** 或 **`pending`（待作业）**（与现有单条逻辑一致，见 §5.2）；
4. **写入/更新** 该订单的 **`driver_phone`**（本批次共用同一司机电话）；
5. 可选：记录到仓时间、操作日志。

**安全**：接口 **不要求登录 Token**，但必须做 **限流 / 防刷**；仅暴露最小字段。

---

## 2. 通用约定

| 项 | 说明 |
| --- | --- |
| 鉴权 | **无** `@SaCheckPermission`；白名单放行 `/wms/public/driver-check-in/**` |
| 响应 | RuoYi `{ code, msg, data }`；成功 `code` 与 `VITE_SERVICE_SUCCESS_CODE` 一致（通常 `200`） |
| 租户 | 公开页默认单租户；前端 **不传** 租户，由后端默认 |
| 柜号 | 匹配前 **trim**；建议 **大小写不敏感**（统一大写比较） |
| 司机电话 | **trim** 后非空；建议长度 6～20；格式校验可按业务放宽（仅数字/「+」等） |
| 批量柜号 | 前端按 **换行** 拆分，去重、去空行；单次最多 **50** 条（`BATCH_TOO_LARGE`） |

### 2.1 可匹配订单的数据范围（创建时间）

```
create_time >= 当天 00:00:00 - 7 天
AND create_time <= 当天 23:59:59 + 2 天
```

### 2.2 拆柜状态字段

| 库表字段 | JSON | 说明 |
| -------- | ---- | ---- |
| `devanning_status` | `devanningStatus` | 与园区调度同枚举 |
| `driver_phone` | `driverPhone` | 司机电话 |

**Check-in 前置条件**：`devanning_status = not_arrived`  
**Check-in 成功后**：有 Dock → `queued`；无 Dock → `pending`（与 §5.2 一致）

---

## 3. 接口一览

| 方法 | URL | 说明 |
| ---- | --- | ---- |
| GET | `/wms/public/driver-check-in/co-suggest` | 柜号模糊联想（**仅单柜模式**调用） |
| POST | `/wms/public/driver-check-in` | **单柜**到仓登记（须 `driverPhone`） |
| POST | `/wms/public/driver-check-in/batch` | **批量**到仓登记（共用 `driverPhone`） |

### 3.1 前端交互（单柜 / 批量分离，2026-05）

公开页 `/driver-check-in` 已将两种录入方式拆开，**后端接口路径不变**，按模式调用不同接口即可：

| 前端模式 | 柜号录入 UI | 登记接口 | 联想接口 |
| -------- | ----------- | -------- | -------- |
| **单柜**（默认） | 单行输入 + **模糊联想**（`co-suggest`） | `POST .../driver-check-in`（仅 1 个柜号） | `GET .../co-suggest?keyword=` |
| **批量** | 多行文本框（一行一柜，可粘贴） | `POST .../driver-check-in/batch` | **不调用** `co-suggest` |

- 输入框右侧有 **模式切换按钮**（单柜 ⇄ 批量）；切换时清空另一侧柜号，避免混用。
- 单柜：司机输入 ≥1 个字符后，前端 **防抖约 280ms** 请求 `co-suggest`；选中或提交时柜号 **转大写**。
- 批量：仅解析换行拆分，**不做**模糊联想；单次最多 50 柜（`BATCH_TOO_LARGE`）。

**后端需保证（若尚未实现请补齐）：**

1. **`GET /wms/public/driver-check-in/co-suggest`** 必须可用（白名单、限流），规则见 §4；仅返回 `devanning_status = not_arrived` 且在 §2.1 时间范围内的订单。
2. **`POST /wms/public/driver-check-in`**：单柜精确匹配 `coNo`（trim + 建议大小写不敏感），**不要**按 `LIKE` 模糊匹配，避免与联想接口语义冲突。
3. **`POST /wms/public/driver-check-in/batch`**：按 `coNos[]` 逐条校验，逻辑与单柜一致；**无需**为批量提供联想接口。
4. 三个接口均 **无 Token**；建议统一网关限流（如 IP + 路径维度）。

---

## 4. 柜号模糊联想

### 4.1 请求

- **URL**：`GET /wms/public/driver-check-in/co-suggest`
- **Query**：`keyword`（string，必填，≥1 字符）

### 4.2 查询规则

在 **§2.1 创建时间范围** 内，且 **`devanning_status = not_arrived`**：

- `co_no LIKE %keyword%`；
- 最多 **20** 条。

### 4.3 响应 `data`

```json
[
  { "id": 8801, "coNo": "CAAU4749001", "devanningStatus": "not_arrived" }
]
```

---

## 5. 单柜到仓 Check-in

### 5.1 请求

- **URL**：`POST /wms/public/driver-check-in`
- **Content-Type**：`application/json`
- **Body**：

```json
{
  "coNo": "CAAU4749001",
  "driverPhone": "13800138000"
}
```

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| `coNo` | string | 是 | 柜号 |
| `driverPhone` | string | 是 | 司机电话 |

### 5.2 处理流程（建议顺序）

1. `driverPhone` trim 后为空 → `400`，`errorCode = DRIVER_PHONE_REQUIRED`。
2. `coNo` trim 后为空 → `400`，`errorCode = CO_NO_REQUIRED`。
3. 在 **§2.1** 内精确匹配 `co_no`（0 / 1 / 多条 → 同原约定）。
4. `devanning_status != not_arrived` → `STATUS_NOT_NOT_ARRIVED`。
5. **成功**：
   - 更新 `devanning_status`（有 Dock → `queued` + 入队；无 Dock → `pending`）；
   - **`driver_phone = driverPhone`**（覆盖或首次写入）；
   - 可选：`arrived_at` / `driver_check_in_time`。

### 5.3 成功响应 `data`

```json
{
  "orderId": 8801,
  "coNo": "CAAU4749001",
  "driverPhone": "13800138000",
  "devanningStatus": "queued",
  "dockId": 12,
  "devanningDock": "Dock-01",
  "checkedInAt": "2026-05-19 14:32:05"
}
```

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `orderId` | long | 拆柜订单 id |
| `coNo` | string | 柜号 |
| `driverPhone` | string | 落库后的司机电话 |
| `devanningStatus` | string | 登记后状态 |
| `dockId` | long nullable | Dock id |
| `devanningDock` | string nullable | 拆柜口名 |
| `checkedInAt` | string | `yyyy-MM-dd HH:mm:ss` |

### 5.4 失败响应

`data` 须含 `errorCode`（见 §7）。单柜失败可不带 `coNo` 列表。

---

## 6. 批量到仓 Check-in

### 6.1 请求

- **URL**：`POST /wms/public/driver-check-in/batch`
- **Content-Type**：`application/json`
- **Body**：

```json
{
  "driverPhone": "13800138000",
  "coNos": ["CAAU4749001", "MSCU1234567", "OOLU9876543"]
}
```

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| `driverPhone` | string | 是 | 本批次共用司机电话 |
| `coNos` | string[] | 是 | 柜号列表；后端建议去重、trim、大写；**1～50** 条 |

### 6.2 处理规则

1. 整批校验 `driverPhone` → 空则 `DRIVER_PHONE_REQUIRED`（整批失败，可不进入逐柜）。
2. `coNos` 为空或去重后长度为 0 → `CO_NOS_REQUIRED`。
3. 去重后长度 **> 50** → `BATCH_TOO_LARGE`。
4. **逐柜**执行与 §5.2 相同的匹配与状态更新逻辑；**单柜失败不影响其它柜**（部分成功）。
5. 每笔成功订单写入相同 **`driver_phone`**。
6. 建议：**同一 HTTP 请求始终返回 200**（业务 `code` 成功），由 `data.successCount` / `failCount` 表达结果；若全批参数非法（无 `coNos`、无电话）可返回 400。

### 6.3 成功响应 `data`（含部分失败）

```json
{
  "driverPhone": "13800138000",
  "total": 3,
  "successCount": 2,
  "failCount": 1,
  "successes": [
    {
      "orderId": 8801,
      "coNo": "CAAU4749001",
      "driverPhone": "13800138000",
      "devanningStatus": "queued",
      "dockId": 12,
      "devanningDock": "Dock-01",
      "checkedInAt": "2026-05-19 14:32:05"
    },
    {
      "orderId": 8803,
      "coNo": "OOLU9876543",
      "driverPhone": "13800138000",
      "devanningStatus": "pending",
      "dockId": null,
      "devanningDock": null,
      "checkedInAt": "2026-05-19 14:33:01"
    }
  ],
  "failures": [
    {
      "coNo": "MSCU1234567",
      "errorCode": "STATUS_NOT_NOT_ARRIVED",
      "devanningStatus": "queued",
      "matchedCount": null,
      "message": null
    }
  ]
}
```

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `driverPhone` | string | 本批提交的电话 |
| `total` | int | 去重后柜号总数 |
| `successCount` | int | 成功条数 |
| `failCount` | int | 失败条数 |
| `successes` | array | 与 §5.3 结构相同 |
| `failures` | array | 见下表 |

**`failures[]` 元素：**

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `coNo` | string | 失败的柜号 |
| `errorCode` | string | 与 §7 一致 |
| `devanningStatus` | string nullable | 当前状态（如 `STATUS_NOT_NOT_ARRIVED`） |
| `matchedCount` | int nullable | `MULTIPLE_ORDERS` 时可选 |
| `message` | string nullable | 可选人类可读说明；前端优先映射 `errorCode` |

---

## 7. 业务错误码 `errorCode`

| `errorCode` | 含义 | 适用 |
| ----------- | ---- | ---- |
| `DRIVER_PHONE_REQUIRED` | 未传或空司机电话 | 单条 / 批量 |
| `CO_NO_REQUIRED` | 未传柜号（单条） | 单条 |
| `CO_NOS_REQUIRED` | 柜号列表为空 | 批量 |
| `BATCH_TOO_LARGE` | 超过 50 柜 | 批量 |
| `ORDER_NOT_FOUND` | 时间范围内无匹配 | 逐柜 |
| `ORDER_OUT_OF_DATE_RANGE` | 不在创建日范围 | 逐柜 |
| `STATUS_NOT_NOT_ARRIVED` | 不是未到仓 | 逐柜 |
| `MULTIPLE_ORDERS` | 多条 co_no 命中 | 逐柜 |

---

## 8. 库表建议

| 列名 | 类型 | 说明 |
| ---- | ---- | ---- |
| `driver_phone` | varchar(32) nullable | 司机电话；Check-in 成功时更新 |
| `driver_check_in_time` | datetime nullable | 最近一次司机登记时间（可选） |
| **登记记录表** | 见专文 | 每笔成功登记 **须落库** `wms_driver_check_in_record`，供仓库列表与顶部通知：**`docs/wms-driver-check-in-record-api.md`** |

---

## 9. 与园区调度 / 拆柜订单的关系

- 业务主数据：**`wms_devanning_order`**（状态、司机电话）。
- 登记流水：**`wms_driver_check_in_record`**（柜号、Check-in 时间、司机电话）。
- Check-in **不**自动创建 Dock；未绑 Dock 时状态为 `pending`。
- 拆柜订单列表、详情、新建单已展示/编辑 `driverPhone`；后台 `PUT /wms/devanning-order` 支持维护该字段。

---

## 10. 安全与白名单

```
/wms/public/driver-check-in/**
```

建议：限流、HTTPS、`co-suggest` 防注入。

---

## 11. 前端联调检查清单

- [ ] 单条：缺 `driverPhone` → `DRIVER_PHONE_REQUIRED`
- [ ] 单条：成功写入 `driver_phone`，列表 `driverPhone` 可见
- [ ] 批量：2+ 柜部分失败时 `successes` + `failures` 结构正确
- [ ] 批量：>50 柜前端拦截；后端亦返回 `BATCH_TOO_LARGE`
- [ ] 未登录可访问；手机多行粘贴柜号正常

---

## 12. 修订记录

| 日期 | 说明 |
| ---- | ---- |
| 2026-05-19 | 初版：公开 Check-in + 联想 |
| 2026-05-19 | 增加 `driverPhone` 必填、批量 `POST .../batch`、拆柜订单字段 |
| 2026-05-19 | 成功登记须写 Check-in 记录表（见 record-api 文档） |
