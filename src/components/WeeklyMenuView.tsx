import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfWeek, addDays } from 'date-fns';
import { MealCard } from '@/components/MealCard';
import type { Address, AddressType, DailyMeal, MealSlot } from '@/types';

interface WeeklyMenuViewProps {
  dailyMeals: DailyMeal[];
  planSlots: MealSlot[];
  getMealName: (mealId: string) => string;
  getMealDescription: (mealId: string) => string;
  getMealSlotLabel: (slot: MealSlot) => string;
  isMealLocked: (dateStr: string) => boolean;
  getCutoffForDate: (dateStr: string) => Date;
  homeAddress?: Address;
  workAddress?: Address;
  onSkip: (dailyMealId: string) => void;
  onUnskip: (dailyMealId: string) => void;
  onSwap: (dailyMealId: string, newMealId: string) => void;
  onUpdateAddress: (dailyMealId: string, type: AddressType | 'custom', customAddress?: Address) => void;
}

export const WeeklyMenuView = ({
  dailyMeals,
  planSlots,
  getMealName,
  getMealDescription,
  getMealSlotLabel,
  isMealLocked,
  getCutoffForDate,
  homeAddress,
  workAddress,
  onSkip,
  onUnskip,
  onSwap,
  onUpdateAddress,
}: WeeklyMenuViewProps) => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, index) => addDays(weekStart, index));
  const resolveMealSlot = (meal: DailyMeal): MealSlot => {
    const slot = meal.mealSlot || meal.mealTime;
    return slot === 'both' ? 'lunch' : (slot as MealSlot);
  };

  return (
    <Card className="shadow-card bg-white/85 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-display">Weekly Menu View</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const mealsForDay = dailyMeals
            .filter(dm => dm.date === dateStr)
            .filter(dm => planSlots.includes(resolveMealSlot(dm)));

          return (
            <div key={dateStr} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{format(day, 'EEEE, MMM d')}</h3>
                <Badge variant="secondary">{format(day, 'EEE')}</Badge>
              </div>

              {mealsForDay.length === 0 ? (
                <p className="text-sm text-muted-foreground">No meals scheduled.</p>
              ) : (
                <div className="grid gap-4">
                  {mealsForDay.map((meal) => {
                    const slot = resolveMealSlot(meal);
                    const cutoffAt = getCutoffForDate(meal.date);
                    const alternatives = (meal.alternativeMealIds || [])
                      .map(id => ({ id, name: getMealName(id) }))
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
                        homeAddress={homeAddress}
                        workAddress={workAddress}
                        onSkip={() => onSkip(meal.id)}
                        onUnskip={() => onUnskip(meal.id)}
                        onSwap={(newMealId) => onSwap(meal.id, newMealId)}
                        onUpdateAddress={(type, custom) => onUpdateAddress(meal.id, type, custom)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
