import type { ReactNode } from 'react';
import { PanelCard } from '../ui';

export type LabModulePickerItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
};

type LabModulePickerProps = {
  title: string;
  subtitle: string;
  items: LabModulePickerItem[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function LabModulePicker({ title, subtitle, items, activeId, onSelect }: LabModulePickerProps) {
  return (
    <PanelCard title={title} subtitle={subtitle} className="zh-attack-lab__module-panel">
      <div className="zh-attack-lab__module-grid">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`zh-attack-lab__module-button${
              item.id === activeId ? ' zh-attack-lab__module-button--active' : ''
            }`}
            onClick={() => onSelect(item.id)}
          >
            <span className="zh-attack-lab__module-icon">{item.icon}</span>
            <span className="zh-attack-lab__module-copy">
              <strong>{item.title}</strong>
              <span>{item.subtitle}</span>
            </span>
          </button>
        ))}
      </div>
    </PanelCard>
  );
}
