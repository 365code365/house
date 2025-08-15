import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withErrorHandler, createSuccessResponse, createValidationError, createNotFoundError } from '@/lib/error-handler'
import { createProtectedApiHandler } from '@/lib/auth-utils'
import { UserRole } from '@prisma/client'
import type { UpdateWithdrawalRequest } from '@/types/withdrawal'

// GET - 獲取單個退戶記錄
export const GET = createProtectedApiHandler(async (request: NextRequest, { params }: { params: { id: string, recordId: string } }) => {
  const { id: projectId, recordId } = params

  // 驗證項目是否存在
  const projectExists = await prisma.project.findUnique({
    where: { id: parseInt(projectId) }
  })
  
  if (!projectExists) {
    throw createNotFoundError('項目不存在')
  }

  // 獲取退戶記錄
  const withdrawalRecord = await prisma.withdrawalRecord.findFirst({
    where: {
      id: parseInt(recordId),
      projectId: parseInt(projectId)
    }
  })

  if (!withdrawalRecord) {
    throw createNotFoundError('退戶記錄不存在')
  }

  return createSuccessResponse(withdrawalRecord)
}, [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON, UserRole.FINANCE])

// PUT - 更新退戶記錄
export const PUT = createProtectedApiHandler(async (request: NextRequest, { params }: { params: { id: string, recordId: string } }) => {
  const { id: projectId, recordId } = params
  const body: UpdateWithdrawalRequest = await request.json()
  
  const {
    customerName,
    building,
    floor,
    unit,
    houseType,
    originalPrice,
    paidAmount,
    refundAmount,
    reason,
    withdrawalDate,
    status,
    remark
  } = body

  // 驗證項目是否存在
  const projectExists = await prisma.project.findUnique({
    where: { id: parseInt(projectId) }
  })
  
  if (!projectExists) {
    throw createNotFoundError('項目不存在')
  }

  // 檢查退戶記錄是否存在
  const existingRecord = await prisma.withdrawalRecord.findFirst({
    where: {
      id: parseInt(recordId),
      projectId: parseInt(projectId)
    }
  })

  if (!existingRecord) {
    throw createNotFoundError('退戶記錄不存在')
  }

  // 如果更新房號信息，檢查是否與其他記錄衝突
  if (building && floor && unit && 
      (building !== existingRecord.building || 
       parseInt(floor) !== existingRecord.floor || 
       unit !== existingRecord.unit)) {
    const conflictRecord = await prisma.withdrawalRecord.findFirst({
      where: {
        projectId: parseInt(projectId),
        building,
        floor: parseInt(floor),
        unit,
        id: { not: parseInt(recordId) },
        status: {
          in: ['APPLIED', 'PROCESSING']
        }
      }
    })

    if (conflictRecord) {
      throw createValidationError('該房號已有進行中的退戶記錄')
    }
  }

  // 準備更新數據
  const updateData: any = {}
  
  if (customerName !== undefined) updateData.customerName = customerName
  if (building !== undefined) updateData.building = building
  if (floor !== undefined) updateData.floor = floor
  if (unit !== undefined) updateData.unit = unit
  if (houseType !== undefined) updateData.houseType = houseType
  if (originalPrice !== undefined) updateData.originalPrice = originalPrice
  if (paidAmount !== undefined) updateData.paidAmount = paidAmount
  if (refundAmount !== undefined) updateData.refundAmount = refundAmount
  if (reason !== undefined) updateData.reason = reason
  if (withdrawalDate !== undefined) updateData.withdrawalDate = new Date(withdrawalDate)
  if (status !== undefined) updateData.status = status
  if (remark !== undefined) updateData.remark = remark

  // 更新退戶記錄
  const updatedRecord = await prisma.withdrawalRecord.update({
    where: { id: parseInt(recordId) },
    data: updateData
  })

  return createSuccessResponse(updatedRecord)
}, [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON])

// DELETE - 刪除退戶記錄
export const DELETE = createProtectedApiHandler(async (request: NextRequest, { params }: { params: { id: string, recordId: string } }) => {
  const { id: projectId, recordId } = params

  // 驗證項目是否存在
  const projectExists = await prisma.project.findUnique({
    where: { id: parseInt(projectId) }
  })
  
  if (!projectExists) {
    throw createNotFoundError('項目不存在')
  }

  // 檢查退戶記錄是否存在
  const existingRecord = await prisma.withdrawalRecord.findFirst({
    where: {
      id: parseInt(recordId),
      projectId: parseInt(projectId)
    }
  })

  if (!existingRecord) {
    throw createNotFoundError('退戶記錄不存在')
  }

  // 檢查是否可以刪除（只有已取消或已完成的記錄可以刪除）
  if (existingRecord.status === 'PROCESSING') {
    throw createValidationError('處理中的退戶記錄無法刪除')
  }

  // 刪除退戶記錄
  await prisma.withdrawalRecord.delete({
    where: { id: parseInt(recordId) }
  })

  return createSuccessResponse({ message: '退戶記錄已刪除' })
}, [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER])