import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChefHat, Star, Clock, MapPin, ArrowLeft, Utensils, Check,
} from 'lucide-react';
import { fetchChefFull, createSubscription, type ChefFull } from '@/services/apiClient';

const ChefDetailPage = () => {
  const { chefId } = useParams<{ chefId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<ChefFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<number | null>(null);

  useEffect(() => {
    if (chefId) load();
  }, [chefId]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchChefFull(Number(chefId));
      setData({ chef: res.chef, plans: res.plans });
    } catch (err: any) {
      setError(err.message || 'Failed to load chef details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: number) => {
    if (!user || user.role !== 'customer') {
      navigate('/login');
      return;
    }
    setSubscribing(planId);
    try {
      const res = await createSubscription(planId);
      toast({ title: 'Subscription created', description: 'Redirecting to payment…' });
      navigate(`/customer/payment/${res.subscription.id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 px-4 max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="container py-16 px-4 text-center">
          <ChefHat className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Chef not found</h2>
          <p className="text-muted-foreground mb-4">{error || 'This chef may no longer be available'}</p>
          <Button onClick={() => navigate('/customer/home')}>Back to Chefs</Button>
        </div>
      </Layout>
    );
  }

  const { chef, plans } = data;

  return (
    <Layout>
      <div className="container py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/customer/home')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chefs
          </Button>

          {/* Chef Header */}
          <Card className="shadow-elevated mb-8 overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-chef/20 to-primary/20" />
              <CardContent className="relative pt-8 pb-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-24 h-24 rounded-2xl bg-chef flex items-center justify-center shadow-lg">
                    <ChefHat className="w-12 h-12 text-chef-foreground" />
                  </div>
                  <div className="flex-1">
                    <h1 className="font-display text-3xl font-bold mb-1">{chef.kitchenName}</h1>
                    <p className="text-muted-foreground mb-4">{chef.fullName}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        {chef.rating.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {chef.deliveryWindow}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {chef.serviceZones}
                      </span>
                      <span className="flex items-center gap-1">
                        <Utensils className="w-4 h-4" />
                        Capacity: {chef.dailyCapacity}/day
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Plans */}
          <h2 className="font-display text-2xl font-bold mb-4">Subscription Plans</h2>
          {plans.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="p-8 text-center text-muted-foreground">
                No plans available at this time.
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {plans.map((plan) => (
                <Card key={plan.id} className="shadow-card hover:shadow-elevated transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-display text-lg">{plan.planName}</CardTitle>
                      <Badge variant="secondary">{plan.mealType}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-1 mb-1">
                      <span className="text-3xl font-bold text-primary">₹{Math.round(plan.monthlyPrice / 100)}</span>
                      <span className="text-muted-foreground text-sm pb-1">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{plan.frequency}</p>
                    <Button
                      className="w-full gradient-primary"
                      disabled={subscribing === plan.id}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {subscribing === plan.id ? 'Creating…' : 'Subscribe'}
                      {subscribing !== plan.id && <Check className="w-4 h-4 ml-2" />}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChefDetailPage;
