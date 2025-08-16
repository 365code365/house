# API数据生成指南

## 🎯 概述

这套脚本通过API接口方式生成各个模块的测试数据，包括：
- 📋 销售人员管理
- 🚗 停车位管理  
- 🏢 销控管理
- 📅 预约管理
- 👥 已购客名单
- ↩️ 退户记录

## 🚀 快速开始

### 1. 安装依赖
```bash
cd scripts
npm install
```

### 2. 快速生成基础数据
```bash
npm run quick
# 或者
node quick-generate-data.js
```

### 3. 完整数据生成
```bash
npm run generate
# 或者
node generate-test-data-via-api.js
```

## 📊 数据生成详情

### 🔥 快速生成模式 (quick-generate-data.js)
适合快速测试，生成少量核心数据：

| 模块 | 数量 | 说明 |
|------|------|------|
| 销售人员 | 5个 | SP001-SP005，基础信息 |
| 停车位 | 20个 | B1-001到B1-020，标准车位 |
| 销控记录 | 30套 | A栋1-5层，每层6套 |
| 预约记录 | 15条 | 未来15天的看房预约 |
| 已购客户 | 20个 | 包含合同和付款信息 |
| 退户记录 | 5条 | 待处理的退户申请 |

### 🎯 完整生成模式 (generate-test-data-via-api.js)
适合完整测试，生成大量真实数据：

| 模块 | 数量 | 说明 |
|------|------|------|
| 销售人员 | 5个 | 详细个人信息和备注 |
| 停车位 | 130个 | B1层50个 + B2层80个，多种类型 |
| 销控记录 | 360套 | A/B/C栋，每栋20层×6套 |
| 预约记录 | 100条 | 多种类型，不同状态 |
| 已购客户 | 200个 | 完整购买信息 |
| 退户记录 | 30条 | 多种退户原因和状态 |

## 🔧 配置说明

### 基础配置
```javascript
const BASE_URL = 'http://localhost:3000';  // API基础地址
const PROJECT_ID = 1;                      // 项目ID
```

### 认证配置
如果API需要认证，请修改 `authHeaders`：
```javascript
let authHeaders = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer your-token-here'  // 添加认证头
};
```

## 📋 使用命令

### 基础命令
```bash
# 快速生成少量测试数据
npm run quick

# 生成完整测试数据  
npm run generate

# 显示帮助信息
npm run help

# 清理测试数据（需要API支持）
npm run clear
```

### 直接运行
```bash
# 快速生成
node quick-generate-data.js

# 完整生成
node generate-test-data-via-api.js

# 生成特定模块（修改脚本调用特定函数）
node -e "require('./generate-test-data-via-api.js').generateSalesPersonnel()"
```

## 🏗️ 数据结构说明

### 1. 销售人员数据
```javascript
{
  employee_no: 'SP001',           // 工号
  name: '张销售',                 // 姓名
  email: 'zhang@company.com',     // 邮箱
  phone: '13800138001',           // 电话
  project_ids: '1',               // 项目ID
  remark: '备注信息'              // 备注
}
```

### 2. 停车位数据
```javascript
{
  parking_no: 'B1-001',          // 车位编号
  type: 'STANDARD',               // 类型：STANDARD/LARGE/DISABLED
  price: 150000,                  // 价格
  sales_status: 'AVAILABLE',      // 状态：AVAILABLE/SOLD
  buyer: '业主姓名',              // 买方（如已售）
  remark: '备注信息'              // 备注
}
```

### 3. 销控数据
```javascript
{
  building: 'A栋',                // 楼栋
  floor: 1,                       // 楼层
  house_no: 'A0101',             // 房号
  unit: '1室',                    // 单元
  area: 120.5,                    // 面积
  unit_price: 20000,             // 单价
  house_total: 2410000,          // 房屋总价
  sales_status: 'SOLD',          // 销售状态
  buyer: '业主姓名',             // 买方
  sales_id: 'SP001'              // 销售员工号
}
```

