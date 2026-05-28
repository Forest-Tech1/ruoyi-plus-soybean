# WMS 司机 Check-in 登记记录 — 后端 API 对接文档

> **前端列表页**：`/wms/order/driver-check-in-record`（路由名 `wms_order_driver-check-in-record`）  
> **前端实现**：`src/views/wms/order/driver-check-in-record/`  
> **请求封装**：`src/service/api/wms/driver-check-in-record.ts`  
> **顶部通知**：`src/layouts/modules/global-header/components/message-button.vue`（轮询 + WebSocket/SSE）  
> **公开登记接口**：`docs/wms-driver-check-in-api.md`（登记成功须 **写入本记录表**）

---

## 1. 业务目标

司机在公开页完成 Check-in 后，仓库端需要：

1. **持久化**每一条成功登记（单柜一条；批量按成功条数各一条）；
2. 在 **顶部消息铃铛** 展示当天新登记（点击跳转到记录页并高亮）；
3. 提供 **登记记录列表页**：按 Check-in 时间筛选，**默认当天**，展示 **柜号、Check-in 时间、司机电话**。

---

## 2. 库表建议

表名示例：`wms_driver_check_in_record`

| 列名 | 类型 | 说明 |
| ---- | ---- | ---- |
| `id` | bigint PK | 主键 |
| `tenant_id` | varchar | 租户 |
| `order_id` | bigint nullable | 拆柜订单 `wms_devanning_order.id` |
| `co_no` | varchar | 柜号 |
| `driver_phone` | varchar(32) | 司机电话 |
| `checked_in_at` | datetime | 登记时间（到仓时间） |
| `devanning_status` | varchar nullable | 登记后状态（`queued`/`pending` 等，可选） |
| `create_time` | datetime | 创建时间（可与 `checked_in_at` 相同） |

**索引建议**：`(tenant_id, checked_in_at)`、`(tenant_id, co_no)`。

**写入时机**：`POST /wms/public/driver-check-in` 与 batch 中 **每笔 success** 插入一条；失败不写。

---

## 3. 鉴权与权限

| 接口 | 鉴权 |
| ---- | ---- |
| `GET /wms/driver-check-in/record/list` | 登录 + `wms:driverCheckInRecord:list` |
| `GET /wms/driver-check-in/record/recent` | 登录 + `wms:driverCheckInRecord:list`（或与 list 同权） |

菜单（后台配置，供参考）：

| 项 | 值 |
| --- | --- |
| 路由地址 | `/wms/order/driver-check-in-record` |
| 组件 | `wms/order/driver-check-in-record/index` |
| 权限标识 | `wms:driverCheckInRecord:list` |

---

## 4. 登记记录分页列表

### 4.1 请求

- **URL**：`GET /wms/driver-check-in/record/list`
- **Query**：

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| `pageNum` | int | 页码 |
| `pageSize` | int | 每页条数 |
| `coNo` | string | 柜号模糊（可选） |
| `driverPhone` | string | 司机电话模糊（可选） |
| `params[checkedInBegin]` | string | Check-in 时间起 `yyyy-MM-dd HH:mm:ss` |
| `params[checkedInEnd]` | string | Check-in 时间止 |
| `orderByColumn` | string | 建议支持 `checkedInAt` |
| `isAsc` | string | `asc` / `desc`；前端默认 `checkedInAt` **desc** |

**前端默认筛选**：当天 `00:00:00` ~ `23:59:59`（仓库时区）。

### 4.2 响应

RuoYi 分页：`{ rows, total }`

**`rows[]` 元素：**

```json
{
  "id": 10001,
  "orderId": 8801,
  "coNo": "CAAU4749001",
  "driverPhone": "13800138000",
  "checkedInAt": "2026-05-19 14:32:05",
  "devanningStatus": "queued",
  "createTime": "2026-05-19 14:32:05"
}
```

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| `id` | long | 是 | 记录主键 |
| `orderId` | long | 否 | 拆柜订单 id |
| `coNo` | string | 是 | 柜号 |
| `driverPhone` | string | 是 | 司机电话 |
| `checkedInAt` | string | 是 | Check-in 时间 |
| `devanningStatus` | string | 否 | 登记后状态 |

---

## 5. 近期记录（顶部通知轮询）

### 5.1 请求

- **URL**：`GET /wms/driver-check-in/record/recent`
- **Query**：

| 参数 | 类型 | 默认 | 说明 |
| ---- | ---- | ---- | ---- |
| `todayOnly` | boolean | true | 仅当天 |
| `limit` | int | 20 | 条数上限（前端轮询传 30） |
| `afterId` | long | — | 可选，大于该 id 的增量记录 |

### 5.2 响应 `data`

```json
[
  {
    "id": 10002,
    "coNo": "MSCU1234567",
    "driverPhone": "13800138000",
    "checkedInAt": "2026-05-19 15:01:12",
    "orderId": 8802,
    "devanningStatus": "pending"
  }
]
```

按 `checked_in_at` **降序**。前端对未见过 `id` 推入顶部通知（本地 `localStorage` 记已读 id）。

---

## 6. 实时推送（可选，推荐）

登记成功后向已登录仓库用户推送 **WebSocket / SSE**（与现有 `/resource/websocket`、`/resource/sse` 同通道）。

**消息体（JSON 字符串）：**

```json
{
  "type": "driver_check_in",
  "record": {
    "id": 10002,
    "orderId": 8802,
    "coNo": "MSCU1234567",
    "driverPhone": "13800138000",
    "checkedInAt": "2026-05-19 15:01:12",
    "devanningStatus": "pending"
  }
}
```

前端 `tryParseDriverCheckInPush` 识别 `type === 'driver_check_in'` 后写入铃铛通知。

未实现推送时，前端每 **30 秒** 轮询 §5 仍可工作。

---

## 7. 与公开 Check-in 接口的衔接

在 `docs/wms-driver-check-in-api.md` 单条/批量 **成功分支** 增加：

1. `INSERT` 本表一条；
2. 更新 `wms_devanning_order.driver_phone`（已有约定）；
3. （可选）推送 §6 JSON。

**批量**：每个 `successes[]` 对应 **一条** 记录；`driverPhone` 取批次共用值。

---

## 8. 前端交互说明（供联调）

| 场景 | 行为 |
| ---- | ---- |
| 新记录进入通知 | 铃铛未读 +1；桌面 `$notification` 弹窗 |
| 点击某条 Check-in 通知 | 跳转 `/wms/order/driver-check-in-record?recordId=&coNo=&driverPhone=`，高亮对应行 |
| 底部「查看全部」 | 跳转记录页（默认当天筛选） |
| 记录页 | 柜号 / 司机电话 / Check-in 时间范围筛选 |

---

## 9. 联调检查清单

- [ ] 公开单条 Check-in 成功后，`record/list` 能查到新记录
- [ ] 批量部分成功：仅成功柜有记录
- [ ] `record/recent?todayOnly=true` 返回当天数据
- [ ] 权限：无 `wms:driverCheckInRecord:list` 时列表接口 403
- [ ] WebSocket 推送 JSON 后前端铃铛即时出现（或轮询 30s 内出现）

---

## 10. 修订记录

| 日期 | 说明 |
| ---- | ---- |
| 2026-05-19 | 初版：记录表、列表、近期、推送与前端通知/列表页 |
