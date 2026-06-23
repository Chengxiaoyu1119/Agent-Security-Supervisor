import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  FileText,
  Gauge,
  GitBranch,
  LockKeyhole,
  Play,
  ShieldCheck,
  TerminalSquare,
  Zap
} from 'lucide-react';
import { metrics, productRows, scenarios, surfaces, workflow, type Scenario, type Surface } from './content';

const consoleUrl =
  import.meta.env.VITE_AGENT_SUPERVISOR_CONSOLE_URL ?? 'http://127.0.0.1:5178';

const docsUrl =
  import.meta.env.VITE_AGENT_SUPERVISOR_DOCS_URL ?? 'http://127.0.0.1:3000';

export function App() {
  const [scenario, setScenario] = useState<Scenario>(scenarios[0]);
  const [surface, setSurface] = useState<Surface>(surfaces[0]);
  const [step, setStep] = useState(2);
  const [running, setRunning] = useState(false);

  const activeStep = workflow[step];

  const runDemo = () => {
    setRunning(true);
    window.setTimeout(() => setRunning(false), 620);
  };

  return (
    <div className="site-shell">
      <Header />

      <main>
        <section className="hero section-frame" id="top">
          <div className="hero__grid">
            <div className="hero__copy">
              <p className="eyebrow">Agent Tool-Call Supervisor</p>
              <h1>
                工具调用前，
                <br />
                <span className="hero__headline-line">先判定风险再放行。</span>
              </h1>
              <p className="hero__lead">
                智安哨把工具名、参数、上下文来源、策略命中、风险评分和审计证据接到同一条链路，
                在文件、邮件、API、代码执行和外部 Agent 接入前完成拦截、询问或复核。
              </p>

              <div className="hero__actions">
                <a className="button button--primary" href={consoleUrl}>
                  打开控制台
                  <ArrowRight size={18} />
                </a>
                <a className="button button--ghost" href={docsUrl}>
                  查看文档
                </a>
              </div>
            </div>

            <SupervisorPanel scenario={scenario} onScenarioChange={setScenario} />
          </div>

          <div className="metric-strip" aria-label="官网核心数据">
            {metrics.map((item) => (
              <div className="metric-strip__item" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
                <small>{item.note}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="section-frame workflow-section" id="workflow">
          <SectionHeading
            eyebrow="Workflow"
            title="从事件接入到审计留痕的一条闭环。"
            body="按真实监督流程展开：先接收工具调用事件，再标注来源、融合评分、判定动作，最后沉淀可复核证据。"
          />

          <div className="workflow-board">
            <div className="workflow-rail" role="tablist" aria-label="监督流程">
              {workflow.map((item, index) => (
                <button
                  type="button"
                  key={item.title}
                  className={step === index ? 'is-active' : ''}
                  onClick={() => setStep(index)}
                  aria-selected={step === index}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{item.title}</strong>
                </button>
              ))}
            </div>

            <article className="workflow-detail">
              <p className="eyebrow">{activeStep.meta}</p>
              <h3>{activeStep.title}</h3>
              <p>{activeStep.body}</p>
              <div className="workflow-signal" aria-hidden="true">
                <span style={{ width: `${42 + step * 10}%` }} />
              </div>
            </article>
          </div>
        </section>

        <section className="section-frame demo-section" id="demo">
          <SectionHeading
            eyebrow="Live Decision"
            title="交互式查看不同事件的处置结果。"
            body="选择不同事件，点击运行监督，页面会根据上下文来源、工具和策略命中结果更新风险分与动作。"
          />

          <div className="demo-grid">
            <div className="scenario-list" role="list">
              {scenarios.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={scenario.id === item.id ? 'is-active' : ''}
                  onClick={() => setScenario(item)}
                >
                  <span>{item.action}</span>
                  <strong>{item.label}</strong>
                  <small>{item.tool}</small>
                </button>
              ))}
            </div>

            <article className={`decision-lab tone-${scenario.tone} ${running ? 'is-running' : ''}`}>
              <div className="decision-lab__score">
                <span>risk score</span>
                <strong>{scenario.score}</strong>
                <i style={{ width: `${scenario.score}%` }} />
              </div>
              <div className="decision-lab__content">
                <p className="eyebrow">{scenario.source}</p>
                <h3>{running ? '监督器分析中' : scenario.decision}</h3>
                <p>{running ? '正在融合策略命中、上下文边界和工具敏感度。' : scenario.reason}</p>
                <small>{running ? 'policy fuse · anomaly score · audit trace' : scenario.evidence}</small>
              </div>
              <button type="button" className="button button--primary" onClick={runDemo} disabled={running}>
                <Play size={17} />
                {running ? '运行中' : '运行监督'}
              </button>
            </article>
          </div>
        </section>

        <section className="section-frame surface-section" id="surfaces">
          <SectionHeading
            eyebrow="Attack Surfaces"
            title="7 类智能体攻击面，按风险和证据复核。"
            body="左侧选择攻击面，右侧展示风险等级、剧本规模、样本证据和对应策略，让评审能快速理解系统覆盖范围。"
          />

          <div className="surface-lab">
            <div className="surface-list">
              {surfaces.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  className={surface.name === item.name ? 'is-active' : ''}
                  onClick={() => setSurface(item)}
                >
                  <strong>{item.name}</strong>
                  <span className={`risk risk--${item.level}`}>{item.level}</span>
                </button>
              ))}
            </div>

            <article className="surface-detail">
              <div className="surface-detail__head">
                <span className={`risk risk--${surface.level}`}>{surface.level}</span>
                <h3>{surface.name}</h3>
              </div>
              <p>{surface.focus}</p>
              <div className="surface-stats">
                <span>
                  <strong>{surface.scripts}</strong>
                  攻击剧本
                </span>
                <span>
                  <strong>{surface.samples}</strong>
                  样本证据
                </span>
              </div>
              <div className="policy-line">
                <ShieldCheck size={18} />
                <span>{surface.policy}</span>
              </div>
            </article>
          </div>
        </section>

        <section className="section-frame product-section" id="product">
          <SectionHeading
            eyebrow="Console Preview"
            title="用控制台视角展示核心事件流。"
            body="这里用接近控制台的信息密度展示核心列表：事件、来源、风险分和动作，风格克制，少边框，方便扫描。"
          />
          <ProductPreview />
        </section>

        <section className="section-frame openclaw-section" id="openclaw">
          <SectionHeading
            eyebrow="OpenClaw"
            title="作为外部 Agent 的工具调用监督层。"
            body="外部 Agent 只需要在工具执行前提交标准事件，智安哨返回动作、解释和审计标识。"
          />
          <div className="integration-flow">
            <FlowItem icon={<TerminalSquare size={21} />} title="标准事件入口" body="接收工具名、参数、上下文来源和任务目标。" />
            <FlowItem icon={<LockKeyhole size={21} />} title="策略前置闸门" body="在真实工具执行前完成评分、拒绝、询问或隔离。" />
            <FlowItem icon={<FileText size={21} />} title="审计报告输出" body="生成参数快照、复核链路和 OpenClaw 验收材料。" />
          </div>
        </section>

        <section className="final-cta">
          <div>
            <p className="eyebrow">Start</p>
            <h2>进入控制台，运行完整攻击剧本和监督策略。</h2>
          </div>
          <div className="final-cta__actions">
            <a className="button button--ghost" href={docsUrl}>
              查看文档
            </a>
            <a className="button button--primary" href={consoleUrl}>
              进入控制台
              <ArrowRight size={18} />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="智安哨官网首页">
        <img src="/favicon.svg" alt="" />
        <span>
          <strong>智安哨</strong>
          <small>Agent Security Supervisor</small>
        </span>
      </a>

      <nav className="nav-links" aria-label="官网导航">
        <a href="#workflow">工作流</a>
        <a href="#demo">监督演示</a>
        <a href="#surfaces">攻击面</a>
        <a href="#product">控制台</a>
        <a href="#openclaw">OpenClaw</a>
      </nav>

      <div className="header-actions">
        <a className="button button--small button--primary" href={consoleUrl}>
          进入控制台
        </a>
      </div>
    </header>
  );
}

