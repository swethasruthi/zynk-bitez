import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  ChefHat, Calendar, MapPin, Clock, CheckCircle2,
  SkipForward, Package, ArrowLeft, AlertCircle,
} from 'lucide-react';
import {
  fetchSubscription,
  fetchDeliveries,
  skipDelivery,
  type SubscriptionResponse,
  type DeliveryEntry,
} from '@/services/apiClient';

const beforeCutoff = (deliveryDate: string) => {
  const cutoff = new Date(deliveryDate);
  cutoff.setDate(cutoff.getDate() - 1);
  cutoff.setHours(20, 0, 0, 0);
  return new Date() < cutoff;
};

const statusColor: Record<string, string> = {
  scheduled: 'bg-primary/10 text-primary',
  skipped: 'bg-muted text-muted-foreground',
  delivered: 'bg-accent/10 text-accent',
};

const SubscriptionTracking = () => {
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sub, setSub] = useState<SubscriptionResponse | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [skipping, setSkipping] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, [subscriptionId]);

  const load = async () => {
    setLoading(true);
    try {
      const [subRes, delRes] = await Promise.all([
        fetchSubscription(Number(subscriptionId)),
        fetchDeliveries(Number(subscriptionId)),
      ]);
      setSub(subRes.subscription);
      setDeliveries(delRes.deliveries);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async (deliveryId: number) => {
    setSkipping(deliveryId);
    try {
      await skipDelivery(deliveryId);
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

  if (loading) {
    return (
      <CustomerLayout>
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </CustomerLayout>
    );
  }

  if (!sub) {
    return (
      <CustomerLayout>
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Subscription not found</h2>
          <Button onClick={() => navigate('/customer/subscriptions')}>Back to Subscriptions</Button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-3xl">
        <Button variant="ghost" onClick={() => navigate('/customer/subscriptions')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {/* Subscription Summary */}
        <Card className="shadow-elevated mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display text-xl">{sub.planName}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <ChefHat className="w-4 h-4" /> {sub.kitchenName ?? 'Chef'}
                </CardDescription>
              </div>
              <Badge
                className={sub.status === 'active' ? 'bg-accent/10 text-accent border-accent/20' : ''}
                variant={sub.status === 'active' ? 'outline' : 'secondary'}
              >
                {sub.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {sub.startDate ? new Date(sub.startDate).toLocaleDateString('en-IN') : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-muted-foreground">Next Billing</p>
                  <p className="font-medium">{new Date(sub.nextBillingDate).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-muted-foreground">Delivery</p>
                  <p className="font-medium truncate max-w-[160px]">{sub.deliveryAddress}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming */}
        <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" /> Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <Card className="shadow-soft mb-8">
            <CardContent className="p-8 text-center text-muted-foreground">No upcoming deliveries.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3 mb-8">
            {upcoming.map((d) => {
              const canSkip = d.status === 'scheduled' && beforeCutoff(d.deliveryDate);
              return (
                <Card key={d.id} className="shadow-soft">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusColor[d.status]}`}>
                        {d.status === 'scheduled' && <Calendar className="w-5 h-5" />}
                        {d.status === 'skipped' && <SkipForward className="w-5 h-5" />}
                        {d.status === 'delivered' && <CheckCircle2 className="w-5 h-5" />}
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
                      <Button size="sm" variant="outline" disabled={skipping === d.id} onClick={() => handleSkip(d.id)}>
                        <SkipForward className="w-4 h-4 mr-1" />
                        {skipping === d.id ? 'Skipping…' : 'Skip'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <>
            <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" /> Past ({past.length})
            </h2>
            <div className="space-y-3">
              {past.map((d) => (
                <Card key={d.id} className="shadow-soft opacity-75">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusColor[d.status]}`}>
                      {d.status === 'delivered' && <CheckCircle2 className="w-5 h-5" />}
                      {d.status === 'skipped' && <SkipForward className="w-5 h-5" />}
                      {d.status === 'scheduled' && <Calendar className="w-5 h-5" />}
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
              ))}
            </div>
          </>
        )}
      </div>
    </CustomerLayout>
  );
};

export default SubscriptionTracking;
