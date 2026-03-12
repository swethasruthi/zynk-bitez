import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChefHat, Clock, MapPin, UtensilsCrossed, AlertTriangle, Plus, Leaf, Drumstick, Flame, Dumbbell } from 'lucide-react';
import type { Order, Chef, Dish, NutritionalInfo, CustomizationOption, ChefMenuChart, ChefMenuDay, MealSlot } from '@/types';

export const ChefDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDish, setShowAddDish] = useState(false);
  const [canModify] = useState(!api.canModifyMeal());

  // New dish form
  const [dishName, setDishName] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishCategory, setDishCategory] = useState<'veg' | 'non-veg'>('veg');
  const [allowsCustomization, setAllowsCustomization] = useState(false);
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  const [menuChart, setMenuChart] = useState<ChefMenuChart | null>(null);
  const [menuStartDate, setMenuStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [menuDuration, setMenuDuration] = useState<7 | 14>(7);
  const [menuDays, setMenuDays] = useState<ChefMenuDay[]>([]);
  const [menuImageUrl, setMenuImageUrl] = useState<string | undefined>(undefined);

  const chef = user as Chef;
  const isApproved = chef?.status === 'approved';
  const slotOptions: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = () => {
    if (!user) return;
    setLoading(true);
    
    const ordersResponse = api.getChefOrders(user.id);
    if (ordersResponse.success) {
      setOrders(ordersResponse.data || []);
    }

    const dishesResponse = api.getChefDishes(user.id);
    if (dishesResponse.success) {
      setDishes(dishesResponse.data || []);
    }

    const menuResponse = api.getChefMenuCharts(user.id);
    if (menuResponse.success) {
      const existing = menuResponse.data?.[0] || null;
      setMenuChart(existing);
      if (existing) {
        setMenuStartDate(existing.startDate);
        const diff = Math.max(1, Math.round((new Date(existing.endDate).getTime() - new Date(existing.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
        setMenuDuration(diff === 14 ? 14 : 7);
        setMenuDays(existing.days);
        setMenuImageUrl(existing.imageUrl);
      }
    }
    
    setLoading(false);
  };

  const buildMenuDays = (startDate: string, duration: 7 | 14): ChefMenuDay[] => {
    const start = new Date(`${startDate}T00:00:00`);
    return Array.from({ length: duration }).map((_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return {
        date: day.toISOString().split('T')[0],
        slots: {},
      };
    });
  };

  useEffect(() => {
    if (!menuChart) {
      setMenuDays(buildMenuDays(menuStartDate, menuDuration));
    }
  }, [menuStartDate, menuDuration, menuChart]);

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const nutritionalInfo = api.generateNutritionalInfo(dishName);
    const customizationOptions: CustomizationOption[] = customOptions.map((opt, i) => ({
      id: `opt-${i}`,
      name: opt,
      type: 'add' as const,
    }));

    const response = api.addDish(
      user.id,
      dishName,
      dishDesc,
      dishCategory,
      nutritionalInfo,
      allowsCustomization,
      customizationOptions
    );

    if (response.success) {
      toast({ title: 'Dish Added!', description: 'Your new dish is now available.' });
      setShowAddDish(false);
      setDishName('');
      setDishDesc('');
      setCustomOptions([]);
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: 'preparing' | 'ready') => {
    if (!user) return;
    const response = api.updateOrderStatus(user.id, orderId, status);
    if (response.success) {
      toast({ title: 'Status Updated', description: `Order marked as ${status}` });
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const addCustomOption = () => {
    if (newOption.trim()) {
      setCustomOptions([...customOptions, newOption.trim()]);
      setNewOption('');
    }
  };

  const updateMenuSlot = (date: string, slot: MealSlot, mealId: string) => {
    setMenuDays(prev => prev.map(day => {
      if (day.date !== date) return day;
      const current = day.slots[slot] || { mealId: '', alternativeMealIds: [] };
      return {
        ...day,
        slots: {
          ...day.slots,
          [slot]: { ...current, mealId },
        },
      };
    }));
  };

  const updateMenuAlternatives = (date: string, slot: MealSlot, alternativeMealIds: string[]) => {
    setMenuDays(prev => prev.map(day => {
      if (day.date !== date) return day;
      const current = day.slots[slot] || { mealId: '', alternativeMealIds: [] };
      return {
        ...day,
        slots: {
          ...day.slots,
          [slot]: { ...current, alternativeMealIds },
        },
      };
    }));
  };

  const handleMenuImageUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMenuImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMenuChart = () => {
    if (!user) return;
    const start = new Date(`${menuStartDate}T00:00:00`);
    const end = new Date(start);
    end.setDate(start.getDate() + menuDuration - 1);

    const chart: ChefMenuChart = {
      id: menuChart?.id || `chart-${user.id}-${Date.now()}`,
      chefId: user.id,
      startDate: menuStartDate,
      endDate: end.toISOString().split('T')[0],
      imageUrl: menuImageUrl,
      days: menuDays,
    };

    const response = api.upsertChefMenuChart(user.id, chart);
    if (response.success) {
      toast({ title: 'Menu Chart Saved', description: 'Weekly menu has been updated.' });
      setMenuChart(chart);
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  // Pending approval view
  if (!isApproved && chef?.status === 'pending') {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-warning" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">Pending Approval</h1>
            <p className="text-muted-foreground">You can add your dishes while waiting for admin approval.</p>
          </div>

          {/* Dish Management Section */}
          <Card className="shadow-elevated mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display">Your Dishes</CardTitle>
                <Button onClick={() => setShowAddDish(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />Add Dish
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dishes.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No dishes yet. Add your first dish!</p>
              ) : (
                <div className="space-y-3">
                  {dishes.map((dish) => (
                    <DishCard key={dish.id} dish={dish} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Add Dish Modal
  if (showAddDish) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="font-display">Add New Dish</CardTitle>
              <CardDescription>Nutritional info will be auto-generated</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDish} className="space-y-4">
                <div className="space-y-2">
                  <Label>Dish Name</Label>
                  <Input value={dishName} onChange={(e) => setDishName(e.target.value)} placeholder="e.g., Butter Chicken Thali" required />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={dishDesc} onChange={(e) => setDishDesc(e.target.value)} placeholder="Brief description..." required />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant={dishCategory === 'veg' ? 'default' : 'outline'} onClick={() => setDishCategory('veg')} className="flex-1">
                      <Leaf className="w-4 h-4 mr-2 text-accent" />Veg
                    </Button>
                    <Button type="button" variant={dishCategory === 'non-veg' ? 'default' : 'outline'} onClick={() => setDishCategory('non-veg')} className="flex-1">
                      <Drumstick className="w-4 h-4 mr-2 text-destructive" />Non-Veg
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <input type="checkbox" checked={allowsCustomization} onChange={(e) => setAllowsCustomization(e.target.checked)} className="rounded" />
                    Allow Customization
                  </Label>
                </div>

                {allowsCustomization && (
                  <div className="space-y-2 p-3 rounded-lg bg-secondary/50">
                    <Label>Customization Options</Label>
                    <div className="flex gap-2">
                      <Input value={newOption} onChange={(e) => setNewOption(e.target.value)} placeholder="e.g., Extra rice" />
                      <Button type="button" onClick={addCustomOption} size="sm">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {customOptions.map((opt, i) => (
                        <Badge key={i} variant="secondary">{opt}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowAddDish(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" className="flex-1 gradient-primary">Add Dish</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Dashboard (approved chef)
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Kitchen Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #faf9f7 0%, #f5f3f0 50%, #f0ede8 100%)' }} />
        
        {/* Floating shapes */}
        <div className="absolute top-32 right-20 w-56 h-56 rounded-full opacity-25 animate-float" style={{ background: 'radial-gradient(circle, rgba(184,115,51,0.2) 0%, transparent 70%)' }} />
        <div className="absolute bottom-40 left-10 w-64 h-64 rounded-full opacity-20 animate-float-slow" style={{ background: 'radial-gradient(circle, rgba(139,90,43,0.15) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full opacity-15 animate-float-delayed" style={{ background: 'radial-gradient(circle, rgba(184,115,51,0.18) 0%, transparent 70%)' }} />
        
        {/* Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #1a1a1a 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        
        {/* Decorative icons */}
        <div className="absolute bottom-1/4 right-8 opacity-[0.04] animate-float">
          <ChefHat className="w-24 h-24 text-green-900" />
        </div>
        
        {/* Animated lines */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500/20 to-transparent" style={{ animation: 'shimmer 4s infinite' }} />
      </div>

      <div className="container py-8 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8 animate-slide-up">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center shadow-xl">
              <ChefHat className="w-7 h-7 text-green-400" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">Your Kitchen</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Welcome back, Chef {user?.name}
              </p>
            </div>
          </div>

          {/* Finalization Banner */}
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-slide-up backdrop-blur-sm ${canModify ? 'bg-green-50/80 border border-green-200' : 'bg-white/60 border border-gray-200'}`} style={{ animationDelay: '100ms' }}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${canModify ? 'bg-green-500' : 'bg-gray-400'}`}>
              <Clock className="w-5 h-5 text-white" />
            </div>
            <p className={canModify ? 'text-green-800 font-medium' : 'text-gray-600'}>
              {canModify ? 'Tomorrow\'s prep list is ready! Time to cook.' : 'Orders still coming in. Final list after 8 PM.'}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="shadow-soft bg-white/80 backdrop-blur-sm animate-slide-up hover-lift" style={{ animationDelay: '150ms' }}>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-green-600">{orders.length}</p>
                <p className="text-sm text-muted-foreground">Tomorrow's Orders</p>
              </CardContent>
            </Card>
            <Card className="shadow-soft bg-white/80 backdrop-blur-sm animate-slide-up hover-lift" style={{ animationDelay: '200ms' }}>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-gray-500">{orders.filter(o => o.status === 'pending').length}</p>
                <p className="text-sm text-muted-foreground">Waiting</p>
              </CardContent>
            </Card>
            <Card className="shadow-soft bg-white/80 backdrop-blur-sm animate-slide-up hover-lift" style={{ animationDelay: '250ms' }}>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-blue-500">{orders.filter(o => o.status === 'preparing').length}</p>
                <p className="text-sm text-muted-foreground">Cooking</p>
              </CardContent>
            </Card>
            <Card className="shadow-soft bg-white/80 backdrop-blur-sm animate-slide-up hover-lift" style={{ animationDelay: '300ms' }}>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-green-500">{orders.filter(o => o.status === 'ready').length}</p>
                <p className="text-sm text-muted-foreground">Ready for Pickup</p>
              </CardContent>
            </Card>
          </div>

          {/* Menu Chart Builder */}
          <Card className="shadow-soft mb-6 bg-white/85 backdrop-blur-sm animate-slide-up" style={{ animationDelay: '320ms' }}>
            <CardHeader>
              <CardTitle className="font-display">Weekly Menu Chart</CardTitle>
              <CardDescription>Enter your brochure menu and optional swap alternatives per day/slot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={menuStartDate} onChange={(e) => { setMenuStartDate(e.target.value); setMenuChart(null); }} />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                    value={menuDuration}
                    onChange={(e) => { setMenuDuration((e.target.value === '14' ? 14 : 7) as 7 | 14); setMenuChart(null); }}
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Brochure Image (optional)</Label>
                  <Input type="file" accept="image/*" onChange={(e) => handleMenuImageUpload(e.target.files?.[0])} />
                </div>
              </div>

              {menuImageUrl && (
                <div className="rounded-xl border border-border/50 p-3 bg-white/70">
                  <p className="text-xs text-muted-foreground mb-2">Uploaded brochure preview</p>
                  <img src={menuImageUrl} alt="Menu brochure" className="w-full max-h-64 object-contain rounded-lg border" />
                </div>
              )}

              <div className="space-y-4">
                {menuDays.map((day) => (
                  <div key={day.date} className="rounded-xl border border-border/50 p-4 bg-white/70">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium">{day.date}</p>
                      <Badge variant="secondary">Brochure Day</Badge>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      {slotOptions.map((slot) => {
                        const slotData = day.slots[slot];
                        const selectedMealId = slotData?.mealId || '';
                        return (
                          <div key={`${day.date}-${slot}`} className="space-y-2">
                            <Label className="capitalize">{slot}</Label>
                            <select
                              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
                              value={selectedMealId}
                              onChange={(e) => updateMenuSlot(day.date, slot, e.target.value)}
                            >
                              <option value="">Select meal</option>
                              {dishes.map((dish) => (
                                <option key={dish.id} value={dish.id}>{dish.name}</option>
                              ))}
                            </select>
                            <select
                              multiple
                              className="w-full h-20 px-3 rounded-lg border border-border bg-background text-xs"
                              value={slotData?.alternativeMealIds || []}
                              onChange={(e) => {
                                const values = Array.from(e.target.selectedOptions).map(opt => opt.value);
                                updateMenuAlternatives(day.date, slot, values.filter(id => id !== selectedMealId));
                              }}
                            >
                              {dishes.filter(d => d.id !== selectedMealId).map((dish) => (
                                <option key={dish.id} value={dish.id}>{dish.name}</option>
                              ))}
                            </select>
                            <p className="text-xs text-muted-foreground">Select alternatives (optional)</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveMenuChart} className="gradient-primary">Save Menu Chart</Button>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <Card className="shadow-soft mb-6 bg-white/80 backdrop-blur-sm animate-slide-up" style={{ animationDelay: '350ms' }}>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
              </div>
              Tomorrow's Prep List
            </CardTitle>
            <CardDescription>Orders confirmed after evening cutoff</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No orders for tomorrow yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 rounded-2xl bg-secondary/50 border border-border/30">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{order.mealName}</h3>
                        <p className="text-sm text-muted-foreground">For: {order.customerName}</p>
                      </div>
                      <Badge variant={order.status === 'ready' ? 'default' : 'outline'} className="capitalize rounded-full">
                        {order.status === 'pending' ? 'Waiting' : order.status === 'preparing' ? 'Cooking' : 'Ready'}
                      </Badge>
                    </div>
                    
                    {order.selectedCustomizations && order.selectedCustomizations.length > 0 && (
                      <div className="mb-3 p-2 rounded-lg bg-primary/5">
                        <p className="text-xs font-medium text-primary mb-1">Customizations:</p>
                        <div className="flex flex-wrap gap-1">
                          {order.selectedCustomizations.map((c, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{c.optionName}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-3 h-3" />
                      {order.deliveryAddress.street}, {order.deliveryAddress.city}
                    </div>

                    {canModify && order.status !== 'ready' && (
                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <Button size="sm" variant="outline" className="rounded-full" onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}>
                            Start Cooking
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button size="sm" className="gradient-herbal rounded-full" onClick={() => handleUpdateOrderStatus(order.id, 'ready')}>
                            Mark Ready
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dish Management */}
        <Card className="shadow-card bg-white/80 backdrop-blur-sm animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <span className="text-green-500">🍳</span>
                Your Dishes
              </CardTitle>
              <Button onClick={() => setShowAddDish(true)} size="sm" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                <Plus className="w-4 h-4 mr-2" />Add Dish
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

const DishCard = ({ dish }: { dish: Dish }) => (
  <div className="p-4 rounded-2xl bg-gradient-to-r from-green-50/50 to-emerald-50/30 border border-green-100 flex items-center justify-between hover:shadow-md transition-all">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${dish.category === 'veg' ? 'bg-green-500' : 'bg-red-500'}`}>
        {dish.category === 'veg' ? <Leaf className="w-5 h-5 text-white" /> : <Drumstick className="w-5 h-5 text-white" />}
      </div>
      <div>
        <h3 className="font-medium">{dish.name}</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{dish.nutritionalInfo.calories} cal</span>
          <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{dish.nutritionalInfo.protein}g protein</span>
        </div>
      </div>
    </div>
    <Badge variant={dish.allowsCustomization ? 'default' : 'secondary'} className="rounded-full">
      {dish.allowsCustomization ? 'Flexible' : 'Set Menu'}
    </Badge>
  </div>
);
