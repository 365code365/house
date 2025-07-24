import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

// GET - 獲取項目的預約數據
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const date = searchParams.get('date')
    
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
    
    if (status) {
      whereClause += ' AND status = ?'
      queryParams.push(status)
    }
    
    if (search) {
      whereClause += ' AND (customer_name LIKE ? OR customer_phone LIKE ? OR purpose LIKE ?)'
      const searchPattern = `%${search}%`
      queryParams.push(searchPattern, searchPattern, searchPattern)
    }
    
    if (date) {
      whereClause += ' AND appointment_date = ?'
      queryParams.push(date)
    }
    
    const query = `
      SELECT 
        id,
        project_id,
        customer_name,
        customer_phone,
        customer_email,
        appointment_date as date,
        appointment_time as time,
        status,
        purpose,
        sales_person,
        notes,
        created_at,
        updated_at
      FROM appointments 
      ${whereClause}
      ORDER BY appointment_date DESC, appointment_time DESC
    `
    
    const appointments = await executeQuery(query, queryParams)
    
    return NextResponse.json(appointments)
  } catch (error) {
    console.error('獲取預約數據失敗:', error)
    return NextResponse.json({ error: '獲取預約數據失敗' }, { status: 500 })
  }
}

// POST - 創建新的預約
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id
    const body = await request.json()
    const {
      customer_name,
      customer_phone,
      customer_email,
      date,
      time,
      purpose,
      sales_person,
      notes
    } = body
    
    // 驗證必填字段
    if (!customer_name || !customer_phone || !date || !time || !purpose) {
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
    
    // 檢查同一時間是否已有預約
    const conflictingAppointment = await executeQuery(
      'SELECT id FROM appointments WHERE project_id = ? AND appointment_date = ? AND appointment_time = ? AND status != "cancelled"',
      [projectId, date, time]
    )
    
    if (Array.isArray(conflictingAppointment) && conflictingAppointment.length > 0) {
      return NextResponse.json({ error: '該時間段已有預約' }, { status: 400 })
    }
    
    // 創建預約記錄
    const result = await executeQuery(
      `INSERT INTO appointments (
        project_id, customer_name, customer_phone, customer_email,
        appointment_date, appointment_time, purpose, sales_person, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      [
        projectId, customer_name, customer_phone, customer_email || null,
        date, time, purpose, sales_person || null, notes || null
      ]
    )
    
    if (result && typeof result === 'object' && 'insertId' in result) {
      // 獲取創建的記錄
      const newRecord = await executeQuery(
        `SELECT 
          id,
          project_id,
          customer_name,
          customer_phone,
          customer_email,
          appointment_date as date,
          appointment_time as time,
          status,
          purpose,
          sales_person,
          notes,
          created_at,
          updated_at
        FROM appointments WHERE id = ?`,
        [result.insertId]
      )
      
      return NextResponse.json(Array.isArray(newRecord) ? newRecord[0] : newRecord, { status: 201 })
    }
    
    return NextResponse.json({ error: '創建預約失敗' }, { status: 500 })
  } catch (error) {
    console.error('創建預約失敗:', error)
    return NextResponse.json({ error: '創建預約失敗' }, { status: 500 })
  }
}