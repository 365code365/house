const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'sales_system',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  timezone: '+08:00'
};

let connection = null;

async function getConnection() {
  if (!connection) {
    try {
      connection = await mysql.createConnection(dbConfig);
      console.log('資料庫連接成功');
    } catch (error) {
      console.error('資料庫連接失敗:', error);
      throw error;
    }
  }
  return connection;
}

async function executeQuery(query, params = []) {
  try {
    const conn = await getConnection();
    const [results] = await conn.execute(query, params || []);
    return results;
  } catch (error) {
    console.error('查詢執行失敗:', error);
    throw error;
  }
}

// 生成模拟数据的函数
function generateMockSalesControlData() {
  const mockData = [];
  const buildings = ['A', 'B'];
  const floors = [14, 15, 16, 17, 18];
  const units = ['A1', 'A2', 'B1', 'B2'];
  const salesStatuses = ['售出', '訂金', '未售出', '不銷售'];
  const buyers = ['王大明', '李小芳', '張志明', '陳美麗', '林小強'];
  const mediaSources = ['網路廣告', '朋友介紹', '路過', '報紙廣告'];
  const introducers = ['張仲介', '李代銷', '王朋友', '陳同事'];
  
  buildings.forEach(building => {
    floors.forEach(floor => {
      units.forEach(unit => {
        const area = Math.floor(Math.random() * 20) + 25; // 25-45坪
        const unitPrice = Math.floor(Math.random() * 20) + 40; // 40-60萬/坪
        const houseTotal = area * unitPrice;
        const parkingPrice = Math.floor(Math.random() * 50) + 100; // 100-150萬
        const totalWithParking = houseTotal + parkingPrice;
        const salesStatus = salesStatuses[Math.floor(Math.random() * salesStatuses.length)];
        const hasBuyer = salesStatus === '售出' || salesStatus === '訂金';
        const basePrice = Math.floor(houseTotal * 0.9); // 底價為房價的90%
        const premiumRate = ((houseTotal - basePrice) / basePrice) * 100;
        
        const houseNo = `${building}${floor}${unit}`;
        
        mockData.push({
          house_no: houseNo,
          building,
          floor,
          unit,
          area,
          unit_price: unitPrice,
          house_total: houseTotal,
          total_with_parking: totalWithParking,
          sales_status: salesStatus,
          sales_date: hasBuyer && salesStatus === '售出' ? `2024-12-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}` : null,
          deposit_date: hasBuyer ? `2024-12-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}` : null,
          sign_date: hasBuyer && salesStatus === '售出' ? `2024-12-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}` : null,
          buyer: hasBuyer ? buyers[Math.floor(Math.random() * buyers.length)] : null,
          sales_id: `SP${String(Math.floor(Math.random() * 4) + 1).padStart(3, '0')}`, // 隨機分配銷售人員編號
          parking_ids: `B1-${Math.floor(Math.random() * 100) + 1}`,
          custom_change: Math.random() > 0.7 ? 1 : 0,
          custom_change_content: Math.random() > 0.7 ? '客變廚房格局' : null,
          media_source: mediaSources[Math.floor(Math.random() * mediaSources.length)],
          introducer: Math.random() > 0.5 ? introducers[Math.floor(Math.random() * introducers.length)] : null,
          notes: Math.random() > 0.8 ? '客戶要求特殊付款方式' : null,
          base_price: basePrice,
          premium_rate: Math.round(premiumRate * 100) / 100,
          project_id: 1 // 假設項目ID為1
        });
      });
    });
  });
  
  return mockData;
}

