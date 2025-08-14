import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - 獲取項目的佣金數據
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })
    
    if (!projectExists) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 構建查詢條件
    const whereConditions: any = {
      projectId: projectId
    }
    
    if (status) {
      whereConditions.commissionStatus = status
    }
    
    if (search) {
      whereConditions.OR = [
        { building: { contains: search } },
        { unit: { contains: search } },
        { salesPersonnel: { contains: search } }
      ]
    }
    
    if (startDate && endDate) {
      whereConditions.salesDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    
    // 獲取總數
    const total = await prisma.commissionList.count({
      where: whereConditions
    })
    
    // 計算分頁
    const offset = (page - 1) * pageSize
    const totalPages = Math.ceil(total / pageSize)
    
    const commissions = await prisma.commissionList.findMany({
      where: whereConditions,
      orderBy: {
        salesDate: 'desc'
      },
      skip: offset,
      take: pageSize
    })
    
    return NextResponse.json({
      data: commissions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('獲取佣金數據失敗:', error)
    return NextResponse.json({ error: '獲取佣金數據失敗' }, { status: 500 })
  }
}

// POST - 創建新的佣金記錄
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = parseInt(params.id)
    const body = await request.json()
    const {
      building,
      unit,
      area,
      floor,
      salesId,
      salesDate,
      totalPrice,
      totalCommissionRate,
      totalCommission,
      status,
      houseNo
    } = body
    
    // 驗證必填字段
    if (!building || !unit || !salesId || floor === undefined) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })
    
    if (!projectExists) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 創建佣金記錄
    const newRecord = await prisma.commissionList.create({
      data: {
        projectId,
        building,
        unit,
        area: area ? parseFloat(area) : undefined,
        floor: parseInt(floor),
        salesId,
        salesDate: salesDate ? new Date(salesDate) : undefined,
        totalPrice: totalPrice ? parseFloat(totalPrice) : undefined,
        totalCommissionRate: totalCommissionRate ? parseFloat(totalCommissionRate) : 0,
        totalCommission: totalCommission ? parseFloat(totalCommission) : 0,
        status: status || 'SOLD',
        houseNo: houseNo || undefined
      }
    })
    
    return NextResponse.json(newRecord, { status: 201 })
  } catch (error) {
    console.error('創建佣金記錄失敗:', error)
    return NextResponse.json({ error: '創建佣金記錄失敗' }, { status: 500 })
  }
}