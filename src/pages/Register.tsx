import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, ChefHat, Eye, EyeOff, Home, Briefcase, MapPin, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Address, PlanType } from '@/types';

type RegistrationType = 'customer' | 'chef';
type RegistrationStep = 'basic' | 'addresses' | 'chef' | 'payment' | 'kitchen';

type ChefWithData = ReturnType<typeof api.getApprovedChefsWithRatings>['data'] extends (infer T)[] | undefined ? T : never;

const emptyAddress: Address = {
  street: '',
  city: '',
  state: '',
  zipCode: '',
};

const AddressForm = ({ 
  address, 
  setAddress, 
  title, 
  icon: Icon 
}: { 
  address: Address; 
  setAddress: (a: Address) => void; 
  title: string; 
  icon: typeof Home;
}) => {
  return (
    <div className="space-y-3 p-5 rounded-sm bg-secondary border border-gray-200">
      <div className="flex items-center gap-2 font-chef text-xs tracking-wider text-charcoal">
        <Icon className="w-4 h-4 text-green-500" />
        {title}
      </div>
      <Input
        placeholder="Street address"
        value={address.street}
        onChange={(e) => setAddress({ ...address, street: e.target.value })}
        type="text"
        className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="City"
          value={address.city}
          onChange={(e) => setAddress({ ...address, city: e.target.value })}
          type="text"
          className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
        />
        <Input
          placeholder="State"
          value={address.state}
          onChange={(e) => setAddress({ ...address, state: e.target.value })}
          type="text"
          className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
        />
      </div>
      <Input
        placeholder="ZIP Code"
        value={address.zipCode}
        onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
        type="text"
        className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
      />
    </div>
  );
};

