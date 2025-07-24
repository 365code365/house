import { NextRequest, NextResponse } from 'next/server'
import { getConnection, executeQuery, closeConnection } from '@/lib/db'

// PUT - 更新銷控記錄
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; unitId: string } }
) {
  const connection = await getConnection()
  
  try {
    const { id: projectId, unitId } = params
    const body = await request.json()
    const {
      building,
      floor,
      houseNo,
      unitType,
      area,
      price,
      status,
      salesPerson,
      customerName,
      contractDate
    } = body
    
    // 驗證銷控記錄是否存在且屬於該項目
    const existingUnit = await executeQuery(
      connection,
      'SELECT id FROM sales_control WHERE id = ? AND project_id = ?',
      [unitId, projectId]
    )
    
    if (!Array.isArray(existingUnit) || existingUnit.length === 0) {
      return NextResponse.json({ error: '銷控記錄不存在' }, { status: 404 })
    }
    
    // 如果更新了戶號，檢查是否與其他記錄衝突
    if (building && floor && houseNo) {
      const conflictingUnit = await executeQuery(
        connection,
        'SELECT id FROM sales_control WHERE project_id = ? AND building = ? AND floor = ? AND house_no = ? AND id != ?',
        [projectId, building, floor, houseNo, unitId]
      )
      
      if (Array.isArray(conflictingUnit) && conflictingUnit.length > 0) {
        return NextResponse.json({ error: '該戶號已存在' }, { status: 400 })
      }
    }
    
    // 構建更新查詢
    const updateFields: string[] = []
    const updateValues: any[] = []
    
    if (building !== undefined) {
      updateFields.push('building = ?')
      updateValues.push(building)
    }
    if (floor !== undefined) {
      updateFields.push('floor = ?')
      updateValues.push(floor)
    }
    if (houseNo !== undefined) {
      updateFields.push('house_no = ?')
      updateValues.push(houseNo)
    }
    if (unitType !== undefined) {
      updateFields.push('unit_type = ?')
      updateValues.push(unitType)
    }
    if (area !== undefined) {
      updateFields.push('area = ?')
      updateValues.push(area)
    }
    if (price !== undefined) {
      updateFields.push('price = ?')
      updateValues.push(price)
    }
    if (status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }
    if (salesPerson !== undefined) {
      updateFields.push('sales_person = ?')
      updateValues.push(salesPerson || null)
    }
    if (customerName !== undefined) {
      updateFields.push('customer_name = ?')
      updateValues.push(customerName || null)
    }
    if (contractDate !== undefined) {
      updateFields.push('contract_date = ?')
      updateValues.push(contractDate || null)
    }
    
    if (updateFields.length === 0) {
      return NextResponse.json({ error: '沒有要更新的字段' }, { status: 400 })
    }
    
    updateFields.push('updated_at = NOW()')
    updateValues.push(unitId)
    
    const updateQuery = `UPDATE sales_control SET ${updateFields.join(', ')} WHERE id = ?`
    
    await executeQuery(connection, updateQuery, updateValues)
    
    // 獲取更新後的記錄
    const updatedRecord = await executeQuery(
      connection,
      `SELECT 
        id,
        project_id as projectId,
        building,
        floor,
        house_no as houseNo,
        unit_type as unitType,
        area,
        price,
        status,
        sales_person as salesPerson,
        customer_name as customerName,
        contract_date as contractDate,
        created_at as createdAt,
        updated_at as updatedAt
      FROM sales_control WHERE id = ?`,
      [unitId]
    )
    
    return NextResponse.json(Array.isArray(updatedRecord) ? updatedRecord[0] : updatedRecord)
  } catch (error) {
    console.error('更新銷控記錄失敗:', error)
    return NextResponse.json({ error: '更新銷控記錄失敗' }, { status: 500 })
  } finally {
    await closeConnection(connection)
  }
}

// DELETE - 刪除銷控記錄
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; unitId: string } }
) {
  const connection = await getConnection()
  
  try {
    const { id: projectId, unitId } = params
    
    // 驗證銷控記錄是否存在且屬於該項目
    const existingUnit = await executeQuery(
      connection,
      'SELECT id FROM sales_control WHERE id = ? AND project_id = ?',
      [unitId, projectId]
    )
    
    if (!Array.isArray(existingUnit) || existingUnit.length === 0) {
      return NextResponse.json({ error: '銷控記錄不存在' }, { status: 404 })
    }
    
    // 刪除銷控記錄
    await executeQuery(
      connection,
      'DELETE FROM sales_control WHERE id = ?',
      [unitId]
    )
    
    return NextResponse.json({ message: '銷控記錄已刪除' })
  } catch (error) {
    console.error('刪除銷控記錄失敗:', error)
    return NextResponse.json({ error: '刪除銷控記錄失敗' }, { status: 500 })
  } finally {
    await closeConnection(connection)
  }
}

// POST - 處理退戶
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; unitId: string } }
) {
  const connection = await getConnection()
  
  try {
    const { id: projectId, unitId } = params
    const body = await request.json()
    const { action, reason } = body
    
    if (action !== 'withdraw') {
      return NextResponse.json({ error: '無效的操作' }, { status: 400 })
    }
    
    if (!reason || reason.trim() === '') {
      return NextResponse.json({ error: '退戶原因不能為空' }, { status: 400 })
    }
    
    // 驗證銷控記錄是否存在且屬於該項目
    const existingUnit = await executeQuery(
      connection,
      'SELECT id, status FROM sales_control WHERE id = ? AND project_id = ?',
      [unitId, projectId]
    )
    
    if (!Array.isArray(existingUnit) || existingUnit.length === 0) {
      return NextResponse.json({ error: '銷控記錄不存在' }, { status: 404 })
    }
    
    const unit = existingUnit[0] as any
    if (unit.status !== 'sold') {
      return NextResponse.json({ error: '只有已售房屋才能退戶' }, { status: 400 })
    }
    
    // 更新狀態為退戶
    await executeQuery(
      connection,
      'UPDATE sales_control SET status = ?, customer_name = NULL, sales_person = NULL, contract_date = NULL, updated_at = NOW() WHERE id = ?',
      ['withdrawn', unitId]
    )
    
    // 記錄退戶原因（這裡可以擴展為單獨的退戶記錄表）
    // 暫時將原因記錄在備註字段中，如果沒有備註字段，可以考慮添加
    
    // 獲取更新後的記錄
    const updatedRecord = await executeQuery(
      connection,
      `SELECT 
        id,
        project_id as projectId,
        building,
        floor,
        house_no as houseNo,
        unit_type as unitType,
        area,
        price,
        status,
        sales_person as salesPerson,
        customer_name as customerName,
        contract_date as contractDate,
        created_at as createdAt,
        updated_at as updatedAt
      FROM sales_control WHERE id = ?`,
      [unitId]
    )
    
    return NextResponse.json({
      unit: Array.isArray(updatedRecord) ? updatedRecord[0] : updatedRecord,
      message: '退戶處理完成'
    })
  } catch (error) {
    console.error('退戶處理失敗:', error)
    return NextResponse.json({ error: '退戶處理失敗' }, { status: 500 })
  } finally {
    await closeConnection(connection)
  }
}