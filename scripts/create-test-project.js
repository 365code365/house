const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestProject() {
  try {
    console.log('创建测试项目...');
    
    const project = await prisma.project.upsert({
      where: { name: '测试项目' },
      update: {},
      create: {
        name: '测试项目',
        mainImage: null
      }
    });
    
    console.log('✓ 测试项目创建成功:', project);
    
  } catch (error) {
    console.error('创建项目失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestProject();