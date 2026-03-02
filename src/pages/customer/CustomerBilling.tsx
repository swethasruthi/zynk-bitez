import { useState, useEffect } from 'react';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Calendar, IndianRupee } from 'lucide-react';
import { fetchMySubscriptions, type SubscriptionResponse } from '@/services/apiClient';

const CustomerBilling = () => {
  const { toast } = useToast();
  const [subs, setSubs] = useState<SubscriptionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchMySubscriptions();
        setSubs(res.subscriptions);
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeSubs = subs.filter((s) => s.status === 'active' || s.status === 'paused');
  const totalMonthly = activeSubs.reduce((sum, s) => sum + (s.priceSnapshot ?? s.priceInCents), 0);

  return (
    <CustomerLayout title="Billing" subtitle="Your billing overview and payment history">
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Card className="shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <IndianRupee className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Monthly Total</p>
                </div>
                <p className="text-2xl font-bold font-display">₹{Math.round(totalMonthly / 100)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-sm text-muted-foreground">Active Plans</p>
                </div>
                <p className="text-2xl font-bold font-display">{activeSubs.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-warning" />
                  </div>
                  <p className="text-sm text-muted-foreground">Next Billing</p>
                </div>
                <p className="text-lg font-bold font-display">
                  {activeSubs.length > 0
                    ? new Date(
                        Math.min(...activeSubs.map((s) => new Date(s.nextBillingDate).getTime()))
                      ).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : '—'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subscription billing rows */}
          <h2 className="font-display text-lg font-bold mb-3">Subscriptions</h2>
          {subs.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="p-8 text-center text-muted-foreground">
                No billing records yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {subs.map((sub) => (
                <Card key={sub.id} className="shadow-soft">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{sub.planName}</p>
                      <p className="text-sm text-muted-foreground">{sub.kitchenName ?? 'Chef'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">
                        ₹{Math.round((sub.priceSnapshot ?? sub.priceInCents) / 100)}/mo
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          sub.status === 'active'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : sub.status === 'cancelled'
                            ? 'bg-destructive/10 text-destructive border-destructive/20'
                            : ''
                        }
                      >
                        {sub.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </CustomerLayout>
  );
};

export default CustomerBilling;
