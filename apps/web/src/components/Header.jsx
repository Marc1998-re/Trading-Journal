import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, ChartNoAxesCombined, Activity, NotebookPen, Settings, LogOut, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AccountSwitcher from '@/components/AccountSwitcher';
import { Button } from '@/components/ui/button';
import ThemeSwitch from '@/components/journal/ThemeSwitch';
import { useNavigationGuard } from '@/contexts/NavigationGuardContext';

export default function Header() {
  const { confirmNavigation }=useNavigationGuard();
  const { currentUser, logout }=useAuth();
  const {pathname}=useLocation();
  const navigate=useNavigate();
  const demo=pathname.startsWith('/demo');
  const workspace=demo || (!!currentUser && ['/home','/dashboard','/trades','/analysis','/charts','/review','/settings'].includes(pathname));
  const links=[['Übersicht','/home',LayoutDashboard],['Trade-Journal','/trades',List],['Analyse','/analysis',ChartNoAxesCombined],['Verläufe','/charts',Activity],['Review','/review',NotebookPen]];
  const pathFor=path=>demo?(path==='/home'?'/demo':'/demo'+path):path;
  const activeName = links.find(([, path]) => pathFor(path) === pathname)?.[0] || 'Einstellungen';
  const brand=<Link to={workspace?pathFor('/home'):'/'} className="journal-brand"><span className="brand-mark">TD<span>/</span></span><span>The<br/><strong>Trading Desk</strong></span></Link>;
  if(!workspace)return <header className={`public-header${pathname==='/'?' landing-header':''}`}>{brand}<nav aria-label="Hauptnavigation">{pathname==='/'?<><Link to="#journal" className="landing-nav-link hidden sm:inline">Das Journal</Link><Link to="#methode" className="landing-nav-link hidden md:inline">Die Idee dahinter</Link><Link to="#fragen" className="landing-nav-link hidden lg:inline">Fragen</Link></>:<Link to="/demo" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground">Journal ansehen</Link>}<Button asChild variant="ghost"><Link to="/login">Einloggen</Link></Button><Button asChild><Link to="/signup">Kostenlos starten<ArrowUpRight/></Link></Button></nav></header>;
  return <>
    <aside className="journal-sidebar">{brand}<p className="sidebar-label">DEIN ARBEITSPLATZ</p><nav aria-label="Journal">{links.map(([name,path,Icon],index)=><NavLink key={path} to={pathFor(path)} end className={({isActive})=>'sidebar-link'+(isActive?' is-active':'')}><Icon size={17}/><span>{name}</span><span className="nav-index" aria-hidden="true">{String(index+1).padStart(2,'0')}</span></NavLink>)}</nav>
      <div className="sidebar-bottom">{demo?<><span className="demo-label">Interaktive Demo</span><p className="text-xs text-muted-foreground leading-relaxed mt-3 mb-4">Fiktive Trades. Echte Berechnungen.</p><Button asChild className="w-full"><Link to="/signup">Eigenes Journal starten<ArrowUpRight/></Link></Button></>:<><AccountSwitcher/><NavLink to="/settings" className="sidebar-link"><Settings size={17}/>Einstellungen</NavLink><button className="sidebar-link w-full" onClick={()=>{if(!confirmNavigation())return;logout();navigate('/');}}><LogOut size={17}/>Abmelden</button></>}
      <div className="sidebar-caption">Ein Trade. Eine Erkenntnis.</div></div>
    </aside>
    <header className="workspace-header"><div className="workspace-breadcrumb"><Link to="/">The Trading Desk</Link><span aria-hidden="true">/</span><span>{activeName}</span></div><div className="flex items-center gap-4">{demo&&<span className="demo-label">Interaktive Demo</span>}<ThemeSwitch/></div></header>
    <header className="workspace-mobile-header">{brand}<ThemeSwitch/></header>
    {!demo&&<div className="workspace-mobile-account"><AccountSwitcher isMobile/></div>}
    <nav className="mobile-bottom-nav" aria-label="Mobile Journalnavigation">{links.map(([name,path,Icon],index)=><NavLink key={path} end to={pathFor(path)} className={({isActive})=>isActive?'is-active':''}><Icon size={19}/><span>{name==='Trade-Journal'?'Trades':name}</span></NavLink>)}</nav>
  </>;
}
