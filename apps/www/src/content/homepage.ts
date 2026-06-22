export const stats = [
  { value: '7', label: '攻击面', note: '覆盖智能体输入、工具、记忆与环境风险' },
  { value: '22', label: '攻击剧本', note: '每个剧本包含样本、参数和复核证据' },
  { value: '13', label: '防御策略', note: '按工具、数据、上下文和行为联合判定' },
  { value: '4', label: '监督动作', note: '允许、询问、隔离、拒绝' }
];

export const workflowStages = [
  {
    id: 'ingest',
    title: '接收事件',
    body: '把外部 Agent 的目标、上下文、工具名和参数统一成标准工具调用事件。',
    meta: 'before_tool_call'
  },
  {
    id: 'classify',
    title: '标注来源',
    body: '区分系统指令、用户意图、不可信文档、邮件和外部事件，避免上下文混淆。',
    meta: 'context boundary'
  },
  {
    id: 'score',
    title: '融合评分',
    body: '把策略命中、异常行为、敏感资源和历史证据融合成可解释风险分。',
    meta: 'policy + anomaly'
  },
  {
    id: 'decide',
    title: '执行前判定',
    body: '在真实工具执行前返回允许、询问、隔离或拒绝，并留下审计哈希。',
    meta: 'decision gate'
  }
];

export const capabilities = [
  {
    title: '攻击复现实验台',
    description: '内置提示注入、工具劫持、数据泄露、记忆中毒等样本，适合快速复现和讲解风险。',
    detail: '每个样本都保留触发条件、工具参数、期望拦截点和验证结果。'
  },
  {
    title: '工具调用防火墙',
    description: '在文件、邮件、API、代码执行、记忆写入之前做风险判断，避免 Agent 直接越权操作。',
    detail: '支持按工具、路径、目标域、参数形态和上下文来源组合策略。'
  },
  {
    title: '审计证据链',
    description: '把策略命中、异常分、参数快照、人工复核和 audit hash 组织成可追溯记录。',
    detail: '用于赛后报告、插件验收和团队内部复盘。'
  },
  {
    title: '防御评测报告',
    description: '比较无防护和有防护运行结果，输出攻击控制率、误报率和检测延迟。',
    detail: '报告面向评审和工程落地，不只展示概念。'
  }
];

export const demoScenarios = [
  {
    id: 'tool-hijack',
    label: '工具调用劫持',
    source: '不可信文档',
    tool: 'file.read',
    score: '97',
    decision: '拒绝',
    tone: 'danger',
    reason: '文档内容试图覆盖系统规则，并诱导读取受保护文件。',
    evidence: '策略命中 3 项 · 异常分 88 · audit hash 已生成'
  },
  {
    id: 'data-export',
    label: '批量数据外发',
    source: '外部任务',
    tool: 'api.call',
    score: '84',
    decision: '询问',
    tone: 'warning',
    reason: '请求包含批量导出意图，需要人工确认数据范围和接收方。',
    evidence: '策略命中 2 项 · 目标域待确认 · 参数已留痕'
  },
  {
    id: 'safe-query',
    label: '正常资料查询',
    source: '可信用户',
    tool: 'file.read',
    score: '18',
    decision: '允许',
    tone: 'success',
    reason: '读取范围位于公开目录，参数与当前任务目标一致。',
    evidence: '未命中高风险策略 · 调用范围正常 · 事件已记录'
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

export const integrations = [
  {
    title: '标准事件入口',
    body: '外部 Agent 在工具执行前提交事件，智安哨返回动作和解释。'
  },
  {
    title: 'OpenClaw 插件包',
    body: '生成 native plugin 源码包，把 before_tool_call 做成前置闸门。'
  },
  {
    title: '本地安全靶场',
    body: '攻击样本只作用于本地沙箱和模拟比赛数据，不攻击真实外部系统。'
  }
];
