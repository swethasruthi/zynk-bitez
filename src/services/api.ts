/**
 * ZYNK API Service
 * Simulates Express.js REST API endpoints
 * All responses follow the ApiResponse<T> structure
 */

import type { 
  ApiResponse, 
  User, 
  Customer, 
  Chef, 
  Subscription, 
  Address, 
  DailyMeal, 
  Order,
  OrderStatus,
  OrderStatusHistory,
  PlanType,
  MealTime,
  AddressType,
  Dish,
  NutritionalInfo,
  CustomizationOption,
  SelectedCustomization,
  Review,
  UserPreferences,
  MealRecommendation,
  DietType,
  HealthGoal
} from '@/types';
import * as db from './db';

// ========================================
// AUTH ENDPOINTS (POST /api/auth/*)
// ========================================

/**
 * POST /api/auth/register
 * Register a new customer with home and work addresses
 */
export const registerCustomer = (
  email: string, 
  password: string, 
  name: string,
  phone?: string,
  homeAddress?: Address,
  workAddress?: Address
): ApiResponse<Customer> => {
  // Check if user already exists
  const existingUser = db.findUserByEmail(email);
  if (existingUser) {
    return { success: false, error: 'Email already registered' };
  }

  const customer: Customer = {
    id: db.generateId('cust'),
    email,
    password,
    name,
    phone,
    role: 'customer',
    homeAddress,
    workAddress,
    createdAt: new Date().toISOString(),
  };

  db.createUser(customer);
  return { 
    success: true, 
    data: customer, 
    message: 'Customer registered successfully' 
  };
};

/**
 * POST /api/auth/login
 * Login user (any role) - allows pending chefs to login
 */
export const login = (email: string, password: string): ApiResponse<User> => {
  const user = db.findUserByEmail(email);
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  if (user.password !== password) {
    return { success: false, error: 'Invalid password' };
  }

  return { 
    success: true, 
    data: user, 
    message: 'Login successful' 
  };
};

// ========================================
// CUSTOMER ENDPOINTS (POST /api/customer/*)
// ========================================

/**
 * POST /api/customer/subscribe
 * Create a new subscription for customer with chef selection
 */
export const subscribe = (
  customerId: string,
  plan: PlanType,
  mealTime: MealTime,
  address: Address,
  addressType: AddressType = 'home',
  selectedChefId?: string
): ApiResponse<Subscription> => {
  const user = db.findUserById(customerId);
  if (!user || user.role !== 'customer') {
    return { success: false, error: 'Customer not found' };
  }

  // Check for existing active subscription
  const existingSub = db.findSubscriptionByCustomerId(customerId);
  if (existingSub) {
    return { success: false, error: 'Already have an active subscription' };
  }

  const subscription: Subscription = {
    id: db.generateId('sub'),
    customerId,
    plan,
    mealTime,
    address,
    activeAddressType: addressType,
    selectedChefId,
    startDate: db.getTomorrowDate(),
    status: 'active',
  };

  db.createSubscription(subscription);

  // Update customer with selected chef
  if (selectedChefId) {
    db.updateUser(customerId, { selectedChefId } as Partial<Customer>);
  }

  // Get chef's dishes or fall back to sample meals
  const chefDishes = selectedChefId ? db.getDishesByChefId(selectedChefId) : [];
  const meals = db.getAllMeals();

  // Create daily meals for next 7 days
  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    let mealId: string;
    let mealName: string;
    let dishId: string | undefined;

    if (chefDishes.length > 0) {
      const randomDish = chefDishes[Math.floor(Math.random() * chefDishes.length)];
      dishId = randomDish.id;
      mealId = randomDish.id;
      mealName = randomDish.name;
    } else {
      const randomMeal = meals[Math.floor(Math.random() * meals.length)];
      mealId = randomMeal.id;
      mealName = randomMeal.name;
    }
    
    const dailyMeal: DailyMeal = {
      id: db.generateId('dm'),
      date: dateStr,
      mealTime,
      subscriptionId: subscription.id,
      customerId,
      originalMealId: mealId,
      currentMealId: mealId,
      originalDishId: dishId,
      currentDishId: dishId,
      isSkipped: false,
      isSwapped: false,
      status: 'scheduled',
      deliveryAddressType: addressType,
      isFinalized: false,
    };
    db.createDailyMeal(dailyMeal);

    // Create order
    const order: Order = {
      id: db.generateId('ord'),
      dailyMealId: dailyMeal.id,
      customerId,
      chefId: selectedChefId,
      mealId,
      mealName,
      dishId,
      customerName: user.name,
      deliveryAddress: address,
      status: 'scheduled',
      statusHistory: [{ status: 'scheduled', timestamp: new Date().toISOString() }],
      date: dateStr,
      mealTime,
    };
    db.createOrder(order);
  }

  return { 
    success: true, 
    data: subscription, 
    message: 'Subscription created successfully' 
  };
};

/**
 * POST /api/customer/skip-meal
 * Skip tomorrow's meal (only before 8 PM)
 */
export const skipMeal = (customerId: string, dailyMealId: string): ApiResponse<DailyMeal> => {
  // Check time cutoff
  if (!db.isBeforeCutoff()) {
    return { success: false, error: 'Meal locked. Skip/swap allowed only before 8 PM.' };
  }

  const dailyMeals = db.findDailyMealsByCustomerId(customerId, db.getTomorrowDate());
  const meal = dailyMeals.find(dm => dm.id === dailyMealId);

  if (!meal) {
    return { success: false, error: 'Meal not found for tomorrow' };
  }

  if (meal.isFinalized) {
    return { success: false, error: 'Meal is already finalized' };
  }

  if (meal.isSkipped) {
    return { success: false, error: 'Meal already skipped' };
  }

  const updated = db.updateDailyMeal(dailyMealId, { isSkipped: true });
  
  // Update corresponding order
  const dbData = db.readDatabase();
  const order = dbData.orders.find(o => o.dailyMealId === dailyMealId);
  if (order) {
    db.updateOrder(order.id, { status: 'pending' });
  }

  return { 
    success: true, 
    data: updated!, 
    message: 'Meal skipped successfully' 
  };
};

/**
 * POST /api/customer/unskip-meal
 * Reverse a skipped meal (only before 8 PM)
 */
export const unskipMeal = (customerId: string, dailyMealId: string): ApiResponse<DailyMeal> => {
  if (!db.isBeforeCutoff()) {
    return { success: false, error: 'Meal locked. Changes allowed only before 8 PM.' };
  }

  const dailyMeals = db.findDailyMealsByCustomerId(customerId, db.getTomorrowDate());
  const meal = dailyMeals.find(dm => dm.id === dailyMealId);

  if (!meal) {
    return { success: false, error: 'Meal not found for tomorrow' };
  }

  if (meal.isFinalized) {
    return { success: false, error: 'Meal is already finalized' };
  }

  if (!meal.isSkipped) {
    return { success: false, error: 'Meal is not skipped' };
  }

  const updated = db.updateDailyMeal(dailyMealId, { isSkipped: false });

  return { 
    success: true, 
    data: updated!, 
    message: 'Meal restored successfully' 
  };
};

/**
 * POST /api/customer/swap-meal
 * Swap tomorrow's meal (only before 8 PM)
 */
