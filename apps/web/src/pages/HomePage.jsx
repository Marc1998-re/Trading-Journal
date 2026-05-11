import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Download,
  Gauge,
  LineChart,
  LockKeyhole,
  NotebookPen,
  Radar,
  ShieldCheck,
} from 'lucide-react';

const productModules = [
  {
    title: 'Execution ledger',
    description: 'Log symbol, session, stop size, R-multiple, commission, screenshots and trade notes in one clean flow.',
    icon: <NotebookPen className="h-5 w-5" />,
  },
  {
    title: 'Command dashboard',
    description: 'See monthly net P/L, return, win rate, drawdown, expectancy and recent trades without opening a spreadsheet.',
    icon: <Gauge className="h-5 w-5" />,
  },
  {
    title: 'Performance lab',
    description: 'Analyze edge, risk profile, best and worst trades, average R and account-level performance.',
    icon: <Radar className="h-5 w-5" />,
  },
  {
    title: 'Visual analytics',
    description: 'Review equity curve, balance trajectory, outcome distribution and time-based trade behavior.',
    icon: <LineChart className="h-5 w-5" />,
  },
  {
    title: 'Private account scope',
    description: 'Keep accounts, trades and settings scoped to each authenticated user through PocketBase rules.',
    icon: <LockKeyhole className="h-5 w-5" />,
  },
  {
    title: 'CSV export',
    description: 'Download filtered trade history for backups, tax prep, external review or advanced analysis.',
    icon: <Download className="h-5 w-5" />,
  },
];

const workflowSteps = [
  ['01', 'Capture the setup', 'Record market, symbol, stop, R-plan, entry time and screenshot links before the trade becomes vague.'],
  ['02', 'Audit the execution', 'Track net result after commission and compare the outcome against your original risk.'],
  ['03', 'Review the pattern', 'Use dashboard, charts and analysis views to understand what actually drives your performance.'],
];

const faqItems = [
  ['Is this only for forex?', 'No. The journal is built around execution quality, risk and R-multiple, so it can support forex, indices, crypto and other active trading workflows.'],
  ['Can I use multiple accounts?', 'Yes. The app already supports account-based views so performance can be reviewed per account or across all accounts.'],
  ['Can I export my data?', 'Yes. Trades can be exported as CSV, including filtered histories.'],
  ['What makes it different from a spreadsheet?', 'It combines structured trade capture, screenshots, account scope, dashboard metrics and visual analytics in one product experience.'],
];

const productPreviews = [
  {
    title: 'Detailed trade logging',
    description: 'A structured entry workflow for risk, R-plan, timing and review context.',
    kind: 'logging',
  },
  {
    title: 'Advanced analytics',
    description: 'Edge metrics, symbol performance and account-level quality signals.',
    kind: 'analytics',
  },
  {
    title: 'Visual insights',
    description: 'Charts that make equity, outcomes and performance patterns easier to read.',
    kind: 'visuals',
  },
];

