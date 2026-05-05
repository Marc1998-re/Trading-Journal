import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { LineChart, Activity, Settings, LogOut, Menu, Home, BarChart3 } from 'lucide-react';
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
    { name: 'Dashboard', path: '/home', icon: Home },
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
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            } ${mobile ? 'w-full text-base py-3' : ''}`}
          >
            <Icon className="w-4 h-4" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 transition-theme">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6 md:gap-10">
            <Link to="/" className="flex items-center gap-2 transition-colors hover:text-primary active:text-primary">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md shadow-sm">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg hidden sm:inline-block">
                Marc's Trading Journal
              </span>
            </Link>

            {currentUser && (
              <nav className="hidden md:flex items-center gap-1">
                <NavLinks />
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {currentUser ? (
              <>
                <div className="hidden md:flex items-center gap-2 sm:gap-3">
                  <AccountSwitcher />
                  <Link to="/settings">
                    <Button variant="ghost" size="icon" title="Settings" className="text-muted-foreground hover:text-foreground">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground hover:text-foreground">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline-block">Logout</span>
                  </Button>
                </div>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[240px] sm:w-[300px] flex flex-col p-0">
                    <div className="flex flex-col h-full bg-background">
                      <div className="p-6 pb-2">
                        <Link to="/" className="flex items-center gap-2">
                          <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                            <BarChart3 className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-lg">Marc's Trading Journal</span>
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

                      <div className="p-4 mt-auto border-t border-border/50 space-y-2">
                        <Link to="/settings" className="w-full">
                          <Button variant="outline" className="w-full justify-start gap-2 h-11">
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
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="shadow-sm">Sign Up</Button>
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
