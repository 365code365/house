-- Insert default sales personnel data
INSERT IGNORE INTO sales_personnel (employee_no, name, email, password, phone, project_ids, created_at, updated_at) 
VALUES 
('SP001', '张小明', 'zhang@test.com', 'password123', '0912345678', '1', NOW(), NOW()),
('SP002', '李小华', 'li@test.com', 'password123', '0912345679', '1', NOW(), NOW()),
('SP003', '王小美', 'wang@test.com', 'password123', '0912345680', '1', NOW(), NOW()),
('SP004', '陈小强', 'chen@test.com', 'password123', '0912345681', '1', NOW(), NOW());