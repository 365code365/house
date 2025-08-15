import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withErrorHandler, createSuccessResponse, createValidationError, createNotFoundError } from '@/lib/error-handler'
import { createProtectedApiHandler } from '@/lib/auth-utils'

// GET - 獲取單個已購客戶詳情
export const GET = createProtectedApiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string; customerId: string } }
) => {
  const projectId = parseInt(params.id)
  const customerId = parseInt(params.customerId)
  
  // 驗證項目是否存在
  const projectExists = await prisma.project.findUnique({
    where: { id: projectId }
  })
  
  if (!projectExists) {
    throw createNotFoundError('項目不存在')
  }
  
  // 獲取已購客戶詳情，包含銷售人員信息
  const customer = await prisma.purchasedCustomer.findFirst({
    where: {
      id: customerId,
      projectId: projectId
    },
    include: {
      salesPersonnel: true
    }
  })
  
  if (!customer) {
    throw createNotFoundError('已購客戶不存在')
  }
  
  // 轉換數據格式，與前端期望的格式匹配
  const formattedCustomer = {
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
    salesPersonId: customer.salesId,
    salesPerson: customer.salesPersonnel?.name || '',
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt
  }
  
  return createSuccessResponse(formattedCustomer)
}, ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_PERSON', 'CUSTOMER_SERVICE'])

// PUT - 更新單個已購客戶記錄
export const PUT = createProtectedApiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string; customerId: string } }
) => {
  const projectId = parseInt(params.id)
  const customerId = parseInt(params.customerId)
  const body = await request.json()
  
  const {
    customerName,
    houseNo,
    purchaseDate,
    idCard,
    isCorporate,
    email,
    phone,
    age,
    occupation,
    registeredAddress,
    mailingAddress,
    remark,
    rating,
    salesPersonId
  } = body
  
  // 驗證項目是否存在
  const projectExists = await prisma.project.findUnique({
    where: { id: projectId }
  })
  
  if (!projectExists) {
    throw createNotFoundError('項目不存在')
  }
  
  // 檢查客戶是否存在
  const existingCustomer = await prisma.purchasedCustomer.findFirst({
    where: {
      id: customerId,
      projectId: projectId
    }
  })
  
  if (!existingCustomer) {
    throw createNotFoundError('已購客戶不存在')
  }
  
  // 檢查房號是否與其他記錄衝突（如果提供且有變更）
  if (houseNo && houseNo !== existingCustomer.houseNo) {
    const houseExists = await prisma.purchasedCustomer.findFirst({
      where: {
        projectId,
        houseNo,
        id: { not: customerId }
      }
    })
    
    if (houseExists) {
      throw createValidationError('該房號已存在')
    }
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
  
  // 更新客戶記錄
  const updatedCustomer = await prisma.purchasedCustomer.update({
    where: { id: customerId },
    data: {
      name: customerName || existingCustomer.name,
      houseNo: houseNo || existingCustomer.houseNo,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : existingCustomer.purchaseDate,
      idCard: idCard !== undefined ? idCard : existingCustomer.idCard,
      isCorporate: isCorporate !== undefined ? isCorporate : existingCustomer.isCorporate,
      email: email !== undefined ? email : existingCustomer.email,
      phone: phone !== undefined ? phone : existingCustomer.phone,
      age: age !== undefined ? age : existingCustomer.age,
      occupation: occupation !== undefined ? occupation : existingCustomer.occupation,
      registeredAddress: registeredAddress !== undefined ? registeredAddress : existingCustomer.registeredAddress,
      mailingAddress: mailingAddress !== undefined ? mailingAddress : existingCustomer.mailingAddress,
      remark: remark !== undefined ? remark : existingCustomer.remark,
      rating: rating || existingCustomer.rating,
      salesId: salesPersonId !== undefined ? salesPersonId : existingCustomer.salesId
    }
  })
  
  // 返回更新後的記錄
  const responseData = {
    id: updatedCustomer.id,
    projectId: updatedCustomer.projectId,
    customerName: updatedCustomer.name,
    houseNo: updatedCustomer.houseNo,
    purchaseDate: updatedCustomer.purchaseDate,
    idCard: updatedCustomer.idCard,
    isCorporate: updatedCustomer.isCorporate,
    email: updatedCustomer.email,
    phone: updatedCustomer.phone,
    age: updatedCustomer.age,
    occupation: updatedCustomer.occupation,
    registeredAddress: updatedCustomer.registeredAddress,
    mailingAddress: updatedCustomer.mailingAddress,
    remark: updatedCustomer.remark,
    rating: updatedCustomer.rating,
    salesPersonId: updatedCustomer.salesId,
    salesPerson: '', // 暂时设为空字符串，等关联查询修复后再更新
    createdAt: updatedCustomer.createdAt,
    updatedAt: updatedCustomer.updatedAt
  }
  
  return createSuccessResponse(responseData)
}, ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'CUSTOMER_SERVICE'])

// DELETE - 刪除單個已購客戶記錄
export const DELETE = createProtectedApiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string; customerId: string } }
) => {
  const projectId = parseInt(params.id)
  const customerId = parseInt(params.customerId)
  
  // 驗證項目是否存在
  const projectExists = await prisma.project.findUnique({
    where: { id: projectId }
  })
  
  if (!projectExists) {
    throw createNotFoundError('項目不存在')
  }
  
  // 檢查客戶是否存在
  const existingCustomer = await prisma.purchasedCustomer.findFirst({
    where: {
      id: customerId,
      projectId: projectId
    }
  })
  
  if (!existingCustomer) {
    throw createNotFoundError('已購客戶不存在')
  }
  
  // 刪除客戶記錄
  await prisma.purchasedCustomer.delete({
    where: { id: customerId }
  })
  
  return createSuccessResponse({ message: '已購客戶記錄刪除成功' })
}, ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'])