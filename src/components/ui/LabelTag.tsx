import { Tag } from 'antd';
import type { TagProps } from 'antd';

export type LabelTagProps = TagProps;

export function LabelTag(props: LabelTagProps) {
  return <Tag {...props} />;
}
