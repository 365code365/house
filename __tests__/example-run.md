# 测试运行示例

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 运行所有测试
```bash
npm test
```

### 3. 运行特定测试
```bash
# 运行角色管理测试
npm test roles.test.ts

# 运行菜单权限测试
npm test menus.test.ts

# 运行按钮权限测试
npm test buttons.test.ts

# 运行用户权限测试
npm test users.test.ts

# 运行审计日志测试
npm test audit-logs.test.ts
```

## 测试输出示例

### 成功运行示例
```
PASS __tests__/api/admin/roles.test.ts
PASS __tests__/api/admin/permissions/menus.test.ts
PASS __tests__/api/admin/permissions/buttons.test.ts
PASS __tests__/api/admin/permissions/users.test.ts
PASS __tests__/api/admin/audit-logs.test.ts

Test Suites: 5 passed, 5 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        3.42 s
Ran all test suites.
```

### 测试失败示例
```
FAIL __tests__/api/admin/roles.test.ts
  ● Roles API › POST /api/admin/roles › should create a new role

    expect(received).toBe(expected) // Object.is equality

    Expected: 200
    Received: 500

      123 |       const response = await POST(mockRequest)
      124 |       const data = await response.json()
      125 | 
    > 126 |       expect(response.status).toBe(200)
      127 |       expect(data.success).toBe(true)
      128 |       expect(data.data).toEqual(mockCreatedRole)
```

## 测试覆盖率报告

### 生成覆盖率报告
```bash
npm run test:coverage
```

### 覆盖率报告示例
```
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |   85.71 |    75.00 |   83.33 |   85.71 |
 roles.ts |   85.71 |    75.00 |   83.33 |   85.71 | 45,67,89
----------|---------|----------|---------|---------|-------------------

Test Suites: 5 passed, 5 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        3.42 s
Ran all test suites.
```

## 调试测试

### 1. 监听模式
```bash
npm run test:watch
```

### 2. 详细输出
```bash
npm test -- --verbose
```

### 3. 调试特定测试
```bash
# 只运行失败的测试
npm test -- --onlyFailures

# 运行特定测试套件
npm test -- --testNamePattern="Roles API"

# 运行特定测试用例
npm test -- --testNamePattern="should create a new role"
```

## 常见问题解决

### 1. Mock不生效
```typescript
// 确保Mock在测试文件顶部
jest.mock('@/lib/db', () => ({
  prisma: {
    role: {
      findMany: jest.fn(),
      // ... 其他方法
    },
  },
}))
```

### 2. 类型错误
```typescript
// 使用类型断言
;(prisma.role.findMany as jest.Mock).mockResolvedValue(mockData)
```

### 3. 异步测试超时
```typescript
// 增加超时时间
jest.setTimeout(10000)

// 或者使用done回调
it('should handle async operation', (done) => {
  // 异步测试代码
  done()
})
```

### 4. 环境变量问题
```typescript
// 在测试中设置环境变量
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'test-db-url'
```

## 持续集成

### GitHub Actions示例
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
```

### 本地CI运行
```bash
# 运行CI模式的测试
npm run test:ci
```

## 性能优化

### 1. 并行运行
```bash
# 使用Jest的并行运行
npm test -- --maxWorkers=4
```

### 2. 缓存优化
```bash
# 启用Jest缓存
npm test -- --cache
```

### 3. 内存优化
```bash
# 限制内存使用
npm test -- --maxWorkers=2 --maxOldSpaceSize=4096
```

## 扩展测试

### 1. 添加新测试
```typescript
describe('New Feature', () => {
  it('should work correctly', async () => {
    // 测试代码
  })
})
```

### 2. 自定义断言
```typescript
expect.extend({
  toBeValidRole(received) {
    const pass = received.id && received.name && received.displayName
    return {
      pass,
      message: () => `expected ${received} to be a valid role`,
    }
  },
})
```

### 3. 测试工具函数
```typescript
const createMockRequest = (method: string, body?: any) => {
  return new NextRequest('http://localhost:3000/api/test', {
    method,
    body: body ? JSON.stringify(body) : undefined,
  })
}
```
