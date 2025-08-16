const fetch = require('node-fetch');

async function testSalesControlAPI() {
  const baseUrl = 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/projects/1/sales-control?page=1&pageSize=20&minPrice=0&maxPrice=10000000&minArea=0&maxArea=200`;
  
  console.log('Testing Sales Control API...');
  console.log('URL:', apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 这里需要添加认证头，但我们先测试API是否能响应
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.text();
    console.log('Response:', data);
    
    if (response.status === 401) {
      console.log('✅ API正常响应 - 需要认证（预期行为）');
    } else if (response.status === 500) {
      console.log('❌ API返回500错误');
      console.log('Response body:', data);
    } else {
      console.log('✅ API正常响应');
      try {
        const jsonData = JSON.parse(data);
        console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('Response is not JSON:', data);
      }
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

testSalesControlAPI();
