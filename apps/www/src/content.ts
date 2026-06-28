export type Tone = 'danger' | 'warning' | 'safe';

export type Scenario = {
  id: string;
  label: string;
  source: string;
  tool: string;
  score: number;
  decision: string;
  tone: Tone;
  reason: string;
  evidence: string;
  action: string;
};

export type Surface = {
  name: string;
  level: 'critical' | 'high' | 'medium';
  scripts: number;
  samples: number;
  focus: string;
  policy: string;
};

export const metrics = [
  { value: '7', label: '攻击面', note: '覆盖输入、工具、记忆和环境风险' },
  { value: '22', label: '攻击脚本', note: '样本、参数、触发条件和复核证据' },
  { value: '13', label: '策略规则', note: '工具、数据、上下文和行为联合判定' },
  { value: '4', label: '执行动作', note: '允许、询问、隔离、拒绝' }
];

export const scenarios: Scenario[] = [
  {
    id: 'tool-hijack',
    label: '工具调用劫持',
    source: '不可信文档',
    tool: '文件读取 / 接口调用',
    score: 97,
    decision: '拒绝执行',
    tone: 'danger',
    reason: '文档试图覆盖系统规则，并诱导读取受保护路径。',
    evidence: '策略命中 3 项，异常分 88，审计指纹已生成',
    action: '拦截'
  },
  {
    id: 'bulk-export',
    label: '批量数据外发',
    source: '外部智能体任务',
    tool: '接口调用 / 数据导出',
    score: 84,
    decision: '人工确认',
    tone: 'warning',
    reason: '请求包含批量导出意图，接收域名和数据范围未确认。',
    evidence: '参数快照、目标域、上下文来源已进入复核队列',
    action: '复核'
  },
  {
    id: 'safe-read',
    label: '可信资料读取',
    source: '可信用户',
    tool: '文件读取',
    score: 18,
    decision: '允许执行',
    tone: 'safe',
    reason: '读取范围位于公开目录，参数与当前任务目标一致。',
    evidence: '低风险事件已记录，可用于后续审计回放',
    action: '放行'
  }
];

export const workflow = [
  {
    title: '标准化事件',
    meta: '调用前事件',
    body: '把外部智能体的目标、上下文、工具名和参数整理成统一事件。'
  },
  {
    title: '标注来源',
    meta: '上下文边界',
    body: '区分系统指令、用户意图、不可信文档、邮件和外部事件。'
  },
  {
    title: '融合评分',
    meta: '策略与异常融合',
    body: '把策略命中、异常行为、敏感资源和历史证据合成风险分。'
  },
  {
    title: '执行前判定',
    meta: '执行前闸门',
    body: '在真实工具执行前返回允许、询问、隔离或拒绝。'
  },
  {
    title: '审计留痕',
    meta: '审计留痕',
    body: '保留参数、上下文、人工复核和最终动作，方便复盘。'
  }
];

export const surfaces: Surface[] = [
  {
    name: '提示注入',
    level: 'high',
    scripts: 3,
    samples: 18,
    focus: '不可信文本覆盖系统规则',
    policy: '来源隔离、系统指令保护、敏感工具前置拦截'
  },
  {
    name: '模型越狱',
    level: 'high',
    scripts: 3,
    samples: 9,
    focus: '角色扮演和规则改写诱导越界输出',
    policy: '意图偏移检测、越权输出拦截、上下文重写识别'
  },
  {
    name: '数据泄露',
    level: 'critical',
    scripts: 4,
    samples: 18,
    focus: '读取队伍资料、赛题种子和长期记忆',
    policy: '路径约束、数据级别识别、外发目标复核'
  },
  {
    name: '滥用风险',
    level: 'medium',
    scripts: 3,
    samples: 13,
    focus: '批量外发、批量导出和高频接口调用',
    policy: '速率限制、批量行为识别、人工确认'
  },
  {
    name: '工具调用劫持',
    level: 'critical',
    scripts: 4,
    samples: 17,
    focus: '诱导危险工具或污染工具参数',
    policy: '工具参数校验、目标资源约束、执行前拒绝'
  },
  {
    name: '记忆中毒',
    level: 'high',
    scripts: 2,
    samples: 9,
    focus: '写入长期恶意偏好影响后续任务',
    policy: '记忆写入复核、来源标注、长期影响评分'
  },
  {
    name: '环境感知污染',
    level: 'medium',
    scripts: 3,
    samples: 12,
    focus: '伪造环境变量、配置和工具返回内容',
    policy: '环境快照比对、工具返回验证、异常上下文隔离'
  }
];

export const productRows = [
  { event: '文件读取', source: '不可信文档', score: 97, action: '已拦截' },
  { event: '接口调用', source: '外部智能体', score: 84, action: '待复核' },
  { event: '记忆写入', source: '工具输出', score: 72, action: '已隔离' },
  { event: '文件读取', source: '可信用户', score: 18, action: '已放行' }
];
