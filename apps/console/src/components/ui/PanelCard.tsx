import React from 'react';
import { Card } from 'antd';
import type { CardProps } from 'antd';
import { SectionTitle } from './SectionTitle';

export type PanelCardProps = CardProps & {
  subtitle?: React.ReactNode;
  bodyPadding?: number | string;
};

export function PanelCard({ title, subtitle, bodyPadding, children, variant, styles, ...props }: PanelCardProps) {
  const cardStyles =
    typeof styles === 'function'
      ? styles
      : {
          ...styles,
          body: {
            ...styles?.body,
            ...(bodyPadding === undefined ? {} : { padding: bodyPadding })
          }
        };

  const composedTitle = subtitle ? <SectionTitle title={title} meta={subtitle} orientation="vertical" /> : title;

  return (
    <Card variant={variant} title={composedTitle} styles={cardStyles} {...props}>
      {children}
    </Card>
  );
}