export const Register = () => {
  const [type, setType] = useState<RegistrationType>('customer');
  const [step, setStep] = useState<RegistrationStep>('basic');
  
  // Basic info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Customer addresses
  const [homeAddress, setHomeAddress] = useState<Address>({ ...emptyAddress });
  const [workAddress, setWorkAddress] = useState<Address>({ ...emptyAddress });

  const [chefs, setChefs] = useState<ChefWithData[]>([]);
  const [loadingChefs, setLoadingChefs] = useState(false);
  const [selectedChefId, setSelectedChefId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'debit' | 'credit' | 'netbanking'>('upi');
  
  // Chef info
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [kitchenLocation, setKitchenLocation] = useState<Address>({ ...emptyAddress });
  const [serviceArea, setServiceArea] = useState('');
  const [deliverySlots, setDeliverySlots] = useState<string[]>(['lunch', 'dinner']);
  
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const planOptions: { id: PlanType; name: string; slots: string; price: string }[] = [
    { id: 'basic', name: 'Basic', slots: 'Lunch', price: '₹2,999' },
    { id: 'standard', name: 'Standard', slots: 'Lunch + Dinner', price: '₹4,499' },
    { id: 'premium', name: 'Premium', slots: 'Breakfast + Lunch + Dinner', price: '₹5,999' },
  ];

  const selectedChef = chefs.find((chef) => chef.id === selectedChefId) || null;
  const selectedPlanOption = planOptions.find((plan) => plan.id === selectedPlan) || planOptions[0];

  const loadChefs = () => {
    setLoadingChefs(true);
    const response = api.getApprovedChefsWithRatings();
    if (response.success && response.data) {
      setChefs(response.data);
    }
    setLoadingChefs(false);
  };

  useEffect(() => {
    if (type === 'customer' && step === 'chef') {
      loadChefs();
    }
  }, [type, step]);

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'customer') {
      setStep('addresses');
    } else {
      setStep('kitchen');
    }
  };

  const handleCustomerAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeAddress.street) {
      toast({ title: 'Home address required', description: 'Please add a home address to continue.', variant: 'destructive' });
      return;
    }
    setStep('chef');
  };

  const handleChefRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = api.registerChef(
        email, 
        password, 
        name, 
        specialty,
        bio,
        kitchenLocation.street ? kitchenLocation : undefined,
        serviceArea,
        deliverySlots
      );
      if (response.success && response.data) {
        login(response.data);
        toast({ 
          title: 'Registration Complete!', 
          description: 'You can now add your dishes. Orders will appear once you\'re approved.' 
        });
        navigate('/dashboard');
      } else {
        toast({ title: 'Error', description: response.error, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChefId) {
      toast({ title: 'Select a chef', description: 'Choose a chef before continuing to payment.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const registerResponse = api.registerCustomer(
        email, 
        password, 
        name, 
        phone, 
        homeAddress.street ? homeAddress : undefined,
        workAddress.street ? workAddress : undefined
      );

      if (!registerResponse.success || !registerResponse.data) {
        toast({ title: 'Error', description: registerResponse.error, variant: 'destructive' });
        return;
      }

      login(registerResponse.data);

      const subscriptionResponse = api.subscribeWithChef(
        registerResponse.data.id,
        selectedChefId,
        [],
        selectedPlan,
        homeAddress,
        workAddress.street ? workAddress : undefined
      );

      if (!subscriptionResponse.success) {
        toast({ title: 'Error', description: subscriptionResponse.error, variant: 'destructive' });
        return;
      }

      toast({ title: 'Payment successful', description: 'Subscription activated.' });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDeliverySlot = (slot: string) => {
    if (deliverySlots.includes(slot)) {
      if (deliverySlots.length > 1) {
        setDeliverySlots(deliverySlots.filter(s => s !== slot));
      }
    } else {
      setDeliverySlots([...deliverySlots, slot]);
    }
  };

  const getMealName = (chef: ChefWithData, mealId?: string) => {
    if (!mealId) return '—';
    const dish = chef.dishes.find(d => d.id === mealId);
    return dish?.name || 'Meal';
  };

  const getMenuChartDays = (chef: ChefWithData) => {
    const chart = chef.menuCharts?.[0];
    if (!chart) return [];
    const today = new Date().toISOString().split('T')[0];
    return chart.days.filter(day => day.date >= today).slice(0, 7);
  };

  const menuChartDays = selectedChef ? getMenuChartDays(selectedChef) : [];

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-secondary to-background py-12 px-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <p className="font-chef text-xs tracking-widest text-green-500 mb-4">
              {step === 'basic' && 'JOIN THE KITCHEN'}
              {step === 'addresses' && 'DELIVERY SETUP'}
              {step === 'chef' && 'CHOOSE YOUR CHEF'}
              {step === 'payment' && 'PAYMENT'}
              {step === 'kitchen' && 'CHEF PROFILE'}
            </p>
            <h1 className="font-display text-3xl font-bold text-charcoal">
              {step === 'basic' && 'Create Account'}
              {step === 'addresses' && 'Delivery Addresses'}
              {step === 'chef' && 'Select a Chef'}
              {step === 'payment' && 'Complete Payment'}
              {step === 'kitchen' && 'Kitchen Setup'}
            </h1>
            <div className="w-12 h-0.5 bg-charcoal mx-auto mt-4" />
            <p className="mt-4 text-muted-foreground">
              {step === 'basic' && 'Join ZYNK and experience culinary excellence'}
              {step === 'addresses' && 'Add your locations for seamless delivery'}
              {step === 'chef' && 'Pick a chef, review their menu chart, and choose your plan'}
              {step === 'payment' && 'Securely complete payment to activate your subscription'}
              {step === 'kitchen' && 'Tell us about your culinary expertise'}
            </p>
          </div>

          <Card className="chef-card border border-gray-200 shadow-kitchen">
            <CardContent className="pt-8 pb-6">
              {step === 'basic' && (
                <>
                  {/* Role Toggle - Professional Style */}
                  <div className="flex gap-0 mb-8 border border-gray-200 rounded-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setType('customer')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 font-chef text-xs tracking-wider transition-all ${
                        type === 'customer' 
                          ? 'bg-charcoal text-white' 
                          : 'bg-white text-charcoal hover:bg-gray-50'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      CUSTOMER
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('chef')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 font-chef text-xs tracking-wider transition-all ${
                        type === 'chef' 
                          ? 'bg-charcoal text-white' 
                          : 'bg-white text-charcoal hover:bg-gray-50'
                      }`}
                    >
                      <ChefHat className="w-4 h-4" />
                      CHEF PARTNER
                    </button>
                  </div>

                  <form onSubmit={handleBasicSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-chef text-xs tracking-wider text-charcoal">FULL NAME</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-chef text-xs tracking-wider text-charcoal">EMAIL</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                        className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="font-chef text-xs tracking-wider text-charcoal">PASSWORD</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-charcoal"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-chef text-xs tracking-wider text-charcoal">PHONE</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91-9876543210"
                        className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>

                    {type === 'chef' && (
                      <div className="space-y-2">
                        <Label htmlFor="specialty" className="font-chef text-xs tracking-wider text-charcoal">SPECIALTY CUISINE</Label>
                        <Input
                          id="specialty"
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          placeholder="North Indian, Continental..."
                          className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                    )}

                    <Button type="submit" className="w-full btn-chef mt-6">
                      CONTINUE
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </>
              )}

            {step === 'addresses' && (
              <form onSubmit={handleCustomerAddressSubmit} className="space-y-5">
                <AddressForm 
                  address={homeAddress} 
                  setAddress={setHomeAddress} 
                  title="HOME ADDRESS" 
                  icon={Home} 
                />
                
                <AddressForm 
                  address={workAddress} 
                  setAddress={setWorkAddress} 
                  title="WORK ADDRESS" 
                  icon={Briefcase} 
                />

                <p className="text-xs text-muted-foreground text-center font-chef tracking-wider">
                  SWITCH BETWEEN ADDRESSES DAILY UNTIL 8 PM
                </p>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep('basic')} className="flex-1 font-chef tracking-wider text-xs">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    BACK
                  </Button>
                  <Button type="submit" className="flex-1 btn-green" disabled={isLoading}>
                    {isLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
                  </Button>
                </div>
              </form>
            )}

            {step === 'chef' && (
              <div className="space-y-5">
                <div className="space-y-3">
                  {loadingChefs ? (
                    <div className="text-sm text-muted-foreground">Loading chefs...</div>
                  ) : chefs.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No approved chefs available right now.</div>
                  ) : (
                    chefs.map((chef) => (
                      <button
                        key={chef.id}
                        type="button"
                        onClick={() => setSelectedChefId(chef.id)}
                        className={`w-full text-left border rounded-sm p-4 transition-colors ${
                          selectedChefId === chef.id ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-display text-lg font-bold text-charcoal">{chef.name}</p>
                            <p className="text-sm text-muted-foreground">{chef.specialty}</p>
                            <p className="text-xs text-muted-foreground mt-1">{chef.serviceArea}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-charcoal">{chef.avgRating?.toFixed(1) || 'New'}</p>
                            <p className="text-xs text-muted-foreground">{chef.reviewCount || 0} reviews</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {selectedChef && (
                  <div className="space-y-4">
                    <div className="rounded-sm border border-gray-200 p-4">
                      <p className="font-chef text-xs tracking-wider text-charcoal mb-3">MENU CHART</p>
                      {menuChartDays.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Menu chart not uploaded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {menuChartDays.map((day) => {
                            const slots = day.slots || {};
                            return (
                              <div key={day.date} className="rounded-sm border border-gray-200 px-3 py-2">
                                <p className="text-xs font-medium text-charcoal">{day.date}</p>
                                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                  <div>Breakfast: {getMealName(selectedChef, slots.breakfast?.mealId)}</div>
                                  <div>Lunch: {getMealName(selectedChef, slots.lunch?.mealId)}</div>
                                  <div>Dinner: {getMealName(selectedChef, slots.dinner?.mealId)}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="rounded-sm border border-gray-200 p-4">
                      <p className="font-chef text-xs tracking-wider text-charcoal mb-3">CHOOSE PLAN</p>
                      <div className="grid gap-3">
                        {planOptions.map((plan) => (
                          <div key={plan.id} className="flex items-center justify-between rounded-sm border border-gray-200 px-3 py-2">
                            <div>
                              <p className="font-medium text-charcoal">{plan.name}</p>
                              <p className="text-xs text-muted-foreground">{plan.slots}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-primary">{plan.price}</p>
                              <Button
                                type="button"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                  setSelectedPlan(plan.id);
                                  setStep('payment');
                                }}
                              >
                                Select
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep('addresses')} className="flex-1 font-chef tracking-wider text-xs">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    BACK
                  </Button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <form onSubmit={handlePaymentSubmit} className="space-y-5">
                <div className="rounded-sm border border-gray-200 p-4 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Selected Chef</p>
                    <p className="font-medium text-charcoal">{selectedChef?.name || 'Not selected'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="font-medium text-charcoal">{selectedPlanOption.name} • {selectedPlanOption.slots}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly Price</p>
                    <p className="text-lg font-bold text-primary">{selectedPlanOption.price}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-chef text-xs tracking-wider text-charcoal">PAYMENT METHOD</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'upi', label: 'UPI' },
                      { id: 'debit', label: 'Debit Card' },
                      { id: 'credit', label: 'Credit Card' },
                      { id: 'netbanking', label: 'Net Banking' },
                    ].map((method) => (
                      <Button
                        key={method.id}
                        type="button"
                        variant={paymentMethod === method.id ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod(method.id as typeof paymentMethod)}
                        className="justify-start"
                      >
                        {method.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep('chef')} className="flex-1 font-chef tracking-wider text-xs">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    BACK
                  </Button>
                  <Button type="submit" className="flex-1 btn-green" disabled={isLoading}>
                    {isLoading ? 'PROCESSING...' : 'PAY & ACTIVATE'}
                  </Button>
                </div>
              </form>
            )}

            {step === 'kitchen' && (
              <form onSubmit={handleChefRegistrationSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="bio" className="font-chef text-xs tracking-wider text-charcoal">BIO (OPTIONAL)</Label>
                  <Input
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell customers about yourself..."
                    className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-3 p-5 rounded-sm bg-secondary border border-gray-200">
                  <div className="flex items-center gap-2 font-chef text-xs tracking-wider text-charcoal">
                    <MapPin className="w-4 h-4 text-green-500" />
                    KITCHEN LOCATION
                  </div>
                  <Input
                    placeholder="Street address"
                    value={kitchenLocation.street}
                    onChange={(e) => setKitchenLocation({ ...kitchenLocation, street: e.target.value })}
                    type="text"
                    className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="City"
                      value={kitchenLocation.city}
                      onChange={(e) => setKitchenLocation({ ...kitchenLocation, city: e.target.value })}
                      type="text"
                      className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                    <Input
                      placeholder="State"
                      value={kitchenLocation.state}
                      onChange={(e) => setKitchenLocation({ ...kitchenLocation, state: e.target.value })}
                      type="text"
                      className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <Input
                    placeholder="ZIP Code"
                    value={kitchenLocation.zipCode}
                    onChange={(e) => setKitchenLocation({ ...kitchenLocation, zipCode: e.target.value })}
                    type="text"
                    className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceArea" className="font-chef text-xs tracking-wider text-charcoal">SERVICE AREA</Label>
                  <Input
                    id="serviceArea"
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    placeholder="e.g., Koramangala, HSR Layout, Indiranagar"
                    className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-chef text-xs tracking-wider text-charcoal">DELIVERY SLOTS</Label>
                  <div className="flex gap-0 border border-gray-200 rounded-sm overflow-hidden">
                    {['lunch', 'dinner'].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => toggleDeliverySlot(slot)}
                        className={`flex-1 py-3 font-chef text-xs tracking-wider uppercase transition-all ${
                          deliverySlots.includes(slot)
                            ? 'bg-charcoal text-white'
                            : 'bg-white text-charcoal hover:bg-gray-50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep('basic')} className="flex-1 font-chef tracking-wider text-xs">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    BACK
                  </Button>
                  <Button type="submit" className="flex-1 btn-green" disabled={isLoading}>
                    {isLoading ? 'SUBMITTING...' : 'COMPLETE REGISTRATION'}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-green-500 hover:text-green-500-dark font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </Layout>
);
};
