import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

/**
 * HomePage Component
 */

const HomePage = () => {
  return <>
      <Helmet>
        <title>Trading Journal - Track and analyze your trades</title>
        <meta name="description" content="Professional trading journal for tracking trades, analyzing performance, and improving your trading strategy" />
      </Helmet>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src="https://images.unsplash.com/photo-1640340435016-1964cf4e723b" alt="Professional trading dashboard with financial charts and market data" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{
            letterSpacing: '-0.02em'
          }}>
              Master your trading with data-driven insights
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Track every trade, analyze your performance, and make informed decisions with our professional trading journal. 
From Traders for Traders
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="gap-2 text-base px-8">
                  <TrendingUp className="w-5 h-5" />
                  Get started
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-base px-8">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to improve</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive tools designed for serious traders
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-12">
              <div className="order-2 md:order-1">
                <h3 className="text-2xl font-semibold mb-3">Detailed trade logging</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Record every detail of your trades including entry, exit, stop loss, risk-reward ratios, and attach screenshots for future reference
                </p>
              </div>
              <div className="order-1 md:order-2 bg-card rounded-2xl p-3 sm:p-4 border border-border shadow-sm">
                <div className="bg-muted/40 rounded-lg flex items-center justify-center p-2 sm:p-3 h-56 sm:h-64 w-full">
                  <img src="https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/fd915ba37aa320362b3d57b8fa1f0586.png" alt="Trade entry form interface showing Symbol, Entry Date, Entry Time, Stop Loss, Risk/Reward Ratio, Status dropdown, Commission, Context URL, Validation URL, Entry URL, Notes textarea, and Add Trade to Journal button" className="w-full h-full object-contain drop-shadow-sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-12">
              <div className="bg-card rounded-2xl p-3 sm:p-4 border border-border shadow-sm">
                <div className="bg-muted/40 rounded-lg flex items-center justify-center p-2 sm:p-3 h-56 sm:h-64 w-full">
                  <img src="https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/02e5bade5b08a1f4962edb18a8c254cd.png" alt="Advanced analytics dashboard showing balance tracking, profit and loss metrics, win/loss statistics, and comprehensive performance analysis with charts and data visualizations" className="w-full h-full object-contain drop-shadow-sm" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Advanced analytics</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Track win rate, profit factor, expected value, drawdowns, and many other critical metrics to understand your trading performance
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <h3 className="text-2xl font-semibold mb-3">Visual insights</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Visualize your equity curve, balance progression, and win/loss distribution with interactive charts to quickly identify patterns in your trading behavior.
                </p>
              </div>
              <div className="order-1 md:order-2 bg-card rounded-2xl p-3 sm:p-4 border border-border shadow-sm">
                <div className="bg-muted/40 rounded-lg flex items-center justify-center p-2 sm:p-3 h-56 sm:h-64 w-full">
                  <img src="https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/3c315c1c83632994cad0441825a6842e.png" alt="Visual insights dashboard showing interactive charts with equity curve, balance progression, and win/loss distribution for trading performance analysis" className="w-full h-full object-contain drop-shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Start tracking your trades today</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join traders who are improving their performance with data-driven insights
            </p>
            <Link to="/signup">
              <Button size="lg" className="gap-2 text-base px-8">
                <TrendingUp className="w-5 h-5" />
                Create free account
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>;
};
export default HomePage;