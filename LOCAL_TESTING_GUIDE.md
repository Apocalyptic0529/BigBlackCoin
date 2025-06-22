# BigBlackCoin Casino - Local Testing Guide

This guide provides step-by-step instructions for setting up and testing the BigBlackCoin Casino platform locally.

## Prerequisites Installation

1. **Node.js 18+**
   ```bash
   # Check your version
   node --version
   npm --version
   ```

2. **Git**
   ```bash
   git --version
   ```

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd bigblackcoin-casino

# Install dependencies
npm install
```

### 2. Database Setup

#### Option A: Using Neon (Recommended)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string
4. Set up your environment variables (see below)

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database: `createdb bigblackcoin_casino`
3. Use local connection string: `postgresql://username:password@localhost:5432/bigblackcoin_casino`

### 3. Environment Configuration

Create environment variables in Replit Secrets or create a `.env` file:

```bash
# Required Database Settings
DATABASE_URL=postgresql://username:password@host:port/database

# Optional Settings
NODE_ENV=development
PORT=5000
SESSION_SECRET=your-secret-key-here
```

### 4. Initialize Database

```bash
# Create database tables
npm run db:push

# Create demo users
node setup-database.js
```

Expected output:
```
🚀 Setting up BigBlackCoin Casino database...
✅ Admin user created: { id: 1, username: 'admin' }
✅ Sample player created: { id: 2, username: 'player1' }
🎯 Database setup complete!
```

### 5. Start the Application

```bash
# Development mode
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api

## Testing Checklist

### Basic Functionality Tests

#### 1. Authentication Testing
- [ ] Login with admin account: `admin` / `admin1234`
- [ ] Login with player account: `player1` / `password123`
- [ ] Verify proper user role permissions
- [ ] Test logout functionality

#### 2. Game Testing
Test each game with different bet amounts:

**Luck and Roll (Spinning Wheel)**
- [ ] Select bet amount (0.25 to 1000.00)
- [ ] Click "Roll the Dice"
- [ ] Verify animation plays
- [ ] Check win/loss calculation
- [ ] Confirm balance updates

**Flip it Jonathan! (Coin Flip)**
- [ ] Choose Heads or Tails
- [ ] Place bet and flip
- [ ] Verify coin animation
- [ ] Check 50/50 odds working
- [ ] Confirm BBC token rewards

**Paldo! (Color Wheel)**
- [ ] Select color prediction
- [ ] Spin the wheel
- [ ] Verify multiplier calculation
- [ ] Check jackpot mechanics
- [ ] Test multiple rounds

**Ipis Sipi (Chase Game)**
- [ ] Start the chase sequence
- [ ] Verify timing mechanics
- [ ] Check capture/escape logic
- [ ] Test different outcomes
- [ ] Confirm BBC rewards

**Blow Joy Balloon (Balloon Pop)**
- [ ] Start balloon pumping
- [ ] Test cash-out timing
- [ ] Verify multiplier growth
- [ ] Check pop mechanics
- [ ] Test auto-cashout feature

#### 3. Wallet Testing
- [ ] Check starting balances
- [ ] Verify coin balance updates after games
- [ ] Test BBC token accumulation
- [ ] Check balance display accuracy
- [ ] Test negative balance prevention

#### 4. Mining System Testing
- [ ] Access mining section
- [ ] Click mining button multiple times
- [ ] Verify BBC generation
- [ ] Check mining statistics
- [ ] Test daily limits (if implemented)

#### 5. Deposit/Withdrawal Testing
**Deposits**
- [ ] Submit deposit request
- [ ] Upload receipt (mock)
- [ ] Check pending status
- [ ] Test admin approval process
- [ ] Verify balance update

**Withdrawals**
- [ ] Request withdrawal
- [ ] Verify minimum amount check
- [ ] Test account details validation
- [ ] Check admin review process
- [ ] Test status updates

#### 6. Admin Dashboard Testing
Login as admin and test:
- [ ] View all users list
- [ ] Check system statistics
- [ ] Process pending deposits
- [ ] Handle withdrawal requests
- [ ] View recent game results
- [ ] Access user management

### Performance Testing

#### 1. Load Testing
- [ ] Multiple concurrent users
- [ ] Rapid game plays
- [ ] Database connection stability
- [ ] Memory usage monitoring

#### 2. Game Integrity Testing
- [ ] Verify random number generation
- [ ] Check for consistent odds
- [ ] Test edge cases (zero balance, max bet)
- [ ] Validate win/loss calculations
- [ ] Confirm BBC token distribution

### Security Testing

#### 1. Authentication Security
- [ ] Test invalid credentials
- [ ] Check session timeout
- [ ] Verify role-based access
- [ ] Test SQL injection protection
- [ ] Check XSS prevention

#### 2. Financial Security
- [ ] Negative balance prevention
- [ ] Bet amount validation
- [ ] Double-spending protection
- [ ] Balance synchronization
- [ ] Transaction logging

## Troubleshooting Common Issues

### Database Connection Problems

**Error: "All attempts to open a WebSocket failed"**
```bash
# Solution: Check your DATABASE_URL format
# Ensure it includes proper credentials and host
```

**Error: "relation does not exist"**
```bash
# Solution: Run database migration
npm run db:push
```

### Game Not Loading

**Error: "Failed to refresh user data"**
```bash
# Check if user exists in database
# Verify session is valid
# Restart the application
```

### Balance Not Updating

**Check these areas:**
1. Database transaction completion
2. Frontend state synchronization
3. API response handling
4. User session validity

### Development Tips

#### 1. Database Inspection
```bash
# Connect to your database directly
psql $DATABASE_URL

# Check user balances
SELECT username, coin_balance, bbc_balance FROM users;

# View recent games
SELECT * FROM game_results ORDER BY created_at DESC LIMIT 10;
```

#### 2. Debug Logging
Enable detailed logging by setting:
```bash
NODE_ENV=development
```

#### 3. Reset Test Data
```bash
# Clear all game results
# Re-run setup script
node setup-database.js
```

## Production Deployment Testing

Before deploying to production:

1. **Environment Variables**
   - [ ] Secure DATABASE_URL
   - [ ] Strong SESSION_SECRET
   - [ ] Proper NODE_ENV=production

2. **Security Checklist**
   - [ ] HTTPS enabled
   - [ ] Database SSL connections
   - [ ] Rate limiting configured
   - [ ] Input validation active

3. **Performance Verification**
   - [ ] Database query optimization
   - [ ] Frontend asset compression
   - [ ] CDN configuration
   - [ ] Caching strategies

## Support and Resources

- **Database Schema**: Check `shared/schema.ts`
- **API Endpoints**: Review `server/routes.ts`
- **Game Logic**: Located in `client/src/components/games/`
- **Setup Scripts**: `setup-database.js`
- **Configuration**: `drizzle.config.ts`

For issues or questions, refer to the main documentation or contact the development team.