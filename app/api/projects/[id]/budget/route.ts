import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withErrorHandler, createSuccessResponse, createValidationError, createNotFoundError } from '@/lib/error-handler'
import { createProtectedApiHandler } from '@/lib/auth-utils'

// GET - 獲取項目的預算數據
export const GET = createProtectedApiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
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
        { remark: { contains: search } }
      ]
    }
    
    // 獲取總數
    const total = await prisma.budgetPlan.count({
      where: whereConditions
    })
    
    // 計算分頁
    const offset = (page - 1) * pageSize
    const totalPages = Math.ceil(total / pageSize)
    
    const budgetPlans = await prisma.budgetPlan.findMany({
      where: whereConditions,
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: pageSize
    })
    
    return createSuccessResponse(budgetPlans, {
      page,
      limit: pageSize,
      total,
      totalPages
    })
}, ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'FINANCE'])

// POST - 創建新的預算記錄
export const POST = createProtectedApiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = parseInt(params.id)
    const body = await request.json()
    const {
      category,
      item,
      budget,
      quantity,
      unit,
      unitPrice,
      vendor,
      executionRate,
      remark
    } = body
    
    // 驗證必填字段
    if (!category || !item || budget === undefined) {
      throw createValidationError('缺少必填字段：類別、項目、預算金額為必填項')
    }
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })
    
    if (!projectExists) {
      throw createNotFoundError('項目不存在')
    }
    
    // 創建預算記錄
    const newRecord = await prisma.budgetPlan.create({
      data: {
        projectId,
        category,
        item,
        budget: parseFloat(budget),
        quantity: quantity ? parseInt(quantity) : undefined,
        unit: unit || undefined,
        unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
        vendor: vendor || undefined,
        executionRate: executionRate ? parseFloat(executionRate) : 0,
        remark: remark || null
      }
    })
    
    return createSuccessResponse(newRecord, undefined, 201)
}, ['SUPER_ADMIN', 'ADMIN', 'FINANCE'])