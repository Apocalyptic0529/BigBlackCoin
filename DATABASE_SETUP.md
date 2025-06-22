# BigBlackCoin Casino - Database Setup Guide

This guide will help you set up the PostgreSQL database for the BigBlackCoin Casino platform.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Neon or local)
- Environment variables configured

## Quick Setup

### 1. Environment Configuration

Create your environment variables in Replit Secrets or `.env` file:

```
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=your_host
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=your_database_name
```

### 2. Initialize Database Schema

Run the schema migration:

```bash
npm run db:push
```

This creates all necessary tables:
- `users` - User accounts and balances
- `game_results` - Game play history
- `deposits` - Deposit transactions
- `withdrawals` - Withdrawal requests
- `mining_activity` - BBC mining records

### 3. Create Demo Accounts

Run the setup script to create demo users:

```bash
node setup-database.js
```

This creates:
- **Admin Account**: username: `admin`, password: `admin1234`
- **Player Account**: username: `player1`, password: `password123`

## Manual Database Setup

If you prefer manual setup, execute these SQL commands:

### Create Admin User
```sql
INSERT INTO users (username, password, coin_balance, bbc_balance, is_admin, is_banned, created_at)
VALUES ('admin', 'admin1234', '999999.00', '999.00000000', true, false, NOW());
```

### Create Sample Player
```sql
INSERT INTO users (username, password, coin_balance, bbc_balance, is_admin, is_banned, created_at)
VALUES ('player1', 'password123', '12450.75', '2.35000000', false, false, NOW());
```

## Testing the Setup

1. Start the application:
   ```bash
   npm run dev
   ```

2. Open the application in your browser

3. Login with demo accounts:
   - Admin: `admin` / `admin1234`
   - Player: `player1` / `password123`

4. Test functionality:
   - Play casino games
   - Check wallet balances
   - Use admin dashboard (admin account only)
   - Try deposit/withdrawal features

## Troubleshooting

### Database Connection Issues

1. **WebSocket Error**: Ensure you have the correct WebSocket configuration
2. **Connection Timeout**: Check your database credentials and network
3. **Schema Errors**: Run `npm run db:push` to sync schema

### Common Issues

- **Login Failed**: Verify demo accounts exist in database
- **Balance Not Updating**: Check database permissions
- **Games Not Working**: Ensure all tables are created properly

### Reset Database

To completely reset the database:

```bash
# This will recreate all tables
npm run db:push

# Then run setup again
node setup-database.js
```

## Production Deployment

For production deployment:

1. Use a secure database connection string
2. Update default passwords
3. Set proper environment variables
4. Enable SSL connections

## Database Schema Overview

### Users Table
- Stores user accounts, balances, and permissions
- Tracks coin balance and BBC token balance
- Admin flags and ban status

### Game Results Table
- Records all game outcomes
- Tracks winnings and BBC rewards
- Links to user accounts

### Financial Tables
- Deposits: Tracks incoming payments
- Withdrawals: Manages payout requests
- Mining Activity: Records BBC token mining

The database uses PostgreSQL with Drizzle ORM for type-safe queries and automatic migrations.