import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { PurchasedCustomer } from '@/lib/db'
import { withErrorHandler, createSuccessResponse, createValidationError, createNotFoundError } from '@/lib/error-handler'
import { parsePaginationParams, validateRequiredParams } from '@/lib/api-response'

// GET - 獲取項目的已購客戶數據
export const GET = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('searchTerm')
    const paymentStatus = searchParams.get('paymentStatus')
    const loanStatus = searchParams.get('loanStatus')
    const rating = searchParams.get('rating')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    
    // 分頁參數
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const skip = (page - 1) * pageSize
    
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
    
    if (paymentStatus) {
      whereConditions.paymentStatus = paymentStatus
    }
    
    if (loanStatus) {
      whereConditions.loanStatus = loanStatus
    }
    
    if (rating) {
      whereConditions.rating = rating
    }
    
    // 價格範圍篩選
    if (minPrice || maxPrice) {
      whereConditions.totalPrice = {}
      if (minPrice) whereConditions.totalPrice.gte = parseFloat(minPrice)
      if (maxPrice) whereConditions.totalPrice.lte = parseFloat(maxPrice)
    }
    
    // 日期範圍篩選
    if (startDate || endDate) {
      whereConditions.purchaseDate = {}
      if (startDate) whereConditions.purchaseDate.gte = new Date(startDate)
      if (endDate) whereConditions.purchaseDate.lte = new Date(endDate)
    }
    
    if (search) {
      whereConditions.OR = [
        { name: { contains: search } },
        { houseNo: { contains: search } },
        { contractNo: { contains: search } }
      ]
    }
    
    // 獲取總數
    const total = await prisma.purchasedCustomer.count({
      where: whereConditions
    })
    
    // 獲取已購客戶數據
    const purchasedCustomers = await prisma.purchasedCustomer.findMany({
      where: whereConditions,
      orderBy: [
        { purchaseDate: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: skip,
      take: pageSize
    })
    
    // 轉換數據格式
    const formattedData = purchasedCustomers.map(customer => ({
      id: customer.id,
      customerName: customer.name,
      phone: customer.phone || '',
      houseNo: customer.houseNo,
      purchaseDate: customer.purchaseDate,
      idCard: customer.idCard,
      isCorporate: customer.isCorporate,
      email: customer.email,
      age: customer.age,
      occupation: customer.occupation,
      registeredAddress: customer.registeredAddress,
      mailingAddress: customer.mailingAddress,
      rating: customer.rating,
      remark: customer.remark,
      projectId: customer.projectId,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }))
    
    return createSuccessResponse(formattedData, {
      page,
      limit: pageSize,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / pageSize)
    })
})

// POST - 創建新的已購客戶記錄
export const POST = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = parseInt(params.id)
    const body = await request.json()
    const {
      name,
      houseNo,
      purchaseDate,
      idCard,
      isCorporate = false,
      email,
      phone,
      age,
      occupation,
      registeredAddress,
      mailingAddress,
      remark,
      rating = 'C'
    } = body

    // 驗證必填字段
    if (!name || !houseNo) {
      throw createValidationError('缺少必填字段：客戶姓名和房號為必填項')
    }
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!projectExists) {
      throw createNotFoundError('項目不存在')
    }

    // 檢查房號是否已存在
    const existingHouse = await prisma.purchasedCustomer.findFirst({
      where: {
        projectId,
        houseNo
      }
    })
    
    if (existingHouse) {
      throw createValidationError('該房號已存在')
    }
    
    // 創建已購客戶記錄
    const newCustomer = await prisma.purchasedCustomer.create({
      data: {
        projectId,
        name,
        houseNo,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        idCard: idCard || null,
        isCorporate,
        email: email || null,
        phone: phone || null,
        age: age || null,
        occupation: occupation || null,
        registeredAddress: registeredAddress || null,
        mailingAddress: mailingAddress || null,
        remark: remark || null,
        rating: rating as any
      }
    })
    
    // 返回創建的記錄
    const responseData = {
      id: newCustomer.id,
      customerName: newCustomer.name,
      phone: newCustomer.phone || '',
      houseNo: newCustomer.houseNo,
      purchaseDate: newCustomer.purchaseDate,
      idCard: newCustomer.idCard,
      isCorporate: newCustomer.isCorporate,
      email: newCustomer.email,
      age: newCustomer.age,
      occupation: newCustomer.occupation,
      registeredAddress: newCustomer.registeredAddress,
      mailingAddress: newCustomer.mailingAddress,
      rating: newCustomer.rating,
      remark: newCustomer.remark,
      projectId: newCustomer.projectId,
      createdAt: newCustomer.createdAt,
      updatedAt: newCustomer.updatedAt
    }
    
    return createSuccessResponse(responseData, undefined, 201)
})

// PUT - 批量更新已購客戶記錄
export const PUT = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = parseInt(params.id)
    const body = await request.json()
    const { ids, updates } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw createValidationError('缺少要更新的記錄ID')
    }

    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!projectExists) {
      throw createNotFoundError('項目不存在')
    }

    // 批量更新
    const updateData: any = {}
    if (updates.rating) updateData.rating = updates.rating
    if (updates.remark !== undefined) updateData.remark = updates.remark
    if (updates.mailingAddress !== undefined) updateData.mailingAddress = updates.mailingAddress
    if (updates.phone !== undefined) updateData.phone = updates.phone
    if (updates.email !== undefined) updateData.email = updates.email

    const result = await prisma.purchasedCustomer.updateMany({
      where: {
        id: { in: ids },
        projectId
      },
      data: updateData
    })

    return createSuccessResponse({
      message: `成功更新 ${result.count} 條記錄`,
      updatedCount: result.count
    })
})

// DELETE - 批量刪除已購客戶記錄
export const DELETE = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    if (!idsParam) {
      throw createValidationError('缺少要刪除的記錄ID')
    }

    const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))

    if (ids.length === 0) {
      throw createValidationError('無效的記錄ID')
    }

    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!projectExists) {
      throw createNotFoundError('項目不存在')
    }

    // 批量刪除
    const result = await prisma.purchasedCustomer.deleteMany({
      where: {
        id: { in: ids },
        projectId
      }
    })

    return createSuccessResponse({
      message: `成功刪除 ${result.count} 條記錄`,
      deletedCount: result.count
    })
})