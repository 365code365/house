import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { PurchasedCustomer } from '@/lib/db'

// GET - 獲取項目的已購客戶數據
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
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
      contactPhone: customer.contactPhone || '',
      houseNo: customer.houseNo,
      houseType: customer.houseType || '',
      contractNumber: customer.contractNo,
      purchaseDate: customer.purchaseDate,
      totalAmount: customer.totalPrice,
      paidAmount: customer.paidAmount || 0,
      paymentStatus: customer.paymentStatus,
      contractStatus: customer.contractStatus || 'DRAFT',
      handoverStatus: customer.handoverStatus || 'NOT_DELIVERED',
      handoverDate: customer.handoverDate,
      loanStatus: customer.loanStatus,
      rating: customer.rating,
      mailingAddress: customer.mailingAddress,
      lastContactDate: customer.lastContactDate,
      nextFollowUpDate: customer.nextFollowUpDate,
      salesPersonId: customer.salesPersonId,
      salesPerson: customer.salesPerson ? {
        id: customer.salesPerson.id,
        name: customer.salesPerson.name
      } : null,
      remark: customer.remark,
      projectId: customer.projectId,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }))
    
    return NextResponse.json({
      data: formattedData,
      pagination: {
        page,
        pageSize,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / pageSize)
      }
    })
  } catch (error) {
    console.error('獲取已購客戶數據失敗:', error)
    return NextResponse.json({ error: '獲取已購客戶數據失敗' }, { status: 500 })
  }
}

// POST - 創建新的已購客戶記錄
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = parseInt(params.id)
    const body = await request.json()
    const {
      name,
      houseNo,
      contractNo,
      purchaseDate,
      totalPrice,
      paymentStatus = 'PENDING',
      loanStatus = 'NOT_APPLIED',
      remark,
      mailingAddress,
      rating = 'C'
    } = body

    // 驗證必填字段
    if (!name || !houseNo) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!projectExists) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }

    // 檢查合約號是否已存在（如果提供）
    if (contractNo) {
      const existingContract = await prisma.purchasedCustomer.findFirst({
        where: {
          projectId,
          contractNo
        }
      })
      
      if (existingContract) {
        return NextResponse.json({ error: '該合約號已存在' }, { status: 400 })
      }
    }
    
    // 創建已購客戶記錄
    const newCustomer = await prisma.purchasedCustomer.create({
      data: {
        projectId,
        name,
        houseNo,
        contractNo: contractNo || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        totalPrice: totalPrice ? parseFloat(totalPrice) : null,
        paymentStatus: paymentStatus as any,
        loanStatus: loanStatus as any,
        remark: remark || null,
        mailingAddress: mailingAddress || null,
        rating: rating as any
      }
    })
    
    // 返回創建的記錄
    return NextResponse.json({
      id: newCustomer.id,
      customerName: newCustomer.name,
      contactPhone: newCustomer.contactPhone || '',
      houseNo: newCustomer.houseNo,
      houseType: newCustomer.houseType || '',
      contractNumber: newCustomer.contractNo,
      purchaseDate: newCustomer.purchaseDate,
      totalAmount: newCustomer.totalPrice,
      paidAmount: newCustomer.paidAmount || 0,
      paymentStatus: newCustomer.paymentStatus,
      contractStatus: newCustomer.contractStatus || 'DRAFT',
      handoverStatus: newCustomer.handoverStatus || 'NOT_DELIVERED',
      handoverDate: newCustomer.handoverDate,
      loanStatus: newCustomer.loanStatus,
      rating: newCustomer.rating,
      mailingAddress: newCustomer.mailingAddress,
      lastContactDate: newCustomer.lastContactDate,
      nextFollowUpDate: newCustomer.nextFollowUpDate,
      salesPersonId: newCustomer.salesPersonId,
      salesPerson: newCustomer.salesPerson ? {
        id: newCustomer.salesPerson.id,
        name: newCustomer.salesPerson.name
      } : null,
      remark: newCustomer.remark,
      projectId: newCustomer.projectId,
      createdAt: newCustomer.createdAt,
      updatedAt: newCustomer.updatedAt
    }, { status: 201 })
    
  } catch (error) {
    console.error('創建已購客戶記錄失敗:', error)
    return NextResponse.json({ error: '創建已購客戶記錄失敗' }, { status: 500 })
  }
}

// PUT - 批量更新已購客戶記錄
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = parseInt(params.id)
    const body = await request.json()
    const { ids, updates } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '缺少要更新的記錄ID' }, { status: 400 })
    }

    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!projectExists) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }

    // 批量更新
    const updateData: any = {}
    if (updates.paymentStatus) updateData.paymentStatus = updates.paymentStatus
    if (updates.loanStatus) updateData.loanStatus = updates.loanStatus
    if (updates.rating) updateData.rating = updates.rating
    if (updates.remark !== undefined) updateData.remark = updates.remark
    if (updates.mailingAddress !== undefined) updateData.mailingAddress = updates.mailingAddress

    const result = await prisma.purchasedCustomer.updateMany({
      where: {
        id: { in: ids },
        projectId
      },
      data: updateData
    })

    return NextResponse.json({
      message: `成功更新 ${result.count} 條記錄`,
      updatedCount: result.count
    })

  } catch (error) {
    console.error('批量更新已購客戶記錄失敗:', error)
    return NextResponse.json({ error: '批量更新已購客戶記錄失敗' }, { status: 500 })
  }
}

// DELETE - 批量刪除已購客戶記錄
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    if (!idsParam) {
      return NextResponse.json({ error: '缺少要刪除的記錄ID' }, { status: 400 })
    }

    const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))

    if (ids.length === 0) {
      return NextResponse.json({ error: '無效的記錄ID' }, { status: 400 })
    }

    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!projectExists) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }

    // 批量刪除
    const result = await prisma.purchasedCustomer.deleteMany({
      where: {
        id: { in: ids },
        projectId
      }
    })

    return NextResponse.json({
      message: `成功刪除 ${result.count} 條記錄`,
      deletedCount: result.count
    })

  } catch (error) {
    console.error('批量刪除已購客戶記錄失敗:', error)
    return NextResponse.json({ error: '批量刪除已購客戶記錄失敗' }, { status: 500 })
  }
}