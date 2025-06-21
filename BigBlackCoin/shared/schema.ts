import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  coinBalance: decimal("coin_balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
  bbcBalance: decimal("bbc_balance", { precision: 12, scale: 8 }).notNull().default("0.00000000"),
  isAdmin: boolean("is_admin").notNull().default(false),
  isBanned: boolean("is_banned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const gameResults = pgTable("game_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameType: text("game_type").notNull(),
  betAmount: decimal("bet_amount", { precision: 12, scale: 2 }).notNull(),
  winAmount: decimal("win_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  bbcWon: decimal("bbc_won", { precision: 12, scale: 8 }).notNull().default("0.00000000"),
  result: text("result").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const deposits = pgTable("deposits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  receiptUrl: text("receipt_url"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  withdrawalMethod: text("withdrawal_method").notNull(),
  accountDetails: text("account_details").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const miningActivity = pgTable("mining_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bbcMined: decimal("bbc_mined", { precision: 12, scale: 8 }).notNull(),
  clicks: integer("clicks").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameResultSchema = createInsertSchema(gameResults).omit({
  id: true,
  createdAt: true,
});

export const insertDepositSchema = createInsertSchema(deposits).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertMiningActivitySchema = createInsertSchema(miningActivity).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGameResult = z.infer<typeof insertGameResultSchema>;
export type GameResult = typeof gameResults.$inferSelect;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type Deposit = typeof deposits.$inferSelect;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertMiningActivity = z.infer<typeof insertMiningActivitySchema>;
export type MiningActivity = typeof miningActivity.$inferSelect;
