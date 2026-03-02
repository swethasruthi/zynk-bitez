import { eq } from 'drizzle-orm';
import { getDb } from '../config/database.js';
import { users, NewUser, User } from './schema.js';

// Fetch user by email (for login lookup)
export const getUserByEmail = async (email: string): Promise<User | undefined> => {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
};

// Fetch user by ID
export const getUserById = async (id: number): Promise<User | undefined> => {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
};

// Create a new user in database
export const createUser = async (userData: NewUser): Promise<User> => {
  const db = getDb();
  const result = await db.insert(users).values(userData).returning();
  return result[0];
};

// Update user data by ID
export const updateUser = async (id: number, updates: Partial<NewUser>): Promise<User | undefined> => {
  const db = getDb();
  const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
  return result[0];
};

// Delete user by ID
export const deleteUser = async (id: number): Promise<void> => {
  const db = getDb();
  await db.delete(users).where(eq(users.id, id));
};

// Check if email already exists
export const emailExists = async (email: string): Promise<boolean> => {
  const user = await getUserByEmail(email);
  return !!user;
};
