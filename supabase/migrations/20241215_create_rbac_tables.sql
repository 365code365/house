-- RBAC權限管理系統數據庫遷移文件
-- 創建時間: 2024-12-15
-- 描述: 創建角色、菜單、權限相關表結構和初始數據

-- 1. 創建角色表
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 創建菜單表
CREATE TABLE IF NOT EXISTS menus (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    path VARCHAR(255) NOT NULL,
    icon VARCHAR(50),
    parent_id INTEGER REFERENCES menus(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 創建角色菜單權限表
CREATE TABLE IF NOT EXISTS role_menu_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    can_access BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, menu_id)
);

-- 4. 創建按鈕權限表
CREATE TABLE IF NOT EXISTS button_permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    identifier VARCHAR(100) NOT NULL,
    menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(menu_id, identifier)
);

-- 5. 創建角色按鈕權限表
CREATE TABLE IF NOT EXISTS role_button_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    button_id INTEGER NOT NULL REFERENCES button_permissions(id) ON DELETE CASCADE,
    can_operate BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, button_id)
);

-- 6. 創建權限審計日誌表
CREATE TABLE IF NOT EXISTS permission_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INTEGER NOT NULL,
    before_data TEXT,
    after_data TEXT,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 創建索引
CREATE INDEX IF NOT EXISTS idx_permission_audit_logs_user_id ON permission_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_logs_resource ON permission_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_logs_created_at ON permission_audit_logs(created_at);

-- 8. 插入初始角色數據
INSERT INTO roles (name, display_name, description) VALUES
('SUPER_ADMIN', '超級管理員', '系統最高權限管理員，可以管理所有功能和用戶'),
('ADMIN', '管理員', '項目管理員，可以管理項目內的所有功能'),
('SALES_MANAGER', '銷售經理', '銷售團隊管理者，可以管理銷售相關功能'),
('SALES_PERSON', '銷售人員', '銷售執行人員，可以進行銷售操作'),
('FINANCE', '財務人員', '財務管理人員，可以管理財務相關功能'),
('CUSTOMER_SERVICE', '客服人員', '客戶服務人員，可以處理客戶相關事務'),
('USER', '普通用戶', '系統普通用戶，具有基本查看權限')
ON CONFLICT (name) DO NOTHING;

-- 9. 插入初始菜單數據
INSERT INTO menus (name, path, icon, parent_id, sort_order) VALUES
('數據統計', '/project/[id]/dashboard', 'BarChart3', NULL, 1),
('銷控總表', '/project/[id]/sales-control', 'Table', NULL, 2),
('客戶預約', '/project/[id]/appointments', 'Calendar', NULL, 3),
('已購客名單', '/project/[id]/purchased-customers', 'Users', NULL, 4),
('銷售人員管理', '/project/[id]/sales-personnel', 'UserCheck', NULL, 5),
('訪客問卷', '/project/[id]/questionnaire', 'FileText', NULL, 6),
('財務系統', '/project/[id]/finance', 'DollarSign', NULL, 7),
('點交屋管理', '/project/[id]/handover', 'Home', NULL, 8),
('退戶記錄', '/project/[id]/withdrawal', 'UserMinus', NULL, 9),
('停車位管理', '/project/[id]/parking', 'Car', NULL, 10),
('權限管理', '/project/[id]/admin/permissions', 'Shield', NULL, 11)
ON CONFLICT DO NOTHING;

-- 10. 插入財務系統子菜單
INSERT INTO menus (name, path, icon, parent_id, sort_order) VALUES
('佣金列表', '/project/[id]/finance/commission', 'List', (SELECT id FROM menus WHERE path = '/project/[id]/finance'), 1),
('佣金明細', '/project/[id]/finance/commission-details', 'FileText', (SELECT id FROM menus WHERE path = '/project/[id]/finance'), 2),
('訂金管理', '/project/[id]/finance/deposit', 'CreditCard', (SELECT id FROM menus WHERE path = '/project/[id]/finance'), 3),
('預算計劃', '/project/[id]/finance/budget', 'PieChart', (SELECT id FROM menus WHERE path = '/project/[id]/finance'), 4)
ON CONFLICT DO NOTHING;

-- 11. 插入權限管理子菜單
INSERT INTO menus (name, path, icon, parent_id, sort_order) VALUES
('權限概覽', '/project/[id]/admin/permissions', 'Shield', (SELECT id FROM menus WHERE path = '/project/[id]/admin/permissions'), 1),
('角色管理', '/project/[id]/admin/permissions/roles', 'Users', (SELECT id FROM menus WHERE path = '/project/[id]/admin/permissions'), 2),
('菜單權限', '/project/[id]/admin/permissions/menus', 'Menu', (SELECT id FROM menus WHERE path = '/project/[id]/admin/permissions'), 3),
('按鈕權限', '/project/[id]/admin/permissions/buttons', 'MousePointer', (SELECT id FROM menus WHERE path = '/project/[id]/admin/permissions'), 4),
('用戶權限', '/project/[id]/admin/permissions/users', 'UserCog', (SELECT id FROM menus WHERE path = '/project/[id]/admin/permissions'), 5)
ON CONFLICT DO NOTHING;

-- 12. 插入常用按鈕權限數據
INSERT INTO button_permissions (name, identifier, menu_id, description) VALUES
-- 銷控總表按鈕權限
('新增銷控', 'add_sales_control', (SELECT id FROM menus WHERE path = '/project/[id]/sales-control'), '新增銷控記錄'),
('編輯銷控', 'edit_sales_control', (SELECT id FROM menus WHERE path = '/project/[id]/sales-control'), '編輯銷控記錄'),
('刪除銷控', 'delete_sales_control', (SELECT id FROM menus WHERE path = '/project/[id]/sales-control'), '刪除銷控記錄'),
('導出銷控', 'export_sales_control', (SELECT id FROM menus WHERE path = '/project/[id]/sales-control'), '導出銷控數據'),

-- 客戶預約按鈕權限
('新增預約', 'add_appointment', (SELECT id FROM menus WHERE path = '/project/[id]/appointments'), '新增客戶預約'),
('編輯預約', 'edit_appointment', (SELECT id FROM menus WHERE path = '/project/[id]/appointments'), '編輯預約信息'),
('刪除預約', 'delete_appointment', (SELECT id FROM menus WHERE path = '/project/[id]/appointments'), '刪除預約記錄'),
('確認預約', 'confirm_appointment', (SELECT id FROM menus WHERE path = '/project/[id]/appointments'), '確認預約狀態'),

-- 已購客名單按鈕權限
('新增客戶', 'add_customer', (SELECT id FROM menus WHERE path = '/project/[id]/purchased-customers'), '新增已購客戶'),
('編輯客戶', 'edit_customer', (SELECT id FROM menus WHERE path = '/project/[id]/purchased-customers'), '編輯客戶信息'),
('刪除客戶', 'delete_customer', (SELECT id FROM menus WHERE path = '/project/[id]/purchased-customers'), '刪除客戶記錄'),

-- 銷售人員管理按鈕權限
('新增銷售', 'add_sales_person', (SELECT id FROM menus WHERE path = '/project/[id]/sales-personnel'), '新增銷售人員'),
('編輯銷售', 'edit_sales_person', (SELECT id FROM menus WHERE path = '/project/[id]/sales-personnel'), '編輯銷售人員'),
('刪除銷售', 'delete_sales_person', (SELECT id FROM menus WHERE path = '/project/[id]/sales-personnel'), '刪除銷售人員'),

-- 財務系統按鈕權限
('查看佣金', 'view_commission', (SELECT id FROM menus WHERE path = '/project/[id]/finance/commission'), '查看佣金列表'),
('編輯佣金', 'edit_commission', (SELECT id FROM menus WHERE path = '/project/[id]/finance/commission'), '編輯佣金信息'),
('查看訂金', 'view_deposit', (SELECT id FROM menus WHERE path = '/project/[id]/finance/deposit'), '查看訂金管理'),
('編輯訂金', 'edit_deposit', (SELECT id FROM menus WHERE path = '/project/[id]/finance/deposit'), '編輯訂金信息'),

