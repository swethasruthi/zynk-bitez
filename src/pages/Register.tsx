import { useState } from 'react';
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
import type { Address } from '@/types';

type RegistrationType = 'customer' | 'chef';
type RegistrationStep = 'basic' | 'addresses' | 'kitchen';

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
    <div className="space-y-3 p-4 rounded-xl bg-secondary/50">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </div>
      <Input
        placeholder="Street address"
        value={address.street}
        onChange={(e) => setAddress({ ...address, street: e.target.value })}
        type="text"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="City"
          value={address.city}
          onChange={(e) => setAddress({ ...address, city: e.target.value })}
          type="text"
        />
        <Input
          placeholder="State"
          value={address.state}
          onChange={(e) => setAddress({ ...address, state: e.target.value })}
          type="text"
        />
      </div>
      <Input
        placeholder="ZIP Code"
        value={address.zipCode}
        onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
        type="text"
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

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'customer') {
      setStep('addresses');
    } else {
      setStep('kitchen');
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (type === 'customer') {
        const response = api.registerCustomer(
          email, 
          password, 
          name, 
          phone, 
          homeAddress.street ? homeAddress : undefined,
          workAddress.street ? workAddress : undefined
        );
        if (response.success && response.data) {
          login(response.data);
          toast({ title: 'Welcome to ZYNK!', description: 'Your account has been created.' });
          navigate('/dashboard');
        } else {
          toast({ title: 'Error', description: response.error, variant: 'destructive' });
        }
      } else {
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
      }
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

  return (
    <Layout>
      <div className="container max-w-lg py-12 px-4">
        <Card className="animate-fade-in shadow-elevated">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">
              {step === 'basic' && 'Create Account'}
              {step === 'addresses' && 'Delivery Addresses'}
              {step === 'kitchen' && 'Kitchen Setup'}
            </CardTitle>
            <CardDescription>
              {step === 'basic' && 'Join ZYNK and never worry about meals again'}
              {step === 'addresses' && 'Add your home and work addresses for easy delivery switching'}
              {step === 'kitchen' && 'Tell us about your kitchen and service area'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'basic' && (
              <>
                {/* Role Toggle */}
                <div className="flex gap-2 p-1 bg-secondary rounded-lg mb-6">
                  <button
                    type="button"
                    onClick={() => setType('customer')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                      type === 'customer' 
                        ? 'bg-card shadow-card text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('chef')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                      type === 'chef' 
                        ? 'bg-card shadow-card text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ChefHat className="w-4 h-4" />
                    Chef Partner
                  </button>
                </div>

                <form onSubmit={handleBasicSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91-9876543210"
                    />
                  </div>

                  {type === 'chef' && (
                    <div className="space-y-2">
                      <Label htmlFor="specialty">Specialty Cuisine</Label>
                      <Input
                        id="specialty"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="North Indian, Continental..."
                      />
                    </div>
                  )}

                  <Button type="submit" className="w-full gradient-primary">
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </>
            )}

            {step === 'addresses' && (
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <AddressForm 
                  address={homeAddress} 
                  setAddress={setHomeAddress} 
                  title="Home Address" 
                  icon={Home} 
                />
                
                <AddressForm 
                  address={workAddress} 
                  setAddress={setWorkAddress} 
                  title="Work Address" 
                  icon={Briefcase} 
                />

                <p className="text-xs text-muted-foreground text-center">
                  You can switch between these addresses daily until 8 PM
                </p>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep('basic')} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 gradient-primary" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Account'}
                  </Button>
                </div>
              </form>
            )}

            {step === 'kitchen' && (
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (optional)</Label>
                  <Input
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell customers about yourself..."
                  />
                </div>

                <div className="space-y-3 p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="w-4 h-4 text-primary" />
                    Kitchen Location
                  </div>
                  <Input
                    placeholder="Street address"
                    value={kitchenLocation.street}
                    onChange={(e) => setKitchenLocation({ ...kitchenLocation, street: e.target.value })}
                    type="text"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="City"
                      value={kitchenLocation.city}
                      onChange={(e) => setKitchenLocation({ ...kitchenLocation, city: e.target.value })}
                      type="text"
                    />
                    <Input
                      placeholder="State"
                      value={kitchenLocation.state}
                      onChange={(e) => setKitchenLocation({ ...kitchenLocation, state: e.target.value })}
                      type="text"
                    />
                  </div>
                  <Input
                    placeholder="ZIP Code"
                    value={kitchenLocation.zipCode}
                    onChange={(e) => setKitchenLocation({ ...kitchenLocation, zipCode: e.target.value })}
                    type="text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceArea">Service Area</Label>
                  <Input
                    id="serviceArea"
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    placeholder="e.g., Koramangala, HSR Layout, Indiranagar"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Delivery Slots</Label>
                  <div className="flex gap-2">
                    {['lunch', 'dinner'].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => toggleDeliverySlot(slot)}
                        className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium capitalize transition-all ${
                          deliverySlots.includes(slot)
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep('basic')} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 gradient-primary" disabled={isLoading}>
                    {isLoading ? 'Submitting...' : 'Complete Registration'}
                  </Button>
                </div>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
