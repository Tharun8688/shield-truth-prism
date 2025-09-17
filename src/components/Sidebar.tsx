import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  BookOpen, 
  Settings, 
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Analyze Content', href: '/analyze', icon: Search },
  { name: 'Tutorial', href: '/tutorial', icon: BookOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className={cn(
      "flex flex-col h-screen glass border-r border-white/10 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-glow">
              <span className="text-sm font-bold text-white">π</span>
            </div>
            <span className="text-lg font-bold text-gradient-primary">Pi Shield</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-white/10"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href === '/' && location.pathname === '/analyze') ||
              (item.href === '/tutorial' && location.pathname.includes('tutorial'));
            
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors",
                    isActive
                      ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/10">
        {user && (
          <div className="space-y-2">
            <div className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-xl bg-white/5",
              collapsed && "justify-center"
            )}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.email}
                  </p>
                </div>
              )}
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                collapsed && "justify-center px-0"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};