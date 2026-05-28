# WMS 库存管理 — 后端接口说明（库区 / 库位）

本文档供后端实现 **库区管理**、**库位管理** 接口与权限、字典数据。前端路径：

- 库区：`/wms/inventory/warehouse-area`
- 库位：`/wms/inventory/location`

统一响应格式与若依一致：`code`、`msg`、`data` / 分页字段 `rows`、`total`（与现有 `defaultTransform` 对齐）。

---

## 1. 字典数据（需在 `sys_dict_type` / `sys_dict_data` 中配置）

| 字典类型                  | 说明                         | 示例项（dict_label / dict_value 自定） |
| ------------------------- | ---------------------------- | -------------------------------------- |
| `wms_warehouse_area_type` | 库区类型                     | 暂存区、拣货区、一件代发插件区等       |
| `wms_storage_method`      | 存放方式                     | 地堆、货架等                           |
| `sys_normal_disable`      | 库位启用状态（复用系统字典） | `0` 正常（前端展示为启用）、`1` 停用   |

---

## 2. 权限标识（建议，`hasAuth` 与按钮一致）

### 2.1 库区 `wms:warehouseArea:*`

| 权限字符                    | 说明                     |
| --------------------------- | ------------------------ |
| `wms:warehouseArea:list`    | 分页列表                 |
| `wms:warehouseArea:query`   | 单条详情（若单独拆接口） |
| `wms:warehouseArea:add`     | 新增                     |
| `wms:warehouseArea:edit`    | 编辑、库位混合存储开关   |
| `wms:warehouseArea:remove`  | 删除、批量删除           |
| `wms:warehouseArea:putaway` | 上架条件维护             |

### 2.2 库位 `wms:location:*`

| 权限字符              | 说明           |
| --------------------- | -------------- |
| `wms:location:list`   | 分页列表       |
| `wms:location:query`  | 单条详情       |
| `wms:location:add`    | 新增           |
| `wms:location:edit`   | 编辑           |
| `wms:location:remove` | 删除、批量删除 |
| `wms:location:status` | 批量修改状态   |
| `wms:location:import` | 导入           |

---

## 3. 库区管理 API

**基础路径**：`/wms/inventory/warehouse-area`

**领域模型字段（JSON 驼峰与前端一致；DB 可用 snake_case 由后端映射）**

| 字段                   | 类型     | 说明                                                          |
| ---------------------- | -------- | ------------------------------------------------------------- |
| `id`                   | Long     | 主键                                                          |
| `areaName`             | String   | 区域名称（必填）                                              |
| `storageMethod`        | String   | 存放方式，字典 `wms_storage_method`                           |
| `areaType`             | String   | 库区类型，字典 `wms_warehouse_area_type`                      |
| `locationMixedStorage` | Boolean  | 库位是否混合存储                                              |
| `maxMixedQty`          | Integer  | **最大混合数量**；当 `locationMixedStorage=true` 时必填且 > 0 |
| `putawayCondition`     | String   | 上架条件（建议存 JSON 字符串）；空或 null 表示「未设置」      |
| `createTime`           | DateTime | 创建时间                                                      |

> **不包含**：逻辑区域管理、逻辑区域名称等字段（本需求已去除）。

### 3.1 分页列表

- **GET** `/wms/inventory/warehouse-area/list`
- **Query**（在若依分页参数基础上）：

| 参数            | 说明                                            |
| --------------- | ----------------------------------------------- |
| `pageNum`       | 页码                                            |
| `pageSize`      | 每页条数                                        |
| `areaName`      | 模糊查询                                        |
| `areaType`      | 精确/字典值                                     |
| `storageMethod` | 精确/字典值                                     |
| `orderByColumn` | 可选；建议白名单：`createTime`、`areaName`      |
| `isAsc`         | `asc` / `desc`；**建议默认**：`createTime` 降序 |

- **Response**：`rows` + `total`，元素为库区对象。

### 3.2 详情（可选，当前前端以列表行编辑为主）

- **GET** `/wms/inventory/warehouse-area/{id}`

### 3.3 新增

- **POST** `/wms/inventory/warehouse-area`
- **Body**：`areaName`（必填）、`storageMethod`、`areaType`、`locationMixedStorage`（默认 false）、`maxMixedQty`（当混合存储开启时必填）

### 3.4 修改

- **PUT** `/wms/inventory/warehouse-area`
- **Body**：含 `id` 及可改字段（同上）。

### 3.5 仅更新「库位混合存储」

- **PUT** `/wms/inventory/warehouse-area/{id}/mixed-storage`
- **Body**：`{ "locationMixedStorage": true | false, "maxMixedQty": 10 }`
- 约束：
  - 当 `locationMixedStorage=true`：`maxMixedQty` **必填且 > 0**
  - 当 `locationMixedStorage=false`：`maxMixedQty` 建议置空（`null`）

### 3.6 仅更新「上架条件」（已废弃 · 前端不再调用）

> 上架规则已迁移至 **仓库设置 → 上架配置**，见 **[wms-putaway-rule-api.md](./wms-putaway-rule-api.md)**。本接口可保留用于数据迁移或暂时双写，新 UI 不再使用库区上的 `putawayCondition` 编辑入口。

