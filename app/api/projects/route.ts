import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// 獲取所有建案
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(projects)
  } catch (error) {
    console.error('獲取建案列表失敗:', error)
    return NextResponse.json(
      { message: '獲取建案列表失敗' },
      { status: 500 }
    )
  }
}

// 創建新建案
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const imageFile = formData.get('image') as File | null

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: '建案名稱不能為空' },
        { status: 400 }
      )
    }

    // 檢查建案名稱是否已存在
    const existingProject = await prisma.project.findFirst({
      where: {
        name: name.trim()
      }
    })

    if (existingProject) {
      return NextResponse.json(
        { message: '建案名稱已存在' },
        { status: 400 }
      )
    }

    let imagePath = null

    // 處理圖片上傳
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // 創建上傳目錄
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'projects')
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      // 生成唯一文件名
      const timestamp = Date.now()
      const extension = imageFile.name.split('.').pop()
      const filename = `${timestamp}.${extension}`
      const filepath = join(uploadDir, filename)

      await writeFile(filepath, buffer)
      imagePath = `/uploads/projects/${filename}`
    }

    // 插入新建案
    const newProject = await prisma.project.create({
      data: {
        name: name.trim(),
        mainImage: imagePath
      }
    })

    return NextResponse.json(newProject, { status: 201 })
  } catch (error) {
    console.error('建立建案失敗:', error)
    return NextResponse.json(
      { message: '建立建案失敗' },
      { status: 500 }
    )
  }
}