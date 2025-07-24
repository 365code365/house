import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import type { ParkingSpace } from '@/lib/db'

// GET - 獲取項目的停車位數據
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    // 驗證項目是否存在
    const projectExists = await executeQuery(
      'SELECT id FROM projects WHERE id = ?',
      [projectId]
    )
    
    if (!Array.isArray(projectExists) || projectExists.length === 0) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 構建查詢條件
    let whereClause = 'WHERE project_id = ?'
    const queryParams: any[] = [projectId]
    
    if (type) {
      whereClause += ' AND type = ?'
      queryParams.push(type)
    }
    
    if (status) {
      whereClause += ' AND status = ?'
      queryParams.push(status)
    }
    
    if (search) {
      whereClause += ' AND (space_number LIKE ? OR location LIKE ? OR customer_name LIKE ?)'
      const searchPattern = `%${search}%`
      queryParams.push(searchPattern, searchPattern, searchPattern)
    }
    
    const query = `
      SELECT 
        id,
        project_id as projectId,
        space_number as spaceNumber,
        type,
        location,
        price,
        status,
        customer_name as customerName,
        sales_person as salesPerson,
        contract_date as contractDate,
        created_at as createdAt,
        updated_at as updatedAt
      FROM parking_spaces 
      ${whereClause}
      ORDER BY space_number
    `
    
    const parkingSpaces = await executeQuery(query, queryParams)
    
    return NextResponse.json(parkingSpaces)
  } catch (error) {
    console.error('獲取停車位數據失敗:', error)
    return NextResponse.json({ error: '獲取停車位數據失敗' }, { status: 500 })
  }
}

// POST - 創建新的停車位
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id
    const body = await request.json()
    const {
      spaceNumber,
      type,
      location,
      price,
      status = 'available',
      customerName,
      salesPerson,
      contractDate
    } = body
    
    // 驗證必填字段
    if (!spaceNumber || !type || !location || price === undefined) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }
    
    // 驗證項目是否存在
    const projectExists = await executeQuery(
      'SELECT id FROM projects WHERE id = ?',
      [projectId]
    )
    
    if (!Array.isArray(projectExists) || projectExists.length === 0) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 檢查車位編號是否已存在
    const existingSpace = await executeQuery(
      'SELECT id FROM parking_spaces WHERE project_id = ? AND space_number = ?',
      [projectId, spaceNumber]
    )
    
    if (Array.isArray(existingSpace) && existingSpace.length > 0) {
      return NextResponse.json({ error: '該車位編號已存在' }, { status: 400 })
    }
    
    // 創建停車位記錄
    const result = await executeQuery(
      `INSERT INTO parking_spaces (
        project_id, space_number, type, location, price, 
        status, customer_name, sales_person, contract_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId, spaceNumber, type, location, price,
        status, customerName || null, salesPerson || null, contractDate || null
      ]
    )
    
    if (result && typeof result === 'object' && 'insertId' in result) {
      // 獲取創建的記錄
      const newRecord = await executeQuery(
        `SELECT 
          id,
          project_id as projectId,
          space_number as spaceNumber,
          type,
          location,
          price,
          status,
          customer_name as customerName,
          sales_person as salesPerson,
          contract_date as contractDate,
          created_at as createdAt,
          updated_at as updatedAt
        FROM parking_spaces WHERE id = ?`,
        [result.insertId]
      )
      
      return NextResponse.json(Array.isArray(newRecord) ? newRecord[0] : newRecord, { status: 201 })
    }
    
    return NextResponse.json({ error: '創建停車位失敗' }, { status: 500 })
  } catch (error) {
    console.error('創建停車位失敗:', error)
    return NextResponse.json({ error: '創建停車位失敗' }, { status: 500 })
  }
}