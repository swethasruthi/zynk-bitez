import { useState } from 'react';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, MapPin, Phone, Mail } from 'lucide-react';

const CustomerProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Profile data from localStorage mock (matches onboarding)
  const stored = (() => {
    try {
      const raw = localStorage.getItem('zynk_customer_profile');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [address, setAddress] = useState(stored?.address ?? '');
  const [pincode, setPincode] = useState(stored?.pincode ?? '');
  const [preference, setPreference] = useState(stored?.preference ?? 'vegetarian');

  const handleSave = () => {
    localStorage.setItem(
      'zynk_customer_profile',
      JSON.stringify({ address, pincode, preference, lat: stored?.lat, lng: stored?.lng })
    );
    toast({ title: 'Profile updated', description: 'Your profile has been saved.' });
  };

  return (
    <CustomerLayout title="Profile" subtitle="Manage your account and delivery preferences">
      <div className="max-w-xl space-y-6">
        {/* Account info */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="w-3.5 h-3.5" /> Email
              </Label>
              <Input value={user?.email ?? ''} disabled className="bg-muted" />
            </div>
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="w-3.5 h-3.5" /> Phone
              </Label>
              <Input value={user?.phone ?? ''} disabled className="bg-muted" />
            </div>
          </CardContent>
        </Card>

        {/* Delivery preferences */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Delivery Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label>Primary Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Pincode</Label>
              <Input value={pincode} onChange={(e) => setPincode(e.target.value)} maxLength={10} />
            </div>
            <div className="grid gap-1.5">
              <Label>Food Preference</Label>
              <select
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="vegetarian">Vegetarian</option>
                <option value="non-vegetarian">Non-Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="keto">Keto</option>
              </select>
            </div>
            <Button className="gradient-primary" onClick={handleSave}>
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
};

export default CustomerProfile;
