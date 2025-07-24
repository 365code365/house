async function testAppointmentAPI() {
  try {
    console.log('测试预约API...');
    
    const testData = {
    customer_name: '测试客户2',
    customer_phone: '0912345679',
    date: '2024-01-21',
    time: '10:00',
    purpose: '看房咨询',
    sales_person: 'SP001'
  };
    
    const response = await fetch('http://localhost:3000/api/projects/1/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.text();
    console.log('响应状态:', response.status);
    console.log('响应内容:', result);
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testAppointmentAPI();