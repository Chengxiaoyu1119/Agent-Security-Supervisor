import { KeyRound } from 'lucide-react';
import { Col, Row, Typography } from 'antd';
import { UiInput, UiSwitch } from '../ui';

type AuthorizedTargetAuthFieldsProps = {
  authorizationNote: string;
  bearerToken: string;
  authorizationConfirmed: boolean;
  onAuthorizationNoteChange: (value: string) => void;
  onBearerTokenChange: (value: string) => void;
  onAuthorizationConfirmedChange: (value: boolean) => void;
};

export function AuthorizedTargetAuthFields({
  authorizationNote,
  bearerToken,
  authorizationConfirmed,
  onAuthorizationNoteChange,
  onBearerTokenChange,
  onAuthorizationConfirmedChange
}: AuthorizedTargetAuthFieldsProps) {
  return (
    <>
      <div className="zh-attack-lab__field">
        <Typography.Text strong>授权说明</Typography.Text>
        <UiInput.TextArea
          value={authorizationNote}
          onChange={(event) => onAuthorizationNoteChange(event.target.value)}
          rows={2}
          placeholder="说明该靶场属于本人、团队或比赛授权范围。"
          showCount
          maxLength={1200}
        />
      </div>
      <Row gutter={[12, 12]} align="stretch">
        <Col xs={24} md={12}>
          <form className="zh-attack-lab__field" autoComplete="off" onSubmit={(event) => event.preventDefault()}>
            <Typography.Text strong>
              <KeyRound size={14} className="zh-tag-icon" />
              Bearer Token
            </Typography.Text>
            <UiInput.Password
              value={bearerToken}
              onChange={(event) => onBearerTokenChange(event.target.value)}
              autoComplete="off"
              placeholder="没有就留空"
            />
          </form>
        </Col>
        <Col xs={24} md={12}>
          <div className="zh-attack-lab__switch-row zh-attack-lab__switch-row--compact zh-full-height">
            <div>
              <Typography.Text strong>确认授权</Typography.Text>
              <Typography.Paragraph type="secondary" className="zh-attack-lab__hint">
                未确认授权时不会请求公网。
              </Typography.Paragraph>
            </div>
            <UiSwitch checked={authorizationConfirmed} onChange={onAuthorizationConfirmedChange} />
          </div>
        </Col>
      </Row>
    </>
  );
}
