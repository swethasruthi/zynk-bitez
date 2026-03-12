import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, Clock, UtensilsCrossed,
  CheckCircle2, Lock, ChefHat,
  Settings, Package
} from 'lucide-react';
import { OrderTracker } from '@/components/order/OrderTracker';
import { ReviewPrompt } from '@/components/review/ReviewPrompt';
import { StarRating } from '@/components/review/ReviewForm';
import { MealRecommendationWidget } from '@/components/MealRecommendationWidget';
import { MealCard } from '@/components/MealCard';
import { WeeklyMenuView } from '@/components/WeeklyMenuView';
import type { Subscription, DailyMeal, Address, Meal, PlanType, Chef, Dish, Customer, AddressType, Order, MealSlot } from '@/types';

type CutoffStatus = 'OPEN' | 'LOCKED';

const useCutoffTimer = () => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [status, setStatus] = useState<CutoffStatus>('OPEN');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(20, 0, 0, 0);
      const diff = cutoff.getTime() - now.getTime();

      if (diff <= 0) {
        setStatus('LOCKED');
        setTimeLeft('');
        return;
      }

      setStatus('OPEN');
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  return { timeLeft, status };
};

const CutoffBanner = () => {
  const { timeLeft, status } = useCutoffTimer();

  if (status === 'LOCKED') {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-muted/80 border border-border/50 flex items-center gap-3 animate-slide-up">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Lock className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">Tomorrow's meal is in the oven</p>
          <p className="text-sm text-muted-foreground">Changes will apply from day after</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-primary">Kitchen is still open</p>
          <p className="text-sm text-muted-foreground">You can still adjust tomorrow's meal</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Closes in</p>
        <p className="font-mono text-xl font-bold text-primary">{timeLeft}</p>
      </div>
    </div>
  );
};

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [dailyMeals, setDailyMeals] = useState<DailyMeal[]>([]);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [allDishes, setAllDishes] = useState<Dish[]>([]);
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);
  const [availableChefs, setAvailableChefs] = useState<Chef[]>([]);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showChefSelect, setShowChefSelect] = useState(false);
  const [canModify, setCanModify] = useState(api.canModifyMeal());
  const [ordersForReview, setOrdersForReview] = useState<Order[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  const [plan, setPlan] = useState<PlanType>('standard');
  const [address, setAddress] = useState<Address>({ street: '', city: '', state: '', zipCode: '' });
  const [selectedChefId, setSelectedChefId] = useState<string>('');

  const customer = user as Customer;

  useEffect(() => {
    if (user) loadData();
    const interval = setInterval(() => setCanModify(api.canModifyMeal()), 1000);
    return () => clearInterval(interval);
  }, [user]);

  const loadData = () => {
    if (!user) return;
    
    const subResponse = api.getSubscription(user.id);
    if (subResponse.success) setSubscription(subResponse.data || null);

    const mealsResponse = api.getCustomerMeals(user.id);
    if (mealsResponse.success) setDailyMeals(mealsResponse.data || []);

    const allMealsResponse = api.getAllMeals();
    if (allMealsResponse.success) setAllMeals(allMealsResponse.data || []);

    const dishesResponse = api.getAllDishes();
    if (dishesResponse.success) setAllDishes(dishesResponse.data || []);

    const chefsResponse = api.getApprovedChefs();
    if (chefsResponse.success) setAvailableChefs(chefsResponse.data || []);

    const chefResponse = api.getSelectedChef(user.id);
    if (chefResponse.success) setSelectedChef(chefResponse.data || null);

    const reviewOrdersResponse = api.getOrdersForReview(user.id);
    if (reviewOrdersResponse.success) setOrdersForReview(reviewOrdersResponse.data || []);

    const trackingResponse = api.getCustomerOrdersWithTracking(user.id);
    if (trackingResponse.success) setCustomerOrders(trackingResponse.data || []);

    setCanModify(api.canModifyMeal());
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const response = api.subscribe(user.id, plan, address, 'home', selectedChefId || undefined);
    if (response.success) {
      toast({ title: 'Subscribed!', description: 'Your meal subscription is now active.' });
      setShowSubscribe(false);
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const handleSkipMeal = (dailyMealId: string) => {
    if (!user) return;
    const response = api.skipMeal(user.id, dailyMealId);
    if (response.success) {
      toast({ title: 'Meal Skipped', description: 'This meal has been skipped.' });
      loadData();
    } else {
      const nextAt = response.nextAvailableAt ? format(new Date(response.nextAvailableAt), 'EEE, MMM d h:mm a') : undefined;
      const description = nextAt ? `${response.error} Next available: ${nextAt}.` : response.error;
      toast({ title: response.statusCode === 423 ? 'Locked' : 'Error', description, variant: 'destructive' });
    }
  };

  const handleUnskipMeal = (dailyMealId: string) => {
    if (!user) return;
    const response = api.unskipMeal(user.id, dailyMealId);
    if (response.success) {
      toast({ title: 'Meal Restored', description: 'This meal has been restored.' });
      loadData();
    } else {
      const nextAt = response.nextAvailableAt ? format(new Date(response.nextAvailableAt), 'EEE, MMM d h:mm a') : undefined;
      const description = nextAt ? `${response.error} Next available: ${nextAt}.` : response.error;
      toast({ title: response.statusCode === 423 ? 'Locked' : 'Error', description, variant: 'destructive' });
    }
  };

  const handleSwapMeal = (dailyMealId: string, newMealId: string) => {
    if (!user) return;
    const response = api.swapMeal(user.id, dailyMealId, newMealId);
    if (response.success) {
      toast({ title: 'Meal Swapped', description: 'This meal has been updated.' });
      loadData();
    } else {
      const nextAt = response.nextAvailableAt ? format(new Date(response.nextAvailableAt), 'EEE, MMM d h:mm a') : undefined;
      const description = nextAt ? `${response.error} Next available: ${nextAt}.` : response.error;
      toast({ title: response.statusCode === 423 ? 'Locked' : 'Error', description, variant: 'destructive' });
    }
  };

  const handleUpdateMealAddress = (
    dailyMealId: string,
    addressType: AddressType | 'custom',
    customAddress?: Address
  ) => {
    if (!user) return;
    const response = api.updateMealAddress(user.id, dailyMealId, addressType, customAddress);
    if (response.success) {
      toast({ title: 'Address Updated', description: 'Delivery address updated for this meal.' });
      loadData();
    } else {
      const nextAt = response.nextAvailableAt ? format(new Date(response.nextAvailableAt), 'EEE, MMM d h:mm a') : undefined;
      const description = nextAt ? `${response.error} Next available: ${nextAt}.` : response.error;
      toast({ title: response.statusCode === 423 ? 'Locked' : 'Error', description, variant: 'destructive' });
    }
  };

  const handleSelectChef = (chefId: string) => {
    if (!user) return;
    const response = api.selectChef(user.id, chefId);
    if (response.success) {
      toast({ title: 'Chef Updated', description: 'Your chef has been changed.' });
      setShowChefSelect(false);
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const handleSubmitReview = (orderId: string, rating: number, comment?: string) => {
    if (!user) return;
    const response = api.submitReview(user.id, orderId, rating, comment);
    if (response.success) {
      toast({ title: 'Review Submitted!', description: 'Thank you for your feedback.' });
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const getMealName = (mealId: string) => {
    const dish = allDishes.find(d => d.id === mealId);
    if (dish) return dish.name;
    const meal = allMeals.find(m => m.id === mealId);
    return meal?.name || 'Unknown meal';
  };

  const getMealDescription = (mealId: string) => {
    const dish = allDishes.find(d => d.id === mealId);
    if (dish) return dish.description;
    const meal = allMeals.find(m => m.id === mealId);
    return meal?.description || '';
  };

  const getMealSlotsForPlan = (planType?: PlanType): MealSlot[] => {
    switch (planType) {
      case 'basic':
        return ['lunch'];
      case 'standard':
        return ['lunch', 'dinner'];
      case 'premium':
        return ['breakfast', 'lunch', 'dinner'];
      default:
        return ['lunch'];
    }
  };

  const getMealSlotLabel = (slot: MealSlot) => {
    if (slot === 'breakfast') return 'Breakfast';
    if (slot === 'lunch') return 'Lunch';
    return 'Dinner';
  };

  const resolveMealSlot = (meal: DailyMeal): MealSlot => {
    const slot = meal.mealSlot || meal.mealTime;
    return slot === 'both' ? 'lunch' : (slot as MealSlot);
  };

  const getCutoffForDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`);
    const cutoff = new Date(date);
    cutoff.setDate(date.getDate() - 1);
    cutoff.setHours(20, 0, 0, 0);
    return cutoff;
  };

  const isMealLocked = (dateStr: string) => {
    return new Date().getTime() >= getCutoffForDate(dateStr).getTime();
  };

  const planSlots = getMealSlotsForPlan(subscription?.plan || plan);
  const planSlotsLabel = planSlots.map(getMealSlotLabel).join(' • ');

  const plans = [
    { id: 'basic', name: 'Basic', price: 'â‚¹2,999/mo', meals: '20 meals' },
    { id: 'standard', name: 'Standard', price: 'â‚¹4,499/mo', meals: '30 meals' },
    { id: 'premium', name: 'Premium', price: 'â‚¹5,999/mo', meals: '60 meals' },
  ];

  // Chef Selection Modal
  if (showChefSelect) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-2xl font-bold">Select Your Chef</h1>
            <Button variant="outline" onClick={() => setShowChefSelect(false)}>Cancel</Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {availableChefs.map((chef) => {
              const dishes = allDishes.filter(d => d.chefId === chef.id);
              return (
                <Card key={chef.id} className={`shadow-card cursor-pointer transition-all hover:shadow-elevated ${selectedChef?.id === chef.id ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-chef flex items-center justify-center">
                        <ChefHat className="w-7 h-7 text-chef-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-bold">{chef.name}</h3>
                        <p className="text-sm text-muted-foreground">{chef.specialty}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={chef.rating || 0} />
                          <span className="text-sm font-medium">{chef.rating || 0}</span>
                          <span className="text-xs text-muted-foreground">â€¢ {chef.serviceArea}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{dishes.length} dishes • Customization: {dishes.some(d => d.allowsCustomization) ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    <Button className="w-full mt-4 gradient-primary" onClick={() => handleSelectChef(chef.id)}>
                      Select Chef
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // No subscription - show plans
  if (!subscription && !showSubscribe) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl font-bold mb-2">Welcome, {user?.name}!</h1>
          <p className="text-muted-foreground mb-8">Ready to simplify your meals?</p>
          <Card className="shadow-elevated animate-slide-up">
            <CardHeader>
              <CardTitle className="font-display">Start Your Subscription</CardTitle>
              <CardDescription>Choose a plan and get delicious meals delivered daily</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {plans.map((p) => (
                  <button key={p.id} onClick={() => { setPlan(p.id as PlanType); setShowSubscribe(true); }}
                    className="p-6 rounded-xl border-2 border-border hover:border-primary transition-all text-left group hover:shadow-card">
                    <h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors">{p.name}</h3>
                    <p className="text-2xl font-bold text-primary mt-2">{p.price}</p>
                    <p className="text-sm text-muted-foreground mt-1">{p.meals}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Subscription form
  if (showSubscribe) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="shadow-elevated animate-slide-up">
            <CardHeader>
              <CardTitle className="font-display">Complete Subscription</CardTitle>
              <CardDescription>{plans.find(p => p.id === plan)?.name} Plan - {plans.find(p => p.id === plan)?.price}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Chef</Label>
                  <select className="w-full h-10 px-3 rounded-lg border border-border bg-background" value={selectedChefId} onChange={(e) => setSelectedChefId(e.target.value)}>
                    <option value="">Choose a chef...</option>
                    {availableChefs.map(chef => (
                      <option key={chef.id} value={chef.id}>{chef.name} - {chef.specialty}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Delivery Address</Label>
                  <Input id="street" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} placeholder="Street address" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} placeholder="City" required />
                  <Input value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} placeholder="State" required />
                </div>
                <Input value={address.zipCode} onChange={(e) => setAddress({...address, zipCode: e.target.value})} placeholder="ZIP Code" required />

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowSubscribe(false)} className="flex-1">Back</Button>
                  <Button type="submit" className="flex-1 gradient-primary">Subscribe</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Kitchen Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #faf9f7 0%, #f5f3f0 50%, #f0ede8 100%)' }} />
        
        {/* Animated floating shapes */}
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-30 animate-float" style={{ background: 'radial-gradient(circle, rgba(184,115,51,0.15) 0%, transparent 70%)' }} />
        <div className="absolute top-40 right-20 w-48 h-48 rounded-full opacity-20 animate-float-slow" style={{ background: 'radial-gradient(circle, rgba(184,115,51,0.2) 0%, transparent 70%)' }} />
        <div className="absolute bottom-40 left-1/4 w-72 h-72 rounded-full opacity-15 animate-float-delayed" style={{ background: 'radial-gradient(circle, rgba(139,90,43,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-20 right-1/3 w-56 h-56 rounded-full opacity-20 animate-float" style={{ background: 'radial-gradient(circle, rgba(184,115,51,0.18) 0%, transparent 70%)' }} />
        
        {/* Kitchen pattern grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #1a1a1a 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        
        {/* Decorative kitchen icons floating */}
        <div className="absolute top-1/4 left-8 opacity-[0.04] animate-float">
          <UtensilsCrossed className="w-20 h-20 text-green-800" />
        </div>
        <div className="absolute bottom-1/3 right-12 opacity-[0.03] animate-float-slow">
          <ChefHat className="w-24 h-24 text-green-900" />
        </div>
        
        {/* Animated lines */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500/20 to-transparent" style={{ animation: 'shimmer 4s infinite' }} />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500/15 to-transparent" style={{ animation: 'shimmer 4s infinite reverse' }} />
      </div>

      <div className="container py-8 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Header with animation */}
          <div className="animate-slide-up">
            <h1 className="font-display text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">Welcome home, {user?.name}!</h1>
            <p className="text-muted-foreground mb-6 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Your personal kitchen is ready
            </p>
          </div>

          <CutoffBanner />

        {/* Review Prompt */}
        <ReviewPrompt orders={ordersForReview} onSubmitReview={handleSubmitReview} />

        {/* Order Tracking */}
        {customerOrders.length > 0 && customerOrders.some(o => o.status !== 'scheduled') && (
          <Card className="mb-6 shadow-soft border-primary/20 animate-slide-up hover-lift bg-white/80 backdrop-blur-sm" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Your Meal Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerOrders.filter(o => o.status !== 'scheduled').slice(0, 1).map(order => (
                <div key={order.id}>
                  <p className="text-sm mb-3">
                    <span className="font-medium">{order.mealName}</span>
                    <span className="text-muted-foreground"> • {order.date}</span>
                  </p>
                  <OrderTracker order={order} showTimestamps />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Health Snapshot Card */}
        <Card className="mb-6 shadow-soft bg-gradient-to-br from-green-50/80 to-emerald-50/60 border-green-200/40 animate-slide-up hover-lift backdrop-blur-sm" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Your Health Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-green-100 hover:shadow-md transition-all hover:scale-105">
                <p className="text-3xl font-bold text-green-600">{dailyMeals.filter(m => !m.isSkipped).length}</p>
                <p className="text-xs text-muted-foreground mt-1">Meals this week</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-green-100 hover:shadow-md transition-all hover:scale-105">
                <p className="text-3xl font-bold text-green-600">~{Math.round((dailyMeals.filter(m => !m.isSkipped).length || 1) * 450)}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg. calories</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-green-100 hover:shadow-md transition-all hover:scale-105">
                <p className="text-3xl font-bold text-green-600">{dailyMeals.filter(m => m.isSkipped).length}</p>
                <p className="text-xs text-muted-foreground mt-1">Days skipped</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Subscription & Chef Info */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card className="shadow-soft bg-white/80 backdrop-blur-sm animate-slide-up hover-lift" style={{ animationDelay: '300ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">Your Plan</p>
                  <p className="text-sm text-muted-foreground capitalize">{subscription?.plan} • {planSlotsLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft bg-white/80 backdrop-blur-sm animate-slide-up hover-lift" style={{ animationDelay: '350ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg">
                    <ChefHat className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedChef?.name || 'Choose Your Chef'}</p>
                    <p className="text-sm text-muted-foreground">{selectedChef?.specialty || 'Pick a home cook'}</p>
                  </div>
                </div>
                {canModify && (
                  <Button size="sm" variant="outline" className="rounded-full hover:bg-green-50 hover:border-green-300" onClick={() => setShowChefSelect(true)}>
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Meals */}
        <Card className="mb-6 shadow-elevated border-2 border-green-300/50 bg-gradient-to-br from-white to-green-50/50 animate-slide-up hover-lift backdrop-blur-sm" style={{ animationDelay: '450ms' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  Today's Meals
                </CardTitle>
                <CardDescription>Confirmed by 8 PM the day before delivery</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {dailyMeals.filter(dm => dm.date === new Date().toISOString().split('T')[0]).length === 0 ? (
              <p className="text-sm text-muted-foreground">No meals scheduled for today.</p>
            ) : (
              dailyMeals
                .filter(dm => dm.date === new Date().toISOString().split('T')[0])
                .filter(dm => planSlots.includes(resolveMealSlot(dm)))
                .map((meal) => {
                  const slot = resolveMealSlot(meal);
                  const cutoffAt = getCutoffForDate(meal.date);
                  const alternatives = (meal.alternativeMealIds || [])
                    .map(id => ({
                      id,
                      name: getMealName(id),
                    }))
                    .filter(alt => alt.id !== meal.currentMealId);

                  return (
                    <MealCard
                      key={meal.id}
                      meal={meal}
                      mealLabel={getMealSlotLabel(slot)}
                      mealName={getMealName(meal.currentMealId)}
                      mealDescription={getMealDescription(meal.currentMealId)}
                      alternatives={alternatives}
                      isLocked={isMealLocked(meal.date)}
                      cutoffAt={cutoffAt}
                      homeAddress={customer?.homeAddress}
                      workAddress={customer?.workAddress}
                      onSkip={() => handleSkipMeal(meal.id)}
                      onUnskip={() => handleUnskipMeal(meal.id)}
                      onSwap={(newMealId) => handleSwapMeal(meal.id, newMealId)}
                      onUpdateAddress={(type, custom) => handleUpdateMealAddress(meal.id, type, custom)}
                    />
                  );
                })
            )}
          </CardContent>
        </Card>

        {/* Meal Recommendation Widget */}
        <Card className="mb-6 shadow-soft border-green-200/30 bg-white/80 backdrop-blur-sm animate-slide-up hover-lift" style={{ animationDelay: '500ms' }}>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <span className="text-green-500">âœ¨</span>
              Get Personalized Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MealRecommendationWidget />
          </CardContent>
        </Card>

        {/* Weekly Meals */}
        <div className="animate-slide-up" style={{ animationDelay: '550ms' }}>
          <WeeklyMenuView
            dailyMeals={dailyMeals}
            planSlots={planSlots}
            getMealName={getMealName}
            getMealDescription={getMealDescription}
            getMealSlotLabel={getMealSlotLabel}
            isMealLocked={isMealLocked}
            getCutoffForDate={getCutoffForDate}
            homeAddress={customer?.homeAddress}
            workAddress={customer?.workAddress}
            onSkip={handleSkipMeal}
            onUnskip={handleUnskipMeal}
            onSwap={handleSwapMeal}
            onUpdateAddress={handleUpdateMealAddress}
          />
        </div>

        {/* Dishes Chart removed */}

        {/* Meal Skip Decision Assistant removed */}

        </div>
      </div>
    </div>
  );
};