function SupervisorPanel({
  scenario,
  onScenarioChange
}: {
  scenario: Scenario;
  onScenarioChange: (scenario: Scenario) => void;
}) {
  const statusIcon = useMemo(() => {
    if (scenario.tone === 'safe') return <CheckCircle2 size={18} />;
    if (scenario.tone === 'warning') return <Gauge size={18} />;
    return <ShieldCheck size={18} />;
  }, [scenario.tone]);

  return (
    <aside className={`supervisor-panel tone-${scenario.tone}`} aria-label="实时监督演示">
      <div className="panel-topbar">
        <span className="window-dots" aria-hidden="true" />
        <strong>Live Supervisor</strong>
        <em>{scenario.action}</em>
      </div>

      <div className="panel-tabs" role="tablist" aria-label="切换事件">
        {scenarios.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={scenario.id === item.id ? 'is-active' : ''}
            onClick={() => onScenarioChange(item)}
            aria-selected={scenario.id === item.id}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </div>

      <div className="panel-main">
        <div className="score-block">
          <span>risk score</span>
          <strong>{scenario.score}</strong>
          <i style={{ width: `${scenario.score}%` }} />
          <small>{scenario.reason}</small>
        </div>

        <div className="decision-block">
          <div>
            <span>Tool</span>
            <strong>{scenario.tool}</strong>
          </div>
          <div>
            <span>Decision</span>
            <strong>{scenario.decision}</strong>
          </div>
          <div>
            <span>Evidence</span>
            <strong>{scenario.evidence}</strong>
          </div>
        </div>
      </div>

      <div className="panel-footer">
        {statusIcon}
        <span>事件已标准化，结果可回放、可复核、可导出。</span>
      </div>
    </aside>
  );
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="product-preview">
      <div className="product-preview__rail">
        <span className="is-active">
          <Blocks size={17} />
          Events
        </span>
        <span>
          <GitBranch size={17} />
          Policies
        </span>
        <span>
          <Zap size={17} />
          Actions
        </span>
      </div>
      <div className="event-table" role="table" aria-label="控制台事件列表预览">
        <div className="event-table__head" role="row">
          <span>事件</span>
          <span>来源</span>
          <span>风险分</span>
          <span>动作</span>
        </div>
        {productRows.map((row) => (
          <div className="event-table__row" role="row" key={`${row.event}-${row.score}`}>
            <strong>{row.event}</strong>
            <span>{row.source}</span>
            <span>{row.score}</span>
            <em>{row.action}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowItem({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <article>
      <h3>
        {icon}
        <span>{title}</span>
      </h3>
      <p>{body}</p>
    </article>
  );
}
