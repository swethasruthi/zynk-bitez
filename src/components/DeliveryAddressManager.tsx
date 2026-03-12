import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Home, Briefcase } from 'lucide-react';
import type { Address, AddressType } from '@/types';

interface DeliveryAddressManagerProps {
  isLocked: boolean;
  cutoffLabel: string;
  homeAddress?: Address;
  workAddress?: Address;
  selectedAddressType?: AddressType;
  customAddress?: Address;
  onSelect: (type: AddressType | 'custom', customAddress?: Address) => void;
}

const formatAddress = (address?: Address) => {
  if (!address) return 'No address set';
  return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
};

export const DeliveryAddressManager = ({
  isLocked,
  cutoffLabel,
  homeAddress,
  workAddress,
  selectedAddressType,
  customAddress,
  onSelect,
}: DeliveryAddressManagerProps) => {
  const [custom, setCustom] = useState<Address>(
    customAddress || { street: '', city: '', state: '', zipCode: '' }
  );

  useEffect(() => {
    if (customAddress) {
      setCustom(customAddress);
    }
  }, [customAddress]);

  const activeType = customAddress ? 'custom' : (selectedAddressType || 'home');

  return (
    <div className="rounded-xl border border-border/50 p-3 bg-white/70">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">Delivery Address</p>
        {isLocked && (
          <Badge variant="secondary" className="gap-1">
            <Lock className="w-3 h-3" />
            Confirmed by {cutoffLabel}
          </Badge>
        )}
      </div>

      {isLocked ? (
        <p className="text-sm text-muted-foreground">
          {customAddress ? formatAddress(customAddress) : formatAddress(selectedAddressType === 'work' ? workAddress : homeAddress)}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={activeType === 'home' ? 'default' : 'outline'}
              onClick={() => onSelect('home')}
              disabled={!homeAddress}
            >
              <Home className="w-4 h-4 mr-1" /> Home
            </Button>
            <Button
              size="sm"
              variant={activeType === 'work' ? 'default' : 'outline'}
              onClick={() => onSelect('work')}
              disabled={!workAddress}
            >
              <Briefcase className="w-4 h-4 mr-1" /> Work
            </Button>
          </div>

          <div className="rounded-lg border border-dashed border-border/70 p-3">
            <Label className="text-xs text-muted-foreground">One-time custom address</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Input
                placeholder="Street"
                value={custom.street}
                onChange={(e) => setCustom({ ...custom, street: e.target.value })}
              />
              <Input
                placeholder="City"
                value={custom.city}
                onChange={(e) => setCustom({ ...custom, city: e.target.value })}
              />
              <Input
                placeholder="State"
                value={custom.state}
                onChange={(e) => setCustom({ ...custom, state: e.target.value })}
              />
              <Input
                placeholder="ZIP"
                value={custom.zipCode}
                onChange={(e) => setCustom({ ...custom, zipCode: e.target.value })}
              />
            </div>
            <Button className="mt-3" size="sm" variant="outline" onClick={() => onSelect('custom', custom)}>
              Use This Address
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
