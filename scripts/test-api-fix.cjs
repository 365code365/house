const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAPIFix() {
  try {
    console.log('🔍 測試API修復後的結果...\n');

    // 模擬API查詢邏輯
    const menus = await prisma.menu.findMany({
      orderBy: [
        { parentId: 'asc' },
        { sortOrder: 'asc' }
      ],
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

    // 檢查財務系統
    const financialSystem = menus.find(m => m.name === 'financial');
    if (financialSystem) {
      console.log('\n💰 財務系統菜單:');
      console.log(`  ID: ${financialSystem.id}`);
      console.log(`  名稱: ${financialSystem.name}`);
      console.log(`  顯示名稱: ${financialSystem.displayName}`);
      console.log(`  子菜單數量: ${financialSystem.children?.length || 0}`);
      
      if (financialSystem.children && financialSystem.children.length > 0) {
        console.log('  ✅ 子菜單:');
        financialSystem.children.forEach(child => {
          console.log(`    - ${child.displayName} (${child.name})`);
        });
      } else {
        console.log('  ❌ 沒有子菜單！');
      }
    }

    // 檢查銷控總表
    const salesControlGroup = menus.find(m => m.name === 'sales-control-group');
    if (salesControlGroup) {
      console.log('\n🏢 銷控總表菜單:');
      console.log(`  ID: ${salesControlGroup.id}`);
      console.log(`  子菜單數量: ${salesControlGroup.children?.length || 0}`);
      
      if (salesControlGroup.children && salesControlGroup.children.length > 0) {
        console.log('  ✅ 子菜單:');
        salesControlGroup.children.forEach(child => {
          console.log(`    - ${child.displayName} (${child.name})`);
        });
      }
    }

    // 檢查所有有子菜單的根菜單
    console.log('\n📁 所有有子菜單的根菜單:');
    const rootMenusWithChildren = menus.filter(m => !m.parentId && m.children && m.children.length > 0);
    
    rootMenusWithChildren.forEach(menu => {
      console.log(`  ✅ ${menu.displayName} (${menu.name}) - ${menu.children.length} 個子菜單`);
      menu.children.forEach(child => {
        console.log(`    └─ ${child.displayName} (${child.name})`);
      });
    });

    console.log('\n🎉 API修復測試完成！');
    console.log(`✅ 找到 ${rootMenusWithChildren.length} 個有子菜單的根菜單`);

  } catch (error) {
    console.error('❌ 測試失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 運行測試
if (require.main === module) {
  testAPIFix();
}

module.exports = { testAPIFix };
