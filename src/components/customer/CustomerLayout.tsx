import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { CustomerSidebar } from './CustomerSidebar';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const CustomerLayout = ({ children, title, subtitle }: Props) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user || user.role !== 'customer') {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div className="container py-8 px-4">
        <div className="flex gap-8">
          <CustomerSidebar />
          <main className="flex-1 min-w-0">
            {title && (
              <div className="mb-6">
                <h1 className="font-display text-3xl font-bold">{title}</h1>
                {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </Layout>
  );
};
