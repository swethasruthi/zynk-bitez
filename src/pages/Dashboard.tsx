import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { CustomerDashboard } from '@/components/dashboard/CustomerDashboard';
import { ChefDashboard } from '@/components/dashboard/ChefDashboard';
import { DeliveryDashboard } from '@/components/dashboard/DeliveryDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { Navigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to role-based routes
  switch (user.role) {
    case 'customer':
      return <Navigate to="/customer/home" replace />;
    case 'chef':
      return <Navigate to="/chef/dashboard" replace />;
    case 'delivery':
      return <Navigate to="/delivery/dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      logout();
      return <Navigate to="/login" replace />;
  }
};

// Individual role pages that render within Layout
export const CustomerHome = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user || user.role !== 'customer') return <Navigate to="/login" replace />;
  return <Layout><CustomerDashboard /></Layout>;
};

export const ChefDashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user || user.role !== 'chef') return <Navigate to="/login" replace />;
  return <Layout><ChefDashboard /></Layout>;
};

export const DeliveryDashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user || user.role !== 'delivery') return <Navigate to="/login" replace />;
  return <Layout><DeliveryDashboard /></Layout>;
};

export const AdminDashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user || user.role !== 'admin') return <Navigate to="/login" replace />;
  return <Layout><AdminDashboard /></Layout>;
};
