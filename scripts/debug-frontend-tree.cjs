const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 模擬前端的 buildMenuTree 函數
function buildMenuTree(menus) {
  const menuMap = new Map();
  const roots = [];
  
  // 初始化所有菜單
  menus.forEach(menu => {
    menuMap.set(menu.id, { ...menu, children: [] });
  });
  
  // 構建樹結構
  menus.forEach(menu => {
    const menuNode = menuMap.get(menu.id);
    if (menu.parentId && menuMap.has(menu.parentId)) {
      menuMap.get(menu.parentId).children.push(menuNode);
    } else {
      roots.push(menuNode);
    }
  });
  
  return roots;
}

async function debugFrontendTree() {
  try {
    console.log('🔍 調試前端菜單樹構建邏輯...\n');

    // 獲取菜單數據
    const menus = await prisma.menu.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        parent: true,
        children: true,
        rolePermissions: {
          include: {
            role: true
          }
        }
      }
    });

    console.log(`📊 原始數據: ${menus.length} 個菜單`);
    
    // 檢查財務系統的原始數據
    const financialSystem = menus.find(m => m.name === 'financial');
    if (financialSystem) {
      console.log('\n💰 財務系統原始數據:');
      console.log(`  ID: ${financialSystem.id}`);
      console.log(`  名稱: ${financialSystem.name}`);
      console.log(`  父菜單ID: ${financialSystem.parentId}`);
      console.log(`  子菜單數量: ${financialSystem.children?.length || 0}`);
      
      if (financialSystem.children && financialSystem.children.length > 0) {
        console.log('  子菜單:');
        financialSystem.children.forEach(child => {
          console.log(`    - ${child.displayName} (${child.name}) - 父菜單ID: ${child.parentId}`);
        });
      }
    }

    // 構建菜單樹
    console.log('\n🌳 構建菜單樹...');
    const menuTree = buildMenuTree(menus);
    
    console.log(`📁 根菜單數量: ${menuTree.length}`);
    
    // 檢查財務系統在樹中的位置
    const financialInTree = menuTree.find(m => m.name === 'financial');
    if (financialInTree) {
      console.log('\n💰 財務系統在樹中的位置:');
      console.log(`  名稱: ${financialInTree.displayName}`);
      console.log(`  子菜單數量: ${financialInTree.children?.length || 0}`);
      
      if (financialInTree.children && financialInTree.children.length > 0) {
        console.log('  子菜單:');
        financialInTree.children.forEach(child => {
          console.log(`    - ${child.displayName} (${child.name})`);
        });
      } else {
        console.log('  ❌ 沒有子菜單！');
      }
    }

    // 檢查所有根菜單的子菜單
    console.log('\n🔍 所有根菜單的子菜單:');
    menuTree.forEach(rootMenu => {
      if (rootMenu.children && rootMenu.children.length > 0) {
        console.log(`✅ ${rootMenu.displayName} (${rootMenu.name}) - 子菜單數: ${rootMenu.children.length}`);
        rootMenu.children.forEach(child => {
          console.log(`   └─ ${child.displayName} (${child.name})`);
        });
      } else {
        console.log(`📄 ${rootMenu.displayName} (${rootMenu.name}) - 無子菜單`);
      }
    });

    // 檢查數據類型問題
    console.log('\n🔍 檢查數據類型:');
    menus.forEach(menu => {
      if (menu.parentId !== null && typeof menu.parentId !== 'number') {
        console.log(`⚠️  菜單 ${menu.name} 的 parentId 類型異常: ${typeof menu.parentId} = ${menu.parentId}`);
      }
    });

  } catch (error) {
    console.error('❌ 調試失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 運行調試
if (require.main === module) {
  debugFrontendTree();
}

module.exports = { debugFrontendTree, buildMenuTree };