export const swapMeal = (
  customerId: string, 
  dailyMealId: string, 
  newMealId: string,
  selectedCustomizations?: SelectedCustomization[]
): ApiResponse<DailyMeal> => {
  // Check time cutoff
  if (!db.isBeforeCutoff()) {
    return { success: false, error: 'Meal locked. Skip/swap allowed only before 8 PM.' };
  }

  const dailyMeals = db.findDailyMealsByCustomerId(customerId, db.getTomorrowDate());
  const meal = dailyMeals.find(dm => dm.id === dailyMealId);

  if (!meal) {
    return { success: false, error: 'Meal not found for tomorrow' };
  }

  if (meal.isFinalized) {
    return { success: false, error: 'Meal is already finalized' };
  }

  if (meal.isSkipped) {
    return { success: false, error: 'Cannot swap a skipped meal' };
  }

  // Check if it's a dish or meal
  const newDish = db.findDishById(newMealId);
  const newMeal = db.findMealById(newMealId);

  if (!newDish && !newMeal) {
    return { success: false, error: 'Selected meal/dish not found' };
  }

  const updates: Partial<DailyMeal> = {
    currentMealId: newMealId,
    isSwapped: true,
    selectedCustomizations,
  };

  if (newDish) {
    updates.currentDishId = newMealId;
  }

  const updated = db.updateDailyMeal(dailyMealId, updates);

  // Update corresponding order
  const dbData = db.readDatabase();
  const order = dbData.orders.find(o => o.dailyMealId === dailyMealId);
  if (order) {
    db.updateOrder(order.id, { 
      mealId: newMealId, 
      mealName: newDish?.name || newMeal?.name || 'Unknown',
      dishId: newDish?.id,
      selectedCustomizations,
    });
  }

  return { 
    success: true, 
    data: updated!, 
    message: 'Meal swapped successfully' 
  };
};

/**
 * PUT /api/customer/address
 * Update delivery address (only before 8 PM for tomorrow)
 */
export const updateAddress = (
  customerId: string, 
  address: Address,
  addressType: AddressType
): ApiResponse<Subscription> => {
  if (!db.isBeforeCutoff()) {
    return { success: false, error: 'Address change locked after 8 PM.' };
  }

  const subscription = db.findSubscriptionByCustomerId(customerId);
  if (!subscription) {
    return { success: false, error: 'No active subscription found' };
  }

  const updated = db.updateSubscription(subscription.id, { 
    address, 
    activeAddressType: addressType 
  });

  // Update tomorrow's orders
  const dbData = db.readDatabase();
  const tomorrow = db.getTomorrowDate();
  dbData.orders.forEach(order => {
    if (order.customerId === customerId && order.date === tomorrow) {
      db.updateOrder(order.id, { deliveryAddress: address });
    }
  });

  return { 
    success: true, 
    data: updated!, 
    message: 'Address updated successfully' 
  };
};

/**
 * PUT /api/customer/switch-address
 * Switch between home and work address (only before 8 PM)
 */
export const switchDeliveryAddress = (
  customerId: string,
  addressType: AddressType
): ApiResponse<Subscription> => {
  if (!db.isBeforeCutoff()) {
    return { success: false, error: 'Address change locked after 8 PM.' };
  }

  const user = db.findUserById(customerId) as Customer;
  if (!user || user.role !== 'customer') {
    return { success: false, error: 'Customer not found' };
  }

  const address = addressType === 'home' ? user.homeAddress : user.workAddress;
  if (!address) {
    return { success: false, error: `No ${addressType} address configured` };
  }

  const subscription = db.findSubscriptionByCustomerId(customerId);
  if (!subscription) {
    return { success: false, error: 'No active subscription found' };
  }

  const updated = db.updateSubscription(subscription.id, { 
    address, 
    activeAddressType: addressType 
  });

  // Update tomorrow's daily meal and order
  const dbData = db.readDatabase();
  const tomorrow = db.getTomorrowDate();
  
  dbData.dailyMeals.forEach(dm => {
    if (dm.customerId === customerId && dm.date === tomorrow && !dm.isFinalized) {
      db.updateDailyMeal(dm.id, { deliveryAddressType: addressType });
    }
  });

  dbData.orders.forEach(order => {
    if (order.customerId === customerId && order.date === tomorrow) {
      db.updateOrder(order.id, { deliveryAddress: address });
    }
  });

  return { 
    success: true, 
    data: updated!, 
    message: `Delivery address switched to ${addressType}` 
  };
};

/**
 * PUT /api/customer/select-chef
 * Change selected chef (only before 8 PM for tomorrow's meal)
 */
export const selectChef = (
  customerId: string,
  chefId: string
): ApiResponse<{ chef: Chef; subscription: Subscription }> => {
  if (!db.isBeforeCutoff()) {
    return { success: false, error: 'Chef change locked after 8 PM.' };
  }

  const chef = db.findUserById(chefId) as Chef;
  if (!chef || chef.role !== 'chef' || chef.status !== 'approved') {
    return { success: false, error: 'Chef not found or not approved' };
  }

  const subscription = db.findSubscriptionByCustomerId(customerId);
  if (!subscription) {
    return { success: false, error: 'No active subscription found' };
  }

  // Update subscription with new chef
  const updatedSub = db.updateSubscription(subscription.id, { selectedChefId: chefId });
  db.updateUser(customerId, { selectedChefId: chefId } as Partial<Customer>);

  // Update tomorrow's orders with new chef
  const dbData = db.readDatabase();
  const tomorrow = db.getTomorrowDate();
  const chefDishes = db.getDishesByChefId(chefId);
  
  dbData.orders.forEach(order => {
    if (order.customerId === customerId && order.date === tomorrow) {
      // Assign a random dish from the new chef
      if (chefDishes.length > 0) {
        const randomDish = chefDishes[Math.floor(Math.random() * chefDishes.length)];
        db.updateOrder(order.id, { 
          chefId, 
          mealId: randomDish.id,
          mealName: randomDish.name,
          dishId: randomDish.id,
        });
        
        // Update daily meal too
        const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
        if (dailyMeal && !dailyMeal.isFinalized) {
          db.updateDailyMeal(dailyMeal.id, {
            currentMealId: randomDish.id,
            currentDishId: randomDish.id,
            isSwapped: true,
          });
        }
      } else {
        db.updateOrder(order.id, { chefId });
      }
    }
  });

  return { 
    success: true, 
    data: { chef, subscription: updatedSub! }, 
    message: 'Chef updated successfully' 
  };
};

/**
 * GET /api/customer/subscription
 * Get customer's current subscription
 */
export const getSubscription = (customerId: string): ApiResponse<Subscription | null> => {
  const subscription = db.findSubscriptionByCustomerId(customerId);
  return { success: true, data: subscription || null };
};

/**
 * GET /api/customer/meals
 * Get customer's upcoming meals
 */
export const getCustomerMeals = (customerId: string): ApiResponse<DailyMeal[]> => {
  const meals = db.findDailyMealsByCustomerId(customerId);
  return { success: true, data: meals };
};

/**
 * GET /api/customer/selected-chef
 * Get customer's selected chef details
 */
export const getSelectedChef = (customerId: string): ApiResponse<Chef | null> => {
  const subscription = db.findSubscriptionByCustomerId(customerId);
  if (!subscription?.selectedChefId) {
    return { success: true, data: null };
  }

  const chef = db.findUserById(subscription.selectedChefId) as Chef;
  return { success: true, data: chef || null };
};

// ========================================
// CHEF ENDPOINTS (GET/POST /api/chef/*)
// ========================================

/**
 * POST /api/chef/register
 * Register a new chef with kitchen location and service area
 */
