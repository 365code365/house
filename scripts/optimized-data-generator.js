const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const PROJECT_ID = 1;

// API请求函数
async function apiCall(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: { 
        'Content-Type': 'application/json',
        // 如果需要认证，在这里添加
        // 'Authorization': 'Bearer your-token'
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    console.log(`🔄 ${method} ${endpoint}`);
    if (data) {
      console.log(`📤 Request Data:`, JSON.stringify(data, null, 2));
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`❌ ${method} ${endpoint}:`, response.status, response.statusText);
      console.error(`📥 Response:`, responseText);
      return null;
    }
    
    console.log(`✅ ${method} ${endpoint}: Success`);
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      return responseText;
    }
  } catch (error) {
    console.error(`❌ 请求失败 ${endpoint}:`, error.message);
    return null;
  }
}

// 1. 生成销售人员数据（修复字段映射）
async function generateSalesPersonnel() {
  console.log('\n👨‍💼 生成销售人员数据...');
  
  const salesPeople = [
    {
      employee_no: 'SP001',
      name: '张经理',
      email: 'zhang.manager@company.com',
      phone: '13800138001',
      remark: '资深销售经理，专业负责高端客户'
    },
    {
      employee_no: 'SP002', 
      name: '李顾问',
      email: 'li.advisor@company.com',
      phone: '13800138002',
      remark: '销售顾问，擅长客户关系维护'
    },
    {
      employee_no: 'SP003',
      name: '王专员',
      email: 'wang.specialist@company.com',
      phone: '13800138003',
      remark: '销售专员，负责新客户开发'
    },
    {
      employee_no: 'SP004',
      name: '刘经理',
      email: 'liu.manager@company.com', 
      phone: '13800138004',
      remark: '销售经理，团队管理经验丰富'
    },
    {
      employee_no: 'SP005',
      name: '陈主管',
      email: 'chen.supervisor@company.com',
      phone: '13800138005',
      remark: '销售主管，负责区域市场开拓'
    }
  ];
  
  for (const person of salesPeople) {
    const result = await apiCall(`/api/projects/${PROJECT_ID}/sales-personnel`, 'POST', person);
    if (result) {
      console.log(`✅ 创建销售人员: ${person.name} (${person.employee_no})`);
    }
  }
}

// 2. 生成停车位数据（修复字段映射）
async function generateParkingSpaces() {
  console.log('\n🚗 生成停车位数据...');
  
  for (let i = 1; i <= 20; i++) {
    const parking = {
      parking_no: `B1-${i.toString().padStart(3, '0')}`,
      type: i <= 15 ? 'STANDARD' : (i <= 18 ? 'LARGE' : 'DISABLED'),
      price: i <= 15 ? 150000 : (i <= 18 ? 200000 : 150000),
      sales_status: Math.random() > 0.7 ? 'SOLD' : 'AVAILABLE',
      sales_date: Math.random() > 0.7 ? new Date().toISOString().split('T')[0] : null,
      buyer: Math.random() > 0.7 ? `停车位业主${i}` : null,
      remark: `地下一层停车位，编号B1-${i.toString().padStart(3, '0')}`
    };
    
    const result = await apiCall(`/api/projects/${PROJECT_ID}/parking`, 'POST', parking);
    if (result) {
      console.log(`✅ 创建停车位: ${parking.parking_no}`);
    }
  }
}

