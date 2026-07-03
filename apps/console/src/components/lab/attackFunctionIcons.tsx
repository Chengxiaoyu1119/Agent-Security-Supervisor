import { AlertCircle, Bot, FileWarning, FlaskConical, ShieldCheck, TerminalSquare } from 'lucide-react';

export const attackFunctionIcons: Record<string, JSX.Element> = {
  'prompt-injection': <FileWarning size={18} />,
  jailbreak: <Bot size={18} />,
  'data-leakage': <AlertCircle size={18} />,
  'tool-hijack': <TerminalSquare size={18} />,
  'memory-poison': <FlaskConical size={18} />,
  'environment-pollution': <ShieldCheck size={18} />,
  'abuse-risk': <AlertCircle size={18} />
};

export const fallbackAttackFunctionIcon = <FlaskConical size={18} />;