export const registerChef = (
  email: string,
  password: string,
  name: string,
  specialty?: string,
  bio?: string,
  kitchenLocation?: Address,
  serviceArea?: string,
  deliverySlots?: string[]
): ApiResponse<Chef> => {
  const existingUser = db.findUserByEmail(email);
  if (existingUser) {
    return { success: false, error: 'Email already registered' };
  }

  const chef: Chef = {
    id: db.generateId('chef'),
    email,
    password,
    name,
    role: 'chef',
    status: 'pending',
    specialty,
    bio,
    kitchenLocation,
    serviceArea,
    deliverySlots,
    rating: 0,
    totalOrders: 0,
    createdAt: new Date().toISOString(),
  };

  db.createUser(chef);
  return { 
    success: true, 
    data: chef, 
    message: 'Chef registration submitted. You can now add your dishes while awaiting approval.' 
  };
};

/**
 * POST /api/chef/dish
 * Add a new dish (chef must be logged in)
 */
export const addDish = (
  chefId: string,
  name: string,
  description: string,
  category: 'veg' | 'non-veg',
  nutritionalInfo: NutritionalInfo,
  allowsCustomization: boolean,
  customizationOptions: CustomizationOption[]
): ApiResponse<Dish> => {
  const chef = db.findUserById(chefId) as Chef;
  if (!chef || chef.role !== 'chef') {
    return { success: false, error: 'Chef not found' };
  }

  const dish: Dish = {
    id: db.generateId('dish'),
    chefId,
    name,
    description,
    category,
    nutritionalInfo,
    allowsCustomization,
    customizationOptions,
    isActive: true,
  };

  db.createDish(dish);
  return { 
    success: true, 
    data: dish, 
    message: 'Dish added successfully' 
  };
};

/**
 * PUT /api/chef/dish/:id
 * Update a dish
 */
export const updateDish = (
  chefId: string,
  dishId: string,
  updates: Partial<Dish>
): ApiResponse<Dish> => {
  const dish = db.findDishById(dishId);
  if (!dish || dish.chefId !== chefId) {
    return { success: false, error: 'Dish not found or not owned by this chef' };
  }

  const updated = db.updateDish(dishId, updates);
  return { 
    success: true, 
    data: updated!, 
    message: 'Dish updated successfully' 
  };
};

/**
 * DELETE /api/chef/dish/:id
 * Delete (deactivate) a dish
 */
export const deleteDish = (chefId: string, dishId: string): ApiResponse<boolean> => {
  const dish = db.findDishById(dishId);
  if (!dish || dish.chefId !== chefId) {
    return { success: false, error: 'Dish not found or not owned by this chef' };
  }

  db.deleteDish(dishId);
  return { 
    success: true, 
    data: true, 
    message: 'Dish deleted successfully' 
  };
};

/**
 * GET /api/chef/dishes
 * Get chef's dishes
 */
export const getChefDishes = (chefId: string): ApiResponse<Dish[]> => {
  const dishes = db.getDishesByChefId(chefId);
  return { success: true, data: dishes };
};

/**
 * GET /api/chef/orders
 * Get finalized next-day orders (only after 8 PM or for approved chefs)
 */
export const getChefOrders = (chefId: string): ApiResponse<Order[]> => {
  const user = db.findUserById(chefId);
  if (!user || user.role !== 'chef') {
    return { success: false, error: 'Chef not found' };
  }

  if ((user as Chef).status !== 'approved') {
    return { success: false, error: 'Chef not approved. Cannot view orders.' };
  }

  // If before cutoff, orders are not finalized yet
  const isBefore = db.isBeforeCutoff();
  const tomorrow = db.getTomorrowDate();
  const allOrders = db.getOrdersByDate(tomorrow);
  
  // Filter orders for this chef only (or all orders if no chef assigned)
  const chefOrders = allOrders.filter(order => 
    order.chefId === chefId || !order.chefId
  );
  
  // Filter out skipped meals
  const dbData = db.readDatabase();
  const activeOrders = chefOrders.filter(order => {
    const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
    return dailyMeal && !dailyMeal.isSkipped;
  });

  // Add finalized flag info
  const ordersWithInfo = activeOrders.map(order => ({
    ...order,
    isFinalized: !isBefore,
  }));

  return { success: true, data: ordersWithInfo as Order[] };
};

/**
 * PUT /api/chef/order/:id/status
 * Update order status (preparing, ready)
 */
export const updateOrderStatus = (
  chefId: string,
  orderId: string,
  status: 'preparing' | 'ready'
): ApiResponse<Order> => {
  const dbData = db.readDatabase();
  const order = dbData.orders.find(o => o.id === orderId);
  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.chefId && order.chefId !== chefId) {
    return { success: false, error: 'Not authorized to update this order' };
  }

  const newHistoryEntry: OrderStatusHistory = {
    status,
    timestamp: new Date().toISOString(),
    updatedBy: chefId,
  };

  const statusHistory = [...(order.statusHistory || []), newHistoryEntry];
  const updated = db.updateOrder(orderId, { status, statusHistory });
  
  // Update daily meal status too
  const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
  if (dailyMeal) {
    db.updateDailyMeal(dailyMeal.id, { status });
  }
  
  return { 
    success: true, 
    data: updated!, 
    message: `Order marked as ${status}` 
  };
};

// ========================================
// DELIVERY ENDPOINTS (GET/POST /api/delivery/*)
// ========================================

export interface DeliveryOrder extends Order {
  chefName?: string;
  zone?: string;
}

export interface GroupedDeliveries {
  byZone: Record<string, DeliveryOrder[]>;
  byChef: Record<string, DeliveryOrder[]>;
}

const getZoneFromAddress = (address: Address): string => {
  const city = address.city?.toLowerCase() || '';
  const zipCode = address.zipCode || '';
  
  if (city.includes('koramangala') || zipCode.startsWith('5600')) return 'South Bangalore';
  if (city.includes('whitefield') || zipCode.startsWith('5600')) return 'East Bangalore';
  if (city.includes('jp nagar') || city.includes('jayanagar')) return 'South Bangalore';
  if (city.includes('indiranagar') || city.includes('domlur')) return 'Central Bangalore';
  return address.city || 'Unknown Zone';
};

export const getTomorrowDeliveries = (): ApiResponse<Order[]> => {
  const tomorrow = db.getTomorrowDate();
  const allOrders = db.getOrdersByDate(tomorrow);
  
  const dbData = db.readDatabase();
  const activeOrders = allOrders.filter(order => {
    const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
    return dailyMeal && !dailyMeal.isSkipped;
  });

  const ordersWithDetails = activeOrders.map(order => {
    const chef = order.chefId ? dbData.users.find(u => u.id === order.chefId) as Chef : null;
    const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
    return {
      ...order,
      chefName: chef?.name || 'Unassigned',
      zone: getZoneFromAddress(order.deliveryAddress),
      deliveryAddressType: dailyMeal?.deliveryAddressType || 'home',
    };
  });

  return { success: true, data: ordersWithDetails };
};

export const getGroupedDeliveries = (): ApiResponse<GroupedDeliveries> => {
  const response = getTomorrowDeliveries();
  if (!response.success || !response.data) {
    return { success: false, error: 'Failed to fetch deliveries' };
  }

  const orders = response.data as DeliveryOrder[];
  
  const byZone: Record<string, DeliveryOrder[]> = {};
  const byChef: Record<string, DeliveryOrder[]> = {};

  orders.forEach(order => {
    const zone = order.zone || 'Unknown';
    const chefName = order.chefName || 'Unassigned';

    if (!byZone[zone]) byZone[zone] = [];
    byZone[zone].push(order);

    if (!byChef[chefName]) byChef[chefName] = [];
    byChef[chefName].push(order);
  });

  return { success: true, data: { byZone, byChef } };
};

