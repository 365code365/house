import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { WithdrawalRecord } from '@/lib/db'
import { withErrorHandler, createSuccessResponse, createValidationError, createNotFoundError } from '@/lib/error-handler'
import { createProtectedApiHandler } from '@/lib/auth-utils'
import { UserRole } from '@prisma/client'
import type { WithdrawalQueryParams, CreateWithdrawalRequest } from '@/types/withdrawal'

// GET - 獲取退戶記錄列表
export const GET = createProtectedApiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const projectId = params.id
  const { searchParams } = new URL(request.url)
  
  // 解析查詢參數
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const building = searchParams.get('building') || ''
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''
  const sortBy = searchParams.get('sortBy') || 'withdrawalDate'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  // 驗證項目是否存在
  const projectExists = await prisma.project.findUnique({
    where: { id: parseInt(projectId) }
  })
  
  if (!projectExists) {
    throw createNotFoundError('項目不存在')
  }

  // 構建查詢條件
  const whereConditions: any = {
    projectId: parseInt(projectId)
  }

  // 搜索條件
  if (search) {
    whereConditions.OR = [
      { customerName: { contains: search } },
      { building: { contains: search } },
      { unit: { contains: search } },
      { reason: { contains: search } }
    ]
  }

  // 狀態篩選
  if (status) {
    whereConditions.status = status
  }

  // 樓棟篩選
  if (building) {
    whereConditions.building = building
  }

  // 日期範圍篩選
  if (startDate || endDate) {
    whereConditions.withdrawalDate = {}
    if (startDate) {
      whereConditions.withdrawalDate.gte = new Date(startDate)
    }
    if (endDate) {
      whereConditions.withdrawalDate.lte = new Date(endDate)
    }
  }

  // 計算總數
  const total = await prisma.withdrawalRecord.count({
    where: whereConditions
  })

  // 獲取分頁數據
  const withdrawalRecords = await prisma.withdrawalRecord.findMany({
    where: whereConditions,
    orderBy: {
      [sortBy]: sortOrder
    },
    skip: (page - 1) * pageSize,
    take: pageSize
  })

  const totalPages = Math.ceil(total / pageSize)

  return createSuccessResponse({
    data: withdrawalRecords,
    pagination: {
      total: Number(total),
      page,
      pageSize,
      totalPages
    }
  })
}, [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON, UserRole.FINANCE])

// POST - 創建新的退戶記錄
export const POST = createProtectedApiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const projectId = params.id
  const body: CreateWithdrawalRequest = await request.json()
  
  const {
    customerName,
    building,
    floor,
    unit,
    originalPrice,
    paidAmount,
    refundAmount,
    reason,
    withdrawalDate,
    status
  } = await request.json()

  // 驗證必填字段
  if (!customerName || !building || !floor || !unit || 
      originalPrice === undefined || paidAmount === undefined || 
      refundAmount === undefined || !reason || !withdrawalDate || !status) {
    throw createValidationError('請填寫所有必填字段')
  }

  // 驗證項目是否存在
  const projectExists = await prisma.project.findUnique({
    where: { id: parseInt(projectId) }
  })
  
  if (!projectExists) {
    throw createNotFoundError('項目不存在')
  }

  // 檢查是否已存在相同房號的退戶記錄
  const existingRecord = await prisma.withdrawalRecord.findFirst({
    where: {
      projectId: parseInt(projectId),
      building,
      floor: parseInt(floor),
      unit,
      status: {
        in: ['APPLIED', 'PROCESSING']
      }
    }
  })

  if (existingRecord) {
    throw createValidationError('該房號已有進行中的退戶記錄')
  }

  // 創建退戶記錄
  const withdrawalRecord = await prisma.withdrawalRecord.create({
    data: {
      projectId: parseInt(projectId),
      customerName,
      building,
      floor: parseInt(floor),
      unit,
      reason,
      withdrawalDate: new Date(withdrawalDate),
      status,
      housePrice: originalPrice,
      totalPrice: paidAmount
    }
  })

  return createSuccessResponse(withdrawalRecord)
}, [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON])