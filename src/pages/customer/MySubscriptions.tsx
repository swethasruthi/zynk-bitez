import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  ChefHat, Calendar, Clock, Pause, Play, Package, XCircle,
} from 'lucide-react';
import {
  fetchMySubscriptions,
  pauseSubscription,
  resumeSubscription,
  type SubscriptionResponse,
} from '@/services/apiClient';

const statusStyles: Record<string, string> = {
  active: 'bg-primary/10 text-primary border-primary/20',
  paused: 'bg-warning/10 text-warning border-warning/20',
  pending: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const MySubscriptions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subs, setSubs] = useState<SubscriptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchMySubscriptions();
      setSubs(res.subscriptions);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id: number) => {
    setActing(id);
    try {
      await pauseSubscription(id);
      toast({ title: 'Subscription paused' });
      await load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActing(null);
    }
  };

  const handleResume = async (id: number) => {
    setActing(id);
    try {
      await resumeSubscription(id);
      toast({ title: 'Subscription resumed' });
      await load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActing(null);
    }
  };

  return (
    <CustomerLayout title="My Subscriptions" subtitle="Manage your meal subscriptions">
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && subs.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">No subscriptions yet</h2>
            <p className="text-muted-foreground mb-4">Browse chefs and subscribe to a meal plan.</p>
            <Button onClick={() => navigate('/customer/home')} className="gradient-primary">
              Explore Chefs
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && subs.length > 0 && (
        <div className="space-y-4">
          {subs.map((sub) => (
            <Card key={sub.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-display text-lg">{sub.planName}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 mt-1">
                      <ChefHat className="w-3.5 h-3.5" />
                      {sub.kitchenName ?? 'Chef'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={statusStyles[sub.status] ?? ''}>
                    {sub.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    Started {sub.startDate ? new Date(sub.startDate).toLocaleDateString('en-IN') : '—'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    Next billing {new Date(sub.nextBillingDate).toLocaleDateString('en-IN')}
                  </span>
                  <span className="font-semibold text-foreground">
                    ₹{Math.round((sub.priceSnapshot ?? sub.priceInCents) / 100)}/mo
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/customer/subscription/${sub.id}`)}
                  >
                    View Deliveries
                  </Button>

                  {sub.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={acting === sub.id}
                      onClick={() => handlePause(sub.id)}
                    >
                      <Pause className="w-3.5 h-3.5 mr-1" />
                      {acting === sub.id ? 'Pausing…' : 'Pause'}
                    </Button>
                  )}

                  {sub.status === 'paused' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={acting === sub.id}
                      onClick={() => handleResume(sub.id)}
                    >
                      <Play className="w-3.5 h-3.5 mr-1" />
                      {acting === sub.id ? 'Resuming…' : 'Resume'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CustomerLayout>
  );
};

export default MySubscriptions;
