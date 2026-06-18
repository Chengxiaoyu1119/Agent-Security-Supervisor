import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PanelCard } from './PanelCard';

describe('PanelCard', () => {
  it('renders title, subtitle, and body content', () => {
    render(
      <PanelCard title="审计证据" subtitle="自动化验收">
        <button type="button">复制</button>
      </PanelCard>
    );

    expect(screen.getByText('审计证据')).toBeInTheDocument();
    expect(screen.getByText('自动化验收')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '复制' })).toBeInTheDocument();
  });
});