export const markPickedUp = (
  deliveryPartnerId: string, 
  orderId: string
): ApiResponse<Order> => {
  const user = db.findUserById(deliveryPartnerId);
  if (!user || user.role !== 'delivery') {
    return { success: false, error: 'Delivery partner not found' };
  }

  const dbData = db.readDatabase();
  const order = dbData.orders.find(o => o.id === orderId);
  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.status === 'delivered') {
    return { success: false, error: 'Order already delivered' };
  }

  const newHistoryEntry: OrderStatusHistory = {
    status: 'out_for_delivery',
    timestamp: new Date().toISOString(),
    updatedBy: deliveryPartnerId,
  };

  const statusHistory = [...(order.statusHistory || []), newHistoryEntry];
  const updated = db.updateOrder(orderId, { status: 'out_for_delivery', statusHistory });

  const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
  if (dailyMeal) {
    db.updateDailyMeal(dailyMeal.id, { 
      status: 'out_for_delivery',
      deliveryPartnerId 
    });
  }

  return { 
    success: true, 
    data: updated!, 
    message: 'Order picked up' 
  };
};

export const markDelivered = (
  deliveryPartnerId: string, 
  orderId: string
): ApiResponse<Order> => {
  const user = db.findUserById(deliveryPartnerId);
  if (!user || user.role !== 'delivery') {
    return { success: false, error: 'Delivery partner not found' };
  }

  const dbData = db.readDatabase();
  const order = dbData.orders.find(o => o.id === orderId);
  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.status === 'delivered') {
    return { success: false, error: 'Order already delivered' };
  }

  const deliveredAt = new Date().toISOString();
  const newHistoryEntry: OrderStatusHistory = {
    status: 'delivered',
    timestamp: deliveredAt,
    updatedBy: deliveryPartnerId,
  };

  const statusHistory = [...(order.statusHistory || []), newHistoryEntry];
  const updated = db.updateOrder(orderId, { status: 'delivered', statusHistory, deliveredAt });

  const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
  if (dailyMeal) {
    db.updateDailyMeal(dailyMeal.id, { 
      status: 'delivered',
      deliveryPartnerId 
    });
  }

  return { 
    success: true, 
    data: updated!, 
    message: 'Order marked as delivered' 
  };
};

// ========================================
// ADMIN ENDPOINTS (GET/POST /api/admin/*)
// ========================================

/**
 * GET /api/admin/overview
 * Get admin dashboard stats
 */
export const getAdminOverview = (): ApiResponse<{
  totalCustomers: number;
  totalChefs: number;
  activeSubscriptions: number;
  pendingChefs: number;
  totalOrders: number;
}> => {
  const stats = db.getAdminStats();
  return { success: true, data: stats };
};

/**
 * GET /api/admin/pending-chefs
 * Get list of pending chef applications
 */
export const getPendingChefs = (): ApiResponse<Chef[]> => {
  const chefs = db.getPendingChefs();
  return { success: true, data: chefs };
};

/**
 * POST /api/admin/approve-chef
 * Approve a pending chef
 */
export const approveChef = (chefId: string): ApiResponse<Chef> => {
  const user = db.findUserById(chefId);
  if (!user || user.role !== 'chef') {
    return { success: false, error: 'Chef not found' };
  }

  if ((user as Chef).status === 'approved') {
    return { success: false, error: 'Chef already approved' };
  }

  const updated = db.updateUser(chefId, { status: 'approved' } as Partial<Chef>);
  return { 
    success: true, 
    data: updated as Chef, 
    message: 'Chef approved successfully' 
  };
};

/**
 * POST /api/admin/reject-chef
 * Reject a pending chef
 */
export const rejectChef = (chefId: string): ApiResponse<Chef> => {
  const user = db.findUserById(chefId);
  if (!user || user.role !== 'chef') {
    return { success: false, error: 'Chef not found' };
  }

  const updated = db.updateUser(chefId, { status: 'rejected' } as Partial<Chef>);
  return { 
    success: true, 
    data: updated as Chef, 
    message: 'Chef rejected' 
  };
};

export interface TomorrowOperationsSummary {
  chefBreakdown: Array<{
    chefId: string;
    chefName: string;
    totalMeals: number;
    customizationCount: number;
  }>;
  zoneBreakdown: Array<{
    zone: string;
    totalDeliveries: number;
  }>;
  totalMeals: number;
}

export const getTomorrowOperationsSummary = (): ApiResponse<TomorrowOperationsSummary> => {
  const tomorrow = db.getTomorrowDate();
  const dbData = db.readDatabase();
  const allOrders = db.getOrdersByDate(tomorrow);
  
  const activeOrders = allOrders.filter(order => {
    const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
    return dailyMeal && !dailyMeal.isSkipped;
  });

  const chefStats: Record<string, { chefName: string; totalMeals: number; customizationCount: number }> = {};
  const zoneStats: Record<string, number> = {};

  activeOrders.forEach(order => {
    const chefId = order.chefId || 'unassigned';
    const chef = order.chefId ? dbData.users.find(u => u.id === order.chefId) : null;
    const chefName = chef?.name || 'Unassigned';

    if (!chefStats[chefId]) {
      chefStats[chefId] = { chefName, totalMeals: 0, customizationCount: 0 };
    }
    chefStats[chefId].totalMeals++;
    if (order.selectedCustomizations && order.selectedCustomizations.length > 0) {
      chefStats[chefId].customizationCount++;
    }

    const zone = order.deliveryAddress?.city || 'Unknown';
    zoneStats[zone] = (zoneStats[zone] || 0) + 1;
  });

  return {
    success: true,
    data: {
      chefBreakdown: Object.entries(chefStats).map(([chefId, stats]) => ({
        chefId,
        ...stats,
      })),
      zoneBreakdown: Object.entries(zoneStats).map(([zone, totalDeliveries]) => ({
        zone,
        totalDeliveries,
      })),
      totalMeals: activeOrders.length,
    },
  };
};

export interface EnhancedAdminStats {
  totalCustomers: number;
  totalChefs: number;
  approvedChefs: number;
  activeSubscriptions: number;
  pendingChefs: number;
  totalOrders: number;
  tomorrowMeals: number;
  pausedSubscriptions: number;
  disabledChefs: number;
}

export const getEnhancedAdminOverview = (): ApiResponse<EnhancedAdminStats> => {
  const dbData = db.readDatabase();
  const tomorrow = db.getTomorrowDate();
  const tomorrowOrders = db.getOrdersByDate(tomorrow);
  const activeTomorrowOrders = tomorrowOrders.filter(order => {
    const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
    return dailyMeal && !dailyMeal.isSkipped;
  });

  return {
    success: true,
    data: {
      totalCustomers: dbData.users.filter(u => u.role === 'customer').length,
      totalChefs: dbData.users.filter(u => u.role === 'chef').length,
      approvedChefs: dbData.users.filter(u => u.role === 'chef' && (u as Chef).status === 'approved').length,
      activeSubscriptions: dbData.subscriptions.filter(s => s.status === 'active').length,
      pendingChefs: dbData.users.filter(u => u.role === 'chef' && (u as Chef).status === 'pending').length,
      totalOrders: dbData.orders.length,
      tomorrowMeals: activeTomorrowOrders.length,
      pausedSubscriptions: dbData.subscriptions.filter(s => s.status === 'paused').length,
      disabledChefs: dbData.users.filter(u => u.role === 'chef' && (u as Chef).isDisabled).length,
    },
  };
};

