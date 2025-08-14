import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - 獲取單個已購客戶詳情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; customerId: string } }
) {
  try {
    const projectId = parseInt(params.id)
    const customerId = parseInt(params.customerId)
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })
    
    if (!projectExists) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 獲取已購客戶詳情
    const customer = await prisma.purchasedCustomer.findFirst({
      where: {
        id: customerId,
        projectId: projectId
      }
    })
    
    if (!customer) {
      return NextResponse.json({ error: '已購客戶不存在' }, { status: 404 })
    }
    
    // 轉換數據格式
    const formattedCustomer = {
      id: customer.id,
      name: customer.name,
      house_no: customer.houseNo,
      purchase_date: customer.purchaseDate,
      id_card: customer.idCard,
      is_corporate: customer.isCorporate,
      email: customer.email,
      phone: customer.phone,
      age: customer.age,
      occupation: customer.occupation,
      registered_address: customer.registeredAddress,
      mailing_address: customer.mailingAddress,
      remark: customer.remark,
      rating: customer.rating,
      project_id: customer.projectId,
      created_at: customer.createdAt,
      updated_at: customer.updatedAt
    }
    
    return NextResponse.json(formattedCustomer)
    
  } catch (error) {
    console.error('獲取已購客戶詳情失敗:', error)
    return NextResponse.json({ error: '獲取已購客戶詳情失敗' }, { status: 500 })
  }
}

// PUT - 更新單個已購客戶記錄
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; customerId: string } }
) {
  try {
    const projectId = parseInt(params.id)
    const customerId = parseInt(params.customerId)
    const body = await request.json()
    
    const {
      name,
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
      rating
    } = body
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })
    
    if (!projectExists) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 檢查客戶是否存在
    const existingCustomer = await prisma.purchasedCustomer.findFirst({
      where: {
        id: customerId,
        projectId: projectId
      }
    })
    
    if (!existingCustomer) {
      return NextResponse.json({ error: '已購客戶不存在' }, { status: 404 })
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
        return NextResponse.json({ error: '該房號已存在' }, { status: 400 })
      }
    }
    
    // 更新客戶記錄
    const updatedCustomer = await prisma.purchasedCustomer.update({
      where: { id: customerId },
      data: {
        name: name || existingCustomer.name,
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
        rating: rating || existingCustomer.rating
      }
    })
    
    // 返回更新後的記錄
    return NextResponse.json({
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      house_no: updatedCustomer.houseNo,
      purchase_date: updatedCustomer.purchaseDate,
      id_card: updatedCustomer.idCard,
      is_corporate: updatedCustomer.isCorporate,
      email: updatedCustomer.email,
      phone: updatedCustomer.phone,
      age: updatedCustomer.age,
      occupation: updatedCustomer.occupation,
      registered_address: updatedCustomer.registeredAddress,
      mailing_address: updatedCustomer.mailingAddress,
      remark: updatedCustomer.remark,
      rating: updatedCustomer.rating,
      project_id: updatedCustomer.projectId,
      created_at: updatedCustomer.createdAt,
      updated_at: updatedCustomer.updatedAt
    })
    
  } catch (error) {
    console.error('更新已購客戶記錄失敗:', error)
    return NextResponse.json({ error: '更新已購客戶記錄失敗' }, { status: 500 })
  }
}

// DELETE - 刪除單個已購客戶記錄
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; customerId: string } }
) {
  try {
    const projectId = parseInt(params.id)
    const customerId = parseInt(params.customerId)
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })
    
    if (!projectExists) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 檢查客戶是否存在
    const existingCustomer = await prisma.purchasedCustomer.findFirst({
      where: {
        id: customerId,
        projectId: projectId
      }
    })
    
    if (!existingCustomer) {
      return NextResponse.json({ error: '已購客戶不存在' }, { status: 404 })
    }
    
    // 刪除客戶記錄
    await prisma.purchasedCustomer.delete({
      where: { id: customerId }
    })
    
    return NextResponse.json({
      message: '已購客戶記錄刪除成功'
    })
    
  } catch (error) {
    console.error('刪除已購客戶記錄失敗:', error)
    return NextResponse.json({ error: '刪除已購客戶記錄失敗' }, { status: 500 })
  }
}