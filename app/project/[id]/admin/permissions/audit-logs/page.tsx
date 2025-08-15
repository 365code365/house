'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  message,
  Modal,
  Descriptions,
  Timeline,
  Tooltip,
  Badge
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useParams } from 'next/navigation';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  userName: string;
  userRole: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

interface AuditLogStats {
  totalLogs: number;
  todayLogs: number;
  actionStats: { action: string; count: number }[];
  userStats: { userId: string; userName: string; count: number }[];
}

const AuditLogsPage: React.FC = () => {
  const params = useParams();
  const projectId = params.id as string;
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [cleanupModalVisible, setCleanupModalVisible] = useState(false);
  const [retentionDays, setRetentionDays] = useState(90);

  // 獲取審計日誌列表
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(searchText && { search: searchText }),
        ...(selectedAction && { action: selectedAction }),
        ...(selectedResourceType && { resourceType: selectedResourceType }),
        ...(selectedUserId && { userId: selectedUserId }),
        ...(dateRange && {
          startDate: dateRange[0].toISOString(),
          endDate: dateRange[1].toISOString()
        })
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) throw new Error('獲取審計日誌失敗');
      
      const result = await response.json();
      setLogs(result.data.logs || []);
      setStats(result.data.stats);
      setPagination(prev => ({ ...prev, total: result.data.pagination?.total || 0 }));
    } catch (error) {
      message.error('獲取審計日誌失敗');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, selectedAction, selectedResourceType, selectedUserId, dateRange]);

  // 清理舊日誌
  const handleCleanupLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retentionDays })
      });
      
      if (!response.ok) throw new Error('清理日誌失敗');
      
      const result = await response.json();
      message.success(`成功清理 ${result.data.deletedCount} 條舊日誌`);
      setCleanupModalVisible(false);
      fetchLogs();
    } catch (error) {
      message.error('清理日誌失敗');
    }
  };

  // 導出日誌
  const handleExportLogs = async () => {
    try {
      const params = new URLSearchParams({
        export: 'true',
        ...(searchText && { search: searchText }),
        ...(selectedAction && { action: selectedAction }),
        ...(selectedResourceType && { resourceType: selectedResourceType }),
        ...(selectedUserId && { userId: selectedUserId }),
        ...(dateRange && {
          startDate: dateRange[0].toISOString(),
          endDate: dateRange[1].toISOString()
        })
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) throw new Error('導出失敗');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${dayjs().format('YYYY-MM-DD')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      message.success('日誌導出成功');
    } catch (error) {
      message.error('導出失敗');
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // 操作類型顏色映射
  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      CREATE: 'green',
      UPDATE: 'blue',
      DELETE: 'red',
      LOGIN: 'cyan',
      LOGOUT: 'orange',
      ASSIGN: 'purple',
      REVOKE: 'magenta'
    };
    return colorMap[action] || 'default';
  };

  // 資源類型圖標映射
  const getResourceIcon = (resourceType: string) => {
    const iconMap: Record<string, string> = {
      ROLE: '👥',
      MENU: '📋',
      BUTTON: '🔘',
      USER: '👤',
      PERMISSION: '🔐'
    };
    return iconMap[resourceType] || '📄';
  };

  const columns = [
    {
      title: '時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => (
        <Tooltip title={dayjs(text).format('YYYY-MM-DD HH:mm:ss')}>
          <Text>{dayjs(text).format('MM-DD HH:mm')}</Text>
        </Tooltip>
      ),
      sorter: true
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => (
        <Tag color={getActionColor(action)}>{action}</Tag>
      )
    },
    {
      title: '資源類型',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 120,
      render: (resourceType: string) => (
        <Space>
          <span>{getResourceIcon(resourceType)}</span>
          <Text>{resourceType}</Text>
        </Space>
      )
    },
    {
      title: '操作用戶',
      key: 'user',
      width: 150,
      render: (record: AuditLog) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.userName}</Text>
          <Tag>{record.userRole}</Tag>
        </Space>
      )
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120
    },
    {
      title: '詳情',
      key: 'details',
      width: 200,
      render: (record: AuditLog) => {
        const details = typeof record.details === 'string' 
          ? record.details 
          : JSON.stringify(record.details);
        return (
          <Tooltip title={details}>
            <Text ellipsis style={{ maxWidth: 180 }}>
              {details}
            </Text>
          </Tooltip>
        );
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (record: AuditLog) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedLog(record);
            setDetailModalVisible(true);
          }}
        />
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>權限審計日誌</Title>
        <Text type="secondary">查看和分析系統權限操作記錄</Text>
      </div>

      {/* 統計卡片 */}
      {stats && (
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="總日誌數"
                value={stats.totalLogs || 0}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日操作"
                value={stats.todayLogs || 0}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="活躍用戶"
                value={stats.userStats?.length || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="操作類型"
                value={stats.actionStats?.length || 0}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索和篩選 */}
      <Card className="mb-6">
        <Row gutter={16}>
          <Col span={6}>
            <Input
              placeholder="搜索日誌內容"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={fetchLogs}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="操作類型"
              value={selectedAction}
              onChange={setSelectedAction}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="CREATE">創建</Option>
              <Option value="UPDATE">更新</Option>
              <Option value="DELETE">刪除</Option>
              <Option value="LOGIN">登入</Option>
              <Option value="LOGOUT">登出</Option>
              <Option value="ASSIGN">分配</Option>
              <Option value="REVOKE">撤銷</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="資源類型"
              value={selectedResourceType}
              onChange={setSelectedResourceType}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="ROLE">角色</Option>
              <Option value="MENU">菜單</Option>
              <Option value="BUTTON">按鈕</Option>
              <Option value="USER">用戶</Option>
              <Option value="PERMISSION">權限</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
              style={{ width: '100%' }}
              placeholder={['開始日期', '結束日期']}
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={fetchLogs}
              >
                搜索
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSearchText('');
                  setSelectedAction('');
                  setSelectedResourceType('');
                  setSelectedUserId('');
                  setDateRange(null);
                  setPagination(prev => ({ ...prev, current: 1 }));
                  fetchLogs();
                }}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 操作按鈕 */}
      <Card className="mb-6">
        <Space>
          <Button
            type="primary"
            icon={<ExportOutlined />}
            onClick={handleExportLogs}
          >
            導出日誌
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => setCleanupModalVisible(true)}
          >
            清理舊日誌
          </Button>
        </Space>
      </Card>

      {/* 日誌列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 條記錄`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || 20 }));
            }
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 詳情模態框 */}
      <Modal
        title="審計日誌詳情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedLog && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="操作時間">
                {dayjs(selectedLog.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="操作類型">
                <Tag color={getActionColor(selectedLog.action)}>
                  {selectedLog.action}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="資源類型">
                <Space>
                  <span>{getResourceIcon(selectedLog.resourceType)}</span>
                  <Text>{selectedLog.resourceType}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="資源ID">
                {selectedLog.resourceId}
              </Descriptions.Item>
              <Descriptions.Item label="操作用戶">
                <Space direction="vertical" size={0}>
                  <Text strong>{selectedLog.userName}</Text>
                  <Tag>{selectedLog.userRole}</Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="IP地址">
                {selectedLog.ipAddress}
              </Descriptions.Item>
              <Descriptions.Item label="用戶代理" span={2}>
                <Text ellipsis title={selectedLog.userAgent}>
                  {selectedLog.userAgent}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="操作詳情" span={2}>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                  {typeof selectedLog.details === 'string' 
                    ? selectedLog.details 
                    : JSON.stringify(selectedLog.details, null, 2)
                  }
                </pre>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* 清理日誌模態框 */}
      <Modal
        title="清理舊日誌"
        open={cleanupModalVisible}
        onOk={handleCleanupLogs}
        onCancel={() => setCleanupModalVisible(false)}
        okText="確認清理"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>將刪除超過指定天數的審計日誌記錄。此操作不可恢復，請謹慎操作。</Text>
          <div>
            <Text>保留天數：</Text>
            <Input
              type="number"
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              style={{ width: 100, marginLeft: 8 }}
              min={1}
              max={365}
            />
            <Text style={{ marginLeft: 8 }}>天</Text>
          </div>
          <Text type="warning">
            將刪除 {dayjs().subtract(retentionDays, 'day').format('YYYY-MM-DD')} 之前的所有日誌記錄
          </Text>
        </Space>
      </Modal>
    </div>
  );
};

export default AuditLogsPage;