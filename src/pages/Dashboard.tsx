import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { CustomerDashboard } from '@/components/dashboard/CustomerDashboard';
import { ChefDashboard } from '@/components/dashboard/ChefDashboard';
import { DeliveryDashboard } from '@/components/dashboard/DeliveryDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { Navigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'customer':
        return <CustomerDashboard />;
      case 'chef':
        return <ChefDashboard />;
      case 'delivery':
        return <DeliveryDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <Navigate to="/" replace />;
    }
  };

  return (
    <Layout>
      {renderDashboard()}
    </Layout>
  );
};
