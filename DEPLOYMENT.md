# 部署指南

本项目支持通过GitHub Actions自动部署到Vercel。

## 部署步骤

### 1. 创建GitHub仓库

1. 在GitHub上创建一个新的仓库
2. 复制仓库的SSH或HTTPS地址
3. 在本地项目中添加远程仓库：
   ```bash
   git remote add origin <你的仓库地址>
   git branch -M main
   git push -u origin main
   ```

### 2. 设置Vercel项目

1. 访问 [Vercel](https://vercel.com) 并登录
2. 点击 "New Project" 创建新项目
3. 选择你的GitHub仓库
4. 配置项目设置：
   - Framework Preset: Vite
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

### 3. 配置环境变量

在Vercel项目设置中添加以下环境变量：
- `VITE_SUPABASE_URL`: 你的Supabase项目URL
- `VITE_SUPABASE_ANON_KEY`: 你的Supabase匿名密钥
- `SUPABASE_SERVICE_ROLE_KEY`: 你的Supabase服务角色密钥
- `JWT_SECRET`: JWT密钥
- `OPENAI_API_KEY`: OpenAI API密钥（如果使用AI功能）

### 4. 配置GitHub Secrets

在GitHub仓库的Settings > Secrets and variables > Actions中添加：
- `VERCEL_TOKEN`: Vercel访问令牌
- `VERCEL_ORG_ID`: Vercel组织ID
- `VERCEL_PROJECT_ID`: Vercel项目ID
- `VITE_SUPABASE_URL`: Supabase项目URL
- `VITE_SUPABASE_ANON_KEY`: Supabase匿名密钥

### 5. 获取Vercel配置信息

安装Vercel CLI并获取项目信息：
```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
```

在项目根目录的`.vercel/project.json`文件中可以找到：
- `projectId`: 对应 `VERCEL_PROJECT_ID`
- `orgId`: 对应 `VERCEL_ORG_ID`

### 6. 部署

推送代码到GitHub后，GitHub Actions会自动触发部署：
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建项目
pnpm build

# 预览构建结果
pnpm preview
```

## 注意事项

1. 确保所有环境变量都已正确配置
2. Supabase数据库需要正确设置RLS策略
3. 如果使用AI功能，需要配置相应的API密钥
4. 首次部署可能需要手动触发或等待GitHub Actions完成

## 故障排除

- 检查GitHub Actions日志查看部署错误
- 确认Vercel项目配置正确
- 验证所有环境变量都已设置
- 检查Supabase连接和权限设置