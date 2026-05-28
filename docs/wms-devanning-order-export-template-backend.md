# 拆柜单 Excel 导出 · `template` 查询参数（后端对接）

供 **`ruoyi-wms`**（或承接 `/wms/devanning-order` 的控制器）实现与前端租户 **198842** 对齐的模版导出。

## 接口

| 项 | 说明 |
| --- | --- |
| Method | `GET` |
| Path | `/wms/devanning-order/export/{id}` |
| Path 变量 `id` | 拆柜订单主键（与现有导出一致） |

### Query 参数

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `template` | 否 | 模版 **逻辑 key**（非文件系统路径）。缺省时行为与改造前一致：使用默认拆柜单模版填充。 |
| （其它） | — | 前端下载封装可能追加 `t`（时间戳）防缓存，与 Spring `@RequestParam` 兼容，无需特殊处理。 |

### 前端约定（租户隔离）

- **仅当** 当前登录用户上下文中的 **`tenantId === "198842"`**（字符串比较，注意类型兼容）时，请求会携带：  
  **`template=tenant198842-container-unloading`**
- **其它租户**：**不传** `template`，后端不得依赖该参数区分租户（租户以 Sa-Token / 上下文为准）。

### 后端建议行为

1. **鉴权（不变）**  
   `@SaCheckPermission("wms:devanningOrder:export")`  
   无论是否带 `template`，权限校验一致。

2. **`template` 解析**  
   - `null` / 空字符串：使用 **默认** xlsx 模版（现有逻辑）。  
   - `"tenant198842-container-unloading"`：使用为该 key 配置的 **资源模版**（如 classpath 下 `templates/devanning/tenant198842-container-unloading.xlsx`），再按 §《wms-devanning-order-api》§13.1 填充数据。  
   - **其它值**：建议返回 **400** 且 `msg` 说明允许的取值，或安全起见忽略并走默认模版（二选一，需在团队内统一）。

3. **安全**  
   - **禁止**将 `template` 直接拼接为磁盘路径或 classpath 外路径。  
   - 使用 **枚举 / Map&lt;String, Resource&gt;** 白名单映射。

4. **置位 `devanningSheetPrinted`**  
   与现有约定一致：仅在 **文件成功生成并作为流写出前** 将订单 **`devanningSheetPrinted = true`**；失败不置位。

## 调用示例

```http
GET /wms/devanning-order/export/10001?template=tenant198842-container-unloading
Authorization: Bearer <access_token>
Clientid: <与前端 VITE_APP_CLIENT_ID 一致>
```

（前端实际 URL 可能还带 `&t=<timestamp>`，等价于多一个查询参数。）

## 相关源码（前端）

- 常量：`src/constants/wms-devanning.ts` — `WMS_DEVANNING_EXPORT_TEMPLATE_TENANT_ID`、`WMS_DEVANNING_EXPORT_TEMPLATE_KEY`、`withDevanningSheetExportTemplate`  
- 调用：`src/views/wms/order/devanning-order/index.vue` — `handleExportRow`（拆柜单 Excel 导出）
