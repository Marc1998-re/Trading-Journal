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

const pricingTiers = [
  {
    name: 'Starter',
    price: '€0',
    description: 'For testing the workflow and building the first trade history.',
    features: ['Trade ledger', 'Monthly dashboard', 'CSV export', 'Single-user workspace'],
  },
  {
    name: 'Pro',
    price: '€9',
    description: 'For active traders who want a serious weekly review process.',
    features: ['Advanced analytics', 'Risk pulse', 'Equity curve', 'Multiple accounts'],
    highlighted: true,
  },
  {
    name: 'Desk',
    price: '€19',
    description: 'For traders who want deeper review and a more complete performance workspace.',
    features: ['Performance lab', 'Visual analytics', 'Priority roadmap', 'Extended exports'],
  },
];

const faqItems = [
  ['Is this only for forex?', 'No. The journal is built around execution quality, risk and R-multiple, so it can support forex, indices, crypto and other active trading workflows.'],
  ['Can I use multiple accounts?', 'Yes. The app already supports account-based views so performance can be reviewed per account or across all accounts.'],
  ['Can I export my data?', 'Yes. Trades can be exported as CSV, including filtered histories.'],
  ['What makes it different from a spreadsheet?', 'It combines structured trade capture, screenshots, account scope, dashboard metrics and visual analytics in one product experience.'],
];

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
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <p className="section-kicker mb-3">Inside the journal</p>
                <h2 className="text-3xl font-black md:text-5xl">A clear view of what users get</h2>
                <p className="mt-5 leading-8 text-muted-foreground">
                  Screens, metrics and workflows stay close together, so traders understand the value before creating an account.
                </p>
                <div className="mt-8 space-y-3">
                  {['Trade entry with context links', 'Dashboard with risk and equity metrics', 'Charts for distribution and time-based performance'].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span className="font-semibold">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {[
                  ['Detailed trade logging', 'https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/fd915ba37aa320362b3d57b8fa1f0586.png'],
                  ['Advanced analytics', 'https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/02e5bade5b08a1f4962edb18a8c254cd.png'],
                  ['Visual insights', 'https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/3c315c1c83632994cad0441825a6842e.png'],
                ].map(([title, src]) => (
                  <div key={title} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex h-64 w-full items-center justify-center rounded-md bg-muted/40 p-2">
                      <img src={src} alt={`${title} preview`} className="h-full w-full object-contain" />
                    </div>
                    <p className="mt-3 px-1 text-sm font-bold">{title}</p>
                  </div>
                ))}
              </div>
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
            <div className="mb-12 max-w-3xl">
              <p className="section-kicker mb-3">Pricing</p>
              <h2 className="mb-4 text-3xl font-black md:text-5xl">Simple plans for different review habits</h2>
              <p className="text-lg leading-8 text-muted-foreground">
                Start free, then upgrade when advanced analytics and multi-account review become part of the weekly process.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-lg border p-6 ${tier.highlighted ? 'border-primary/40 bg-primary/10 shadow-xl shadow-primary/10' : 'border-border bg-card'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-black text-primary">{tier.name}</p>
                    {tier.highlighted && (
                      <span className="rounded-md border border-primary/30 bg-primary/15 px-2 py-1 text-xs font-bold text-primary">Popular</span>
                    )}
                  </div>
                  <p className="mt-4 text-4xl font-black">
                    {tier.price}<span className="text-sm font-semibold text-muted-foreground"> / month</span>
                  </p>
                  <p className="mt-4 min-h-[72px] text-sm leading-6 text-muted-foreground">{tier.description}</p>
                  <div className="mt-6 space-y-3">
                    {tier.features.map((item) => (
                      <div key={item} className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Link to="/signup">
                    <Button className="mt-8 w-full font-bold" variant={tier.highlighted ? 'default' : 'outline'}>
                      Choose {tier.name}
                    </Button>
                  </Link>
                </div>
              ))}
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
