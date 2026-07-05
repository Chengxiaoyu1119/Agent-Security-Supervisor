import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, Github, Moon, Play, ShieldCheck, Sun } from 'lucide-react';

type ThemeMode = 'light' | 'dark';

type CardItem = {
  title: string;
  body: string;
  meta?: string;
};

const consoleUrl =
  import.meta.env.VITE_AGENT_SUPERVISOR_CONSOLE_URL ??
  (import.meta.env.PROD ? 'https://xa.chengxiaoyu.top:46858' : 'http://127.0.0.1:5178');

const docsUrl =
  import.meta.env.VITE_AGENT_SUPERVISOR_DOCS_URL ??
  (import.meta.env.PROD ? 'https://docs.xa.chengxiaoyu.top:46858' : 'http://127.0.0.1:3000');

const repoUrl = 'https://github.com/Chengxiaoyu1119/agent-security-supervisor';

const gateCards: CardItem[] = [
  { title: '请求来源', body: '外部任务、邮件、文档、API 调用先进入统一入口。', meta: '上下文标记' },
  { title: '风险判定', body: '来源、工具、参数和策略命中合成一次执行前判断。', meta: '策略命中 3 项' },
  { title: '执行动作', body: '阻断、复核、隔离或放行都会形成审计记录。', meta: '动作可回放' }
];

const evidenceCards: CardItem[] = [
  { title: '参数快照', body: '记录工具名、调用参数、目标路径和调用来源。', meta: 'arg_12c8' },
  { title: '策略命中', body: '把来源隔离、敏感路径和批量外发规则串起来。', meta: 'policy trace' },
  { title: '复核结论', body: '输出阻断原因、复核建议和可交付证据链。', meta: 'review ready' }
];

const surfaceCards: CardItem[] = [
  { title: '提示注入', body: '识别不可信文本试图覆盖系统规则的行为。', meta: '3 脚本' },
  { title: '工具劫持', body: '拦截危险工具参数、路径越界和伪造返回。', meta: '4 脚本' },
  { title: '数据泄露', body: '检测批量读取、外发目标和敏感资源访问。', meta: '18 样本' },
  { title: '记忆中毒', body: '复核长期记忆写入，避免后续任务被污染。', meta: '2 脚本' }
];

const storyCards: CardItem[] = [
  { title: '事件进入', body: '把工具名、参数、上下文来源统一成标准事件。', meta: '01' },
  { title: '策略融合', body: '策略命中、异常评分和敏感资源共同参与判断。', meta: '02' },
  { title: '证据输出', body: '生成参数快照、动作结论和复核链路。', meta: '03' }
];

const productCards: CardItem[] = [
  { title: '标准事件入口', body: '控制台接收工具名、参数和上下文来源。', meta: 'event' },
  { title: '策略前置闸门', body: '执行前完成评分、阻断、询问或隔离。', meta: 'policy' },
  { title: '审计报告输出', body: '生成复核链路和接入验收材料。', meta: 'report' }
];

