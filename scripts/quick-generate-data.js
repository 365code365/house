const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const PROJECT_ID = 1;

// 简化的API请求函数
async function apiCall(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      console.error(`❌ ${method} ${endpoint}:`, response.status);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ 请求失败 ${endpoint}:`, error.message);
    return null;
  }
}

// 快速生成基础数据
async function quickGenerate() {
  console.log('🚀 快速生成测试数据...\n');
  
  // 1. 生成5个销售人员
  console.log('👨‍💼 生成销售人员...');
  const salesPeople = [
    { employee_no: 'SP001', name: '张经理', email: 'zhang@test.com', phone: '13800138001', project_ids: '1' },
    { employee_no: 'SP002', name: '李顾问', email: 'li@test.com', phone: '13800138002', project_ids: '1' },
    { employee_no: 'SP003', name: '王专员', email: 'wang@test.com', phone: '13800138003', project_ids: '1' },
    { employee_no: 'SP004', name: '刘主管', email: 'liu@test.com', phone: '13800138004', project_ids: '1' },
    { employee_no: 'SP005', name: '陈经理', email: 'chen@test.com', phone: '13800138005', project_ids: '1' }
  ];
  
  for (const person of salesPeople) {
    const result = await apiCall(`/api/projects/${PROJECT_ID}/sales-personnel`, 'POST', person);
    if (result) console.log(`✅ ${person.name}`);
  }
  
  // 2. 生成20个停车位
  console.log('\n🚗 生成停车位...');
  for (let i = 1; i <= 20; i++) {
    const parking = {
      parking_no: `B1-${i.toString().padStart(3, '0')}`,
      type: 'STANDARD',
      price: 150000,
      sales_status: Math.random() > 0.7 ? 'SOLD' : 'AVAILABLE'
    };
    
    const result = await apiCall(`/api/projects/${PROJECT_ID}/parking`, 'POST', parking);
    if (result) console.log(`✅ ${parking.parking_no}`);
  }
  
  // 3. 生成30套销控数据
  console.log('\n🏢 生成销控数据...');
  for (let i = 1; i <= 30; i++) {
    const unit = {
      building: 'A栋',
      floor: Math.ceil(i / 6),
      house_no: `A${Math.ceil(i / 6).toString().padStart(2, '0')}${((i - 1) % 6 + 1).toString().padStart(2, '0')}`,
      unit: `${((i - 1) % 6 + 1)}室`,
      area: 100 + Math.random() * 50,
      unit_price: 20000,
      house_total: (100 + Math.random() * 50) * 20000,
      sales_status: Math.random() > 0.6 ? 'SOLD' : 'AVAILABLE',
      sales_id: Math.random() > 0.6 ? `SP00${Math.floor(Math.random() * 5) + 1}` : null
    };
    
    const result = await apiCall(`/api/projects/${PROJECT_ID}/sales-control`, 'POST', unit);
    if (result) console.log(`✅ ${unit.house_no}`);
  }
  
  // 4. 生成15条预约记录
  console.log('\n📅 生成预约记录...');
  for (let i = 1; i <= 15; i++) {
    const appointment = {
      customer_name: `客户${i}`,
      customer_phone: `138000${i.toString().padStart(5, '0')}`,
      appointment_type: '看房预约',
      appointment_date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
      appointment_time: '14:00',
      sales_person_id: `SP00${Math.floor(Math.random() * 5) + 1}`,
      status: 'PENDING'
    };
    
    const result = await apiCall(`/api/projects/${PROJECT_ID}/appointments`, 'POST', appointment);
    if (result) console.log(`✅ ${appointment.customer_name}`);
  }
  
  // 5. 生成20个已购客户
  console.log('\n👥 生成已购客户...');
  for (let i = 1; i <= 20; i++) {
    const customer = {
      customer_name: `已购客户${i}`,
      customer_phone: `139000${i.toString().padStart(5, '0')}`,
      house_info: `A栋${Math.floor(i / 6) + 1}层${((i - 1) % 6 + 1)}室`,
      purchase_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      total_amount: 2000000 + Math.random() * 1000000,
      paid_amount: 1000000,
      payment_status: 'PARTIAL',
      sales_person_id: `SP00${Math.floor(Math.random() * 5) + 1}`,
      contract_number: `HT2024${i.toString().padStart(4, '0')}`
    };
    
    const result = await apiCall(`/api/projects/${PROJECT_ID}/purchased-customers`, 'POST', customer);
    if (result) console.log(`✅ ${customer.customer_name}`);
  }
  
  // 6. 生成5条退户记录
  console.log('\n↩️ 生成退户记录...');
  for (let i = 1; i <= 5; i++) {
    const withdrawal = {
      customer_name: `退户客户${i}`,
      customer_phone: `137000${i.toString().padStart(5, '0')}`,
      original_house: `A栋${i}层1室`,
      contract_number: `HT2024${(1000 + i).toString()}`,
      application_date: new Date().toISOString(),
      withdrawal_reason: '个人原因',
      refund_amount: 500000,
      status: 'PENDING',
      handler_id: `SP00${Math.floor(Math.random() * 5) + 1}`
    };
    
    const result = await apiCall(`/api/projects/${PROJECT_ID}/withdrawal-records`, 'POST', withdrawal);
    if (result) console.log(`✅ ${withdrawal.customer_name}`);
  }
  
  console.log('\n🎉 快速数据生成完成！');
  console.log('📊 生成统计: 销售人员5个, 停车位20个, 销控30套, 预约15条, 已购客户20个, 退户记录5条');
}

quickGenerate().catch(console.error);