// 3. 生成销控数据（修复字段映射）
async function generateSalesControl() {
  console.log('\n🏢 生成销控数据...');
  
  const buildings = ['A栋', 'B栋'];
  const salesPersonIds = ['SP001', 'SP002', 'SP003', 'SP004', 'SP005'];
  
  let unitCount = 0;
  
  for (const building of buildings) {
    for (let floor = 1; floor <= 5; floor++) {
      for (let unit = 1; unit <= 3; unit++) {
        unitCount++;
        const houseNo = `${building}${floor.toString().padStart(2, '0')}${unit.toString().padStart(2, '0')}`;
        const area = 80 + Math.random() * 70; // 80-150平米
        const unitPrice = 18000 + Math.random() * 7000; // 18000-25000元/平米
        const houseTotal = area * unitPrice;
        
        const salesStatus = Math.random() > 0.6 ? 'SOLD' : (Math.random() > 0.5 ? 'DEPOSIT' : 'AVAILABLE');
        const hasSales = salesStatus !== 'AVAILABLE';
        
        const salesControlData = {
          building: building,
          floor: floor,
          houseNo: houseNo,
          unit: `${unit}室`,
          area: Math.round(area * 100) / 100,
          unitPrice: Math.round(unitPrice),
          houseTotal: Math.round(houseTotal),
          totalWithParking: hasSales ? Math.round(houseTotal + (Math.random() > 0.5 ? 150000 : 0)) : Math.round(houseTotal),
          basePrice: Math.round(unitPrice * 0.9),
          premiumRate: Math.round(Math.random() * 20) / 100,
          salesStatus: salesStatus,
          salesDate: hasSales ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
          depositDate: salesStatus === 'DEPOSIT' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
          signDate: salesStatus === 'SOLD' ? new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
          buyer: hasSales ? `业主${unitCount}` : null,
          salesId: hasSales ? salesPersonIds[Math.floor(Math.random() * salesPersonIds.length)] : null,
          parkingIds: Math.random() > 0.7 ? Math.floor(Math.random() * 20 + 1).toString() : null,
          customChange: Math.random() > 0.8,
          customChangeContent: Math.random() > 0.8 ? '客户要求改动户型布局' : null,
          mediaSource: hasSales ? ['线上广告', '朋友介绍', '现场咨询', '电话营销'][Math.floor(Math.random() * 4)] : null,
          introducer: Math.random() > 0.8 ? `介绍人${unitCount}` : null,
          notes: Math.random() > 0.8 ? `销控备注信息${unitCount}` : null
        };
        
        const result = await apiCall(`/api/projects/${PROJECT_ID}/sales-control`, 'POST', salesControlData);
        if (result) {
          console.log(`✅ 创建销控记录: ${salesControlData.houseNo} (${salesControlData.salesStatus})`);
        }
        
        // 添加延迟避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }
}

// 4. 生成预约数据（修复字段映射）
async function generateAppointments() {
  console.log('\n📅 生成预约数据...');
  
  const appointmentTypes = ['看房预约', '签约预约', '交房预约', '咨询预约'];
  const statusList = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
  const salesPersonIds = ['SP001', 'SP002', 'SP003', 'SP004', 'SP005'];
  
  for (let i = 1; i <= 15; i++) {
    const appointmentDate = new Date(Date.now() + (Math.random() - 0.3) * 30 * 24 * 60 * 60 * 1000);
    const appointmentTime = `${Math.floor(Math.random() * 8) + 9}:${Math.random() > 0.5 ? '00' : '30'}`;
    
    const appointmentData = {
      customer_name: `客户${i}`,
      customer_phone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      appointment_type: appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)],
      appointment_date: appointmentDate.toISOString().split('T')[0],
      appointment_time: appointmentTime,
      sales_person_id: salesPersonIds[Math.floor(Math.random() * salesPersonIds.length)],
      status: statusList[Math.floor(Math.random() * statusList.length)],
      notes: Math.random() > 0.7 ? `预约备注信息${i}` : null
    };
    
    const result = await apiCall(`/api/projects/${PROJECT_ID}/appointments`, 'POST', appointmentData);
    if (result) {
      console.log(`✅ 创建预约记录: ${appointmentData.customer_name} - ${appointmentData.appointment_type}`);
    }
  }
}

// 5. 生成已购客户数据（修复字段映射）
async function generatePurchasedCustomers() {
  console.log('\n👥 生成已购客户数据...');
  
  const salesPersonIds = ['SP001', 'SP002', 'SP003', 'SP004', 'SP005'];
  const buildings = ['A栋', 'B栋'];
  
  for (let i = 1; i <= 20; i++) {
    const purchaseDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
    const building = buildings[Math.floor(Math.random() * buildings.length)];
    const floor = Math.floor(Math.random() * 5) + 1;
    const unit = Math.floor(Math.random() * 3) + 1;
    const houseNo = `${building}${floor.toString().padStart(2, '0')}${unit.toString().padStart(2, '0')}`;
    
    const customerData = {
      customerName: `已购客户${i}`,
      houseNo: houseNo,
      purchaseDate: purchaseDate.toISOString().split('T')[0],
      idCard: `${Math.floor(Math.random() * 900000) + 100000}19${Math.floor(Math.random() * 50) + 50}${Math.floor(Math.random() * 12) + 1}${Math.floor(Math.random() * 28) + 1}${Math.floor(Math.random() * 9000) + 1000}`,
      isCorporate: false,
      email: `customer${i}@email.com`,
      phone: `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      age: Math.floor(Math.random() * 40) + 25,
      occupation: ['工程师', '医生', '教师', '经理', '公务员'][Math.floor(Math.random() * 5)],
      registeredAddress: `注册地址${i}`,
      mailingAddress: `邮寄地址${i}`,
      remark: Math.random() > 0.7 ? `客户备注信息${i}` : null,
      rating: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
      salesPersonId: salesPersonIds[Math.floor(Math.random() * salesPersonIds.length)]
    };
    
    const result = await apiCall(`/api/projects/${PROJECT_ID}/purchased-customers`, 'POST', customerData);
    if (result) {
      console.log(`✅ 创建已购客户: ${customerData.customerName} - ${customerData.houseNo}`);
    }
  }
}

// 6. 生成退户记录数据（修复字段映射）
async function generateWithdrawalRecords() {
  console.log('\n↩️ 生成退户记录数据...');
  
  const reasonList = ['个人资金问题', '房屋质量问题', '位置不满意', '家庭变故', '投资计划改变'];
  const statusList = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];
  const salesPersonIds = ['SP001', 'SP002', 'SP003', 'SP004', 'SP005'];
  const buildings = ['A栋', 'B栋'];
  
  for (let i = 1; i <= 8; i++) {
    const applicationDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
    const building = buildings[Math.floor(Math.random() * buildings.length)];
    const floor = Math.floor(Math.random() * 5) + 1;
    const unit = Math.floor(Math.random() * 3) + 1;
    const originalHouse = `${building}${floor.toString().padStart(2, '0')}${unit.toString().padStart(2, '0')}`;
    
    const withdrawalData = {
      customer_name: `退户客户${i}`,
      customer_phone: `137${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      original_house: originalHouse,
      contract_number: `HT${new Date().getFullYear()}${(1000 + i).toString()}`,
      application_date: applicationDate.toISOString().split('T')[0],
      withdrawal_reason: reasonList[Math.floor(Math.random() * reasonList.length)],
      refund_amount: Math.round((200000 + Math.random() * 800000) / 1000) * 1000, // 20万-100万，整千
      status: statusList[Math.floor(Math.random() * statusList.length)],
      handler_id: salesPersonIds[Math.floor(Math.random() * salesPersonIds.length)],
      process_date: Math.random() > 0.5 ? new Date(applicationDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
      notes: Math.random() > 0.6 ? `退户处理备注${i}` : null
    };
    
    const result = await apiCall(`/api/projects/${PROJECT_ID}/withdrawal-records`, 'POST', withdrawalData);
    if (result) {
      console.log(`✅ 创建退户记录: ${withdrawalData.customer_name} - ${withdrawalData.original_house}`);
    }
  }
}

// 测试API连通性
async function testAPIConnectivity() {
  console.log('🔍 测试API连通性...\n');
  
  // 测试项目是否存在
  const projectTest = await apiCall(`/api/projects/${PROJECT_ID}`, 'GET');
  if (!projectTest) {
    console.error('❌ 项目API不可访问，请检查服务器状态和项目ID');
    return false;
  }
  
  console.log('✅ 项目API连通正常');
  return true;
}

// 主函数
async function generateOptimizedData() {
  console.log('🚀 开始生成优化的测试数据...\n');
  console.log(`📍 项目ID: ${PROJECT_ID}`);
  console.log(`🌐 API地址: ${BASE_URL}\n`);
  
  // 测试连通性
  const isConnected = await testAPIConnectivity();
  if (!isConnected) {
    console.log('❌ API连通性测试失败，停止数据生成');
    return;
  }
  
  try {
    console.log('⏱️ 开始按顺序生成数据...\n');
    
    // 按依赖顺序生成数据
    await generateSalesPersonnel();      // 1. 先生成销售人员
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
    
    await generateParkingSpaces();       // 2. 生成停车位
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await generateSalesControl();        // 3. 生成销控数据
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await generateAppointments();        // 4. 生成预约数据  
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await generatePurchasedCustomers();  // 5. 生成已购客户
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await generateWithdrawalRecords();   // 6. 生成退户记录
    
    console.log('\n🎉 优化数据生成完成！');
    console.log('\n📊 数据统计:');
    console.log('- 销售人员: 5名');
    console.log('- 停车位: 20个'); 
    console.log('- 销控记录: 30套房源');
    console.log('- 预约记录: 15条');
    console.log('- 已购客户: 20名');
    console.log('- 退户记录: 8条');
    
    console.log('\n✨ 请检查数据库确认数据是否成功保存');
    
  } catch (error) {
    console.error('❌ 数据生成过程中出现错误:', error);
  }
}

// 清理函数（用于重新生成数据前清理）
async function clearExistingData() {
  console.log('🧹 清理现有数据...');
  
  // 注意：这里需要根据实际API实现清理逻辑
  // 或者手动在数据库中清理数据
  console.log('⚠️ 如需清理数据，请手动在数据库中执行清理操作');
}

// 命令行参数处理
const args = process.argv.slice(2);
if (args.includes('--clear')) {
  clearExistingData();
} else if (args.includes('--help')) {
  console.log(`
📋 优化数据生成脚本使用说明

用法:
  node scripts/optimized-data-generator.js [选项]

选项:
  --help     显示帮助信息
  --clear    清理现有数据（需手动实现）
  (无参数)   生成优化的测试数据

特点:
  ✅ 修复了字段映射问题
  ✅ 添加了API连通性测试
  ✅ 优化了数据格式和类型
  ✅ 添加了详细的请求/响应日志
  ✅ 增加了请求间延迟避免过载
  ✅ 改进了错误处理和调试信息

示例:
  node scripts/optimized-data-generator.js           # 生成优化数据
  node scripts/optimized-data-generator.js --clear   # 清理数据
  `);
} else {
  generateOptimizedData();
}

module.exports = {
  generateOptimizedData,
  testAPIConnectivity,
  generateSalesPersonnel,
  generateParkingSpaces,
  generateSalesControl,
  generateAppointments,
  generatePurchasedCustomers,
  generateWithdrawalRecords
};
