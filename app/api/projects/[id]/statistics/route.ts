import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { createProtectedApiHandler } from '@/lib/auth-utils'

// 獲取建案統計數據
export const GET = createProtectedApiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const projectId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type') || 'all'
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { message: '無效的建案ID' },
        { status: 400 }
      )
    }

    // 檢查建案是否存在
    const project = await executeQuery(
      'SELECT id FROM project WHERE id = ?',
      [projectId]
    ) as any[]

    if (project.length === 0) {
      return NextResponse.json(
        { message: '建案不存在' },
        { status: 404 }
      )
    }

    // 構建日期篩選條件
    let dateFilter = ''
    let dateParams: any[] = []
    if (startDate && endDate) {
      dateFilter = ' AND DATE(created_at) BETWEEN ? AND ?'
      dateParams = [startDate, endDate]
    } else if (startDate) {
      dateFilter = ' AND DATE(created_at) >= ?'
      dateParams = [startDate]
    } else if (endDate) {
      dateFilter = ' AND DATE(created_at) <= ?'
      dateParams = [endDate]
    }

    const statistics: any = {}

    // 銷售概況
    const salesOverview = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN sales_status = '售出' THEN 1 ELSE 0 END) as sold,
        SUM(CASE WHEN sales_status = '訂金' THEN 1 ELSE 0 END) as reserved,
        SUM(CASE WHEN sales_status = '未售出' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN sales_status = '不銷售' THEN 1 ELSE 0 END) as notForSale
      FROM sales_control 
      WHERE project_id = ?${dateFilter}
    `, [projectId, ...dateParams]) as any[]

    statistics.salesOverview = salesOverview[0] || {
      total: 0, sold: 0, reserved: 0, available: 0, notForSale: 0
    }

    // 銷售人員業績
    const salesPersonnel = await executeQuery(`
      SELECT 
        sp.name,
        COUNT(sc.id) as salesCount,
        COALESCE(SUM(sc.total_with_parking), 0) as salesAmount
      FROM sales_personnel sp
      LEFT JOIN sales_control sc ON sp.id = sc.sales_person_id AND sc.project_id = ?${dateFilter}
      WHERE sp.id IN (
        SELECT DISTINCT sales_person_id 
        FROM sales_control 
        WHERE project_id = ? AND sales_person_id IS NOT NULL
      )
      GROUP BY sp.id, sp.name
      ORDER BY salesCount DESC
    `, [projectId, ...dateParams, projectId]) as any[]

    statistics.salesPersonnel = salesPersonnel

    // 年齡分布（來自訪客問卷）
    const ageDistribution = await executeQuery(`
      SELECT 
        CASE 
          WHEN age < 25 THEN '25歲以下'
          WHEN age BETWEEN 25 AND 34 THEN '25-34歲'
          WHEN age BETWEEN 35 AND 44 THEN '35-44歲'
          WHEN age BETWEEN 45 AND 54 THEN '45-54歲'
          WHEN age >= 55 THEN '55歲以上'
          ELSE '未知'
        END as ageGroup,
        COUNT(*) as count
      FROM visitor_questionnaire 
      WHERE project_id = ?${dateFilter}
      GROUP BY ageGroup
      ORDER BY count DESC
    `, [projectId, ...dateParams]) as any[]

    statistics.ageDistribution = ageDistribution

    // 性別分布（來自訪客問卷）
    const genderDistribution = await executeQuery(`
      SELECT 
        gender,
        COUNT(*) as count
      FROM visitor_questionnaire 
      WHERE project_id = ? AND gender IS NOT NULL${dateFilter}
      GROUP BY gender
    `, [projectId, ...dateParams]) as any[]

    statistics.genderDistribution = genderDistribution

    // 購買趨勢（按月統計）
    const purchaseTimeline = await executeQuery(`
      SELECT 
        DATE_FORMAT(contract_date, '%Y-%m') as date,
        COUNT(*) as count
      FROM sales_control 
      WHERE project_id = ? AND sales_status = '售出' AND contract_date IS NOT NULL${dateFilter.replace('created_at', 'contract_date')}
      GROUP BY DATE_FORMAT(contract_date, '%Y-%m')
      ORDER BY date
    `, [projectId, ...dateParams]) as any[]

    statistics.purchaseTimeline = purchaseTimeline

    // 預算分布（來自訪客問卷）
    const budgetDistribution = await executeQuery(`
      SELECT 
        budget_range,
        COUNT(*) as count
      FROM visitor_questionnaire 
      WHERE project_id = ? AND budget_range IS NOT NULL${dateFilter}
      GROUP BY budget_range
      ORDER BY count DESC
    `, [projectId, ...dateParams]) as any[]

    statistics.budgetDistribution = budgetDistribution

    // 退戶原因分析
    const withdrawalReasons = await executeQuery(`
      SELECT 
        withdrawal_reason as reason,
        COUNT(*) as count
      FROM withdrawal_record 
      WHERE project_id = ? AND withdrawal_reason IS NOT NULL${dateFilter}
      GROUP BY withdrawal_reason
      ORDER BY count DESC
    `, [projectId, ...dateParams]) as any[]

    statistics.withdrawalReasons = withdrawalReasons

    return NextResponse.json(statistics)
  } catch (error) {
    console.error('獲取統計數據失敗:', error)
    return NextResponse.json({ error: '獲取統計數據失敗' }, { status: 500 })
  }
});