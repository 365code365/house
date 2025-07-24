import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

// 獲取單個建案
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { message: '無效的建案ID' },
        { status: 400 }
      )
    }

    const projects = await executeQuery(
      'SELECT * FROM project WHERE id = ?',
      [projectId]
    ) as any[]

    if (projects.length === 0) {
      return NextResponse.json(
        { message: '建案不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(projects[0])
  } catch (error) {
    console.error('獲取建案資訊失敗:', error)
    return NextResponse.json(
      { message: '獲取建案資訊失敗' },
      { status: 500 }
    )
  }
}

// 更新建案
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { message: '無效的建案ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: '建案名稱不能為空' },
        { status: 400 }
      )
    }

    // 檢查建案是否存在
    const existingProject = await executeQuery(
      'SELECT id FROM project WHERE id = ?',
      [projectId]
    ) as any[]

    if (existingProject.length === 0) {
      return NextResponse.json(
        { message: '建案不存在' },
        { status: 404 }
      )
    }

    // 檢查名稱是否與其他建案重複
    const duplicateProject = await executeQuery(
      'SELECT id FROM project WHERE name = ? AND id != ?',
      [name.trim(), projectId]
    ) as any[]

    if (duplicateProject.length > 0) {
      return NextResponse.json(
        { message: '建案名稱已存在' },
        { status: 400 }
      )
    }

    // 更新建案
    await executeQuery(
      'UPDATE project SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name.trim(), projectId]
    )

    // 獲取更新後的建案
    const updatedProject = await executeQuery(
      'SELECT * FROM project WHERE id = ?',
      [projectId]
    ) as any[]

    return NextResponse.json(updatedProject[0])
  } catch (error) {
    console.error('更新建案失敗:', error)
    return NextResponse.json(
      { message: '更新建案失敗' },
      { status: 500 }
    )
  }
}

// 刪除建案
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { message: '無效的建案ID' },
        { status: 400 }
      )
    }

    // 檢查建案是否存在
    const existingProject = await executeQuery(
      'SELECT id FROM project WHERE id = ?',
      [projectId]
    ) as any[]

    if (existingProject.length === 0) {
      return NextResponse.json(
        { message: '建案不存在' },
        { status: 404 }
      )
    }

    // 刪除建案（注意：這會級聯刪除相關數據）
    await executeQuery(
      'DELETE FROM project WHERE id = ?',
      [projectId]
    )

    return NextResponse.json(
      { message: '建案已刪除' },
      { status: 200 }
    )
  } catch (error) {
    console.error('刪除建案失敗:', error)
    return NextResponse.json(
      { message: '刪除建案失敗' },
      { status: 500 }
    )
  }
}