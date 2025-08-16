const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';
const PROJECT_ID = 1;

// 深度诊断脚本
async function deepDiagnosis() {
  console.log('🔍 开始深度诊断...\n');
  
  try {
    // 1. 检查数据库连接
    console.log('📊 1. 检查数据库连接...');
    try {
      await prisma.$connect();
      console.log('✅ 数据库连接正常');
      
      // 检查表是否存在
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
        AND table_name IN ('SalesPersonnel', 'ParkingSpace', 'SalesControl', 'Appointment', 'PurchasedCustomer', 'WithdrawalRecord')
      `;
      console.log('✅ 数据库表检查:', tables);
      
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      return;
    }
    
    // 2. 检查项目是否存在
    console.log('\n🏗️ 2. 检查项目数据...');
    try {
      const project = await prisma.project.findUnique({
        where: { id: PROJECT_ID }
      });
      
      if (project) {
        console.log('✅ 项目存在:', project.name);
      } else {
        console.log('❌ 项目不存在，ID:', PROJECT_ID);
        console.log('📋 现有项目列表:');
        const projects = await prisma.project.findMany();
        projects.forEach(p => {
          console.log(`   - ID: ${p.id}, 名称: ${p.name}`);
        });
      }
    } catch (error) {
      console.error('❌ 检查项目失败:', error.message);
    }
    
    // 3. 测试API端点可访问性
    console.log('\n🌐 3. 测试API端点...');
    const endpoints = [
      `/api/projects/${PROJECT_ID}`,
      `/api/projects/${PROJECT_ID}/sales-personnel`,
      `/api/projects/${PROJECT_ID}/parking`,
      `/api/projects/${PROJECT_ID}/sales-control`,
      `/api/projects/${PROJECT_ID}/appointments`,
      `/api/projects/${PROJECT_ID}/purchased-customers`,
      `/api/projects/${PROJECT_ID}/withdrawal-records`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`${response.ok ? '✅' : '❌'} GET ${endpoint}: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`   错误详情: ${errorText.substring(0, 200)}...`);
        }
      } catch (error) {
        console.log(`❌ GET ${endpoint}: ${error.message}`);
      }
    }
    
    // 4. 测试POST请求（实际创建数据）
    console.log('\n📝 4. 测试实际数据创建...');
    
    // 测试创建销售人员
    console.log('测试创建销售人员...');
    try {
      const testSalesPersonData = {
        employee_no: 'TEST001',
        name: '测试销售员',
        email: 'test@example.com',
        phone: '13800000000',
        remark: '这是一个测试数据'
      };
      
      console.log('发送数据:', JSON.stringify(testSalesPersonData, null, 2));
      
      const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/sales-personnel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testSalesPersonData)
      });
      
      const responseText = await response.text();
      console.log(`响应状态: ${response.status} ${response.statusText}`);
      console.log(`响应内容: ${responseText}`);
      
      if (response.ok) {
        console.log('✅ 销售人员创建成功');
        
        // 立即检查数据库
        const createdPerson = await prisma.salesPersonnel.findUnique({
          where: { employeeNo: 'TEST001' }
        });
        
        if (createdPerson) {
          console.log('✅ 数据库中找到了创建的销售人员:', createdPerson.name);
          
          // 清理测试数据
          await prisma.salesPersonnel.delete({
            where: { employeeNo: 'TEST001' }
          });
          console.log('🧹 清理了测试数据');
        } else {
          console.log('❌ API返回成功但数据库中没有数据！');
        }
      } else {
        console.log('❌ 销售人员创建失败');
        
        // 检查是否是认证问题
        if (response.status === 401) {
          console.log('🔐 这是认证问题！API需要登录。');
        } else if (response.status === 403) {
          console.log('🚫 这是权限问题！当前用户没有权限。');
        } else if (response.status === 404) {
          console.log('🔍 API端点不存在或项目不存在。');
        }
      }
    } catch (error) {
      console.error('❌ 测试创建销售人员失败:', error.message);
    }
    
    // 5. 检查当前数据库中的数据
    console.log('\n📊 5. 检查当前数据库状态...');
    try {
      const counts = {
        salesPersonnel: await prisma.salesPersonnel.count(),
        parkingSpaces: await prisma.parkingSpace.count({ where: { projectId: PROJECT_ID } }),
        salesControl: await prisma.salesControl.count({ where: { projectId: PROJECT_ID } }),
        appointments: await prisma.appointment.count({ where: { projectId: PROJECT_ID } }),
        purchasedCustomers: await prisma.purchasedCustomer.count({ where: { projectId: PROJECT_ID } }),
        withdrawalRecords: await prisma.withdrawalRecord.count({ where: { projectId: PROJECT_ID } })
      };
      
      console.log('当前数据库记录数:');
      Object.entries(counts).forEach(([table, count]) => {
        console.log(`   ${table}: ${count}条`);
      });
      
      const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
      console.log(`   总计: ${totalRecords}条记录`);
      
    } catch (error) {
      console.error('❌ 检查数据库状态失败:', error.message);
    }
    
    // 6. 生成诊断报告
    console.log('\n📋 6. 诊断报告和建议...');
    console.log('可能的问题和解决方案:');
    console.log('');
    console.log('🔐 1. 认证问题:');
    console.log('   - 如果API返回401，需要先登录获取认证token');
    console.log('   - 检查NextAuth配置和session状态');
    console.log('');
    console.log('🚫 2. 权限问题:');
    console.log('   - 如果API返回403，当前用户没有创建数据的权限');
    console.log('   - 需要使用管理员账户或调整权限设置');
    console.log('');
    console.log('🔍 3. API路径问题:');
    console.log('   - 如果API返回404，检查路由文件是否存在');
    console.log('   - 检查项目ID是否正确');
    console.log('');
    console.log('💾 4. 数据库事务问题:');
    console.log('   - API可能返回成功但事务回滚了');
    console.log('   - 检查API代码中的错误处理逻辑');
    console.log('');
    console.log('🛠️ 建议的解决步骤:');
    console.log('   1. 先在浏览器中登录系统');
    console.log('   2. 使用浏览器开发者工具获取认证cookie/token');
    console.log('   3. 在脚本中添加认证信息');
    console.log('   4. 或者临时禁用API的认证检查进行测试');
    
  } catch (error) {
    console.error('❌ 诊断过程出现错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 创建带认证的测试脚本
async function createAuthenticatedTest() {
  console.log('\n🔧 创建认证测试脚本...');
  
  const authenticatedScript = `
const fetch = require('node-fetch');

// 从浏览器复制的认证信息
const AUTH_COOKIE = 'your-auth-cookie-here'; // 从浏览器开发者工具获取
const BASE_URL = 'http://localhost:3000';
const PROJECT_ID = 1;

async function testWithAuth() {
  const testData = {
    employee_no: 'AUTH_TEST001',
    name: '认证测试员',
    email: 'authtest@example.com',
    phone: '13900000000',
    remark: '认证测试数据'
  };
  
  try {
    const response = await fetch(\`\${BASE_URL}/api/projects/\${PROJECT_ID}/sales-personnel\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': AUTH_COOKIE, // 使用浏览器的认证cookie
        // 或者使用Bearer token:
        // 'Authorization': 'Bearer your-token-here'
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    console.log(\`状态: \${response.status}\`);
    console.log(\`响应: \${responseText}\`);
    
    if (response.ok) {
      console.log('✅ 带认证的请求成功！');
    } else {
      console.log('❌ 带认证的请求仍然失败');
    }
  } catch (error) {
    console.error('请求错误:', error.message);
  }
}

testWithAuth();
`;
  
  require('fs').writeFileSync('scripts/test-with-auth.js', authenticatedScript);
  console.log('✅ 已创建 scripts/test-with-auth.js');
  console.log('📝 请编辑该文件，添加从浏览器获取的认证信息');
}

// 主函数
async function main() {
  await deepDiagnosis();
  await createAuthenticatedTest();
  
  console.log('\n🎯 下一步建议:');
  console.log('1. 检查上面的诊断结果');
  console.log('2. 如果是认证问题，编辑 scripts/test-with-auth.js 添加认证信息');
  console.log('3. 运行: node scripts/test-with-auth.js');
  console.log('4. 或者临时修改API移除认证检查进行测试');
}

main().catch(console.error);
