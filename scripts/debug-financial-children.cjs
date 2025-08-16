const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFinancialChildren() {
  try {
    console.log('🔍 調試財務系統子菜單問題...\n');

    // 1. 檢查財務系統菜單
    const financialSystem = await prisma.menu.findFirst({
      where: { name: 'financial' },
      include: {
        children: true,
        parent: true
      }
    });

    if (financialSystem) {
      console.log('💰 財務系統菜單:');
      console.log(`  ID: ${financialSystem.id}`);
      console.log(`  名稱: ${financialSystem.name}`);
      console.log(`  顯示名稱: ${financialSystem.displayName}`);
      console.log(`  父菜單ID: ${financialSystem.parentId}`);
      console.log(`  子菜單數量: ${financialSystem.children?.length || 0}`);
      
      if (financialSystem.children && financialSystem.children.length > 0) {
        console.log('  子菜單:');
        financialSystem.children.forEach(child => {
          console.log(`    - ${child.displayName} (${child.name}) - ID: ${child.id}`);
        });
      } else {
        console.log('  ❌ 沒有子菜單！');
      }
    } else {
      console.log('❌ 找不到財務系統菜單');
      return;
    }

    // 2. 檢查所有 parentId 為財務系統 ID 的菜單
    console.log('\n🔍 檢查所有 parentId 為財務系統 ID 的菜單:');
    const financialChildren = await prisma.menu.findMany({
      where: { parentId: financialSystem.id },
      orderBy: { sortOrder: 'asc' }
    });

    console.log(`找到 ${financialChildren.length} 個子菜單:`);
    financialChildren.forEach(child => {
      console.log(`  - ${child.displayName} (${child.name}) - ID: ${child.id}, parentId: ${child.parentId}`);
    });

    // 3. 檢查銷控總表作為對比
    console.log('\n🔍 檢查銷控總表作為對比:');
    const salesControlGroup = await prisma.menu.findFirst({
      where: { name: 'sales-control-group' },
      include: {
        children: true
      }
    });

    if (salesControlGroup) {
      console.log(`銷控總表 ID: ${salesControlGroup.id}, 子菜單數量: ${salesControlGroup.children?.length || 0}`);
      
      if (salesControlGroup.children && salesControlGroup.children.length > 0) {
        console.log('  子菜單:');
        salesControlGroup.children.forEach(child => {
          console.log(`    - ${child.displayName} (${child.name}) - ID: ${child.id}`);
        });
      }
    }

    // 4. 檢查數據庫中的關聯是否正確
    console.log('\n🔗 檢查數據庫關聯:');
    const allMenus = await prisma.menu.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    console.log('所有菜單的 parentId 映射:');
    allMenus.forEach(menu => {
      if (menu.parentId) {
        const parent = allMenus.find(m => m.id === menu.parentId);
        console.log(`  ${menu.displayName} (${menu.name}) -> ${parent?.displayName || '未知'} (${menu.parentId})`);
      }
    });

    // 5. 嘗試手動修復關聯
    console.log('\n🔧 嘗試手動修復關聯...');
    
    // 檢查財務系統的子菜單是否正確設置了 parentId
    const expectedChildren = ['financial-overview', 'budget', 'expenses', 'commission'];
    
    for (const childName of expectedChildren) {
      const child = await prisma.menu.findFirst({
        where: { name: childName }
      });
      
      if (child) {
        console.log(`檢查 ${child.displayName} (${child.name}):`);
        console.log(`  當前 parentId: ${child.parentId}`);
        console.log(`  應該的 parentId: ${financialSystem.id}`);
        
        if (child.parentId !== financialSystem.id) {
          console.log(`  ⚠️  parentId 不匹配，需要修復`);
        } else {
          console.log(`  ✅ parentId 正確`);
        }
      }
    }

  } catch (error) {
    console.error('❌ 調試失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 運行調試
if (require.main === module) {
  debugFinancialChildren();
}

module.exports = { debugFinancialChildren };
