import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Define the 'users' table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at').defaultNow(),
});

// Define the 'applications' table (Franchise partner allocations)
export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Firebase UID or user reference
  userEmail: text('user_email').notNull(),
  userName: text('user_name'),
  phone: text('phone'),
  tier: text('tier').notNull(),
  location: text('location'),
  capital: text('capital'),
  notes: text('notes'),
  status: text('status').default('Pending Review'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'inquiries' table (Stay reservations and guest inquiries)
export const inquiries = pgTable('inquiries', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  destination: text('destination'),
  guests: text('guests'),
  dates: text('dates'),
  status: text('status').default('Inquiry Received'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relationships for 'users'
export const usersRelations = relations(users, ({ many }) => ({
  applications: many(applications),
  inquiries: many(inquiries),
}));

// Define relationships for 'applications'
export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.uid],
  }),
}));

// Define relationships for 'inquiries'
export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  user: one(users, {
    fields: [inquiries.userId],
    references: [users.uid],
  }),
}));
