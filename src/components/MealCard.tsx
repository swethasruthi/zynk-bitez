import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UtensilsCrossed, Lock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { SkipSwapPanel } from '@/components/SkipSwapPanel';
import { DeliveryAddressManager } from '@/components/DeliveryAddressManager';
import type { Address, AddressType, DailyMeal } from '@/types';

type AlternativeOption = { id: string; name: string };

interface MealCardProps {
  meal: DailyMeal;
  mealLabel: string;
  mealName: string;
  mealDescription?: string;
  alternatives: AlternativeOption[];
  isLocked: boolean;
  cutoffAt: Date;
  homeAddress?: Address;
  workAddress?: Address;
  onSkip: () => void;
  onUnskip: () => void;
  onSwap: (mealId: string) => void;
  onUpdateAddress: (type: AddressType | 'custom', customAddress?: Address) => void;
}

export const MealCard = ({
  meal,
  mealLabel,
  mealName,
  mealDescription,
  alternatives,
  isLocked,
  cutoffAt,
  homeAddress,
  workAddress,
  onSkip,
  onUnskip,
  onSwap,
  onUpdateAddress,
}: MealCardProps) => {
  const hasAlternatives = alternatives.length > 0;
  const cutoffLabel = format(cutoffAt, 'EEE, MMM d h:mm a');
  const dateLabel = format(parseISO(meal.date), 'EEE, MMM d');

  return (
    <Card className="shadow-soft bg-white/90 backdrop-blur-sm border border-green-100">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                <UtensilsCrossed className="w-4 h-4 text-white" />
              </div>
              {mealLabel}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{dateLabel}</p>
          </div>
          {isLocked && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="w-3 h-3" />
              Confirmed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-xl bg-gradient-to-r from-green-50/70 to-emerald-50/40 border border-green-100">
          <p className="font-medium">{mealName}</p>
          {mealDescription && (
            <p className="text-sm text-muted-foreground mt-1">{mealDescription}</p>
          )}
          <div className="flex gap-2 mt-2">
            {meal.isSkipped && <Badge variant="destructive">Skipped</Badge>}
            {meal.isSwapped && <Badge variant="secondary">Swapped</Badge>}
            {!meal.isSkipped && hasAlternatives && <Badge variant="outline">Swappable</Badge>}
          </div>
        </div>

        <SkipSwapPanel
          isSkipped={meal.isSkipped}
          isLocked={isLocked}
          cutoffLabel={cutoffLabel}
          alternatives={alternatives}
          onSkip={onSkip}
          onUnskip={onUnskip}
          onSwap={onSwap}
        />

        <DeliveryAddressManager
          isLocked={isLocked}
          cutoffLabel={cutoffLabel}
          homeAddress={homeAddress}
          workAddress={workAddress}
          selectedAddressType={meal.deliveryAddressType}
          customAddress={meal.deliveryAddressOverride}
          onSelect={onUpdateAddress}
        />
      </CardContent>
    </Card>
  );
};
