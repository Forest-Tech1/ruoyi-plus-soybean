# 拆柜订单 · 入库单打印 — 后端对接

供 **`ruoyi-wms`** 实现与前端（`ruoyi-plus-soybean`）对齐的入库单打印能力。

**关联文档：** `docs/wms-devanning-order-api.md`（§13.3 卡板贴、§3.1 操作状态）；`docs/wms-devanning-order-prelocation-api.md`（系统预库位 JSON）。

---

## 1. 业务说明

- **一张入库单 = 一个拆柜订单**（一个柜号），包含该订单下**全部入库计划**展开后的**卡板行**。
- 现场打印后，仓库人员在「实际库位」「箱数」列手填（打印时这两列为空）。
- **推荐库位**来自入库计划 `systemPreLocation`，按板序号展开（见 §3）。
- **仓库代码**与卡板贴 §13.3 一致（见 §3.2）。
- 无系统预库位时**仍允许打印**，推荐库位为空。
- 顶部版式：**左 QR（柜号）｜中「入库单」+ 柜号｜右日期 `MM/dd/yyyy`**；尺寸与现有拆柜单/卡板贴顶部对齐（后端模版若有样张以其为准）。

---

## 2. 打印数据接口

| 项 | 说明 |
| --- | --- |
| Method | `GET` |
| Path | `/wms/devanning-order/{orderId}/inbound-receipt/print-data` |
| 鉴权 | `@SaCheckPermission("wms:devanningOrder:inboundReceipt")`；未配置时前端回退 `wms:devanningOrder:export` |

### 2.1 响应 `data`

```json
{
  "orderId": 987654321,
  "coNo": "CCLU7832278",
  "printDate": "06/03/2026",
  "qrContent": "CCLU7832278",
  "rows": [
    {
      "inboundPlanId": 1001,
      "systemSoNo": "SO-001",
      "palletSeq": 1,
      "warehouseCodeLabel": "LA-WH-1",
      "recommendedLocation": "A-01-01",
      "actualLocation": null,
      "boxCount": null
    },
    {
      "inboundPlanId": 1001,
      "systemSoNo": "SO-001",
      "palletSeq": 2,
      "warehouseCodeLabel": "LA-WH-HOLD-2",
      "recommendedLocation": "A-01-01",
      "actualLocation": null,
      "boxCount": null
    }
  ],
  "totalPalletCount": 13
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `orderId` | long | 拆柜订单主键 |
| `coNo` | string | 柜号 |
| `printDate` | string | 打印日期，格式 **`MM/dd/yyyy`** |
| `qrContent` | string | 二维码内容，固定为 **`coNo`** |
| `rows` | array | 展开后的卡板行，顺序见 §3.1 |
| `rows[].inboundPlanId` | long | 入库计划行 id |
| `rows[].systemSoNo` | string | 可选，便于排查 |
| `rows[].palletSeq` | int | 该入库计划行内板序号 `1…N` |
| `rows[].warehouseCodeLabel` | string | 展示用仓库代码（§3.2） |
| `rows[].recommendedLocation` | string \| null | 推荐库位；无则 `null` |
| `rows[].actualLocation` | null | 固定 `null`（预留） |
| `rows[].boxCount` | null | 固定 `null`（预留） |
| `totalPalletCount` | int | `rows.length` |

### 2.2 错误

| 场景 | 建议 |
| --- | --- |
| 订单不存在 | 404 |
| 无任何 `estimatedPalletCount > 0` 的入库计划 | 400，`msg` 如「无可打印卡板」 |

---

## 3. 行展开规则（后端必须与前端工具 `wms-inbound-receipt-print.ts` 一致）

### 3.1 顺序与粒度

1. 查询订单下全部入库计划，顺序与详情 Tab / 拆柜单 Excel 一致（建议 `id` 升序）。
2. 对每条计划：`N = max(0, floor(estimatedPalletCount))`。
3. 每条计划生成 **N 行**，行内 `palletSeq = 1 … N`。
4. 全单 `rows` 按计划顺序拼接。

### 3.2 仓库代码（与卡板贴 §13.3 一致）

设 `base = trim(warehouseCode)`，`seq = palletSeq`：

| 条件 | `warehouseCodeLabel` |
| --- | --- |
| `hold == true` | `{base}-HOLD-{seq}` |
| 否则 | `{base}-{seq}` |

`base` 为空时 `warehouseCodeLabel` 可为空字符串。

### 3.3 推荐库位（`systemPreLocation` 按板展开）

解析 JSON（见 `wms-devanning-order-prelocation-api.md` §2）：

```json
{"version":1,"allocations":[
  {"locationCode":"A-01-01","palletCount":3},
  {"locationCode":"B-02-03","palletCount":2}
]}
```

规则：

1. 按 `allocations` **顺序**，每个分配占 `palletCount` 块板，写入对应 `recommendedLocation`。
2. **兼容历史纯文本**：整串视为单库位，该计划 **N 块板均** 显示同一库位。
3. **兼容单条 `palletCount=0`**：同上，N 块板均显示该库位编码。
4. 分配板数之和 **< N**：剩余板 `recommendedLocation = null`。
5. 分配板数之和 **> N**：仅使用前 N 块板对应库位。
6. 无预库位或 `allocations` 为空：该计划所有板 `recommendedLocation = null`。

### 3.4 实际库位与箱数

打印数据接口中 **固定返回 `null`**，不在服务端预填。

---

## 4. 置位「入库单已打」

### 4.1 主表字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `inboundReceiptPrinted` | boolean | 默认 `false`；成功标记后置 `true` |

列表 `GET /wms/devanning-order/list` 与详情 `GET /wms/devanning-order/{id}` **须带回**该字段。

### 4.2 标记接口

| 项 | 说明 |
| --- | --- |
| Method | `PUT` |
| Path | `/wms/devanning-order/{orderId}/inbound-receipt/mark-printed` |
| Body | 空或 `{}` |
| 鉴权 | 同 §2 |

**时机：** 前端在用户从预览弹窗 **成功调起浏览器打印**（iframe `afterprint`）后调用；失败不置位。幂等：已为 `true` 则保持。

### 4.3 列表「操作状态」

前端在「操作状态」列增加**第三行**：`inboundReceiptPrinted === true` 时展示「入库单已打」（与拆柜单、卡板贴两行并列）。

---

## 5. 权限（菜单 SQL 示例）

| 权限字符 | 说明 |
| --- | --- |
| `wms:devanningOrder:inboundReceipt` | 入库单打印 / 标记已打 |

未配置时前端菜单项回退 `wms:devanningOrder:export`。

---

## 6. 前端行为摘要

- 入口：拆柜订单列表行「更多」→ **导出入库单**。
- 优先 `GET .../print-data`；接口未就绪时前端用详情 + 入库计划列表 **本地展开**（规则同 §3）。
- QR 由前端根据 `qrContent`（柜号）生成；顶部三列布局见 §1。
- 打印成功后 `PUT .../mark-printed` 并刷新列表。

---

**文档版本：** 1.0 · 与前端 `devanning-order-inbound-receipt-print-modal`、`wms-inbound-receipt-print.ts` 对齐。
