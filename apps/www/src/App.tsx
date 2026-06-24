import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Blocks,
  FileText,
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

const riskLabels = {
  critical: '严重',
  high: '高危',
  medium: '中危'
} as const;

const pageSections = [
  { id: 'top', label: '首页' },
  { id: 'supervision', label: '监督链路' },
  { id: 'surfaces', label: '风险覆盖' },
  { id: 'product', label: '产品界面' },
  { id: 'start', label: '开始使用' }
] as const;

type PageSectionId = (typeof pageSections)[number]['id'];

export function App() {
  const [scenario, setScenario] = useState<Scenario>(scenarios[0]);
  const [surface, setSurface] = useState<Surface>(surfaces[0]);
  const [step, setStep] = useState(2);
  const [running, setRunning] = useState(false);
  const [activeSection, setActiveSection] = useState<PageSectionId>(pageSections[0].id);

  const activeStep = workflow[step];

  const runDemo = () => {
    setRunning(true);
    window.setTimeout(() => setRunning(false), 620);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const isAtPageEnd =
          window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8;

        if (isAtPageEnd) {
          setActiveSection('start');
          return;
        }

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveSection(visible.target.id as PageSectionId);
        }
      },
      {
        rootMargin: '-18% 0px -24% 0px',
        threshold: [0.08, 0.24, 0.5]
      }
    );

    pageSections.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    const handlePageEnd = () => {
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8) {
        setActiveSection('start');
      }
    };

    window.addEventListener('scroll', handlePageEnd, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handlePageEnd);
    };
  }, []);

  const navigateToSection = (id: string) => {
    setActiveSection(id as PageSectionId);
    const section = document.getElementById(id);

    if (!section) return;

    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    const centeredTop = sectionTop + (section.offsetHeight - window.innerHeight) / 2;

    window.history.replaceState(null, '', `#${id}`);
    window.scrollTo({
      top: Math.max(0, centeredTop),
      behavior: 'smooth'
    });
  };

  return (
    <div className="site-shell">
      <Header />
      <SectionNavigator
        activeSection={activeSection}
        onNavigate={navigateToSection}
      />

      <main>
        <section className="hero section-frame" id="top">
          <div className="hero__grid">
            <div className="hero__copy">
              <h1>
                每次工具调用，
                <br />
                <span className="hero__headline-line">先过安全闸门。</span>
              </h1>
              <p className="hero__lead">
                智安哨把工具名、参数、上下文来源、策略命中和审计证据串成一条可回放链路，
                在文件、邮件、接口、代码执行和外部智能体接入前完成拦截、询问或复核。
              </p>

              <p className="hero__proof">覆盖 7 类攻击面、22 个攻击剧本和 13 条监督策略。</p>
              <div className="hero__sequence" aria-label="监督链路">
                <span>工具请求</span>
                <span>风险判定</span>
                <span>执行动作</span>
                <span>审计留痕</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section-frame supervision-section" id="supervision">
          <SectionHeading
            title="一次调用，一条完整监督链路。"
            body="点击步骤查看监督过程，再选择事件运行判定。流程和结果放在同一个工作区，不再拆成两个重复区块。"
          />

          <div className="supervision-layout">
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

            <div className="supervision-stage">
              <article className="workflow-detail">
                <h3>{activeStep.title}</h3>
                <p>{activeStep.body}</p>
                <div className="workflow-signal" aria-hidden="true">
                  <span style={{ width: `${42 + step * 10}%` }} />
                </div>
              </article>

              <div className="scenario-switcher" role="tablist" aria-label="选择监督事件">
                {scenarios.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={scenario.id === item.id ? 'is-active' : ''}
                    onClick={() => setScenario(item)}
                    aria-selected={scenario.id === item.id}
                  >
                    <span>{item.action}</span>
                    <strong>{item.label}</strong>
                  </button>
                ))}
              </div>

              <article className={`decision-lab tone-${scenario.tone} ${running ? 'is-running' : ''}`}>
                <div className="decision-lab__score">
                  <span>风险分</span>
                  <strong>{scenario.score}</strong>
                  <i style={{ width: `${scenario.score}%` }} />
                </div>
                <div className="decision-lab__content">
                  <h3>{running ? '监督器分析中' : scenario.decision}</h3>
                  <p>{running ? '正在融合策略命中、上下文边界和工具敏感度。' : scenario.reason}</p>
                  <small>{running ? '策略命中 · 异常评分 · 审计留痕' : scenario.evidence}</small>
                </div>
                <button type="button" className="button button--primary" onClick={runDemo} disabled={running}>
                  <Play size={17} />
                  {running ? '运行中' : '运行监督'}
                </button>
              </article>
            </div>
          </div>
        </section>

        <section className="section-frame surface-section" id="surfaces">
          <SectionHeading
            title="重点风险、剧本和证据集中查看。"
            body="选择攻击面即可查看风险等级、样本证据和对应策略。"
          />

          <div className="metric-strip" aria-label="核心覆盖数据">
            {metrics.map((item) => (
              <div className="metric-strip__item" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
                <small>{item.note}</small>
              </div>
            ))}
          </div>

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
                  <span className={`risk risk--${item.level}`}>{riskLabels[item.level]}</span>
                </button>
              ))}
            </div>

            <article className="surface-detail">
              <div className="surface-detail__head">
                <span className={`risk risk--${surface.level}`}>{riskLabels[surface.level]}</span>
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
            title="事件、来源、风险和动作一眼可见。"
            body="控制台保留真正需要扫描的信息，并提供标准事件入口、策略闸门和审计输出。"
          />
          <ProductPreview />
          <div className="integration-flow">
            <FlowItem icon={<TerminalSquare size={21} />} title="标准事件入口" body="接收工具名、参数、上下文来源和任务目标。" />
            <FlowItem icon={<LockKeyhole size={21} />} title="策略前置闸门" body="在真实工具执行前完成评分、拒绝、询问或隔离。" />
            <FlowItem icon={<FileText size={21} />} title="审计报告输出" body="生成参数快照、复核链路和接入验收材料。" />
          </div>
        </section>

        <section className="final-cta" id="start">
          <div>
            <h2>进入控制台，运行攻击剧本和监督策略。</h2>
            <p>官网负责说明重点，完整操作、接口和证据都在控制台与文档中。</p>
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
        <strong>智安哨</strong>
      </a>

      <div className="header-actions">
        <a className="button button--small button--primary" href={consoleUrl}>
          进入控制台
        </a>
      </div>
    </header>
  );
}

function SectionNavigator({
  activeSection,
  onNavigate
}: {
  activeSection: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav className="section-nav" aria-label="页面分区导航">
      {pageSections.map((item) => {
        const isActive = item.id === activeSection;
        return (
          <button
            type="button"
            key={item.id}
            className={isActive ? 'is-active' : ''}
            onClick={() => onNavigate(item.id)}
            aria-current={isActive ? 'location' : undefined}
            aria-label={`前往${item.label}`}
          >
            <span className="section-nav__label">{item.label}</span>
            <span className="section-nav__dot" aria-hidden="true" />
          </button>
        );
      })}
    </nav>
  );
}

function SectionHeading({ title, body }: { title: string; body: string }) {
  return (
    <div className="section-heading">
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
          事件
        </span>
        <span>
          <GitBranch size={17} />
          策略
        </span>
        <span>
          <Zap size={17} />
          动作
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
