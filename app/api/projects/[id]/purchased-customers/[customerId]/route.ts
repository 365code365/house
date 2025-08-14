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
      contract_no: customer.contractNo,
      purchase_date: customer.purchaseDate,
      total_price: customer.totalPrice,
      payment_status: customer.paymentStatus,
      loan_status: customer.loanStatus,
      remark: customer.remark,
      mailing_address: customer.mailingAddress,
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
      contractNo,
      purchaseDate,
      totalPrice,
      paymentStatus,
      loanStatus,
      remark,
      mailingAddress,
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
    
    // 檢查合約號是否與其他記錄衝突（如果提供且有變更）
    if (contractNo && contractNo !== existingCustomer.contractNo) {
      const contractExists = await prisma.purchasedCustomer.findFirst({
        where: {
          projectId,
          contractNo,
          id: { not: customerId }
        }
      })
      
      if (contractExists) {
        return NextResponse.json({ error: '該合約號已存在' }, { status: 400 })
      }
    }
    
    // 更新客戶記錄
    const updatedCustomer = await prisma.purchasedCustomer.update({
      where: { id: customerId },
      data: {
        name: name || existingCustomer.name,
        houseNo: houseNo || existingCustomer.houseNo,
        contractNo: contractNo !== undefined ? contractNo : existingCustomer.contractNo,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : existingCustomer.purchaseDate,
        totalPrice: totalPrice !== undefined ? (totalPrice ? parseFloat(totalPrice) : null) : existingCustomer.totalPrice,
        paymentStatus: paymentStatus || existingCustomer.paymentStatus,
        loanStatus: loanStatus || existingCustomer.loanStatus,
        remark: remark !== undefined ? remark : existingCustomer.remark,
        mailingAddress: mailingAddress !== undefined ? mailingAddress : existingCustomer.mailingAddress,
        rating: rating || existingCustomer.rating
      }
    })
    
    // 返回更新後的記錄
    return NextResponse.json({
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      house_no: updatedCustomer.houseNo,
      contract_no: updatedCustomer.contractNo,
      purchase_date: updatedCustomer.purchaseDate,
      total_price: updatedCustomer.totalPrice,
      payment_status: updatedCustomer.paymentStatus,
      loan_status: updatedCustomer.loanStatus,
      remark: updatedCustomer.remark,
      mailing_address: updatedCustomer.mailingAddress,
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