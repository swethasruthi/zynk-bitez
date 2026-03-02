import { and, eq, inArray, sql } from 'drizzle-orm';
import { getDb } from '../config/database.js';
import {
  chefProfiles,
  customerProfiles,
  deliveries,
  mealPlans,
  subscriptions,
  users,
  type NewDelivery,
  type NewMealPlan,
  type NewSubscription,
} from './schema.js';

export const createChefProfile = async (data: typeof chefProfiles.$inferInsert) => {
  const db = getDb();
  const rows = await db.insert(chefProfiles).values(data).returning();
  return rows[0];
};

export const upsertMealPlan = async (data: NewMealPlan) => {
  const db = getDb();
  const rows = await db.insert(mealPlans).values(data).returning();
  return rows[0];
};

export const getAvailableChefsByPincode = async (pincode: string) => {
  const db = getDb();

  return db
    .select({
      chefId: users.id,
      kitchenName: chefProfiles.kitchenName,
      rating: chefProfiles.rating,
      deliveryWindow: chefProfiles.deliveryWindow,
    })
    .from(users)
    .innerJoin(chefProfiles, eq(chefProfiles.userId, users.id))
    .where(
      and(
        eq(users.role, 'chef'),
        eq(users.isVerified, true),
        eq(users.status, 'active'),
        eq(chefProfiles.verificationStatus, 'approved'),
        sql`${chefProfiles.serviceZones} ILIKE ${`%${pincode}%`}`
      )
    );
};

export const getChefPlans = async (chefId: number) => {
  const db = getDb();
  return db
    .select({
      planId: mealPlans.id,
      planName: mealPlans.planName,
      monthlyPrice: mealPlans.monthlyPrice,
      frequency: mealPlans.frequency,
      mealType: mealPlans.mealType,
    })
    .from(mealPlans)
    .where(and(eq(mealPlans.chefId, chefId), eq(mealPlans.availability, true)));
};

export const getPlanById = async (planId: number) => {
  const db = getDb();
  const rows = await db.select().from(mealPlans).where(eq(mealPlans.id, planId)).limit(1);
  return rows[0];
};

export const getCustomerProfileByUserId = async (userId: number) => {
  const db = getDb();
  const rows = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, userId)).limit(1);
  return rows[0];
};

export const getActiveSubscriptionForUser = async (userId: number) => {
  const db = getDb();
  const rows = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), inArray(subscriptions.status, ['pending', 'active'])))
    .limit(1);
  return rows[0];
};

export const createPendingSubscription = async (data: NewSubscription) => {
  const db = getDb();
  const rows = await db.insert(subscriptions).values(data).returning();
  return rows[0];
};

export const attachPaymentOrder = async (subscriptionId: number, orderId: string) => {
  const db = getDb();
  const rows = await db
    .update(subscriptions)
    .set({ paymentOrderId: orderId, updatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId))
    .returning();
  return rows[0];
};

export const getSubscriptionByOrderId = async (orderId: string) => {
  const db = getDb();
  const rows = await db.select().from(subscriptions).where(eq(subscriptions.paymentOrderId, orderId)).limit(1);
  return rows[0];
};

export const activateSubscription = async (subscriptionId: number, paymentId: string) => {
  const db = getDb();
  const rows = await db
    .update(subscriptions)
    .set({ status: 'active', paymentId, updatedAt: new Date(), startDate: new Date() })
    .where(eq(subscriptions.id, subscriptionId))
    .returning();
  return rows[0];
};

export const createDeliveryEntries = async (entries: NewDelivery[]) => {
  if (entries.length === 0) return [];
  const db = getDb();
  return db.insert(deliveries).values(entries).returning();
};

export const getDeliveryById = async (deliveryId: number) => {
  const db = getDb();
  const rows = await db.select().from(deliveries).where(eq(deliveries.id, deliveryId)).limit(1);
  return rows[0];
};

export const updateDeliveryStatus = async (deliveryId: number, status: 'skipped' | 'delivered') => {
  const db = getDb();
  const rows = await db
    .update(deliveries)
    .set({ status, deliveredAt: status === 'delivered' ? new Date() : null, updatedAt: new Date() })
    .where(eq(deliveries.id, deliveryId))
    .returning();
  return rows[0];
};

export const updateDeliveryAddress = async (deliveryId: number, address: string) => {
  const db = getDb();
  const rows = await db
    .update(deliveries)
    .set({ addressSnapshot: address, updatedAt: new Date() })
    .where(eq(deliveries.id, deliveryId))
    .returning();
  return rows[0];
};

export const getChefDeliveriesByDate = async (chefId: number, date: Date) => {
  const db = getDb();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return db
    .select()
    .from(deliveries)
    .where(and(eq(deliveries.chefId, chefId), sql`${deliveries.deliveryDate} >= ${start} and ${deliveries.deliveryDate} < ${end}`));
};
