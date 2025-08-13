-- 创建操作历史表
CREATE TABLE IF NOT EXISTS operation_history (
  id BIGSERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  user_id UUID,
  operation_type VARCHAR(50) NOT NULL, -- 操作类型：create, update, delete, batch_update, batch_delete, import
  target_type VARCHAR(50) NOT NULL, -- 目标类型：sales_control
  target_id INTEGER, -- 目标记录ID（单个操作时）
  target_ids INTEGER[], -- 目标记录IDs（批量操作时）
  operation_data JSONB, -- 操作数据（变更前后的数据）
  description TEXT, -- 操作描述
  ip_address INET, -- 操作IP地址
  user_agent TEXT, -- 用户代理
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 索引
  INDEX idx_operation_history_project_id (project_id),
  INDEX idx_operation_history_user_id (user_id),
  INDEX idx_operation_history_created_at (created_at),
  INDEX idx_operation_history_operation_type (operation_type),
  INDEX idx_operation_history_target_type (target_type)
);

-- 启用RLS
ALTER TABLE operation_history ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view operation history for their projects" ON operation_history
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert operation history for their projects" ON operation_history
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- 授权给anon和authenticated角色
GRANT SELECT, INSERT ON operation_history TO anon;
GRANT SELECT, INSERT ON operation_history TO authenticated;
GRANT USAGE ON SEQUENCE operation_history_id_seq TO anon;
GRANT USAGE ON SEQUENCE operation_history_id_seq TO authenticated;

-- 创建函数来记录操作历史
CREATE OR REPLACE FUNCTION log_operation_history(
  p_project_id INTEGER,
  p_user_id UUID DEFAULT NULL,
  p_operation_type VARCHAR(50),
  p_target_type VARCHAR(50),
  p_target_id INTEGER DEFAULT NULL,
  p_target_ids INTEGER[] DEFAULT NULL,
  p_operation_data JSONB DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  history_id BIGINT;
BEGIN
  INSERT INTO operation_history (
    project_id,
    user_id,
    operation_type,
    target_type,
    target_id,
    target_ids,
    operation_data,
    description,
    ip_address,
    user_agent
  ) VALUES (
    p_project_id,
    COALESCE(p_user_id, auth.uid()),
    p_operation_type,
    p_target_type,
    p_target_id,
    p_target_ids,
    p_operation_data,
    p_description,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO history_id;
  
  RETURN history_id;
END;
$$;

-- 创建触发器函数来自动记录sales_control表的变更
CREATE OR REPLACE FUNCTION sales_control_history_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  operation_type VARCHAR(50);
  operation_data JSONB;
  description TEXT;
BEGIN
  -- 确定操作类型
  IF TG_OP = 'INSERT' THEN
    operation_type := 'create';
    operation_data := jsonb_build_object('new', to_jsonb(NEW));
    description := '创建房屋记录: ' || NEW.house_number;
  ELSIF TG_OP = 'UPDATE' THEN
    operation_type := 'update';
    operation_data := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    description := '更新房屋记录: ' || NEW.house_number;
  ELSIF TG_OP = 'DELETE' THEN
    operation_type := 'delete';
    operation_data := jsonb_build_object('old', to_jsonb(OLD));
    description := '删除房屋记录: ' || OLD.house_number;
  END IF;
  
  -- 记录操作历史
  PERFORM log_operation_history(
    COALESCE(NEW.project_id, OLD.project_id),
    auth.uid(),
    operation_type,
    'sales_control',
    COALESCE(NEW.id, OLD.id),
    NULL,
    operation_data,
    description
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 创建触发器
CREATE TRIGGER sales_control_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON sales_control
  FOR EACH ROW
  EXECUTE FUNCTION sales_control_history_trigger();

COMMENT ON TABLE operation_history IS '操作历史记录表';
COMMENT ON COLUMN operation_history.operation_type IS '操作类型：create, update, delete, batch_update, batch_delete, import';
COMMENT ON COLUMN operation_history.target_type IS '目标类型：sales_control';
COMMENT ON COLUMN operation_history.operation_data IS '操作数据，包含变更前后的数据';
COMMENT ON FUNCTION log_operation_history IS '记录操作历史的函数';
COMMENT ON FUNCTION sales_control_history_trigger IS '自动记录sales_control表变更的触发器函数';