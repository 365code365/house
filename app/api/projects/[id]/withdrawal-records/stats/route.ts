import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withErrorHandler, createSuccessResponse, createNotFoundError } from '@/lib/error-handler'
import { createProtectedApiHandler } from '@/lib/auth-utils'
import { UserRole } from '@prisma/client'
import type { WithdrawalStats } from '@/types/withdrawal'

// GET - 獲取退戶記錄統計數據
export const GET = createProtectedApiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const projectId = params.id
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  // 驗證項目是否存在
  const projectExists = await prisma.project.findUnique({
    where: { id: parseInt(projectId) }
  })
  
  if (!projectExists) {
    throw createNotFoundError('項目不存在')
  }

  // 構建日期篩選條件
  const dateFilter: any = {}
  if (startDate || endDate) {
    dateFilter.withdrawalDate = {}
    if (startDate) {
      dateFilter.withdrawalDate.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.withdrawalDate.lte = new Date(endDate)
    }
  }

  // 基本統計查詢條件
  const baseWhere = {
    projectId: parseInt(projectId),
    ...dateFilter
  }

  // 獲取總記錄數
  const totalRecords = await prisma.withdrawalRecord.count({
    where: baseWhere
  })

  // 獲取總退款金額（使用totalPrice作為退款金額）
  const refundAmountResult = await prisma.withdrawalRecord.aggregate({
    where: baseWhere,
    _sum: {
      totalPrice: true
    }
  })

  const totalRefundAmount = Number(refundAmountResult._sum.totalPrice || 0)

  // 獲取各狀態統計
  const statusStats = await prisma.withdrawalRecord.groupBy({
    by: ['status'],
    where: baseWhere,
    _count: {
      status: true
    }
  })

  // 轉換狀態統計格式
  const statusCounts = {
    APPLIED: 0,
    PROCESSING: 0,
    COMPLETED: 0,
    CANCELLED: 0
  }

  statusStats.forEach(stat => {
    statusCounts[stat.status as keyof typeof statusCounts] = stat._count.status
  })

  // 獲取月度統計（最近12個月）- 使用Prisma ORM方法
  const monthlyStatsRaw = await prisma.withdrawalRecord.findMany({
    where: {
      projectId: parseInt(projectId),
      withdrawalDate: {
        gte: startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 12)),
        lte: endDate ? new Date(endDate) : new Date()
      }
    },
    select: {
      withdrawalDate: true,
      totalPrice: true
    },
    orderBy: {
      withdrawalDate: 'desc'
    }
  })

  // 手動聚合月度數據
  const monthlyStatsMap = new Map<string, { count: number; refundAmount: number }>()
  
  monthlyStatsRaw.forEach(record => {
    const month = record.withdrawalDate.toISOString().substring(0, 7) // YYYY-MM格式
    const existing = monthlyStatsMap.get(month) || { count: 0, refundAmount: 0 }
    monthlyStatsMap.set(month, {
      count: existing.count + 1,
      refundAmount: existing.refundAmount + Number(record.totalPrice || 0)
    })
  })

  // 轉換為數組並排序
  const monthlyStats = Array.from(monthlyStatsMap.entries())
    .map(([month, stats]) => ({ month, ...stats }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 12)

  // 月度統計數據已經格式化完成

  // 獲取退戶原因統計
  const reasonStats = await prisma.withdrawalRecord.groupBy({
    by: ['reason'],
    where: baseWhere,
    _count: {
      reason: true
    },
    orderBy: {
      _count: {
        reason: 'desc'
      }
    }
  })

  // 獲取樓棟統計
  const buildingStats = await prisma.withdrawalRecord.groupBy({
    by: ['building'],
    where: baseWhere,
    _count: {
      building: true
    },
    _sum: {
      totalPrice: true
    },
    orderBy: {
      _count: {
        building: 'desc'
      }
    }
  })

  const stats: WithdrawalStats & {
    reasonStats: { reason: string; count: number }[]
    buildingStats: { building: string; count: number; refundAmount: number }[]
  } = {
    totalRecords: Number(totalRecords),
    totalRefundAmount,
    statusCounts,
    monthlyStats: monthlyStats,
    reasonStats: reasonStats
      .filter(stat => stat.reason !== null)
      .map(stat => ({
        reason: stat.reason!,
        count: stat._count.reason
      })),
    buildingStats: buildingStats.map(stat => ({
      building: stat.building,
      count: stat._count.building,
      refundAmount: Number(stat._sum.totalPrice || 0)
    }))
  }

  return createSuccessResponse(stats)
}, [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON, UserRole.FINANCE])