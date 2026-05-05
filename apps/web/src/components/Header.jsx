import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { LineChart, Activity, Settings, LogOut, Menu, Home, BarChart3, ShieldCheck } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import AccountSwitcher from '@/components/AccountSwitcher.jsx';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Command', path: '/home', icon: Home },
    { name: 'Trades', path: '/trades', icon: Activity },
    { name: 'Analysis', path: '/analysis', icon: LineChart },
  ];

  const NavLinks = ({ mobile = false }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (item.path === '/analysis' && location.pathname === '/charts');
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`group flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? 'border-primary/40 bg-primary/15 text-primary shadow-sm shadow-primary/10'
                : 'border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/[0.04] hover:text-foreground'
            } ${mobile ? 'w-full justify-start text-base py-3' : ''}`}
          >
            <Icon className="w-4 h-4" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/82 backdrop-blur-xl transition-theme">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 min-h-16 items-center justify-between gap-4 py-3">
          <div className="flex min-w-0 items-center gap-5 md:gap-8">
            <Link to="/" className="flex min-w-0 items-center gap-3 transition-colors hover:text-primary active:text-primary">
              <div className="relative grid h-10 w-10 place-items-center rounded-md border border-primary/30 bg-primary/15 text-primary shadow-lg shadow-primary/10">
                <BarChart3 className="w-5 h-5" />
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_18px_hsl(var(--accent))]" />
              </div>
              <div className="hidden sm:block leading-tight">
                <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-primary">JournalOS</span>
                <span className="block truncate text-base font-bold text-foreground">Marc's Trading Desk</span>
              </div>
            </Link>

            {currentUser && (
              <nav className="hidden md:flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
                <NavLinks />
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <>
                <div className="hidden md:flex items-center gap-2 sm:gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1">
                    <AccountSwitcher />
                  </div>
                  <Link to="/settings">
                    <Button variant="ghost" size="icon" title="Settings" className="text-muted-foreground hover:bg-white/[0.06] hover:text-foreground">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 border-white/10 bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline-block">Logout</span>
                  </Button>
                </div>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:bg-white/[0.06]">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[270px] sm:w-[320px] flex flex-col border-white/10 bg-background p-0">
                    <div className="flex h-full flex-col bg-background market-grid">
                      <div className="p-6 pb-2">
                        <Link to="/" className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-md border border-primary/30 bg-primary/15 text-primary">
                            <BarChart3 className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-primary">JournalOS</span>
                            <span className="font-bold text-lg">Trading Desk</span>
                          </div>
                        </Link>
                      </div>
                      
                      <div className="px-4 py-4">
                        <AccountSwitcher isMobile />
                      </div>

                      <div className="px-4 flex-1">
                        <nav className="flex flex-col gap-1">
                          <NavLinks mobile />
                        </nav>
                      </div>

                      <div className="p-4 mt-auto border-t border-white/10 space-y-2">
                        <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                          <ShieldCheck className="w-4 h-4" />
                          Workspace active
                        </div>
                        <Link to="/settings" className="w-full">
                          <Button variant="outline" className="w-full justify-start gap-2 h-11 border-white/10 bg-transparent">
                            <Settings className="w-4 h-4" />
                            Settings
                          </Button>
                        </Link>
                        <Button variant="ghost" className="w-full justify-start gap-2 h-11 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                          <LogOut className="w-4 h-4" />
                          Logout
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="hover:bg-white/[0.06]">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
