# 用户权限管理优化

## 🎯 优化目标

根据用户需求，优化用户权限管理页面，使其与销售人员管理相似，但具有以下特点：

1. **统一数据源**：用户权限管理和销售人员管理都操作 `User` 表
2. **字段区分**：销售人员管理显示额外的销售相关字段
3. **权限控制**：只有管理员才能对销售人员进行CRUD操作

## ✅ 已完成的优化

### 1. 前端界面优化

#### 🔄 用户信息显示增强
- **头像区分**：销售人员使用蓝色头像，普通用户使用灰色头像
- **标签标识**：销售人员显示"销售"标签
- **详细信息**：显示邮箱、工号、电话等详细信息

```typescript
// 判断是否为销售人员
const isSalesPersonnel = (user: User) => {
  return ['SALES_MANAGER', 'SALES_PERSON'].includes(user.role) || !!user.employeeNo
}

// 用户信息显示
<Avatar 
  src={record.avatar} 
  icon={<UserOutlined />}
  className={isSalesPersonnel(record) ? 'bg-blue-500' : 'bg-gray-500'}
/>
{isSalesPersonnel(record) && (
  <Tag color="blue" size="small">销售</Tag>
)}
```

#### 📊 业绩统计列
- **销售数据**：显示总销售套数、总金额、本月销售等
- **智能显示**：只对销售人员显示统计信息
- **格式化显示**：金额以万元为单位，颜色区分不同类型数据

```typescript
{
  title: '业绩统计',
  key: 'salesStats',
  render: (_, record) => {
    if (!isSalesPersonnel(record) || !record.salesStats) {
      return <Text type="secondary" className="text-xs">-</Text>
    }
    
    return (
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span>总销售:</span>
          <span className="font-medium">{record.salesStats.totalSales}套</span>
        </div>
        <div className="flex justify-between">
          <span>总金额:</span>
          <span className="font-medium text-green-600">
            ¥{(record.salesStats.totalAmount / 10000).toFixed(1)}万
          </span>
        </div>
        <div className="flex justify-between text-blue-600">
          <span>本月:</span>
          <span>{record.salesStats.currentMonthSales}套</span>
        </div>
      </div>
    )
  }
}
```

#### 🔐 权限控制操作
- **动态权限检查**：根据当前用户角色决定是否可以编辑销售人员
- **操作按钮区分**：普通用户和销售人员显示不同的操作按钮
- **权限提示**：无权限时显示提示信息

```typescript
const canEditSalesPersonnel = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN'
const canEdit = !isSalesPersonnel(record) || canEditSalesPersonnel

{canEdit ? (
  <Button type="text" icon={<EditOutlined />} onClick={() => handleEditUser(record)} />
) : (
  <Tooltip title="只有管理员可以编辑销售人员">
    <Button type="text" icon={<EditOutlined />} disabled />
  </Tooltip>
)}
```

### 2. 数据模型扩展

#### 📋 用户接口优化
```typescript
interface User {
  id: number
  username?: string
  name: string
  email: string
  role: string
  isActive: boolean
  phone?: string
  department?: string
  position?: string
  avatar?: string
  projectIds?: string
  lastLoginAt?: string
  
  // 销售人员特有字段
  employeeNo?: string
  remark?: string
  
  // 统计数据（销售人员）
  salesStats?: {
    totalSales: number
    totalAmount: number
    currentMonthSales: number
    currentMonthAmount: number
  }
  
  // 关联数据
  roleInfo?: { ... }
  projects?: Array<{ ... }>
}
```

### 3. 后端API优化

#### 🔄 用户列表API增强
- **字段扩展**：返回所有用户相关字段（phone, department, position, employeeNo, remark等）
- **销售统计**：为销售人员自动计算并返回销售统计数据
- **性能优化**：使用Promise.all并行处理统计数据查询

```typescript
// 为销售人员添加统计数据
const usersWithStats = await Promise.all(
  users.map(async (user) => {
    if (['SALES_MANAGER', 'SALES_PERSON'].includes(user.role) && user.employeeNo) {
      // 获取销售统计数据
      const salesStats = await prisma.salesControl.aggregate({
        where: {
          salesId: user.employeeNo,
          salesStatus: { in: ['SOLD', 'DEPOSIT'] }
        },
        _count: { id: true },
        _sum: { totalWithParking: true }
      });
      
      return {
        ...user,
        salesStats: {
          totalSales: salesStats._count.id || 0,
          totalAmount: salesStats._sum.totalWithParking || 0,
          // ... 本月数据
        }
      };
    }
    return user;
  })
);
```

#### ✏️ 用户更新API完善
- **全字段支持**：支持所有用户字段的更新
- **数据验证**：对邮箱、项目ID等进行有效性验证
- **格式转换**：projectIds数组与字符串之间的转换

