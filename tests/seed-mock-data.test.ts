import { executeQuery } from '../lib/db.js'

// 生成模拟数据的函数
function generateMockSalesControlData() {
  const mockData: any[] = []
  const buildings = ['A', 'B']
  const floors = [14, 15, 16, 17, 18]
  const units = ['A1', 'A2', 'B1', 'B2']
  const salesStatuses = ['售出', '訂金', '未售出', '不銷售']
  const salesPersons = ['張小明', '李小華', '王小美', '陳小強']
  const buyers = ['王大明', '李小芳', '張志明', '陳美麗', '林小強']
  const mediaSource = ['網路廣告', '朋友介紹', '路過', '報紙廣告']
  
  buildings.forEach(building => {
    floors.forEach(floor => {
      units.forEach(unit => {
        const area = Math.floor(Math.random() * 20) + 25 // 25-45坪
        const balconyArea = Math.floor(Math.random() * 5) + 3 // 3-8坪
        const unitPrice = Math.floor(Math.random() * 20) + 40 // 40-60萬/坪
        const housePrice = area * unitPrice
        const parkingPrice = Math.floor(Math.random() * 50) + 100 // 100-150萬
        const totalPrice = housePrice + parkingPrice
        const salesStatus = salesStatuses[Math.floor(Math.random() * salesStatuses.length)]
        const hasBuyer = salesStatus === '售出' || salesStatus === '訂金'
        const basePrice = Math.floor(housePrice * 0.9) // 底價為房價的90%
        const premiumRate = ((housePrice - basePrice) / basePrice) * 100
        
        mockData.push({
          project_id: 1, // 假設項目ID為1
          building,
          floor,
          unit,
          unit_number: `${building}${floor}${unit}`,
          area,
          balcony_area: balconyArea,
          unit_price: unitPrice,
          house_price: housePrice,
          parking_spaces: JSON.stringify([`${building}1-${Math.floor(Math.random() * 100) + 1}`]),
          parking_price: parkingPrice,
          total_price_with_parking: totalPrice,
          base_price: basePrice,
          premium_rate: Math.round(premiumRate * 100) / 100,
          sales_status: salesStatus,
          buyer_count: hasBuyer ? Math.floor(Math.random() * 3) + 1 : 0,
          buyer_names: hasBuyer ? buyers[Math.floor(Math.random() * buyers.length)] : null,
          order_date: hasBuyer ? `2024-12-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}` : null,
          contract_date: hasBuyer && salesStatus === '售出' ? `2024-12-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}` : null,
          sales_id: `SP${String(Math.floor(Math.random() * 4) + 1).padStart(3, '0')}`,
          sales_person_name: salesPersons[Math.floor(Math.random() * salesPersons.length)],
          custom_requirements: Math.random() > 0.7 ? 1 : 0,
          custom_content: Math.random() > 0.7 ? '客變廚房格局' : null,
          gifts: Math.random() > 0.5 ? '冷氣、家電' : null,
          notes: Math.random() > 0.8 ? '客戶要求特殊付款方式' : null,
          media_source: mediaSource[Math.floor(Math.random() * mediaSource.length)]
        })
      })
    })
  })
  
  return mockData
}

// 插入模拟数据到数据库
async function seedMockData() {
  try {
    console.log('開始插入模擬數據...')
    
    // 首先清空現有的銷控數據
    await executeQuery('DELETE FROM sales_control WHERE project_id = 1')
    console.log('已清空現有銷控數據')
    
    // 確保項目存在
    const projectExists = await executeQuery('SELECT id FROM project WHERE id = 1')
    if (!Array.isArray(projectExists) || projectExists.length === 0) {
      // 創建測試項目
      await executeQuery(
        'INSERT INTO project (id, name, location, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [1, '測試項目', '台北市', '測試用銷控項目', 'active']
      )
      console.log('已創建測試項目')
    }
    
    // 生成模擬數據
    const mockData = generateMockSalesControlData()
    
    // 批量插入數據
    const insertQuery = `
      INSERT INTO sales_control (
        project_id, building, floor, unit, unit_number, area, balcony_area,
        unit_price, house_price, parking_spaces, parking_price, total_price_with_parking,
        base_price, premium_rate, sales_status, buyer_count, buyer_names,
        order_date, contract_date, sales_person_id, sales_person_name,
        custom_requirements, custom_content, gifts, notes, media_source,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
      )
    `
    
    for (const data of mockData) {
      await executeQuery(insertQuery, [
        data.project_id, data.building, data.floor, data.unit, data.unit_number,
        data.area, data.balcony_area, data.unit_price, data.house_price,
        data.parking_spaces, data.parking_price, data.total_price_with_parking,
        data.base_price, data.premium_rate, data.sales_status, data.buyer_count,
        data.buyer_names, data.order_date, data.contract_date, data.sales_person_id,
        data.sales_person_name, data.custom_requirements, data.custom_content,
        data.gifts, data.notes, data.media_source
      ])
    }
    
    console.log(`成功插入 ${mockData.length} 條銷控數據`)
    
    // 驗證插入結果
    const result = await executeQuery('SELECT COUNT(*) as count FROM sales_control WHERE project_id = 1')
    if (Array.isArray(result) && result.length > 0) {
      console.log(`數據庫中共有 ${(result[0] as any).count} 條銷控記錄`)
    }
    
  } catch (error) {
    console.error('插入模擬數據失敗:', error)
    throw error
  }
}

// 驗證數據插入函數
async function validateMockData() {
  try {
    // 驗證數據是否正確插入
    const salesData = await executeQuery(
      'SELECT * FROM sales_control WHERE project_id = 1 ORDER BY building, floor, unit_number LIMIT 5'
    )
    
    if (Array.isArray(salesData) && salesData.length > 0) {
      console.log('✓ 數據插入驗證通過')
      console.log(`✓ 找到 ${salesData.length} 條記錄（顯示前5條）`)
      
      // 顯示第一條記錄的結構
      const firstRecord = salesData[0] as any
      console.log('✓ 第一條記錄結構:')
      console.log(`  - ID: ${firstRecord.id}`)
      console.log(`  - 項目ID: ${firstRecord.project_id}`)
      console.log(`  - 建築物: ${firstRecord.building}`)
      console.log(`  - 樓層: ${firstRecord.floor}`)
      console.log(`  - 戶號: ${firstRecord.unit_number}`)
      console.log(`  - 銷售狀態: ${firstRecord.sales_status}`)
      
      return true
    } else {
      console.log('✗ 未找到任何數據')
      return false
    }
  } catch (error) {
    console.error('✗ 數據驗證失敗:', error)
    return false
  }
}

// 如果直接運行此文件，則執行數據插入
if (require.main === module) {
  seedMockData()
    .then(() => {
      console.log('✓ 模擬數據插入完成')
      return validateMockData()
    })
    .then((isValid) => {
      if (isValid) {
        console.log('✓ 所有操作完成，數據驗證通過')
        process.exit(0)
      } else {
        console.log('✗ 數據驗證失敗')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('✗ 模擬數據插入失敗:', error)
      process.exit(1)
    })
}

export { seedMockData, generateMockSalesControlData, validateMockData }