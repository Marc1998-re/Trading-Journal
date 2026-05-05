import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, ShieldCheck, Target, TrendingUp } from 'lucide-react';

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
                Professional trading analytics
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.03] mb-6">
                Trading analytics without the noise
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">
                Track risk, execution quality and monthly performance in one focused journal built for disciplined review.
            </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/signup">
                  <Button size="lg" className="gap-2 text-base px-7">
                    Start tracking
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
                  <p className="text-xs text-muted-foreground mt-1">monthly return</p>
                </div>
                <div className="border border-border bg-card/85 p-4 rounded-lg">
                  <p className="text-2xl font-bold">56.8%</p>
                  <p className="text-xs text-muted-foreground mt-1">win rate</p>
                </div>
                <div className="border border-border bg-card/85 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-primary">1.74</p>
                  <p className="text-xs text-muted-foreground mt-1">profit factor</p>
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

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card border-y border-border">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Start tracking your trades today</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Bring structure to your review process and keep every trading decision tied to measurable outcomes.
            </p>
            <Link to="/signup">
              <Button size="lg" className="gap-2 text-base px-8">
                Create free account
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>;
};
export default HomePage;
