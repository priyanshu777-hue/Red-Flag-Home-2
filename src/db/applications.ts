import { db } from './index.ts';
import { applications } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export interface CreateApplicationParams {
  userId: string;
  userEmail: string;
  userName?: string;
  phone?: string;
  tier: string;
  location?: string;
  capital?: string;
  notes?: string;
}

export async function createApplication(params: CreateApplicationParams) {
  try {
    const result = await db.insert(applications)
      .values({
        userId: params.userId,
        userEmail: params.userEmail,
        userName: params.userName || null,
        phone: params.phone || null,
        tier: params.tier,
        location: params.location || null,
        capital: params.capital || null,
        notes: params.notes || null,
        status: 'Pending Review',
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in createApplication:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getUserApplications(userId: string) {
  try {
    return await db.select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.createdAt));
  } catch (error) {
    console.error('Database query failed in getUserApplications:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
