const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMenuAPI() {
  try {
    console.log('🔍 調試菜單API數據...\n');

    // 模擬API查詢
    const menus = await prisma.menu.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        children: {
          orderBy: { sortOrder: 'asc' },
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            }
          }
        },
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 總菜單數: ${menus.length}`);
    console.log(`📁 根菜單數: ${menus.filter(m => !m.parentId).length}`);
    console.log(`📄 子菜單數: ${menus.filter(m => m.parentId).length}\n`);

    // 檢查財務系統
    const financialSystem = menus.find(m => m.name === 'financial');
    if (financialSystem) {
      console.log('💰 財務系統詳情:');
      console.log(`  ID: ${financialSystem.id}`);
      console.log(`  名稱: ${financialSystem.name}`);
      console.log(`  顯示名稱: ${financialSystem.displayName}`);
      console.log(`  路徑: ${financialSystem.path}`);
      console.log(`  父菜單ID: ${financialSystem.parentId}`);
      console.log(`  子菜單數量: ${financialSystem.children?.length || 0}`);
      
      if (financialSystem.children && financialSystem.children.length > 0) {
        console.log('  子菜單列表:');
        financialSystem.children.forEach((child, index) => {
          console.log(`    ${index + 1}. ${child.displayName} (${child.name}) - ${child.path}`);
        });
      } else {
        console.log('  ❌ 沒有子菜單！');
      }
    } else {
      console.log('❌ 找不到財務系統菜單');
    }

    console.log('\n🔍 檢查所有菜單的父子關係:');
    menus.forEach(menu => {
      if (menu.children && menu.children.length > 0) {
        console.log(`✅ ${menu.displayName} (${menu.name}) - 子菜單數: ${menu.children.length}`);
        menu.children.forEach(child => {
          console.log(`   └─ ${child.displayName} (${child.name})`);
        });
      }
    });

    // 檢查數據庫中的關聯
    console.log('\n🔗 檢查數據庫關聯:');
    const financialChildren = await prisma.menu.findMany({
      where: { parentId: financialSystem?.id },
      orderBy: { sortOrder: 'asc' }
    });
    
    console.log(`財務系統的直接子菜單查詢結果: ${financialChildren.length} 個`);
    financialChildren.forEach(child => {
      console.log(`  - ${child.displayName} (${child.name}) - ID: ${child.id}`);
    });

  } catch (error) {
    console.error('❌ 調試失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 運行調試
if (require.main === module) {
  debugMenuAPI();
}

module.exports = { debugMenuAPI };


