export const stats = [
  { value: '7', label: '攻击面', note: '覆盖提示注入、工具劫持、数据泄露等核心风险' },
  { value: '22', label: '攻击剧本', note: '每个剧本都有对抗样本、越狱用例和工具脚本' },
  { value: '13', label: '防御策略', note: '拒绝、询问、隔离、允许四类监督决策' },
  { value: 'OpenClaw', label: '兼容接入', note: '提供事件入口、插件包和最小外部 Agent 演示' }
];

export const capabilities = [
  {
    title: '攻击面研究',
    description: '把 LLM Agent 的输入、工具、记忆、环境、外部事件拆成可评估的攻击面。',
    tag: 'Research'
  },
  {
    title: '攻击复现',
    description: '用本地靶场复现提示注入、工具劫持、记忆中毒、环境污染等攻击路径。',
    tag: 'Replay'
  },
  {
    title: '工具调用监督',
    description: '在文件、邮件、API、代码执行、记忆读写前做风险评分和策略判定。',
    tag: 'Guard'
  },
  {
    title: '证据留痕',
    description: '记录策略命中、参数、风险分、异常分、audit hash 和人工复核结果。',
    tag: 'Audit'
  },
  {
    title: '防御评测',
    description: '比较无防护和有防护运行结果，输出攻击控制率、误报率和检测延迟。',
    tag: 'Evaluate'
  },
  {
    title: '比赛交付',
    description: '生成攻击面证据包、评测报告、赛前体检和 OpenClaw 插件验收材料。',
    tag: 'Deliver'
  }
];

export const attackSurfaces = [
  { name: '提示注入', risk: 'high', scripts: 3, samples: 18, focus: '不可信文本覆盖系统规则' },
  { name: '模型越狱', risk: 'high', scripts: 3, samples: 9, focus: '角色扮演和规则改写诱导越界输出' },
  { name: '数据泄露', risk: 'critical', scripts: 4, samples: 18, focus: '读取队伍资料、赛题种子和长期记忆' },
  { name: '滥用风险', risk: 'medium', scripts: 3, samples: 13, focus: '批量外发、批量导出和高频接口调用' },
  { name: '工具调用劫持', risk: 'critical', scripts: 4, samples: 17, focus: '诱导危险工具或污染工具参数' },
  { name: '记忆中毒', risk: 'high', scripts: 2, samples: 9, focus: '写入长期恶意偏好影响后续任务' },
  { name: '环境感知污染', risk: 'medium', scripts: 3, samples: 12, focus: '伪造环境变量、配置和工具返回内容' }
];

export const pipeline = [
  '外部 Agent 任务',
  '工具调用事件',
  '上下文来源标注',
  '风险评分',
  '策略判定',
  '拒绝 / 询问 / 隔离',
  '审计报告'
];

export const integrationCards = [
  {
    title: '兼容事件入口',
    description: '外部 Agent 在工具执行前发送标准化事件，监督器返回是否允许继续执行。'
  },
  {
    title: 'OpenClaw 插件包',
    description: '生成 native plugin 源码包，把 before_tool_call 作为工具调用前置闸门。'
  },
  {
    title: '本地安全靶场',
    description: '所有攻击样本只作用于本地沙箱和模拟比赛数据，不攻击真实外部系统。'
  }
];