### 4. 预约数据
```javascript
{
  customer_name: '客户姓名',      // 客户姓名
  customer_phone: '13800138001', // 客户电话
  appointment_type: '看房预约',   // 预约类型
  appointment_date: '2024-01-01T10:00:00Z', // 预约日期
  sales_person_id: 'SP001',      // 销售员工号
  status: 'PENDING'              // 状态：PENDING/CONFIRMED/COMPLETED/CANCELLED
}
```

### 5. 已购客户数据
```javascript
{
  customer_name: '客户姓名',      // 客户姓名
  customer_phone: '13800138001', // 客户电话
  house_info: 'A栋1层1室',       // 房屋信息
  purchase_date: '2024-01-01T00:00:00Z', // 购买日期
  total_amount: 2000000,         // 总金额
  paid_amount: 1000000,          // 已付金额
  contract_number: 'HT20240001', // 合同编号
  sales_person_id: 'SP001'       // 销售员工号
}
```

### 6. 退户记录数据
```javascript
{
  customer_name: '客户姓名',      // 客户姓名
  original_house: 'A栋1层1室',   // 原房屋
  contract_number: 'HT20240001', // 合同编号
  withdrawal_reason: '个人原因', // 退户原因
  refund_amount: 500000,         // 退款金额
  status: 'PENDING',             // 状态：PENDING/APPROVED/REJECTED/COMPLETED
  handler_id: 'SP001'            // 处理人工号
}
```

## 🔍 故障排除

### 常见问题

#### 1. 连接失败
```
❌ 请求失败: connect ECONNREFUSED 127.0.0.1:3000
```
**解决方案**: 确保项目服务器正在运行 `npm run dev`

#### 2. 认证失败  
```
❌ POST /api/xxx: 401
```
**解决方案**: 检查并配置正确的认证头信息

#### 3. 数据重复
```
❌ POST /api/xxx: 400 该记录已存在
```
**解决方案**: 清理现有数据或修改生成逻辑避免重复

#### 4. 权限不足
```
❌ POST /api/xxx: 403
```
**解决方案**: 确保使用具有相应权限的用户账户

### 调试技巧

#### 1. 启用详细日志
在脚本开头添加：
```javascript
const DEBUG = true;
```

#### 2. 单独测试模块
```javascript
// 只生成销售人员数据
generateSalesPersonnel().then(() => console.log('完成'));
```

#### 3. 减少批量大小
```javascript
const batchSize = 5; // 从20改为5，减少并发请求
```

## 🎯 自定义扩展

### 添加新的数据模块
1. 在脚本中添加新的生成函数：
```javascript
async function generateNewModule() {
  console.log('\n🆕 生成新模块数据...');
  // 实现逻辑
}
```

2. 在主函数中调用：
```javascript
await generateNewModule();
```

### 修改数据量
在对应的循环中修改数量：
```javascript
for (let i = 1; i <= 50; i++) { // 从30改为50
  // 生成逻辑
}
```

### 自定义数据内容
修改数据生成逻辑中的随机值范围和选项：
```javascript
const area = 80 + Math.random() * 120;    // 面积范围
const statusList = ['A', 'B', 'C'];       // 状态选项
```

## 📈 性能优化

### 批量处理
```javascript
const batchSize = 20;
for (let i = 0; i < data.length; i += batchSize) {
  const batch = data.slice(i, i + batchSize);
  // 处理批次
}
```

### 并发控制
```javascript
await Promise.all(batch.map(async (item) => {
  return apiCall('/api/endpoint', 'POST', item);
}));
```

### 请求延迟
```javascript
await new Promise(resolve => setTimeout(resolve, 100));
```

## 🎉 使用建议

1. **开发环境**: 使用快速生成模式进行日常开发测试
2. **测试环境**: 使用完整生成模式进行全面功能测试  
3. **演示环境**: 生成适量有代表性的数据
4. **压力测试**: 可以增加数据量进行性能测试

通过这套API数据生成脚本，您可以快速为各个管理模块创建丰富的测试数据，大大提高开发和测试效率！🚀
