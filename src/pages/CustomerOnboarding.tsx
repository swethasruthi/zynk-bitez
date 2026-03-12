import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ChefHat, ArrowRight, CheckCircle2, Home, Briefcase, MapPin } from 'lucide-react';
import * as api from '@/services/api';
import type { Address, AddressType } from '@/types';

type Step = 'welcome' | 'profile' | 'address' | 'done';

export const CustomerOnboarding = () => {
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressType, setAddressType] = useState<AddressType>('home');
  const [house, setHouse] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const buildAddress = (): Address => ({
    street: `${house} ${street}`.trim(),
    city: city.trim(),
    state: '',
    zipCode: pincode.trim(),
    landmark: landmark.trim() || undefined,
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('address');
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const password = `temp-${Date.now()}`;
    const finalEmail = email.trim() || `customer_${Date.now()}@zynk.local`;
    const address = buildAddress();

    const response = api.registerCustomer(
      finalEmail,
      password,
      name.trim(),
      phone.trim(),
      addressType === 'home' ? address : undefined,
      addressType === 'work' ? address : undefined
    );

    if (response.success && response.data) {
      login(response.data);
      toast({ title: 'Registration Completed', description: 'Your profile is ready.' });
      setStep('done');
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }

    setSubmitting(false);
  };

  return (
    <Layout>
      <div className="container py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {step === 'welcome' && (
            <Card className="shadow-elevated overflow-hidden">
              <CardContent className="p-10 text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <ChefHat className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-3xl font-bold mb-2">Welcome to ZYNK</h1>
                  <p className="text-muted-foreground">
                    Home-cooked meals from trusted local chefs, delivered to your door.
                  </p>
                </div>
                <Button size="lg" className="gradient-primary" onClick={() => setStep('profile')}>
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'profile' && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display">Basic Profile Setup</CardTitle>
                <CardDescription>Tell us who we are delivering to</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email (optional)</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                  </div>
                  <Button type="submit" className="w-full gradient-primary">
                    Continue
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 'address' && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display">Address Setup</CardTitle>
                <CardDescription>Add your default delivery address</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={addressType === 'home' ? 'default' : 'outline'}
                      onClick={() => setAddressType('home')}
                      className="flex-1"
                    >
                      <Home className="w-4 h-4 mr-2" /> Home
                    </Button>
                    <Button
                      type="button"
                      variant={addressType === 'work' ? 'default' : 'outline'}
                      onClick={() => setAddressType('work')}
                      className="flex-1"
                    >
                      <Briefcase className="w-4 h-4 mr-2" /> Work
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>House / Flat Number</Label>
                    <Input value={house} onChange={(e) => setHouse(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Street / Area</Label>
                    <Input value={street} onChange={(e) => setStreet(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Pincode</Label>
                      <Input value={pincode} onChange={(e) => setPincode(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Landmark (optional)</Label>
                    <Input value={landmark} onChange={(e) => setLandmark(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full gradient-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 'done' && (
            <Card className="shadow-elevated">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold">Registration Completed</h2>
                  <p className="text-muted-foreground">Your profile is ready. Let's pick your chef.</p>
                </div>
                <Badge variant="secondary" className="mx-auto">
                  <MapPin className="w-3 h-3 mr-1" />
                  Default address saved
                </Badge>
                <Button className="w-full gradient-primary" onClick={() => navigate('/chefs')}>
                  Browse Chefs
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CustomerOnboarding;

