#!/usr/bin/env node

/**
 * RBAC API接口測試腳本
 * 測試5個權限管理API的可訪問性
 * 不連接數據庫，只驗證路由響應
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// 測試配置
const BASE_URL = 'http://localhost:3000';
const TEST_APIS = [
  {
    name: '角色管理API',
    path: '/api/admin/roles',
    methods: ['GET', 'POST']
  },
  {
    name: '菜單權限API',
    path: '/api/admin/permissions/menus',
    methods: ['GET', 'POST']
  },
  {
    name: '按鈕權限API',
    path: '/api/admin/permissions/buttons',
    methods: ['GET', 'POST']
  },
  {
    name: '用戶權限API',
    path: '/api/admin/permissions/users',
    methods: ['GET', 'POST']
  },
  {
    name: '審計日誌API',
    path: '/api/admin/audit-logs',
    methods: ['GET', 'DELETE']
  }
];

// 測試結果存儲
const testResults = [];

/**
 * 發送HTTP請求
 */
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RBAC-API-Tester/1.0'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            rawData: responseData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: responseData,
            parseError: e.message
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * 測試單個API接口
 */
async function testAPI(apiConfig) {
  console.log(`\n🔍 測試 ${apiConfig.name} (${apiConfig.path})`);
  
  const results = {
    name: apiConfig.name,
    path: apiConfig.path,
    tests: []
  };
  
  for (const method of apiConfig.methods) {
    console.log(`  📡 測試 ${method} 請求...`);
    
    try {
      const url = `${BASE_URL}${apiConfig.path}`;
      const response = await makeRequest(url, method);
      
      const testResult = {
        method: method,
        url: url,
        statusCode: response.statusCode,
        success: response.statusCode < 500, // 不是服務器錯誤就算成功
        responseTime: Date.now(),
        headers: response.headers,
        hasData: !!response.data,
        dataStructure: response.data ? Object.keys(response.data) : [],
        error: response.parseError || null,
        rawResponse: response.rawData?.substring(0, 200) + (response.rawData?.length > 200 ? '...' : '')
      };
      
      // 分析響應狀態
      let status = '❌ 失敗';
      let message = '';
      
      if (response.statusCode === 200) {
        status = '✅ 成功';
        message = '正常響應';
      } else if (response.statusCode === 401) {
        status = '🔐 需要認證';
        message = '需要登錄或權限驗證';
      } else if (response.statusCode === 403) {
        status = '🚫 權限不足';
        message = '需要超級管理員權限';
      } else if (response.statusCode === 404) {
        status = '❓ 路由不存在';
        message = 'API路由未找到';
      } else if (response.statusCode >= 500) {
        status = '💥 服務器錯誤';
        message = '內部服務器錯誤';
      }
      
      testResult.status = status;
      testResult.message = message;
      
      console.log(`    ${status} - ${response.statusCode} ${message}`);
      
      if (response.data) {
        console.log(`    📊 響應數據結構: ${JSON.stringify(testResult.dataStructure)}`);
      }
      
      results.tests.push(testResult);
      
    } catch (error) {
      const testResult = {
        method: method,
        url: `${BASE_URL}${apiConfig.path}`,
        success: false,
        error: error.message,
        status: '💥 連接失敗',
        message: error.message
      };
      
      console.log(`    💥 連接失敗 - ${error.message}`);
      results.tests.push(testResult);
    }
  }
  
  return results;
}

/**
 * 生成測試報告
 */
function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 RBAC API 測試報告');
  console.log('='.repeat(60));
  
  let totalTests = 0;
  let successfulTests = 0;
  let authRequiredTests = 0;
  let permissionDeniedTests = 0;
  let notFoundTests = 0;
  let errorTests = 0;
  
  results.forEach(apiResult => {
    console.log(`\n🔧 ${apiResult.name}`);
    console.log(`   路徑: ${apiResult.path}`);
    
    apiResult.tests.forEach(test => {
      totalTests++;
      console.log(`   ${test.method}: ${test.status} (${test.statusCode || 'N/A'})`);
      
      if (test.statusCode === 200) successfulTests++;
      else if (test.statusCode === 401) authRequiredTests++;
      else if (test.statusCode === 403) permissionDeniedTests++;
      else if (test.statusCode === 404) notFoundTests++;
      else errorTests++;
    });
  });
  
  console.log('\n📊 測試統計:');
  console.log(`   總測試數: ${totalTests}`);
  console.log(`   ✅ 成功響應: ${successfulTests}`);
  console.log(`   🔐 需要認證: ${authRequiredTests}`);
  console.log(`   🚫 權限不足: ${permissionDeniedTests}`);
  console.log(`   ❓ 路由不存在: ${notFoundTests}`);
  console.log(`   💥 錯誤/失敗: ${errorTests}`);
  
  console.log('\n💡 分析建議:');
  
  if (notFoundTests > 0) {
    console.log('   ⚠️  有API路由不存在，請檢查路由配置');
  }
  
  if (authRequiredTests > 0 || permissionDeniedTests > 0) {
    console.log('   ℹ️  API需要認證和權限驗證，這是正常的安全機制');
    console.log('   💡 建議：添加認證token進行進一步測試');
  }
  
  if (successfulTests > 0) {
    console.log('   ✅ 部分API可以正常訪問');
  }
  
  if (errorTests > 0) {
    console.log('   ❌ 有API出現錯誤，需要檢查服務器狀態');
  }
  
  console.log('\n' + '='.repeat(60));
}

/**
 * 主測試函數
 */
async function runTests() {
  console.log('🚀 開始RBAC API接口測試...');
  console.log(`📍 測試目標: ${BASE_URL}`);
  console.log(`📅 測試時間: ${new Date().toLocaleString()}`);
  
  // 首先檢查服務器是否運行
  console.log('\n🔍 檢查服務器狀態...');
  try {
    const healthCheck = await makeRequest(`${BASE_URL}/api/health`, 'GET');
    console.log(`✅ 服務器運行正常 (狀態碼: ${healthCheck.statusCode})`);
  } catch (error) {
    console.log(`❌ 服務器連接失敗: ${error.message}`);
    console.log('💡 請確保開發服務器正在運行 (npm run dev)');
    process.exit(1);
  }
  
  // 測試所有API
  for (const apiConfig of TEST_APIS) {
    const result = await testAPI(apiConfig);
    testResults.push(result);
  }
  
  // 生成報告
  generateReport(testResults);
  
  console.log('\n🎯 測試完成！');
}

// 運行測試
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 測試運行失敗:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testAPI, generateReport };