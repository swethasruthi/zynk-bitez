/**
 * ZYNK Mock Database Service
 * Simulates a JSON file-based database using localStorage
 * This mimics the Node.js + Express backend with JSON file storage
 */

import type { 
  Database, 
  User, 
  Customer, 
  Chef,
  ChefMenuChart,
  Subscription, 
  Meal, 
  Dish,
  DailyMeal, 
  Order,
  Address,
  Review
} from '@/types';

const DB_KEY = 'zynk_database';

// Sample meals for the prototype
const sampleMeals: Meal[] = [
  { id: 'meal-1', name: 'Butter Chicken with Naan', description: 'Creamy tomato-based curry with tender chicken', category: 'North Indian', isVegetarian: false, calories: 650 },
  { id: 'meal-2', name: 'Paneer Tikka Masala', description: 'Grilled cottage cheese in spiced gravy', category: 'North Indian', isVegetarian: true, calories: 520 },
  { id: 'meal-3', name: 'Dal Makhani with Rice', description: 'Creamy black lentils with steamed basmati', category: 'North Indian', isVegetarian: true, calories: 480 },
  { id: 'meal-4', name: 'Grilled Chicken Bowl', description: 'Protein-packed bowl with quinoa and veggies', category: 'Healthy', isVegetarian: false, calories: 420 },
  { id: 'meal-5', name: 'Mediterranean Falafel Wrap', description: 'Crispy falafel with hummus and fresh veggies', category: 'Mediterranean', isVegetarian: true, calories: 380 },
  { id: 'meal-6', name: 'Thai Green Curry', description: 'Coconut-based curry with vegetables and jasmine rice', category: 'Asian', isVegetarian: true, calories: 520 },
  { id: 'meal-7', name: 'Chicken Biryani', description: 'Aromatic basmati rice layered with spiced chicken', category: 'Biryani', isVegetarian: false, calories: 680 },
  { id: 'meal-8', name: 'Veg Biryani', description: 'Fragrant rice with mixed vegetables and herbs', category: 'Biryani', isVegetarian: true, calories: 520 },
];

const buildSampleMenuChart = (chefId: string, dishIds: string[]): ChefMenuChart => {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 13);

  const days = Array.from({ length: 14 }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateStr = date.toISOString().split('T')[0];

    const breakfastId = dishIds[index % dishIds.length];
    const lunchId = dishIds[(index + 1) % dishIds.length];
    const dinnerId = dishIds[(index + 2) % dishIds.length];

    const altFor = (mealId: string) => dishIds.filter(id => id !== mealId).slice(0, 2);

    return {
      date: dateStr,
      slots: {
        breakfast: { mealId: breakfastId, alternativeMealIds: altFor(breakfastId) },
        lunch: { mealId: lunchId, alternativeMealIds: altFor(lunchId) },
        dinner: { mealId: dinnerId, alternativeMealIds: altFor(dinnerId) },
      },
    };
  });

  return {
    id: `chart-${chefId}`,
    chefId,
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
    days,
  };
};

