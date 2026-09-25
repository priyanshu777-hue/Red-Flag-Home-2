import { db } from './index.ts';
import { inquiries } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export interface CreateInquiryParams {
  userId: string;
  userEmail: string;
  destination?: string;
  guests?: string;
  dates?: string;
}

export async function createInquiry(params: CreateInquiryParams) {
  try {
    const result = await db.insert(inquiries)
      .values({
        userId: params.userId,
        userEmail: params.userEmail,
        destination: params.destination || null,
        guests: params.guests || null,
        dates: params.dates || null,
        status: 'Inquiry Received',
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in createInquiry:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getUserInquiries(userId: string) {
  try {
    return await db.select()
      .from(inquiries)
      .where(eq(inquiries.userId, userId))
      .orderBy(desc(inquiries.createdAt));
  } catch (error) {
    console.error('Database query failed in getUserInquiries:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
