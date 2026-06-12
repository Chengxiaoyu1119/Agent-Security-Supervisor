import { Card, Row, Col, Typography, Progress, Space, Tag, Empty, Flex } from 'antd';
import { Database, Folder, Shield, AlertCircle } from 'lucide-react';
import type { SurfaceEvidencePackIndex } from '../../types';

export function SurfaceEvidenceIndexBoard({
  index,
  loading,
  error,
  selectedSurfaceId,
  onSelectSurface
}: {
  index: SurfaceEvidencePackIndex | null;
  loading: boolean;
  error: string;
  selectedSurfaceId: string;
  onSelectSurface: (id: string) => void;
}) {
  const summary = index?.summary;
  return (
    <Card 
      title={
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <Space orientation="vertical" size={0}>
            <Typography.Text strong>全量证据索引</Typography.Text>
            <Typography.Text type="secondary" style={{fontSize: 13, whiteSpace: 'normal'}}>按攻击面汇总样本、脚本、策略、工具、运行证据和缺口状态。</Typography.Text>
          </Space>
          <Space size="large" wrap>
            <Typography.Text type="secondary">{loading ? '...' : `${summary?.surface_count ?? 0}`} 类攻击面</Typography.Text>
            <Typography.Text type="secondary">{loading ? '...' : `${summary?.avg_readiness_score ?? 0}%`} 完整度</Typography.Text>
            <Typography.Text type="secondary">{loading ? '...' : `${summary?.gap_count ?? 0}`} 项缺口</Typography.Text>
          </Space>
        </Flex>
      }
      variant="borderless"
      style={{ marginBottom: 24 }}
    >
      {error ? <Empty description={error} /> : null}
      {!error && (
        <Row gutter={[16, 16]}>
          {(index?.surfaces ?? []).map((item) => {
            let color = 'default';
            if(item.risk === 'critical') color = 'error';
            if(item.risk === 'high') color = 'warning';
            if(item.risk === 'medium') color = 'processing';
            return (
              <Col xs={24} md={12} xl={8} key={item.surface_id}>
                <Card 
                  type="inner" 
                  hoverable 
                  onClick={() => onSelectSurface(item.surface_id)}
                  style={{ 
                    cursor: 'pointer', 
                    borderColor: selectedSurfaceId === item.surface_id ? 'var(--ant-color-primary)' : 'var(--ant-color-border-secondary)',
                    borderWidth: selectedSurfaceId === item.surface_id ? 2 : 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  styles={{ body: { padding: 16, flex: 1, display: 'flex', flexDirection: 'column' } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <Typography.Text strong style={{ display: 'block' }}>{item.surface_name}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12, wordBreak: 'break-all' }}>{item.surface_id}</Typography.Text>
                    </div>
                    <Tag color={color} variant="filled" style={{ margin: 0, height: 'fit-content', flexShrink: 0, marginLeft: 8 }}>{item.risk}</Tag>
                  </div>
                  
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <Typography.Text type="secondary">完整度</Typography.Text>
                      <Typography.Text>{item.readiness_score}%</Typography.Text>
                    </div>
                    <Progress percent={item.readiness_score} size="small" showInfo={false} strokeColor="var(--ant-color-primary)" />
                  </div>
                  
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <Typography.Text type="secondary">控制率</Typography.Text>
                      <Typography.Text>{item.control_rate}%</Typography.Text>
                    </div>
                    <Progress percent={item.control_rate} size="small" showInfo={false} strokeColor="var(--ant-color-success)" />
                  </div>
                  
                  <div style={{ flex: 1 }}></div>
                  
                  <Space size={[8, 8]} wrap>
                    {item.top_policies.slice(0, 2).map((policy) => <Tag key={policy} variant="filled" color="processing" icon={<Shield size={12} style={{marginRight: 4, verticalAlign: '-1px'}}/>} style={{ margin: 0 }}>{policy}</Tag>)}
                    {item.tools.slice(0, 2).map((tool) => <Tag key={tool} variant="filled" icon={<Folder size={12} style={{marginRight: 4, verticalAlign: '-1px'}}/>} style={{ margin: 0 }}>{tool}</Tag>)}
                    {item.gap_count > 0 && <Tag color="error" variant="filled" icon={<AlertCircle size={12} style={{marginRight: 4, verticalAlign: '-1px'}}/>} style={{ margin: 0 }}>{item.gap_count} 项缺口</Tag>}
                  </Space>
                </Card>
              </Col>
            );
          })}
          {loading && !index ? <Col span={24}><Empty description="正在加载全量证据索引..." /></Col> : null}
        </Row>
      )}
    </Card>
  );
}
