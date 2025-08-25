# 个人全生命周期管理AI助手

一个基于React + TypeScript + Vite构建的智能个人生活管理系统，集成AI助手功能，帮助用户管理日常记录、制定计划、跟踪健康数据，并提供个性化的洞察和建议。

## 功能特性

- 📝 **智能记录管理** - 记录日常生活、工作、学习等各类活动
- 📅 **计划制定与跟踪** - 创建和管理个人计划，跟踪执行进度
- 🏥 **健康数据监控** - 记录和分析健康相关数据
- 🤖 **AI智能助手** - 基于个人数据提供智能分析和建议
- 📊 **数据洞察** - 生成个性化的数据分析报告
- 🔔 **智能提醒** - 基于用户习惯的智能提醒系统
- 🎯 **成长追踪** - 跟踪个人成长和目标达成情况

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **后端**: Node.js + Express + TypeScript
- **数据库**: Supabase (PostgreSQL)
- **AI集成**: OpenAI GPT API
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **部署**: Vercel + GitHub Actions

## 快速开始

### 环境要求

- Node.js 18+
- pnpm (推荐) 或 npm
- Supabase账户

### 本地开发

1. 克隆项目
```bash
git clone <repository-url>
cd 生命
```

2. 安装依赖
```bash
pnpm install
```

3. 配置环境变量
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入你的配置：
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
PORT=3005
```

4. 启动开发服务器
```bash
pnpm dev
```

访问 http://localhost:5173 查看应用

### 构建和部署

```bash
# 构建项目
pnpm build

# 预览构建结果
pnpm preview
```

详细的部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 项目结构

```
├── src/                 # 前端源码
│   ├── components/      # 可复用组件
│   ├── pages/          # 页面组件
│   ├── contexts/       # React上下文
│   ├── hooks/          # 自定义Hooks
│   └── lib/            # 工具库
├── api/                # 后端API
│   ├── routes/         # API路由
│   ├── lib/            # 后端工具库
│   └── types/          # 类型定义
├── supabase/           # 数据库迁移文件
└── .github/workflows/  # GitHub Actions配置
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
