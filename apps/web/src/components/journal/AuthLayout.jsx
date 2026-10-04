import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowUpRight } from 'lucide-react';

export default function AuthLayout({ title, subtitle, children }) {
  return <>
    <Helmet><title>{title} · The Trading Desk</title><meta name="referrer" content="no-referrer"/></Helmet>
    <div className="auth-layout">
      <section className="auth-form"><p className="text-primary font-mono text-xs mb-4">THE TRADING DESK / ZUGANG</p><h1>{title}</h1>{subtitle && <p className="mt-3 mb-7 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}{children}</section>
      <aside className="auth-aside hidden lg:block">
        <img className="auth-market-image" src="/assets/market-study.webp" alt="" width="1440" height="820"/>
        <div className="auth-note"><p className="text-xs text-primary font-mono mb-4">RISIKO / MUSTER / ENTWICKLUNG</p><h2>Strukturiert denken.<br/><span className="text-primary">Diszipliniert handeln.</span></h2><p className="text-muted-foreground text-sm leading-relaxed max-w-sm">Deine Trades, ihre Risikobasis und deine Erkenntnisse. An einem Arbeitsplatz.</p><Link to="/demo" className="inline-flex items-center gap-3 mt-6 text-sm text-primary">Das Journal ausprobieren <ArrowUpRight size={16}/></Link></div>
      </aside>
    </div>
  </>;
}
