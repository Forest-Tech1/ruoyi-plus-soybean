# 库存平面图 — 拖拽编辑布局 · 后端对接说明

前端页面：`/wms/order/warehouse-inventory-map`。用户在 **编辑布局** 模式下通过 HTML5 **拖放** 调整库位在平面图上的位置；松手后调用既有 **库位修改接口** 更新 **`rowRank`、`columnRank`**。

本文档约定请求体字段、校验与可选增强（事务/批量）。

---

## 1. 已使用接口（必须可用）

### 1.1 修改库位

- **PUT** `/wms/inventory/location`
- **Body**：与 [wms-inventory-api.md](./wms-inventory-api.md) 一致，至少包含：
  - `id`（必填）
  - `zoneCode`、`locationCode`、`capacity`、`priority`、`status` 等现有库位字段（按你们后端约定：若要求整对象提交，前端会带当前行完整字段）
  - **`rowRank`、`columnRank`**：整数，建议 ≥1，与平面图网格行列一致

**拖拽逻辑（前端）**：

1. **拖到空白格**：仅更新被拖动库位的 `rowRank`、`columnRank` 为目标格（从 1 起始的行列序号）。
2. **拖到已有库位的格子**：与目标库位 **互换** `rowRank`、`columnRank`，即连续两次 **PUT**（先更新源库位到目标坐标，再更新目标库位到源坐标）。

---

## 2. 后端校验建议

| 规则 | 说明 |
|------|------|
| 类型 | `rowRank`、`columnRank` 为正整数（与项目约定一致，一般为 ≥1） |
| 租户/数据范围 | 仅允许修改当前租户下有权限的库位 |
| 唯一性 | 建议同一业务范围内禁止两库位占用同一 `(rowRank, columnRank)`；若 **全部库区** 合并展示，需约定唯一性是按 **全局**、按 **`zoneCode`** 还是其他维度，并与前端平面图过滤规则一致 |
| 并发 | 两次 PUT 交换非原子；高并发下可返回冲突，前端会 **重新拉列表** |

---

## 3. 推荐增强（可选）

1. **事务交换接口**（减少半成功状态）  
   - **PUT** `/wms/inventory/location/swap-coords`  
   - **Body**：`{ "sourceId": 1, "targetId": 2 }` 或带目标行列，由后端在 **单事务** 内互换两行坐标。  
   - 前端可后续改为单次调用以降低不一致风险。

2. **部分更新 PATCH**  
   - 若希望只传 `id + rowRank + columnRank`，可新增 **PATCH** 或与 PUT 约定缺省字段不覆盖。

---

## 4. 库区在平面图中显隐（无需后端）

左侧 **「平面图」开关** 是否显示某库区库位，前端使用 **`localStorage`** 记住 `zoneCode`（与库区 `areaName` 一致）隐藏列表，**不调用后端**。  
若将来需要按用户/租户在服务端记忆偏好，可再增加库区或用户维度配置接口。

---

## 5. 权限

- 拖拽保存使用与库位编辑相同权限：**`wms:location:edit`**（与 `PUT /wms/inventory/location` 一致）。
- 无权限时前端仅关闭「编辑布局」能力，列表与只读平面图仍可按 `wms:location:list` 展示（以现有菜单配置为准）。

---

文档版本：与前端 `src/views/wms/order/warehouse-inventory-map/index.vue` 同步维护。
