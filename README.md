# 房地产销控管理系统

一个基于 Next.js 的现代化房地产销售控制管理系统，提供全面的房屋销售、客户管理、预约管理、财务管理等功能。

## 📋 文档中心

**⚠️ 重要提醒**: 开始任何新需求前，请先查阅 [`md/`](./md/) 文件夹中的技术文档，避免重复开发已完成的功能。

- 📖 **[完整文档索引](./md/README.md)** - 查看所有已完成功能和技术文档
- 🔐 **权限管理系统** - 菜单权限、按钮权限、用户管理 (已完成)
- 🎨 **界面优化** - 菜单树结构、UI美化、操作优化 (已完成) 
- 📊 **数据管理** - 测试数据生成、问题诊断工具 (已完成)

## 🚀 项目特色

- **现代化技术栈**：基于 Next.js 14、React 18、TypeScript 构建
- **响应式设计**：支持桌面端和移动端访问
- **实时数据**：使用 React Query 实现数据缓存和自动刷新
- **完整的业务流程**：覆盖房地产销售全生命周期管理
- **完善的权限系统**：基于RBAC的菜单和按钮级权限控制
- **数据可视化**：提供丰富的图表和统计分析
- **权限管理**：支持多角色用户权限控制

## 📋 核心功能

### 🏠 销控管理
- 房屋信息管理（楼栋、楼层、单元、面积、价格）
- 销售状态跟踪（未售出、订金、售出、不销售）
- 批量操作和高级搜索筛选
- 销售数据导入导出（Excel、PDF）
- 实时销售统计和趋势分析

### 👥 客户管理
- 已购客户信息管理
- 客户评级系统（S/A/B/C/D）
- 访客问卷调查管理
- 客户需求分析和跟踪

### 📅 预约管理
- 客户预约日程管理
- 日历视图和列表视图
- 预约状态跟踪（待确认、已确认、已取消）
- 销售人员预约分配

### 🅿️ 停车位管理
- 停车位信息管理
- 多种停车位类型支持
- 停车位销售状态跟踪
- 价格管理

### 💰 财务管理
- 预算计划管理
- 费用支出跟踪
- 订金管理和提醒
- 佣金计算和管理
- 退户记录管理

### 🏢 交房管理
- 交房进度跟踪
- 完工项目和缺陷管理
- 交房日期安排
- 状态管理（待点交、点交中、已完成、延期）

### 👨‍💼 销售人员管理
- 销售人员信息管理
- 项目权限分配
- 业绩统计和分析

### 📊 数据统计
- 销售趋势图表
- 关键指标展示
- 多维度数据分析
- 实时数据更新

## 🛠️ 技术栈

### 前端技术
- **框架**: Next.js 14 (React 18)
- **语言**: TypeScript
- **样式**: Tailwind CSS + Ant Design
- **状态管理**: React Query (TanStack Query)
- **表单处理**: React Hook Form + Zod
- **UI组件**: Radix UI + Ant Design
- **图表**: Recharts
- **日期处理**: date-fns
- **PDF生成**: jsPDF + html2canvas
- **Excel处理**: xlsx

### 后端技术
- **API**: Next.js API Routes
- **数据库**: MySQL
- **ORM**: Prisma
- **认证**: NextAuth.js
- **密码加密**: bcryptjs

### 开发工具
- **包管理**: npm
- **代码规范**: ESLint
- **测试**: Jest
- **类型检查**: TypeScript

## 📦 安装说明

### 环境要求
- Node.js 18.0 或更高版本
- MySQL 8.0 或更高版本
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd sales-management-system
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
创建 `.env.local` 文件并配置以下环境变量：
```env
# 数据库连接
DATABASE_URL="mysql://username:password@localhost:3306/sales_management"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# 其他配置
NODE_ENV="development"
```

4. **数据库设置**
```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma db push

# （可选）填充示例数据
node scripts/seed-mock-data.js
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用程序。

## 🚀 部署

### 生产环境构建
```bash
npm run build
npm start
```

### 环境变量配置
确保在生产环境中正确配置所有必要的环境变量。

## 📁 项目结构

```
├── app/                    # Next.js 13+ App Router
│   ├── api/               # API 路由
│   ├── project/[id]/      # 项目相关页面
│   │   ├── sales-control/ # 销控管理
│   │   ├── appointments/  # 预约管理
│   │   ├── parking/       # 停车位管理
│   │   ├── budget/        # 预算管理
│   │   ├── expenses/      # 费用管理
│   │   ├── commission/    # 佣金管理
│   │   ├── deposit/       # 订金管理
│   │   ├── handover/      # 交房管理
│   │   └── statistics/    # 统计分析
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── sales-control/     # 销控相关组件
│   ├── appointments/      # 预约相关组件
│   └── ui/               # 通用 UI 组件
├── hooks/                # 自定义 Hooks
├── lib/                  # 工具库
├── prisma/               # 数据库模型
├── scripts/              # 脚本文件
├── types/                # TypeScript 类型定义
└── public/               # 静态资源
```

## 🔧 开发指南

### 代码规范
- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 代码规范
- 使用 Prettier 进行代码格式化
- 组件采用函数式组件 + Hooks

### 数据库操作
```bash
# 查看数据库状态
npx prisma studio

# 重置数据库
npx prisma db reset

# 生成迁移文件
npx prisma migrate dev
```

### 测试
```bash
# 运行测试
npm test

# 运行测试覆盖率
npm run test:coverage
```

## 📊 API 文档

### 项目管理
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建新项目
- `GET /api/projects/[id]` - 获取项目详情
- `PUT /api/projects/[id]` - 更新项目信息

### 销控管理
- `GET /api/projects/[id]/sales-control` - 获取销控数据
- `POST /api/projects/[id]/sales-control` - 创建销控记录
- `PUT /api/projects/[id]/sales-control/[houseId]` - 更新销控记录
- `DELETE /api/projects/[id]/sales-control/[houseId]` - 删除销控记录

### 预约管理
- `GET /api/projects/[id]/appointments` - 获取预约列表
- `POST /api/projects/[id]/appointments` - 创建新预约
- `PUT /api/projects/[id]/appointments/[appointmentId]` - 更新预约
- `DELETE /api/projects/[id]/appointments/[appointmentId]` - 删除预约

### 停车位管理
- `GET /api/projects/[id]/parking` - 获取停车位列表
- `POST /api/projects/[id]/parking` - 创建停车位
- `PUT /api/projects/[id]/parking/[parkingId]` - 更新停车位

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 更新日志

### v0.1.0 (当前版本)
- ✅ 基础销控管理功能
- ✅ 客户预约管理
- ✅ 停车位管理
- ✅ 财务管理模块
- ✅ 数据统计和分析
- ✅ 响应式设计
- ✅ PDF/Excel 导出功能

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目地址：[GitHub Repository]
- 问题反馈：[GitHub Issues]
- 邮箱：[your-email@example.com]

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户。

---

**注意**：这是一个房地产销控管理系统，专为房地产开发商和销售团队设计，提供完整的销售流程管理解决方案。