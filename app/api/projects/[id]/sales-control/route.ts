import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import type { SalesControl } from '@/lib/db'

// GET - 獲取項目的銷控數據
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const building = searchParams.get('building')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    // 驗證項目是否存在
    const projectExists = await executeQuery(
      'SELECT id FROM project WHERE id = ?',
      [projectId]
    )
    
    if (!Array.isArray(projectExists) || projectExists.length === 0) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 構建查詢條件
    let whereClause = 'WHERE project_id = ?'
    const queryParams: any[] = [projectId]
    
    if (building) {
      whereClause += ' AND building = ?'
      queryParams.push(building)
    }
    
    if (status) {
      whereClause += ' AND sales_status = ?'
      queryParams.push(status)
    }
    
    if (search) {
      whereClause += ' AND (house_no LIKE ? OR unit LIKE ? OR buyer LIKE ?)'
      const searchPattern = `%${search}%`
      queryParams.push(searchPattern, searchPattern, searchPattern)
    }
    
    const query = `
      SELECT 
        id,
        project_id as projectId,
        building,
        floor,
        house_no as houseNo,
        unit,
        area,
        unit_price,
        house_total,
        total_with_parking,
        sales_status as status,
        sales_date,
        deposit_date,
        sign_date,
        buyer,
        sales_person_id,
        parking_ids,
        custom_change,
        custom_change_content,
        media_source,
        introducer,
        remark,
        base_price,
        premium_rate,
        created_at as createdAt,
        updated_at as updatedAt
      FROM sales_control 
      ${whereClause}
      ORDER BY building, floor, house_no
    `
    
    const salesControl = await executeQuery(query, queryParams)
    
    return NextResponse.json(salesControl)
  } catch (error) {
    console.error('獲取銷控數據失敗:', error)
    return NextResponse.json({ error: '獲取銷控數據失敗' }, { status: 500 })
  }
}

// POST - 創建新的銷控記錄
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id
    const body = await request.json()
    const {
      building,
      floor,
      houseNo,
      unit,
      area,
      unitPrice,
      houseTotal,
      totalWithParking,
      salesStatus = '未售出',
      salesDate,
      depositDate,
      signDate,
      buyer,
      salesPersonId,
      parkingIds,
      customChange,
      customChangeContent,
      mediaSource,
      introducer,
      remark,
      basePrice,
      premiumRate
    } = body

    // 驗證必填字段
    if (!building || !floor || !houseNo || !unit) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }
    
    // 驗證項目是否存在
    const projectExists = await executeQuery(
      'SELECT id FROM project WHERE id = ?',
      [projectId]
    )

    if (!Array.isArray(projectExists) || projectExists.length === 0) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }

    // 檢查戶號是否已存在
    const existingUnit = await executeQuery(
      'SELECT id FROM sales_control WHERE project_id = ? AND building = ? AND floor = ? AND house_no = ?',
      [projectId, building, floor, houseNo]
    )
    
    if (Array.isArray(existingUnit) && existingUnit.length > 0) {
      return NextResponse.json({ error: '該戶號已存在' }, { status: 400 })
    }
    
    // 創建銷控記錄
    const result = await executeQuery(
      `INSERT INTO sales_control (
        project_id, building, floor, house_no, unit, area, unit_price, 
        house_total, total_with_parking, sales_status, sales_date, deposit_date, 
        sign_date, buyer, sales_person_id, parking_ids, custom_change, 
        custom_change_content, media_source, introducer, remark, base_price, premium_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId, building, floor, houseNo, unit, area || null, unitPrice || null,
        houseTotal || null, totalWithParking || null, salesStatus, salesDate || null, 
        depositDate || null, signDate || null, buyer || null, salesPersonId || null, 
        parkingIds || null, customChange || false, customChangeContent || null, 
        mediaSource || null, introducer || null, remark || null, basePrice || null, 
        premiumRate || null
      ]
    )

    if (result && typeof result === 'object' && 'insertId' in result) {
      // 獲取創建的記錄
      const newRecord = await executeQuery(
        `SELECT 
          id,
          project_id as projectId,
          building,
          floor,
          house_no as houseNo,
          unit,
          area,
          unit_price,
          house_total,
          total_with_parking,
          sales_status as status,
          sales_date,
          deposit_date,
          sign_date,
          buyer,
          sales_person_id,
          parking_ids,
          custom_change,
          custom_change_content,
          media_source,
          introducer,
          remark,
          base_price,
          premium_rate,
          created_at as createdAt,
          updated_at as updatedAt
        FROM sales_control WHERE id = ?`,
        [result.insertId]
      )
      
      return NextResponse.json(Array.isArray(newRecord) ? newRecord[0] : newRecord, { status: 201 })
    }
    
    return NextResponse.json({ error: '創建銷控記錄失敗' }, { status: 500 })
  } catch (error) {
    console.error('創建銷控記錄失敗:', error)
    return NextResponse.json({ error: '創建銷控記錄失敗' }, { status: 500 })
  }
}