import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import {
  fetchSubscription,
  createPaymentOrder,
  sendPaymentWebhook,
  type SubscriptionResponse,
} from '@/services/apiClient';

const PaymentPage = () => {
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, [subscriptionId]);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetchSubscription(Number(subscriptionId));
      setSubscription(res.subscription);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!subscription) return;
    setPaying(true);
    try {
      const { orderId } = await createPaymentOrder(subscription.id);
      const mockPaymentId = `pay_${Date.now()}`;
      const mockSignature = `valid_${orderId}`;
      setProcessing(true);
      await sendPaymentWebhook(orderId, mockPaymentId, mockSignature);
      toast({ title: 'Payment successful!', description: 'Your subscription is now active.' });
      navigate(`/customer/subscription/${subscription.id}`, { replace: true });
    } catch (err: any) {
      toast({ title: 'Payment failed', description: err.message, variant: 'destructive' });
    } finally {
      setPaying(false);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="max-w-lg space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </CustomerLayout>
    );
  }

  if (!subscription) {
    return (
      <CustomerLayout>
        <div className="text-center py-16">
          <h2 className="font-display text-2xl font-bold mb-2">Subscription not found</h2>
          <Button onClick={() => navigate('/customer/home')}>Back to Home</Button>
        </div>
      </CustomerLayout>
    );
  }

  if (processing) {
    return (
      <CustomerLayout>
        <div className="text-center py-24">
          <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Processing payment…</h2>
          <p className="text-muted-foreground">Please wait while we activate your subscription.</p>
        </div>
      </CustomerLayout>
    );
  }

  const amount = subscription.priceSnapshot ?? subscription.priceInCents;

  return (
    <CustomerLayout>
      <div className="max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-6">Complete Payment</h1>

        <Card className="shadow-elevated mb-6">
          <CardHeader>
            <CardTitle className="font-display">{subscription.planName}</CardTitle>
            <CardDescription>
              {subscription.kitchenName ?? 'Chef'} • {subscription.postalCode}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 mb-4">
              <span className="text-4xl font-bold text-primary">₹{Math.round(amount / 100)}</span>
              <span className="text-muted-foreground text-sm pb-1">/month</span>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground mb-6">
              <p>Delivery to: {subscription.deliveryAddress}</p>
              <p>Starts: {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString('en-IN') : 'Tomorrow'}</p>
            </div>
            <Button size="lg" className="w-full gradient-primary" onClick={handlePay} disabled={paying}>
              {paying ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</>
              ) : (
                <><CreditCard className="w-4 h-4 mr-2" />Pay ₹{Math.round(amount / 100)}</>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="w-4 h-4" /> Secured by Razorpay
        </div>
      </div>
    </CustomerLayout>
  );
};

export default PaymentPage;