```typescript
const updateData: any = {};
if (name !== undefined) updateData.name = name;
if (email !== undefined) updateData.email = email;
if (phone !== undefined) updateData.phone = phone;
if (department !== undefined) updateData.department = department;
if (position !== undefined) updateData.position = position;
if (role !== undefined) updateData.role = role;
if (isActive !== undefined) updateData.isActive = isActive;
if (projectIds !== undefined) {
  updateData.projectIds = Array.isArray(projectIds) ? projectIds.join(',') : projectIds;
}
if (employeeNo !== undefined) updateData.employeeNo = employeeNo;
if (remark !== undefined) updateData.remark = remark;
```

### 4. 交互功能增强

#### 📝 编辑用户模态框
- **完整表单**：支持所有用户字段的编辑
- **角色联动**：根据角色自动启用/禁用销售相关字段
- **验证规则**：邮箱格式验证、必填字段检查等
- **布局优化**：使用Row/Col布局，提供良好的用户体验

#### 📊 销售数据查看模态框
- **统计卡片**：使用Ant Design Statistic组件展示数据
- **数据格式化**：金额显示为万元，保留1位小数
- **详细信息**：显示工号、备注等额外信息
- **响应式布局**：适配不同屏幕尺寸

### 5. 权限控制实现

#### 🔐 当前用户角色获取
```typescript
const fetchCurrentUserRole = async () => {
  try {
    const response = await fetch('/api/auth/session')
    if (response.ok) {
      const session = await response.json()
      setCurrentUserRole(session?.user?.role || 'USER')
    }
  } catch (error) {
    console.error('获取用户角色失败:', error)
  }
}
```

#### 🛡️ 销售人员编辑权限
- **管理员专属**：只有SUPER_ADMIN和ADMIN可以编辑销售人员
- **按钮状态**：无权限时按钮变为禁用状态
- **提示信息**：清晰的权限提示

## 🎨 界面优化亮点

### 1. 视觉区分
- **颜色系统**：蓝色代表销售人员，灰色代表普通用户
- **标签标识**：清晰的角色标签和状态标签
- **图标使用**：丰富的图标增强视觉效果

### 2. 信息密度
- **紧凑布局**：在有限空间内展示更多信息
- **分层显示**：重要信息突出，次要信息淡化
- **响应式设计**：适配不同屏幕尺寸

### 3. 交互体验
- **即时反馈**：操作后立即更新数据
- **加载状态**：网络请求时显示加载动画
- **错误处理**：友好的错误提示信息

## 🚀 技术特点

### 1. 统一数据源
- **单表操作**：用户权限管理和销售人员管理都操作User表
- **字段复用**：最大化利用现有数据结构
- **数据一致性**：避免数据冗余和不一致

### 2. 权限细粒度控制
- **角色级别**：基于用户角色的权限控制
- **功能级别**：具体到每个操作按钮的权限控制
- **数据级别**：不同角色看到不同的数据字段

### 3. 性能优化
- **并行查询**：使用Promise.all并行处理多个数据库查询
- **按需加载**：只为销售人员加载统计数据
- **缓存机制**：减少重复的API调用

## 🎯 实现效果

### ✅ 功能完整性
- [x] 统一的用户管理界面
- [x] 销售人员特殊字段显示
- [x] 业绩统计数据展示
- [x] 权限控制实现
- [x] 完整的CRUD操作

### ✅ 用户体验
- [x] 直观的视觉区分
- [x] 丰富的交互反馈
- [x] 清晰的权限提示
- [x] 响应式布局设计

### ✅ 技术实现
- [x] 前后端数据结构统一
- [x] API接口完整支持
- [x] 错误处理机制
- [x] 性能优化措施

## 📋 使用指南

### 1. 访问页面
```
http://localhost:3001/project/1/admin/permissions/users
```

### 2. 功能说明
- **查看用户**：所有用户都可以查看详细信息
- **编辑普通用户**：所有管理员都可以编辑
- **编辑销售人员**：只有SUPER_ADMIN和ADMIN可以编辑
- **查看销售数据**：管理员可以查看销售人员的业绩统计

### 3. 操作流程
1. 在用户列表中可以看到所有用户
2. 销售人员会有特殊的蓝色头像和"销售"标签
3. 点击"查看详情"可以查看用户的详细权限信息
4. 点击"编辑"可以修改用户信息（需要相应权限）
5. 对于销售人员，管理员还可以点击"销售数据"查看业绩统计

这个优化实现了用户权限管理与销售人员管理的统一，既保持了功能的完整性，又实现了细粒度的权限控制，提供了优秀的用户体验！🎉
