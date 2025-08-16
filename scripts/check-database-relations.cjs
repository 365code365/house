const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseRelations() {
  try {
    console.log('🔍 檢查數據庫中的菜單關聯關係...\n');

    // 檢查所有菜單的 parentId
    const allMenus = await prisma.menu.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    console.log('📊 所有菜單的 parentId:');
    allMenus.forEach(menu => {
      const indent = menu.parentId ? '  └─ ' : '';
      console.log(`${indent}${menu.displayName} (${menu.name}) - ID: ${menu.id}, parentId: ${menu.parentId}`);
    });

    console.log('\n🔗 檢查財務系統的子菜單:');
    const financialSystem = allMenus.find(m => m.name === 'financial');
    if (financialSystem) {
      console.log(`財務系統 ID: ${financialSystem.id}`);
      
      // 查找所有 parentId 為財務系統 ID 的菜單
      const financialChildren = allMenus.filter(m => m.parentId === financialSystem.id);
      console.log(`財務系統的子菜單數量: ${financialChildren.length}`);
      
      financialChildren.forEach(child => {
        console.log(`  - ${child.displayName} (${child.name}) - ID: ${child.id}, parentId: ${child.parentId}`);
      });
    }

    console.log('\n🔗 檢查銷控總表的子菜單:');
    const salesControlGroup = allMenus.find(m => m.name === 'sales-control-group');
    if (salesControlGroup) {
      console.log(`銷控總表 ID: ${salesControlGroup.id}`);
      
      const salesControlChildren = allMenus.filter(m => m.parentId === salesControlGroup.id);
      console.log(`銷控總表的子菜單數量: ${salesControlChildren.length}`);
      
      salesControlChildren.forEach(child => {
        console.log(`  - ${child.displayName} (${child.name}) - ID: ${child.id}, parentId: ${child.parentId}`);
      });
    }

    // 檢查是否有孤立的子菜單
    console.log('\n⚠️  檢查孤立的子菜單:');
    const orphanMenus = allMenus.filter(m => m.parentId && !allMenus.find(p => p.id === m.parentId));
    if (orphanMenus.length > 0) {
      console.log(`發現 ${orphanMenus.length} 個孤立的子菜單:`);
      orphanMenus.forEach(menu => {
        console.log(`  - ${menu.displayName} (${menu.name}) - parentId: ${menu.parentId} (父菜單不存在)`);
      });
    } else {
      console.log('✅ 沒有孤立的子菜單');
    }

  } catch (error) {
    console.error('❌ 檢查失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 運行檢查
if (require.main === module) {
  checkDatabaseRelations();
}

module.exports = { checkDatabaseRelations };


