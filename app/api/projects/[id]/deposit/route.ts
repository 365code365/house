import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - 獲取項目的訂金數據
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
      whereConditions.paymentStatus = status
    }
    
    if (search) {
      whereConditions.OR = [
        { buyerName: { contains: search } },
        { houseType: { contains: search } },
        { salesPersonnel: { contains: search } }
      ]
    }
    
    if (startDate && endDate) {
      whereConditions.paymentDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    
    // 獲取總數
    const total = await prisma.depositManagement.count({
      where: whereConditions
    })
    
    // 計算分頁
    const offset = (page - 1) * pageSize
    const totalPages = Math.ceil(total / pageSize)
    
    const deposits = await prisma.depositManagement.findMany({
      where: whereConditions,
      orderBy: {
        paymentDate: 'desc'
      },
      skip: offset,
      take: pageSize
    })
    
    return NextResponse.json({
      data: deposits,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('獲取訂金數據失敗:', error)
    return NextResponse.json({ error: '獲取訂金數據失敗' }, { status: 500 })
  }
}

// POST - 創建新的訂金記錄
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = parseInt(params.id)
    const body = await request.json()
    const {
      buyer,
      amount,
      paymentStatus,
      paymentDate,
      dueDate,
      autoRemind,
      remark,
      houseNo
    } = body
    
    // 驗證必填字段
    if (!buyer || amount === undefined || !dueDate) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })
    
    if (!projectExists) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 創建訂金記錄
    const newRecord = await prisma.depositManagement.create({
      data: {
        projectId,
        buyer,
        amount: parseFloat(amount),
        paymentStatus: paymentStatus || 'UNPAID',
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        dueDate: new Date(dueDate),
        autoRemind: autoRemind !== undefined ? autoRemind : true,
        remark: remark || undefined,
        houseNo: houseNo || undefined
      }
    })
    
    return NextResponse.json(newRecord, { status: 201 })
  } catch (error) {
    console.error('創建訂金記錄失敗:', error)
    return NextResponse.json({ error: '創建訂金記錄失敗' }, { status: 500 })
  }
}