import { Col, Row, Typography } from 'antd';
import { UiAlert } from '../ui';

export function DualModelFixedChain() {
  return (
    <>
      <UiAlert
        type="info"
        showIcon
        message="页面不再手动选择模型。后端固定使用项目已接入的大模型：副模型优先智谱，主模型优先 DeepSeek；真实接口不可用时才启用本地安全评测模型兜底。"
      />
      <Row gutter={[12, 12]} className="zh-dual-model-fixed-chain">
        <Col xs={24} sm={12}>
          <div className="zh-dual-model-fixed-node">
            <Typography.Text type="secondary">副模型</Typography.Text>
            <Typography.Title level={5}>智谱优先</Typography.Title>
            <Typography.Text type="secondary">负责生成/优化对抗评测输入</Typography.Text>
          </div>
        </Col>
        <Col xs={24} sm={12}>
          <div className="zh-dual-model-fixed-node">
            <Typography.Text type="secondary">主模型</Typography.Text>
            <Typography.Title level={5}>DeepSeek 优先</Typography.Title>
            <Typography.Text type="secondary">负责响应副模型生成的评测输入</Typography.Text>
          </div>
        </Col>
      </Row>
    </>
  );
}