export const pauseSubscription = (subscriptionId: string): ApiResponse<Subscription> => {
  const dbData = db.readDatabase();
  const subscription = dbData.subscriptions.find(s => s.id === subscriptionId);
  
  if (!subscription) {
    return { success: false, error: 'Subscription not found' };
  }

  const updated = db.updateSubscription(subscriptionId, { status: 'paused' });
  return {
    success: true,
    data: updated!,
    message: 'Subscription paused',
  };
};

export const resumeSubscription = (subscriptionId: string): ApiResponse<Subscription> => {
  const dbData = db.readDatabase();
  const subscription = dbData.subscriptions.find(s => s.id === subscriptionId);
  
  if (!subscription) {
    return { success: false, error: 'Subscription not found' };
  }

  const updated = db.updateSubscription(subscriptionId, { status: 'active' });
  return {
    success: true,
    data: updated!,
    message: 'Subscription resumed',
  };
};

export const disableChef = (chefId: string): ApiResponse<Chef> => {
  const user = db.findUserById(chefId);
  if (!user || user.role !== 'chef') {
    return { success: false, error: 'Chef not found' };
  }

  const updated = db.updateUser(chefId, { isDisabled: true } as Partial<Chef>);
  return {
    success: true,
    data: updated as Chef,
    message: 'Chef disabled',
  };
};

export const enableChef = (chefId: string): ApiResponse<Chef> => {
  const user = db.findUserById(chefId);
  if (!user || user.role !== 'chef') {
    return { success: false, error: 'Chef not found' };
  }

  const updated = db.updateUser(chefId, { isDisabled: false } as Partial<Chef>);
  return {
    success: true,
    data: updated as Chef,
    message: 'Chef enabled',
  };
};

export const getAllSubscriptions = (): ApiResponse<Subscription[]> => {
  const dbData = db.readDatabase();
  const subscriptionsWithNames = dbData.subscriptions.map(sub => {
    const customer = dbData.users.find(u => u.id === sub.customerId);
    return {
      ...sub,
      customerName: customer?.name || 'Unknown',
    };
  });
  return { success: true, data: subscriptionsWithNames };
};

export const getAllChefs = (): ApiResponse<Chef[]> => {
  const dbData = db.readDatabase();
  const chefs = dbData.users.filter(u => u.role === 'chef') as Chef[];
  return { success: true, data: chefs };
};

// ========================================
// PUBLIC ENDPOINTS
// ========================================

/**
 * GET /api/meals
 * Get all available meals
 */
export const getAllMeals = (): ApiResponse => {
  const meals = db.getAllMeals();
  return { success: true, data: meals };
};

/**
 * GET /api/dishes
 * Get all available dishes
 */
export const getAllDishes = (): ApiResponse<Dish[]> => {
  const dishes = db.getAllDishes();
  return { success: true, data: dishes };
};

/**
 * GET /api/chefs
 * Get all approved chefs
 */
export const getApprovedChefs = (): ApiResponse<Chef[]> => {
  const chefs = db.getApprovedChefs();
  return { success: true, data: chefs };
};

/**
 * GET /api/chef/:id/dishes
 * Get dishes for a specific chef
 */
export const getDishesForChef = (chefId: string): ApiResponse<Dish[]> => {
  const dishes = db.getDishesByChefId(chefId);
  return { success: true, data: dishes };
};

/**
 * Utility: Check if meal modifications are allowed
 */
export const canModifyMeal = (): boolean => {
  return db.isBeforeCutoff();
};

/**
 * Utility: Generate nutritional info from dish name (simulated)
 */
export const generateNutritionalInfo = (dishName: string): NutritionalInfo => {
  // Simulated nutritional info generation based on dish name keywords
  const name = dishName.toLowerCase();
  
  let base = { calories: 450, protein: 20, carbs: 50, fat: 15 };
  
  if (name.includes('chicken') || name.includes('mutton') || name.includes('fish')) {
    base = { calories: 550, protein: 35, carbs: 35, fat: 22 };
  } else if (name.includes('paneer') || name.includes('cheese')) {
    base = { calories: 520, protein: 22, carbs: 40, fat: 28 };
  } else if (name.includes('keto') || name.includes('low carb')) {
    base = { calories: 380, protein: 30, carbs: 12, fat: 25 };
  } else if (name.includes('biryani') || name.includes('rice')) {
    base = { calories: 620, protein: 18, carbs: 75, fat: 20 };
  } else if (name.includes('salad') || name.includes('healthy')) {
    base = { calories: 320, protein: 12, carbs: 30, fat: 15 };
  }
  
  // Add some randomness
  return {
    calories: base.calories + Math.floor(Math.random() * 50) - 25,
    protein: base.protein + Math.floor(Math.random() * 5) - 2,
    carbs: base.carbs + Math.floor(Math.random() * 10) - 5,
    fat: base.fat + Math.floor(Math.random() * 5) - 2,
  };
};

// ========================================
// REVIEW ENDPOINTS (POST /api/reviews/*)
// ========================================

/**
 * POST /api/reviews
 * Submit a review for a delivered order
 */
export const submitReview = (
  customerId: string,
  orderId: string,
  rating: number,
  comment?: string
): ApiResponse<Review> => {
  // Validate rating
  if (rating < 1 || rating > 5) {
    return { success: false, error: 'Rating must be between 1 and 5' };
  }

  // Find the order
  const dbData = db.readDatabase();
  const order = dbData.orders.find(o => o.id === orderId);
  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  // Verify order belongs to customer
  if (order.customerId !== customerId) {
    return { success: false, error: 'Not authorized to review this order' };
  }

  // Verify order is delivered
  if (order.status !== 'delivered') {
    return { success: false, error: 'Can only review delivered orders' };
  }

  // Check if already reviewed
  const existingReview = db.getReviewByOrderId(orderId);
  if (existingReview) {
    return { success: false, error: 'Order already reviewed' };
  }

  const review: Review = {
    id: db.generateId('rev'),
    orderId,
    customerId,
    chefId: order.chefId || '',
    mealId: order.mealId,
    mealName: order.mealName,
    rating,
    comment,
    createdAt: new Date().toISOString(),
  };

  db.createReview(review);

  // Mark order as reviewed
  db.updateOrder(orderId, { isReviewed: true });

  // Update chef rating aggregates
  if (order.chefId) {
    const { averageRating, reviewCount } = db.getChefRating(order.chefId);
    db.updateUser(order.chefId, { 
      rating: averageRating, 
      totalOrders: reviewCount 
    } as Partial<Chef>);
  }

  return { 
    success: true, 
    data: review, 
    message: 'Review submitted successfully' 
  };
};

/**
 * GET /api/reviews/customer/:id
 * Get customer's reviews
 */
export const getCustomerReviews = (customerId: string): ApiResponse<Review[]> => {
  const reviews = db.getReviewsByCustomerId(customerId);
  return { success: true, data: reviews };
};

/**
 * GET /api/reviews/chef/:id
 * Get chef's reviews
 */
export const getChefReviews = (chefId: string): ApiResponse<Review[]> => {
  const reviews = db.getReviewsByChefId(chefId);
  return { success: true, data: reviews };
};

/**
 * GET /api/reviews/chef/:id/rating
 * Get chef's rating summary
 */
export const getChefRatingSummary = (chefId: string): ApiResponse<{ averageRating: number; reviewCount: number }> => {
  const rating = db.getChefRating(chefId);
  return { success: true, data: rating };
};

/**
 * GET /api/orders/customer/:id/for-review
 * Get delivered orders eligible for review
 */
export const getOrdersForReview = (customerId: string): ApiResponse<Order[]> => {
  const orders = db.getDeliveredOrdersForReview(customerId);
  return { success: true, data: orders };
};

/**
 * GET /api/orders/customer/:id/tracking
 * Get customer orders with tracking info
 */