// Sample chef with dishes
const sampleChefs: Chef[] = [
  {
    id: 'chef-sample-1',
    email: 'chef.priya@zynk.com',
    password: 'chef123',
    name: 'Chef Priya Sharma',
    role: 'chef',
    status: 'approved',
    specialty: 'North Indian',
    bio: 'Award-winning chef with 10 years experience in authentic North Indian cuisine',
    kitchenLocation: { street: 'Koramangala 5th Block', city: 'Bangalore', state: 'Karnataka', zipCode: '560095' },
    serviceArea: 'Koramangala, HSR Layout, Indiranagar',
    deliverySlots: ['lunch', 'dinner'],
    rating: 4.8,
    totalOrders: 1250,
    createdAt: new Date().toISOString(),
    menuCharts: [],
  },
  {
    id: 'chef-sample-2',
    email: 'chef.arjun@zynk.com',
    password: 'chef123',
    name: 'Chef Arjun Patel',
    role: 'chef',
    status: 'approved',
    specialty: 'South Indian & Continental',
    bio: 'Fusion cuisine expert bringing together traditional and modern flavors',
    kitchenLocation: { street: 'Whitefield Main Road', city: 'Bangalore', state: 'Karnataka', zipCode: '560066' },
    serviceArea: 'Whitefield, Marathahalli, ITPL',
    deliverySlots: ['lunch', 'dinner'],
    rating: 4.6,
    totalOrders: 890,
    createdAt: new Date().toISOString(),
    menuCharts: [],
  },
  {
    id: 'chef-sample-3',
    email: 'chef.meera@zynk.com',
    password: 'chef123',
    name: 'Chef Meera Krishnan',
    role: 'chef',
    status: 'approved',
    specialty: 'Healthy & Keto',
    bio: 'Certified nutritionist chef specializing in healthy, low-carb meals',
    kitchenLocation: { street: 'JP Nagar 6th Phase', city: 'Bangalore', state: 'Karnataka', zipCode: '560078' },
    serviceArea: 'JP Nagar, Jayanagar, BTM Layout',
    deliverySlots: ['lunch'],
    rating: 4.9,
    totalOrders: 650,
    createdAt: new Date().toISOString(),
    menuCharts: [],
  },
];

// Sample dishes
const sampleDishes: Dish[] = [
  // Chef Priya's dishes
  {
    id: 'dish-1',
    chefId: 'chef-sample-1',
    name: 'Butter Chicken Thali',
    description: 'Creamy butter chicken with naan, rice, and dal',
    category: 'non-veg',
    nutritionalInfo: { calories: 750, protein: 35, carbs: 65, fat: 28 },
    allowsCustomization: true,
    customizationOptions: [
      { id: 'c1', name: 'Extra rice', type: 'add' },
      { id: 'c2', name: 'Less spice', type: 'adjust' },
      { id: 'c3', name: 'No onion/garlic', type: 'remove' },
    ],
    isActive: true,
  },
  {
    id: 'dish-2',
    chefId: 'chef-sample-1',
    name: 'Paneer Butter Masala',
    description: 'Rich and creamy paneer curry with aromatic spices',
    category: 'veg',
    nutritionalInfo: { calories: 620, protein: 22, carbs: 48, fat: 32 },
    allowsCustomization: true,
    customizationOptions: [
      { id: 'c4', name: 'Extra protein (double paneer)', type: 'add' },
      { id: 'c5', name: 'Less cream', type: 'adjust' },
    ],
    isActive: true,
  },
  {
    id: 'dish-3',
    chefId: 'chef-sample-1',
    name: 'Dal Makhani Special',
    description: 'Slow-cooked black lentils with butter and cream',
    category: 'veg',
    nutritionalInfo: { calories: 480, protein: 18, carbs: 52, fat: 18 },
    allowsCustomization: false,
    customizationOptions: [],
    isActive: true,
  },
  // Chef Arjun's dishes
  {
    id: 'dish-4',
    chefId: 'chef-sample-2',
    name: 'Grilled Chicken Continental',
    description: 'Herb-marinated chicken with mashed potatoes and veggies',
    category: 'non-veg',
    nutritionalInfo: { calories: 550, protein: 42, carbs: 35, fat: 22 },
    allowsCustomization: true,
    customizationOptions: [
      { id: 'c6', name: 'Extra vegetables', type: 'add' },
      { id: 'c7', name: 'No butter sauce', type: 'remove' },
    ],
    isActive: true,
  },
  {
    id: 'dish-5',
    chefId: 'chef-sample-2',
    name: 'South Indian Thali',
    description: 'Traditional sambar, rasam, kootu, poriyal with rice',
    category: 'veg',
    nutritionalInfo: { calories: 520, protein: 15, carbs: 78, fat: 12 },
    allowsCustomization: true,
    customizationOptions: [
      { id: 'c8', name: 'Extra sambar', type: 'add' },
      { id: 'c9', name: 'No curd', type: 'remove' },
    ],
    isActive: true,
  },
  // Chef Meera's dishes
  {
    id: 'dish-6',
    chefId: 'chef-sample-3',
    name: 'Keto Chicken Bowl',
    description: 'Low-carb grilled chicken with cauliflower rice and avocado',
    category: 'non-veg',
    nutritionalInfo: { calories: 380, protein: 38, carbs: 8, fat: 22 },
    allowsCustomization: true,
    customizationOptions: [
      { id: 'c10', name: 'Extra avocado', type: 'add' },
      { id: 'c11', name: 'Extra cheese', type: 'add' },
    ],
    isActive: true,
  },
  {
    id: 'dish-7',
    chefId: 'chef-sample-3',
    name: 'Quinoa Veggie Bowl',
    description: 'Protein-rich quinoa with roasted vegetables and tahini',
    category: 'veg',
    nutritionalInfo: { calories: 420, protein: 16, carbs: 45, fat: 18 },
    allowsCustomization: false,
    customizationOptions: [],
    isActive: true,
  },
];