const ProductPreview = ({ kind }) => {
  if (kind === 'logging') {
    return (
      <div className="flex h-full flex-col rounded-md border border-white/10 bg-black/25 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="section-kicker mb-1">New execution</p>
            <p className="text-lg font-black">Trade Entry</p>
          </div>
          <NotebookPen className="h-5 w-5 text-primary" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Symbol', 'EUR/USD'],
            ['Entry', '12:30'],
            ['Risk', '1.0%'],
            ['Plan', '2.5R'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-white/10 bg-card/70 p-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
              <p className="mt-1.5 text-sm font-black">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-2.5 rounded-md border border-white/10 bg-card/70 p-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">Review notes</p>
          <div className="mt-2 space-y-1.5">
            <div className="h-2 rounded-full bg-white/20" />
            <div className="h-2 w-3/4 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-xs">
          <span className="font-bold text-primary">Ready to save</span>
          <span className="font-black text-primary">+2.5R plan</span>
        </div>
      </div>
    );
  }

  if (kind === 'analytics') {
    return (
      <div className="flex h-full min-h-0 flex-col rounded-md border border-white/10 bg-black/25 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="section-kicker mb-1">Performance lab</p>
            <p className="text-base font-black">Edge Quality</p>
          </div>
          <Radar className="h-5 w-5 text-primary" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Expectancy', '+0.24R', 'text-success'],
            ['Payoff', '1.82', 'text-primary'],
            ['Profit Factor', '1.74', 'text-foreground'],
            ['Max DD', '4.8%', 'text-destructive'],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-md border border-white/10 bg-card/70 p-2">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
              <p className={`mt-1 text-base font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-2.5 space-y-1.5">
          {[
            ['EUR/USD', '+€420'],
            ['NAS100', '+€310'],
            ['XAU/USD', '-€90'],
          ].map(([symbol, net]) => (
            <div key={symbol} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs">
              <span className="font-bold">{symbol}</span>
              <span className={`font-black ${net.startsWith('+') ? 'text-success' : 'text-destructive'}`}>{net}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-md border border-white/10 bg-black/25 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="section-kicker mb-1">Visual analytics</p>
          <p className="text-lg font-black">Equity & Outcomes</p>
        </div>
        <LineChart className="h-5 w-5 text-primary" />
      </div>
      <div className="rounded-md border border-white/10 bg-card/70 p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-bold text-muted-foreground">Balance curve</span>
          <span className="font-black text-success">+8.4%</span>
        </div>
        <div className="flex h-24 items-end gap-2">
          {[28, 36, 34, 52, 48, 66, 72, 88].map((height, index) => (
            <div key={index} className="flex-1 rounded-t-sm bg-primary/70" style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>
      <div className="mt-auto grid grid-cols-[72px_1fr] items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full border border-white/10" style={{ background: 'conic-gradient(hsl(var(--success)) 0 58%, hsl(var(--destructive)) 58% 82%, hsl(var(--info)) 82% 100%)' }}>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-background text-xs font-black">58%</div>
        </div>
        <div className="space-y-1.5 text-xs">
          {[
            ['Wins', '58%', 'bg-success'],
            ['Losses', '24%', 'bg-destructive'],
            ['BE', '18%', 'bg-info'],
          ].map(([label, value, color]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>
              <span className="font-black">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  return (
    <>
      <Helmet>
        <title>Marc's Trading Journal - Professional Trade Review</title>
        <meta
          name="description"
          content="Professional trading journal for logging trades, reviewing risk, analyzing performance and building a disciplined review workflow."
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <section className="relative min-h-[92dvh] overflow-hidden border-b border-border">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1640340435016-1964cf4e723b"
              alt="Professional trading dashboard with financial charts and market data"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/94 to-background/45" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
          </div>

          <div className="container relative z-10 mx-auto flex min-h-[92dvh] items-center px-4 py-24 sm:px-6 lg:px-8">
            <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.75fr)]">
              <div className="max-w-4xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
                  <BarChart3 className="h-4 w-4" />
                  Professional trading journal
                </div>
                <h1 className="text-5xl font-black leading-[0.98] tracking-normal sm:text-6xl lg:text-7xl">
                  Marc's Trading Journal
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                  A premium trade review workspace for logging executions, tracking risk, analyzing performance and building a repeatable review routine.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link to="/signup">
                    <Button size="lg" className="h-12 gap-2 px-7 text-base font-bold">
                      Start journaling
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="h-12 bg-card/80 px-7 text-base font-bold">
                      Login
                    </Button>
                  </Link>
                </div>
                <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                  {[
                    ['Risk-first', 'journal structure'],
                    ['Net P/L', 'after commission'],
                    ['CSV', 'export ready'],
                  ].map(([title, label]) => (
                    <div key={title} className="rounded-lg border border-border bg-card/85 p-4">
                      <p className="text-xl font-black text-foreground">{title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="command-panel hidden rounded-lg p-4 shadow-2xl lg:block">
                <div className="rounded-md border border-white/10 bg-black/25 p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="section-kicker mb-2">Live overview</p>
                      <p className="text-2xl font-black">Command Dashboard</p>
                    </div>
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['+8.4%', 'Return', 'text-success'],
                      ['1.74', 'Profit factor', 'text-primary'],
                      ['56.8%', 'Win rate', 'text-foreground'],
                      ['-3.2%', 'Max DD', 'text-destructive'],
                    ].map(([value, label, color]) => (
                      <div key={label} className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                        <p className={`text-3xl font-black ${color}`}>{value}</p>
                        <p className="mt-2 surface-label">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 h-32 rounded-md border border-white/10 bg-[linear-gradient(135deg,hsl(var(--primary)/0.16),transparent_55%,hsl(var(--accent)/0.12))] p-4">
                    <div className="flex h-full items-end gap-2">
                      {[32, 46, 38, 64, 58, 78, 72, 92].map((height, index) => (
                        <div key={index} className="flex-1 rounded-t-sm bg-primary/70" style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-black/20 px-4 py-6 sm:px-6 lg:px-8">
          <div className="container mx-auto grid max-w-7xl grid-cols-2 gap-3 md:grid-cols-4">
            {['Trade logging', 'Risk tracking', 'Analytics dashboard', 'Export workflow'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-12 max-w-3xl">
              <p className="section-kicker mb-3">Product overview</p>
              <h2 className="mb-4 text-3xl font-black md:text-5xl">Everything a serious trade review workflow needs</h2>
              <p className="text-lg leading-8 text-muted-foreground">
                The product is structured around the review habits traders actually need: capture clean data, understand risk, spot repeatable patterns and export records when needed.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {productModules.map((module) => (
                <div key={module.title} className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/30">
                  <div className="mb-5 grid h-11 w-11 place-items-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                    {module.icon}
                  </div>
                  <h3 className="text-xl font-black">{module.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{module.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card/45 px-4 py-24 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-12 max-w-3xl">
              <p className="section-kicker mb-3">Inside the journal</p>
              <h2 className="text-3xl font-black md:text-5xl">A clear view of what users get</h2>
              <p className="mt-5 leading-8 text-muted-foreground">
                Screens, metrics and workflows stay close together, so traders understand the value before creating an account.
              </p>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
              {['Trade entry with context links', 'Dashboard with risk and equity metrics', 'Charts for distribution and time-based performance'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-md border border-white/10 bg-black/20 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                  <span className="text-sm font-semibold">{item}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {productPreviews.map((preview) => (
                <div key={preview.title} className="command-panel overflow-hidden rounded-lg p-0">
                  <div className="border-b border-white/10 p-5">
                    <p className="section-kicker mb-2">Product preview</p>
                    <h3 className="text-xl font-black">{preview.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{preview.description}</p>
                  </div>
                  <div className="h-[360px] w-full bg-muted/20 p-4">
                    <ProductPreview kind={preview.kind} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-12 max-w-3xl">
              <p className="section-kicker mb-3">Review workflow</p>
              <h2 className="mb-4 text-3xl font-black md:text-5xl">From trade capture to performance improvement</h2>
              <p className="text-lg leading-8 text-muted-foreground">
                The workflow turns raw executions into structured trading data that can be reviewed after every session.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {workflowSteps.map(([step, title, copy]) => (
                <div key={step} className="command-panel rounded-lg p-6">
                  <p className="text-sm font-black text-primary">{step}</p>
                  <h3 className="mt-5 text-2xl font-black">{title}</h3>
                  <p className="mt-4 leading-7 text-muted-foreground">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-black/20 px-4 py-24 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="command-panel overflow-hidden rounded-lg">
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="p-6 sm:p-8 lg:p-10">
                  <p className="section-kicker mb-3">Early access</p>
                  <h2 className="mb-5 text-3xl font-black md:text-5xl">Currently free to use</h2>
                  <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                    Marc's Trading Journal is currently available for free while the product is being refined. You can use the core workflow now, but access may not remain free forever as the journal grows.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link to="/signup">
                      <Button className="w-full gap-2 px-6 py-6 text-base font-bold sm:w-auto">
                        Start for free
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button className="w-full px-6 py-6 text-base font-bold sm:w-auto" variant="outline">
                        Log in
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="border-t border-white/10 bg-black/20 p-6 sm:p-8 lg:border-l lg:border-t-0">
                  <p className="section-kicker mb-5">Included now</p>
                  <div className="space-y-4">
                    {[
                      ['Full journal workflow', 'Trade logging, dashboards, charts and analysis views are currently included.'],
                      ['Open product phase', 'Feedback can still shape what gets improved next.'],
                      ['Transparent future pricing', 'If pricing changes later, it should be clear before it affects users.'],
                    ].map(([title, copy]) => (
                      <div key={title} className="flex gap-3">
                        <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" />
                        <div>
                          <p className="font-black">{title}</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-12 max-w-3xl">
              <p className="section-kicker mb-3">Questions</p>
              <h2 className="text-3xl font-black md:text-5xl">What visitors need to know before signing up</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {faqItems.map(([question, answer]) => (
                <div key={question} className="rounded-lg border border-border bg-card p-6">
                  <h3 className="text-lg font-black">{question}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card px-4 py-20 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <p className="section-kicker mb-3">Start now</p>
            <h2 className="mb-6 text-3xl font-black md:text-5xl">Build a cleaner trade review process today</h2>
            <p className="mb-8 max-w-2xl text-lg leading-8 text-muted-foreground">
              Replace scattered notes with a focused workspace for decisions, risk and measurable performance.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/signup">
                <Button size="lg" className="gap-2 px-8 text-base font-bold">
                  Create account
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="px-8 text-base font-bold">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