export const getCustomerOrdersWithTracking = (customerId: string): ApiResponse<Order[]> => {
  const orders = db.getCustomerOrders(customerId);
  return { success: true, data: orders };
};

/**
 * GET /api/admin/reviews
 * Get all reviews for admin moderation
 */
export const getAllReviewsForAdmin = (): ApiResponse<Review[]> => {
  const reviews = db.getAllReviews();
  return { success: true, data: reviews };
};

/**
 * PUT /api/admin/reviews/:id/moderate
 * Hide or unhide a review (admin moderation)
 */
export const moderateReview = (
  reviewId: string,
  isHidden: boolean,
  hiddenReason?: string
): ApiResponse<Review> => {
  const review = db.updateReview(reviewId, { isHidden, hiddenReason });
  if (!review) {
    return { success: false, error: 'Review not found' };
  }
  return { 
    success: true, 
    data: review, 
    message: isHidden ? 'Review hidden' : 'Review restored' 
  };
};

/**
 * GET /api/admin/orders
 * Get all orders for admin with filters
 */
export const getAdminOrders = (filters?: {
  date?: string;
  chefId?: string;
  status?: string;
}): ApiResponse<Order[]> => {
  const dbData = db.readDatabase();
  let orders = dbData.orders;

  if (filters?.date) {
    orders = orders.filter(o => o.date === filters.date);
  }
  if (filters?.chefId) {
    orders = orders.filter(o => o.chefId === filters.chefId);
  }
  if (filters?.status) {
    orders = orders.filter(o => o.status === filters.status);
  }

  // Add chef names
  const ordersWithChefNames = orders.map(order => {
    const chef = order.chefId ? dbData.users.find(u => u.id === order.chefId) as Chef : null;
    return {
      ...order,
      chefName: chef?.name || 'Unassigned',
    };
  });

  return { success: true, data: ordersWithChefNames };
};

/**
 * Get approved chefs with rating info and dishes
 */
export const getApprovedChefsWithRatings = (): ApiResponse<(Chef & { dishes: Dish[]; avgRating: number; reviewCount: number })[]> => {
  const chefs = db.getApprovedChefs().filter(c => !c.isDisabled);
  const chefsWithData = chefs.map(chef => {
    const { averageRating, reviewCount } = db.getChefRating(chef.id);
    const dishes = db.getDishesByChefId(chef.id);
    return {
      ...chef,
      dishes,
      avgRating: averageRating,
      reviewCount,
    };
  });
  // Sort by rating (highest first)
  chefsWithData.sort((a, b) => b.avgRating - a.avgRating);
  return { success: true, data: chefsWithData };
};

/**
 * GET /api/chef/:id/profile
 * Get chef profile with dishes and reviews
 */
export const getChefProfile = (chefId: string): ApiResponse<{
  chef: Chef;
  dishes: Dish[];
  reviews: Review[];
  avgRating: number;
}> => {
  const chef = db.findUserById(chefId) as Chef;
  if (!chef || chef.role !== 'chef') {
    return { success: false, error: 'Chef not found' };
  }

  if (chef.status !== 'approved') {
    return { success: false, error: 'Chef not approved' };
  }

  const dishes = db.getDishesByChefId(chefId);
  const reviews = db.getReviewsByChefId(chefId);
  const { averageRating } = db.getChefRating(chefId);

  return {
    success: true,
    data: {
      chef,
      dishes,
      reviews,
      avgRating: averageRating,
    },
  };
};

/**
 * POST /api/customer/subscribe-with-chef
 * Create subscription with chef-first flow
 */
export const subscribeWithChef = (
  customerId: string,
  chefId: string,
  selectedDishIds: string[],
  plan: PlanType,
  mealTime: MealTime,
  homeAddress: Address,
  workAddress?: Address
): ApiResponse<Subscription> => {
  const user = db.findUserById(customerId) as Customer;
  if (!user || user.role !== 'customer') {
    return { success: false, error: 'Customer not found' };
  }

  const chef = db.findUserById(chefId) as Chef;
  if (!chef || chef.role !== 'chef' || chef.status !== 'approved') {
    return { success: false, error: 'Chef not found or not approved' };
  }

  // Check for existing active subscription
  const existingSub = db.findSubscriptionByCustomerId(customerId);
  if (existingSub) {
    return { success: false, error: 'Already have an active subscription' };
  }

  // Update customer addresses
  db.updateUser(customerId, {
    homeAddress,
    workAddress: workAddress?.street ? workAddress : undefined,
    selectedChefId: chefId,
  } as Partial<Customer>);

  const subscription: Subscription = {
    id: db.generateId('sub'),
    customerId,
    plan,
    mealTime,
    address: homeAddress,
    activeAddressType: 'home',
    selectedChefId: chefId,
    startDate: db.getTomorrowDate(),
    status: 'active',
  };

  db.createSubscription(subscription);

  // Get chef's selected dishes or all dishes
  const chefDishes = selectedDishIds.length > 0 
    ? selectedDishIds.map(id => db.findDishById(id)).filter(Boolean) as Dish[]
    : db.getDishesByChefId(chefId);

  if (chefDishes.length === 0) {
    return { success: false, error: 'No dishes available from this chef' };
  }

  // Create daily meals for next 7 days
  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Rotate through selected dishes
    const dish = chefDishes[(i - 1) % chefDishes.length];
    
    const dailyMeal: DailyMeal = {
      id: db.generateId('dm'),
      date: dateStr,
      mealTime,
      subscriptionId: subscription.id,
      customerId,
      originalMealId: dish.id,
      currentMealId: dish.id,
      originalDishId: dish.id,
      currentDishId: dish.id,
      isSkipped: false,
      isSwapped: false,
      status: 'scheduled',
      deliveryAddressType: 'home',
      isFinalized: false,
    };
    db.createDailyMeal(dailyMeal);

    // Create order with nutrition snapshot
    const order: Order = {
      id: db.generateId('ord'),
      dailyMealId: dailyMeal.id,
      customerId,
      chefId,
      chefName: chef.name,
      mealId: dish.id,
      mealName: dish.name,
      dishId: dish.id,
      customerName: user.name,
      deliveryAddress: homeAddress,
      deliveryAddressType: 'home',
      status: 'scheduled',
      statusHistory: [{ status: 'scheduled', timestamp: new Date().toISOString() }],
      date: dateStr,
      mealTime,
    };
    db.createOrder(order);
  }

  return { 
    success: true, 
    data: subscription, 
    message: 'Subscription created successfully' 
  };
};

/**
 * PUT /api/chef/dish/:id/special
 * Mark/unmark a dish as special
 */
export const toggleDishSpecial = (
  chefId: string,
  dishId: string,
  isSpecial: boolean
): ApiResponse<Dish> => {
  const dish = db.findDishById(dishId);
  if (!dish || dish.chefId !== chefId) {
    return { success: false, error: 'Dish not found or not owned by this chef' };
  }

  const updated = db.updateDish(dishId, { isSpecial } as any);
  return { 
    success: true, 
    data: updated!, 
    message: isSpecial ? 'Dish marked as special' : 'Dish unmarked as special' 
  };
};

// ========================================
// MEAL RECOMMENDATION ENDPOINTS
// ========================================

/**
 * POST /api/recommendations
 * Get personalized meal recommendations based on user preferences
 */