// Attach sample menu charts for each chef based on their dishes
const dishIdsByChef = sampleDishes.reduce<Record<string, string[]>>((acc, dish) => {
  if (!acc[dish.chefId]) acc[dish.chefId] = [];
  acc[dish.chefId].push(dish.id);
  return acc;
}, {});

sampleChefs.forEach((chef) => {
  const dishIds = dishIdsByChef[chef.id] || [];
  if (dishIds.length > 0) {
    chef.menuCharts = [buildSampleMenuChart(chef.id, dishIds)];
  }
});

// Initial database structure
const initialDatabase: Database = {
  users: [
    {
      id: 'admin-1',
      email: 'admin@zynk.com',
      password: 'admin123',
      name: 'ZYNK Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'delivery-1',
      email: 'delivery@zynk.com',
      password: 'delivery123',
      name: 'Raj Kumar',
      role: 'delivery',
      phone: '+91-9876543210',
      createdAt: new Date().toISOString(),
    } as User,
    ...sampleChefs,
  ],
  subscriptions: [],
  meals: sampleMeals,
  dishes: sampleDishes,
  dailyMeals: [],
  orders: [],
  reviews: [],
};

// Read database from localStorage
export const readDatabase = (): Database => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure dishes array exists for backwards compatibility
      if (!parsed.dishes) {
        parsed.dishes = sampleDishes;
      }
      if (parsed.users) {
        parsed.users = parsed.users.map((u: User) => {
          if (u.role === 'chef') {
            const chef = u as Chef;
            return { ...chef, menuCharts: chef.menuCharts || [] };
          }
          return u;
        });
      }
      return parsed;
    }
    // Initialize with default data
    writeDatabase(initialDatabase);
    return initialDatabase;
  } catch (error) {
    console.error('Error reading database:', error);
    return initialDatabase;
  }
};

// Write database to localStorage
export const writeDatabase = (data: Database): void => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing database:', error);
  }
};

// Generate unique ID
export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Check if current time is before 8 PM
export const isBeforeCutoff = (): boolean => {
  const now = new Date();
  const cutoffHour = 20; // 8 PM
  return now.getHours() < cutoffHour;
};

