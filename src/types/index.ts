// ZYNK Types - Food Subscription App

export type UserRole = 'customer' | 'chef' | 'delivery' | 'admin';

export type DietType = 'vegetarian' | 'non-vegetarian' | 'vegan' | 'keto' | 'gluten-free';
export type HealthGoal = 'weight-loss' | 'muscle-gain' | 'maintenance' | 'energy' | 'balanced';

export interface UserPreferences {
  dietType: DietType;
  healthGoal: HealthGoal;
  allergies: string[];
  dislikedFoods: string[];
  mealHistory: string[];
}

export interface MealRecommendation {
  breakfast: {
    mealId: string;
    mealName: string;
    reason: string;
  };
  lunch: {
    mealId: string;
    mealName: string;
    reason: string;
  };
  dinner: {
    mealId: string;
    mealName: string;
    reason: string;
  };
  shortReason: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  landmark?: string;
}

export interface Customer extends User {
  role: 'customer';
  subscription?: Subscription;
  homeAddress?: Address;
  workAddress?: Address;
  selectedChefId?: string;
}

// Nutritional info for dishes
export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Customization options for dishes
export interface CustomizationOption {
  id: string;
  name: string;
  type: 'add' | 'remove' | 'adjust';
}

// Chef's dish
export interface Dish {
  id: string;
  chefId: string;
  name: string;
  description: string;
  category: 'veg' | 'non-veg';
  nutritionalInfo: NutritionalInfo;
  allowsCustomization: boolean;
  customizationOptions: CustomizationOption[];
  imageUrl?: string;
  isActive: boolean;
  isSpecial?: boolean;
}

export interface Chef extends User {
  role: 'chef';
  status: 'pending' | 'approved' | 'rejected' | 'disabled';
  specialty?: string;
  bio?: string;
  kitchenLocation?: Address;
  serviceArea?: string;
  deliverySlots?: string[];
  rating?: number;
  totalOrders?: number;
  isDisabled?: boolean;
  menuCharts?: ChefMenuChart[];
}

export interface ChefMenuSlot {
  mealId: string;
  alternativeMealIds?: string[];
}

export interface ChefMenuDay {
  date: string;
  slots: Partial<Record<MealSlot, ChefMenuSlot>>;
}

export interface ChefMenuChart {
  id: string;
  chefId: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  days: ChefMenuDay[];
}

export interface DeliveryPartner extends User {
  role: 'delivery';
  vehicleType?: string;
  zone?: string;
}

export interface Admin extends User {
  role: 'admin';
}

export type PlanType = 'basic' | 'standard' | 'premium';
export type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'both';
export type MealSlot = 'breakfast' | 'lunch' | 'dinner';
export type AddressType = 'home' | 'work';

export interface Subscription {
  id: string;
  customerId: string;
  customerName?: string;
  plan: PlanType;
  mealTime: MealTime;
  mealSlots: MealSlot[];
  startDate: string;
  endDate?: string;
  status: 'active' | 'paused' | 'cancelled';
  address: Address;
  activeAddressType: AddressType;
  selectedChefId?: string;
}

// Legacy Meal type (for backwards compatibility)
export interface Meal {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  calories?: number;
  isVegetarian: boolean;
}

// Selected customization for an order
export interface SelectedCustomization {
  optionId: string;
  optionName: string;
}

export interface DailyMeal {
  id: string;
  date: string;
  mealTime: MealTime;
  mealSlot: MealSlot;
  subscriptionId: string;
  customerId: string;
  originalMealId: string;
  currentMealId: string;
  originalDishId?: string;
  currentDishId?: string;
  isSkipped: boolean;
  isSwapped: boolean;
  status: 'scheduled' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered';
  deliveryPartnerId?: string;
  selectedCustomizations?: SelectedCustomization[];
  deliveryAddressType?: AddressType;
  deliveryAddressOverride?: Address;
  alternativeMealIds?: string[];
  isFinalized: boolean;
}

// Order status history entry
export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  updatedBy?: string;
}

export type OrderStatus = 'pending' | 'scheduled' | 'preparing' | 'ready' | 'picked_up' | 'out_for_delivery' | 'delivered';

export interface Order {
  id: string;
  dailyMealId: string;
  customerId: string;
  chefId?: string;
  chefName?: string;
  mealId: string;
  mealName: string;
  customerName: string;
  deliveryAddress: Address;
  deliveryAddressType?: AddressType;
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
  date: string;
  mealTime: MealTime;
  selectedCustomizations?: SelectedCustomization[];
  dishId?: string;
  zone?: string;
  deliveredAt?: string;
  isReviewed?: boolean;
}

// Review entity
export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  chefId: string;
  mealId: string;
  mealName: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
  isHidden?: boolean; // Admin moderation
  hiddenReason?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
  nextAvailableAt?: string;
}

export interface Database {
  users: User[];
  subscriptions: Subscription[];
  meals: Meal[];
  dishes: Dish[];
  dailyMeals: DailyMeal[];
  orders: Order[];
  reviews: Review[];
}