-- 權限管理按鈕權限
('管理角色', 'manage_roles', (SELECT id FROM menus WHERE path = '/project/[id]/admin/permissions/roles'), '管理系統角色'),
('配置菜單權限', 'config_menu_permissions', (SELECT id FROM menus WHERE path = '/project/[id]/admin/permissions/menus'), '配置菜單權限'),
('配置按鈕權限', 'config_button_permissions', (SELECT id FROM menus WHERE path = '/project/[id]/admin/permissions/buttons'), '配置按鈕權限'),
('分配用戶權限', 'assign_user_permissions', (SELECT id FROM menus WHERE path = '/project/[id]/admin/permissions/users'), '分配用戶權限')
ON CONFLICT DO NOTHING;

-- 13. 為超級管理員分配所有菜單權限
INSERT INTO role_menu_permissions (role_id, menu_id, can_access)
SELECT 
    (SELECT id FROM roles WHERE name = 'SUPER_ADMIN'),
    m.id,
    true
FROM menus m
ON CONFLICT (role_id, menu_id) DO NOTHING;

-- 14. 為超級管理員分配所有按鈕權限
INSERT INTO role_button_permissions (role_id, button_id, can_operate)
SELECT 
    (SELECT id FROM roles WHERE name = 'SUPER_ADMIN'),
    bp.id,
    true
FROM button_permissions bp
ON CONFLICT (role_id, button_id) DO NOTHING;

-- 15. 為管理員分配基本菜單權限（除權限管理外）
INSERT INTO role_menu_permissions (role_id, menu_id, can_access)
SELECT 
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    m.id,
    true
FROM menus m
WHERE m.path NOT LIKE '%/admin/permissions%'
ON CONFLICT (role_id, menu_id) DO NOTHING;

-- 16. 為銷售經理分配銷售相關菜單權限
INSERT INTO role_menu_permissions (role_id, menu_id, can_access)
SELECT 
    (SELECT id FROM roles WHERE name = 'SALES_MANAGER'),
    m.id,
    true
FROM menus m
WHERE m.path IN (
    '/project/[id]/dashboard',
    '/project/[id]/sales-control',
    '/project/[id]/appointments',
    '/project/[id]/purchased-customers',
    '/project/[id]/sales-personnel',
    '/project/[id]/questionnaire'
)
ON CONFLICT (role_id, menu_id) DO NOTHING;

-- 17. 為銷售人員分配基本銷售菜單權限
INSERT INTO role_menu_permissions (role_id, menu_id, can_access)
SELECT 
    (SELECT id FROM roles WHERE name = 'SALES_PERSON'),
    m.id,
    true
FROM menus m
WHERE m.path IN (
    '/project/[id]/dashboard',
    '/project/[id]/sales-control',
    '/project/[id]/appointments',
    '/project/[id]/purchased-customers',
    '/project/[id]/questionnaire'
)
ON CONFLICT (role_id, menu_id) DO NOTHING;

-- 18. 為財務人員分配財務相關菜單權限
INSERT INTO role_menu_permissions (role_id, menu_id, can_access)
SELECT 
    (SELECT id FROM roles WHERE name = 'FINANCE'),
    m.id,
    true
FROM menus m
WHERE m.path LIKE '/project/[id]/finance%' OR m.path = '/project/[id]/dashboard'
ON CONFLICT (role_id, menu_id) DO NOTHING;

-- 19. 為客服人員分配客戶服務相關菜單權限
INSERT INTO role_menu_permissions (role_id, menu_id, can_access)
SELECT 
    (SELECT id FROM roles WHERE name = 'CUSTOMER_SERVICE'),
    m.id,
    true
FROM menus m
WHERE m.path IN (
    '/project/[id]/dashboard',
    '/project/[id]/appointments',
    '/project/[id]/purchased-customers',
    '/project/[id]/questionnaire',
    '/project/[id]/handover'
)
ON CONFLICT (role_id, menu_id) DO NOTHING;

-- 20. 為普通用戶分配基本查看權限
INSERT INTO role_menu_permissions (role_id, menu_id, can_access)
SELECT 
    (SELECT id FROM roles WHERE name = 'USER'),
    m.id,
    true
FROM menus m
WHERE m.path = '/project/[id]/dashboard'
ON CONFLICT (role_id, menu_id) DO NOTHING;

-- 21. 創建更新時間觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 22. 為相關表創建更新時間觸發器
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_menu_permissions_updated_at BEFORE UPDATE ON role_menu_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_button_permissions_updated_at BEFORE UPDATE ON button_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_button_permissions_updated_at BEFORE UPDATE ON role_button_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 遷移完成
COMMIT;