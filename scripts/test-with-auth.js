
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
    const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/sales-personnel`, {
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
    console.log(`状态: ${response.status}`);
    console.log(`响应: ${responseText}`);
    
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