// 插入模拟数据到数据库
async function seedMockData() {
  try {
    console.log('開始插入模擬數據...');
    
    // 首先清空現有的銷控數據
    await executeQuery('DELETE FROM sales_control WHERE project_id = 1');
    console.log('已清空現有銷控數據');
    
    // 確保項目存在
    const projectExists = await executeQuery('SELECT id FROM project WHERE id = 1');
    if (!Array.isArray(projectExists) || projectExists.length === 0) {
      // 創建測試項目
      await executeQuery(
        'INSERT INTO project (id, name, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        [1, '測試項目']
      );
      console.log('已創建測試項目');
    }
    
    // 確保銷售人員存在
    const salesPersonExists = await executeQuery('SELECT id FROM sales_personnel WHERE id IN (1,2,3,4)');
    if (!Array.isArray(salesPersonExists) || salesPersonExists.length < 4) {
      // 創建測試銷售人員
      const salesPersons = [
        { id: 1, employee_no: 'SP001', name: '張小明', email: 'zhang@test.com', password: 'password123', phone: '0912345678' },
        { id: 2, employee_no: 'SP002', name: '李小華', email: 'li@test.com', password: 'password123', phone: '0912345679' },
        { id: 3, employee_no: 'SP003', name: '王小美', email: 'wang@test.com', password: 'password123', phone: '0912345680' },
        { id: 4, employee_no: 'SP004', name: '陳小強', email: 'chen@test.com', password: 'password123', phone: '0912345681' }
      ];
      
      for (const person of salesPersons) {
        await executeQuery(
          'INSERT IGNORE INTO sales_personnel (id, employee_no, name, email, password, phone, project_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [person.id, person.employee_no, person.name, person.email, person.password, person.phone, '1']
        );
      }
      console.log('已創建測試銷售人員');
    }
    
    // 生成模擬數據
    const mockData = generateMockSalesControlData();
    
    // 批量插入數據
    const insertQuery = `
      INSERT INTO sales_control (
        house_no, building, floor, unit, area, unit_price, house_total, 
        total_with_parking, sales_status, sales_date, deposit_date, sign_date, 
        buyer, sales_id, parking_ids, custom_change, custom_change_content, 
        media_source, introducer, notes, base_price, premium_rate, project_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    for (const data of mockData) {
      await executeQuery(insertQuery, [
        data.house_no, data.building, data.floor, data.unit, data.area,
        data.unit_price, data.house_total, data.total_with_parking, data.sales_status,
        data.sales_date, data.deposit_date, data.sign_date, data.buyer,
        data.sales_id, data.parking_ids, data.custom_change,
        data.custom_change_content, data.media_source, data.introducer,
        data.notes, data.base_price, data.premium_rate, data.project_id
      ]);
    }
    
    console.log(`成功插入 ${mockData.length} 條銷控數據`);
    
    // 驗證插入結果
    const result = await executeQuery('SELECT COUNT(*) as count FROM sales_control WHERE project_id = 1');
    if (Array.isArray(result) && result.length > 0) {
      console.log(`數據庫中共有 ${result[0].count} 條銷控記錄`);
    }
    
  } catch (error) {
    console.error('插入模擬數據失敗:', error);
    throw error;
  }
}

// 驗證數據的函數
async function validateMockData() {
  try {
    console.log('\n開始驗證插入的數據...');
    
    // 查詢總數
    const totalCount = await executeQuery('SELECT COUNT(*) as count FROM sales_control WHERE project_id = 1');
    console.log(`總記錄數: ${totalCount[0].count}`);
    
    // 按銷售狀態統計
    const statusStats = await executeQuery(`
      SELECT sales_status, COUNT(*) as count 
      FROM sales_control 
      WHERE project_id = 1 
      GROUP BY sales_status
    `);
    console.log('\n銷售狀態統計:');
    statusStats.forEach(stat => {
      console.log(`  ${stat.sales_status}: ${stat.count} 戶`);
    });
    
    // 按建築物統計
    const buildingStats = await executeQuery(`
      SELECT building, COUNT(*) as count 
      FROM sales_control 
      WHERE project_id = 1 
      GROUP BY building
    `);
    console.log('\n建築物統計:');
    buildingStats.forEach(stat => {
      console.log(`  ${stat.building}棟: ${stat.count} 戶`);
    });
    
    // 查看前5筆記錄
    const sampleData = await executeQuery(`
      SELECT house_no, building, floor, unit, area, sales_status, buyer 
      FROM sales_control 
      WHERE project_id = 1 
      LIMIT 5
    `);
    console.log('\n前5筆記錄:');
    sampleData.forEach(record => {
      console.log(`  ${record.house_no}: ${record.building}棟${record.floor}樓${record.unit} - ${record.area}坪 - ${record.sales_status} - ${record.buyer || '無買方'}`);
    });
    
    return true;
  } catch (error) {
    console.error('驗證數據失敗:', error);
    return false;
  }
}

// 主執行函數
async function main() {
  try {
    await seedMockData();
    const isValid = await validateMockData();
    
    if (connection) {
      await connection.end();
      console.log('\n資料庫連接已關閉');
    }
    
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('執行失敗:', error);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

// 如果直接執行此文件，則運行主函數
if (require.main === module) {
  main();
}

module.exports = { seedMockData, validateMockData };