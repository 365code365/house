import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

// 測試角色API - 直接處理認證
export async function GET(request: NextRequest) {
  try {
    // 獲取session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }
    
    // 檢查用戶角色
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: '權限不足' },
        { status: 403 }
      );
    }
    
    // 獲取角色列表
    const roles = await prisma.role.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      data: roles,
      message: 'Test roles API working'
    });
  } catch (error) {
    console.error('Test roles API error:', error);
    return NextResponse.json(
      { error: '服務器內部錯誤' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 獲取session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }
    
    // 檢查用戶角色
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: '權限不足' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Test POST roles API working',
      receivedData: body,
      user: session.user.email
    });
  } catch (error) {
    console.error('Test POST roles API error:', error);
    return NextResponse.json(
      { error: '服務器內部錯誤' },
      { status: 500 }
    );
  }
}