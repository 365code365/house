const https = require('https');
const http = require('http');

// 測試配置
const BASE_URL = 'http://localhost:3000';
const TEST_APIS = [
  { name: '角色管理API', path: '/api/admin/roles', methods: ['GET', 'POST'] },
  { name: '菜單權限API', path: '/api/admin/permissions/menus', methods: ['GET', 'POST'] },
  { name: '按鈕權限API', path: '/api/admin/permissions/buttons', methods: ['GET', 'POST'] },
  { name: '用戶權限API', path: '/api/admin/permissions/users', methods: ['GET', 'POST'] },
  { name: '審計日誌API', path: '/api/admin/audit-logs', methods: ['GET', 'DELETE'] }
];

// 模擬認證Cookie (如果需要)
const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'RBAC-API-Test/1.0',
  // 可以添加認證相關的headers
  'Authorization': 'Bearer test-token',
  'Cookie': 'next-auth.session-token=test-session'
};

// HTTP請求函數
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: { ...AUTH_HEADERS, ...options.headers },
      timeout: 10000
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: jsonData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('請求超時'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// 測試單個API
async function testApi(api, method) {
  const url = `${BASE_URL}${api.path}`;
  const options = { method };
  
  // 為POST/PUT/DELETE請求添加測試數據
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    options.body = { test: true, name: 'Test Data' };
  }

  try {
    const response = await makeRequest(url, options);
    return {
      success: response.status < 400,
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      statusText: 'Network Error',
      data: null,
      error: error.message
    };
  }
}

// 分析響應狀態
function analyzeResponse(status, data) {
  if (status === 200 || status === 201) {
    return { type: 'success', message: '✅ 成功響應' };
  } else if (status === 401) {
    return { type: 'auth', message: '🔐 需要認證' };
  } else if (status === 403) {
    return { type: 'permission', message: '🚫 權限不足' };
  } else if (status === 404) {
    return { type: 'notfound', message: '❓ 路由不存在' };
  } else if (status === 405) {
    return { type: 'method', message: '❌ 方法不允許' };
  } else if (status >= 500) {
    return { type: 'error', message: '💥 服務器錯誤' };
  } else {
    return { type: 'other', message: `❓ 其他狀態 (${status})` };
  }
}

// 主測試函數
async function runTests() {
  console.log('🚀 開始測試 RBAC API 接口 (帶認證信息)');
  console.log('============================================================');
  
  const results = [];
  
  for (const api of TEST_APIS) {
    console.log(`\n🔍 測試 ${api.name} (${api.path})`);
    
    for (const method of api.methods) {
      console.log(`  📡 測試 ${method} 請求...`);
      
      const result = await testApi(api, method);
      const analysis = analyzeResponse(result.status, result.data);
      
      console.log(`    ${analysis.message} - ${result.status} ${result.statusText}`);
      
      // 如果有錯誤信息，顯示詳細信息
      if (result.error) {
        console.log(`    ❗ 錯誤詳情: ${result.error}`);
      }
      
      // 如果是500錯誤且有響應數據，顯示錯誤詳情
      if (result.status >= 500 && result.data && typeof result.data === 'object') {
        if (result.data.message) {
          console.log(`    📝 錯誤信息: ${result.data.message}`);
        }
        if (result.data.error) {
          console.log(`    🔍 錯誤詳情: ${result.data.error}`);
        }
      }
      
      results.push({
        api: api.name,
        path: api.path,
        method,
        status: result.status,
        type: analysis.type,
        success: result.success
      });
    }
  }
  
  // 生成測試報告
  console.log('\n============================================================');
  console.log('📋 RBAC API 測試報告 (帶認證)');
  console.log('============================================================\n');
  
  const groupedResults = {};
  results.forEach(result => {
    if (!groupedResults[result.api]) {
      groupedResults[result.api] = {};
    }
    groupedResults[result.api][result.method] = result;
  });
  
  Object.entries(groupedResults).forEach(([apiName, methods]) => {
    console.log(`🔧 ${apiName}`);
    const firstMethod = Object.values(methods)[0];
    console.log(`   路徑: ${firstMethod.path}`);
    
    Object.entries(methods).forEach(([method, result]) => {
      const analysis = analyzeResponse(result.status);
      console.log(`   ${method}: ${analysis.message} (${result.status})`);
    });
    console.log('');
  });
  
  // 統計信息
  const stats = {
    total: results.length,
    success: results.filter(r => r.type === 'success').length,
    auth: results.filter(r => r.type === 'auth').length,
    permission: results.filter(r => r.type === 'permission').length,
    notfound: results.filter(r => r.type === 'notfound').length,
    error: results.filter(r => r.type === 'error' || r.type === 'method' || r.type === 'other').length
  };
  
  console.log('📊 測試統計:');
  console.log(`   總測試數: ${stats.total}`);
  console.log(`   ✅ 成功響應: ${stats.success}`);
  console.log(`   🔐 需要認證: ${stats.auth}`);
  console.log(`   🚫 權限不足: ${stats.permission}`);
  console.log(`   ❓ 路由不存在: ${stats.notfound}`);
  console.log(`   💥 錯誤/失敗: ${stats.error}`);
  
  console.log('\n💡 分析建議:');
  if (stats.success > 0) {
    console.log('   ✅ 部分API正常工作');
  }
  if (stats.auth > 0) {
    console.log('   🔐 需要配置正確的認證信息');
  }
  if (stats.permission > 0) {
    console.log('   🚫 需要檢查用戶權限配置');
  }
  if (stats.error > 0) {
    console.log('   ❌ 有API出現錯誤，需要檢查服務器狀態');
  }
  if (stats.notfound > 0) {
    console.log('   ❓ 有API路由不存在，需要檢查路由配置');
  }
  
  console.log('\n============================================================\n');
  console.log('🎯 測試完成！');
}

// 運行測試
runTests().catch(console.error);