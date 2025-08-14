import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - 獲取項目的費用數據
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
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
    
    if (category) {
      whereConditions.category = { contains: category }
    }
    
    if (search) {
      whereConditions.OR = [
        { category: { contains: search } },
        { item: { contains: search } },
        { vendor: { contains: search } },
        { invoiceNo: { contains: search } },
        { remark: { contains: search } }
      ]
    }
    
    if (startDate && endDate) {
      whereConditions.expenseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    
    // 獲取總數
    const total = await prisma.expenseManagement.count({
      where: whereConditions
    })
    
    // 計算分頁
    const offset = (page - 1) * pageSize
    const totalPages = Math.ceil(total / pageSize)
    
    const expenses = await prisma.expenseManagement.findMany({
      where: whereConditions,
      orderBy: {
        expenseDate: 'desc'
      },
      skip: offset,
      take: pageSize
    })
    
    return NextResponse.json({
      data: expenses,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('獲取費用數據失敗:', error)
    return NextResponse.json({ error: '獲取費用數據失敗' }, { status: 500 })
  }
}

// POST - 創建新的費用記錄
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = parseInt(params.id)
    const body = await request.json()
    const {
      expenseDate,
      category,
      item,
      actualExpense,
      quantity,
      unit,
      unitPrice,
      vendor,
      invoiceNo,
      remark
    } = body
    
    // 驗證必填字段
    if (!expenseDate || !category || !item || actualExpense === undefined) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })
    
    if (!projectExists) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 創建費用記錄
    const newRecord = await prisma.expenseManagement.create({
      data: {
        projectId,
        expenseDate: new Date(expenseDate),
        category,
        item,
        actualExpense: parseFloat(actualExpense),
        quantity: quantity ? parseInt(quantity) : undefined,
        unit: unit || undefined,
        unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
        vendor: vendor || undefined,
        invoiceNo: invoiceNo || undefined,
        remark: remark || undefined
      }
    })
    
    return NextResponse.json(newRecord, { status: 201 })
  } catch (error) {
    console.error('創建費用記錄失敗:', error)
    return NextResponse.json({ error: '創建費用記錄失敗' }, { status: 500 })
  }
}