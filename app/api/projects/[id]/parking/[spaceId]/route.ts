import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

// PUT - 更新停車位
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; spaceId: string } }
) {
  try {
    const { id: projectId, spaceId } = params
    const body = await request.json()
    const {
      spaceNumber,
      spaceType,
      location,
      price,
      status,
      customerName,
      salesPerson,
      contractDate
    } = body
    
    // 檢查停車位是否存在且屬於該項目
    const existingSpace = await executeQuery(
      'SELECT id, space_number FROM parking_spaces WHERE id = ? AND project_id = ?',
      [spaceId, projectId]
    )
    
    if (!Array.isArray(existingSpace) || existingSpace.length === 0) {
      return NextResponse.json({ error: '停車位不存在' }, { status: 404 })
    }
    
    // 檢查車位編號是否重複（排除當前記錄）
    const duplicateSpace = await executeQuery(
      'SELECT id FROM parking_spaces WHERE project_id = ? AND space_number = ? AND id != ?',
      [projectId, spaceNumber, spaceId]
    )
      
    if (Array.isArray(duplicateSpace) && duplicateSpace.length > 0) {
      return NextResponse.json({ error: '該車位編號已存在' }, { status: 400 })
    }
    
    await executeQuery(
      `UPDATE parking_spaces SET 
        space_number = ?,
        space_type = ?,
        location = ?,
        price = ?,
        status = ?,
        customer_name = ?,
        sales_person = ?,
        contract_date = ?,
        updated_at = NOW()
      WHERE id = ? AND project_id = ?`,
      [
        spaceNumber,
        spaceType,
        location,
        price,
        status,
        customerName || null,
        salesPerson || null,
        contractDate || null,
        spaceId,
        projectId
      ]
    )
    
    return NextResponse.json({ message: '停車位已更新' })
  } catch (error) {
    console.error('更新停車位失敗:', error)
    return NextResponse.json({ error: '更新停車位失敗' }, { status: 500 })
  }
}

// DELETE - 刪除停車位
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; spaceId: string } }
) {
  try {
    const { id: projectId, spaceId } = params
    
    // 檢查停車位是否存在且屬於該項目
    const existingSpace = await executeQuery(
      'SELECT id, status FROM parking_spaces WHERE id = ? AND project_id = ?',
      [spaceId, projectId]
    )
    
    if (!Array.isArray(existingSpace) || existingSpace.length === 0) {
      return NextResponse.json({ error: '停車位不存在' }, { status: 404 })
    }
    
    const space = existingSpace[0] as any
    
    // 檢查是否可以刪除（已售出的停車位可能需要特殊處理）
    if (space.status === 'sold') {
      return NextResponse.json({ 
        error: '已售出的停車位不能直接刪除，請先處理相關合約' 
      }, { status: 400 })
    }
    
    await executeQuery(
      'DELETE FROM parking_spaces WHERE id = ? AND project_id = ?',
      [spaceId, projectId]
    )
    
    return NextResponse.json({ message: '停車位已刪除' })
  } catch (error) {
    console.error('刪除停車位失敗:', error)
    return NextResponse.json({ error: '刪除停車位失敗' }, { status: 500 })
  }
}

// GET - 獲取單個停車位詳情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; spaceId: string } }
) {
  try {
    const { id: projectId, spaceId } = params
    
    const parkingSpace = await executeQuery(
      `SELECT 
        id,
        space_number,
        space_type,
        location,
        price,
        status,
        customer_name,
        sales_person,
        contract_date,
        created_at,
        updated_at
      FROM parking_spaces 
      WHERE id = ? AND project_id = ?`,
      [spaceId, projectId]
    )
    
    if (!Array.isArray(parkingSpace) || parkingSpace.length === 0) {
      return NextResponse.json({ error: '停車位不存在' }, { status: 404 })
    }
    
    return NextResponse.json(parkingSpace[0])
  } catch (error) {
    console.error('獲取停車位詳情失敗:', error)
    return NextResponse.json({ error: '獲取停車位詳情失敗' }, { status: 500 })
  }
}