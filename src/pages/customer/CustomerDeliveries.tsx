import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar, CheckCircle2, SkipForward, Truck, Package,
} from 'lucide-react';
import {
  fetchMySubscriptions,
  fetchDeliveries,
  skipDelivery,
  type DeliveryEntry,
  type SubscriptionResponse,
} from '@/services/apiClient';

const statusIcon = {
  scheduled: Calendar,
  skipped: SkipForward,
  delivered: CheckCircle2,
};

const statusColor: Record<string, string> = {
  scheduled: 'bg-primary/10 text-primary',
  skipped: 'bg-muted text-muted-foreground',
  delivered: 'bg-accent/10 text-accent',
};

const beforeCutoff = (date: string) => {
  const cutoff = new Date(date);
  cutoff.setDate(cutoff.getDate() - 1);
  cutoff.setHours(20, 0, 0, 0);
  return new Date() < cutoff;
};

const CustomerDeliveries = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<DeliveryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [skipping, setSkipping] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const subsRes = await fetchMySubscriptions();
      const activeSubs = subsRes.subscriptions.filter(
        (s: SubscriptionResponse) => s.status === 'active' || s.status === 'paused'
      );
      const allDeliveries: DeliveryEntry[] = [];
      for (const sub of activeSubs) {
        const delRes = await fetchDeliveries(sub.id);
        allDeliveries.push(...delRes.deliveries);
      }
      allDeliveries.sort(
        (a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()
      );
      setDeliveries(allDeliveries);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async (id: number) => {
    setSkipping(id);
    try {
      await skipDelivery(id);
      toast({ title: 'Delivery skipped' });
      await load();
    } catch (err: any) {
      toast({ title: 'Cannot skip', description: err.message, variant: 'destructive' });
    } finally {
      setSkipping(null);
    }
  };

  const now = new Date();
  const upcoming = deliveries.filter((d) => new Date(d.deliveryDate) >= now && d.status !== 'delivered');
  const past = deliveries.filter((d) => new Date(d.deliveryDate) < now || d.status === 'delivered');

  return (
    <CustomerLayout title="Deliveries" subtitle="Track all your meal deliveries">
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      )}

      {!loading && deliveries.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <Truck className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">No deliveries yet</h2>
            <p className="text-muted-foreground">Subscribe to a meal plan to see deliveries here.</p>
          </CardContent>
        </Card>
      )}

      {!loading && upcoming.length > 0 && (
        <>
          <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Upcoming ({upcoming.length})
          </h2>
          <div className="space-y-3 mb-8">
            {upcoming.map((d) => {
              const Icon = statusIcon[d.status] ?? Calendar;
              const canSkip = d.status === 'scheduled' && beforeCutoff(d.deliveryDate);
              return (
                <Card key={d.id} className="shadow-soft">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusColor[d.status]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {new Date(d.deliveryDate).toLocaleDateString('en-IN', {
                            weekday: 'short', day: 'numeric', month: 'short',
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">{d.mealType} • {d.status}</p>
                      </div>
                    </div>
                    {canSkip && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={skipping === d.id}
                        onClick={() => handleSkip(d.id)}
                      >
                        <SkipForward className="w-4 h-4 mr-1" />
                        {skipping === d.id ? 'Skipping…' : 'Skip'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {!loading && past.length > 0 && (
        <>
          <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-accent" />
            Past ({past.length})
          </h2>
          <div className="space-y-3">
            {past.map((d) => {
              const Icon = statusIcon[d.status] ?? Calendar;
              return (
                <Card key={d.id} className="shadow-soft opacity-75">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusColor[d.status]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {new Date(d.deliveryDate).toLocaleDateString('en-IN', {
                          weekday: 'short', day: 'numeric', month: 'short',
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">{d.mealType} • {d.status}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </CustomerLayout>
  );
};

export default CustomerDeliveries;
