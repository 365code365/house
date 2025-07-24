import { NextResponse } from 'next/server'
import { initDatabase } from '@/lib/db'

export async function POST() {
  try {
    await initDatabase()
    return NextResponse.json({ message: '數據庫初始化成功' })
  } catch (error) {
    console.error('數據庫初始化失敗:', error)
    return NextResponse.json(
      { error: '數據庫初始化失敗' },
      { status: 500 }
    )
  }
}