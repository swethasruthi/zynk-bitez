import { pgTable, text, varchar, timestamp, integer, boolean, serial, pgEnum, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['customer', 'chef', 'delivery', 'admin']);

// Enum for subscription status
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'paused', 'cancelled']);

// Users table: Stores customer, chef, delivery, and admin accounts
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    // User's full name
    fullName: varchar('full_name', { length: 255 }).notNull(),
    // Unique email for authentication
    email: varchar('email', { length: 255 }).notNull().unique(),
    // Hashed password (bcrypt)
    passwordHash: text('password_hash').notNull(),
    // User role: customer, chef, delivery, or admin
    role: userRoleEnum('role').default('customer').notNull(),
    // Chef's business name (optional, only for chefs)
    chefBusinessName: varchar('chef_business_name', { length: 255 }),
    // Phone number for contact
    phone: varchar('phone', { length: 20 }),
    // Account status
    isActive: boolean('is_active').default(true).notNull(),
    // Timestamps for record management
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Index on email for faster lookups during login
    emailIdx: index('email_idx').on(table.email),
    // Index on role for filtering users by role
    roleIdx: index('role_idx').on(table.role),
  })
);

// Subscriptions table: Stores customer subscriptions with meal plans and addresses
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: serial('id').primaryKey(),
    // Foreign key: Links to users table (customer who owns the subscription)
    userId: integer('user_id').notNull(),
    // Monthly subscription plan (e.g., "Basic", "Premium", "Deluxe")
    planName: varchar('plan_name', { length: 100 }).notNull(),
    // Number of meals per week
    mealsPerWeek: integer('meals_per_week').notNull(),
    // Monthly price in cents
    priceInCents: integer('price_in_cents').notNull(),
    // Delivery address for meals
    deliveryAddress: text('delivery_address').notNull(),
    // Postal/ZIP code
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    // City of delivery
    city: varchar('city', { length: 100 }).notNull(),
    // Subscription status: active, paused, or cancelled
    status: subscriptionStatusEnum('status').default('active').notNull(),
    // Next billing date
    nextBillingDate: timestamp('next_billing_date').notNull(),
    // When a customer can skip/swap the next week's meal (locked after 8 PM on Friday)
    lastModifiedAt: timestamp('last_modified_at').defaultNow().notNull(),
    // Tracks if skip/swap is locked (set automatically after 8 PM Friday)
    isSkipSwapLocked: boolean('is_skip_swap_locked').default(false).notNull(),
    // When the lock was applied (to track reset timing)
    lockAppliedAt: timestamp('lock_applied_at'),
    // Timestamps for record management
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Foreign key constraint
    userIdRef: index('user_id_idx').on(table.userId),
    // Ensure one active subscription per user (for customer role)
    userStatusUnique: unique('user_active_subscription').on(table.userId, table.status),
  })
);

// Define relationships between tables
export const userRelations = relations(users, ({ many }) => ({
  // One user can have multiple subscriptions
  subscriptions: many(subscriptions),
}));

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  // Each subscription belongs to one user
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

// TypeScript types extracted from schema (for type safety)
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

// Enum types for TypeScript
export type UserRole = 'customer' | 'chef' | 'delivery' | 'admin';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
