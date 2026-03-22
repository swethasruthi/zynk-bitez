import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { clearApiToken } from '@/services/backend';
import { Button } from '@/components/ui/button';
import {
  UtensilsCrossed,
  LogOut,
  User,
  ChefHat,
  Truck,
  ShieldCheck,
  Menu
} from 'lucide-react';

const roleIcons = {
  customer: User,
  chef: ChefHat,
  delivery: Truck,
  admin: ShieldCheck,
};

const roleColors = {
  customer: 'bg-green-500',
  chef: 'bg-green-600',
  delivery: 'bg-green-500',
  admin: 'bg-green-700',
};

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearApiToken();
    logout();
    navigate('/');
  };

  const RoleIcon = user ? roleIcons[user.role] : User;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-sm bg-green-500 flex items-center justify-center transition-all group-hover:bg-green-600">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-gray-800 tracking-tight">ZYNK</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex font-chef text-xs tracking-wider text-gray-700 hover:text-green-600 hover:bg-transparent">
            <Link to="/weekly-menu">MENU</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex font-chef text-xs tracking-wider text-gray-700 hover:text-green-600 hover:bg-transparent">
            <Link to="/chefs">CHEFS</Link>
          </Button>
          
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-3 px-4 py-2 rounded-sm bg-secondary border border-gray-200">
                <div className={`w-8 h-8 rounded-sm ${roleColors[user.role]} flex items-center justify-center`}>
                  <RoleIcon className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-charcoal">{user.name}</p>
                  <p className="font-chef text-[10px] tracking-widest text-muted-foreground uppercase">{user.role === 'customer' ? 'MEMBER' : user.role}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive rounded-sm"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <div className="flex gap-3">
              {location.pathname !== '/login' && (
                <Button asChild variant="ghost" size="sm" className="font-chef text-xs tracking-wider">
                  <Link to="/login">SIGN IN</Link>
                </Button>
              )}
              {location.pathname !== '/register' && (
                <Button asChild size="sm" className="bg-green-500 hover:bg-green-600 text-white font-chef text-xs tracking-wider rounded-sm">
                  <Link to="/register">GET STARTED</Link>
                </Button>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