// Get tomorrow's date in YYYY-MM-DD format
export const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// User helpers
export const findUserByEmail = (email: string): User | undefined => {
  const db = readDatabase();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const findUserById = (id: string): User | undefined => {
  const db = readDatabase();
  return db.users.find(u => u.id === id);
};

export const createUser = (user: User): User => {
  const db = readDatabase();
  db.users.push(user);
  writeDatabase(db);
  return user;
};

export const updateUser = (id: string, updates: Partial<User>): User | undefined => {
  const db = readDatabase();
  const index = db.users.findIndex(u => u.id === id);
  if (index === -1) return undefined;
  db.users[index] = { ...db.users[index], ...updates };
  writeDatabase(db);
  return db.users[index];
};

// Subscription helpers
export const createSubscription = (subscription: Subscription): Subscription => {
  const db = readDatabase();
  db.subscriptions.push(subscription);
  writeDatabase(db);
  return subscription;
};

export const findSubscriptionByCustomerId = (customerId: string): Subscription | undefined => {
  const db = readDatabase();
  return db.subscriptions.find(s => s.customerId === customerId && s.status === 'active');
};

export const updateSubscription = (id: string, updates: Partial<Subscription>): Subscription | undefined => {
  const db = readDatabase();
  const index = db.subscriptions.findIndex(s => s.id === id);
  if (index === -1) return undefined;
  db.subscriptions[index] = { ...db.subscriptions[index], ...updates };
  writeDatabase(db);
  return db.subscriptions[index];
};

// Daily meal helpers
export const createDailyMeal = (dailyMeal: DailyMeal): DailyMeal => {
  const db = readDatabase();
  db.dailyMeals.push(dailyMeal);
  writeDatabase(db);
  return dailyMeal;
};

export const findDailyMealsByCustomerId = (customerId: string, date?: string): DailyMeal[] => {
  const db = readDatabase();
  return db.dailyMeals.filter(dm => 
    dm.customerId === customerId && 
    (!date || dm.date === date)
  );
};

export const updateDailyMeal = (id: string, updates: Partial<DailyMeal>): DailyMeal | undefined => {
  const db = readDatabase();
  const index = db.dailyMeals.findIndex(dm => dm.id === id);
  if (index === -1) return undefined;
  db.dailyMeals[index] = { ...db.dailyMeals[index], ...updates };
  writeDatabase(db);
  return db.dailyMeals[index];
};

// Order helpers
export const createOrder = (order: Order): Order => {
  const db = readDatabase();
  db.orders.push(order);
  writeDatabase(db);
  return order;
};

export const getOrdersByDate = (date: string): Order[] => {
  const db = readDatabase();
  return db.orders.filter(o => o.date === date);
};

export const updateOrder = (id: string, updates: Partial<Order>): Order | undefined => {
  const db = readDatabase();
  const index = db.orders.findIndex(o => o.id === id);
  if (index === -1) return undefined;
  db.orders[index] = { ...db.orders[index], ...updates };
  writeDatabase(db);
  return db.orders[index];
};

// Meal helpers
export const getAllMeals = (): Meal[] => {
  const db = readDatabase();
  return db.meals;
};

export const findMealById = (id: string): Meal | undefined => {
  const db = readDatabase();
  return db.meals.find(m => m.id === id);
};

// Dish helpers
export const getAllDishes = (): Dish[] => {
  const db = readDatabase();
  return db.dishes || [];
};

export const getDishesByChefId = (chefId: string): Dish[] => {
  const db = readDatabase();
  return (db.dishes || []).filter(d => d.chefId === chefId && d.isActive);
};

export const findDishById = (id: string): Dish | undefined => {
  const db = readDatabase();
  return (db.dishes || []).find(d => d.id === id);
};

export const createDish = (dish: Dish): Dish => {
  const db = readDatabase();
  if (!db.dishes) db.dishes = [];
  db.dishes.push(dish);
  writeDatabase(db);
  return dish;
};

export const updateDish = (id: string, updates: Partial<Dish>): Dish | undefined => {
  const db = readDatabase();
  if (!db.dishes) return undefined;
  const index = db.dishes.findIndex(d => d.id === id);
  if (index === -1) return undefined;
  db.dishes[index] = { ...db.dishes[index], ...updates };
  writeDatabase(db);
  return db.dishes[index];
};

export const deleteDish = (id: string): boolean => {
  const db = readDatabase();
  if (!db.dishes) return false;
  const index = db.dishes.findIndex(d => d.id === id);
  if (index === -1) return false;
  db.dishes[index].isActive = false;
  writeDatabase(db);
  return true;
};

// Chef helpers
export const getPendingChefs = (): Chef[] => {
  const db = readDatabase();
  return db.users.filter(u => u.role === 'chef' && (u as Chef).status === 'pending') as Chef[];
};

export const getApprovedChefs = (): Chef[] => {
  const db = readDatabase();
  return db.users.filter(u => u.role === 'chef' && (u as Chef).status === 'approved') as Chef[];
};

export const getChefMenuCharts = (chefId: string): ChefMenuChart[] => {
  const db = readDatabase();
  const chef = db.users.find(u => u.id === chefId) as Chef | undefined;
  return chef?.menuCharts || [];
};

export const setChefMenuCharts = (chefId: string, charts: ChefMenuChart[]): Chef | undefined => {
  return updateUser(chefId, { menuCharts: charts } as Partial<Chef>) as Chef | undefined;
};

// Admin stats
export const getAdminStats = () => {
  const db = readDatabase();
  return {
    totalCustomers: db.users.filter(u => u.role === 'customer').length,
    totalChefs: db.users.filter(u => u.role === 'chef').length,
    activeSubscriptions: db.subscriptions.filter(s => s.status === 'active').length,
    pendingChefs: db.users.filter(u => u.role === 'chef' && (u as Chef).status === 'pending').length,
    totalOrders: db.orders.length,
  };
};

// Finalize tomorrow's orders at 8 PM
export const finalizeTomorrowOrders = (): void => {
  const db = readDatabase();
  const tomorrow = getTomorrowDate();
  
  db.dailyMeals.forEach((dm, index) => {
    if (dm.date === tomorrow && !dm.isFinalized) {
      db.dailyMeals[index].isFinalized = true;
    }
  });
  
  writeDatabase(db);
};

// Get finalized orders for a chef
export const getFinalizedOrdersForChef = (chefId: string): Order[] => {
  const db = readDatabase();
  const tomorrow = getTomorrowDate();
  
  return db.orders.filter(o => 
    o.date === tomorrow && 
    o.chefId === chefId &&
    o.status !== 'delivered'
  );
};

// Reset database (for testing)
export const resetDatabase = (): void => {
  writeDatabase(initialDatabase);
};

// ========================================
// REVIEW HELPERS
// ========================================

export const createReview = (review: Review): Review => {
  const db = readDatabase();
  if (!db.reviews) db.reviews = [];
  db.reviews.push(review);
  writeDatabase(db);
  return review;
};

export const getReviewsByChefId = (chefId: string): Review[] => {
  const db = readDatabase();
  return (db.reviews || []).filter(r => r.chefId === chefId && !r.isHidden);
};

export const getReviewsByCustomerId = (customerId: string): Review[] => {
  const db = readDatabase();
  return (db.reviews || []).filter(r => r.customerId === customerId);
};

export const getReviewByOrderId = (orderId: string): Review | undefined => {
  const db = readDatabase();
  return (db.reviews || []).find(r => r.orderId === orderId);
};

export const getAllReviews = (): Review[] => {
  const db = readDatabase();
  return db.reviews || [];
};

export const updateReview = (reviewId: string, updates: Partial<Review>): Review | undefined => {
  const db = readDatabase();
  if (!db.reviews) return undefined;
  const index = db.reviews.findIndex(r => r.id === reviewId);
  if (index === -1) return undefined;
  db.reviews[index] = { ...db.reviews[index], ...updates };
  writeDatabase(db);
  return db.reviews[index];
};

// Calculate chef's average rating
export const getChefRating = (chefId: string): { averageRating: number; reviewCount: number } => {
  const reviews = getReviewsByChefId(chefId);
  if (reviews.length === 0) {
    return { averageRating: 0, reviewCount: 0 };
  }
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return {
    averageRating: Math.round((total / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
  };
};

// Get orders eligible for review (delivered, not yet reviewed)
export const getDeliveredOrdersForReview = (customerId: string): Order[] => {
  const db = readDatabase();
  const today = new Date().toISOString().split('T')[0];
  return db.orders.filter(o => 
    o.customerId === customerId && 
    o.status === 'delivered' &&
    !o.isReviewed &&
    o.date <= today
  );
};

// Get customer orders with tracking info
export const getCustomerOrders = (customerId: string): Order[] => {
  const db = readDatabase();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = getTomorrowDate();
  return db.orders.filter(o => 
    o.customerId === customerId && 
    (o.date === today || o.date === tomorrow)
  );
};
