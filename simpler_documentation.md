# API 文档（只读版本）

本文档基于 OpenAPI 原始文档精简，**仅保留 GET 接口**，适用于前端只读需求。  
已移除所有用户认证、权限管理及写操作（POST/PUT/DELETE）相关接口。

---

## 基础信息

- **开发 Base URL**: `http://localhost:1337/api`
- **生产 Base URL**: `https://api.abl.secret-sealing.club/api`
- **认证**（可选）：如果部分资源需要权限，请在请求头中添加  
  `Authorization: Bearer <your-jwt-token>`

## 通用查询参数

以下参数适用于所有 `GET` 列表接口，用于分页、排序、过滤和字段选择。

| 参数 | 类型 | 说明 |
|------|------|------|
| `sort` | string | 排序字段及顺序，例如 `name:asc` 或 `-createdAt`（降序） |
| `pagination[page]` | integer | 页码（默认 0） |
| `pagination[pageSize]` | integer | 每页记录数（默认 25） |
| `pagination[start]` | integer | 偏移量（用于旧式分页） |
| `pagination[limit]` | integer | 返回记录数（用于旧式分页） |
| `fields` | string | 返回指定字段，逗号分隔，例如 `title,slug` |
| `populate` | string | 填充关联数据，例如 `coverImage` 或 `*`（全部填充） |
| `filters` | object | 过滤条件，格式 `filters[field][operator]=value`，例如 `filters[title][$contains]=hello` |
| `locale` | string | 指定语言区域（如果启用了国际化） |

## 错误响应

当请求失败时，返回如下 JSON 结构：

```json
{
  "data": null,
  "error": {
    "status": 400,
    "name": "ErrorName",
    "message": "错误描述",
    "details": {}
  }
}
```

常见状态码：`400`（请求错误）、`401`（未认证）、`403`（无权限）、`404`（资源不存在）、`500`（服务器内部错误）。

---

## 资源接口

### 1. 约定 (Conventions)

#### GET /conventions
获取约定列表。

**响应示例**：
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123",
      "name": "上海ComiCup",
      "date": "2025-12-20",
      "attend": true,
      "qqgroup": "12345678",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

**字段说明**：
- `id` (number) - 唯一标识
- `documentId` (string) - 文档ID（Strapi 5+）
- `name` (string) - 约定名称
- `date` (string) - 日期，格式 YYYY-MM-DD
- `attend` (boolean) - 是否参加
- `qqgroup` (string) - QQ群号
- `createdAt` / `updatedAt` - 时间戳

#### GET /conventions/{id}
获取单个约定。

**路径参数**：`id` - 约定 ID（数字）

**响应**：单个约定对象（同上 data 中的结构）。

---

### 2. 事件 (Events)

#### GET /events
获取事件列表。

**响应字段**：
- `id`, `documentId`
- `title` (string) - 标题
- `slug` (string) - URL 标识
- `date` (string) - 日期
- `coverImage` (object) - 封面图片（见文件对象）
- `isUrgent` (boolean) - 是否紧急
- `category` (enum) - `monthly-release`, `new-project`, `announcement`
- `mainContent` (array) - 动态组件列表（见下方说明）
- `createdAt`, `updatedAt`

**mainContent 组件类型**：
- **产品嵌入** (`embedding.product-embed`)：包含 `products` 数组（关联产品ID）
- **内容块** (`content-block.content-block`)：包含 `contentMd`（Markdown文本）
- **iframe 嵌入** (`embedding.iframe-embed`)：包含 `iframeTitle`, `iframeCode`
- **链接嵌入** (`embedding.link-embed`)：包含 `linkName`, `linkContent`
- **PDF 嵌入** (`embedding.pdf-embed`)：包含 `pdfFile`（文件数组）, `pdfName`
- **文件嵌入** (`embedding.file-embed`)：包含 `File`（文件数组）, `FileName`

#### GET /events/{id}
获取单个事件。返回结构与列表项一致。

---

### 3. 产品 (Products)

#### GET /products
获取产品列表。

**字段说明**：
- `id`, `documentId`
- `title` (string) - 产品名
- `slug` (string) - URL 标识
- `category` (enum) - `Kyomoneko`, `Arclic`, `Book`, `Cloth`, `Disc`, `Electronic`, `Figure`, `Goods`, `Plush`, `Virtual`, `Special`
- `coverImage` (object) - 封面图片
- `releaseDate` (string) - 发售日期
- `releaseEvent` (string) - 发售展会
- `description` (string) - 描述
- `productStaff` (array) - 制作人员，每个对象包含 `name` 和 `role`
- `available` (boolean) - 是否可购
- `price` (number) - 价格
- `storageId` (string) - 库存编号
- `createdAt`, `updatedAt`

#### GET /products/{id}
获取单个产品。

---

### 4. 项目 (Projects)

#### GET /projects
获取项目列表。

**字段说明**：
- `id`, `documentId`
- `title` (string) - 项目标题
- `date` (string) - 项目日期
- `coverImage` (object) - 封面图片
- `content` (string) - 详细内容
- `slug` (string) - URL 标识
- `projectStaff` (array) - 参与人员，每个对象包含 `name` 和 `role`
- `nowStatus` (enum) - `preview`, `ongoing`, `ended`, `continuous`
- `createdAt`, `updatedAt`

#### GET /projects/{id}
获取单个项目。

---

### 5. 文件上传 (Upload)

文件相关的只读接口。

#### GET /upload/files
获取所有上传文件列表。

**响应**：文件对象数组。

#### GET /upload/files/{id}
获取单个文件信息。

**文件对象字段**：
- `id` (number)
- `name` (string)
- `alternativeText` (string)
- `caption` (string)
- `width` / `height` (number)
- `formats` (object) - 不同尺寸的图片格式
- `hash` (string)
- `ext` (string) - 扩展名
- `mime` (string)
- `size` (number)
- `url` (string) - 访问地址
- `previewUrl` (string)
- `provider` (string) - 存储提供商
- `provider_metadata` (object)
- `createdAt`, `updatedAt`

---

## 注意事项

- 所有时间字段均采用 ISO 8601 格式（`YYYY-MM-DDTHH:mm:ss.sssZ`）。
- 关联字段（如 `coverImage`）在默认情况下返回对象，可通过 `populate` 参数控制是否展开。
- 如需获取多语言内容，请使用 `locale` 参数。
- 若接口需要认证，请确保在请求头中携带有效的 Bearer Token。

此文档仅包含只读接口，如需更多操作（创建、更新、删除）或用户管理功能，请参考完整版 OpenAPI 文档。