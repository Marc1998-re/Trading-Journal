import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, CheckCircle2, Gauge, ShieldCheck, Target, TrendingUp } from 'lucide-react';

/**
 * HomePage Component
 */

const HomePage = () => {
  return <>
      <Helmet>
        <title>Trading Journal - Track and analyze your trades</title>
        <meta name="description" content="Professional trading journal for tracking trades, analyzing performance, and improving your trading strategy" />
      </Helmet>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative min-h-[92dvh] flex items-center overflow-hidden border-b border-border">
          <div className="absolute inset-0 z-0">
            <img src="https://images.unsplash.com/photo-1640340435016-1964cf4e723b" alt="Professional trading dashboard with financial charts and market data" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/42"></div>
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl pt-10">
              <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary mb-6">
                <BarChart3 className="w-4 h-4" />
                Professional trading journal
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.03] mb-6">
                Trade review that looks and feels professional
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">
                A premium workspace for tracking risk, execution quality and performance without burying traders in spreadsheet noise.
            </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/signup">
                  <Button size="lg" className="gap-2 text-base px-7">
                    Start journaling
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="text-base px-7 bg-card/80">
                    Login
                  </Button>
                </Link>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-3 max-w-2xl">
                <div className="border border-border bg-card/85 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-success">+8.4%</p>
                  <p className="text-xs text-muted-foreground mt-1">sample return</p>
                </div>
                <div className="border border-border bg-card/85 p-4 rounded-lg">
                  <p className="text-2xl font-bold">56.8%</p>
                  <p className="text-xs text-muted-foreground mt-1">sample win rate</p>
                </div>
                <div className="border border-border bg-card/85 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-primary">1.74</p>
                  <p className="text-xs text-muted-foreground mt-1">sample factor</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="max-w-3xl mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for daily trade review</h2>
              <p className="text-lg text-muted-foreground">
                The interface keeps data readable, decisions traceable and performance metrics close to the trades that created them.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-12">
              <div className="border border-border bg-card rounded-lg p-6">
                <Target className="w-5 h-5 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">Structured logging</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Capture symbol, timing, stop size, R-multiple, commission and review notes without leaving the workflow.
                </p>
              </div>
              <div className="border border-border bg-card rounded-lg p-6">
                <TrendingUp className="w-5 h-5 text-success mb-4" />
                <h3 className="text-xl font-semibold mb-3">Performance clarity</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Review net P&L, risk, win rate, profit factor and drawdown with calm, scan-friendly metrics.
                </p>
              </div>
              <div className="border border-border bg-card rounded-lg p-6">
                <ShieldCheck className="w-5 h-5 text-info mb-4" />
                <h3 className="text-xl font-semibold mb-3">Private by design</h3>
                <p className="text-muted-foreground leading-relaxed">
                  User-specific PocketBase rules keep accounts, trades and settings scoped to the authenticated trader.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr] mb-12">
              <div className="command-panel rounded-lg p-6 md:p-8">
                <p className="section-kicker mb-3">For serious review</p>
                <h3 className="text-2xl md:text-3xl font-black mb-4">A cleaner alternative to scattered notes, screenshots and spreadsheet tabs</h3>
                <p className="text-muted-foreground leading-7 mb-6">
                  The app brings every trade into one audit trail: risk before entry, outcome after exit and monthly performance after review.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    ['Execution', 'Every trade gets context, timing and R-multiple.'],
                    ['Risk', 'Stop size, commission and drawdown stay visible.'],
                    ['Review', 'Charts and analytics connect behavior to outcome.'],
                  ].map(([title, copy]) => (
                    <div key={title} className="rounded-md border border-white/10 bg-black/20 p-4">
                      <p className="font-black">{title}</p>
                      <p className="mt-2 text-sm leading-5 text-muted-foreground">{copy}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-panel rounded-lg p-6 md:p-8">
                <Gauge className="w-6 h-6 text-primary mb-5" />
                <p className="section-kicker mb-3">Product standard</p>
                <div className="space-y-4">
                  {['Mobile-ready interface', 'Private user accounts', 'Exportable trade history', 'Net P/L after commission'].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span className="text-sm font-semibold">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                ['Detailed trade logging', 'https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/fd915ba37aa320362b3d57b8fa1f0586.png'],
                ['Advanced analytics', 'https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/02e5bade5b08a1f4962edb18a8c254cd.png'],
                ['Visual insights', 'https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/3c315c1c83632994cad0441825a6842e.png'],
              ].map(([title, src]) => (
                <div key={title} className="border border-border bg-card rounded-lg p-3">
                  <div className="bg-muted/40 rounded-md flex items-center justify-center p-2 h-64 w-full">
                    <img src={src} alt={`${title} preview`} className="w-full h-full object-contain" />
                  </div>
                  <p className="text-sm font-semibold mt-3 px-1">{title}</p>
                </div>
              ))}
              </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8 border-y border-border bg-black/20">
          <div className="container mx-auto max-w-7xl">
            <div className="max-w-3xl mb-12">
              <p className="section-kicker mb-3">Pricing direction</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Built to become a paid journal</h2>
              <p className="text-lg text-muted-foreground">
                The interface is prepared for a simple commercial model. Payment handling still needs to be connected separately.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                ['Starter', '€0', 'Personal trade tracking while testing the workflow.', ['Trade ledger', 'Monthly dashboard', 'CSV export']],
                ['Pro', '€9', 'The paid tier for active traders who review weekly.', ['Advanced analytics', 'Risk pulse', 'Equity curve']],
                ['Desk', '€19', 'A higher tier for multiple accounts and deeper review.', ['Multi-account view', 'Performance lab', 'Priority roadmap']],
              ].map(([name, price, copy, items]) => (
                <div key={name} className={`rounded-lg border p-6 ${name === 'Pro' ? 'border-primary/40 bg-primary/10 shadow-xl shadow-primary/10' : 'border-border bg-card'}`}>
                  <p className="text-sm font-bold text-primary">{name}</p>
                  <p className="mt-4 text-4xl font-black">{price}<span className="text-sm font-semibold text-muted-foreground"> / month</span></p>
                  <p className="mt-4 min-h-[48px] text-sm leading-6 text-muted-foreground">{copy}</p>
                  <div className="mt-6 space-y-3">
                    {items.map((item) => (
                      <div key={item} className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card border-y border-border">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Launch with a journal that can grow into a paid product</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Bring structure to the review process and keep every trading decision tied to measurable outcomes.
            </p>
            <Link to="/signup">
              <Button size="lg" className="gap-2 text-base px-8">
                Create account
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>;
};
export default HomePage;