- **PUT** `/wms/inventory/warehouse-area/{id}/putaway-condition`
- **Body**：`{ "putawayCondition": "<JSON_STRING>" }`
- `putawayCondition` 允许空字符串：表示清空条件。

**历史 JSON 结构（version 1，迁移参考）**：

```json
{
  "version": 1,
  "op": "OR",
  "rules": [
    {
      "priority": 1,
      "dispatchMethod": null,
      "platformId": 1,
      "platformCodes": ["ONT8", "LAX9"]
    }
  ]
}
```

说明：

- `rules` 为多行规则，行与行之间为 **OR** 关系（与前端弹窗展示一致）。
- 本版本已**移除「地址类型」字段**，后端无需接收/存储该字段。

### 3.7 删除

- **DELETE** `/wms/inventory/warehouse-area/{ids}`  
  `ids` 为逗号分隔多个 id，与拆柜订单删除风格一致。

---

## 4. 库位管理 API

**基础路径**：`/wms/inventory/location`

**领域模型字段**

| 字段           | 类型     | 说明                            |
| -------------- | -------- | ------------------------------- |
| `id`           | Long     | 主键                            |
| `zoneCode`     | String   | 区域                            |
| `locationCode` | String   | 库位编码                        |
| `rowRank`      | Integer  | 排位                            |
| `columnRank`   | Integer  | 列位                            |
| `capacity`     | Integer  | 库位容量                        |
| `priority`     | Integer  | 优先级                          |
| `status`       | String   | `0` / `1`，`sys_normal_disable` |
| `createTime`   | DateTime | 创建时间（列表可排序）          |

### 4.1 分页列表

- **GET** `/wms/inventory/location/list`
- **Query**：

| 参数                  | 说明                                                                 |
| --------------------- | -------------------------------------------------------------------- |
| `pageNum`、`pageSize` | 分页                                                                 |
| `zoneCode`            | 可选；**库区**筛选（建议与库位表 `zoneCode` 存值一致，如库区名称；精确或按约定模糊） |
| `locationKeyword`     | 可选；**仅库位**侧模糊（如库位编码）；与 `zoneCode` **独立**，勿与库区混在一个字段 |
| `keyword`             | （兼容旧版）同时匹配区域与库位；新前端已拆分为上两项，后端可忽略或自行映射 |
| `inventoryWarehouseCode` | （可选）库存平面图：库存含该仓库代码的库位 ∪ 空库位，详见 [wms-warehouse-inventory-visual-map-api.md](./wms-warehouse-inventory-visual-map-api.md) §1.0 |
| `putawayDispatchMethod` | （可选）库存平面图·上架筛选：派送方式，非空才启用上架维度，详见同上 §1.0 |
| `putawayPlatformId` | （可选）库存平面图·上架筛选：平台 id |
| `putawayPlatformWarehouseCode` | （可选）库存平面图·上架筛选：平台仓库代码 |
| `orderByColumn`       | 白名单建议：`createTime`、`zoneCode`、`locationCode`                 |
| `isAsc`               | **建议默认**：`createTime` 降序                                      |

### 4.2 详情

- **GET** `/wms/inventory/location/{id}`

### 4.3 新增

- **POST** `/wms/inventory/location`
- **Body**：`zoneCode`、`locationCode` 必填；`status` 默认 `0`；其余可选。

### 4.4 修改

- **PUT** `/wms/inventory/location`
- **Body**：含 `id` 及可改字段。

### 4.5 批量修改状态

- **PUT** `/wms/inventory/location/status`
- **Body**：

```json
{
  "ids": [1, 2, 3],
  "status": "0"
}
```

`status` 为 `0`（正常/启用）或 `1`（停用）。

### 4.6 删除

- **DELETE** `/wms/inventory/location/{ids}`  
  多 id 逗号分隔。

### 4.7 导入

与系统用户导入习惯一致（若依 `BaseController` 导入模式）：

- **POST** `/wms/inventory/location/importData`  
  multipart；表单字段可带 `updateSupport`（boolean，是否更新已存在数据）。
- **GET/POST** `/wms/inventory/location/importTemplate`  
  下载 Excel 模板（与前端 `useDownload` 调用的路径一致即可）。

---

## 5. 安全与校验建议

1. **排序字段白名单**：`orderByColumn` 仅允许映射到真实列，防 SQL 注入。
2. **租户**：若为多租户库，上述表需带 `tenant_id`，查询自动过滤。
3. **唯一性**：建议数据库层对 `(tenant_id, zoneCode, locationCode)` 或业务约定唯一键做约束。
4. **删除**：若库区/库位被库存占用，应返回明确业务错误码/文案。

---

## 6. 菜单路由（供配置参考）

后端菜单 `path` / 组件若与前端路由一致，可配置：

| 路由 name                      | path                            |
| ------------------------------ | ------------------------------- |
| `wms_inventory`                | `/wms/inventory`（目录）        |
| `wms_inventory_warehouse-area` | `/wms/inventory/warehouse-area` |
| `wms_inventory_location`       | `/wms/inventory/location`       |

前端组件已由 `elegant-router` 生成，动态菜单 `component` 需与项目约定一致（一般为视图路径字符串，以后台脚手架为准）。

---

文档版本：与前端仓库 `src/views/wms/inventory`、`src/service/api/wms` 同步维护。