export function App() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [storyIndex, setStoryIndex] = useState(0);

  useEffect(() => {
    const stored = window.localStorage.getItem('agent-supervisor-theme') as ThemeMode | null;
    const preferred: ThemeMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(stored === 'light' || stored === 'dark' ? stored : preferred);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('agent-supervisor-theme', theme);
  }, [theme]);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-fx]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-inview', entry.isIntersecting);
        });
      },
      { rootMargin: '-18% 0px -18% 0px', threshold: 0.18 }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;

    const updateHeroMotion = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const progress = Math.min(1, scrollY / Math.max(1, window.innerHeight * 0.92));
        const root = document.documentElement;

        root.style.setProperty('--hero-y', `${progress * -26}px`);
        root.style.setProperty('--hero-scale', `${1 - progress * 0.035}`);
        root.style.setProperty('--hero-opacity', `${1 - progress * 0.18}`);
        root.style.setProperty('--bg-shift', `${scrollY * -0.035}px`);
      });
    };

    updateHeroMotion();
    window.addEventListener('scroll', updateHeroMotion, { passive: true });
    window.addEventListener('resize', updateHeroMotion);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateHeroMotion);
      window.removeEventListener('resize', updateHeroMotion);
    };
  }, []);

  useEffect(() => {
    const updateStory = () => {
      const section = document.querySelector<HTMLElement>('[data-story-scroll]');
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - window.innerHeight)));
      setStoryIndex(Math.min(storyCards.length - 1, Math.floor(progress * storyCards.length)));
    };

    updateStory();
    window.addEventListener('scroll', updateStory, { passive: true });
    window.addEventListener('resize', updateStory);

    return () => {
      window.removeEventListener('scroll', updateStory);
      window.removeEventListener('resize', updateStory);
    };
  }, []);

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return (
    <div className="site-shell">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <FoliaBackground />

      <main>
        <section className="landing-section hero-section" id="top" data-scroll-fx>
          <div className="hero-center">
            <p className="hero-kicker">LLM Agent Attack Lab</p>
            <h1>智安哨</h1>
            <p className="hero-subtitle">把智能体每一次工具调用变成可审计、可阻断、可回放的安全链路。</p>
            <div className="hero-actions">
              <a className="site-button site-button--primary" href={consoleUrl}>
                <Play size={18} />
                进入控制台
              </a>
              <a className="site-button site-button--soft" href={docsUrl}>
                查看文档
              </a>
              <a className="site-button site-button--link" href={repoUrl} target="_blank" rel="noreferrer">
                GitHub 仓库
              </a>
            </div>
          </div>
        </section>

        <FeatureSection
          eyebrow="调用前置闸门"
          title={
            <>
              工具执行前，
              <br />
              先过安全闸门。
            </>
          }
          body="外部 Agent、邮件、文件、API 和代码执行请求进入真实工具前，先由智安哨统一整理上下文、识别来源、计算风险并输出动作。"
          visual={<ReferenceCardStack cards={gateCards} tone="gate" />}
        />

        <FeatureSection
          eyebrow="审计链路"
          title={
            <>
              判定不是黑盒，
              <br />
              每一步都能回放。
            </>
          }
          body="策略命中、异常评分、参数快照和最终动作会串成一条证据链，演示、验收、复盘时不用再从日志里拼答案。"
          visual={<ReferenceCardStack cards={evidenceCards} tone="evidence" />}
          reverse
        />

        <FeatureSection
          eyebrow="攻防覆盖"
          title={
            <>
              攻击脚本、
              <br />
              样本和策略放在一起。
            </>
          }
          body="提示注入、工具调用劫持、数据泄露、记忆中毒等攻击面都能和脚本、样本、策略一一对应，适合做红队实验和防护验收。"
          visual={<ReferenceCardStack cards={surfaceCards} tone="surface" />}
        />

        <section className="landing-section sticky-story" data-story-scroll data-story-index={storyIndex}>
          <div className="story-pin">
            <div className="story-copy">
              <p>{storyCards[storyIndex].title}</p>
              <h2>滚动时，监督链路逐步展开。</h2>
              <p>{storyCards[storyIndex].body}</p>
              <div className="story-dots" aria-hidden="true">
                {storyCards.map((item, index) => (
                  <span key={item.title} className={index === storyIndex ? 'active' : ''} />
                ))}
              </div>
            </div>
            <ReferenceCardStack cards={storyCards} activeIndex={storyIndex} tone="story" />
          </div>
        </section>

        <FeatureSection
          eyebrow="产品工作台"
          title={
            <>
              从官网理解，
              <br />
              到控制台执行。
            </>
          }
          body="官网负责讲清楚判断逻辑；控制台负责跑攻击脚本、看实时事件、调策略和导出报告。"
          visual={<ReferenceCardStack cards={productCards} tone="product" />}
          reverse
        />

        <section className="landing-section final-section" data-scroll-fx>
          <div className="final-copy">
            <p>Ready for Lab</p>
            <h2>开始运行一次真实的工具调用监督实验。</h2>
            <div className="hero-actions">
              <a className="site-button site-button--primary" href={consoleUrl}>
                进入控制台
                <ArrowRight size={18} />
              </a>
              <a className="site-button site-button--soft" href={docsUrl}>
                打开接入文档
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Header({ theme, onToggleTheme }: { theme: ThemeMode; onToggleTheme: () => void }) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="智安哨官网首页">
        <img src="/favicon.svg" alt="" />
        <span>智安哨</span>
      </a>

      <div className="header-tools">
        <button
          className="theme-toggle"
          type="button"
          role="switch"
          aria-label="切换深浅色模式"
          aria-checked={theme === 'dark'}
          onClick={onToggleTheme}
        >
          <span className="theme-toggle__track" aria-hidden="true">
            <span className="theme-toggle__thumb">
              <Sun className="theme-toggle__icon theme-toggle__icon--sun" size={12} />
              <Moon className="theme-toggle__icon theme-toggle__icon--moon" size={12} />
            </span>
          </span>
        </button>
        <span className="header-tools__divider" aria-hidden="true" />
        <a className="header-icon-link" href={repoUrl} target="_blank" rel="noreferrer" aria-label="打开 GitHub 仓库">
          <Github size={20} />
        </a>
        <a className="header-action" href={consoleUrl}>
          控制台
        </a>
      </div>
    </header>
  );
}

function FoliaBackground() {
  return (
    <div className="folia-background" aria-hidden="true">
      <div className="bg-word bg-word-a">工具调用要留痕</div>
      <div className="bg-word bg-word-b">风险先判定</div>
      <div className="bg-word bg-word-c">证据可回放</div>
      <span className="geo geo-circle" />
      <span className="geo geo-square" />
      <span className="geo geo-triangle" />
      <span className="geo geo-dots" />
      <span className="geo geo-ring" />
      <span className="star star-a" />
      <span className="star star-b" />
      <span className="star star-c" />
    </div>
  );
}

function FeatureSection({
  eyebrow,
  title,
  body,
  visual,
  reverse = false
}: {
  eyebrow: string;
  title: ReactNode;
  body: string;
  visual: ReactNode;
  reverse?: boolean;
}) {
  const id =
    eyebrow === '调用前置闸门'
      ? 'gate'
      : eyebrow === '审计链路'
        ? 'evidence'
        : eyebrow === '攻防覆盖'
          ? 'surface'
          : 'console';

  return (
    <section className={`landing-section feature-section ${reverse ? 'reverse' : ''}`} id={id} data-scroll-fx>
      <div className="feature-copy">
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      <div className="feature-visual">{visual}</div>
    </section>
  );
}

function ReferenceCardStack({
  cards,
  tone,
  activeIndex = 0
}: {
  cards: CardItem[];
  tone: string;
  activeIndex?: number;
}) {
  return (
    <div className={`reference-card-stack reference-card-stack--${tone}`} aria-label="信息卡片">
      {cards.map((card, index) => (
        <article
          className={`reference-card reference-card-${index + 1} ${index === activeIndex ? 'active' : ''}`}
          key={card.title}
        >
          <small>{card.meta}</small>
          <strong>{card.title}</strong>
          <p>{card.body}</p>
          {index === activeIndex ? (
            <span>
              <CheckCircle2 size={15} />
              当前重点
            </span>
          ) : null}
        </article>
      ))}
      <ShieldCheck className="reference-card-mark" size={38} aria-hidden="true" />
    </div>
  );
}
