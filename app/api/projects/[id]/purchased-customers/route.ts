import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { PurchasedCustomer } from '@/lib/db'
import { withErrorHandler, createSuccessResponse, createValidationError, createNotFoundError } from '@/lib/error-handler'

// GET - 獲取項目的已購客戶數據
export const GET = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
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
    
    if (search) {
      whereConditions.OR = [
        { name: { contains: search } },
        { houseNo: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } }
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
    
    // 獲取銷售人員信息（如果需要的話）
    const salesPersonIds = purchasedCustomers
      .map(customer => customer.salesId)
      .filter((id): id is string => id !== null && id !== undefined)
    
    let salesPersonnelMap: Record<string, any> = {}
    if (salesPersonIds.length > 0) {
      const salesPersonnel = await prisma.salesPersonnel.findMany({
        where: {
          employeeNo: { in: salesPersonIds }
        },
        select: {
          employeeNo: true,
          name: true
        }
      })
      
      salesPersonnelMap = salesPersonnel.reduce((acc, person) => {
        acc[person.employeeNo] = person
        return acc
      }, {} as Record<string, any>)
    }
    
    // 轉換數據格式，與前端期望的格式匹配
    const formattedData = purchasedCustomers.map(customer => ({
      id: customer.id,
      projectId: customer.projectId,
      customerName: customer.name,
      houseNo: customer.houseNo,
      purchaseDate: customer.purchaseDate,
      idCard: customer.idCard,
      isCorporate: customer.isCorporate,
      email: customer.email,
      phone: customer.phone,
      age: customer.age,
      occupation: customer.occupation,
      registeredAddress: customer.registeredAddress,
      mailingAddress: customer.mailingAddress,
      remark: customer.remark,
      rating: customer.rating,
      salesPersonId: customer.salesId || null,
      salesPerson: customer.salesId ? salesPersonnelMap[customer.salesId]?.name || '' : '',
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
      customerName,
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
      rating = 'C',
      salesPersonId
    } = body

    // 驗證必填字段
    if (!customerName || !houseNo) {
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
    
    // 如果提供了銷售人員ID，驗證銷售人員是否存在
    if (salesPersonId) {
      const salesPersonExists = await prisma.salesPersonnel.findFirst({
        where: {
          employeeNo: salesPersonId,
          projectIds: { contains: projectId.toString() }
        }
      })
      
      if (!salesPersonExists) {
        throw createValidationError('銷售人員不存在或無權限訪問此項目')
      }
    }
    
    // 創建已購客戶記錄
    const newCustomer = await prisma.purchasedCustomer.create({
      data: {
        projectId,
        name: customerName,
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
        rating: rating as any,
        salesId: salesPersonId || null
      },
      include: {
        salesPersonnel: true
      }
    })
    
    // 返回創建的記錄
    const responseData = {
      id: newCustomer.id,
      projectId: newCustomer.projectId,
      customerName: newCustomer.name,
      houseNo: newCustomer.houseNo,
      purchaseDate: newCustomer.purchaseDate,
      idCard: newCustomer.idCard,
      isCorporate: newCustomer.isCorporate,
      email: newCustomer.email,
      phone: newCustomer.phone,
      age: newCustomer.age,
      occupation: newCustomer.occupation,
      registeredAddress: newCustomer.registeredAddress,
      mailingAddress: newCustomer.mailingAddress,
      remark: newCustomer.remark,
      rating: newCustomer.rating,
      salesPersonId: newCustomer.salesId,
      salesPerson: newCustomer.salesPersonnel?.name || '',
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