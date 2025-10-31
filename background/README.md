# Slidev 后端 API 服务器

基于 Node.js + Express + TypeScript + SQLite + TypeORM 构建的 Slidev 后端 API 服务。

## 功能特性

- ✅ 用户认证和授权（JWT）
- ✅ 文档管理（创建、读取、更新、删除、复制）
- ✅ 幻灯片编辑（单个和批量更新）
- ✅ 使用 `@slidev/parser` 解析 Markdown
- ✅ 数据库 ORM（TypeORM + SQLite）
- ✅ 输入验证（Joi）
- ✅ 错误处理和日志
- ✅ CORS 支持
- ✅ 安全中间件（Helmet）

## 快速开始

### 1. 安装依赖

```bash
cd background
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
PORT=3000
NODE_ENV=development
DB_DATABASE=./database.sqlite
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### 3. 启动开发服务器

```bash
pnpm dev
```

### 4. 构建和启动生产服务器

```bash
pnpm build
pnpm start
```

## API 端点

### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息
- `PUT /api/auth/profile` - 更新用户信息

### 文档管理

- `GET /api/documents` - 获取文档列表
- `POST /api/documents` - 创建新文档
- `GET /api/documents/:id` - 获取文档详情
- `PUT /api/documents/:id` - 更新文档信息
- `DELETE /api/documents/:id` - 删除文档
- `POST /api/documents/:id/duplicate` - 复制文档
- `GET /api/documents/:id/thumbnail` - 获取缩略图（待实现）
- `GET /api/documents/:id/preview` - 预览文档
- `POST /api/documents/:id/open` - 记录打开时间

### 幻灯片编辑

- `GET /api/slides/:doc_id/slides` - 获取文档所有幻灯片
- `GET /api/slides/:doc_id/slides/:slide_no` - 获取单个幻灯片
- `PUT /api/slides/:doc_id/slides/:slide_no` - 更新单个幻灯片
- `PUT /api/slides/:doc_id/slides` - 批量更新幻灯片

### 其他

- `GET /api/health` - 健康检查
- `GET /api` - API 信息

## 项目结构

```
background/
├── src/
│   ├── entities/          # 数据库实体
│   │   ├── User.ts
│   │   └── Document.ts
│   ├── controllers/       # 控制器
│   │   ├── UserController.ts
│   │   ├── DocumentController.ts
│   │   └── SlideController.ts
│   ├── services/          # 业务逻辑
│   │   ├── UserService.ts
│   │   └── DocumentService.ts
│   ├── routes/           # 路由
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── documents.ts
│   │   └── slides.ts
│   ├── middleware/       # 中间件
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── types/           # 类型定义
│   │   └── index.ts
│   ├── utils/           # 工具函数
│   │   └── hash.ts
│   ├── config/          # 配置
│   │   └── database.ts
│   └── index.ts         # 主入口
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 开发命令

```bash
# 开发
pnpm dev          # 启动开发服务器（热重载）
pnpm build        # 构建项目
pnpm start        # 启动生产服务器

# 代码质量
pnpm lint         # 代码检查
pnpm lint:fix     # 自动修复
pnpm typecheck    # 类型检查
pnpm test         # 运行测试
```

## 认证说明

API 使用 JWT Bearer Token 进行认证。在请求头中添加：

```
Authorization: Bearer <your-jwt-token>
```

## 错误响应格式

所有 API 响应都遵循统一格式：

```json
{
  "success": false,
  "message": "错误信息",
  "code": 1001,
  "details": "详细错误信息（开发环境）"
}
```

## 数据库

项目使用 SQLite 作为数据库，数据库文件会在首次启动时自动创建。

## 注意事项

1. 确保在生产环境中更改 `JWT_SECRET`
2. 缩略图功能尚未实现，返回 404
3. 建议在生产环境中使用 PostgreSQL 或 MySQL
4. 当前版本为初始版本，可能需要进一步优化和安全加固