export const getMealRecommendations = (
  userPreferences: UserPreferences
): ApiResponse<MealRecommendation> => {
  try {
    // Get all available meals/dishes
    const availableMeals = db.getAllDishes();

    if (availableMeals.length === 0) {
      return { 
        success: false, 
        error: 'No meals available for recommendation' 
      };
    }

    // Generate recommendations
    const recommendation = generateRecommendations({
      userPreferences,
      availableMeals,
    });

    return {
      success: true,
      data: recommendation,
      message: 'Meal recommendations generated successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to generate meal recommendations',
    };
  }
};

/**
 * Filter meals based on user preferences
 */
const filterMealsByPreferences = (
  meals: Dish[],
  preferences: UserPreferences
): Dish[] => {
  return meals.filter((meal) => {
    // Check diet type
    if (preferences.dietType === 'vegetarian' && meal.category === 'non-veg') {
      return false;
    }
    if (preferences.dietType === 'vegan' && meal.category === 'non-veg') {
      return false;
    }

    // Check allergies
    const mealLower = meal.name.toLowerCase();
    for (const allergen of preferences.allergies) {
      if (mealLower.includes(allergen.toLowerCase())) {
        return false;
      }
    }

    // Check disliked foods
    for (const dislike of preferences.dislikedFoods) {
      if (mealLower.includes(dislike.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Generate meal recommendations
 */
const generateRecommendations = (request: {
  userPreferences: UserPreferences;
  availableMeals: Dish[];
}): MealRecommendation => {
  const { userPreferences, availableMeals } = request;

  // Filter meals based on preferences
  const filteredMeals = filterMealsByPreferences(availableMeals, userPreferences);

  if (filteredMeals.length < 3) {
    throw new Error('Not enough meals available that match your preferences');
  }

  // Get recommendations for each meal time
  const breakfast = recommendMealForTime(
    filteredMeals,
    'breakfast',
    userPreferences,
    []
  );

  const lunch = recommendMealForTime(
    filteredMeals,
    'lunch',
    userPreferences,
    [breakfast.mealId]
  );

  const dinner = recommendMealForTime(
    filteredMeals,
    'dinner',
    userPreferences,
    [breakfast.mealId, lunch.mealId]
  );

  return {
    breakfast,
    lunch,
    dinner,
    shortReason: generateShortReason(userPreferences),
  };
};

/**
 * Recommend a meal for a specific time of day
 */
const recommendMealForTime = (
  meals: Dish[],
  mealTime: 'breakfast' | 'lunch' | 'dinner',
  preferences: UserPreferences,
  excludeIds: string[]
): { mealId: string; mealName: string; reason: string } => {
  const availableMeals = meals.filter((m) => !excludeIds.includes(m.id));

  // Score meals based on nutritional goals and meal time
  const scoredMeals = availableMeals.map((meal) => {
    let score = 0;

    // Health goal alignment
    if (preferences.healthGoal === 'weight-loss') {
      if (meal.nutritionalInfo.calories < 450) score += 3;
      if (meal.nutritionalInfo.protein > 25) score += 2;
      if (meal.nutritionalInfo.fat < 12) score += 2;
    } else if (preferences.healthGoal === 'muscle-gain') {
      if (meal.nutritionalInfo.protein > 35) score += 3;
      if (meal.nutritionalInfo.carbs > 45) score += 2;
      if (meal.nutritionalInfo.calories > 500) score += 1;
    } else if (preferences.healthGoal === 'energy') {
      if (meal.nutritionalInfo.calories > 450) score += 2;
      if (meal.nutritionalInfo.carbs > 45) score += 2;
      if (meal.nutritionalInfo.protein > 20) score += 1;
    } else {
      score += meal.nutritionalInfo.protein > 18 ? 1 : 0;
      score += meal.nutritionalInfo.carbs > 40 ? 1 : 0;
      score += meal.nutritionalInfo.fat > 10 && meal.nutritionalInfo.fat < 20 ? 1 : 0;
    }

    // Meal time preferences
    if (mealTime === 'breakfast') {
      if (meal.nutritionalInfo.calories < 500) score += 2;
      if (meal.nutritionalInfo.carbs > 40) score += 1;
    } else if (mealTime === 'lunch') {
      if (meal.nutritionalInfo.protein > 25) score += 1;
      if (meal.nutritionalInfo.calories > 400 && meal.nutritionalInfo.calories < 600) score += 2;
    } else if (mealTime === 'dinner') {
      if (meal.nutritionalInfo.calories < 500) score += 1;
      if (meal.nutritionalInfo.protein > 20) score += 2;
    }

    // Bonus for diversity
    const mealNameLower = meal.name.toLowerCase();
    const inHistory = preferences.mealHistory.some((h) =>
      mealNameLower.includes(h.toLowerCase()) || h.toLowerCase().includes(mealNameLower)
    );
    if (!inHistory) score += 2;

    return { meal, score };
  });

  // Sort by score and pick the best one
  const bestMeal = scoredMeals.sort((a, b) => b.score - a.score)[0];

  return {
    mealId: bestMeal.meal.id,
    mealName: bestMeal.meal.name,
    reason: generateMealReason(bestMeal.meal, preferences, mealTime),
  };
};

/**
 * Generate a reason for the meal recommendation
 */
const generateMealReason = (
  meal: Dish,
  preferences: UserPreferences,
  mealTime: string
): string => {
  const reasons: string[] = [];

  if (preferences.healthGoal === 'weight-loss') {
    if (meal.nutritionalInfo.calories < 450) {
      reasons.push('low in calories');
    }
    if (meal.nutritionalInfo.protein > 25) {
      reasons.push('high in protein for satiety');
    }
  } else if (preferences.healthGoal === 'muscle-gain') {
    if (meal.nutritionalInfo.protein > 35) {
      reasons.push('excellent protein source');
    }
    if (meal.nutritionalInfo.carbs > 45) {
      reasons.push('good carbs for energy');
    }
  } else if (preferences.healthGoal === 'energy') {
    if (meal.nutritionalInfo.carbs > 45) {
      reasons.push('provides sustained energy');
    }
  }

  if (mealTime === 'breakfast') {
    reasons.push('perfect for breakfast energy');
  } else if (mealTime === 'lunch') {
    reasons.push('nutritious lunch option');
  } else if (mealTime === 'dinner') {
    reasons.push('light and satisfying dinner');
  }

  if (meal.allowsCustomization) {
    reasons.push('can be customized to your preference');
  }

  return reasons.join(' • ');
};

/**
 * Generate a short overall recommendation reason
 */
const generateShortReason = (preferences: UserPreferences): string => {
  const parts: string[] = [];

  if (preferences.healthGoal === 'weight-loss') {
    parts.push('Recommended for weight loss goals');
  } else if (preferences.healthGoal === 'muscle-gain') {
    parts.push('Recommended for muscle building');
  } else if (preferences.healthGoal === 'energy') {
    parts.push('Recommended for sustained energy');
  } else {
    parts.push('Recommended for balanced nutrition');
  }

  if (preferences.dietType === 'vegetarian') {
    parts.push('Vegetarian options selected');
  } else if (preferences.dietType === 'vegan') {
    parts.push('Vegan options selected');
  } else if (preferences.dietType === 'keto') {
    parts.push('Low-carb keto-friendly meals selected');
  }

  return parts.join(' • ');
};

// ========================================
// MEAL SKIP DECISION ENDPOINTS (POST /api/skip-decision/*)
// ========================================

/**
 * POST /api/skip-decision
 * Get personalized guidance on whether to skip a meal
 */
interface SkipDecisionRequest {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  skipCount: number;
  healthGoal: HealthGoal;
  subscriptionStatus: 'active' | 'paused' | 'cancelled';
  consecutiveSkips?: number;
  lastMealTime?: string;
}

interface LightMealSuggestion {
  name: string;
  calories: number;
  description: string;
}

interface SkipDecisionResponse {
  action: 'skip' | 'suggest_light_meal' | 'reschedule';
  message: string;
  riskScore: number;
  lightMealSuggestions?: LightMealSuggestion[];
  healthTips?: string[];
}

export const getSkipDecision = (request: SkipDecisionRequest): SkipDecisionResponse => {
  // Calculate risk score (0-10 scale)
  let riskScore = 0;

  // Factor 1: Skip frequency this week (0-3 points)
  if (request.skipCount >= 5) riskScore += 3;
  else if (request.skipCount >= 3) riskScore += 2;
  else if (request.skipCount >= 1) riskScore += 1;

  // Factor 2: Consecutive skips (0-2 points)
  const consecutiveSkips = request.consecutiveSkips || 0;
  if (consecutiveSkips >= 2) riskScore += 2;
  else if (consecutiveSkips === 1) riskScore += 1;

  // Factor 3: Health goal impact (0-2 points)
  if (request.healthGoal === 'muscle-gain') riskScore += 2; // Needs regular protein
  else if (request.healthGoal === 'energy-boost') riskScore += 1.5; // Needs regular energy
  else if (request.healthGoal === 'weight-loss') riskScore -= 1; // Can handle occasional skips
  else if (request.healthGoal === 'balanced') riskScore += 0; // Neutral

  // Factor 4: Meal type importance (0-1 point)
  if (request.mealType === 'breakfast') riskScore += 1; // Breakfast most important
  else if (request.mealType === 'dinner') riskScore += 0.5; // Dinner somewhat important
  // lunch neutral

  // Factor 5: Subscription status
  if (request.subscriptionStatus === 'paused' || request.subscriptionStatus === 'cancelled') {
    riskScore += 3;
  }

  // Clamp between 0-10
  riskScore = Math.max(0, Math.min(10, riskScore));

  // Check subscription status first
  if (request.subscriptionStatus !== 'active') {
    return {
      action: 'reschedule',
      message: `Your subscription is currently ${request.subscriptionStatus}. Please reactivate your subscription to continue with meal planning. Contact support for assistance.`,
      riskScore: 10,
      healthTips: [
        'Reactivate your subscription to get personalized meal guidance',
        'Contact our support team if you need help with your subscription',
      ],
    };
  }

  // Determine action based on risk score
  let action: 'skip' | 'suggest_light_meal' | 'reschedule';
  let message: string;

  if (riskScore < 4) {
    action = 'skip';
    message = `Low risk: It's safe to skip ${request.mealType} today. You've only skipped ${request.skipCount} meal(s) this week, and your ${request.healthGoal} goal allows for occasional skips. Listen to your body and stay hydrated!`;
  } else if (riskScore < 7) {
    action = 'suggest_light_meal';
    message = `Moderate risk: Instead of skipping ${request.mealType} entirely, consider a light meal. You've skipped ${request.skipCount} meal(s) this week, and with your ${request.healthGoal} goal, maintaining some nutrition is important. We've suggested some light options below.`;
  } else {
    action = 'suggest_light_meal';
    message = `High risk: We strongly recommend having a light meal instead of skipping ${request.mealType}. With ${request.consecutiveSkips} consecutive skip(s) and your ${request.healthGoal} goal, regular nutrition is essential for your health goals. Check the light meal suggestions below.`;
  }

  // Generate light meal suggestions based on meal type and health goal
  const lightMealSuggestions = generateLightMealSuggestions(
    request.mealType,
    request.healthGoal
  );

  // Generate health tips based on profile
  const healthTips = generateSkipHealthTips(
    request.mealType,
    request.healthGoal,
    skipCount
  );

  return {
    action,
    message,
    riskScore: Math.round(riskScore * 10) / 10, // Round to 1 decimal
    lightMealSuggestions,
    healthTips,
  };
};

/**
 * Generate light meal suggestions based on meal type and health goal
 */
const generateLightMealSuggestions = (
  mealType: 'breakfast' | 'lunch' | 'dinner',
  healthGoal: HealthGoal
): LightMealSuggestion[] => {
  const suggestions: Record<string, LightMealSuggestion[]> = {
    breakfast: [
      {
        name: 'Greek Yogurt & Berries',
        calories: 150,
        description: 'Protein-rich yogurt with antioxidant berries',
      },
      {
        name: 'Banana & Almond Butter',
        calories: 200,
        description: 'Quick energy with healthy fats',
      },
      {
        name: 'Oatmeal with Honey',
        calories: 180,
        description: 'Sustained energy from complex carbs',
      },
    ],
    lunch: [
      {
        name: 'Chicken Salad',
        calories: 250,
        description: 'Lean protein with fresh vegetables',
      },
      {
        name: 'Hummus & Veggie Sticks',
        calories: 180,
        description: 'Plant-based protein with fiber',
      },
      {
        name: 'Tuna Wrap',
        calories: 280,
        description: 'Omega-3 rich protein with whole grains',
      },
    ],
    dinner: [
      {
        name: 'Grilled Fish & Steamed Broccoli',
        calories: 300,
        description: 'Light protein with essential nutrients',
      },
      {
        name: 'Vegetable Soup',
        calories: 150,
        description: 'Warming and nutritious',
      },
      {
        name: 'Egg Whites with Toast',
        calories: 200,
        description: 'Lean protein before bed',
      },
    ],
  };

  const baseSuggestions = suggestions[mealType] || suggestions.lunch;

  // Adjust for health goal
  if (healthGoal === 'muscle-gain') {
    return baseSuggestions.map((meal) => ({
      ...meal,
      description: meal.description + ' (High protein)',
    }));
  } else if (healthGoal === 'weight-loss') {
    return baseSuggestions.filter((meal) => meal.calories < 250);
  } else if (healthGoal === 'energy-boost') {
    return baseSuggestions.sort((a, b) => b.calories - a.calories);
  }

  return baseSuggestions;
};

/**
 * Generate personalized health tips
 */
const generateSkipHealthTips = (
  mealType: 'breakfast' | 'lunch' | 'dinner',
  healthGoal: HealthGoal,
  skipCount: number
): string[] => {
  const tips: string[] = [];

  // General tip
  if (mealType === 'breakfast') {
    tips.push('Breakfast is your most important meal - it jumpstarts metabolism and sets energy levels for the day');
  } else if (mealType === 'lunch') {
    tips.push('Lunch maintains your energy levels throughout the afternoon - consider eating even if skipping dinner');
  } else {
    tips.push('A light dinner helps regulate sleep and recovery - avoid skipping if possible');
  }

  // Health goal-specific tips
  if (healthGoal === 'muscle-gain') {
    tips.push('For muscle gain, consistent protein intake throughout the day is crucial - try to maintain all meal times');
    tips.push('Missing meals can reduce protein synthesis and muscle building potential');
  } else if (healthGoal === 'weight-loss') {
    tips.push('While occasional meal skipping can fit some diets, aim for balanced portions instead');
    tips.push('Regular meals actually support metabolism better than sporadic eating');
  } else if (healthGoal === 'energy-boost') {
    tips.push('Consistent meals throughout the day maintain stable blood sugar and energy levels');
    tips.push('Skipping meals can cause energy crashes and reduced productivity');
  } else if (healthGoal === 'improved-digestion') {
    tips.push('Regular meal timing helps establish healthy digestive rhythms');
    tips.push('Avoid large gaps between meals for optimal digestive health');
  }

  // Frequency-based warning
  if (skipCount >= 3) {
    tips.push(`You've already skipped ${skipCount} meals this week - prioritize nutrition for the rest of the week`);
  }

  return tips;
};

