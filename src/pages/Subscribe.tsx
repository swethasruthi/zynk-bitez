import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ChefHat, ArrowLeft, ArrowRight, Check, MapPin,
  Leaf, Drumstick, Flame, Dumbbell, Sparkles, Star, Home, Briefcase
} from 'lucide-react';
import * as api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { getBackendApiBaseUrl, getApiToken, getChefsWithRatings as getBackendChefs } from '@/services/backend';
import { useToast } from '@/hooks/use-toast';
import type { Address, PlanType, Customer, Dish } from '@/types';

type ChefWithData = ReturnType<typeof api.getApprovedChefsWithRatings>['data'] extends (infer T)[] | undefined ? T : never;
type Step = 'chef' | 'menu' | 'plan' | 'address' | 'confirm' | 'payment';

export const Subscribe = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('chef');
  const [chefs, setChefs] = useState<ChefWithData[]>([]);
  const [selectedChefId, setSelectedChefId] = useState<string>(location.state?.selectedChefId || '');
  const [selectedDishes, setSelectedDishes] = useState<string[]>(location.state?.selectedDishes || []);
  const [plan, setPlan] = useState<PlanType>('standard');
  const [homeAddress, setHomeAddress] = useState<Address>({ street: '', city: '', state: '', zipCode: '' });
  const [workAddress, setWorkAddress] = useState<Address>({ street: '', city: '', state: '', zipCode: '' });
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'debit' | 'credit' | 'netbanking'>('upi');

  const customer = user as Customer;

  useEffect(() => {
    if (!user || user.role !== 'customer') {
      navigate('/login');
      return;
    }
    loadChefs();
    if (customer?.homeAddress) setHomeAddress(customer.homeAddress);
    if (customer?.workAddress) setWorkAddress(customer.workAddress);
  }, [user]);

  const loadChefs = async () => {
    const backendChefs = await getBackendChefs();
    if (backendChefs && backendChefs.length > 0) {
      setChefs(backendChefs);
      return;
    }
    const response = api.getApprovedChefsWithRatings();
    if (response.success && response.data) {
      setChefs(response.data);
    }
  };

  const selectedChef = chefs.find(c => c.id === selectedChefId);
  const chefDishes: Dish[] = selectedChef?.dishes || [];

  const plans = [
    { id: 'basic' as PlanType, name: 'Basic', price: '₹2,999', meals: '20 meals/month', perMeal: '₹150/meal' },
    { id: 'standard' as PlanType, name: 'Standard', price: '₹4,499', meals: '30 meals/month', perMeal: '₹150/meal', popular: true },
    { id: 'premium' as PlanType, name: 'Premium', price: '₹5,999', meals: '60 meals/month', perMeal: '₹100/meal' },
  ];

  const planSlots: Record<PlanType, string> = {
    basic: 'Lunch',
    standard: 'Lunch • Dinner',
    premium: 'Breakfast • Lunch • Dinner',
  };

  const handlePayment = async () => {
    if (!user) return;
    const token = getApiToken();
    if (!token) {
      toast({
        title: 'Login required',
        description: 'Please sign in again to complete payment.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Load Razorpay script
      await new Promise<void>((resolve, reject) => {
        if ((window as any).Razorpay) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Razorpay'));
        document.body.appendChild(script);
      });

      // Step 2: Get API base URL
      let apiBase = getBackendApiBaseUrl();
      if (apiBase.endsWith('/api')) apiBase = apiBase.replace(/\/api\/?$/, '');
      if (!apiBase) apiBase = `${window.location.protocol}//${window.location.hostname}:3002`;

      // Step 3: Plan amounts in paise
      const planAmounts: Record<string, number> = {
        basic: 299900,
        standard: 449900,
        premium: 599900,
      };

      // Step 4: Create order on backend
      const orderRes = await fetch(`${apiBase}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: planAmounts[plan] || 449900,
          currency: 'INR',
          plan,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderData.success || !orderData.order) {
        toast({
          title: 'Error',
          description: orderData.message || 'Could not create payment order',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        toast({
          title: 'Configuration error',
          description: 'Razorpay key not configured.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const userName = (user as any).fullName ?? (user as any).name ?? '';

      // Step 5: Stop loading BEFORE opening popup
      setLoading(false);

      // Step 6: Open Razorpay popup
      const options = {
        key: razorpayKey,
        amount: orderData.order.amount,
        currency: 'INR',
        name: 'ZYNK Bites',
        description: `${plan} subscription`,
        order_id: orderData.order.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`${apiBase}/api/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan,
                chefId: selectedChefId,
                homeAddress,
                workAddress,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              toast({
                title: '🎉 Payment Successful!',
                description: 'Your subscription is now active.',
              });
              navigate('/dashboard');
            } else {
              toast({
                title: 'Payment Failed',
                description: verifyData.message || 'Could not verify payment',
                variant: 'destructive',
              });
            }
          } catch {
            toast({
              title: 'Error',
              description: 'Payment verification failed. Contact support.',
              variant: 'destructive',
            });
          }
        },
        prefill: {
          name: userName,
          email: user.email,
        },
        theme: { color: '#16a34a' },
        modal: {
          ondismiss: () => {
            toast({
              title: 'Payment cancelled',
              description: 'You closed the payment window.',
            });
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err) {
      toast({
        title: 'Error',
        description: 'Payment failed. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'chef': return !!selectedChefId;
      case 'menu': return selectedDishes.length > 0;
      case 'plan': return true;
      case 'address': return homeAddress.street && homeAddress.city && homeAddress.state && homeAddress.zipCode;
      default: return true;
    }
  };

  const nextStep = () => {
    const steps: Step[] = ['chef', 'menu', 'plan', 'address', 'confirm', 'payment'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) setStep(steps[currentIndex + 1]);
  };

  const prevStep = () => {
    const steps: Step[] = ['chef', 'menu', 'plan', 'address', 'confirm', 'payment'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) setStep(steps[currentIndex - 1]);
  };

  const toggleDish = (dishId: string) => {
    setSelectedDishes(prev =>
      prev.includes(dishId) ? prev.filter(id => id !== dishId) : [...prev, dishId]
    );
  };

  const getSelectedDishesNutrition = () => {
    const selected = chefDishes.filter(d => selectedDishes.includes(d.id));
    if (selected.length === 0) return null;
    const total = selected.reduce((acc, dish) => ({
      calories: acc.calories + dish.nutritionalInfo.calories,
      protein: acc.protein + dish.nutritionalInfo.protein,
      carbs: acc.carbs + dish.nutritionalInfo.carbs,
      fat: acc.fat + dish.nutritionalInfo.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    return {
      avg: {
        calories: Math.round(total.calories / selected.length),
        protein: Math.round(total.protein / selected.length),
        carbs: Math.round(total.carbs / selected.length),
        fat: Math.round(total.fat / selected.length),
      },
      count: selected.length,
    };
  };

  const nutritionSummary = getSelectedDishesNutrition();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);

  return (
    <Layout>
      <div className="container py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm mb-2">
              {['Chef', 'Menu', 'Plan', 'Address', 'Confirm', 'Payment'].map((label, index) => {
                const steps: Step[] = ['chef', 'menu', 'plan', 'address', 'confirm', 'payment'];
                const isActive = steps.indexOf(step) >= index;
                return (
                  <div key={label} className={`flex items-center gap-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="hidden sm:inline">{label}</span>
                  </div>
                );
              })}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${((['chef', 'menu', 'plan', 'address', 'confirm', 'payment'].indexOf(step) + 1) / 6) * 100}%` }}
              />
            </div>
          </div>

          {/* Step: Select Chef */}
          {step === 'chef' && (
            <div className="animate-fade-in">
              <h2 className="font-display text-2xl font-bold mb-2">Choose Your Chef</h2>
              <p className="text-muted-foreground mb-6">Select a chef to prepare your daily meals</p>
              <div className="grid gap-4">
                {chefs.map(chef => (
                  <Card
                    key={chef.id}
                    className={`cursor-pointer transition-all ${
                      selectedChefId === chef.id ? 'ring-2 ring-primary shadow-elevated' : 'shadow-card hover:shadow-card-hover'
                    }`}
                    onClick={() => setSelectedChefId(chef.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-chef flex items-center justify-center">
                          <ChefHat className="w-8 h-8 text-chef-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display font-bold">{chef.name}</h3>
                          <p className="text-sm text-muted-foreground">{chef.specialty}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="w-4 h-4 fill-warning text-warning" />
                            <span className="text-sm font-medium">{chef.rating?.toFixed(1) || 'New'}</span>
                            <span className="text-xs text-muted-foreground">• {chef.dishes.length} dishes</span>
                          </div>
                        </div>
                        {selectedChefId === chef.id && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-5 h-5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step: Select Menu */}
          {step === 'menu' && (
            <div className="animate-fade-in">
              <h2 className="font-display text-2xl font-bold mb-2">Choose Your Dishes</h2>
              <p className="text-muted-foreground mb-6">
                Select dishes from {selectedChef?.name}'s menu. We'll rotate them for your meals.
              </p>
              {nutritionSummary && (
                <Card className="mb-6 bg-primary/5 border-primary/20">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{nutritionSummary.count} dishes selected</p>
                        <p className="text-sm text-muted-foreground">Average per meal:</p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-warning" />
                          {nutritionSummary.avg.calories} cal
                        </span>
                        <span className="flex items-center gap-1">
                          <Dumbbell className="w-4 h-4 text-info" />
                          {nutritionSummary.avg.protein}g protein
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="grid gap-3">
                {chefDishes.map(dish => (
                  <div
                    key={dish.id}
                    onClick={() => toggleDish(dish.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedDishes.includes(dish.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        dish.category === 'veg' ? 'bg-accent/20' : 'bg-destructive/20'
                      }`}>
                        {dish.category === 'veg' ? (
                          <Leaf className="w-5 h-5 text-accent" />
                        ) : (
                          <Drumstick className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium flex items-center gap-2">
                          {dish.name}
                          {dish.isSpecial && <Sparkles className="w-4 h-4 text-warning" />}
                        </h4>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <span>{dish.nutritionalInfo.calories} cal</span>
                          <span>{dish.nutritionalInfo.protein}g protein</span>
                          {dish.allowsCustomization && (
                            <Badge variant="secondary" className="text-xs">Customizable</Badge>
                          )}
                        </div>
                      </div>
                      {selectedDishes.includes(dish.id) && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step: Select Plan */}
          {step === 'plan' && (
            <div className="animate-fade-in">
              <h2 className="font-display text-2xl font-bold mb-2">Choose Your Plan</h2>
              <p className="text-muted-foreground mb-6">Select a subscription plan that fits your needs</p>
              <div className="grid gap-4">
                {plans.map(p => (
                  <Card
                    key={p.id}
                    className={`cursor-pointer transition-all ${
                      plan === p.id ? 'ring-2 ring-primary shadow-elevated' : 'shadow-card hover:shadow-card-hover'
                    } ${p.popular ? 'border-primary' : ''}`}
                    onClick={() => setPlan(p.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-bold text-lg">{p.name}</h3>
                            {p.popular && <Badge className="gradient-primary">Popular</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{p.meals} • {planSlots[p.id]}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{p.price}</p>
                          <p className="text-xs text-muted-foreground">{p.perMeal}</p>
                        </div>
                        {plan === p.id && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-4">
                            <Check className="w-5 h-5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step: Address */}
          {step === 'address' && (
            <div className="animate-fade-in">
              <h2 className="font-display text-2xl font-bold mb-2">Delivery Addresses</h2>
              <p className="text-muted-foreground mb-6">Add your home and work addresses for flexible delivery</p>
              <div className="space-y-6">
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Home Address *
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input placeholder="Street address" value={homeAddress.street} onChange={(e) => setHomeAddress({ ...homeAddress, street: e.target.value })} required />
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="City" value={homeAddress.city} onChange={(e) => setHomeAddress({ ...homeAddress, city: e.target.value })} required />
                      <Input placeholder="State" value={homeAddress.state} onChange={(e) => setHomeAddress({ ...homeAddress, state: e.target.value })} required />
                    </div>
                    <Input placeholder="ZIP Code" value={homeAddress.zipCode} onChange={(e) => setHomeAddress({ ...homeAddress, zipCode: e.target.value })} required />
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Work Address (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input placeholder="Street address" value={workAddress.street} onChange={(e) => setWorkAddress({ ...workAddress, street: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="City" value={workAddress.city} onChange={(e) => setWorkAddress({ ...workAddress, city: e.target.value })} />
                      <Input placeholder="State" value={workAddress.state} onChange={(e) => setWorkAddress({ ...workAddress, state: e.target.value })} />
                    </div>
                    <Input placeholder="ZIP Code" value={workAddress.zipCode} onChange={(e) => setWorkAddress({ ...workAddress, zipCode: e.target.value })} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && (
            <div className="animate-fade-in">
              <h2 className="font-display text-2xl font-bold mb-2">Confirm Subscription</h2>
              <p className="text-muted-foreground mb-6">Review your subscription details</p>
              <Card className="shadow-elevated mb-6">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b">
                    <div className="w-12 h-12 rounded-xl bg-chef flex items-center justify-center">
                      <ChefHat className="w-6 h-6 text-chef-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Your Chef</p>
                      <p className="font-display font-bold">{selectedChef?.name}</p>
                    </div>
                  </div>
                  <div className="pb-4 border-b">
                    <p className="text-sm text-muted-foreground mb-1">Subscription Plan</p>
                    <div className="flex justify-between items-center">
                      <p className="font-bold">{plans.find(p => p.id === plan)?.name} • {planSlots[plan]}</p>
                      <p className="text-xl font-bold text-primary">{plans.find(p => p.id === plan)?.price}</p>
                    </div>
                  </div>
                  <div className="pb-4 border-b">
                    <p className="text-sm text-muted-foreground mb-2">Selected Dishes ({selectedDishes.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {chefDishes.filter(d => selectedDishes.includes(d.id)).map(dish => (
                        <Badge key={dish.id} variant="secondary">{dish.name}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Default Delivery</p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {homeAddress.street}, {homeAddress.city}, {homeAddress.state} - {homeAddress.zipCode}
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Subscription Start Date</p>
                    <p className="font-medium">{startDate.toDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step: Payment */}
          {step === 'payment' && (
            <div className="animate-fade-in">
              <h2 className="font-display text-2xl font-bold mb-2">Payment</h2>
              <p className="text-muted-foreground mb-6">Complete your payment to activate the subscription</p>
              <Card className="shadow-elevated mb-6">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Selected Plan</p>
                    <p className="font-medium">{plans.find(p => p.id === plan)?.name}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Meal Slots</p>
                    <p className="font-medium">{planSlots[plan]}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{startDate.toDateString()}</p>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <p className="text-sm text-muted-foreground">Total Monthly Cost</p>
                    <p className="text-xl font-bold text-primary">{plans.find(p => p.id === plan)?.price}</p>
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-3 mb-6">
                {([
                  { id: 'upi', label: 'UPI' },
                  { id: 'debit', label: 'Debit Card' },
                  { id: 'credit', label: 'Credit Card' },
                  { id: 'netbanking', label: 'Net Banking' },
                ] as const).map((method) => (
                  <Button
                    key={method.id}
                    variant={paymentMethod === method.id ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod(method.id)}
                    className="justify-start"
                  >
                    {method.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step !== 'chef' && (
              <Button variant="outline" onClick={prevStep} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            {step !== 'payment' ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex-1 gradient-primary"
              >
                {step === 'confirm' ? 'Proceed to Payment' : 'Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handlePayment}
                disabled={loading}
                className="flex-1 gradient-primary"
              >
                {loading ? 'Processing...' : 'Complete Payment'}
                <Check className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Subscribe;