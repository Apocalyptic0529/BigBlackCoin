
# BigBlackCoin Casino - Complete Local Testing Tutorial

This tutorial will guide you through testing the BigBlackCoin Casino platform from scratch, covering setup, testing scenarios, and troubleshooting.

## 🚀 Quick Start (5 Minutes)

### Step 1: Environment Setup
1. **Fork/Clone the project** in Replit
2. **Set up Database** - Click the Database tab in Replit and create a PostgreSQL database
3. **Initialize Database Schema**:
   ```bash
   npm run db:push
   ```
4. **Create Demo Users**:
   ```bash
   node setup-database.js
   ```
5. **Start the Application**:
   ```bash
   npm run dev
   ```

The app will be available at your Replit URL (port 5000).

## 📋 Complete Testing Checklist

### Authentication Testing

#### Test Demo Accounts
1. **Admin Login**
   - Username: `admin`
   - Password: `admin1234`
   - ✅ Should access admin dashboard
   - ✅ Should see admin-only features

2. **Player Login**
   - Username: `player1`
   - Password: `password123`
   - ✅ Should access player features
   - ✅ Starting balance: 12,450.75 coins, 2.35 $BBC

3. **Registration Test**
   - Create new account with unique username
   - ✅ Should get 1000.00 starting coins
   - ✅ Should redirect to main dashboard

### Game Testing Scenarios

#### 1. Luck and Roll (Spinning Wheel)
**Test Flow:**
```
1. Navigate to Games → Luck and Roll
2. Select bet amount (try 1.00 coins)
3. Click "ROLL THE DICE"
4. Wait for animation to complete
5. Check result and balance update
```

**Expected Outcomes:**
- 🎯 **Bankrupt (6/16 slices)**: Lose bet amount
- 🎯 **Multipliers (9/16 slices)**: Win bet × multiplier
- 🎯 **Jackpot (1/16 slice)**: Win $BBC tokens (0.05x bet amount)
- 🎯 **10% Bonus Chance**: Additional $BBC reward

**Test Cases:**
- [ ] Minimum bet (0.25 coins)
- [ ] Maximum bet (1000.00 coins)
- [ ] Insufficient balance (should show error)
- [ ] Multiple consecutive spins
- [ ] Verify balance updates correctly

#### 2. Flip it Jonathan! (Coin Flip)
**Test Flow:**
```
1. Navigate to Games → Flip it Jonathan!
2. Choose Heads or Tails
3. Place bet and click "FLIP COIN"
4. Watch coin animation
5. Check win/loss result
```

**Expected Mechanics:**
- 50/50 chance of winning
- Win = 2x bet amount
- Loss = lose bet amount
- $BBC rewards on higher bets

**Test Cases:**
- [ ] Test both Heads and Tails selection
- [ ] Verify 50/50 probability over multiple flips
- [ ] Check $BBC token rewards
- [ ] Test streak mechanics

#### 3. Paldo! (Slot Machine)
**Test Flow:**
```
1. Navigate to Games → Paldo!
2. Set bet amount
3. Click "SPIN"
4. Watch 5-reel animation
5. Check winning combinations
```

**Expected Features:**
- Wild symbols substitute for any symbol
- 3+ Scatter symbols trigger free spins
- Progressive jackpot on max bet + 5 scatters
- 8% chance for $BBC bonus

**Test Cases:**
- [ ] Regular symbol combinations
- [ ] Wild symbol substitutions
- [ ] Free spin triggers (3, 4, 5 scatters)
- [ ] Progressive jackpot conditions
- [ ] $BBC bonus rewards

#### 4. Ipis Sipi (Chase Game)
**Test Flow:**
```
1. Navigate to Games → Ipis Sipi
2. Place bet
3. Click "START CHASE"
4. Progress through 9 steps
5. Cash out or continue at each step
```

**Expected Mechanics:**
- 9 steps with increasing multipliers
- Decreasing survival chance per step
- Steps 7-9 reward $BBC tokens
- 6% chance for $BBC bonus on any cash out

**Test Cases:**
- [ ] Cash out at different steps
- [ ] Complete all 9 steps
- [ ] Verify multiplier progression
- [ ] Check $BBC rewards at steps 7-9
- [ ] Test survival probability

#### 5. Blow Joy Balloon (Balloon Pop)
**Test Flow:**
```
1. Navigate to Games → Blow Joy Balloon
2. Set bet amount
3. Click "START PUMPING"
4. Watch multiplier increase
5. Cash out before balloon pops
```

**Expected Features:**
- Multiplier increases over time
- 5% chance for bonus balloons
- Balloon can pop at any time
- 7% chance for $BBC bonus

