const fetch = require('node-fetch');

// 配置
const BASE_URL = 'http://localhost:3000';
const PROJECT_ID = 1;

// 模拟登录获取认证token（这里需要根据实际认证方式调整）
let authHeaders = {
  'Content-Type': 'application/json',
  // 如果需要认证，在这里添加认证头
  // 'Authorization': 'Bearer your-token-here'
};

/**
 * 通用API请求函数
 */
async function apiRequest(url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: authHeaders,
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`🔄 ${method} ${url}`);
    const response = await fetch(url, options);
    const data = await response.text();
    
    if (!response.ok) {
      console.error(`❌ ${method} ${url} failed:`, response.status, data);
      return null;
    }
    
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  } catch (error) {
    console.error(`❌ API请求失败:`, error.message);
    return null;
  }
}

/**
 * 1. 生成销售人员数据
 */
async function generateSalesPersonnel() {
  console.log('\n📋 生成销售人员数据...');
  
  const salesPersonnelData = [
    {
      employee_no: 'SP001',
      name: '张销售',
      email: 'zhang.sales@company.com',
      phone: '13800138001',
      project_ids: PROJECT_ID.toString(),
      remark: '资深销售经理，专业负责高端客户'
    },
    {
      employee_no: 'SP002', 
      name: '李顾问',
      email: 'li.advisor@company.com',
      phone: '13800138002',
      project_ids: PROJECT_ID.toString(),
      remark: '销售顾问，擅长客户关系维护'
    },
    {
      employee_no: 'SP003',
      name: '王专员',
      email: 'wang.specialist@company.com', 
      phone: '13800138003',
      project_ids: PROJECT_ID.toString(),
      remark: '销售专员，负责新客户开发'
    },
    {
      employee_no: 'SP004',
      name: '刘经理',
      email: 'liu.manager@company.com',
      phone: '13800138004', 
      project_ids: PROJECT_ID.toString(),
      remark: '销售经理，团队管理经验丰富'
    },
    {
      employee_no: 'SP005',
      name: '陈主管',
      email: 'chen.supervisor@company.com',
      phone: '13800138005',
      project_ids: PROJECT_ID.toString(), 
      remark: '销售主管，负责区域市场开拓'
    }
  ];
  
  for (const personnel of salesPersonnelData) {
    const result = await apiRequest(
      `${BASE_URL}/api/projects/${PROJECT_ID}/sales-personnel`,
      'POST',
      personnel
    );
    if (result) {
      console.log(`✅ 创建销售人员: ${personnel.name}`);
    }
  }
}

/**
 * 2. 生成停车位数据
 */
async function generateParkingSpaces() {
  console.log('\n🚗 生成停车位数据...');
  
  const parkingData = [];
  
  // 生成地下一层停车位 (B1-001 到 B1-050)
  for (let i = 1; i <= 50; i++) {
    const parkingNo = `B1-${i.toString().padStart(3, '0')}`;
    parkingData.push({
      parking_no: parkingNo,
      type: i <= 40 ? 'STANDARD' : 'LARGE',
      price: i <= 40 ? 150000 : 200000,
      sales_status: Math.random() > 0.7 ? 'SOLD' : 'AVAILABLE',
      sales_date: Math.random() > 0.7 ? new Date().toISOString() : null,
      buyer: Math.random() > 0.7 ? `停车位业主${i}` : null,
      remark: `地下一层停车位，编号${parkingNo}`
    });
  }
  
  // 生成地下二层停车位 (B2-001 到 B2-080)
  for (let i = 1; i <= 80; i++) {
    const parkingNo = `B2-${i.toString().padStart(3, '0')}`;
    parkingData.push({
      parking_no: parkingNo,
      type: i <= 60 ? 'STANDARD' : (i <= 75 ? 'LARGE' : 'DISABLED'),
      price: i <= 60 ? 120000 : (i <= 75 ? 180000 : 150000),
      sales_status: Math.random() > 0.6 ? 'SOLD' : 'AVAILABLE',
      sales_date: Math.random() > 0.6 ? new Date().toISOString() : null,
      buyer: Math.random() > 0.6 ? `停车位业主${i + 50}` : null,
      remark: `地下二层停车位，编号${parkingNo}`
    });
  }
  
  for (const parking of parkingData) {
    const result = await apiRequest(
      `${BASE_URL}/api/projects/${PROJECT_ID}/parking`,
      'POST',
      parking
    );
    if (result) {
      console.log(`✅ 创建停车位: ${parking.parking_no}`);
    }
  }
}

