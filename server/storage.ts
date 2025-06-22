import { 
  users, deposits, withdrawals, gameResults, miningActivity,
  type User, type InsertUser, type Deposit, type InsertDeposit,
  type Withdrawal, type InsertWithdrawal, type GameResult, type InsertGameResult,
  type MiningActivity, type InsertMiningActivity
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, coinBalance: string, bbcBalance: string): Promise<void>;
  updateUser(userId: number, updates: Partial<User>): Promise<User | undefined>;

  // Game operations
  createGameResult(result: InsertGameResult): Promise<GameResult>;
  getRecentWins(limit?: number): Promise<(GameResult & { username: string })[]>;
  getUserGameHistory(userId: number): Promise<GameResult[]>;

  // Deposit operations
  createDeposit(deposit: InsertDeposit): Promise<Deposit>;
  getPendingDeposits(): Promise<(Deposit & { username: string })[]>;
  updateDepositStatus(depositId: number, status: string): Promise<void>;
  getUserDeposits(userId: number): Promise<Deposit[]>;

  // Withdrawal operations
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getPendingWithdrawals(): Promise<(Withdrawal & { username: string })[]>;
  updateWithdrawalStatus(withdrawalId: number, status: string): Promise<void>;
  getUserWithdrawals(userId: number): Promise<Withdrawal[]>;

  // Mining operations
  createMiningActivity(activity: InsertMiningActivity): Promise<MiningActivity>;
  getUserMiningStats(userId: number): Promise<{ totalMined: string; totalClicks: number }>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  getSystemStats(): Promise<{
    totalUsers: number;
    totalDeposits: string;
    totalBbcInCirculation: string;
    activeGames: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private deposits: Map<number, Deposit & { username: string }>;
  private withdrawals: Map<number, Withdrawal & { username: string }>;
  private gameResults: Map<number, GameResult & { username: string }>;
  private miningActivities: Map<number, MiningActivity>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.deposits = new Map();
    this.withdrawals = new Map();
    this.gameResults = new Map();
    this.miningActivities = new Map();
    this.currentId = 1;

    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin1234"
    }).then(user => {
      this.updateUser(user.id, { 
        isAdmin: true, 
        coinBalance: "999999.00", 
        bbcBalance: "999.00000000" 
      });
    });

    // Create sample regular user
    this.createUser({
      username: "player1",
      password: "password123"
    }).then(user => {
      this.updateUser(user.id, { 
        coinBalance: "12450.75", 
        bbcBalance: "2.35000000" 
      });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      coinBalance: "0.00",
      bbcBalance: "0.00000000",
      isAdmin: false,
      isBanned: false,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: number, coinBalance: string, bbcBalance: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.coinBalance = coinBalance;
      user.bbcBalance = bbcBalance;
      this.users.set(userId, user);
    }
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      const updatedUser = { ...user, ...updates };
      this.users.set(userId, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async createGameResult(result: InsertGameResult): Promise<GameResult> {
    const id = this.currentId++;
    const user = await this.getUser(result.userId);
    const gameResult: GameResult & { username: string } = {
      ...result,
      id,
      winAmount: result.winAmount || "0.00",
      bbcWon: result.bbcWon || "0.00000000",
      createdAt: new Date(),
      username: user?.username || "Unknown"
    };
    this.gameResults.set(id, gameResult);
    return gameResult;
  }

  async getRecentWins(limit: number = 10): Promise<(GameResult & { username: string })[]> {
    return Array.from(this.gameResults.values())
      .filter(result => parseFloat(result.winAmount) > 0)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getUserGameHistory(userId: number): Promise<GameResult[]> {
    return Array.from(this.gameResults.values())
      .filter(result => result.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createDeposit(deposit: InsertDeposit): Promise<Deposit> {
    const id = this.currentId++;
    const user = await this.getUser(deposit.userId);
    const depositRecord: Deposit & { username: string } = {
      ...deposit,
      id,
      receiptUrl: deposit.receiptUrl || null,
      status: "pending",
      createdAt: new Date(),
      username: user?.username || "Unknown"
    };
    this.deposits.set(id, depositRecord);
    return depositRecord;
  }

  async getPendingDeposits(): Promise<(Deposit & { username: string })[]> {
    return Array.from(this.deposits.values())
      .filter(deposit => deposit.status === "pending")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateDepositStatus(depositId: number, status: string): Promise<void> {
    const deposit = this.deposits.get(depositId);
    if (deposit) {
      deposit.status = status;
      this.deposits.set(depositId, deposit);
      
      // If approved, add coins to user balance
      if (status === "approved") {
        const user = await this.getUser(deposit.userId);
        if (user) {
          const newBalance = (parseFloat(user.coinBalance) + parseFloat(deposit.amount)).toFixed(2);
          await this.updateUserBalance(deposit.userId, newBalance, user.bbcBalance);
        }
      }
    }
  }

  async getUserDeposits(userId: number): Promise<Deposit[]> {
    return Array.from(this.deposits.values())
      .filter(deposit => deposit.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const id = this.currentId++;
    const user = await this.getUser(withdrawal.userId);
    const withdrawalRecord: Withdrawal & { username: string } = {
      ...withdrawal,
      id,
      status: "pending",
      createdAt: new Date(),
      username: user?.username || "Unknown"
    };
    this.withdrawals.set(id, withdrawalRecord);
    return withdrawalRecord;
  }

  async getPendingWithdrawals(): Promise<(Withdrawal & { username: string })[]> {
    return Array.from(this.withdrawals.values())
      .filter(withdrawal => withdrawal.status === "pending")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateWithdrawalStatus(withdrawalId: number, status: string): Promise<void> {
    const withdrawal = this.withdrawals.get(withdrawalId);
    if (withdrawal) {
      withdrawal.status = status;
      this.withdrawals.set(withdrawalId, withdrawal);
    }
  }

  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values())
      .filter(withdrawal => withdrawal.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createMiningActivity(activity: InsertMiningActivity): Promise<MiningActivity> {
    const id = this.currentId++;
    const miningActivity: MiningActivity = {
      ...activity,
      id,
      clicks: activity.clicks || 1,
      createdAt: new Date()
    };
    this.miningActivities.set(id, miningActivity);
    return miningActivity;
  }

  async getUserMiningStats(userId: number): Promise<{ totalMined: string; totalClicks: number }> {
    const activities = Array.from(this.miningActivities.values())
      .filter(activity => activity.userId === userId);
    
    const totalMined = activities
      .reduce((sum, activity) => sum + parseFloat(activity.bbcMined), 0)
      .toFixed(8);
    
    const totalClicks = activities
      .reduce((sum, activity) => sum + activity.clicks, 0);

    return { totalMined, totalClicks };
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => !user.isAdmin)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalDeposits: string;
    totalBbcInCirculation: string;
    activeGames: number;
  }> {
    const totalUsers = Array.from(this.users.values()).filter(user => !user.isAdmin).length;
    
    const totalDeposits = Array.from(this.deposits.values())
      .filter(deposit => deposit.status === "approved")
      .reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0)
      .toFixed(2);
    
    const totalBbcInCirculation = Array.from(this.users.values())
      .reduce((sum, user) => sum + parseFloat(user.bbcBalance), 0)
      .toFixed(8);
    
    const activeGames = Array.from(this.gameResults.values())
      .filter(result => {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return result.createdAt > hourAgo;
      }).length;

    return {
      totalUsers,
      totalDeposits,
      totalBbcInCirculation,
      activeGames
    };
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserBalance(userId: number, coinBalance: string, bbcBalance: string): Promise<void> {
    await db
      .update(users)
      .set({ coinBalance, bbcBalance })
      .where(eq(users.id, userId));
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async createGameResult(result: InsertGameResult): Promise<GameResult> {
    const [gameResult] = await db
      .insert(gameResults)
      .values({
        ...result,
        winAmount: result.winAmount || "0.00",
        bbcWon: result.bbcWon || "0.00000000"
      })
      .returning();
    return gameResult;
  }

  async getRecentWins(limit: number = 10): Promise<(GameResult & { username: string })[]> {
    const results = await db
      .select({
        id: gameResults.id,
        userId: gameResults.userId,
        gameType: gameResults.gameType,
        betAmount: gameResults.betAmount,
        winAmount: gameResults.winAmount,
        bbcWon: gameResults.bbcWon,
        result: gameResults.result,
        createdAt: gameResults.createdAt,
        username: users.username
      })
      .from(gameResults)
      .innerJoin(users, eq(gameResults.userId, users.id))
      .where(eq(gameResults.winAmount, "0.00"))
      .orderBy(gameResults.createdAt)
      .limit(limit);
    
    return results.filter(r => parseFloat(r.winAmount) > 0);
  }

  async getUserGameHistory(userId: number): Promise<GameResult[]> {
    return await db
      .select()
      .from(gameResults)
      .where(eq(gameResults.userId, userId))
      .orderBy(gameResults.createdAt);
  }

  async createDeposit(deposit: InsertDeposit): Promise<Deposit> {
    const [depositRecord] = await db
      .insert(deposits)
      .values({
        ...deposit,
        receiptUrl: deposit.receiptUrl || null
      })
      .returning();
    return depositRecord;
  }

  async getPendingDeposits(): Promise<(Deposit & { username: string })[]> {
    const results = await db
      .select({
        id: deposits.id,
        userId: deposits.userId,
        amount: deposits.amount,
        paymentMethod: deposits.paymentMethod,
        receiptUrl: deposits.receiptUrl,
        status: deposits.status,
        createdAt: deposits.createdAt,
        username: users.username
      })
      .from(deposits)
      .innerJoin(users, eq(deposits.userId, users.id))
      .where(eq(deposits.status, "pending"))
      .orderBy(deposits.createdAt);
    
    return results;
  }

  async updateDepositStatus(depositId: number, status: string): Promise<void> {
    await db
      .update(deposits)
      .set({ status })
      .where(eq(deposits.id, depositId));
    
    if (status === "approved") {
      const [deposit] = await db.select().from(deposits).where(eq(deposits.id, depositId));
      if (deposit) {
        const [user] = await db.select().from(users).where(eq(users.id, deposit.userId));
        if (user) {
          const newBalance = (parseFloat(user.coinBalance) + parseFloat(deposit.amount)).toFixed(2);
          await this.updateUserBalance(deposit.userId, newBalance, user.bbcBalance);
        }
      }
    }
  }

  async getUserDeposits(userId: number): Promise<Deposit[]> {
    return await db
      .select()
      .from(deposits)
      .where(eq(deposits.userId, userId))
      .orderBy(deposits.createdAt);
  }

  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const [withdrawalRecord] = await db
      .insert(withdrawals)
      .values(withdrawal)
      .returning();
    return withdrawalRecord;
  }

  async getPendingWithdrawals(): Promise<(Withdrawal & { username: string })[]> {
    const results = await db
      .select({
        id: withdrawals.id,
        userId: withdrawals.userId,
        amount: withdrawals.amount,
        withdrawalMethod: withdrawals.withdrawalMethod,
        accountDetails: withdrawals.accountDetails,
        status: withdrawals.status,
        createdAt: withdrawals.createdAt,
        username: users.username
      })
      .from(withdrawals)
      .innerJoin(users, eq(withdrawals.userId, users.id))
      .where(eq(withdrawals.status, "pending"))
      .orderBy(withdrawals.createdAt);
    
    return results;
  }

  async updateWithdrawalStatus(withdrawalId: number, status: string): Promise<void> {
    await db
      .update(withdrawals)
      .set({ status })
      .where(eq(withdrawals.id, withdrawalId));
  }

  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.userId, userId))
      .orderBy(withdrawals.createdAt);
  }

  async createMiningActivity(activity: InsertMiningActivity): Promise<MiningActivity> {
    const [miningActivityRecord] = await db
      .insert(miningActivity)
      .values({
        ...activity,
        clicks: activity.clicks || 1
      })
      .returning();
    return miningActivityRecord;
  }

  async getUserMiningStats(userId: number): Promise<{ totalMined: string; totalClicks: number }> {
    const activities = await db
      .select()
      .from(miningActivity)
      .where(eq(miningActivity.userId, userId));
    
    const totalMined = activities
      .reduce((sum, activity) => sum + parseFloat(activity.bbcMined), 0)
      .toFixed(8);
    
    const totalClicks = activities
      .reduce((sum, activity) => sum + activity.clicks, 0);

    return { totalMined, totalClicks };
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isAdmin, false))
      .orderBy(users.createdAt);
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalDeposits: string;
    totalBbcInCirculation: string;
    activeGames: number;
  }> {
    const allUsers = await db.select().from(users).where(eq(users.isAdmin, false));
    const approvedDeposits = await db.select().from(deposits).where(eq(deposits.status, "approved"));
    const recentGames = await db.select().from(gameResults);
    
    const totalUsers = allUsers.length;
    const totalDeposits = approvedDeposits
      .reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0)
      .toFixed(2);
    const totalBbcInCirculation = allUsers
      .reduce((sum, user) => sum + parseFloat(user.bbcBalance), 0)
      .toFixed(8);
    const activeGames = recentGames
      .filter(result => {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return result.createdAt > hourAgo;
      }).length;

    return {
      totalUsers,
      totalDeposits,
      totalBbcInCirculation,
      activeGames
    };
  }
}

// Use database storage if DATABASE_URL is available, otherwise use memory storage
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