**Test Cases:**
- [ ] Regular balloon inflation
- [ ] Bonus balloon mechanics
- [ ] Auto-cashout feature
- [ ] Different cash-out timings
- [ ] Pop mechanics and timing

### Wallet & Financial Testing

#### Balance Verification
```
Initial Player Balance:
- Coins: 12,450.75
- $BBC: 2.35000000

Test Operations:
1. Play games and verify balance changes
2. Check balance persistence after refresh
3. Verify negative balance prevention
```

#### Deposit Testing
**Test Flow:**
```
1. Go to Wallet → Deposit
2. Enter amount (100-50000 range)
3. Upload mock receipt
4. Submit request
5. Admin approval process
```

**Admin Approval:**
```
1. Login as admin
2. Go to Admin → Manage Deposits
3. Approve/reject deposit
4. Verify balance update
```

#### Withdrawal Testing
**Test Flow:**
```
1. Go to Wallet → Withdraw
2. Enter amount (min 100 coins)
3. Provide account details
4. Submit request
5. Admin review process
```

### Mining System Testing

#### $BBC Mining
**Test Flow:**
```
1. Navigate to Mining section
2. Click "MINE $BBC" multiple times
3. Check $BBC balance increase
4. Verify mining statistics
```

**Expected Mechanics:**
- Random $BBC rewards (0.001 to 0.01)
- Mining statistics tracking
- Balance updates in real-time

### Admin Dashboard Testing

#### User Management
**Test as Admin:**
```
1. Login as admin
2. Navigate to Admin tab
3. View all users list
4. Test user management features
```

**Admin Features:**
- [ ] View user list with balances
- [ ] Ban/unban users
- [ ] View system statistics
- [ ] Manage deposits/withdrawals
- [ ] View game results history

#### System Statistics
**Verify Display:**
- Total users count
- Total $BBC in circulation
- Recent game activity
- Financial summaries

## 🔧 Troubleshooting Common Issues

### Database Connection Errors

**Error: "All attempts to open a WebSocket failed"**
```bash
# Solution: Check DATABASE_URL in Secrets
# Ensure Replit PostgreSQL database is created
# Verify connection string format
```

**Error: "relation does not exist"**
```bash
# Solution: Recreate database schema
npm run db:push
node setup-database.js
```

### Game Loading Issues

**Games not starting or showing errors:**
1. Check browser console for JavaScript errors
2. Verify user is logged in
3. Check sufficient balance for bet
4. Refresh page and try again

**Balance not updating:**
1. Check database connection
2. Verify API responses in Network tab
3. Refresh user data
4. Check for pending transactions

### Authentication Problems

**Login failures:**
1. Verify demo accounts exist:
   ```sql
   SELECT username, password FROM users;
   ```
2. Check credentials match exactly
3. Clear browser cache/cookies
4. Re-run setup script if needed

## 📊 Performance Testing

### Load Testing
**Test concurrent users:**
1. Open multiple browser tabs
2. Login with different accounts
3. Play games simultaneously
4. Monitor performance

### Database Performance
**Check query performance:**
1. Monitor game response times
2. Check balance update speed
3. Verify large bet handling
4. Test with multiple concurrent games

## 🎯 Test Results Validation

### Game Fairness Testing
**Verify randomness:**
- Record 100+ game outcomes
- Check probability distributions
- Verify payout percentages
- Confirm $BBC distribution rates

### Financial Integrity
**Balance accuracy:**
- Starting balances match database
- Game outcomes reflect correctly
- $BBC rewards calculate properly
- No duplicate transactions

### Security Testing
**Basic security checks:**
- SQL injection prevention
- XSS protection
- Session management
- Role-based access control

## 🚨 Emergency Reset

**If testing breaks the app:**
```bash
# Reset database completely
npm run db:push
node setup-database.js

# Restart application
npm run dev
```

## 📝 Test Documentation

**Record your test results:**
- Game outcomes and patterns
- Balance changes and accuracy
- Performance observations
- Any bugs or issues found

**Report Issues:**
- Screenshot error messages
- Note reproduction steps
- Document expected vs actual behavior
- Check browser console for errors

## 🎉 Success Criteria

Your local testing is successful when:
- [ ] All 5 games function properly
- [ ] Balance updates work correctly
- [ ] $BBC rewards distribute properly
- [ ] Admin features accessible
- [ ] Deposit/withdrawal flows work
- [ ] Mining system functions
- [ ] No critical errors in console
- [ ] Performance is acceptable

## Next Steps

After successful local testing:
1. Deploy to production using Replit hosting
2. Set up production database with secure credentials
3. Configure proper environment variables
4. Test production deployment thoroughly
5. Monitor real user activity

This comprehensive testing ensures the BigBlackCoin Casino platform works reliably for all users!