/**
 * 3. 生成销控数据
 */
async function generateSalesControl() {
  console.log('\n🏢 生成销控数据...');
  
  const salesControlData = [];
  const buildings = ['A栋', 'B栋', 'C栋'];
  const salesPersonIds = ['SP001', 'SP002', 'SP003', 'SP004', 'SP005'];
  const mediaSourceList = ['线上广告', '朋友介绍', '现场咨询', '电话营销', '展会推广'];
  
  for (const building of buildings) {
    // 每栋楼20层，每层6套房
    for (let floor = 1; floor <= 20; floor++) {
      for (let unit = 1; unit <= 6; unit++) {
        const houseNo = `${building}${floor.toString().padStart(2, '0')}${unit.toString().padStart(2, '0')}`;
        const area = 80 + Math.random() * 120; // 80-200平米
        const unitPrice = 15000 + Math.random() * 10000; // 15000-25000元/平米
        const houseTotal = area * unitPrice;
        
        const salesStatus = Math.random() > 0.6 ? 'SOLD' : (Math.random() > 0.5 ? 'DEPOSIT' : 'AVAILABLE');
        const hasSales = salesStatus !== 'AVAILABLE';
        
        salesControlData.push({
          building: building,
          floor: floor,
          house_no: houseNo,
          unit: `${unit}室`,
          area: Math.round(area * 100) / 100,
          unit_price: Math.round(unitPrice),
          house_total: Math.round(houseTotal),
          total_with_parking: hasSales ? Math.round(houseTotal + (Math.random() > 0.5 ? 150000 : 0)) : Math.round(houseTotal),
          base_price: Math.round(unitPrice * 0.9),
          premium_rate: Math.round(Math.random() * 20) / 100,
          sales_status: salesStatus,
          sales_date: hasSales ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() : null,
          deposit_date: salesStatus === 'DEPOSIT' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
          sign_date: salesStatus === 'SOLD' ? new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString() : null,
          buyer: hasSales ? `业主${Math.floor(Math.random() * 1000) + 1}` : null,
          sales_id: hasSales ? salesPersonIds[Math.floor(Math.random() * salesPersonIds.length)] : null,
          parking_ids: Math.random() > 0.7 ? `${Math.floor(Math.random() * 130) + 1}` : null,
          custom_change: Math.random() > 0.8,
          custom_change_content: Math.random() > 0.8 ? '客户要求改动户型布局' : null,
          media_source: hasSales ? mediaSourceList[Math.floor(Math.random() * mediaSourceList.length)] : null,
          introducer: Math.random() > 0.7 ? `介绍人${Math.floor(Math.random() * 100) + 1}` : null,
          notes: Math.random() > 0.8 ? '客户备注信息' : null
        });
      }
    }
  }
  
  // 分批创建，避免一次性创建太多数据
  const batchSize = 20;
  for (let i = 0; i < salesControlData.length; i += batchSize) {
    const batch = salesControlData.slice(i, i + batchSize);
    console.log(`📦 创建销控数据批次 ${Math.floor(i/batchSize) + 1}/${Math.ceil(salesControlData.length/batchSize)}`);
    
    for (const unit of batch) {
      const result = await apiRequest(
        `${BASE_URL}/api/projects/${PROJECT_ID}/sales-control`,
        'POST',
        unit
      );
      if (result) {
        console.log(`✅ 创建销控记录: ${unit.house_no}`);
      }
      
      // 添加小延迟避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

/**
 * 4. 生成预约数据
 */
async function generateAppointments() {
  console.log('\n📅 生成预约数据...');
  
  const appointmentData = [];
  const appointmentTypes = ['看房预约', '签约预约', '交房预约', '咨询预约'];
  const statusList = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
  const salesPersonIds = ['SP001', 'SP002', 'SP003', 'SP004', 'SP005'];
  
  for (let i = 1; i <= 100; i++) {
    const appointmentDate = new Date(Date.now() + (Math.random() - 0.5) * 30 * 24 * 60 * 60 * 1000);
    const status = statusList[Math.floor(Math.random() * statusList.length)];
    
    appointmentData.push({
      customer_name: `客户${i}`,
      customer_phone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      appointment_type: appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)],
      appointment_date: appointmentDate.toISOString(),
      appointment_time: `${Math.floor(Math.random() * 12) + 9}:${Math.random() > 0.5 ? '00' : '30'}`,
      sales_person_id: salesPersonIds[Math.floor(Math.random() * salesPersonIds.length)],
      status: status,
      notes: Math.random() > 0.7 ? `预约备注信息${i}` : null,
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  for (const appointment of appointmentData) {
    const result = await apiRequest(
      `${BASE_URL}/api/projects/${PROJECT_ID}/appointments`,
      'POST',
      appointment
    );
    if (result) {
      console.log(`✅ 创建预约记录: ${appointment.customer_name} - ${appointment.appointment_type}`);
    }
  }
}

/**
 * 5. 生成已购客户数据
 */
async function generatePurchasedCustomers() {
  console.log('\n👥 生成已购客户数据...');
  
  const customerData = [];
  const salesPersonIds = ['SP001', 'SP002', 'SP003', 'SP004', 'SP005'];
  
  for (let i = 1; i <= 200; i++) {
    const purchaseDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    const totalAmount = 1500000 + Math.random() * 2000000; // 150万-350万
    
    customerData.push({
      customer_name: `已购客户${i}`,
      customer_phone: `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      id_card: `${Math.floor(Math.random() * 900000) + 100000}19${Math.floor(Math.random() * 50) + 50}${Math.floor(Math.random() * 12) + 1}${Math.floor(Math.random() * 28) + 1}${Math.floor(Math.random() * 9000) + 1000}`,
      house_info: `${['A栋', 'B栋', 'C栋'][Math.floor(Math.random() * 3)]}${Math.floor(Math.random() * 20) + 1}${Math.floor(Math.random() * 6) + 1}`,
      purchase_date: purchaseDate.toISOString(),
      total_amount: Math.round(totalAmount),
      paid_amount: Math.round(totalAmount * (0.3 + Math.random() * 0.7)), // 已付30%-100%
      payment_status: Math.random() > 0.3 ? 'PARTIAL' : 'COMPLETED',
      sales_person_id: salesPersonIds[Math.floor(Math.random() * salesPersonIds.length)],
      contract_number: `HT${new Date().getFullYear()}${(i).toString().padStart(4, '0')}`,
      notes: Math.random() > 0.8 ? `客户备注信息${i}` : null
    });
  }
  
  for (const customer of customerData) {
    const result = await apiRequest(
      `${BASE_URL}/api/projects/${PROJECT_ID}/purchased-customers`,
      'POST',
      customer
    );
    if (result) {
      console.log(`✅ 创建已购客户: ${customer.customer_name}`);
    }
  }
}

/**
 * 6. 生成退户记录数据
 */
async function generateWithdrawalRecords() {
  console.log('\n↩️ 生成退户记录数据...');
  
  const withdrawalData = [];
  const reasonList = ['个人资金问题', '房屋质量问题', '位置不满意', '家庭变故', '投资计划改变', '其他原因'];
  const statusList = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];
  const salesPersonIds = ['SP001', 'SP002', 'SP003', 'SP004', 'SP005'];
  
  for (let i = 1; i <= 30; i++) {
    const applicationDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
    const refundAmount = 100000 + Math.random() * 500000; // 10万-60万退款
    
    withdrawalData.push({
      customer_name: `退户客户${i}`,
      customer_phone: `137${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      original_house: `${['A栋', 'B栋', 'C栋'][Math.floor(Math.random() * 3)]}${Math.floor(Math.random() * 20) + 1}${Math.floor(Math.random() * 6) + 1}`,
      contract_number: `HT${new Date().getFullYear()}${(i + 1000).toString().padStart(4, '0')}`,
      application_date: applicationDate.toISOString(),
      withdrawal_reason: reasonList[Math.floor(Math.random() * reasonList.length)],
      refund_amount: Math.round(refundAmount),
      status: statusList[Math.floor(Math.random() * statusList.length)],
      handler_id: salesPersonIds[Math.floor(Math.random() * salesPersonIds.length)],
      process_date: Math.random() > 0.5 ? new Date(applicationDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      notes: Math.random() > 0.7 ? `退户处理备注${i}` : null
    });
  }
  
  for (const withdrawal of withdrawalData) {
    const result = await apiRequest(
      `${BASE_URL}/api/projects/${PROJECT_ID}/withdrawal-records`,
      'POST',
      withdrawal
    );
    if (result) {
      console.log(`✅ 创建退户记录: ${withdrawal.customer_name}`);
    }
  }
}

/**
 * 主函数 - 执行所有数据生成
 */
async function generateAllTestData() {
  console.log('🚀 开始通过API接口生成测试数据...\n');
  console.log(`📍 项目ID: ${PROJECT_ID}`);
  console.log(`🌐 API地址: ${BASE_URL}`);
  
  try {
    // 按依赖顺序生成数据
    await generateSalesPersonnel();      // 1. 先生成销售人员（其他模块会引用）
    await generateParkingSpaces();       // 2. 生成停车位
    await generateSalesControl();        // 3. 生成销控数据（会引用销售人员和停车位）
    await generateAppointments();        // 4. 生成预约数据（引用销售人员）
    await generatePurchasedCustomers();  // 5. 生成已购客户（引用销售人员）
    await generateWithdrawalRecords();   // 6. 生成退户记录（引用销售人员）
    
    console.log('\n🎉 所有测试数据生成完成！');
    console.log('\n📊 数据统计:');
    console.log('- 销售人员: 5名');
    console.log('- 停车位: 130个');
    console.log('- 销控记录: 360套房源');
    console.log('- 预约记录: 100条');
    console.log('- 已购客户: 200名');
    console.log('- 退户记录: 30条');
    
  } catch (error) {
    console.error('❌ 数据生成过程中出现错误:', error);
  }
}

/**
 * 清理测试数据函数（可选）
 */
async function clearAllTestData() {
  console.log('🧹 开始清理测试数据...');
  
  const modules = [
    'withdrawal-records',
    'purchased-customers', 
    'appointments',
    'sales-control',
    'parking',
    'sales-personnel'
  ];
  
  for (const module of modules) {
    console.log(`🗑️ 清理 ${module} 数据...`);
    // 这里需要根据实际API实现删除逻辑
    // const result = await apiRequest(`${BASE_URL}/api/projects/${PROJECT_ID}/${module}/clear`, 'DELETE');
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
if (args.includes('--clear')) {
  clearAllTestData();
} else if (args.includes('--help')) {
  console.log(`
📋 测试数据生成脚本使用说明

用法:
  node scripts/generate-test-data-via-api.js [选项]

选项:
  --help     显示帮助信息
  --clear    清理所有测试数据
  (无参数)   生成所有测试数据

示例:
  node scripts/generate-test-data-via-api.js           # 生成测试数据
  node scripts/generate-test-data-via-api.js --clear   # 清理测试数据
  `);
} else {
  generateAllTestData();
}

module.exports = {
  generateAllTestData,
  generateSalesPersonnel,
  generateParkingSpaces,
  generateSalesControl,
  generateAppointments,
  generatePurchasedCustomers,
  generateWithdrawalRecords
};
