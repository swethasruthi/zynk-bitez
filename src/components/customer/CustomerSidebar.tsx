import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ChefHat, Package, Truck, CreditCard, User, Home,
} from 'lucide-react';

const navItems = [
  { to: '/customer/home', label: 'Explore Chefs', icon: ChefHat },
  { to: '/customer/subscriptions', label: 'My Subscriptions', icon: Package },
  { to: '/customer/deliveries', label: 'Deliveries', icon: Truck },
  { to: '/customer/billing', label: 'Billing', icon: CreditCard },
  { to: '/customer/profile', label: 'Profile', icon: User },
];

export const CustomerSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <nav className="sticky top-24 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active =
            location.pathname === to ||
            (to === '/customer/home' && location.pathname.startsWith('/customer/chef/'));
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
