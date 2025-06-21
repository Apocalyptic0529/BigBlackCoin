import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertGameResultSchema, insertDepositSchema, 
  insertWithdrawalSchema, insertMiningActivitySchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (user.isBanned) {
        return res.status(403).json({ message: "Account banned" });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        coinBalance: user.coinBalance,
        bbcBalance: user.bbcBalance,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User routes
  app.get("/api/user/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        coinBalance: user.coinBalance,
        bbcBalance: user.bbcBalance,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  app.post("/api/user/:id/convert", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { type, amount } = req.body; // type: "toBBC" or "toCoins"
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const convertAmount = parseFloat(amount);
      
      if (type === "toBBC") {
        // Convert coins to BBC (5000 coins = 1 BBC)
        const coinsNeeded = convertAmount * 5000;
        if (parseFloat(user.coinBalance) < coinsNeeded) {
          return res.status(400).json({ message: "Insufficient coins" });
        }
        
        const newCoinBalance = (parseFloat(user.coinBalance) - coinsNeeded).toFixed(2);
        const newBbcBalance = (parseFloat(user.bbcBalance) + convertAmount).toFixed(8);
        
        await storage.updateUserBalance(userId, newCoinBalance, newBbcBalance);
      } else if (type === "toCoins") {
        // Convert BBC to coins (1 BBC = 5000 coins)
        if (parseFloat(user.bbcBalance) < convertAmount) {
          return res.status(400).json({ message: "Insufficient BBC tokens" });
        }
        
        const coinsToAdd = convertAmount * 5000;
        const newCoinBalance = (parseFloat(user.coinBalance) + coinsToAdd).toFixed(2);
        const newBbcBalance = (parseFloat(user.bbcBalance) - convertAmount).toFixed(8);
        
        await storage.updateUserBalance(userId, newCoinBalance, newBbcBalance);
      }
      
      const updatedUser = await storage.getUser(userId);
      res.json({
        coinBalance: updatedUser?.coinBalance,
        bbcBalance: updatedUser?.bbcBalance
      });
    } catch (error) {
      res.status(500).json({ message: "Conversion failed" });
    }
  });

  // Game routes
  app.post("/api/games/play", async (req, res) => {
    try {
      const gameData = insertGameResultSchema.parse(req.body);
      
      const user = await storage.getUser(gameData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const betAmount = parseFloat(gameData.betAmount);
      
      // Check if user has sufficient balance
      if (parseFloat(user.coinBalance) < betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Deduct bet amount
      const newCoinBalance = (parseFloat(user.coinBalance) - betAmount).toFixed(2);
      let newBbcBalance = user.bbcBalance;
      
      // Add winnings if any
      const winAmount = parseFloat(gameData.winAmount || "0");
      if (winAmount > 0) {
        const finalCoinBalance = (parseFloat(newCoinBalance) + winAmount).toFixed(2);
        await storage.updateUserBalance(gameData.userId, finalCoinBalance, newBbcBalance);
      } else {
        await storage.updateUserBalance(gameData.userId, newCoinBalance, newBbcBalance);
      }
      
      // Add BBC winnings if any
      const bbcWon = parseFloat(gameData.bbcWon || "0");
      if (bbcWon > 0) {
        newBbcBalance = (parseFloat(user.bbcBalance) + bbcWon).toFixed(8);
        await storage.updateUserBalance(gameData.userId, newCoinBalance, newBbcBalance);
      }
      
      const result = await storage.createGameResult(gameData);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Game play failed" });
    }
  });

  app.get("/api/games/recent-wins", async (req, res) => {
    try {
      const recentWins = await storage.getRecentWins(10);
      res.json(recentWins);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recent wins" });
    }
  });

  app.get("/api/user/:id/game-history", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const history = await storage.getUserGameHistory(userId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to get game history" });
    }
  });

  // Deposit routes
  app.post("/api/deposits", async (req, res) => {
    try {
      const depositData = insertDepositSchema.parse(req.body);
      const deposit = await storage.createDeposit(depositData);
      res.json(deposit);
    } catch (error) {
      res.status(400).json({ message: "Invalid deposit data" });
    }
  });

  app.get("/api/user/:id/deposits", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const deposits = await storage.getUserDeposits(userId);
      res.json(deposits);
    } catch (error) {
      res.status(500).json({ message: "Failed to get deposits" });
    }
  });

  // Withdrawal routes
  app.post("/api/withdrawals", async (req, res) => {
    try {
      const withdrawalData = insertWithdrawalSchema.parse(req.body);
      
      // Check if user has sufficient balance
      const user = await storage.getUser(withdrawalData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const withdrawAmount = parseFloat(withdrawalData.amount);
      if (parseFloat(user.coinBalance) < withdrawAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Deduct amount from balance
      const newBalance = (parseFloat(user.coinBalance) - withdrawAmount).toFixed(2);
      await storage.updateUserBalance(withdrawalData.userId, newBalance, user.bbcBalance);
      
      const withdrawal = await storage.createWithdrawal(withdrawalData);
      res.json(withdrawal);
    } catch (error) {
      res.status(400).json({ message: "Invalid withdrawal data" });
    }
  });

  app.get("/api/user/:id/withdrawals", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const withdrawals = await storage.getUserWithdrawals(userId);
      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ message: "Failed to get withdrawals" });
    }
  });

  // Mining routes
  app.post("/api/mining/mine", async (req, res) => {
    try {
      const miningData = insertMiningActivitySchema.parse(req.body);
      
      // Generate random BBC amount between 0.00000001 and 0.00001000
      const bbcMined = (Math.random() * 0.00001).toFixed(8);
      miningData.bbcMined = bbcMined;
      
      const activity = await storage.createMiningActivity(miningData);
      
      // Add BBC to user balance
      const user = await storage.getUser(miningData.userId);
      if (user) {
        const newBbcBalance = (parseFloat(user.bbcBalance) + parseFloat(bbcMined)).toFixed(8);
        await storage.updateUserBalance(miningData.userId, user.coinBalance, newBbcBalance);
      }
      
      res.json({ bbcMined, activity });
    } catch (error) {
      res.status(500).json({ message: "Mining failed" });
    }
  });

  app.get("/api/user/:id/mining-stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const stats = await storage.getUserMiningStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get mining stats" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get system stats" });
    }
  });

  app.get("/api/admin/pending-deposits", async (req, res) => {
    try {
      const deposits = await storage.getPendingDeposits();
      res.json(deposits);
    } catch (error) {
      res.status(500).json({ message: "Failed to get pending deposits" });
    }
  });

  app.post("/api/admin/deposits/:id/approve", async (req, res) => {
    try {
      const depositId = parseInt(req.params.id);
      await storage.updateDepositStatus(depositId, "approved");
      res.json({ message: "Deposit approved" });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve deposit" });
    }
  });

  app.post("/api/admin/deposits/:id/reject", async (req, res) => {
    try {
      const depositId = parseInt(req.params.id);
      await storage.updateDepositStatus(depositId, "rejected");
      res.json({ message: "Deposit rejected" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject deposit" });
    }
  });

  app.post("/api/admin/users/:id/ban", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.updateUser(userId, { isBanned: true });
      res.json({ message: "User banned" });
    } catch (error) {
      res.status(500).json({ message: "Failed to ban user" });
    }
  });

  app.post("/api/admin/users/:id/unban", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.updateUser(userId, { isBanned: false });
      res.json({ message: "User unbanned" });
    } catch (error) {
      res.status(500).json({ message: "Failed to unban user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
