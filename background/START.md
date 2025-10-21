# 启动说明

## 快速启动

1. **安装依赖**
   ```bash
   cd background
   pnpm install
   ```

2. **启动开发服务器**
   ```bash
   pnpm dev
   ```

3. **测试 API**
   ```bash
   # 在另一个终端窗口运行
   node test-api.js
   ```

## API 测试示例

### 1. 健康检查
```bash
curl http://localhost:3000/api/health
```

### 2. 用户注册
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. 用户登录
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. 创建文档（需要认证）
```bash
# 先登录获取 token，然后：
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "我的演示文稿",
    "description": "测试描述",
    "content": "---\ntitle: 我的演示文稿\nlayout: cover\n---\n\n# 标题\n\n内容"
  }'
```

### 5. 获取文档列表
```bash
curl -X GET http://localhost:3000/api/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 常见问题

### Q: 启动时提示模块找不到
A: 确保已运行 `pnpm install` 安装所有依赖

### Q: 数据库连接失败
A: 检查 `.env` 文件中的数据库配置，确保有写入权限

### Q: JWT 认证失败
A: 检查请求头中的 `Authorization` 格式是否正确：`Bearer <token>`

### Q: CORS 错误
A: 检查 `.env` 文件中的 `CORS_ORIGIN` 配置

## 开发调试

- 开发服务器支持热重载
- 数据库文件会在 `./database.sqlite` 自动创建
- 查看控制台日志了解请求详情
- 使用 `pnpm typecheck` 检查类型错误
- 使用 `pnpm lint` 检查代码风格