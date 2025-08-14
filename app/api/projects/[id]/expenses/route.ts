import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withErrorHandler, createSuccessResponse, createValidationError, createNotFoundError } from '@/lib/error-handler'

// GET - 獲取項目的費用數據
export const GET = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
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
      throw createNotFoundError('項目不存在')
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
    
    return createSuccessResponse(expenses, {
      page,
      limit: pageSize,
      total,
      totalPages
    })
})

// POST - 創建新的費用記錄
export const POST = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
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
      throw createValidationError('缺少必填字段：費用日期、類別、項目、實際費用為必填項')
    }
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })
    
    if (!projectExists) {
      throw createNotFoundError('項目不存在')
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
    
    return createSuccessResponse(newRecord, undefined, 201)
})